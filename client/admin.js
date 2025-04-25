document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('form-producto');
    const listaProductos = document.getElementById('lista-productos');
    const btnSubmit = form.querySelector('button[type="submit"]');
    let editingId = null;

    // Cargar productos al iniciar
    cargarProductos();

    // Guardar o actualizar producto
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        btnSubmit.disabled = true;
        btnSubmit.innerHTML = '<span class="spinner-border spinner-border-sm" role="status"></span> Procesando...';

        const producto = {
            nombre: document.getElementById('nombre').value,
            precio: parseFloat(document.getElementById('precio').value),
            imagen: document.getElementById('imagen').value,
            descripcion: document.getElementById('descripcion').value
        };

        try {
            const url = editingId 
                ? `http://localhost:3000/api/admin/producto/${editingId}`
                : 'http://localhost:3000/api/admin/producto';

            const method = editingId ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': '3BGOD'
                },
                body: JSON.stringify(producto)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error desconocido');
            }

            mostrarAlerta(editingId ? 'Producto actualizado correctamente' : 'Producto creado correctamente', 'success');
            form.reset();
            editingId = null;
            cargarProductos();
        } catch (error) {
            console.error('Error:', error);
            mostrarAlerta(error.message, 'danger');
        } finally {
            btnSubmit.disabled = false;
            btnSubmit.textContent = editingId ? 'Actualizar Producto' : 'Guardar Producto';
        }
    });

    // Cargar productos desde la API
    async function cargarProductos() {
        try {
            console.log("Cargando productos..."); // Debug
            const response = await fetch('http://localhost:3000/api/producto', {
                headers: { 'Authorization': '3BGOD' } 
            });

            console.log("Respuesta:", response); // Debug

            if (!response.ok) throw new Error('Error al cargar productos');
            const productos = await response.json();
            console.log("Productos recibidos:", productos); // Debug
            renderProductos(productos);
        } catch (error) {
            console.error('Error al cargar productos:', error);
            mostrarAlerta('Error al cargar productos', 'danger');
        }
    }

    // Renderizar lista de productos
    function renderProductos(productos) {
        console.log("Renderizando:", productos); // Debug
        productos.forEach(p => console.log("ID del producto:", p._id));
        listaProductos.innerHTML = productos.map(producto => `
            <div class="col-md-4 mb-4">
                <div class="card h-100">
                    <img src="${producto.imagen}" class="card-img-top" alt="${producto.nombre}" style="height: 200px; object-fit: cover;">
                    <div class="card-body">
                        <h5 class="card-title">${producto.nombre}</h5>
                        <p class="card-text">$${producto.precio.toFixed(2)}</p>
                        <p class="card-text text-muted small">${producto.descripcion || 'Sin descripción'}</p>
                    </div>
                    <div class="card-footer bg-transparent">
                        <button onclick="editarProducto('${producto._id.toString()}')" class="btn btn-sm btn-warning me-2">
                            <i class="bi bi-pencil"></i> Editar
                        </button>
                        <button onclick="eliminarProducto('${producto._id.toString()}')" class="btn btn-sm btn-danger">
                            <i class="bi bi-trash"></i> Eliminar
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // Función para mostrar alertas
    function mostrarAlerta(mensaje, tipo = 'success') {
        const alerta = document.createElement('div');
        alerta.className = `alert alert-${tipo} alert-dismissible fade show fixed-top mt-3 mx-3`;
        alerta.innerHTML = `
            ${mensaje}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        document.body.prepend(alerta);
        setTimeout(() => alerta.remove(), 5000);
    }

    // Funciones globales para botones
    window.editarProducto = async (id) => {
        try {
            console.log("Editando producto ID:", id); // Debug
        
            if (!id || id.length !== 24) {
                throw new Error("ID de producto inválido");
            }
            const response = await fetch(`http://localhost:3000/api/admin/producto/${id}`, {
                headers: { 
                  'Authorization': '3BGOD'
                }
              });
            if (!response.ok) throw new Error('Error al cargar producto');
            
            const producto = await response.json();
            document.getElementById('nombre').value = producto.nombre;
            document.getElementById('precio').value = producto.precio;
            document.getElementById('imagen').value = producto.imagen;
            document.getElementById('descripcion').value = producto.descripcion || '';
            editingId = producto._id;
            
            btnSubmit.textContent = 'Actualizar Producto';
            window.scrollTo({ top: 0, behavior: 'smooth' });
            
            // Agregar botón cancelar
            if (!document.getElementById('btn-cancelar')) {
                const cancelBtn = document.createElement('button');
                cancelBtn.id = 'btn-cancelar';
                cancelBtn.className = 'btn btn-secondary ms-2';
                cancelBtn.textContent = 'Cancelar';
                cancelBtn.onclick = cancelarEdicion;
                form.querySelector('.btn-primary').after(cancelBtn);
            }
        } catch (error) {
            console.error('Error al cargar producto:', error);
            mostrarAlerta('Error al cargar producto', 'danger');
        }
    };

    window.cancelarEdicion = () => {
        form.reset();
        editingId = null;
        btnSubmit.textContent = 'Guardar Producto';
        const cancelBtn = document.getElementById('btn-cancelar');
        if (cancelBtn) cancelBtn.remove();
    };

    window.eliminarProducto = async (id) => {
        if (!confirm('¿Estás seguro de eliminar este producto?')) return;
        
        try {
          const response = await fetch(`http://localhost:3000/api/admin/producto/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': '3BGOD' }
          });
      
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Error HTTP: ${response.status}`);
          }
          
          mostrarAlerta('Producto eliminado correctamente', 'success');
          cargarProductos();
        } catch (error) {
          console.error('Error al eliminar:', error);
          mostrarAlerta(error.message || 'Error al eliminar producto', 'danger');
        }
      };
    
          // Inicializar pestañas
    const adminTabs = new bootstrap.Tab(document.getElementById('productos-tab'));

    
    // ==============================================
    // SECCIÓN DE PEDIDOS (nueva funcionalidad)
    // ==============================================
    
    // Elementos del DOM para pedidos
    const tablaPedidos = document.getElementById('tabla-pedidos');
    const filtroEstado = document.getElementById('filtro-estado');
    const filtroEnvio = document.getElementById('filtro-envio');
    const filtroFecha = document.getElementById('filtro-fecha');
    
    // Event listeners para filtros
    [filtroEstado, filtroEnvio, filtroFecha].forEach(filter => {
        filter.addEventListener('change', cargarPedidos);
    });
    
    // Cargar pedidos cuando se muestra la pestaña
    document.getElementById('pedidos-tab').addEventListener('shown.bs.tab', cargarPedidos);
    
    // Función para cargar pedidos
    async function cargarPedidos() {
        try {
            // Construir URL con filtros
            let url = 'http://localhost:3000/api/admin/pedidos?';
            if (filtroEstado.value !== 'todos') url += `estado=${filtroEstado.value}&`;
            if (filtroEnvio.value !== 'todos') url += `tipoEnvio=${filtroEnvio.value}&`;
            if (filtroFecha.value) url += `fecha=${filtroFecha.value}&`;
            
            const response = await fetch(url, {
                headers: { 'Authorization': '3BGOD' }
            });
            
            if (!response.ok) throw new Error('Error al cargar pedidos');
            const pedidos = await response.json();
            
            renderPedidos(pedidos);
        } catch (error) {
            console.error('Error al cargar pedidos:', error);
            mostrarAlerta('Error al cargar pedidos', 'danger');
        }
    }
    
    // Función para renderizar la tabla de pedidos
    function renderPedidos(pedidos) {
        tablaPedidos.innerHTML = pedidos.map(pedido => `
            <tr data-id="${pedido._id}">
                <td>${pedido._id.toString().substring(18)}</td>
                <td>${pedido.cliente.nombre}</td>
                <td>
                    ${pedido.tipoEnvio === 'retiro' ? 'Retiro en local' : 
                      pedido.cliente.direccion?.localidad || 'Bahía Blanca'}
                </td>
                <td>$${pedido.total.toLocaleString('es-AR')}</td>
                <td>
                    <span class="badge badge-estado ${getEstadoClass(pedido.estado)}">
                        ${formatEstado(pedido.estado)}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-info btn-detalle me-2" data-id="${pedido._id}">
                        <i class="bi bi-eye"></i>
                    </button>
                    ${pedido.estado === 'revision' ? `
                        <button class="btn btn-sm btn-success btn-confirmar me-2" data-id="${pedido._id}">
                            <i class="bi bi-check"></i>
                        </button>
                        <button class="btn btn-sm btn-danger btn-cancelar" data-id="${pedido._id}">
                            <i class="bi bi-x"></i>
                        </button>
                    ` : ''}
                    ${pedido.estado === 'pendiente' ? `
                        <button class="btn btn-sm btn-primary btn-completar" data-id="${pedido._id}">
                            Completar
                        </button>
                    ` : ''}
                    <button class="btn btn-sm btn-danger btn-eliminar" data-id="${pedido._id}">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
        
        // Agregar event listeners a los botones
        document.querySelectorAll('.btn-detalle').forEach(btn => {
            btn.addEventListener('click', mostrarDetallePedido);
        });
        
        document.querySelectorAll('.btn-confirmar').forEach(btn => {
            btn.addEventListener('click', () => cambiarEstadoPedido(btn.dataset.id, 'pendiente'));
        });
        
        document.querySelectorAll('.btn-cancelar').forEach(btn => {
            btn.addEventListener('click', () => cambiarEstadoPedido(btn.dataset.id, 'cancelado'));
        });
        
        document.querySelectorAll('.btn-completar').forEach(btn => {
            btn.addEventListener('click', () => cambiarEstadoPedido(btn.dataset.id, 'completado'));
        });

        document.querySelectorAll('.btn-eliminar').forEach(btn => {
            btn.addEventListener('click', eliminarPedido);
        });
    }
    
    // Función para mostrar detalles del pedido en modal
    async function mostrarDetallePedido(e) {
        const pedidoId = e.currentTarget.dataset.id;
        
        try {
            const response = await fetch(`http://localhost:3000/api/pedidos/${pedidoId}`, {
                headers: { 'Authorization': '3BGOD' }
            });
            
            if (!response.ok) throw new Error('Error al cargar pedido');
            const pedido = await response.json();
            
            // Llenar modal con datos del pedido
            document.getElementById('pedido-id').textContent = pedido._id.toString().substring(18);
            
            // Información del cliente
            document.getElementById('cliente-info').innerHTML = `
                <strong>Nombre:</strong> ${pedido.cliente.nombre}<br>
                ${pedido.cliente.direccion ? `
                    <strong>Dirección:</strong> ${pedido.cliente.direccion.calle} ${pedido.cliente.direccion.numero || ''}<br>
                    ${pedido.cliente.direccion.localidad ? `${pedido.cliente.direccion.localidad}, ${pedido.cliente.direccion.provincia || ''}` : ''}
                    ${pedido.cliente.direccion.codigoPostal ? `(${pedido.cliente.direccion.codigoPostal})` : ''}
                ` : ''}
            `;
            
            document.getElementById('cliente-contacto').innerHTML = `
                <strong>WhatsApp:</strong> ${pedido.cliente.whatsapp}<br>
                <strong>Email:</strong> ${pedido.cliente.email}
            `;
            
            // Información de envío
            document.getElementById('envio-info').textContent = 
                pedido.tipoEnvio === 'retiro' ? 'Retiro en local' :
                pedido.tipoEnvio === 'bahia-blanca' ? 'Envío en Bahía Blanca' :
                'Envío a otra localidad';
            
            document.getElementById('pedido-fecha').innerHTML = `
                <strong>Fecha:</strong> ${new Date(pedido.fecha).toLocaleString()}
            `;
            
            document.getElementById('pedido-estado').innerHTML = `
                <strong>Estado:</strong> <span class="badge ${getEstadoClass(pedido.estado)}">
                    ${formatEstado(pedido.estado)}
                </span>
            `;
            
            // Items del pedido
            const itemsBody = document.getElementById('detalle-items');
            itemsBody.innerHTML = pedido.items.map(item => `
                <tr>
                    <td>${item.nombre}</td>
                    <td>$${item.precioUnitario.toLocaleString('es-AR')}</td>
                    <td>${item.cantidad}</td>
                    <td>${item.peso}</td>
                    <td>$${item.precioTotal.toLocaleString('es-AR')}</td>
                    ${pedido.estado === 'completado' ? `
                        <td>${item.completado ? '✅ Si' : '❌ No'}</td>
                        <td>${!item.completado ? (item.motivoIncompleto || '') + (item.observaciones ? ` (${item.observaciones})` : '') : '-'}</td>
                    ` : '<td></td><td></td>'}
                </tr>
            `).join('');

            if (pedido.estado === 'completado') {
                const completados = pedido.items.filter(item => item.completado).length;
                const noCompletados = pedido.items.length - completados;
                
                itemsBody.insertAdjacentHTML('afterend', `
                    <div class="mt-3">
                        <h5>Resumen de Entrega</h5>
                        <p><strong>Observaciones generales:</strong> ${pedido.observaciones || 'Ninguna'}</p>
                        <p><strong>Fecha de completado:</strong> ${new Date(pedido.fechaCompletado).toLocaleString()}</p>
                    </div>
                `);
            }
            
            document.getElementById('pedido-total').textContent = pedido.total.toLocaleString('es-AR');
            
            // Configurar acciones según estado
            const accionesDiv = document.getElementById('acciones-pedido');
            accionesDiv.innerHTML = '';
            
            if (pedido.estado === 'pendiente') {
                accionesDiv.innerHTML = `
                    <button class="btn btn-success me-2" onclick="cambiarEstadoPedido('${pedido._id}', 'en_proceso', true)">
                        Confirmar Pedido
                    </button>
                    <button class="btn btn-danger" onclick="cambiarEstadoPedido('${pedido._id}', 'cancelado', true)">
                        Cancelar Pedido
                    </button>
                `;
            } else if (pedido.estado === 'en_proceso') {
                accionesDiv.innerHTML = `
                    <button class="btn btn-primary" onclick="cambiarEstadoPedido('${pedido._id}', 'completado', true)">
                        Marcar como Completado
                    </button>
                `;
            }

            window.eliminarPedidoModal = async (pedidoId) => {
                if (!confirm('¿Estás seguro de que quieres eliminar este pedido? Esta acción no se puede deshacer.')) {
                    return;
                }
            
                try {
                    const response = await fetch(`/api/admin/pedidos/${pedidoId}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': '3BGOD' }
                    });
            
                    if (!response.ok) throw new Error('Error al eliminar pedido');
            
                    mostrarAlerta('Pedido eliminado correctamente', 'success');
                    
                    // Cerrar modal y recargar la lista
                    bootstrap.Modal.getInstance(document.getElementById('detallePedidoModal')).hide();
                    cargarPedidos();
                } catch (error) {
                    console.error('Error al eliminar pedido:', error);
                    mostrarAlerta('Error al eliminar pedido', 'danger');
                }
            };
            
            // Mostrar modal
            const modal = new bootstrap.Modal(document.getElementById('detallePedidoModal'));
            modal.show();
            
        } catch (error) {
            console.error('Error al cargar detalle:', error);
            mostrarAlerta('Error al cargar detalles del pedido', 'danger');
        }
    }
    
    // Función para cambiar estado del pedido
    window.cambiarEstadoPedido = async (pedidoId, nuevoEstado, recargar = false) => {
        console.log('ID del pedido:', pedidoId);
        const confirmMessage = nuevoEstado === 'cancelado' ? 
            '¿Estás seguro de cancelar este pedido?' :
            `¿Estás seguro de marcar este pedido como ${formatEstado(nuevoEstado).toLowerCase()}?`;
        
        if (!confirm(confirmMessage)) return;
        
        try {
            const response = await fetch(`http://localhost:3000/api/admin/pedidos/${pedidoId}/estado`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': '3BGOD'
                },
                body: JSON.stringify({ estado: nuevoEstado })
            });
            
            if (!response.ok) throw new Error('Error al actualizar estado');
            
            mostrarAlerta(`Pedido ${formatEstado(nuevoEstado).toLowerCase()} correctamente`, 'success');
            
            if (recargar) {
                // Si se llamó desde el modal, recargar la tabla
                cargarPedidos();
                // Cerrar modal
                bootstrap.Modal.getInstance(document.getElementById('detallePedidoModal')).hide();
            } else {
                // Si se llamó desde la tabla, actualizar la fila
                const fila = document.querySelector(`tr[data-id="${pedidoId}"]`);
                if (fila) {
                    const estadoBadge = fila.querySelector('.badge-estado');
                    estadoBadge.className = `badge badge-estado ${getEstadoClass(nuevoEstado)}`;
                    estadoBadge.textContent = formatEstado(nuevoEstado);
                    
                    // Actualizar botones de acción
                    const accionesTd = fila.querySelector('td:last-child');
                    if (nuevoEstado === 'en_proceso') {
                        accionesTd.innerHTML = `
                            <button class="btn btn-sm btn-info btn-detalle me-2" data-id="${pedidoId}">
                                <i class="bi bi-eye"></i>
                            </button>
                            <button class="btn btn-sm btn-primary btn-completar" data-id="${pedidoId}">
                                Completar
                            </button>
                        `;
                        accionesTd.querySelector('.btn-detalle').addEventListener('click', mostrarDetallePedido);
                        accionesTd.querySelector('.btn-completar').addEventListener('click', 
                            () => cambiarEstadoPedido(pedidoId, 'completado'));
                    } else if (nuevoEstado === 'completado' || nuevoEstado === 'cancelado') {
                        accionesTd.innerHTML = `
                            <button class="btn btn-sm btn-info btn-detalle" data-id="${pedidoId}">
                                <i class="bi bi-eye"></i>
                            </button>
                        `;
                        accionesTd.querySelector('.btn-detalle').addEventListener('click', mostrarDetallePedido);
                    }
                }
            }
        } catch (error) {
            console.error('Error al cambiar estado:', error);
            mostrarAlerta('Error al actualizar estado del pedido', 'danger');
        }
    };

    // Función para eliminar un pedido
    async function eliminarPedido(e) {
        const pedidoId = e.currentTarget.dataset.id;
        
        if (!confirm('¿Estás seguro de que quieres eliminar este pedido? Esta acción no se puede deshacer.')) {
            return;
        }

        try {
            const response = await fetch(`http://localhost:3000/api/admin/pedidos/${pedidoId}`, {
                method: 'DELETE',
                headers: { 'Authorization': '3BGOD' }
            });

            if (!response.ok) throw new Error('Error al eliminar pedido');

            mostrarAlerta('Pedido eliminado correctamente', 'success');
            
            // Eliminar la fila de la tabla
            document.querySelector(`tr[data-id="${pedidoId}"]`).remove();
        } catch (error) {
            console.error('Error al eliminar pedido:', error);
            mostrarAlerta('Error al eliminar pedido', 'danger');
        }
    }
    
    // Funciones auxiliares
    function getEstadoClass(estado) {
        const classes = {
            revision: 'bg-secondary',
            pendiente: 'bg-warning',
            en_proceso: 'bg-info',
            completado: 'bg-success',
            cancelado: 'bg-danger'
        };
        return classes[estado] || 'bg-secondary';
    }
    
    function formatEstado(estado) {
        const estados = {
            revision: 'En revision',
            pendiente: 'Pendiente',
            en_proceso: 'En proceso',
            completado: 'Completado',
            cancelado: 'Cancelado'
        };
        return estados[estado] || estado;
    }
    
    // Hacer funciones accesibles globalmente
    window.mostrarDetallePedido = mostrarDetallePedido;
    window.eliminarPedido = eliminarPedido;
});