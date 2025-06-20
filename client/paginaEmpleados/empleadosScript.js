let pedidosContainer;
let filtroEstado;
let buscarNombre;
let btnRefrescar;
let detallesModal;

//Variables de estado
let pedidosData = [];
let pedidoActual = null;
let estadoOriginal = null;

window.API_URL = window.API_URL || (
  ['localhost', '127.0.0.1', '0.0.0.0'].includes(window.location.hostname)
    ? 'http://localhost:3000'
    : 'https://threeb-pagina.onrender.com'
);


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

    document.getElementById('btn-agregar-bulto').addEventListener('click', () => {
      const container = document.getElementById('bultos-container');

      const div = document.createElement('div');
      div.className = 'd-flex align-items-center mb-2 gap-2';

      div.innerHTML = `
        <select class="form-select form-select-sm tipo-bulto" style="max-width: 150px;">
          <option value="bolsa">Bolsa</option>
          <option value="caja">Caja</option>
          <option value="bolson">Bolsón</option>
        </select>
        <input type="number" min="1" class="form-control form-control-sm cantidad-bulto" placeholder="Cantidad" style="max-width: 100px;">
        <button type="button" class="btn btn-sm btn-danger btn-quitar-bulto">
          <i class="fas fa-trash"></i>
        </button>
      `;

      container.appendChild(div);

      div.querySelector('.btn-quitar-bulto').addEventListener('click', () => {
        div.remove();
      });
    });

    const modalEl = document.getElementById('detallesModal');
    modalEl.addEventListener('hidden.bs.modal', async () => {
      // Si estaba pendiente originalmente y no se completó, volver a pendiente
      if (estadoOriginal === 'pendiente' && pedidoActual.estado === 'en_proceso') {
        try {
          await fetch(`${window.API_URL}/api/pedidos/${pedidoActual._id}`, {
            method: 'PUT',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
              ...getAuthHeader()
            },
            body: JSON.stringify({
              estado: 'pendiente',
              esActualizacion: false
            })
          });
          pedidoActual.estado = 'pendiente';
        } catch (error) {
          console.error('Error al revertir pedido a pendiente:', error);
        }
      }
    });
});

// FUNCIONES PRINCIPALES
// Carga y Visualización de Pedidos
async function cargarPedidos() {
    try {
        const response = await fetch(`${window.API_URL}/api/pedidos`, {
            credentials: 'include',
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
        const response = await fetch(`${window.API_URL}/api/pedidos/${id}`,{
            credentials: 'include',
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
        estadoOriginal = pedidoActual.estado;
        
        document.getElementById('bultos-container').innerHTML = '';

        if (pedidoActual.bultos && Array.isArray(pedidoActual.bultos)) {
          pedidoActual.bultos.forEach(bulto => {
            const container = document.getElementById('bultos-container');

            const div = document.createElement('div');
            div.className = 'd-flex align-items-center mb-2 gap-2';

            div.innerHTML = `
              <select class="form-select form-select-sm tipo-bulto" style="max-width: 150px;">
                <option value="bolsa">Bolsa</option>
                <option value="caja">Caja</option>
                <option value="bolson">Bolsón</option>
              </select>
              <input type="number" min="1" class="form-control form-control-sm cantidad-bulto" placeholder="Cantidad" style="max-width: 100px;">
              <button type="button" class="btn btn-sm btn-danger btn-quitar-bulto">
                <i class="fas fa-trash"></i>
              </button>
            `;

            div.querySelector('.tipo-bulto').value = bulto.tipo;
            div.querySelector('.cantidad-bulto').value = bulto.cantidad;

            div.querySelector('.btn-quitar-bulto').addEventListener('click', () => {
              div.remove();
            });

            container.appendChild(div);
          });
        }

        // Si el pedido no está completado, marcarlo como en_proceso
        if (pedidoActual.estado !== 'completado') {
          await fetch(`${window.API_URL}/api/pedidos/${pedidoActual._id}`, {
            method: 'PUT',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
              ...getAuthHeader()
            },
            body: JSON.stringify({
              estado: 'en_proceso',
              esActualizacion: false
            })
          });

          // Actualizar visualmente
          pedidoActual.estado = 'en_proceso';
          document.getElementById('cambiar-estado').value = 'en_proceso';
        }

        // Llenar modal
        document.getElementById('modal-pedido-id').textContent = pedidoActual.cliente.nombre;
        document.getElementById('modal-fecha').textContent = new Date(pedidoActual.fecha).toLocaleString();
        document.getElementById('modal-total').textContent = pedidoActual.total.toFixed(2);
        document.getElementById('modal-envio').textContent = pedidoActual.tipoEnvio;
        
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
                            <h5 class="mb-1 ${item.completado}">${item.nombre}</h5>
                            <h6 class="text-muted">${item.peso} kg • ${item.cantidad} unidad(es)</h6>
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
        
        await cargarEmpleados();

        detallesModal.show();
    } catch (error) {
        console.error('Error:', error);
        mostrarError(error.message || 'Error al cargar los detalles del pedido');
    }
}

async function cargarEmpleados() {
    try {
        const response = await fetch(`${window.API_URL}/api/pedidos/empleados/listado`, {
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeader()
            }
        });

        if (!response.ok) throw new Error('Error al cargar empleados');

        const empleados = await response.json();
        const select = document.getElementById('select-asignados');
        select.innerHTML = '';

        empleados.forEach(usuario => {
            const option = document.createElement('option');
            option.value = usuario._id;
            option.textContent = usuario.name || usuario.email;
            select.appendChild(option);
        });

        // Seleccionar los que ya están asignados al pedido
        if (pedidoActual?.asignados) {
            pedidoActual.asignados.forEach(id => {
                const opt = select.querySelector(`option[value="${id}"]`);
                if (opt) opt.selected = true;
            });
        }

    } catch (error) {
        console.error('Error al cargar empleados:', error);
        mostrarError(error.message);
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

        const response = await fetch(`${window.API_URL}/api/pedidos/${pedidoActual._id}/items`, {
            method: 'PUT',
            credentials: 'include',
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

        const itemsGuardados = await guardarEstadoItems();

        const estadoSeleccionado = document.getElementById('cambiar-estado').value;

        const select = document.getElementById('select-asignados');
        const asignados = Array.from(select.selectedOptions).map(opt => opt.value);
        
        const bultos = Array.from(document.querySelectorAll('#bultos-container > div')).map(div => {
          const tipo = div.querySelector('.tipo-bulto')?.value;
          const cantidad = parseInt(div.querySelector('.cantidad-bulto')?.value);
          return { tipo, cantidad };
        }).filter(b => b.tipo && b.cantidad > 0);

        // Calcular total
        const totalBultos = bultos.reduce((sum, b) => sum + (b.cantidad || 0), 0);

        // Validar
        if (bultos.length === 0 || totalBultos === 0) {
          mostrarError('Debés especificar al menos un bulto con su tipo y cantidad para completar el pedido.');
          btn.disabled = false;
          btn.innerHTML = '<i class="fas fa-check-circle me-1"></i> Completar pedido';
          return;
        }


        const response = await fetch(`${window.API_URL}/api/pedidos/${pedidoActual._id}/completar`, {
            method: 'PUT',
            credentials: 'include',
            headers: { 
                'Content-Type': 'application/json',
                ...getAuthHeader()
            },
            body: JSON.stringify({ 
                estado: estadoSeleccionado,
                items: pedidoActual.items.map(item => ({
                    _id: item._id,
                    completado: item.completado,
                    motivoIncompleto: item.motivoIncompleto,
                    observaciones: item.observaciones
                })),
                asignados,
                bultos
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