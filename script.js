// ═══════════════════════════════════════════
//  VINYLOOS 96 — main script
// ═══════════════════════════════════════════

// ── FX State ──
let fxEnabled = localStorage.getItem('vinylo-fx') !== 'false';
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (prefersReduced) fxEnabled = false;

// ── Helpers ──
const $ = id => document.getElementById(id);

// ── Clock ──
function updateClock() {
  const now = new Date();
  const t = [now.getHours(), now.getMinutes(), now.getSeconds()]
    .map(n => String(n).padStart(2,'0')).join(':');
  $('clock').textContent = t;
  $('skills-time') && ($('skills-time').textContent = t);
}
setInterval(updateClock, 1000);
updateClock();

// ── FX Toggle ──
function applyFX() {
  $('crt-overlay').classList.toggle('off', !fxEnabled);
  $('bg-canvas').classList.toggle('off', !fxEnabled);
  $('fx-btn').textContent = fxEnabled ? 'FX ON' : 'FX OFF';
  $('fx-btn').classList.toggle('off', !fxEnabled);
}
function toggleFX() {
  fxEnabled = !fxEnabled;
  localStorage.setItem('vinylo-fx', fxEnabled);
  applyFX();
}
applyFX();

// ── Cookie Banner ──
function showCookies() {
  if (!localStorage.getItem('vinylo-cookies')) {
    setTimeout(() => $('cookie-banner').classList.add('visible'), 3000);
  }
}
function acceptCookies() {
  localStorage.setItem('vinylo-cookies','accepted');
  $('cookie-banner').classList.remove('visible');
}
function denyCookies() {
  localStorage.setItem('vinylo-cookies','denied');
  $('cookie-banner').classList.remove('visible');
}

// ── Start Menu ──
function toggleStartMenu() {
  $('start-menu').classList.toggle('visible');
}
document.addEventListener('click', e => {
  if (!e.target.closest('#start-menu') && !e.target.closest('#start-btn')) {
    $('start-menu').classList.remove('visible');
  }
});

// ── Window Manager ──
let zTop = 200;
const windows = {};

function initWin(id) {
  const el = $(`win-${id}`);
  if (!el) return;
  windows[id] = { el, visible: false, minimized: false };
}

['terminal','about','projects','skills','linux','clab','concurrency','network','contact','legal']
  .forEach(initWin);

function normalizeId(id) {
  return id.startsWith('win-') ? id.slice(4) : id;
}

function openWin(id) {
  id = normalizeId(id);
  const w = windows[id];
  if (!w) return;
  w.el.classList.add('visible');
  w.visible = true;
  w.minimized = false;
  focusWin(id);
  updateTaskbar();
  if (id === 'skills') animateSkills();
  $('start-menu').classList.remove('visible');
}

function closeWin(id) {
  id = normalizeId(id);
  const w = windows[id];
  if (!w) return;
  w.el.classList.remove('visible');
  w.el.classList.remove('focused');
  w.visible = false;
  updateTaskbar();
}

function minWin(id) {
  id = normalizeId(id);
  const w = windows[id];
  if (!w) return;
  w.el.classList.remove('visible');
  w.minimized = true;
  w.el.classList.remove('focused');
  updateTaskbar();
}

function maxWin(id) {
  id = normalizeId(id);
  const w = windows[id];
  if (!w) return;
  const el = w.el;
  if (el.dataset.maximized === '1') {
    el.style.left = el.dataset.ox || '160px';
    el.style.top = el.dataset.oy || '80px';
    el.style.width = el.dataset.ow || '';
    el.style.height = el.dataset.oh || '';
    el.dataset.maximized = '0';
  } else {
    el.dataset.ox = el.style.left;
    el.dataset.oy = el.style.top;
    el.dataset.ow = el.style.width;
    el.dataset.oh = el.style.height;
    el.style.left = '0'; el.style.top = '0';
    el.style.width = '100%';
    el.style.height = `calc(100vh - ${getComputedStyle(document.documentElement).getPropertyValue('--taskbar-h')})`;
    el.dataset.maximized = '1';
  }
}

function focusWin(id) {
  id = normalizeId(id);
  Object.values(windows).forEach(w => w.el.classList.remove('focused'));
  const w = windows[id];
  if (w) {
    zTop++;
    w.el.style.zIndex = zTop;
    w.el.classList.add('focused');
  }
}

