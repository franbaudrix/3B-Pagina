let categoriasDisponibles = [];
let subcategoriasDisponibles = [];
let allProducts = [];
let allUsers = [];

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

// Función para cargar categorías
async function loadCategories() {
    try {
        const response = await fetch('http://localhost:3000/api/admin/categorias', {
            headers: { 
                'Content-Type': 'application/json',
                ...getAuthHeader()
            }
        });
        
        if (!response.ok) throw new Error('Error al cargar categorías');
        
        const categorias = await response.json();
        categoriasDisponibles = categorias;
        
        // Actualizar selectores de categoría
        updateCategorySelectors(categorias);
    } catch (error) {
        console.error('Error al cargar categorías:', error);
        mostrarAlerta('Error al cargar categorías', 'danger');
    }
}

function updateCategorySelectors(categorias) {
    // Selector en el formulario de producto
    const categoriaSelect = document.getElementById('categoria');
    categoriaSelect.innerHTML = '<option value="">Seleccione una categoría</option>';
    
    // Selector en el filtro
    const categoriaFilter = document.getElementById('categoria-filter');
    categoriaFilter.innerHTML = '<option value="">Todas las categorías</option>';
    
    categorias.forEach(categoria => {
        // Opción para el formulario
        const option = document.createElement('option');
        option.value = categoria._id;
        option.textContent = categoria.nombre;
        categoriaSelect.appendChild(option);
        
        // Opción para el filtro
        const filterOption = document.createElement('option');
        filterOption.value = categoria._id;
        filterOption.textContent = categoria.nombre;
        categoriaFilter.appendChild(filterOption);
    });
}

