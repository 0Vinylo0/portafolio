// Lista de comandos para el efecto de tipeo
const commands = [
    "git clone https://github.com/0Vinylo0",
    "useradd -g sudoers -d /home/0Vinylo0 -s /bin/zsh -p $(openssl passwd -6 -salt 4dm1n) 0Vinylo0",
    "docker run -d -p 80:80 nginx",
    "python3 -m venv myenv && source myenv/bin/activate",
    "nmap -sV -p 22,80,443 192.168.1.1",
    "aws s3 sync ./myfolder s3://mybucket"
];

const typingBox = document.getElementById("typing-box");
let commandIndex = 0; // Índice del comando actual
let charIndex = 0;   // Índice del carácter actual
let isDeleting = false;

function typeEffect() {
    const currentCommand = commands[commandIndex];
    let text = currentCommand.slice(0, charIndex);
    
    // Solo mostramos el texto que se está escribiendo o borrando
    typingBox.innerHTML = text + '<span class="cursor"></span>';

    if (!isDeleting) {
        charIndex++;
        if (charIndex > currentCommand.length) {
            isDeleting = true;
            setTimeout(typeEffect, 1500); // Pausa antes de borrar
            return;
        }
    } else {
        charIndex--;
        if (charIndex < 0) {
            // Cambiamos al siguiente comando solo después de borrar completamente
            isDeleting = false;
            commandIndex = (commandIndex + 1) % commands.length;
            charIndex = 0; // Reiniciamos charIndex
            setTimeout(typeEffect, 500); // Pausa antes de escribir el siguiente
            return;
        }
    }
    setTimeout(typeEffect, isDeleting ? 50 : 100); // Velocidad de borrado/escritura
}
typeEffect();

// Animación del rocket y generación de partículas
document.getElementById("rocket").addEventListener("click", function() {
    let rocket = this;
    rocket.style.animation = "moveRocket 2s linear forwards";
    let interval = setInterval(() => generateParticles(rocket), 50);
    setTimeout(() => {
        clearInterval(interval);
        rocket.style.display = "none";
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

// Partículas con emojis al mover el mouse
const emojis = ['✨', '🔥', '💫', '🌟', '🎶', '🌀'];
document.addEventListener('mousemove', (e) => {
    if (Math.random() < 0.3) createParticle(e.clientX, e.clientY);
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
    particle.style.position = 'fixed';

    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * 30 + 10;
    const offsetX = Math.cos(angle) * distance;
    const offsetY = Math.sin(angle) * distance;

    setTimeout(() => {
        particle.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(0.5)`;
        particle.style.opacity = '0';
        setTimeout(() => particle.remove(), 1500);
    }, 50);
}

// Inicialización del slider Swiper
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
    speed: 500,
    effect: 'slide',
    watchOverflow: true
});

// Inicialización de AOS
AOS.init();

// Modo oscuro
document.getElementById("theme-toggle").addEventListener("click", () => {
    document.body.classList.toggle("dark");
    const btn = document.getElementById("theme-toggle");
    btn.textContent = document.body.classList.contains("dark") ? "☀️ Modo Claro" : "🌙 Modo Oscuro";
});

// Lista de secciones a recorrer
const sectionIds = ["home", "proyectos", "skills", "contacto"];
let currentSectionIndex = 0;
let isScrolling = false;

function scrollToSection(index) {
    if (index >= 0 && index < sectionIds.length) {
        const section = document.getElementById(sectionIds[index]);
        if (section) {
            isScrolling = true;
            window.scrollTo({
                top: section.offsetTop - 20,
                behavior: "smooth"
            });
            currentSectionIndex = index;
            setTimeout(() => {
                isScrolling = false;
            }, 800);
        }
    }
}

// Escucha la rueda del ratón
window.addEventListener("wheel", (event) => {
    event.preventDefault();  
    if (isScrolling) return;

    if (event.deltaY > 0 && currentSectionIndex < sectionIds.length - 1) {
        currentSectionIndex++;
        scrollToSection(currentSectionIndex);
    }
    else if (event.deltaY < 0 && currentSectionIndex > 0) {
        currentSectionIndex--;
        scrollToSection(currentSectionIndex);
    }
}, { passive: false });