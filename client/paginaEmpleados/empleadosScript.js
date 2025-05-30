// Variables globales
let pedidosContainer;
let filtroEstado;
let buscarNombre;
let filtroFecha;
let btnRefrescar;
let detallesModal;
let btnLogout;

// Datos
let pedidosData = [];
let pedidoActual = null;
let cambiosPendientes = false;

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    // Verificar autenticación
    if (!checkAuth() || checkAuth().user.role !== 'employee') {
        window.location.href = 'login.html';
        return;
    }

    // Elementos del DOM
    pedidosContainer = document.getElementById('pedidos-container');
    filtroEstado = document.getElementById('filtro-estado');
    buscarNombre = document.getElementById('buscar-nombre');
    filtroFecha = document.getElementById('filtro-fecha');
    btnRefrescar = document.getElementById('btn-refrescar');
    btnLogout = document.getElementById('btn-logout');
    detallesModal = new bootstrap.Modal(document.getElementById('detallesModal'));

    // Event listeners
    filtroEstado.addEventListener('change', filtrarPedidos);
    buscarNombre.addEventListener('input', filtrarPedidos);
    filtroFecha.addEventListener('change', filtrarPedidos);
    btnRefrescar.addEventListener('click', cargarPedidos);
    btnLogout.addEventListener('click', logout);
    document.getElementById('btn-guardar-estado').addEventListener('click', guardarEstadoPedido);
    document.getElementById('btn-completar-pedido').addEventListener('click', completarPedido);

    // Cargar pedidos iniciales
    cargarPedidos();
});

// Función para cargar pedidos desde la API
async function cargarPedidos() {
    try {
        btnRefrescar.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i> Cargando...';
        btnRefrescar.disabled = true;

        const response = await fetch('http://localhost:3000/api/pedidos?estado=confirmado', {
            headers: getAuthHeader()
        });

        if (!response.ok) throw new Error('Error al cargar pedidos');

        pedidosData = await response.json();
        mostrarPedidos(pedidosData);
    } catch (error) {
        console.error('Error:', error);
        mostrarError('Error al cargar los pedidos. Intente nuevamente.');
    } finally {
        btnRefrescar.innerHTML = '<i class="fas fa-sync-alt me-1"></i> Actualizar';
        btnRefrescar.disabled = false;
    }
}

