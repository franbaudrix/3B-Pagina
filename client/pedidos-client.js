document.addEventListener('DOMContentLoaded', function() {
    const pedidosContainer = document.getElementById('pedidos-container');
    const filtroEstado = document.getElementById('filtro-estado');
    const buscarId = document.getElementById('buscar-id');
    const btnRefrescar = document.getElementById('btn-refrescar');
    const detallesModal = new bootstrap.Modal(document.getElementById('detallesModal'));
    let pedidosData = [];
    let pedidoActual = null;

    // Cargar pedidos iniciales
    cargarPedidos();

    // Event listeners
    filtroEstado.addEventListener('change', filtrarPedidos);
    buscarId.addEventListener('input', filtrarPedidos);
    btnRefrescar.addEventListener('click', cargarPedidos);
    document.getElementById('btn-guardar-estado').addEventListener('click', actualizarEstadoPedido);

    async function cargarPedidos() {
        try {
            const response = await fetch('http://localhost:3000/api/pedidos');
            if (!response.ok) throw new Error('Error al cargar pedidos');
            
            pedidosData = await response.json();
            mostrarPedidos(pedidosData);
        } catch (error) {
            console.error('Error:', error);
            mostrarError('Error al cargar los pedidos. Intente nuevamente.');
        }
    }

    function mostrarPedidos(pedidos) {
        pedidosContainer.innerHTML = '';
        
        if (pedidos.length === 0) {
            pedidosContainer.innerHTML = `
                <div class="col-12 text-center py-5">
                    <i class="fas fa-box-open fa-3x mb-3 text-muted"></i>
                    <h4 class="text-muted">No hay pedidos registrados</h4>
                </div>
            `;
            return;
        }

        pedidos.forEach(pedido => {
            const fecha = new Date(pedido.fecha).toLocaleString();
            const estadoClass = getEstadoClass(pedido.estado);
            
            const pedidoCard = document.createElement('div');
            pedidoCard.className = 'col-md-6 col-lg-4';
            pedidoCard.innerHTML = `
                <div class="pedido-card card shadow-sm h-100">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-start mb-3">
                            <h5 class="card-title mb-0">Pedido #${pedido._id.substring(0, 8)}</h5>
                            <span class="badge ${estadoClass}">${formatEstado(pedido.estado)}</span>
                        </div>
                        <p class="text-muted small mb-2">${fecha}</p>
                        <p class="mb-2"><strong>Total:</strong> $${pedido.total.toFixed(2)}</p>
                        <p class="mb-3"><strong>Productos:</strong> ${pedido.items.length}</p>
                        <div class="d-flex justify-content-between">
                            <button class="btn btn-sm btn-outline-primary btn-ver-detalles" data-id="${pedido._id}">
                                <i class="fas fa-eye me-1"></i> Ver detalles
                            </button>
                            <button class="btn btn-sm btn-outline-success btn-imprimir" data-id="${pedido._id}">
                                <i class="fas fa-print me-1"></i> Imprimir
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            pedidosContainer.appendChild(pedidoCard);
        });

        // Agregar eventos a los botones de detalles
        document.querySelectorAll('.btn-ver-detalles').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                mostrarDetallesPedido(id);
            });
        });
    }

    function filtrarPedidos() {
        const estado = filtroEstado.value;
        const idBusqueda = buscarId.value.toLowerCase();
        
        let pedidosFiltrados = pedidosData;
        
        if (estado !== 'todos') {
            pedidosFiltrados = pedidosFiltrados.filter(p => p.estado === estado);
        }
        
        if (idBusqueda) {
            pedidosFiltrados = pedidosFiltrados.filter(p => 
                p._id.toLowerCase().includes(idBusqueda)
            );
        }
        
        mostrarPedidos(pedidosFiltrados);
    }

    async function mostrarDetallesPedido(id) {
        try {
            const response = await fetch(`http://localhost:3000/api/pedidos/${id}`);
            if (!response.ok) throw new Error('Error al cargar pedido');
            
            pedidoActual = await response.json();
            
            // Llenar modal con los datos
            document.getElementById('modal-pedido-id').textContent = pedidoActual._id;
            document.getElementById('modal-fecha').textContent = new Date(pedidoActual.fecha).toLocaleString();
            document.getElementById('modal-total').textContent = pedidoActual.total.toFixed(2);
            
            const estadoElement = document.getElementById('modal-estado');
            estadoElement.textContent = formatEstado(pedidoActual.estado);
            estadoElement.className = 'badge ' + getEstadoClass(pedidoActual.estado);
            
            document.getElementById('cambiar-estado').value = pedidoActual.estado;
            
            // Mostrar productos
            const productosContainer = document.getElementById('modal-productos');
            productosContainer.innerHTML = '';
            
            pedidoActual.items.forEach(item => {
                const productoDiv = document.createElement('div');
                productoDiv.className = 'producto-item';
                productoDiv.innerHTML = `
                    <div class="d-flex justify-content-between">
                        <div>
                            <h6>${item.nombre}</h6>
                            <p class="small text-muted mb-1">${item.peso} • ${item.cantidad} unidad(es)</p>
                        </div>
                        <div class="text-end">
                            <p class="mb-1">$${item.precioUnitario.toFixed(2)} c/u</p>
                            <p class="fw-bold">$${item.precioTotal.toFixed(2)}</p>
                        </div>
                    </div>
                `;
                productosContainer.appendChild(productoDiv);
            });
            
            detallesModal.show();
        } catch (error) {
            console.error('Error:', error);
            mostrarError('Error al cargar los detalles del pedido');
        }
    }

    async function actualizarEstadoPedido() {
        try {
            const nuevoEstado = document.getElementById('cambiar-estado').value;
            
            const response = await fetch(`http://localhost:3000/api/pedidos/${pedidoActual._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ estado: nuevoEstado })
            });
            
            if (!response.ok) throw new Error('Error al actualizar estado');
            
            // Actualizar en la lista
            const pedidoIndex = pedidosData.findIndex(p => p._id === pedidoActual._id);
            if (pedidoIndex !== -1) {
                pedidosData[pedidoIndex].estado = nuevoEstado;
                mostrarPedidos(pedidosData);
            }
            
            detallesModal.hide();
        } catch (error) {
            console.error('Error:', error);
            mostrarError('Error al actualizar el estado del pedido');
        }
    }

    // Funciones de ayuda
    function getEstadoClass(estado) {
        const clases = {
            pendiente: 'bg-secondary',
            en_proceso: 'bg-primary',
            completado: 'bg-success',
            cancelado: 'bg-danger'
        };
        return clases[estado] || 'bg-secondary';
    }

    function formatEstado(estado) {
        const nombres = {
            pendiente: 'Pendiente',
            en_proceso: 'En proceso',
            completado: 'Completado',
            cancelado: 'Cancelado'
        };
        return nombres[estado] || estado;
    }

    function mostrarError(mensaje) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'alert alert-danger';
        errorDiv.textContent = mensaje;
        pedidosContainer.prepend(errorDiv);
        
        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
    }
});