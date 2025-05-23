        // Funcionalidad básica del carrito
        document.addEventListener('DOMContentLoaded', function() {
            const cartToggle = document.getElementById('cart-toggle');
            const cartContainer = document.getElementById('cart-container');
            const closeCart = document.getElementById('close-cart');
            
            cartToggle.addEventListener('click', function() {
                cartContainer.style.display = 'block';
                setTimeout(() => {
                    cartContainer.style.transform = 'translateX(0)';
                }, 10);
            });
            
            closeCart.addEventListener('click', function() {
                cartContainer.style.transform = 'translateX(100%)';
                setTimeout(() => {
                    cartContainer.style.display = 'none';
                }, 300);
            });
            
        });

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