// Mostrar pedidos en el grid
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
        const fecha = new Date(pedido.fecha).toLocaleDateString();
        const estadoClass = getEstadoClass(pedido.estado);
        const itemsCompletados = pedido.items.filter(item => item.completado).length;
        
        const pedidoCard = document.createElement('div');
        pedidoCard.className = 'col-md-6 col-lg-4 mb-4';
        pedidoCard.innerHTML = `
            <div class="pedido-card card h-100">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start mb-3">
                        <h5 class="card-title mb-0">${pedido.cliente.nombre}</h5>
                        <span class="badge ${estadoClass}">${formatEstado(pedido.estado)}</span>
                    </div>
                    <p class="text-muted small mb-2">${fecha}</p>
                    <p class="mb-2"><strong>Total:</strong> $${pedido.total.toFixed(2)}</p>
                    <div class="progress mb-3" style="height: 8px;">
                        <div class="progress-bar bg-success" 
                             role="progressbar" 
                             style="width: ${(itemsCompletados / pedido.items.length) * 100}%">
                        </div>
                    </div>
                    <p class="small text-muted mb-3">
                        ${itemsCompletados} de ${pedido.items.length} productos completados
                    </p>
                    <button class="btn btn-sm btn-outline-primary w-100 btn-ver-detalles" data-id="${pedido._id}">
                        <i class="fas fa-eye me-1"></i> Ver detalles
                    </button>
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

// Filtrar pedidos según los criterios
function filtrarPedidos() {
    const estado = filtroEstado.value;
    const nombreBusqueda = buscarNombre.value.toLowerCase();
    const fechaSeleccionada = filtroFecha.value;
    
    let pedidosFiltrados = [...pedidosData];
    
    // Filtrar por estado
    if (estado !== 'todos') {
        pedidosFiltrados = pedidosFiltrados.filter(p => p.estado === estado);
    }
    
    // Filtrar por nombre
    if (nombreBusqueda) {
        pedidosFiltrados = pedidosFiltrados.filter(p => 
            p.cliente.nombre.toLowerCase().includes(nombreBusqueda)
        );
    }
    
    // Filtrar por fecha
    if (fechaSeleccionada) {
        pedidosFiltrados = pedidosFiltrados.filter(p => {
            const fechaPedido = new Date(p.fecha).toISOString().split('T')[0];
            return fechaPedido === fechaSeleccionada;
        });
    }
    
    mostrarPedidos(pedidosFiltrados);
}

// Mostrar detalles del pedido en el modal
async function mostrarDetallesPedido(id) {
    try {
        cambiosPendientes = false;
        
        // Obtener el pedido de la API
        const response = await fetch(`http://localhost:3000/api/pedidos/${id}`, {
            headers: getAuthHeader()
        });
        
        if (!response.ok) throw new Error('Error al cargar el pedido');
        
        pedidoActual = await response.json();
        
        // Actualizar la información básica del modal
        document.getElementById('modal-pedido-id').textContent = pedidoActual._id;
        document.getElementById('modal-cliente').textContent = pedidoActual.cliente.nombre;
        document.getElementById('modal-fecha').textContent = new Date(pedidoActual.fecha).toLocaleString();
        document.getElementById('modal-total').textContent = pedidoActual.total.toFixed(2);
        
        // Actualizar el estado
        const estadoElement = document.getElementById('modal-estado');
        estadoElement.textContent = formatEstado(pedidoActual.estado);
        estadoElement.className = 'badge ' + getEstadoClass(pedidoActual.estado);
        
        // Configurar el select de estado
        const cambiarEstado = document.getElementById('cambiar-estado');
        cambiarEstado.value = pedidoActual.estado;
        
        // Mostrar/ocultar botones según el estado
        const btnCompletar = document.getElementById('btn-completar-pedido');
        const btnGuardar = document.getElementById('btn-guardar-estado');
        
        if (pedidoActual.estado === 'completado') {
            btnCompletar.classList.add('d-none');
            btnGuardar.textContent = 'Actualizar pedido';
        } else {
            btnCompletar.classList.remove('d-none');
            btnGuardar.textContent = 'Guardar estado';
        }
        
        // Mostrar los productos
        const productosContainer = document.getElementById('modal-productos');
        productosContainer.innerHTML = '';
        
        pedidoActual.items.forEach((item, index) => {
            const productoDiv = document.createElement('div');
            productoDiv.className = `producto-item ${item.completado ? 'completado' : 'incompleto'}`;
            
            productoDiv.innerHTML = `
                <div class="d-flex justify-content-between align-items-center">
                    <div class="form-check">
                        <input class="form-check-input item-completado" 
                            type="checkbox" 
                            data-id="${item._id}"
                            ${item.completado ? 'checked' : ''}>
                        <label class="form-check-label" for="item-${index}">
                            <h6 class="mb-1">${item.nombre}</h6>
                            <small class="text-muted">${item.cantidad} unidad(es) • ${item.peso || 'N/A'}</small>
                        </label>
                    </div>
                    <div class="text-end">
                        <small>$${item.precioUnitario?.toFixed(2)} c/u</small>
                        <h6 class="mb-0 mt-1">$${item.precioTotal?.toFixed(2)}</h6>
                    </div>
                </div>
                
                <!-- Sección de motivo (solo visible si no está completado) -->
                <div class="motivo-section ${item.completado ? 'd-none' : ''}" id="motivo-container-${index}">
                    <select class="form-select form-select-sm motivo-select mb-2" ${item.completado ? 'disabled' : ''}>
                        <option value="">Seleccione motivo...</option>
                        <option value="sin stock" ${item.motivoIncompleto === 'sin stock' ? 'selected' : ''}>Sin stock</option>
                        <option value="dañado" ${item.motivoIncompleto === 'dañado' ? 'selected' : ''}>Producto dañado</option>
                        <option value="no solicitado" ${item.motivoIncompleto === 'no solicitado' ? 'selected' : ''}>No fue solicitado</option>
                        <option value="otro" ${item.motivoIncompleto === 'otro' ? 'selected' : ''}>Otro</option>
                    </select>
                    <textarea class="form-control observaciones" 
                              placeholder="Observaciones (opcional)" 
                              rows="2" 
                              ${item.completado ? 'disabled' : ''}>${item.observaciones || ''}</textarea>
                </div>
            `;
            
            productosContainer.appendChild(productoDiv);
        });
        
        // Agregar eventos a los checkboxes
        document.querySelectorAll('.item-completado').forEach(checkbox => {
            checkbox.addEventListener('change', function() {
                const index = this.id.split('-')[1];
                const motivoContainer = document.getElementById(`motivo-container-${index}`);
                
                if (motivoContainer) {
                    motivoContainer.classList.toggle('d-none', this.checked);
                    
                    // Actualizar estilo del ítem
                    const itemDiv = this.closest('.producto-item');
                    if (itemDiv) {
                        itemDiv.classList.toggle('completado', this.checked);
                        itemDiv.classList.toggle('incompleto', !this.checked);
                    }
                }
                
                cambiosPendientes = true;
            });
        });
        
        // Agregar eventos a los selects y textareas
        document.querySelectorAll('.motivo-select, .observaciones').forEach(element => {
            element.addEventListener('change', () => cambiosPendientes = true);
            element.addEventListener('input', () => cambiosPendientes = true);
        });
        
        // Mostrar el modal
        detallesModal.show();
        
    } catch (error) {
        console.error('Error:', error);
        mostrarError('Error al cargar los detalles del pedido');
    }
}