async function loadSubcategories(categoriaId) {
    const subcategoriaSelect = document.getElementById('subcategoria');
    const btnNuevaSubcategoria = document.getElementById('btn-nueva-subcategoria');
    
    subcategoriaSelect.innerHTML = '<option value="">Seleccione una subcategoría</option>';
    subcategoriaSelect.disabled = !categoriaId;
    btnNuevaSubcategoria.disabled = !categoriaId;
    
    if (!categoriaId) return;
    
    try {
        const response = await fetch(`http://localhost:3000/api/admin/categorias/${categoriaId}`, {
            headers: { 
                'Content-Type': 'application/json',
                ...getAuthHeader()
            }
        });
        
        if (!response.ok) throw new Error('Error al cargar subcategorías');
        
        const categoria = await response.json();
        
        if (categoria.subcategorias && categoria.subcategorias.length > 0) {
            categoria.subcategorias.forEach(subcategoria => {
                const option = document.createElement('option');
                option.value = subcategoria;
                option.textContent = subcategoria;
                subcategoriaSelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error al cargar subcategorías:', error);
        mostrarAlerta('Error al cargar subcategorías', 'danger');
    }
}

// Función para agregar nueva categoría
async function agregarNuevaCategoria(nombre) {
    try {
        if (!nombre || nombre.trim() === '') {
            mostrarAlerta('Por favor ingrese un nombre válido para la categoría', 'warning');
            return false;
        }

        const response = await fetch('http://localhost:3000/api/admin/categorias', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                ...getAuthHeader()
            },
            body: JSON.stringify({ nombre })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error al crear categoría');
        }
        
        const nuevaCategoria = await response.json();
        
        // Actualizar la lista de categorías
        await loadCategories();
        
        mostrarAlerta('Categoría creada correctamente', 'success');
        return nuevaCategoria;
    } catch (error) {
        console.error('Error al crear categoría:', error);
        mostrarAlerta(error.message, 'danger');
        return false;
    }
}

// Función para agregar nueva subcategoría
async function agregarNuevaSubcategoria(categoriaId, nombreSubcategoria) {
    try {
        if (!nombreSubcategoria || nombreSubcategoria.trim() === '') {
            mostrarAlerta('Por favor ingrese un nombre válido para la subcategoría', 'warning');
            return;
        }

        const response = await fetch(`http://localhost:3000/api/admin/categorias/${categoriaId}/subcategorias`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                ...getAuthHeader()
            },
            body: JSON.stringify({ nombre: nombreSubcategoria.trim() })
        });

        if (!response.ok) {
            const errorData = await response.json();
            // Si la subcategoría ya existe, no es un error grave, podemos continuar
            if (errorData.message.includes('ya existe')) {
                return { message: errorData.message };
            }
            throw new Error(errorData.message || 'Error al crear subcategoría');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error al crear subcategoría:', error);
        mostrarAlerta(error.message, 'danger');
        throw error;
    }
}

// Función para actualizar subcategorías según categoría seleccionada
function updateSubcategoryFilter() {
    const categoriaId = document.getElementById('categoria-filter').value;
    const subcategoriaFilter = document.getElementById('subcategoria-filter');
    
    subcategoriaFilter.innerHTML = '<option value="">Todas las subcategorías</option>';
    subcategoriaFilter.disabled = !categoriaId;
    
    if (!categoriaId) return;
    
    // Buscar la categoría seleccionada
    const categoria = categoriasDisponibles.find(c => c._id === categoriaId);
    
    if (categoria && categoria.subcategorias) {
        categoria.subcategorias.forEach(subcategoria => {
            const option = document.createElement('option');
            option.value = subcategoria;
            option.textContent = subcategoria;
            subcategoriaFilter.appendChild(option);
        });
    }
}

// Función para filtrar productos
function filterProducts() {
    const categoriaId = document.getElementById('categoria-filter').value;
    const subcategoria = document.getElementById('subcategoria-filter').value;
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    
    let filtered = allProducts;
    
    // Aplicar filtros
    if (categoriaId) {
        filtered = filtered.filter(p => p.categoria === categoriaId);
    }
    
    if (subcategoria) {
        filtered = filtered.filter(p => p.subcategoria === subcategoria);
    }
    
    if (searchTerm) {
        filtered = filtered.filter(p => 
            p.nombre.toLowerCase().includes(searchTerm) || 
            (p.descripcion && p.descripcion.toLowerCase().includes(searchTerm)));
    }
    
    renderProductos(filtered);
}

function getCategoryName(categoryId) {
    if (!categoryId) return '-';
    const categoria = categoriasDisponibles.find(c => c._id === categoryId);
    return categoria ? categoria.nombre : '-';
}

// Función para renderizar productos en tabla
function renderProductos(productos) {
    const listaProductos = document.getElementById('lista-productos');
    
    // Ordenar por nombre de categoría y luego por nombre de producto
    productos.sort((a, b) => {
        const catA = getCategoryName(a.categoria);
        const catB = getCategoryName(b.categoria);
        
        if (catA < catB) return -1;
        if (catA > catB) return 1;
        return a.nombre.localeCompare(b.nombre);
    });
    
    listaProductos.innerHTML = productos.map(producto => `
        <tr>
            <td>${producto.nombre}</td>
            <td>$${producto.precio.toFixed(2)}</td>
            <td>${getCategoryName(producto.categoria)}</td>
            <td>${producto.subcategoria || '-'}</td>
            <td>${producto.unidadMedida === 'kg' ? 'Por Kg' : 'Por Unidad'}</td>
            <td>${producto.descripcion ? 
                (producto.descripcion.length > 50 ? 
                    producto.descripcion.substring(0, 50) + '...' : 
                    producto.descripcion) : 
                'Sin descripción'}</td>
            <td class="d-flex align-items-center">
                <button onclick="editarProducto('${producto._id}')" class="btn btn-sm btn-warning me-2">
                    <i class="bi bi-pencil"></i>
                </button>
                <button onclick="eliminarProducto('${producto._id}')" class="btn btn-sm btn-danger">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
    
    if (productos.length === 0) {
        listaProductos.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-4 text-muted">
                    <i class="bi bi-box-seam"></i> No se encontraron productos
                </td>
            </tr>
        `;
    }
}

function calcularNuevoTotal(pedido, itemsActualizados) {
    return pedido.items.reduce((total, item, index) => {
        const itemActualizado = itemsActualizados.find(i => i._id === item._id);
        if (itemActualizado && !itemActualizado.completado) {
            return total; // No sumar si no está completado
        }
        return total + item.precioTotal;
    }, 0);
}

function actualizarBotonesAccion(fila, pedidoId, nuevoEstado) {
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
    } else if (nuevoEstado === 'completado' || nuevoEstado === 'cancelado') {
        accionesTd.innerHTML = `
            <button class="btn btn-sm btn-info btn-detalle" data-id="${pedidoId}">
                <i class="bi bi-eye"></i>
            </button>
        `;
    }
    
    // Reasignar event listeners
    if (accionesTd.querySelector('.btn-detalle')) {
        accionesTd.querySelector('.btn-detalle').addEventListener('click', mostrarDetallePedido);
    }
    if (accionesTd.querySelector('.btn-completar')) {
        accionesTd.querySelector('.btn-completar').addEventListener('click', 
            () => cambiarEstadoPedido(pedidoId, 'completado'));
    }
}

