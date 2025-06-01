const API_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:3000'
  : 'https://threeb-pagina.onrender.com';

// Función para iniciar sesión
async function login(email, password) {
    try {
        const response = await fetch(`${API_URL}/api/auth/login`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error al iniciar sesión');
        }

        const data = await response.json();
        
        // Guardar token y datos de usuario en localStorage
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // Redirigir según el rol
        if (data.user.role === 'admin') {
            window.location.href = 'admin.html';
        } else {
            window.location.href = 'pedidos.html';
        }
        
        return data;
    } catch (error) {
        console.error('Error en login:', error);
        throw error;
    }
}

// Función para cerrar sesión
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}

// Función para verificar autenticación
function checkAuth() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    
    if (!token || !user) {
        window.location.href = '/login.html';
        return;
    }
    
    // Verificar token con el backend (opcional, puedes hacerlo periódicamente)
    return { token, user };
}

// Función para obtener el token de autorización
function getAuthHeader() {
    const token = localStorage.getItem('token');
    return {
        'Authorization': `Bearer ${token}`
    };
}

// Event listener para el formulario de login
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            try {
                await login(email, password);
            } catch (error) {
                const errorElement = document.getElementById('login-error');
                errorElement.textContent = error.message;
                errorElement.classList.remove('d-none');
            }
        });
    }
    
    // Agregar botón de logout si existe
    const logoutButtons = document.querySelectorAll('.btn-logout');
    logoutButtons.forEach(btn => {
        btn.addEventListener('click', logout);
    });
});