// Click to focus
Object.keys(windows).forEach(id => {
  const el = $(`win-${id}`);
  if (el) el.addEventListener('mousedown', () => focusWin(id));
});

// ── Taskbar ──
function updateTaskbar() {
  const bar = $('taskbar-apps');
  bar.innerHTML = '';
  Object.entries(windows).forEach(([id, w]) => {
    if (!w.visible && !w.minimized) return;
    const btn = document.createElement('button');
    btn.className = 'taskbar-btn' + (w.visible && !w.minimized ? ' active' : '');
    btn.textContent = getWinLabel(id);
    btn.onclick = () => {
      if (w.minimized || !w.visible) { openWin(id); }
      else if (w.el.classList.contains('focused')) { minWin(id); }
      else { w.el.classList.add('visible'); focusWin(id); }
    };
    bar.appendChild(btn);
  });
}

function getWinLabel(id) {
  const labels = {
    terminal: '⬛ Terminal', about: '👤 About', projects: '📁 Projects',
    skills: '📊 SysMon', linux: '🐧 Linux', clab: '⚙️ C Lab',
    concurrency: '🔀 Concurrency', network: '🌐 Network',
    contact: '📡 Contact', legal: '📄 Legal'
  };
  return labels[id] || id;
}

// ── Drag ──
function startDrag(e, id) {
  if (e.button !== 0) return;
  focusWin(id.replace('win-',''));
  const el = $(id);
  const startX = e.clientX - el.offsetLeft;
  const startY = e.clientY - el.offsetTop;
  const desktop = $('desktop');
  const dw = desktop.offsetWidth, dh = desktop.offsetHeight;

  function onMove(e2) {
    let nx = e2.clientX - startX;
    let ny = e2.clientY - startY;
    nx = Math.max(0, Math.min(nx, dw - el.offsetWidth));
    ny = Math.max(0, Math.min(ny, dh - el.offsetHeight));
    el.style.left = nx + 'px';
    el.style.top = ny + 'px';
  }
  function onUp() {
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onUp);
  }
  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup', onUp);
}

// ── Resize ──
function startResize(e, id) {
  e.preventDefault(); e.stopPropagation();
  const el = $(id);
  const sx = e.clientX, sy = e.clientY;
  const sw = el.offsetWidth, sh = el.offsetHeight;
  function onMove(e2) {
    el.style.width = Math.max(320, sw + e2.clientX - sx) + 'px';
    el.style.height = Math.max(200, sh + e2.clientY - sy) + 'px';
  }
  function onUp() {
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onUp);
  }
  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup', onUp);
}

// ── Skills Animation ──
const skills = [
  { name: 'Linux Administration', pct: 95 },
  { name: 'Python Backend', pct: 90 },
  { name: 'Bash Scripting', pct: 90 },
  { name: 'Docker / Nginx', pct: 85 },
  { name: 'Scraping / Automation', pct: 90 },
  { name: 'C Programming', pct: 60 },
  { name: 'Concurrency', pct: 70 },
  { name: 'SQL / Databases', pct: 80 },
  { name: 'Observability', pct: 80 },
  { name: 'Git / GitHub', pct: 85 },
];

function renderSkills() {
  const c = $('skills-container');
  c.innerHTML = skills.map(s => `
    <div class="skill-row">
      <span class="skill-name">${s.name}</span>
      <div class="skill-bar-bg">
        <div class="skill-bar-fill" data-pct="${s.pct}" style="width:0%"></div>
      </div>
      <span class="skill-pct">${s.pct}%</span>
    </div>
  `).join('');
}

let skillsAnimated = false;
function animateSkills() {
  if (skillsAnimated) return;
  skillsAnimated = true;
  renderSkills();
  setTimeout(() => {
    document.querySelectorAll('.skill-bar-fill').forEach(bar => {
      bar.style.width = bar.dataset.pct + '%';
    });
  }, 100);
}
renderSkills();

// ── Terminal ──
const termOutput = $('term-output');
const termInput = $('term-input');

