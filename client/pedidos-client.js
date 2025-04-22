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

    function mostrarExito(mensaje) {
        const toast = document.createElement('div');
        toast.className = 'position-fixed bottom-0 end-0 p-3';
        toast.innerHTML = `
            <div class="toast show" role="alert">
                <div class="toast-header bg-success text-white">
                    <i class="fas fa-check-circle me-2"></i>
                    <strong class="me-auto">Éxito</strong>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast"></button>
                </div>
                <div class="toast-body">
                    ${mensaje}
                </div>
            </div>
        `;
        document.body.appendChild(toast);
        
        setTimeout(() => toast.remove(), 3000);
    }
    
    function mostrarError(mensaje) {
        const alert = document.getElementById('error-alert') || document.createElement('div');
        alert.id = 'error-alert';
        alert.className = 'alert alert-danger position-fixed top-0 start-50 translate-middle-x mt-3';
        alert.innerHTML = `
            <i class="fas fa-exclamation-triangle me-2"></i>
            ${mensaje}
            <button type="button" class="btn-close float-end" data-bs-dismiss="alert"></button>
        `;
        document.body.appendChild(alert);
    }

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
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al cargar pedido');
            }
            
            pedidoActual = await response.json();
            
            // Llenar modal
            document.getElementById('modal-pedido-id').textContent = pedidoActual._id;
            document.getElementById('modal-fecha').textContent = new Date(pedidoActual.fecha).toLocaleString();
            document.getElementById('modal-total').textContent = pedidoActual.total.toFixed(2);
            
            // Estado
            const estadoElement = document.getElementById('modal-estado');
            estadoElement.textContent = formatEstado(pedidoActual.estado);
            estadoElement.className = 'badge ' + getEstadoClass(pedidoActual.estado);
            document.getElementById('cambiar-estado').value = pedidoActual.estado;
            
            // Productos
            const productosContainer = document.getElementById('modal-productos');
            productosContainer.innerHTML = '';
            
            pedidoActual.items.forEach((item, index) => {
                const productoDiv = document.createElement('div');
                productoDiv.className = 'producto-item mb-3 p-3 border rounded';
                productoDiv.innerHTML = `
                    <div class="d-flex justify-content-between align-items-center">
                        <div class="form-check">
                            <input class="form-check-input item-checkbox" 
                                   type="checkbox" 
                                   id="item-${index}" 
                            <label class="form-check-label" for="item-${index}">
                                <h6 class="mb-1">${item.nombre}</h6>
                                <small class="text-muted">${item.peso} • ${item.cantidad} unidad(es)</small>
                            </label>
                        </div>
                        <div class="text-end">
                            <small>$${item.precioUnitario?.toFixed(2) || '0.00'} c/u</small>
                            <h6 class="mb-0 mt-1">$${item.precioTotal?.toFixed(2) || '0.00'}</h6>
                        </div>
                    </div>
                `;
                
                // Si el item no está disponible, marca en rojo
                if (item.disponible === false) {
                    productoDiv.classList.add('bg-light', 'text-danger');
                    productoDiv.querySelector('.form-check-input').disabled = true;
                }
                
                productosContainer.appendChild(productoDiv);
            });
            
            detallesModal.show();
        } catch (error) {
            console.error('Error:', error);
            mostrarError(error.message || 'Error al cargar los detalles del pedido');
        }
    }

    async function actualizarEstadoPedido() {
        const btn = document.getElementById('btn-guardar-estado');
        if (!btn) {
            console.error('Botón no encontrado');
            return;
        }
    
        try {
            // Mostrar loading
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Actualizando...';
    
            const nuevoEstado = document.getElementById('cambiar-estado').value;
            const response = await fetch(`http://localhost:3000/api/pedidos/${pedidoActual._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
                },
                body: JSON.stringify({ estado: nuevoEstado })
            });
    
            const data = await response.json();
    
            if (!response.ok || !data.success) {
                throw new Error(data.message || 'Error al actualizar');
            }
    
            // Actualizar la vista
            const index = pedidosData.findIndex(p => p._id === pedidoActual._id);
            if (index !== -1) {
                pedidosData[index] = data.pedido;
                mostrarPedidos(pedidosData);
            }
    
            // Cerrar modal después de 1 segundo para que el usuario vea el feedback
            setTimeout(() => {
                detallesModal.hide();
                mostrarExito('Estado actualizado correctamente');
            }, 1000);
    
        } catch (error) {
            console.error('Error al actualizar:', error);
            mostrarError(error.message);
        }finally{
            
            // Restaurar botón inmediatamente en caso de error
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-save"></i> Guardar estado';
        }
    }
    
    // Función para mostrar notificaciones de éxito
    function mostrarExito(mensaje) {
        const alerta = document.createElement('div');
        alerta.className = 'alert alert-success position-fixed top-0 end-0 m-3';
        alerta.style.zIndex = '1100';
        alerta.innerHTML = `
            <i class="fas fa-check-circle me-2"></i>
            ${mensaje}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        document.body.appendChild(alerta);
        
        setTimeout(() => alerta.remove(), 3000);
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