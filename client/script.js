document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('http://localhost:3000/api/productos');
        const productos = await response.json();

        const container = document.getElementById('productos-container');
        container.innerHTML = productos.map(producto => `
            <div class="col-md-4">
                <div class="card h-100">
                    <img src="${producto.imagen}" class="card-img-top" alt="${producto.nombre}">
                    <div class="card-body">
                        <h5 class="card-title">${producto.nombre}</h5>
                        <p class="card-text">$${producto.precio.toFixed(2)}</p>
                        <p class="card-text text-muted">${producto.descripcion || ''}</p>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error al cargar productos:', error);
        container.innerHTML = '<p class="text-danger">Error al cargar los productos. Intenta más tarde.</p>';
    }
});