let pedidosContainer;
let filtroEstado;
let buscarNombre;
let btnRefrescar;
let detallesModal;

//Variables de estado
let pedidosData = [];
let pedidoActual = null;

document.addEventListener('DOMContentLoaded', function() {
    // Verificar autenticación
    const auth = checkAuth();
    if (!auth || auth.user.role !== 'employee') {
        window.location.href = 'login.html';
        return;
    }

    pedidosContainer = document.getElementById('pedidos-container');
    filtroEstado = document.getElementById('filtro-estado');
    buscarNombre = document.getElementById('buscar-nombre');
    btnRefrescar = document.getElementById('btn-refrescar');
    detallesModal = new bootstrap.Modal(document.getElementById('detallesModal'));

    filtroEstado.value = 'pendiente';

    // Cargar pedidos iniciales
    cargarPedidos();

    // Event listeners
    filtroEstado.addEventListener('change', filtrarPedidos);
    buscarNombre.addEventListener('input', filtrarPedidos);
    btnRefrescar.addEventListener('click', cargarPedidos);

    // Evento para checkboxes
    document.addEventListener('change', (e) => {
        if (e.target.classList.contains('item-completado')) {
            const index = Array.from(document.querySelectorAll('.item-completado')).indexOf(e.target);
            const motivoContainer = document.getElementById(`motivo-container-${index}`);
            if (motivoContainer) {
                motivoContainer.classList.toggle('d-none', e.target.checked);
            }
        }
    });

    document.body.addEventListener('click', function(e) {
        const btnCompletar = e.target.closest('#btn-completar-pedido');
        if (btnCompletar) {
            e.preventDefault();
            completarPedido();
        }
    });

});

// FUNCIONES PRINCIPALES
// Carga y Visualización de Pedidos
async function cargarPedidos() {
    try {
        const response = await fetch('http://localhost:3000/api/pedidos', {
            headers: { 
                'Content-Type': 'application/json',
                ...getAuthHeader()
            }
        });
        if (!response.ok) throw new Error('Error al cargar pedidos');
        
        pedidosData = (await response.json()).filter(pedido => pedido.estado !== 'revision');

        // Mostrar filtrados en vez de todos
        filtrarPedidos();
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

    //pedidos.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    pedidos.forEach(pedido => {
        const fecha = new Date(pedido.fecha).toLocaleString();
        const estadoClass = getEstadoClass(pedido.estado);
        
        const pedidoCard = document.createElement('div');
        pedidoCard.className = 'col-md-6 col-lg-4 mb-4';
        pedidoCard.innerHTML = `
            <div class="pedido-card card shadow-sm h-100">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start mb-3">
                        <h5 class="card-title mb-0">Nombre: ${pedido.cliente.nombre}</h5>
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
    const nombreBusqueda = buscarNombre.value.toLowerCase();
    
    let pedidosFiltrados = pedidosData.filter(p => p.estado !== 'revision');
    
    if (estado !== 'todos') {
        pedidosFiltrados = pedidosFiltrados.filter(p => p.estado === estado);
    }
    
    if (nombreBusqueda) {
        pedidosFiltrados = pedidosFiltrados.filter(p => 
            p.cliente.nombre.toLowerCase().includes(nombreBusqueda)
        );
    }
    
    mostrarPedidos(pedidosFiltrados);
}

//Gestion detalles pedido
async function mostrarDetallesPedido(id) {
    try {
        const response = await fetch(`http://localhost:3000/api/pedidos/${id}`,{
            headers: { 
                'Content-Type': 'application/json',
                ...getAuthHeader()
            }
        });
        
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
            productoDiv.className = `producto-item mb-3 p-3 border rounded ${item.completado ? '' : 'bg-light text-danger'}`;
            
            productoDiv.innerHTML = `
                <div class="d-flex justify-content-between align-items-center">
                    <div class="form-check">
                        <input class="form-check-input item-completado" 
                               type="checkbox" 
                               id="item-${index}"
                               ${item.completado ? 'checked' : ''}>
                        <label class="form-check-label" for="item-${index}">
                            <h6 class="mb-1 ${item.completado ? '' : 'text-decoration-line-through'}">${item.nombre}</h6>
                            <small class="text-muted">${item.peso} • ${item.cantidad} unidad(es)</small>
                        </label>
                    </div>
                    <div class="text-end">
                        <small>$${item.precioUnitario?.toFixed(2)} c/u</small>
                        <h6 class="mb-0 mt-1">$${item.precioTotal?.toFixed(2)}</h6>
                    </div>
                </div>
                
                <!-- Sección de motivo (solo visible si no está completado) -->
                <div class="mt-2 ${item.completado ? 'd-none' : ''}" id="motivo-container-${index}">
                    <select class="form-select form-select-sm motivo-select" ${item.completado ? 'disabled' : ''}>
                        <option value="" ${!item.motivoIncompleto ? 'selected' : ''}>Seleccione motivo...</option>
                        <option value="sin stock" ${item.motivoIncompleto === 'sin stock' ? 'selected' : ''}>Sin stock</option>
                        <option value="dañado" ${item.motivoIncompleto === 'dañado' ? 'selected' : ''}>Producto dañado</option>
                        <option value="no solicitado" ${item.motivoIncompleto === 'no solicitado' ? 'selected' : ''}>No fue solicitado</option>
                        <option value="otro" ${item.motivoIncompleto === 'otro' ? 'selected' : ''}>Otro</option>
                    </select>
                    <textarea class="form-control mt-2 observaciones" 
                              placeholder="Observaciones" 
                              rows="2" 
                              ${item.completado ? 'disabled' : ''}>${item.observaciones || ''}</textarea>
                </div>
            `;
            
            productosContainer.appendChild(productoDiv);
        });

        document.querySelectorAll('.item-completado').forEach(checkbox => {
            checkbox.addEventListener('change', function() {
                const index = this.id.split('-')[1];
                const motivoContainer = document.getElementById(`motivo-container-${index}`);
                
                if (motivoContainer) {
                    motivoContainer.classList.toggle('d-none', this.checked);
                    
                    // Deshabilitar/activar selects y textareas según el estado
                    const selects = motivoContainer.querySelectorAll('.motivo-select');
                    const textareas = motivoContainer.querySelectorAll('.observaciones');
                    
                    selects.forEach(select => select.disabled = this.checked);
                    textareas.forEach(textarea => textarea.disabled = this.checked);
                    
                    // Actualizar estilo del ítem
                    const itemDiv = this.closest('.producto-item');
                    if (itemDiv) {
                        itemDiv.classList.toggle('bg-light', !this.checked);
                        itemDiv.classList.toggle('text-danger', !this.checked);
                    }
                }
            });
        });
        
        detallesModal.show();
    } catch (error) {
        console.error('Error:', error);
        mostrarError(error.message || 'Error al cargar los detalles del pedido');
    }
}

