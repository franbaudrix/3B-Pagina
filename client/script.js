// Variables globales
let totalPrice = 0; // Variable para almacenar el total
const totalDisplay = document.getElementById('total-price'); // Elemento donde se mostrará el total
let iterations_agregar_button = 0; //Variable para agregar los nombres de las columnas solo una vez
const cartCountDisplay = document.getElementById('cart-count');
let cartItemCount = 0
const cartContainer = document.getElementById('cart-container');
const cartToggle = document.getElementById('cart-toggle');
const closeCart = document.getElementById('close-cart');

// Función para mostrar/ocultar el carrito
function toggleCart() {
    cartContainer.classList.toggle('cart-visible');
    document.body.style.overflow = cartContainer.classList.contains('cart-visible') ? 'hidden' : '';
}

// Event listeners para el carrito
cartToggle.addEventListener('click', toggleCart);
closeCart.addEventListener('click', toggleCart);

// Opciones de peso
const weightOptions = {
    "half-kg": 0.5,
    "one-kg": 1,
    "two-kg": 2,
    "other-kg": 0
};

// Función para guardar el pedido en la base de datos
async function guardarPedido() {
    try {
        const items = [];
        const filas = document.querySelectorAll('#tablaCarrito tbody tr:not(.table-header)');
        
        filas.forEach(fila => {
            const celdas = fila.cells;
            items.push({
                producto: fila.dataset.productId,
                nombre: celdas[0].textContent.trim(),
                precioUnitario: parseFloat(celdas[1].textContent.replace('$', '')),
                subtotal: parseFloat(celdas[1].textContent.replace('$', '')), // Añadido
                peso: celdas[2].textContent.trim(),
                cantidad: parseInt(celdas[3].textContent),
                precioTotal: parseFloat(celdas[4].textContent.replace('$', ''))
            });
        });

        if (items.length === 0) {
            throw new Error('El carrito está vacío');
        }

        const pedido = {
            fecha: new Date().toISOString(),
            items: items,
            total: totalPrice,
            estado: 'pendiente'
        };

        console.log('Enviando pedido:', pedido); // Para depuración

        const response = await fetch('http://localhost:3000/api/pedidos', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(pedido)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error al guardar el pedido');
        }

        const data = await response.json();
        alert(`Pedido guardado correctamente! ID: ${data.id}`);
        
        // Limpiar carrito
        document.querySelector('#tablaCarrito tbody').innerHTML = '';
        totalPrice = 0;
        totalDisplay.textContent = '$0.00';
        cartItemCount = 0;
        cartCountDisplay.textContent = '0';
        
        // Eliminar botón de guardar
        const saveBtn = document.querySelector('#save-order-btn');
        if (saveBtn) saveBtn.remove();
        
    } catch (error) {
        console.error('Error:', error);
        alert('Error al guardar el pedido: ' + error.message);
    }
}


document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('http://localhost:3000/api/productos');
        const productos = await response.json();

        const container = document.getElementById('productos-container');
        container.innerHTML = productos.map(producto => `
            <div class="col-md-4 product-card" data-product-id="${producto._id}" data-base-price="${producto.precio}" data-product-name="${producto.nombre}">
                <div class="card h-100">
                    <img src="${producto.imagen.toString()}" class="img-fluid" style="max-height: 250px;" alt="${producto.nombre}">
                    <div class="card-body">
                        <h5 class="card-title">${producto.nombre}</h5>
                        <p class="card-text">$${producto.precio.toFixed(2)}</p>
                        <p class="card-text text-muted">${producto.descripcion || ''}</p>
                    </div>
                    <div class="mb-2 p-3">
                        <label for="weight" class="form-label">Peso:</label>
                        <select name="weight" class="form-select form-select-sm weight-select">
                            <option value="half-kg">500g</option>
                            <option value="one-kg" selected>1000g</option>
                            <option value="two-kg">2000g</option>
                            <option value="other-kg">Otro</option>
                        </select>
                        <input type="number" class="form-control custom-weight-input mt-2" placeholder="Ingrese el peso en kg" style="display: none;">
                    </div>
                    
                    <div class="mb-2 p-3">
                        <label for="amount" class="form-label">Cantidad bolsas:</label>
                        <select name="amount" class="form-select form-select-sm amount-select">
                            <option value="1">1 bolsa</option>
                            <option value="2">2 bolsas</option>
                            <option value="3">3 bolsas</option>
                            <option value="4">4 bolsas</option>
                        </select>
                    </div>
                    <div class="mb-2 p-3 price-display text-end fw-bold"></div>
                    <button class="btn btn-danger btn-block rounded-0 btn-product-card">Agregar</button>
                </div>
            </div>
        `).join('');

        // Inicializar los eventos después de cargar los productos
        initializeProductCards();

    } catch (error) {
        console.error('Error al cargar productos:', error);
        document.getElementById('productos-container').innerHTML = '<p class="text-danger">Error al cargar los productos. Intenta más tarde.</p>';
    }
});

