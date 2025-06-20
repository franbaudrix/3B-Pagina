// Variables globales
let totalPrice = 0; // Variable para almacenar el total
let allProducts = [];
const totalDisplay = document.getElementById('total-price'); // Elemento donde se mostrará el total
let iterations_agregar_button = 0; //Variable para agregar los nombres de las columnas solo una vez
const cartCountDisplay = document.getElementById('cart-count');
const cartCountDisplayMobile = document.getElementById('cart-count-mobile');
let cartItemCount = 0
const cartContainer = document.getElementById('cart-container');
const cartToggle = document.getElementById('cart-toggle');
const cartToggleMobile = document.getElementById('cart-toggle-mobile');
const closeCart = document.getElementById('close-cart');
let pedidoItems = []; // Para almacenar temporalmente los items del pedido
let pedidoTotal = 0; // Para almacenar temporalmente el total del pedido
let categoriasDisponibles = [];
let subcategoriasDisponibles = [];
let currentPage = 1;
const productsPerPage = 20;
let loadingProducts = false;
let noMoreProducts = false;

const API_BASE_URL = window.location.host.includes('localhost') || window.location.host.includes('127.0.0.1')
  ? 'http://localhost:3000/api'
  : 'https://threeb-pagina.onrender.com/api';


const SIMULACION_ACTIVA = false; 

async function loadNextProducts() {
  if (loadingProducts || noMoreProducts) return;
  loadingProducts = true;

  try {
    if (SIMULACION_ACTIVA) {
      const productosFalsos = Array.from({ length: productsPerPage }, (_, i) => {
        const index = (currentPage - 1) * productsPerPage + i + 1;
        return {
          _id: `fake-${index}`,
          nombre: `Producto Simulado ${index}`,
          precio: 50 + index,
          categoria: 'simulada',
          subcategoria: 'test',
          imagen: 'img/almendra.jpg', 
        };
      });

      allProducts.push(...productosFalsos);
      displayProducts(productosFalsos);
      currentPage++;

      if (currentPage > 10) noMoreProducts = true; // limitar para no hacerlo infinito
      loadingProducts = false;
      return;
    }

    // 👇 flujo real si SIMULACION_ACTIVA es false
    const response = await fetch(`${API_BASE_URL}/producto?page=${currentPage}&limit=${productsPerPage}`);
    const data = await response.json();

    if (!data || data.length < productsPerPage) noMoreProducts = true;
    if (data.length > 0) {
      allProducts.push(...data);
      displayProducts(data);
      currentPage++;
    }

  } catch (error) {
    console.error('Error al cargar productos:', error);
  } finally {
    loadingProducts = false;
  }
}

window.addEventListener('scroll', () => {
    console.log('scroll detectado');
  const scrollY = window.scrollY;
  const innerHeight = window.innerHeight;
  const bodyHeight = document.body.offsetHeight;

  const threshold = 300; 

  if (scrollY + innerHeight + threshold >= bodyHeight) {
    console.log('Cargando más productos...');
    loadNextProducts();
  }
});


// Función para actualizar el contador del carrito en ambas versiones
function updateCartCount() {
    if (cartCountDisplay) cartCountDisplay.textContent = cartItemCount;
    if (cartCountDisplayMobile) cartCountDisplayMobile.textContent = cartItemCount;
}

// Función para mostrar/ocultar el carrito
function toggleCart() {
    if (cartContainer.style.display === 'none' || !cartContainer.style.display) {
        cartContainer.style.display = 'block';
        setTimeout(() => {
            cartContainer.classList.add('cart-visible');
        }, 10);
        document.body.style.overflow = 'hidden';
    } else {
        cartContainer.classList.remove('cart-visible');
        setTimeout(() => {
            cartContainer.style.display = 'none';
        }, 300); // Match this with your CSS transition duration
        document.body.style.overflow = '';
    }
}

// Event listeners para el carrito
if (cartToggle) cartToggle.addEventListener('click', toggleCart);
if (closeCart) closeCart.addEventListener('click', toggleCart);
if (cartToggleMobile) cartToggleMobile.addEventListener('click', toggleCart);