async function cargarUsuarios() {
    try {
        const response = await fetch('http://localhost:3000/api/auth/users', {
            headers: { 
                'Content-Type': 'application/json',
                ...getAuthHeader()
            }
        });

        if (!response.ok) throw new Error('Error al cargar usuarios');
        
        allUsers = await response.json();
        renderUsuarios(allUsers);
    } catch (error) {
        console.error('Error:', error);
        mostrarAlerta('Error al cargar los usuarios. Intente nuevamente.', 'danger');
    }
}

// Función para renderizar usuarios
function renderUsuarios(usuarios) {
    const listaUsuarios = document.getElementById('lista-usuarios');
    
    listaUsuarios.innerHTML = usuarios.map(usuario => `
        <tr data-id="${usuario._id}">
            <td>${usuario.name}</td>
            <td>${usuario.email}</td>
            <td>
                <span class="badge ${usuario.role === 'admin' ? 'bg-danger' : 'bg-primary'}">
                    ${usuario.role === 'admin' ? 'Administrador' : 'Empleado'}
                </span>
            </td>
            <td>${new Date(usuario.createdAt).toLocaleDateString()}</td>
            <td>
                <button class="btn btn-sm btn-warning btn-editar-usuario me-2" data-id="${usuario._id}">
                    <i class="bi bi-pencil"></i> Editar
                </button>
                <button class="btn btn-sm btn-danger btn-eliminar-usuario" data-id="${usuario._id}">
                    <i class="bi bi-trash"></i> Eliminar
                </button>
            </td>
        </tr>
    `).join('');
    
    // Agregar event listeners a los botones
    document.querySelectorAll('.btn-editar-usuario').forEach(btn => {
        btn.addEventListener('click', editarUsuario);
    });
    
    document.querySelectorAll('.btn-eliminar-usuario').forEach(btn => {
        btn.addEventListener('click', eliminarUsuario);
    });
    
    // Mostrar mensaje si no hay usuarios
    if (usuarios.length === 0) {
        listaUsuarios.innerHTML = `
            <tr>
                <td colspan="5" class="text-center py-4 text-muted">
                    <i class="bi bi-people"></i> No se encontraron usuarios
                </td>
            </tr>
        `;
    }
}

// Función para crear usuario
async function crearUsuario(e) {
    e.preventDefault();
    const btnSubmit = e.target.querySelector('button[type="submit"]');
    btnSubmit.disabled = true;
    btnSubmit.innerHTML = '<span class="spinner-border spinner-border-sm" role="status"></span> Procesando...';

    const usuario = {
        name: document.getElementById('usuario-nombre').value,
        email: document.getElementById('usuario-email').value,
        password: document.getElementById('usuario-password').value,
        role: document.getElementById('usuario-rol').value
    };

    try {
        const response = await fetch('http://localhost:3000/api/auth/register', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                ...getAuthHeader()
            },
            body: JSON.stringify(usuario)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error desconocido');
        }

        mostrarAlerta('Usuario creado correctamente', 'success');
        e.target.reset();
        cargarUsuarios();
    } catch (error) {
        console.error('Error:', error);
        mostrarAlerta(error.message, 'danger');
    } finally {
        btnSubmit.disabled = false;
        btnSubmit.textContent = 'Crear Usuario';
    }
}

// Función para eliminar usuario
async function eliminarUsuario(e) {
    const usuarioId = e.currentTarget.dataset.id;
    
    if (!confirm('¿Estás seguro de eliminar este usuario?')) return;
    
    try {
        const response = await fetch(`http://localhost:3000/api/auth/users/${usuarioId}`, {
            method: 'DELETE',
            headers: { 
                'Content-Type': 'application/json',
                ...getAuthHeader()
            }
        });

        if (!response.ok) throw new Error('Error al eliminar usuario');

        mostrarAlerta('Usuario eliminado correctamente', 'success');
        cargarUsuarios();
    } catch (error) {
        console.error('Error al eliminar:', error);
        mostrarAlerta(error.message || 'Error al eliminar usuario', 'danger');
    }
}

