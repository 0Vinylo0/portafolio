// ===================================
// EFECTO DE TIPEO EN TERMINAL
// ===================================

const commands = [
    "git clone https://github.com/0Vinylo0",
    "useradd -g sudoers -d /home/0Vinylo0 -s /bin/zsh -p $(openssl passwd -6 -salt 4dm1n) 0Vinylo0",
    "docker run -d -p 80:80 nginx",
    "python3 -m venv myenv && source myenv/bin/activate",
    "nmap -sV -p 22,80,443 192.168.1.1",
    "aws s3 sync ./myfolder s3://mybucket"
];

const typingBox = document.getElementById("typing-box");
let commandIndex = 0;
let charIndex = 0;
let isDeleting = false;

function typeEffect() {
    const currentCommand = commands[commandIndex];
    let text = currentCommand.slice(0, charIndex);

    typingBox.innerHTML = text + '<span class="cursor"></span>';

    if (!isDeleting) {
        charIndex++;
        if (charIndex > currentCommand.length) {
            isDeleting = true;
            setTimeout(typeEffect, 1500);
            return;
        }
    } else {
        charIndex--;
        if (charIndex < 0) {
            isDeleting = false;
            commandIndex = (commandIndex + 1) % commands.length;
            charIndex = 0;
            setTimeout(typeEffect, 500);
            return;
        }
    }
    setTimeout(typeEffect, isDeleting ? 50 : 100);
}

// Iniciar el efecto de tipeo
typeEffect();

// ===================================
// ANIMACIÓN DEL COHETE Y PARTÍCULAS
// ===================================

document.getElementById("rocket").addEventListener("click", function () {
    let rocket = this;
    rocket.style.animation = "moveRocket 2s linear forwards";
    
    let interval = setInterval(() => generateParticles(rocket), 50);
    
    setTimeout(() => {
        clearInterval(interval);
        rocket.style.display = "none";
        
        // Reaparecer el cohete después de 3 segundos
        setTimeout(() => {
            rocket.style.display = "inline-block";
            rocket.style.animation = "none";
        }, 3000);
    }, 2000);
});

function generateParticles(rocket) {
    for (let i = 0; i < 5; i++) {
        let particle = document.createElement("div");
        particle.classList.add("particles");
        document.body.appendChild(particle);
        
        let rect = rocket.getBoundingClientRect();
        let x = rect.left + rect.width / 2 + (Math.random() * 10 - 5);
        let y = rect.top + rect.height + Math.random() * 10;
        
        particle.style.left = `${x}px`;
        particle.style.top = `${y}px`;
        particle.style.animation = `particlesAnimation 1s linear forwards`;
        
        setTimeout(() => {
            particle.remove();
        }, 1000);
    }
}

// ===================================
// PARTÍCULAS CON EMOJIS AL MOVER EL MOUSE
// ===================================

const emojis = ['✨', '🔥', '💫', '🌟', '🎶', '🌀'];
let lastParticleTime = 0;
const particleDelay = 100; // Milisegundos entre partículas

document.addEventListener('mousemove', (e) => {
    const currentTime = Date.now();
    if (currentTime - lastParticleTime > particleDelay && Math.random() < 0.3) {
        createParticle(e.clientX, e.clientY);
        lastParticleTime = currentTime;
    }
});