// Inicialización del carrito
if (cartContainer) {
    cartContainer.style.display = 'none';
    cartContainer.classList.remove('cart-visible');
}

// Opciones de peso
const weightOptions = {
    "half-kg": 0.5,
    "one-kg": 1,
    "two-kg": 2,
    "other-kg": 0
};

function normalizarAPesoEnKg(valor) {
  valor = valor.toLowerCase().replace(/\s/g, '');

  if (valor.endsWith('kg')) {
    return parseFloat(valor.replace('kg', '')) || 0;
  }

  if (valor.endsWith('g')) {
    const gramos = parseFloat(valor.replace('g', ''));
    return isNaN(gramos) ? 0 : gramos / 1000;
  }

  const soloNumero = parseFloat(valor);
  return isNaN(soloNumero) ? 0 : soloNumero;
}

// Función para guardar el pedido en la base de datos
async function prepararPedido() {
    try {
        if (cartContainer.classList.contains('cart-visible')) {
            cartContainer.classList.remove('cart-visible');
            setTimeout(() => {
                cartContainer.style.display = 'none';
            }, 300); 
            document.body.style.overflow = ''; 
        }

        const items = [];
        const filas = document.querySelectorAll('#tablaCarrito tbody tr:not(.table-header)');
        
        filas.forEach(fila => {
            const celdas = fila.cells;
            const tipoUnidad = fila.dataset.tipoUnidad;
            items.push({
                producto: fila.dataset.productId,
                nombre: celdas[0].textContent.trim(),
                precioUnitario: parseFloat(celdas[1].textContent.replace('$', '')),
                subtotal: parseFloat(celdas[1].textContent.replace('$', '')),
                peso: tipoUnidad === 'kg' ? normalizarAPesoEnKg(fila.cells[2].textContent.trim()) : 0,
                cantidad: tipoUnidad === 'kg' ? 0 : parseInt(fila.dataset.cantidad || 1),
                precioTotal: parseFloat(fila.dataset.itemTotal)
            });
        });

        if (items.length === 0) {
            throw new Error('El carrito está vacío');
        }

        // Guardar temporalmente los datos del pedido
        pedidoItems = items;
        pedidoTotal = totalPrice;

        // Mostrar el modal
        const modal = new bootstrap.Modal(document.getElementById('client-data-modal'));
        modal.show();

    } catch (error) {
        console.error('Error:', error);
        alert('Error al preparar el pedido: ' + error.message);
    }
}

