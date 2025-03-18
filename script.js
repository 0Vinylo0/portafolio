// Efecto de tipeo
const command = "git clone https://github.com/0Vinylo0";
const typingBox = document.getElementById("typing-box");
let index = 0;
let isDeleting = false;
function typeEffect() {
    let text = command.slice(0, index);
    typingBox.innerHTML = text + '<span class="cursor"></span>';
    if (!isDeleting) {
        index++;
        if (index > command.length) {
            isDeleting = true;
            setTimeout(typeEffect, 2000);
            return;
        }
    } else {
        index--;
        if (index < 0) {
            isDeleting = false;
            index = 0;
            setTimeout(typeEffect, 500);
            return;
        }
    }
    setTimeout(typeEffect, isDeleting ? 50 : 100);
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
    document.body.appendChild(particle); // Añadimos las partículas al body directamente

    const size = Math.random() * 15 + 20;
    particle.style.fontSize = `${size}px`;
    particle.style.left = `${x}px`;
    particle.style.top = `${y}px`;
    particle.style.position = 'fixed'; // Usamos posición fija para que siga el cursor en toda la página

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
    slidesPerView: 1,          // Solo un slide visible a la vez
    spaceBetween: 0,           // Sin espacio entre slides
    centeredSlides: true,      // Centra el slide activo
    allowTouchMove: false,     // Desactiva el arrastre manual
    speed: 500,                // Velocidad de transición más suave
    effect: 'slide',           // Efecto de transición simple
    watchOverflow: true        // Evita problemas si hay menos slides de los esperados
});


// Inicialización de AOS
AOS.init();

// Modo oscuro
document.getElementById("theme-toggle").addEventListener("click", () => {
    document.body.classList.toggle("dark");
    const btn = document.getElementById("theme-toggle");
    btn.textContent = document.body.classList.contains("dark") ? "☀️ Modo Claro" : "🌙 Modo Oscuro";
});

// Inicialización de EmailJS y manejo del formulario de contacto
emailjs.init("YOUR_USER_ID"); // Reemplaza con tu ID de EmailJS
document.getElementById("contact-form").addEventListener("submit", function(e) {
    e.preventDefault();
    emailjs.sendForm("YOUR_SERVICE_ID", "YOUR_TEMPLATE_ID", this)
        .then(() => alert("¡Mensaje enviado!"), (err) => alert("Error al enviar: " + JSON.stringify(err)));
});

// Lista de secciones a recorrer
const sectionIds = ["home", "proyectos", "contacto"];
let currentSectionIndex = 0;
let isScrolling = false;

function scrollToSection(index) {
    if (index >= 0 && index < sectionIds.length) {
        const section = document.getElementById(sectionIds[index]);
        if (section) {
            isScrolling = true;
            window.scrollTo({
                top: section.offsetTop - 20, // Ajusta si quieres más o menos separación
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
    // Evita el scroll nativo
    event.preventDefault();  
    
    // Verifica si estamos en medio de un desplazamiento
    if (isScrolling) return;

    // Si rueda hacia abajo (deltaY > 0) y no estamos en la última sección
    if (event.deltaY > 0 && currentSectionIndex < sectionIds.length - 1) {
        currentSectionIndex++;
        scrollToSection(currentSectionIndex);
    }
    // Si rueda hacia arriba (deltaY < 0) y no estamos en la primera sección
    else if (event.deltaY < 0 && currentSectionIndex > 0) {
        currentSectionIndex--;
        scrollToSection(currentSectionIndex);
    }
}, { passive: false });