function createParticle(x, y) {
    const particle = document.createElement('div');
    particle.classList.add('particle');
    particle.innerText = emojis[Math.floor(Math.random() * emojis.length)];
    document.body.appendChild(particle);

    const size = Math.random() * 15 + 20;
    particle.style.fontSize = `${size}px`;
    particle.style.left = `${x}px`;
    particle.style.top = `${y}px`;

    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * 40 + 20;
    const offsetX = Math.cos(angle) * distance;
    const offsetY = Math.sin(angle) * distance;

    setTimeout(() => {
        particle.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(0.5)`;
        particle.style.opacity = '0';
        setTimeout(() => particle.remove(), 1500);
    }, 50);
}

// ===================================
// INICIALIZACIÓN DEL SLIDER SWIPER
// ===================================

new Swiper('.swiper', {
    loop: true,
    autoplay: {
        delay: 2500,
        disableOnInteraction: false
    },
    slidesPerView: 1,
    spaceBetween: 0,
    centeredSlides: true,
    allowTouchMove: false,
    speed: 600,
    effect: 'slide',
    watchOverflow: true
});

// ===================================
// INICIALIZACIÓN DE AOS (ANIMATE ON SCROLL)
// ===================================

AOS.init({
    duration: 800,
    easing: 'ease-in-out',
    once: true,
    offset: 100
});

// ===================================
// MODO OSCURO
// ===================================

const themeToggle = document.getElementById("theme-toggle");
const body = document.body;

// Cargar preferencia guardada
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark') {
    body.classList.add('dark');
    themeToggle.textContent = "☀️ Modo Claro";
}

themeToggle.addEventListener("click", () => {
    body.classList.toggle("dark");
    const isDark = body.classList.contains("dark");
    
    themeToggle.textContent = isDark ? "☀️ Modo Claro" : "🌙 Modo Oscuro";
    
    // Guardar preferencia
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
});

// ===================================
// NAVEGACIÓN SUAVE POR SECCIONES
// ===================================

// Función para scroll suave a una sección
function smoothScrollTo(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        const offsetTop = element.offsetTop;
        window.scrollTo({
            top: offsetTop,
            behavior: 'smooth'
        });
    }
}

// Manejar clics en enlaces de navegación
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const targetId = this.getAttribute('href').substring(1);
        smoothScrollTo(targetId);
    });
});

// ===================================
// DETECCIÓN DE SECCIÓN ACTIVA (OPCIONAL)
// ===================================

const sections = document.querySelectorAll('.section');
const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.5
};

const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            // Aquí puedes añadir lógica adicional cuando una sección es visible
            // Por ejemplo, actualizar la navegación activa
            const sectionId = entry.target.id;
            console.log(`Sección visible: ${sectionId}`);
        }
    });
}, observerOptions);

sections.forEach(section => {
    sectionObserver.observe(section);
});

// ===================================
// MEJORAS DE RENDIMIENTO
// ===================================

// Throttle para eventos de scroll (si lo necesitas en el futuro)
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    }
}

// ===================================
// NAVEGACIÓN POR TECLADO (ACCESIBILIDAD)
// ===================================

document.addEventListener('keydown', (e) => {
    // Flecha abajo: ir a la siguiente sección
    if (e.key === 'ArrowDown' && e.ctrlKey) {
        e.preventDefault();
        const currentScroll = window.scrollY;
        let nextSection = null;
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            if (sectionTop > currentScroll + 100 && !nextSection) {
                nextSection = section;
            }
        });
        
        if (nextSection) {
            smoothScrollTo(nextSection.id);
        }
    }
    
    // Flecha arriba: ir a la sección anterior
    if (e.key === 'ArrowUp' && e.ctrlKey) {
        e.preventDefault();
        const currentScroll = window.scrollY;
        let prevSection = null;
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            if (sectionTop < currentScroll - 100) {
                prevSection = section;
            }
        });
        
        if (prevSection) {
            smoothScrollTo(prevSection.id);
        }
    }
});

// ===================================
// MENSAJE DE BIENVENIDA EN CONSOLA
// ===================================

console.log(`
╔═══════════════════════════════════════════════╗
║                                               ║
║   👋 Hola! Bienvenido a mi portafolio        ║
║                                               ║
║   🚀 GitHub: https://github.com/0Vinylo0     ║
║   📧 Email: andresdelpino2002@gmail.com      ║
║                                               ║
║   Si estás revisando el código, ¡genial!     ║
║   No dudes en contactarme si tienes          ║
║   alguna pregunta o propuesta.               ║
║                                               ║
╚═══════════════════════════════════════════════╝
`);