// Guardar el estado del pedido (incluyendo items)
async function guardarEstadoPedido() {
    const btn = document.getElementById('btn-guardar-estado');
    if (!btn || !pedidoActual) return;
    
    try {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i> Guardando...';
        
        // 1. Obtener los items actualizados
        const itemsActualizados = Array.from(document.querySelectorAll('.item-completado')).map((checkbox) => {
            const id = checkbox.getAttribute('data-id');
            const index = checkbox.getAttribute('data-index');
            const completado = checkbox.checked;
            const motivoContainer = document.getElementById(`motivo-container-${index}`);

            return {
                _id: id,
                completado,
                motivoIncompleto: completado ? null : (motivoContainer?.querySelector('.motivo-select')?.value || null),
                observaciones: completado ? null : (motivoContainer?.querySelector('.observaciones')?.value || null)
            };
        });
        
        // 2. Determinar si es una actualización de pedido completado
        const esActualizacion = pedidoActual.estado === 'completado';
        
        // 3. Obtener el nuevo estado (mantener 'completado' si es actualización)
        const estadoSelect = document.getElementById('cambiar-estado').value;
        const estadosValidos = ['pendiente', 'en_proceso', 'completado', 'cancelado'];
        const nuevoEstado = esActualizacion ? 'completado' : (estadosValidos.includes(estadoSelect) ? estadoSelect : pedidoActual.estado);

        
        // 4. Actualizar el pedido en la API
        const response = await fetch(`http://localhost:3000/api/pedidos/${pedidoActual._id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeader()
            },
            body: JSON.stringify({
                estado: nuevoEstado,
                items: itemsActualizados,
                esActualizacion: esActualizacion // Informar al backend que es una actualización
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error al guardar el pedido');
        }
        
        const data = await response.json();
        pedidoActual = data.pedido;

        await mostrarDetallesPedido(pedidoActual._id);
        
        // 5. Actualizar la lista de pedidos
        const index = pedidosData.findIndex(p => p._id === pedidoActual._id);
        if (index !== -1) {
            pedidosData[index] = pedidoActual;
        }
        
        // 6. Mostrar feedback al usuario
        mostrarExito(esActualizacion ? 'Pedido actualizado correctamente' : 'Estado guardado correctamente');
        cambiosPendientes = false;
        
        // 7. Si el pedido fue completado, cerrar el modal después de 1 segundo
        if (pedidoActual.estado === 'completado') {
            setTimeout(() => detallesModal.hide(), 1000);
        }
        
    } catch (error) {
        console.error('Error:', error);
        mostrarError(error.message || 'Error al guardar el pedido');
    } finally {
        btn.disabled = false;
        btn.innerHTML = pedidoActual.estado === 'completado' ? 
            '<i class="fas fa-save me-1"></i> Actualizar pedido' : 
            '<i class="fas fa-save me-1"></i> Guardar estado';
    }
}

// Completar el pedido
async function completarPedido() {
    const btn = document.getElementById('btn-completar-pedido');
    if (!btn || !pedidoActual) return;
    
    try {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i> Completando...';
        
        // Primero guardar los cambios si hay
        if (cambiosPendientes) {
            await guardarEstadoPedido();
        }
        
        // Marcar el pedido como completado
        const response = await fetch(`/api/pedidos/${pedidoActual._id}/completar`, {
            method: 'PUT',
            headers: getAuthHeader(),
            body: JSON.stringify({
            items: obtenerItemsActualizados()
            })
        });
        
        if (!response.ok) throw new Error('Error al completar el pedido');
        
        const data = await response.json();
        pedidoActual = data;
        
        // Actualizar la lista de pedidos
        const index = pedidosData.findIndex(p => p._id === pedidoActual._id);
        if (index !== -1) {
            pedidosData[index] = pedidoActual;
            mostrarPedidos(pedidosData);
        }
        
        mostrarExito('Pedido completado correctamente');
        
        // Cerrar el modal después de 1 segundo
        setTimeout(() => detallesModal.hide(), 1000);
        
    } catch (error) {
        console.error('Error:', error);
        mostrarError(error.message || 'Error al completar el pedido');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-check-circle me-1"></i> Completar pedido';
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

function getAuthHeader() {
    const token = localStorage.getItem('token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
}

function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) return false;
    
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return { user: payload };
    } catch (e) {
        return false;
    }
}

function logout() {
    localStorage.removeItem('token');
    window.location.href = 'login.html';
}

function mostrarExito(mensaje) {
    const toast = document.createElement('div');
    toast.className = 'position-fixed bottom-0 end-0 p-3';
    toast.style.zIndex = '1100';
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
    const toast = document.createElement('div');
    toast.className = 'position-fixed bottom-0 end-0 p-3';
    toast.style.zIndex = '1100';
    toast.innerHTML = `
        <div class="toast show" role="alert">
            <div class="toast-header bg-danger text-white">
                <i class="fas fa-exclamation-triangle me-2"></i>
                <strong class="me-auto">Error</strong>
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