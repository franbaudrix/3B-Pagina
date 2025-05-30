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