function actualizarVistaItems(items) {
    items.forEach((item, index) => {
        const checkbox = document.querySelector(`#item-${index}`);
        if (checkbox) {
            checkbox.checked = item.completado;
            
            // Actualizar estilo del ítem
            const itemDiv = checkbox.closest('.producto-item');
            if (itemDiv) {
                itemDiv.classList.toggle('bg-light', !item.completado);
                itemDiv.classList.toggle('text-danger', !item.completado);
                
                // Actualizar motivo y observaciones
                const motivoSelect = itemDiv.querySelector('.motivo-select');
                const observacionesTextarea = itemDiv.querySelector('.observaciones');
                
                if (motivoSelect) motivoSelect.value = item.motivoIncompleto || '';
                if (observacionesTextarea) observacionesTextarea.value = item.observaciones || '';
                
                // Mostrar/ocultar sección de motivo
                const motivoContainer = itemDiv.querySelector(`#motivo-container-${index}`);
                if (motivoContainer) {
                    motivoContainer.classList.toggle('d-none', item.completado);
                }
            }
        }
    });
}

//Operaciones con pedidos
async function guardarEstadoItems() {
    try {
        // Mostrar estado de carga en el botón de completar
        const btnCompletar = document.getElementById('btn-completar-pedido');
        if (btnCompletar) {
            btnCompletar.disabled = true;
            btnCompletar.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i> Guardando ítems...';
        }

        const itemsActualizados = Array.from(document.querySelectorAll('.item-completado')).map((checkbox, index) => {
            const completado = checkbox.checked;
            const motivoContainer = document.getElementById(`motivo-container-${index}`);
            
            return {
                _id: pedidoActual.items[index]._id,
                completado,
                motivoIncompleto: completado ? null : (motivoContainer?.querySelector('.motivo-select')?.value || null),
                observaciones: completado ? null : (motivoContainer?.querySelector('.observaciones')?.value || null)
            };
        });

        const response = await fetch(`http://localhost:3000/api/pedidos/${pedidoActual._id}/items`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                ...getAuthHeader()
            },
            body: JSON.stringify({ items: itemsActualizados })
        });

        if (!response.ok) throw new Error(await response.text());

        const data = await response.json();
        
        // Actualizar el pedidoActual con los nuevos datos
        if (data.pedido) {
            pedidoActual = data.pedido;
            // Actualizar visualmente los ítems
            actualizarVistaItems(data.pedido.items);
        }
        
        return data;

    } catch (error) {
        console.error('Error al guardar ítems:', error);
        mostrarError(error.message);
        throw error;
    }
}

async function completarPedido() {
    const btn = document.getElementById('btn-completar-pedido');
    if (!btn) throw new Error('Botón no encontrado');

    try {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Completando...';

        // 1. Guardar ítems actualizados
        const itemsGuardados = await guardarEstadoItems();

        // 2. Tomar el estado seleccionado del <select>
        const estadoSeleccionado = document.getElementById('cambiar-estado').value;

        // 3. Enviar ambos al backend
        const response = await fetch(`http://localhost:3000/api/pedidos/${pedidoActual._id}/completar`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                ...getAuthHeader()
            },
            body: JSON.stringify({ 
                estado: estadoSeleccionado,
                itemsCompletados: itemsGuardados.items || [] // fallback defensivo
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'Error al actualizar el pedido');
        }

        const data = await response.json();
        if (!data || !data.success) {
            throw new Error(data?.message || 'Respuesta inválida del servidor');
        }

        // 4. Actualizar en memoria y refrescar la vista
        const index = pedidosData.findIndex(p => p._id === pedidoActual._id);
        if (index !== -1) {
            pedidosData[index] = data.pedido;
            pedidoActual = data.pedido;
            mostrarPedidos(pedidosData);
        }

        mostrarExito('Pedido actualizado correctamente');
        setTimeout(() => detallesModal.hide(), 1000);

    } catch (error) {
        console.error('Error en completarPedido:', error);
        mostrarError(error.message || 'Error al completar el pedido');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-check-circle me-1"></i> Completar pedido';
    }
}

//FUNCIONES AUXILIARES
//Notificaciones
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

function mostrarError(mensaje) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'alert alert-danger';
    errorDiv.textContent = mensaje;
    pedidosContainer.prepend(errorDiv);
    
    setTimeout(() => {
        errorDiv.remove();
    }, 5000);
}


//Helpers
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