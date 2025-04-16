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
                ? `http://localhost:3000/api/admin/productos/${editingId}`
                : 'http://localhost:3000/api/admin/productos';

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
            const response = await fetch('http://localhost:3000/api/productos', {
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
            const response = await fetch(`http://localhost:3000/api/productos/${id}`, {
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
            const response = await fetch(`http://localhost:3000/api/admin/productos/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': '3BGOD' }
            });

            if (!response.ok) throw new Error(await response.text());
            
            mostrarAlerta('Producto eliminado correctamente', 'success');
            cargarProductos();
        } catch (error) {
            console.error('Error al eliminar:', error);
            mostrarAlerta('Error al eliminar producto', 'danger');
        }
    };
});