const COMMANDS = {
  help: () => [
    `<span class="t-cyan">VinyloOS 96 — Terminal v1.0</span>`,
    `<span class="t-comment">─────────────────────────────</span>`,
    `<span class="t-out">  about        </span><span class="t-out-bright">Mostrar información personal</span>`,
    `<span class="t-out">  projects      </span><span class="t-out-bright">Listar proyectos</span>`,
    `<span class="t-out">  skills        </span><span class="t-out-bright">Ver habilidades</span>`,
    `<span class="t-out">  c             </span><span class="t-out-bright">Abrir C Lab</span>`,
    `<span class="t-out">  concurrency   </span><span class="t-out-bright">Abrir Concurrency Lab</span>`,
    `<span class="t-out">  github        </span><span class="t-out-bright">Abrir perfil de GitHub</span>`,
    `<span class="t-out">  contact       </span><span class="t-out-bright">Información de contacto</span>`,
    `<span class="t-out">  neofetch      </span><span class="t-out-bright">System info</span>`,
    `<span class="t-out">  ls            </span><span class="t-out-bright">Listar archivos</span>`,
    `<span class="t-out">  whoami        </span><span class="t-out-bright">Información del usuario</span>`,
    `<span class="t-out">  uname -a      </span><span class="t-out-bright">Kernel info</span>`,
    `<span class="t-out">  clear         </span><span class="t-out-bright">Limpiar terminal</span>`,
  ],

  neofetch: () => [
    `<span class="t-cyan">        .--.</span>`,
    `<span class="t-cyan">       |o_o |</span>   <span class="t-out-bright">0Vinylo0</span><span class="t-comment">@</span><span class="t-cyan">VinyloOS</span>`,
    `<span class="t-cyan">       |:_/ |</span>   <span class="t-comment">──────────────────</span>`,
    `<span class="t-cyan">      //   \\ \\</span>  <span class="t-out">OS:</span>      <span class="t-out-bright">VinyloOS 96 Linux Edition</span>`,
    `<span class="t-cyan">     (|     | )</span> <span class="t-out">Kernel:</span>  <span class="t-out-bright">6.6-retro-amd64</span>`,
    `<span class="t-cyan">    /'\\_   _/\`\\</span> <span class="t-out">Shell:</span>   <span class="t-out-bright">bash 5.2.0</span>`,
    `<span class="t-cyan">    \\___)=(___/</span> <span class="t-out">WM:</span>      <span class="t-out-bright">TechnoWM</span>`,
    `                <span class="t-out">Stack:</span>   <span class="t-out-bright">Linux, Python, Bash, Docker, C</span>`,
    `                <span class="t-out">Learning:</span><span class="t-yellow"> concurrency, pthreads, memory</span>`,
    `                <span class="t-out">Uptime:</span>  <span class="t-out-bright">${Math.floor(Math.random()*999)} days</span>`,
  ],

  about: () => {
    openWin('about');
    return [`<span class="t-out-bright">→ Abriendo /home/vinylo/about.txt...</span>`];
  },

  projects: () => {
    openWin('projects');
    return [`<span class="t-out-bright">→ Abriendo /home/vinylo/projects/...</span>`];
  },

  skills: () => {
    openWin('skills');
    return [`<span class="t-out-bright">→ Cargando system monitor...</span>`];
  },

  c: () => {
    openWin('clab');
    return [`<span class="t-out-bright">→ gcc 13.2 ready. Abriendo C Lab...</span>`];
  },

  concurrency: () => {
    openWin('concurrency');
    return [`<span class="t-out-bright">→ pthreads loaded. Abriendo Concurrency Lab...</span>`];
  },

  github: () => {
    window.open('https://github.com/0Vinylo0', '_blank');
    return [`<span class="t-out-bright">→ Abriendo github.com/0Vinylo0...</span>`];
  },

  contact: () => {
    openWin('contact');
    return [`<span class="t-out-bright">→ Iniciando conexión SSH con contact@vinylo...</span>`];
  },

  ls: () => [
    `<span class="t-cyan">total 7</span>`,
    `<span class="t-out">drwxr-xr-x</span>  about.txt`,
    `<span class="t-out">drwxr-xr-x</span>  projects/`,
    `<span class="t-out">drwxr-xr-x</span>  c_lab/`,
    `<span class="t-out">drwxr-xr-x</span>  concurrency_lab/`,
    `<span class="t-out">drwxr-xr-x</span>  linux_lab/`,
    `<span class="t-out">drwxr-xr-x</span>  .bashrc`,
    `<span class="t-out">drwxr-xr-x</span>  .gitconfig`,
  ],

  whoami: () => [`<span class="t-out-bright">0Vinylo0 — sysadmin & backend developer</span>`],

  'uname -a': () => [
    `<span class="t-out-bright">Linux VinyloOS 6.6.0-retro #1 SMP PREEMPT Mon Jan 1 00:00:00 UTC 2025 x86_64 GNU/Linux</span>`
  ],

  clear: () => { termOutput.innerHTML = ''; return []; },

  pwd: () => [`<span class="t-out-bright">/home/vinylo</span>`],

  date: () => [`<span class="t-out-bright">${new Date().toString()}</span>`],

  uptime: () => [`<span class="t-out-bright"> ${new Date().toTimeString().split(' ')[0]}  up ${Math.floor(Math.random()*999)} days — load average: 0.${Math.floor(Math.random()*99)}, 0.${Math.floor(Math.random()*99)}, 0.${Math.floor(Math.random()*99)}</span>`],
};

