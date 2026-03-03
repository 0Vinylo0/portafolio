// ===================================
// RETRO SYNTHWAVE BG (Canvas 2D) - CONSTANT + "3D" LOW-POLY PROPS
// - Constant forward motion (no random pops): deterministic wrap in Z
// - Mountains/Rocks: extruded low-poly prisms (fake 3D) with shading
// - Clouds: slow parallax
// - FX toggle + prefers-reduced-motion
// ===================================
(() => {
  const CANVAS_ID = "retro-bg";
  const TOGGLE_ID = "fx-toggle";
  const STORAGE_KEY = "retroFxEnabled";
  const prefersReduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)");

  const state = {
    enabled: true,
    running: false,
    raf: 0,
    lastT: 0,
    cssFlickerAcc: 0,

    // IMPORTANT: desactivado por defecto para evitar “saltos” visuales
    adaptiveQuality: false,

    quality: 0, // 0 low, 1 mid, 2 high (puedes cambiar con __retroFX.quality(n))

    params: {
      speed: 22,

      starCount: 140,
      cloudCount: 12,

      // Ahora sidePropCount = número de “prismas” (montaña/roca) por ambos lados
      sidePropCount: 160,

      gridSpacing: 1.4,
      gridLines: 34,

      glow: 0.45,
      flicker: 0.03,
      horizon: 0.42,

      cloudSpeed: 3.5,
      cloudHeightMin: 0.10,
      cloudHeightMax: 0.50,

      // Rango de profundidad para props (wrap determinista)
      zMin: 10,
      zMax: 150,

      // “3D” thickness (profundidad extrusión) en unidades de mundo
      thicknessMin: 2.0,
      thicknessMax: 5.0,

      // proporción roca/montaña (0..1 = prob de mountain)
      mountainProb: 0.72,
    },

    // buffers
    stars: [],
    clouds: [],
    props: [],

    // render scaling
    renderScale: 0.7, // como te fue bien en low
    dpr: 1,
    w: 0,
    h: 0,
    cx: 0,
    cy: 0,

    // camera/projection
    cam: {
      fovScale: 0.62,   // similar al anterior
      near: 0.35,
      yaw: 0.0,         // reservado por si luego quieres “lean”
    },
  };

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function rand(a, b) { return a + Math.random() * (b - a); }
  function randi(a, b) { return (a + Math.floor(Math.random() * (b - a + 1))); }
  function $(id) { return document.getElementById(id); }

  function mulberry32(a) {
    return function() {
      let t = (a += 0x6D2B79F5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function shouldEnableByDefault() {
    if (prefersReduced?.matches) return false;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "0") return false;
      if (saved === "1") return true;
    } catch (_) {}
    return true;
  }

  function setFxEnabled(on) {
    state.enabled = !!on;
    document.body.classList.toggle("fx-off", !state.enabled);

    const btn = $(TOGGLE_ID);
    if (btn) {
      btn.setAttribute("aria-pressed", String(state.enabled));
      btn.textContent = state.enabled ? "✨ FX ON" : "✨ FX OFF";
    }

    try { localStorage.setItem(STORAGE_KEY, state.enabled ? "1" : "0"); } catch (_) {}

    if (state.enabled && !prefersReduced?.matches) start();
    else stop();
  }

  function setQuality(q) {
    state.quality = clamp(q|0, 0, 2);
    state.renderScale = state.quality === 2 ? 1.0 : state.quality === 1 ? 0.85 : 0.7;
    initAll(true);
  }

  function resize(canvas) {
    const rawDpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    state.dpr = rawDpr * state.renderScale;

    state.w = Math.max(1, window.innerWidth);
    state.h = Math.max(1, window.innerHeight);
    state.cx = state.w * 0.5;
    state.cy = state.h * clamp(state.params.horizon, 0.15, 0.75);

    canvas.width = Math.floor(state.w * state.dpr);
    canvas.height = Math.floor(state.h * state.dpr);
    canvas.style.width = state.w + "px";
    canvas.style.height = state.h + "px";

    const ctx = canvas.getContext("2d", { alpha: false });
    ctx.imageSmoothingEnabled = true;
  }

  // ===== Projection: world (x,y,z) -> screen (sx,sy,k) =====
  function project3D(x, y, z) {
    const zc = Math.max(state.cam.near, z);
    const k = 1.0 / zc;
    const scale = Math.min(state.w, state.h) * state.cam.fovScale;
    return {
      sx: state.cx + x * k * scale,
      sy: state.cy + y * k * scale,
      k
    };
  }

  // ===== Init Stars =====
  function initStars() {
    const base = state.params.starCount;
    const count = state.quality === 2 ? base : state.quality === 1 ? Math.floor(base * 0.75) : Math.floor(base * 0.55);
    state.stars.length = 0;

    for (let i = 0; i < count; i++) {
      state.stars.push({
        x: rand(-1, 1),
        y: rand(-1, 1),
        z: rand(0.05, 1.0),
        s: rand(0.2, 1.4),
        tw: rand(0, Math.PI * 2),
        v: rand(0.02, 0.08),
      });
    }
  }

  // ===== Clouds =====
  function makeCloudShape(seed, lumps = 6) {
    const rng = mulberry32(Math.floor(seed * 1e9) ^ 0xA5A5A5);
    const pts = [];
    for (let i = 0; i < lumps; i++) {
      pts.push({
        ox: (rng() * 2 - 1) * 0.55,
        oy: (rng() * 2 - 1) * 0.25,
        r: 0.25 + rng() * 0.45,
      });
    }
    return pts;
  }

  function initClouds() {
    const base = state.params.cloudCount;
    const count = state.quality === 2 ? base : state.quality === 1 ? Math.floor(base * 0.75) : Math.floor(base * 0.6);
    state.clouds.length = 0;

    for (let i = 0; i < count; i++) {
      const z = rand(0.25, 1.0);
      const yFrac = rand(state.params.cloudHeightMin, state.params.cloudHeightMax);
      const tint = Math.random() < 0.5 ? "cyan" : "magenta";
      const seed = Math.random();
      state.clouds.push({
        x: rand(-0.2, 1.2) * state.w,
        y: yFrac * state.h,
        z,
        s: rand(0.65, 1.65),
        v: rand(0.6, 1.25),
        tint,
        shape: makeCloudShape(seed, randi(5, 8)),
        wob: rand(0, Math.PI * 2),
      });
    }
  }

  // ===== Low-poly profile (ridge) =====
  function makeRidge(seed, pointCount = 7) {
    const rng = mulberry32(Math.floor(seed * 1e9) ^ 0xC0FFEE);
    const arr = new Array(pointCount);
    let v = rng();
    for (let i = 0; i < pointCount; i++) {
      v = clamp(v + (rng() * 0.6 - 0.3), 0, 1);
      arr[i] = v;
    }
    return arr;
  }

  // ===== Props: extruded prisms =====
  // Un prop tiene:
  // - world position: x, z
  // - shape in local XY: ridge points -> polygon
  // - thickness: extrude along +z (back face)
  function initProps() {
    const base = state.params.sidePropCount;
    const count = state.quality === 2 ? base : state.quality === 1 ? Math.floor(base * 0.78) : Math.floor(base * 0.65);

    const zMin = state.params.zMin;
    const zMax = state.params.zMax;
    const zRange = zMax - zMin;

    state.props.length = 0;
    const half = Math.floor(count / 2);

    // Para que el wrap sea “constante” y sin pops raros:
    // distribuimos z uniformemente (no random) y mantenemos su “identidad” (seed) fija.
    function makeProp(side, idx, totalPerSide) {
      const t = (idx / Math.max(1, totalPerSide - 1));
      const z = zMin + t * zRange;

      const isMountain = Math.random() < state.params.mountainProb;
      const type = isMountain ? "mountain" : "rock";

      const lane = type === "mountain" ? rand(9.5, 19.0) : rand(7.5, 14.0);
      const jitter = rand(-1.1, 1.1);
      const x = side * (lane + jitter);

      const h = type === "mountain" ? rand(2.2, 6.2) : rand(0.9, 2.4);
      const w = type === "mountain" ? rand(2.6, 6.4) : rand(1.2, 2.8);

      const thickness = rand(state.params.thicknessMin, state.params.thicknessMax);

      const tint = Math.random() < 0.5 ? "cyan" : "magenta";
      const seed = Math.random();
      const ridge = makeRidge(seed, type === "mountain" ? randi(6, 9) : randi(5, 7));

      return {
        side, type,
        x, z,
        w, h,
        thickness,
        tint,
        seed,
        ridge,
      };
    }

    for (let i = 0; i < half; i++) state.props.push(makeProp(-1, i, half));
    for (let i = 0; i < (count - half); i++) state.props.push(makeProp(1, i, (count - half)));
  }

  function initAll(resizeToo = false) {
    const canvas = $(CANVAS_ID);
    if (canvas && resizeToo) resize(canvas);
    initStars();
    initClouds();
    initProps();
  }

  // ===== Draw helpers =====
  function poly(ctx, pts) {
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.closePath();
  }

  function drawBackground(ctx) {
    ctx.save();
    ctx.globalCompositeOperation = "source-over";

    const g = ctx.createLinearGradient(0, 0, 0, state.h);
    g.addColorStop(0, "rgba(6, 4, 18, 1)");
    g.addColorStop(0.55, "rgba(10, 6, 28, 1)");
    g.addColorStop(1, "rgba(1, 0, 6, 1)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, state.w, state.h);

    const glow = ctx.createRadialGradient(state.cx, state.h * 0.88, 0, state.cx, state.h * 0.88, Math.min(state.w, state.h) * 0.78);
    glow.addColorStop(0, "rgba(255, 0, 200, 0.10)");
    glow.addColorStop(0.55, "rgba(0, 255, 210, 0.05)");
    glow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, state.w, state.h);

    ctx.restore();
  }

  function drawStars(ctx, dt) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = 0.9;

    for (const s of state.stars) {
      s.tw += s.v * dt;
      s.y += Math.sin(s.tw) * 0.00035 * dt;
      s.x += Math.cos(s.tw * 0.7) * 0.00025 * dt;

      if (s.x < -1.15) s.x = 1.15;
      if (s.x > 1.15) s.x = -1.15;
      if (s.y < -1.15) s.y = 1.15;
      if (s.y > 1.15) s.y = -1.15;

      const px = (s.x * 0.5 + 0.5) * state.w;
      const py = (s.y * 0.5 + 0.5) * state.h * 0.9;
      const r = s.s * (0.65 + (1.0 - s.z) * 0.9);

      const t = (Math.sin(s.tw * 1.7) + 1) * 0.5;
      ctx.fillStyle = t < 0.5 ? "rgba(0, 255, 215, 0.65)" : "rgba(255, 0, 210, 0.60)";
      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  function drawClouds(ctx, dt) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";

    const baseSpeed = state.params.cloudSpeed;
    const topFade = state.h * 0.06;

    for (const c of state.clouds) {
      c.wob += dt * 0.35;
      const drift = Math.cos(c.wob) * 0.25;

      c.x += (baseSpeed * c.v * (0.35 + c.z)) * dt + drift;
      if (c.x > state.w + 260) c.x = -260;

      const alpha = clamp(0.06 + c.z * 0.09, 0.05, 0.18);
      const size = (140 + c.z * 220) * c.s;

      const col = c.tint === "cyan"
        ? { edge: "rgba(0,255,215,0.24)", fill: "rgba(0,255,215,0.06)" }
        : { edge: "rgba(255,0,210,0.24)", fill: "rgba(255,0,210,0.06)" };

      const blur = state.quality === 2 ? 10 * state.params.glow : state.quality === 1 ? 6 * state.params.glow : 0;
      ctx.shadowBlur = blur;
      ctx.shadowColor = col.edge;

      let a = alpha;
      if (c.y < topFade) a *= clamp(c.y / topFade, 0, 1);

      ctx.globalAlpha = a;
      ctx.fillStyle = col.fill;
      ctx.strokeStyle = col.edge;
      ctx.lineWidth = 1;

      ctx.beginPath();
      for (const p of c.shape) {
        const px = c.x + p.ox * size;
        const py = c.y + p.oy * size * 0.7;
        const rr = p.r * size * 0.55;
        ctx.moveTo(px + rr, py);
        ctx.arc(px, py, rr, 0, Math.PI * 2);
      }
      ctx.fill();

      ctx.globalAlpha = a * 0.5;
      ctx.stroke();
    }

    ctx.shadowBlur = 0;
    ctx.restore();
  }

  function drawGrid(ctx, dt) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";

    const horizonY = state.cy;
    const bottomY = state.h;
    const gridDepth = 90;

    const spacing = state.params.gridSpacing;
    const lines = state.params.gridLines;

    // movimiento continuo (wrap por modulo)
    state._gridZ = (state._gridZ || 0) + state.params.speed * dt;

    ctx.lineWidth = 1;

    const blur = (state.quality === 2 ? 9 : state.quality === 1 ? 5 : 0) * state.params.glow;
    ctx.shadowBlur = blur;
    ctx.shadowColor = "rgba(0, 255, 215, 0.28)";

    for (let i = -Math.floor(lines / 2); i <= Math.floor(lines / 2); i++) {
      const x = i * spacing;
      const p0 = project3D(x, 0, 1.2);
      const p1 = project3D(x, 0, gridDepth);
      ctx.strokeStyle = i === 0 ? "rgba(255,0,210,0.28)" : "rgba(0,255,215,0.19)";
      ctx.beginPath();
      ctx.moveTo(p0.sx, bottomY);
      ctx.lineTo(p1.sx, horizonY);
      ctx.stroke();
    }

    const zStep = 1.8;
    const bands = 10;
    const loop = zStep * bands;

    const count = Math.floor(gridDepth / zStep);
    for (let j = 0; j < count; j++) {
      // z base + offset animado por modulo (sin saltos)
      const zBase = 1.3 + j * zStep;
      const z = 1.3 + ((zBase + state._gridZ * 0.055) % loop) + Math.floor(zBase / loop) * loop;

      const left = project3D(-lines * spacing * 0.55, 0, z);
      const right = project3D(lines * spacing * 0.55, 0, z);

      const alpha = clamp(1.0 - z / gridDepth, 0, 1);
      ctx.strokeStyle = `rgba(0,255,215,${0.04 + alpha * 0.26})`;
      ctx.beginPath();
      ctx.moveTo(left.sx, left.sy);
      ctx.lineTo(right.sx, right.sy);
      ctx.stroke();
    }

    ctx.shadowBlur = 0;

    const sun = ctx.createRadialGradient(state.cx, horizonY, 0, state.cx, horizonY, Math.min(state.w, state.h) * 0.32);
    sun.addColorStop(0, "rgba(255,0,210,0.13)");
    sun.addColorStop(0.5, "rgba(0,255,215,0.05)");
    sun.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = sun;
    ctx.fillRect(0, 0, state.w, state.h);

    ctx.restore();
  }

  // ===== 3D prism drawing =====
  // construye el polígono frontal (en mundo) y el trasero (z + thickness),
  // proyecta y pinta caras con shading.
  function drawPrism(ctx, prop) {
    const { x, z, w, h, thickness, ridge, tint, type } = prop;

    // baseY: lo empujamos un poco hacia abajo para “anclar” al suelo
    const baseY = 0.0; // y=0 es “suelo” en nuestro mundo

    // construir puntos del ridge (frente) en coordenadas mundo:
    // el ridge define la altura relativa del perfil
    const n = ridge.length;
    const front = [];
    const back = [];

    const halfW = w * 0.52;
    const baseHeight = type === "mountain" ? 0.45 : 0.25;
    const amp = type === "mountain" ? 0.85 : 0.95;

    for (let i = 0; i < n; i++) {
      const t = i / (n - 1);
      const px = x + (t - 0.5) * (halfW * 2);
      const py = baseY + (h * (baseHeight + ridge[i] * amp)); // altura en “mundo”
      // ojo: en pantalla, y positivo debería ir hacia arriba -> lo invertimos en proyección
      front.push({ x: px, y: py, z: z });
      back.push({ x: px, y: py, z: z + thickness });
    }

    // añadir base corners para cerrar el polígono al suelo
    const baseL = { x: x - halfW, y: baseY, z };
    const baseR = { x: x + halfW, y: baseY, z };
    const baseL2 = { x: x - halfW, y: baseY, z: z + thickness };
    const baseR2 = { x: x + halfW, y: baseY, z: z + thickness };

    // Proyección a pantalla (nota: y en mundo hacia arriba => -y al proyectar)
    function P(v) {
      const pr = project3D(v.x, -v.y, v.z);
      // empuje vertical extra para “suelo” (igual que antes, un poco)
      return [pr.sx, pr.sy + (state.h * 0.14) * pr.k, pr.k, v.z];
    }

    const col = tint === "cyan"
      ? { edge: "rgba(0,255,215,0.55)", fill: "rgba(0,255,215,0.045)" }
      : { edge: "rgba(255,0,210,0.55)", fill: "rgba(255,0,210,0.045)" };

    // blur solo cerca
    const kNear = project3D(x, 0, z).k;
    const near = kNear > 0.075;
    const blur = (state.quality === 2 && near) ? (9 * state.params.glow) : (state.quality === 1 && near ? (4 * state.params.glow) : 0);

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.shadowBlur = blur;
    ctx.shadowColor = col.edge;
    ctx.lineWidth = 1;

    // --- caras (painter’s algorithm sencillo) ---
    // definimos caras: front, side, top-ish (ridge to ridge), and back hint
    // shading: front brighter, side darker, back faint
    const faceFront = [
      P(baseL), ...front.map(P), P(baseR)
    ];

    const faceBack = [
      P(baseL2), ...back.map(P), P(baseR2)
    ];

    // lado exterior (depende del side: izq o der)
    // elegimos el “lado” que da al exterior: el más alejado del centro
    const sideIdx = prop.side < 0 ? 0 : (n - 1);
    const vF = front[sideIdx];
    const vB = back[sideIdx];
    const vFbase = prop.side < 0 ? baseL : baseR;
    const vBbase = prop.side < 0 ? baseL2 : baseR2;

    const faceSide = [
      P(vFbase),
      P(vBbase),
      P(vB),
      P(vF),
    ];

    // “techo” (cresta) conectando front ridge con back ridge (solo 4-5 tiras baratas)
    const topStrips = [];
    const strips = Math.min(5, n - 1);
    const step = Math.max(1, Math.floor((n - 1) / strips));
    for (let i = 0; i < n - 1; i += step) {
      const aF = front[i];
      const bF = front[Math.min(n - 1, i + step)];
      const aB = back[i];
      const bB = back[Math.min(n - 1, i + step)];
      topStrips.push([P(aF), P(bF), P(bB), P(aB)]);
    }

    // Pintar: back (muy suave) -> top -> side -> front
    // BACK
    ctx.globalAlpha = 0.12;
    ctx.fillStyle = "rgba(255,255,255,0.01)";
    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    poly(ctx, faceBack.map(p => [p[0], p[1]]));
    ctx.fill();
    ctx.stroke();

    // TOP
    ctx.globalAlpha = 0.22;
    ctx.fillStyle = col.fill;
    ctx.strokeStyle = col.edge;
    for (const strip of topStrips) {
      poly(ctx, strip.map(p => [p[0], p[1]]));
      ctx.fill();
      ctx.globalAlpha = 0.16;
      ctx.stroke();
      ctx.globalAlpha = 0.22;
    }

    // SIDE (darker)
    ctx.globalAlpha = 0.26;
    ctx.fillStyle = "rgba(0,0,0,0.08)";
    ctx.strokeStyle = col.edge;
    poly(ctx, faceSide.map(p => [p[0], p[1]]));
    ctx.fill();
    ctx.globalAlpha = 0.18;
    ctx.stroke();

    // FRONT (bright)
    ctx.globalAlpha = 0.30;
    ctx.fillStyle = col.fill;
    ctx.strokeStyle = col.edge;
    poly(ctx, faceFront.map(p => [p[0], p[1]]));
    ctx.fill();
    ctx.globalAlpha = 0.22;
    ctx.stroke();

    ctx.restore();
  }

  function drawProps(ctx, dt) {
    const zMin = state.params.zMin;
    const zMax = state.params.zMax;
    const zRange = zMax - zMin;

    // movimiento CONSTANTE: z disminuye siempre; si pasa zMin, wrap sumando zRange
    for (const p of state.props) {
      p.z -= state.params.speed * dt;
      if (p.z < zMin) p.z += zRange;
    }

    // ordenar por z (lejos->cerca) para pintar bien las caras (painter)
    state.props.sort((a, b) => (b.z - a.z));

    ctx.save();
    // alpha por distancia (suave)
    for (const p of state.props) {
      const distAlpha = clamp(1.0 - (p.z - zMin) / zRange, 0.0, 1.0);
      ctx.globalAlpha = 0.12 + distAlpha * 0.85;

      const pr = project3D(p.x, 0, p.z);
      if (pr.sx < -320 || pr.sx > state.w + 320) continue;

      drawPrism(ctx, p);
    }
    ctx.restore();
  }

  function render(ts) {
    if (!state.running) return;

    const canvas = $(CANVAS_ID);
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });

    const t = ts || performance.now();
    const dt = state.lastT ? clamp((t - state.lastT) / 1000, 0, 0.05) : 0.016;
    state.lastT = t;

    // flicker CSS (throttled)
    state.cssFlickerAcc += dt;
    if (state.enabled && state.cssFlickerAcc > 0.08) {
      state.cssFlickerAcc = 0;
      const flick = state.params.flicker;
      const v = 1 - flick + Math.random() * flick * 2;
      document.documentElement.style.setProperty("--fx-flicker", v.toFixed(3));
    }

    ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
    ctx.clearRect(0, 0, state.w, state.h);

    drawBackground(ctx);
    drawStars(ctx, dt);
    drawClouds(ctx, dt);
    drawGrid(ctx, dt);
    drawProps(ctx, dt);

    state.raf = requestAnimationFrame(render);
  }

  function start() {
    const canvas = $(CANVAS_ID);
    if (!canvas) return;
    if (state.running) return;
    state.running = true;
    state.lastT = 0;
    state.raf = requestAnimationFrame(render);
  }

  function stop() {
    if (!state.running) return;
    state.running = false;
    if (state.raf) cancelAnimationFrame(state.raf);
    state.raf = 0;
    state.lastT = 0;
  }

  function bindUI() {
    const btn = $(TOGGLE_ID);
    if (btn) btn.addEventListener("click", () => setFxEnabled(!state.enabled));

    prefersReduced?.addEventListener?.("change", () => {
      if (prefersReduced.matches) setFxEnabled(false);
      else setFxEnabled(shouldEnableByDefault());
    });
  }

  function init() {
    const canvas = $(CANVAS_ID);
    if (!canvas) return;

    // arrancamos en low (como tu preset bueno)
    setQuality(0);

    resize(canvas);
    initAll(false);

    window.addEventListener("resize", () => resize(canvas), { passive: true });
    bindUI();
    setFxEnabled(shouldEnableByDefault());

    window.__retroFX = {
      state,
      setEnabled: setFxEnabled,
      tune: (patch) => Object.assign(state.params, patch || {}),
      regen: () => initAll(false),
      quality: (q) => setQuality(q),
    };
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();