// Función para enviar el pedido completo al servidor
async function enviarPedidoCompleto(clienteData) {
    try {
        // Preparar el objeto de dirección según el tipo de envío
        let direccion = {};
        if (clienteData.tipoEnvio === 'bahia-blanca') {
            direccion = {
                calle: clienteData.calle,
                numero: clienteData.numero,
                localidad: 'Bahía Blanca',
                provincia: 'Buenos Aires'
            };
        } else if (clienteData.tipoEnvio === 'otra-localidad') {
            direccion = {
                calle: clienteData.calle,
                numero: clienteData.numero,
                localidad: clienteData.localidad,
                provincia: clienteData.provincia,
                codigoPostal: clienteData.codigoPostal
            };
        }

        const pedido = {
            items: pedidoItems,
            total: pedidoTotal,
            tipoEnvio: clienteData.tipoEnvio,
            cliente: {
                nombre: clienteData.nombre,
                whatsapp: clienteData.whatsapp,
                email: clienteData.email,
                dni: clienteData.dni,
                direccion: direccion
            },
            observaciones: clienteData.observaciones
        };

        console.log('Enviando pedido:', pedido); // Verifica en consola

        const response = await fetch(`${API_BASE_URL}/pedidos`, {
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
        console.log('Respuesta del servidor:', data); // Verifica la respuesta
        return data;
        
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}

// Función para cargar categorías
async function loadCategories() {
    try {
        const response = await fetch(`${API_BASE_URL}/categorias`, {
            headers: { 'Authorization': '3BGOD' }
        });
        
        if (!response.ok) throw new Error('Error al cargar categorías');
        
        const data = await response.json();
        categoriasDisponibles = data.sort((a, b) => a.nombre.localeCompare(b.nombre));
        
        // Llenar selector de categorías
        const categoriaFilter = document.getElementById('categoria-filter');
        categoriaFilter.innerHTML = '<option value="">Todas las categorías</option>';
        
        categoriasDisponibles.forEach(categoria => {
            const option = document.createElement('option');
            option.value = categoria._id; 
            option.textContent = categoria.nombre; 
            categoriaFilter.appendChild(option);
        });
    } catch (error) {
        console.error('Error al cargar categorías:', error);
        mostrarAlerta('Error al cargar categorías', 'danger');
    }
}

// Función para actualizar subcategorías según categoría seleccionada
function updateSubcategorias() {
    const categoriaSeleccionada = document.getElementById('categoria-filter').value;
    const subcategoriaFilter = document.getElementById('subcategoria-filter');
    
    // Limpiar y resetear el selector
    subcategoriaFilter.innerHTML = '<option value="">Todas las subcategorías</option>';
    subcategoriaFilter.disabled = !categoriaSeleccionada;
    
    if (categoriaSeleccionada) {
        const subcategoriasFiltradas = [...new Set(
            allProducts
                .filter(p => p.categoria === categoriaSeleccionada)
                .map(p => p.subcategoria)
                .filter(sub => sub)
        )].sort(); 
        
        // Agregar opciones ordenadas
        subcategoriasFiltradas.forEach(subcategoria => {
            const option = document.createElement('option');
            option.value = subcategoria;
            option.textContent = subcategoria;
            subcategoriaFilter.appendChild(option);
        });
    }
}

window.addEventListener('scroll', () => {
  const scrollBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 300;
  if (scrollBottom) loadNextProducts();
});

document.addEventListener('DOMContentLoaded', async () => {
    try {

        cartContainer.style.display = 'none';
        cartContainer.classList.remove('cart-visible');
        // 1. Cargar productos
        await loadCategories();

        await loadNextProducts();
        
        // Configurar eventos de filtrado
        document.getElementById('categoria-filter').addEventListener('change', () => {
            updateSubcategorias();
            filterProducts();
        });
        
        document.getElementById('subcategoria-filter').addEventListener('change', filterProducts);
        
        // 2. Configurar buscador
        const searchInput = document.getElementById('search-input');
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            filterProducts(searchTerm);
        });

        // 3. Configurar modal de datos del cliente
        // Manejar cambio en tipo de envío
        document.getElementById('tipo-envio').addEventListener('change', function() {
            const tipoEnvio = this.value;
            const form = document.getElementById('client-data-form');
            
            // Resetear validación previa
            form.classList.remove('was-validated');
            
            // Ocultar todos los campos de envío
            document.querySelectorAll('.envio-fields').forEach(el => {
                el.style.display = 'none';
            });

            // Configurar campos requeridos según tipo de envío
            if (tipoEnvio === 'bahia-blanca') {
                document.getElementById('bahia-blanca-fields').style.display = 'block';
                // Hacer campos requeridos
                document.getElementById('calle-bahia').required = true;
                document.getElementById('numero-bahia').required = true;
                // Quitar requeridos de otra localidad
                document.getElementById('localidad-otra').required = false;
                document.getElementById('provincia-otra').required = false;
                document.getElementById('dni-otra').required = false;
                document.getElementById('cp-otra').required = false;
                document.getElementById('calle-otra').required = false;
                document.getElementById('numero-otra').required = false;
            } else if (tipoEnvio === 'otra-localidad') {
                document.getElementById('otra-localidad-fields').style.display = 'block';
                // Hacer campos requeridos
                document.getElementById('localidad-otra').required = true;
                document.getElementById('provincia-otra').required = true;
                document.getElementById('dni-otra').required = true;
                document.getElementById('cp-otra').required = true;
                document.getElementById('calle-otra').required = true;
                document.getElementById('numero-otra').required = true;
                // Quitar requeridos de bahía
                document.getElementById('calle-bahia').required = false;
                document.getElementById('numero-bahia').required = false;
            } else {
                // Retiro - ningún campo de dirección es requerido
                document.getElementById('calle-bahia').required = false;
                document.getElementById('numero-bahia').required = false;
                document.getElementById('localidad-otra').required = false;
                document.getElementById('provincia-otra').required = false;
                document.getElementById('dni-otra').required = false;
                document.getElementById('cp-otra').required = false;
                document.getElementById('calle-otra').required = false;
                document.getElementById('numero-otra').required = false;
            }
        });

        // Manejar confirmación de pedido
        document.getElementById('confirmar-pedido').addEventListener('click', async function () {
            const form = document.getElementById('client-data-form');

            // Resetear validación previa
            form.classList.remove('was-validated');

            // Forzar validación HTML5 del navegador
            if (!form.checkValidity()) {
                form.classList.add('was-validated');
                
                // Hacer scroll al primer campo inválido
                const firstInvalid = form.querySelector(':invalid');
                if (firstInvalid) {
                    firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
                
                return;
            }

            const tipoEnvio = document.getElementById('tipo-envio').value;
            const nombre = document.getElementById('nombre-cliente').value;
            const whatsapp = document.getElementById('whatsapp-cliente').value;
            const email = document.getElementById('email-cliente').value;
            const observaciones = document.getElementById('observaciones').value;

            const clienteData = {
                tipoEnvio,
                nombre,
                whatsapp,
                email,
                observaciones
            };

            // Recolectar dirección según tipo de envío
            if (tipoEnvio === 'bahia-blanca') {
                clienteData.calle = document.getElementById('calle-bahia').value;
                clienteData.numero = document.getElementById('numero-bahia').value;
            } else if (tipoEnvio === 'otra-localidad') {
                clienteData.localidad = document.getElementById('localidad-otra').value;
                clienteData.provincia = document.getElementById('provincia-otra').value;
                clienteData.dni = document.getElementById('dni-otra').value;
                clienteData.codigoPostal = document.getElementById('cp-otra').value;
                clienteData.calle = document.getElementById('calle-otra').value;
                clienteData.numero = document.getElementById('numero-otra').value;
            }

            // Procesar envío
            try {
                this.disabled = true;
                this.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Procesando...';

                const resultado = await enviarPedidoCompleto(clienteData);

                // Limpiar carrito
                document.querySelector('#tablaCarrito tbody').innerHTML = '';
                totalPrice = 0;
                totalDisplay.textContent = '$0.00';
                cartItemCount = 0;
                cartCountDisplay.textContent = '0';

                const saveBtn = document.querySelector('#save-order-btn');
                if (saveBtn) saveBtn.remove();

                const confirmModal = new bootstrap.Modal(document.getElementById('pedido-confirmado-modal'));
                confirmModal.show();

                const modal = bootstrap.Modal.getInstance(document.getElementById('client-data-modal'));
                modal.hide();
                this.disabled = false;
                this.textContent = 'Confirmar Pedido';

            } catch (error) {
                console.error('Error al enviar pedido:', error);
                alert('Error al guardar el pedido: ' + error.message);
                this.disabled = false;
                this.textContent = 'Confirmar Pedido';
            }
        });


    } catch (error) {
        console.error('Error al cargar productos:', error);
        document.getElementById('productos-container').innerHTML = '<p class="text-danger">Error al cargar los productos. Intenta más tarde.</p>';
    }

});

async function filterProducts() {
    const categoria = document.getElementById('categoria-filter').value;
    const subcategoria = document.getElementById('subcategoria-filter').value;
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    
    let filtered = allProducts;
    
    // Aplicar filtros
    if (categoria) {
        filtered = filtered.filter(p => p.categoria === categoria);
    }
    
    if (subcategoria) {
        filtered = filtered.filter(p => p.subcategoria === subcategoria);
    }
    
    if (searchTerm) {
        filtered = filtered.filter(p => 
            p.nombre.toLowerCase().includes(searchTerm) || 
            (p.descripcion && p.descripcion.toLowerCase().includes(searchTerm)));
        
        // MOSTRAR SIN AGRUPACIÓN POR CATEGORÍA CUANDO HAY BÚSQUEDA
        displayProducts(filtered, {groupByCategory: false});
        return;
    }
    
    displayProducts(filtered);
}

function displayProducts(productos, options = {}) {
    const {groupByCategory = true} = options;
    const container = document.getElementById('productos-container');
    
    if (productos.length === 0) {
        container.innerHTML = '<p class="text-center text-light">No se encontraron productos</p>';
        return;
    }

    if (!groupByCategory) {
        // MODO BÚSQUEDA - Sin agrupación por categoría
        container.innerHTML = productos.map(producto => {
        const sinStock = producto.stock <= 0;
            const btnClass = sinStock ? 'btn-disabled' : 'btn-product-card';
            const btnText = sinStock ? 'Sin stock' : 'Agregar';
            
            // Limitar descripción
            const maxDescLength = 150; 
            const descripcion = producto.descripcion ? 
                (producto.descripcion.length > maxDescLength ? 
                    producto.descripcion.substring(0, maxDescLength) + '...' : 
                    producto.descripcion) : 
                '';
            
            return `
            <div class="col-md-4 product-card" data-product-id="${producto._id}" data-base-price="${producto.precio}" data-product-name="${producto.nombre}" data-unidad-medida="${producto.unidadMedida || 'kg'}" data-stock="${producto.stock || 0}">
                <div class="card h-100">
                    <div class="front-content">
                        <img src="${producto.imagen.toString()}" class="img-fluid card-img-top" alt="${producto.nombre}">
                        <div class="card-body">
                            <h3 class="card-title">${producto.nombre}</h3>
                            <h5 class="card-text">$${producto.precio.toFixed(2)}</h5>
                            <p class="card-text text-muted description">${descripcion}</p>
                            <label class="btn-add-front">Agregar</label>
                        </div>
                    </div>
                    <!-- Contenido trasero (visible al hacer hover) -->
                    <div class="back-content">
                        <div class="card-body p-2">
                            <h2 class="card-title mb-1">${producto.nombre}</h2>
                            <h4 class="card-text mb-2">$${producto.precio.toFixed(2)}</h4>
                        </div>
                        ${producto.unidadMedida === 'kg' ? `
                        <div class="p-3">
                            <label for="weight" class="form-label small mb-1">Peso:</label>
                            <select name="weight" class="form-select form-select-sm weight-select mb-2">
                                <option value="half-kg">0.5Kg</option>
                                <option value="one-kg" selected>1Kg</option>
                                <option value="two-kg">2Kg</option>
                                <option value="other-kg">Otro</option>
                            </select>
                            <input type="number" class="form-control custom-weight-input mt-2" placeholder="Ingrese el peso en kg" style="display: none;">
                        </div>
                        ` : `
                        <div class="p-3">
                            <label for="amount" class="form-label small mb-1">Cantidad:</label>
                            <select name="amount" class="form-select form-select-sm amount-select">
                                <option value="1">1 unidad</option>
                                <option value="2">2 unidades</option>
                                <option value="3">3 unidades</option>
                                <option value="4">4 unidades</option>
                                <option value="5">5 unidades</option>
                                <option value="custom">Otra cantidad</option>
                            </select>
                            <input type="number" min="1" class="form-control custom-amount-input mt-2" 
                            placeholder="Ingrese cantidad" style="display: none;">
                        </div>
                        `}
                        <div class="mb-2 p-3 price-display text-end fw-bold"></div>
                        <div class="fixed-bottom-btn">
                            <button class="btn btn-danger ${btnClass} rounded-0 w-100" 
                                    ${sinStock ? 'disabled' : ''}>
                                ${btnText}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            `;
        }).join('');
        
        initializeProductCards();
        return;
    }
    
    // Agrupar productos por categoría
    const productosPorCategoria = {};
    
    // Primero ordenar alfabéticamente por categoría
    const categoriasOrdenadas = [...new Set(productos.map(p => p.categoria))].sort();
    
    // Llenar el objeto agrupado
    categoriasOrdenadas.forEach(categoria => {
        productosPorCategoria[categoria] = productos.filter(p => p.categoria === categoria);
    });
    
    // Generar HTML para cada categoría
    let htmlFinal = '';

    for (const categoria in productosPorCategoria) {
        const nombreCategoria = categoriasDisponibles.find(c => c._id === categoria)?.nombre || categoria;
        
        htmlFinal += `
        <div class="category-section mb-4">
            <h3 class="category-title">${nombreCategoria}</h3>
            <div class="row">
        `;
        
        const productosEnCategoria = productosPorCategoria[categoria]
            .sort((a, b) => a.nombre.localeCompare(b.nombre));
        
        htmlFinal += productosEnCategoria.map(producto => {
            const sinStock = producto.stock <= 0;
            const btnClass = sinStock ? 'btn-disabled' : 'btn-product-card';
            const btnText = sinStock ? 'Sin stock' : 'Agregar';
            
            // Limitar descripción
            const maxDescLength = 150; 
            const descripcion = producto.descripcion ? 
                (producto.descripcion.length > maxDescLength ? 
                    producto.descripcion.substring(0, maxDescLength) + '...' : 
                    producto.descripcion) : 
                '';
            
            return `
            <div class="col-md-4 product-card" data-product-id="${producto._id}" data-base-price="${producto.precio}" data-product-name="${producto.nombre}" data-unidad-medida="${producto.unidadMedida || 'kg'}" data-stock="${producto.stock || 0}">
                <div class="card h-100">
                    <div class="front-content">
                        <img src="${producto.imagen.toString()}" class="img-fluid card-img-top" alt="${producto.nombre}">
                        <div class="card-body">
                            <h3 class="card-title">${producto.nombre}</h3>
                            <h5 class="card-text">$${producto.precio.toFixed(2)}</h5>
                            <p class="card-text text-muted description">${descripcion}</p>
                            <label class="btn-add-front">Agregar</label>
                        </div>
                    </div>
                    <!-- Contenido trasero (visible al hacer hover) -->
                    <div class="back-content">
                        <div class="card-body p-2">
                            <h2 class="card-title mb-1">${producto.nombre}</h2>
                            <h4 class="card-text mb-2">$${producto.precio.toFixed(2)}</h4>
                        </div>
                        ${producto.unidadMedida === 'kg' ? `
                        <div class="p-3">
                            <label for="weight" class="form-label small mb-1">Peso:</label>
                            <select name="weight" class="form-select form-select-sm weight-select mb-2">
                                <option value="half-kg">0.5Kg</option>
                                <option value="one-kg" selected>1Kg</option>
                                <option value="two-kg">2Kg</option>
                                <option value="other-kg">Otro</option>
                            </select>
                            <input type="number" class="form-control custom-weight-input mt-2" placeholder="Ingrese el peso en kg" style="display: none;">
                        </div>
                        ` : `
                        <div class="p-3">
                            <label for="amount" class="form-label small mb-1">Cantidad:</label>
                            <select name="amount" class="form-select form-select-sm amount-select">
                                <option value="1">1 unidad</option>
                                <option value="2">2 unidades</option>
                                <option value="3">3 unidades</option>
                                <option value="4">4 unidades</option>
                                <option value="5">5 unidades</option>
                                <option value="custom">Otra cantidad</option>
                            </select>
                            <input type="number" min="1" class="form-control custom-amount-input mt-2" 
                            placeholder="Ingrese cantidad" style="display: none;">
                        </div>
                        `}
                        <div class="mb-2 p-3 price-display text-end fw-bold"></div>
                        <div class="fixed-bottom-btn">
                            <button class="btn btn-danger ${btnClass} rounded-0 w-100" 
                                    ${sinStock ? 'disabled' : ''}>
                                ${btnText}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            `;
        }).join('');
        
        htmlFinal += `
            </div>
        </div>
        `;
    }

    container.innerHTML = htmlFinal;
    initializeProductCards();
}

function initializeProductCards() {
    // Selecciona todas las tarjetas de producto
    const productCards = document.querySelectorAll('.product-card');

    productCards.forEach(card => {
        const basePrice = parseFloat(card.getAttribute('data-base-price'));
        const productName = card.getAttribute('data-product-name');
        const unidadMedida = card.getAttribute('data-unidad-medida') || 'kg'; // Asegurar valor por defecto
        const priceDisplay = card.querySelector('.price-display');
        const addButton = card.querySelector('button');
        const amountSelect = unidadMedida !== 'kg' ? card.querySelector('.amount-select') : null;
        const customAmountInput = unidadMedida !== 'kg' ? card.querySelector('.custom-amount-input') : null;
        
        if (amountSelect) {amountSelect.addEventListener('change', updatePriceDisplay);}

        // Elementos específicos por kg
        let weightSelect, customWeightInput;
        if (unidadMedida === 'kg') {
            weightSelect = card.querySelector('.weight-select');
            customWeightInput = card.querySelector('.custom-weight-input');
        }else {
            const amountSelect = card.querySelector('.amount-select');
            
            amountSelect.addEventListener('change', () => {
                if (amountSelect.value === 'custom') {
                    customAmountInput.style.display = 'block';
                    customAmountInput.focus();
                } else {
                    customAmountInput.style.display = 'none';
                    customAmountInput.value = '';
                }
                updatePriceDisplay();
            });
            
            customAmountInput.addEventListener('input', updatePriceDisplay);
        }

        // Función para calcular el precio de la tarjeta actual
        function calculateCurrentPrice() {
            
            if (unidadMedida === 'kg') {
                const selectedWeight = weightSelect.value;
                let weightFactor = weightOptions[selectedWeight];

                if (selectedWeight === "other-kg") {
                    weightFactor = parseFloat(customWeightInput.value) || 0;
                }

                return basePrice * weightFactor;
            } else {
                let selectedValue = parseInt(amountSelect.value);
                if (amountSelect.value === 'custom') {
                    selectedValue = parseInt(customAmountInput.value) || 1;
                }
                return basePrice * selectedValue;
            }
        }

        // Función para actualizar el precio mostrado en la tarjeta
        function updatePriceDisplay() {
            const currentPrice = calculateCurrentPrice();
            priceDisplay.innerHTML = `
                <strong>Total: $${currentPrice.toFixed(2)}</strong>
            `;
        }

        // Función para añadir producto al carrito
        function addToCart(button) {
            button.classList.add('btn-pulse');
            setTimeout(() => button.classList.remove('btn-pulse'), 400);
            const productCard = button.closest('.product-card');
            const frontContent = productCard.querySelector('.front-content');
            const backContent = productCard.querySelector('.back-content');
            const currentStock = parseFloat(productCard.dataset.stock) || 0;
    
            if (currentStock <= 0) {
                mostrarAlerta('Este producto no tiene stock disponible', 'warning');
                return;
            }

            if (!productCard) {
                console.error('No se encontró el elemento product-card');
                return;
            }

            // Restaurar visibilidad mediante clases/estilos compatibles con hover
            frontContent.style.removeProperty('opacity');
            frontContent.style.removeProperty('visibility');
            backContent.style.removeProperty('opacity');
            backContent.style.removeProperty('visibility');
        
            const productId = productCard.dataset.productId;
            const productName = productCard.dataset.productName;
            const basePrice = parseFloat(productCard.dataset.basePrice);
            const unidadMedida = productCard.dataset.unidadMedida || 'kg';

            let weightText = '1 unidad';
            let subtotal = basePrice;
            let selectedAmount = 1;
            let totalPriceForItem = basePrice;

            if (unidadMedida === 'kg') {
                const weightSelect = productCard.querySelector('.weight-select');
                const customWeightInput = productCard.querySelector('.custom-weight-input');
                
                const selectedWeight = weightSelect.value;
                let weightFactor = weightOptions[selectedWeight];
                weightText = weightSelect.options[weightSelect.selectedIndex].text;
                
                weightSelect.value = 'one-kg'; // Peso por defecto: 1kg
                productCard.querySelector('.weight-select').value = 'one-kg';
                productCard.querySelector('.custom-weight-input').style.display = 'none';

                if (selectedWeight === "other-kg") {
                    weightFactor = parseFloat(customWeightInput.value) || 0;
                    weightText = `${customWeightInput.value} kg`;
                }
        
                subtotal = basePrice * weightFactor;
                totalPriceForItem = subtotal;
            } else {
                const amountSelect = productCard.querySelector('.amount-select');
                const customAmountInput = productCard.querySelector('.custom-amount-input');

                productCard.querySelector('.custom-amount-input').style.display = 'none';

                if (amountSelect.value === 'custom') {
                    selectedAmount = parseInt(customAmountInput.value) || 1;
                    weightText = `${selectedAmount} unidades`;
                } else {
                    selectedAmount = parseInt(amountSelect.value) || 1;
                    weightText = `${selectedAmount} unidad${selectedAmount > 1 ? 'es' : ''}`;
                }
                
                totalPriceForItem = basePrice * selectedAmount;
            }

            void productCard.offsetHeight;
        
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
                const headers = ['Producto', 'Precio Unitario', 'Peso / Unidad'];
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
            newRow.dataset.itemTotal = totalPriceForItem.toFixed(2);
            newRow.dataset.tipoUnidad = unidadMedida; // 'kg' o 'unidad'
            newRow.dataset.cantidad = selectedAmount;
            
            // Celda de acción con botón para eliminar
            const actionCell = newRow.insertCell(3);
            const removeBtn = document.createElement('button');
            removeBtn.type = 'button';
            removeBtn.className = 'btn btn-sm btn-danger';
            removeBtn.innerHTML = '<i class="fas fa-trash-alt"></i>';
            removeBtn.onclick = function() {
                borrarProducto(this);
            };
            actionCell.appendChild(removeBtn);
        
            // Actualizar total global
            totalPrice += totalPriceForItem;
            totalDisplay.textContent = `$${totalPrice.toFixed(2)}`;
        
            // Actualizar contador del carrito
            cartItemCount++;
            updateCartCount();

            // Agregar botón de guardar pedido (solo una vez)
            const cartFooter = document.querySelector('#cart-container .bg-light');
            if (cartFooter && !document.querySelector('#save-order-btn')) {
                const saveBtn = document.createElement('button');
                saveBtn.id = 'save-order-btn';
                saveBtn.className = 'btn btn-success w-100 mt-2';
                saveBtn.textContent = 'Confirmar Pedido';
                saveBtn.addEventListener('click', prepararPedido);
                cartFooter.appendChild(saveBtn);
            }

            updatePriceDisplay();
    
        }

        // Event listeners
        // Event listeners solo para productos por kg
        if (unidadMedida === 'kg') {
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
        }
        addButton.addEventListener('click', () => {
            addToCart(addButton);
        });

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
    let precioTexto = fila.cells[1].textContent;
    let precio = parseFloat(precioTexto.replace('$', '')) || 0;

    tabla.deleteRow(fila.rowIndex);

    subtractToTotal(precio);
    
    // Actualizar contador
    cartItemCount--;
    updateCartCount();
    
    // Si no hay más productos, limpiar todo
    const tbody = tabla.querySelector('tbody');
    if (tbody && tbody.rows.length <= 1) { // solo queda el header o está vacío
        totalPrice = 0;
        totalDisplay.textContent = '$0.00';
        cartItemCount = 0;
        updateCartCount();

        // Limpiar tabla
        tbody.innerHTML = '';

        // Ocultar carrito
        cartContainer.classList.remove('cart-visible');
        setTimeout(() => {
            cartContainer.style.display = 'none';
        }, 300);
        document.body.style.overflow = '';
    }
}