function termPrint(lines) {
  lines.forEach(l => {
    const d = document.createElement('div');
    d.className = 't-line';
    d.innerHTML = l;
    termOutput.appendChild(d);
  });
  termOutput.scrollTop = termOutput.scrollHeight;
}

function termExec(cmd) {
  cmd = cmd.trim();
  if (!cmd) return;

  // Print prompt + command
  const row = document.createElement('div');
  row.className = 't-line';
  row.innerHTML = `<span class="t-prompt">0Vinylo0@VinyloOS:~$</span> <span class="t-cmd">${escHTML(cmd)}</span>`;
  termOutput.appendChild(row);

  const fn = COMMANDS[cmd.toLowerCase()] || COMMANDS[cmd];
  if (fn) {
    const out = fn();
    if (out && out.length) termPrint(out);
  } else {
    termPrint([`<span class="t-err">bash: ${escHTML(cmd)}: command not found</span>`,
               `<span class="t-out">Type <span class="t-cmd">help</span> for available commands.</span>`]);
  }
  termOutput.scrollTop = termOutput.scrollHeight;
}

function escHTML(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// Terminal history
let termHistory = [], termHistIdx = -1;

termInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    const cmd = termInput.value;
    termHistory.unshift(cmd);
    termHistIdx = -1;
    termInput.value = '';
    termExec(cmd);
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    if (termHistIdx < termHistory.length - 1) {
      termHistIdx++;
      termInput.value = termHistory[termHistIdx];
    }
  } else if (e.key === 'ArrowDown') {
    e.preventDefault();
    if (termHistIdx > 0) { termHistIdx--; termInput.value = termHistory[termHistIdx]; }
    else { termHistIdx = -1; termInput.value = ''; }
  } else if (e.key === 'Tab') {
    e.preventDefault();
    const partial = termInput.value.toLowerCase();
    const match = Object.keys(COMMANDS).find(k => k.startsWith(partial));
    if (match) termInput.value = match;
  }
});

// Click terminal to focus input
$('win-terminal').addEventListener('click', () => termInput.focus());

// ── Boot Sequence ──
const bootLines = [
  { ok: true,  text: 'Loading kernel modules' },
  { ok: true,  text: 'Mounting <span>/home/vinylo</span>' },
  { ok: true,  text: 'Starting portfolio.service' },
  { ok: true,  text: 'Starting techno-window-manager (TechnoWM)' },
  { ok: true,  text: 'Initializing CRT display driver' },
  { ok: true,  text: 'Connecting to GitHub' },
  { ok: true,  text: 'Loading projects database' },
  { ok: true,  text: 'Starting network interfaces' },
  { ok: true,  text: 'Checking SSL certificates' },
  { ok: true,  text: 'portfolio.service — READY' },
];