// Función para editar usuario
async function editarUsuario(e) {
    const usuarioId = e.currentTarget.dataset.id;
    
    try {
        const response = await fetch(`http://localhost:3000/api/auth/users/${usuarioId}`, {
            headers: { 
                'Content-Type': 'application/json',
                ...getAuthHeader()
            }
        });

        if (!response.ok) throw new Error('Error al cargar usuario');
        
        const usuario = await response.json();
        
        // Llenar formulario con datos del usuario
        document.getElementById('usuario-nombre').value = usuario.name;
        document.getElementById('usuario-email').value = usuario.email;
        document.getElementById('usuario-rol').value = usuario.role;
        
        // Cambiar el formulario a modo edición
        const form = document.getElementById('form-usuario');
        form.dataset.editingId = usuarioId;
        form.querySelector('button[type="submit"]').textContent = 'Actualizar Usuario';
        
        // Agregar botón cancelar si no existe
        if (!form.querySelector('#btn-cancelar-usuario')) {
            const cancelBtn = document.createElement('button');
            cancelBtn.id = 'btn-cancelar-usuario';
            cancelBtn.type = 'button';
            cancelBtn.className = 'btn btn-secondary ms-2';
            cancelBtn.textContent = 'Cancelar';
            cancelBtn.onclick = cancelarEdicionUsuario;
            form.querySelector('button[type="submit"]').after(cancelBtn);
        }
        
        // Deshabilitar campo de contraseña en edición
        document.getElementById('usuario-password').disabled = true;
    } catch (error) {
        console.error('Error al cargar usuario:', error);
        mostrarAlerta('Error al cargar usuario', 'danger');
    }
}

// Función para cancelar edición de usuario
function cancelarEdicionUsuario() {
    const form = document.getElementById('form-usuario');
    form.reset();
    delete form.dataset.editingId;
    form.querySelector('button[type="submit"]').textContent = 'Crear Usuario';
    document.getElementById('usuario-password').disabled = false;
    
    const cancelBtn = document.getElementById('btn-cancelar-usuario');
    if (cancelBtn) cancelBtn.remove();
}

// Función para filtrar usuarios
function filtrarUsuarios() {
    const rol = document.getElementById('usuario-rol-filter').value;
    const searchTerm = document.getElementById('usuario-search').value.toLowerCase();
    
    let filtered = allUsers;
    
    if (rol !== 'todos') {
        filtered = filtered.filter(u => u.role === rol);
    }
    
    if (searchTerm) {
        filtered = filtered.filter(u => 
            u.name.toLowerCase().includes(searchTerm) || 
            u.email.toLowerCase().includes(searchTerm));
    }
    
    renderUsuarios(filtered);
}

