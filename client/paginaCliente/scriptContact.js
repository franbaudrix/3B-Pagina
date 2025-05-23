window.addEventListener("scroll", function() {
            const logoContainer = document.querySelector(".logo-mobile");
            if (window.innerWidth < 992) { // Solo en móviles
                if (window.scrollY > 50) {
                    logoContainer.classList.add("hidden"); // Oculta logo + espacio
                } else {
                    logoContainer.classList.remove("hidden"); // Muestra logo
                }
            }
        });

        // Script para el formulario de contacto
document.getElementById('contactForm').addEventListener('submit', function(e) {
    e.preventDefault();
            // Aquí iría la lógica para enviar el formulario
    alert('Gracias por tu mensaje. Nos pondremos en contacto contigo pronto.');
    this.reset();
});