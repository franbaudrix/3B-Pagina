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
            
            // Ejemplo de cómo agregar productos al carrito
            // En una implementación real, esto se haría desde la página de productos
            function addToCart(productName, price) {
                // Lógica para agregar productos al carrito
                console.log(`Agregado al carrito: ${productName} - $${price}`);
                // Actualizar contador del carrito
                const count = parseInt(document.getElementById('cart-count').textContent);
                document.getElementById('cart-count').textContent = count + 1;
            }
        });