function initializeProductCards() {
    // Selecciona todas las tarjetas de producto
    const productCards = document.querySelectorAll('.product-card');

    productCards.forEach(card => {
        const basePrice = parseFloat(card.getAttribute('data-base-price'));
        const productName = card.getAttribute('data-product-name');
        const priceDisplay = card.querySelector('.price-display');
        const weightSelect = card.querySelector('.weight-select');
        const amountSelect = card.querySelector('.amount-select');
        const addButton = card.querySelector('button');
        const customWeightInput = card.querySelector('.custom-weight-input');

        // Función para calcular el precio de la tarjeta actual
        function calculateCurrentPrice() {
            const selectedWeight = weightSelect.value;
            const selectedAmount = parseInt(amountSelect.value, 10);
            let weightFactor = weightOptions[selectedWeight];

            if (selectedWeight === "other-kg") {
                weightFactor = parseFloat(customWeightInput.value) || 0;
            }

            return basePrice * weightFactor * selectedAmount;
        }

        // Función para calcular el subtotal (precio por bolsa)
        function calculateSubtotal() {
            const selectedWeight = weightSelect.value;
            let weightFactor = weightOptions[selectedWeight];

            if (selectedWeight === "other-kg") {
                weightFactor = parseFloat(customWeightInput.value) || 0;
            }

            return basePrice * weightFactor;
        }

        // Función para actualizar el precio mostrado en la tarjeta
        function updatePriceDisplay() {
            const currentPrice = calculateCurrentPrice();
            const subtotal = calculateSubtotal();
            priceDisplay.innerHTML = `
                <small>Subtotal (por bolsa): $${subtotal.toFixed(2)}</small><br>
                <strong>Total: $${currentPrice.toFixed(2)}</strong>
            `;
        }

        // Función para agregar el precio actual al total
        function addToTotal() {
            const currentPrice = calculateCurrentPrice();
            totalPrice += currentPrice;
            totalDisplay.textContent = `$${totalPrice.toFixed(2)}`;
        }

        // Función para añadir producto al carrito
        function addToCart(button) {
            // Obtener el elemento padre product-card
            const productCard = button.closest('.product-card');
            if (!productCard) {
                console.error('No se encontró el elemento product-card');
                return;
            }
        
            // Obtener datos del producto
            const productId = productCard.dataset.productId;
            const productName = productCard.dataset.productName;
            const basePrice = parseFloat(productCard.dataset.basePrice);
            
            // Obtener elementos de la tarjeta
            const weightSelect = productCard.querySelector('.weight-select');
            const amountSelect = productCard.querySelector('.amount-select');
            const customWeightInput = productCard.querySelector('.custom-weight-input');
            
            // Calcular valores
            const selectedWeight = weightSelect.value;
            const selectedAmount = parseInt(amountSelect.value);
            let weightFactor = weightOptions[selectedWeight];
            let weightText = weightSelect.options[weightSelect.selectedIndex].text;
        
            // Manejar peso personalizado
            if (selectedWeight === "other-kg") {
                weightFactor = parseFloat(customWeightInput.value) || 0;
                weightText = `${customWeightInput.value} kg`;
            }
        
            // Calcular precios
            const subtotal = basePrice * weightFactor;
            const totalPriceForItem = subtotal * selectedAmount;
        
            // Obtener o crear el tbody de la tabla
            let tableBody = document.querySelector('#tablaCarrito tbody');
            if (!tableBody) {
                tableBody = document.createElement('tbody');
                document.getElementById('tablaCarrito').appendChild(tableBody);
            }
        
            // Agregar encabezados solo si es la primera vez
            if (tableBody.rows.length === 0) {
                const headerRow = tableBody.insertRow();
                headerRow.className = 'table-header';
                const headers = ['Producto', 'Precio Unitario', 'Peso', 'Cantidad', 'Total', 'Acción'];
                headers.forEach(text => {
                    const cell = headerRow.insertCell();
                    cell.innerHTML = `<strong>${text}</strong>`;
                });
            }
        
            // Crear nueva fila para el producto
            const newRow = tableBody.insertRow();
            newRow.dataset.productId = productId;
            
            // Llenar las celdas (el orden debe coincidir con los encabezados)
            newRow.insertCell(0).textContent = productName;
            newRow.insertCell(1).textContent = `$${subtotal.toFixed(2)}`;
            newRow.insertCell(2).textContent = weightText;
            newRow.insertCell(3).textContent = selectedAmount;
            newRow.insertCell(4).textContent = `$${totalPriceForItem.toFixed(2)}`;
            
            // Celda de acción con botón para eliminar
            const actionCell = newRow.insertCell(5);
            const removeBtn = document.createElement('button');
            removeBtn.type = 'button';
            removeBtn.className = 'btn btn-sm btn-danger';
            removeBtn.textContent = 'Remover';
            removeBtn.onclick = function() {
                borrarProducto(this);
            };
            actionCell.appendChild(removeBtn);
        
            // Actualizar total global
            totalPrice += totalPriceForItem;
            totalDisplay.textContent = `$${totalPrice.toFixed(2)}`;
        
            // Actualizar contador del carrito
            cartItemCount++;
            cartCountDisplay.textContent = cartItemCount;
        
            // Agregar botón de guardar pedido (solo una vez)
            const cartFooter = document.querySelector('#cart-container .bg-light');
            if (cartFooter && !document.querySelector('#save-order-btn')) {
                const saveBtn = document.createElement('button');
                saveBtn.id = 'save-order-btn';
                saveBtn.className = 'btn btn-success w-100 mt-2';
                saveBtn.textContent = 'Guardar Pedido';
                saveBtn.addEventListener('click', guardarPedido);
                cartFooter.appendChild(saveBtn);
            }
        
            // Mostrar el carrito si está oculto
            if (!cartContainer.classList.contains('cart-visible')) {
                toggleCart();
            }
        }

        // Event listeners
        addButton.addEventListener('click', () => {
            addToCart(addButton);
            addToTotal();
        });

        weightSelect.addEventListener('change', () => {
            if (weightSelect.value === 'other-kg') {
                customWeightInput.style.display = 'block';
            } else {
                customWeightInput.style.display = 'none';
                customWeightInput.value = '';
            }
            updatePriceDisplay();
        });

        customWeightInput.addEventListener('input', updatePriceDisplay);
        amountSelect.addEventListener('change', updatePriceDisplay);

        // Inicializa el precio
        updatePriceDisplay();
    });
}

function subtractToTotal(price) {
    totalPrice -= price;
    totalDisplay.textContent = `$${totalPrice.toFixed(2)}`;
}

function borrarProducto(boton) {
    let tabla = document.getElementById('tablaCarrito');
    let fila = boton.parentNode.parentNode;
    let precio = parseFloat(fila.cells[4].textContent.replace('$', ''));
    tabla.deleteRow(fila.rowIndex);

    subtractToTotal(precio);
    
    // Actualizar contador
    cartItemCount--;
    cartCountDisplay.textContent = cartItemCount;
    
    // Si no hay más productos, ocultar el carrito
    if (cartItemCount === 0) {
        cartContainer.classList.remove('cart-visible');
    }
}