// Función para actualizar usuario
async function actualizarUsuario(usuarioId, e) {
    const btnSubmit = e.target.querySelector('button[type="submit"]');
    btnSubmit.disabled = true;
    btnSubmit.innerHTML = '<span class="spinner-border spinner-border-sm" role="status"></span> Procesando...';

    const usuario = {
        name: document.getElementById('usuario-nombre').value,
        email: document.getElementById('usuario-email').value,
        role: document.getElementById('usuario-rol').value
    };

    try {
        const response = await fetch(`http://localhost:3000/api/auth/users/${usuarioId}`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                ...getAuthHeader()
            },
            body: JSON.stringify(usuario)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error desconocido');
        }

        mostrarAlerta('Usuario actualizado correctamente', 'success');
        cancelarEdicionUsuario();
        cargarUsuarios();
    } catch (error) {
        console.error('Error:', error);
        mostrarAlerta(error.message, 'danger');
    } finally {
        btnSubmit.disabled = false;
        btnSubmit.textContent = 'Actualizar Usuario';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Verificar autenticación y rol
    const auth = checkAuth();
    if (!auth || auth.user.role !== 'admin') {
        window.location.href = 'login.html';
        return;
    }

    const form = document.getElementById('form-producto');
    const listaProductos = document.getElementById('lista-productos');
    const btnSubmit = form.querySelector('button[type="submit"]');
    let editingId = null;
    document.getElementById('descripcion').maxLength = 150; 

    // Cargar productos al iniciar
    cargarProductos();
    loadCategories();

    // Guardar o actualizar producto
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        btnSubmit.disabled = true;
        btnSubmit.innerHTML = '<span class="spinner-border spinner-border-sm" role="status"></span> Procesando...';
    
        const productoData = {
            nombre: document.getElementById('nombre').value,
            precio: parseFloat(document.getElementById('precio').value),
            imagen: document.getElementById('imagen').value,
            descripcion: document.getElementById('descripcion').value,
            categoria: document.getElementById('categoria').value,
            unidadMedida: document.getElementById('unidadMedida').value,
            subcategoria: document.getElementById('subcategoria').value
        };
    
        try {
            // Primero verifica si es una subcategoría nueva
            const subcategoria = productoData.subcategoria;
            const categoria = productoData.categoria;
            
            if (subcategoria) {
                // Intenta crear la subcategoría (si ya existe, no es problema)
                try {
                    await agregarNuevaSubcategoria(categoria, subcategoria);
                } catch (error) {
                    // Si el error es que ya existe, continuamos normalmente
                    if (!error.message.includes('ya existe')) {
                        throw error;
                    }
                }
            }
    
            // Ahora crea el producto
            const url = editingId 
                ? `http://localhost:3000/api/admin/producto/${editingId}`
                : 'http://localhost:3000/api/admin/producto';
    
            const method = editingId ? 'PUT' : 'POST';
    
            const response = await fetch(url, {
                method,
                headers: { 
                    'Content-Type': 'application/json',
                    ...getAuthHeader()
                },
                body: JSON.stringify(productoData)
            });
    
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error desconocido');
            }
    
            mostrarAlerta(editingId ? 'Producto actualizado correctamente' : 'Producto creado correctamente', 'success');
            form.reset();
            editingId = null;
            await cargarProductos();
            await loadCategories(); // Recargar categorías y subcategorías
        } catch (error) {
            console.error('Error:', error);
            mostrarAlerta(error.message, 'danger');
        } finally {
            btnSubmit.disabled = false;
            btnSubmit.textContent = editingId ? 'Actualizar Producto' : 'Guardar Producto';
        }
    });

    document.getElementById('categoria-filter').addEventListener('change', () => {
        updateSubcategoryFilter();
        filterProducts();
    });

    document.getElementById('subcategoria-filter').addEventListener('change', filterProducts);
    document.getElementById('search-input').addEventListener('input', filterProducts);

    document.getElementById('btn-nueva-categoria').addEventListener('click', () => {
        document.getElementById('nueva-categoria-nombre').value = '';
        const modal = new bootstrap.Modal(document.getElementById('nuevaCategoriaModal'));
        modal.show();
    });
    
    document.getElementById('btn-guardar-categoria').addEventListener('click', async () => {
        const nombre = document.getElementById('nueva-categoria-nombre').value.trim();
        
        if (!nombre) {
            mostrarAlerta('Por favor ingrese un nombre para la categoría', 'warning');
            return;
        }
        
        const success = await agregarNuevaCategoria(nombre);
        
        if (success) {
            document.getElementById('nueva-categoria-nombre').value = '';
            bootstrap.Modal.getInstance(document.getElementById('nuevaCategoriaModal')).hide();
        }
    });

    document.getElementById('categoria').addEventListener('change', function() {
        const categoriaId = this.value;
        loadSubcategories(categoriaId);
        
        // Actualizar el campo de categoría en el modal de subcategoría
        document.getElementById('subcategoria-categoria-actual').value = categoriaId || '';
        document.getElementById('subcategoria-categoria-nombre').textContent = 
            this.options[this.selectedIndex]?.text || '';
    });
    
    // Manejar clic en botón de nueva subcategoría
    document.getElementById('btn-nueva-subcategoria').addEventListener('click', () => {
        const categoriaSelect = document.getElementById('categoria');
        const categoriaId = categoriaSelect.value;
        const categoriaNombre = categoriaSelect.options[categoriaSelect.selectedIndex].text;
        
        if (!categoriaId) {
            mostrarAlerta('Primero seleccione una categoría', 'warning');
            return;
        }
        
        // Actualiza el modal
        const nombreCategoriaElement = document.getElementById('subcategoria-categoria-nombre');
        if (nombreCategoriaElement) {
            nombreCategoriaElement.textContent = categoriaNombre;
        }
        
        document.getElementById('subcategoria-categoria-actual').value = categoriaId;
        document.getElementById('nueva-subcategoria-nombre').value = '';
        
        const modal = new bootstrap.Modal(document.getElementById('nuevaSubcategoriaModal'));
        modal.show();
    });
    
    // Manejar guardar nueva subcategoría (versión corregida)
    document.getElementById('btn-guardar-subcategoria').addEventListener('click', async () => {
        const categoriaId = document.getElementById('subcategoria-categoria-actual').value;
        const nombreSubcategoria = document.getElementById('nueva-subcategoria-nombre').value.trim();
        
        if (!nombreSubcategoria) {
            mostrarAlerta('Por favor ingrese un nombre para la subcategoría', 'warning');
            return;
        }
        
        try {
            await agregarNuevaSubcategoria(categoriaId, nombreSubcategoria);
            mostrarAlerta('Subcategoría creada correctamente', 'success');
            
            // Actualizar el select de subcategorías
            await loadSubcategories(categoriaId);
            
            // Cerrar modal y limpiar
            document.getElementById('nueva-subcategoria-nombre').value = '';
            bootstrap.Modal.getInstance(document.getElementById('nuevaSubcategoriaModal')).hide();
        } catch (error) {
            // El error ya se muestra en agregarNuevaSubcategoria
        }
    });

    // Cargar productos desde la API
    async function cargarProductos() {
        try {
            const response = await fetch('http://localhost:3000/api/producto', {
                headers: { 
                    'Content-Type': 'application/json',
                    ...getAuthHeader()
                }
            });
    
            if (!response.ok) throw new Error('Error al cargar productos');
            
            allProducts = await response.json();
            filterProducts(); // Esto mostrará los productos con los filtros actuales
        } catch (error) {
            console.error('Error:', error);
            mostrarAlerta('Error al cargar los productos. Intente nuevamente.', 'danger');
        }
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
                    'Content-Type': 'application/json',
                    ...getAuthHeader()
                }
              });
            if (!response.ok) throw new Error('Error al cargar producto');
            
            const producto = await response.json();
            document.getElementById('nombre').value = producto.nombre;
            document.getElementById('precio').value = producto.precio;
            document.getElementById('imagen').value = producto.imagen;
            document.getElementById('descripcion').value = producto.descripcion || '';
            document.getElementById('unidadMedida').value = producto.unidadMedida || 'kg';
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
            headers: { 
                'Content-Type': 'application/json',
                ...getAuthHeader()
            }
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
                headers: { 
                    'Content-Type': 'application/json',
                    ...getAuthHeader()
                }
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
                    ${pedido.estado === 'completado' && pedido.tipoEnvio === 'otra-localidad' ? `
                        <button class="btn btn-sm btn-secondary btn-imprimir-remito ms-2" data-id="${pedido._id}">
                            <i class="bi bi-printer"></i> Remito
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

        document.querySelectorAll('.btn-imprimir-remito').forEach(btn => {
            btn.addEventListener('click', generarRemitoPDF);
        });
    }
    
    // Función para mostrar detalles del pedido en modal
    async function mostrarDetallePedido(e) {
        const pedidoId = e.currentTarget.dataset.id;
        
        try {
            const response = await fetch(`http://localhost:3000/api/pedidos/${pedidoId}`, {
                headers: { 
                    'Content-Type': 'application/json',
                    ...getAuthHeader()
                }
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
                <strong>WhatsApp:</strong> <a href="https://wa.me/${pedido.cliente.whatsapp}?text=${encodeURIComponent(generarMensajeWhatsApp(pedido))}" target="_blank">${pedido.cliente.whatsapp}</a><br>
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
                        <p><strong>Completado por:</strong> ${pedido.completadoPor?.name}</p>
                        <p><strong>Fecha de completado:</strong> ${new Date(pedido.fechaCompletado).toLocaleString()}</p>
                        <p><strong>Observaciones generales:</strong> ${pedido.observaciones || 'Ninguna'}</p>
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

            if (pedido.estado === 'completado' && pedido.tipoEnvio === 'otra-localidad') {
                accionesDiv.innerHTML += `
                    <button class="btn btn-secondary ms-2" onclick="generarRemitoPDFFromModal('${pedido._id}')">
                        <i class="bi bi-printer"></i> Imprimir Remito
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
                        headers: { 
                            'Content-Type': 'application/json',
                            ...getAuthHeader()
                        }
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

    function generarMensajeWhatsApp(pedido) {
        let mensaje = `¡Hola ${pedido.cliente.nombre}! 👋\n\n`;
        mensaje += `Aquí tienes los detalles de tu pedido #${pedido._id.toString().substring(18, 24)}:\n\n`;
        
        // Lista de productos
        mensaje += `📦 *Productos:*\n`;
        pedido.items.forEach(item => {
            const completado = pedido.estado === 'completado' ? item.completado : true;
            const precioLinea = completado ? 
                                `= $${item.precioTotal.toLocaleString('es-AR')}` : 
                                `= no agregado${item.motivoIncompleto ? ` (${item.motivoIncompleto})` : ''}`;
            
            mensaje += `- ${item.nombre} (${item.cantidad} x $${item.precioUnitario.toLocaleString('es-AR')}) ${precioLinea}\n`;
        });
        
        // Calcular total solo de los productos completados
        const totalCompletado = pedido.estado === 'completado' ? 
                            pedido.items.reduce((sum, item) => sum + (item.completado ? item.precioTotal : 0), 0) :
                            pedido.total;
        
        // Total
        mensaje += `\n💰 *Total:* $${totalCompletado.toLocaleString('es-AR')}\n\n`;
        
        // Información de envío
        mensaje += `🚚 *Método de entrega:* `;
        mensaje += pedido.tipoEnvio === 'retiro' ? 'Retiro en local' :
                pedido.tipoEnvio === 'bahia-blanca' ? 'Envío en Bahía Blanca' :
                'Envío a otra localidad';
        
        
        mensaje += `\n\n¡Gracias por tu compra! ❤️`;
        
        return mensaje;
    }

    // Función para generar el remito en PDF
    async function generarRemitoPDF(e) {
        const pedidoId = e.currentTarget.dataset.id;
        
        try {
            const response = await fetch(`http://localhost:3000/api/pedidos/${pedidoId}`, {
                headers: { 
                    'Content-Type': 'application/json',
                    ...getAuthHeader()
                }
            });
            
            if (!response.ok) throw new Error('Error al cargar pedido');
            const pedido = await response.json();
            
            // Crear PDF
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });
            
            // Configuración de estilo
        const fontSizeLarge = 36;
        const fontSizeMedium = 24;
        const lineHeight = 20;
        let yPosition = 40; // Posición vertical inicial
        
        // Establecer margen izquierdo para centrado aproximado
        const leftMargin = 20;
        
        // Información del destinatario - Título grande
        doc.setFontSize(fontSizeLarge);
        doc.setTextColor(0, 0, 0);
        doc.text('DESTINATARIO', 105, yPosition, { align: 'center' });
        yPosition += lineHeight * 2;
        
        // Datos del cliente - Texto grande
        doc.setFontSize(fontSizeMedium);
        
        // Nombre
        doc.text(pedido.cliente.nombre.toUpperCase(), 105, yPosition, { align: 'center' });
        yPosition += lineHeight;
        
        // Dirección (si existe)
        if (pedido.cliente.direccion) {
            const direccion = `${pedido.cliente.direccion.calle} ${pedido.cliente.direccion.numero || ''}`.toUpperCase();
            doc.text(direccion, 105, yPosition, { align: 'center' });
            yPosition += lineHeight;
            
            const localidad = `${pedido.cliente.direccion.localidad || ''}, ${pedido.cliente.direccion.provincia || ''}`.toUpperCase();
            doc.text(localidad, 105, yPosition, { align: 'center' });
            yPosition += lineHeight;
            
            if (pedido.cliente.direccion.codigoPostal) {
                doc.text(`CP: ${pedido.cliente.direccion.codigoPostal}`, 105, yPosition, { align: 'center' });
                yPosition += lineHeight;
            }
        }
        
        // Teléfono
        doc.text(`TEL: ${pedido.cliente.whatsapp}`, 105, yPosition, { align: 'center' });
        yPosition += lineHeight * 2;
        
        // Espacio para observaciones (si existen)
        if (pedido.observaciones) {
            doc.setFontSize(fontSizeMedium);
            doc.text('OBS:', 105, yPosition, { align: 'center' });
            yPosition += lineHeight;
            doc.text(pedido.observaciones.toUpperCase(), 105, yPosition, { align: 'center' });
            yPosition += lineHeight * 2;
        }
        
        // Espacio para firma (más abajo)
        yPosition = 250; // Posición fija cerca del final de la página
        doc.setFontSize(fontSizeMedium);
        doc.line(50, yPosition, 160, yPosition);
        doc.text('FIRMA', 105, yPosition + 10, { align: 'center' });
        
        // Guardar PDF
        doc.save(`Datos_Envio_${pedido.cliente.nombre.replace(/\s+/g, '_')}.pdf`);
        
    } catch (error) {
        console.error('Error al generar remito:', error);
        mostrarAlerta('Error al generar el remito en PDF', 'danger');
    }
    }
    
    // Función para cambiar estado del pedido
    window.cambiarEstadoPedido = async (pedidoId, nuevoEstado, recargar = false) => {
        const confirmMessage = nuevoEstado === 'cancelado' ? 
            '¿Estás seguro de cancelar este pedido?' :
            `¿Estás seguro de marcar este pedido como ${formatEstado(nuevoEstado).toLowerCase()}?`;
        
        if (!confirm(confirmMessage)) return;
        
        try {

            let itemsActualizados = [];
            let body = { estado: nuevoEstado };

            if (nuevoEstado === 'completado') {
                const checkboxes = document.querySelectorAll('.item-completado');
                itemsActualizados = Array.from(checkboxes).map(checkbox => {
                    const index = checkbox.id.split('-')[1];
                    return {
                        _id: pedidoActual.items[index]._id,
                        completado: checkbox.checked,
                        motivoIncompleto: checkbox.checked ? null : 
                            document.querySelector(`#motivo-container-${index} .motivo-select`).value,
                        observaciones: checkbox.checked ? null : 
                            document.querySelector(`#motivo-container-${index} .observaciones`).value
                    };
                });

                body.itemsCompletados = itemsActualizados;
            }

            const endpoint = nuevoEstado === 'completado' 
            ? `http://localhost:3000/api/admin/pedidos/${pedidoId}/completar`
            : `http://localhost:3000/api/admin/pedidos/${pedidoId}/estado`;

            const response = await fetch(endpoint, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    ...getAuthHeader()
                },
                body: JSON.stringify(body)
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al actualizar pedido');
            }
            
            const data = await response.json();

            mostrarAlerta(`Pedido ${formatEstado(nuevoEstado).toLowerCase()} correctamente`, 'success');
            
            if (recargar) {
                cargarPedidos();
                bootstrap.Modal.getInstance(document.getElementById('detallePedidoModal')).hide();
            } else {
                // Si se llamó desde la tabla, actualizar la fila
                const fila = document.querySelector(`tr[data-id="${pedidoId}"]`);
                if (fila) {
                    const estadoBadge = fila.querySelector('.badge-estado');
                    estadoBadge.className = `badge badge-estado ${getEstadoClass(nuevoEstado)}`;
                    estadoBadge.textContent = formatEstado(nuevoEstado);

                    const accionesTd = fila.querySelector('td:last-child');

                    if (nuevoEstado === 'completado') {
                        const totalCell = fila.querySelector('td:nth-child(4)');
                        totalCell.textContent = `$${data.pedido.total.toLocaleString('es-AR')}`;
                    }
                    
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
                headers: { 
                    'Content-Type': 'application/json',
                    ...getAuthHeader()
                }
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

    window.generarRemitoPDFFromModal = async (pedidoId) => {
        try {
            // Simulamos un click en el botón para reutilizar la función existente
            const event = { currentTarget: { dataset: { id: pedidoId } } };
            await generarRemitoPDF(event);
            
            // Cerrar el modal después de generar el PDF
            bootstrap.Modal.getInstance(document.getElementById('detallePedidoModal')).hide();
        } catch (error) {
            console.error('Error al generar remito desde modal:', error);
            mostrarAlerta('Error al generar el remito', 'danger');
        }
    };

    document.getElementById('usuarios-tab').addEventListener('shown.bs.tab', cargarUsuarios);
    
    // Formulario de usuario
    document.getElementById('form-usuario').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        if (this.dataset.editingId) {
            // Lógica para actualizar usuario
            await actualizarUsuario(this.dataset.editingId, e);
        } else {
            // Lógica para crear usuario
            await crearUsuario(e);
        }
    });
    
    // Filtros de usuarios
    document.getElementById('usuario-rol-filter').addEventListener('change', filtrarUsuarios);
    document.getElementById('usuario-search').addEventListener('input', filtrarUsuarios);
});