async function runBoot() {
  const container = $('boot-lines');
  for (let i = 0; i < bootLines.length; i++) {
    await sleep(120 + Math.random() * 180);
    const line = document.createElement('div');
    line.className = 'boot-line';
    line.style.animationDelay = '0ms';
    const b = bootLines[i];
    line.innerHTML = `
      <span class="${b.ok ? 'boot-ok' : 'boot-fail'}">[&nbsp;${b.ok ? 'OK' : 'FAIL'}&nbsp;]</span>
      <span class="boot-text">${b.text}</span>
    `;
    container.appendChild(line);
    if (prefersReduced) continue;
  }

  await sleep(400);
  const welcome = $('boot-welcome');
  welcome.innerHTML = `Welcome to <span style="color:var(--green)">VinyloOS 96</span> — Linux Cyberdesk Edition <span id="boot-cursor"></span>`;
  welcome.style.animation = 'bootfade 0.5s forwards';
  welcome.style.opacity = '0';

  await sleep(1000);
  // Fade out boot screen
  $('boot-screen').style.transition = 'opacity 0.8s';
  $('boot-screen').style.opacity = '0';
  await sleep(800);
  $('boot-screen').style.display = 'none';

  // Show desktop
  $('desktop').classList.add('visible');

  // Auto-open terminal
  await sleep(300);
  openWin('terminal');
  termPrint([
    `<span class="t-cyan">VinyloOS 96 — Linux Cyberdesk Edition</span>`,
    `<span class="t-comment">kernel 6.6-retro — TechnoWM — bash 5.2.0</span>`,
    `<span class="t-comment">─────────────────────────────────────────</span>`,
    `<span class="t-out">Type <span class="t-cmd">help</span> to see available commands.</span>`,
    `<span class="t-out">Try <span class="t-cmd">neofetch</span> for system info.</span>`,
    ``,
  ]);

  showCookies();
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// ── Network packets counter ──
let pkts = 0;
setInterval(() => {
  pkts += Math.floor(Math.random() * 50 + 10);
  const el = $('net-pkts');
  if (el) el.textContent = pkts.toLocaleString() + ' pkts';
}, 1000);

// ── Synthwave Canvas ──
(function() {
  const canvas = $('bg-canvas');
  const ctx = canvas.getContext('2d');
  let W, H, animId;

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  window.addEventListener('resize', resize);
  resize();

  let tick = 0;

  function draw() {
    animId = requestAnimationFrame(draw);
    if (!fxEnabled) { ctx.clearRect(0,0,W,H); return; }

    tick += 0.4;

    ctx.clearRect(0,0,W,H);

    // Sky gradient
    const sky = ctx.createLinearGradient(0, 0, 0, H * 0.55);
    sky.addColorStop(0, '#000500');
    sky.addColorStop(0.6, '#001200');
    sky.addColorStop(1, '#002800');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    // Horizon glow
    const hg = ctx.createRadialGradient(W/2, H*0.52, 0, W/2, H*0.52, W*0.5);
    hg.addColorStop(0, 'rgba(0,255,65,0.12)');
    hg.addColorStop(0.4, 'rgba(0,200,50,0.04)');
    hg.addColorStop(1, 'transparent');
    ctx.fillStyle = hg;
    ctx.fillRect(0, 0, W, H);

    const hz = H * 0.52;
    const GRID = 30;
    const SPEED = tick * 0.6;

    // Vertical lines
    ctx.strokeStyle = 'rgba(0,255,65,0.18)';
    ctx.lineWidth = 0.7;
    for (let i = -GRID; i <= GRID; i++) {
      const xBase = W/2 + i * (W / GRID);
      ctx.beginPath();
      ctx.moveTo(xBase, hz);
      const vp = { x: W/2, y: -H*0.5 };
      const t0 = 0, t1 = 1;
      const ex = xBase + (xBase - vp.x) * 3;
      const ey = hz + (hz - vp.y) * 3;
      ctx.lineTo(ex, ey);
      ctx.stroke();
    }

    // Horizontal lines (moving)
    const linesCount = 20;
    for (let j = 0; j < linesCount; j++) {
      const rawY = hz + j * (H * 0.5 / linesCount);
      const yy = hz + ((rawY - hz + SPEED * (j/linesCount * 3 + 1)) % (H * 0.5));
      if (yy < hz) continue;
      const prog = (yy - hz) / (H - hz);
      ctx.strokeStyle = `rgba(0,255,65,${prog * 0.3})`;
      ctx.lineWidth = prog * 1.5;
      ctx.beginPath();
      ctx.moveTo(0, yy);
      ctx.lineTo(W, yy);
      ctx.stroke();
    }

    // Stars
    if (!canvas._stars) {
      canvas._stars = Array.from({length:60}, () => ({
        x: Math.random() * W, y: Math.random() * hz * 0.8,
        r: Math.random() * 1.5, t: Math.random() * Math.PI * 2
      }));
    }
    canvas._stars.forEach(s => {
      s.t += 0.02;
      const a = 0.3 + Math.sin(s.t) * 0.3;
      ctx.fillStyle = `rgba(0,255,65,${a})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  draw();
})();

// Start
runBoot();