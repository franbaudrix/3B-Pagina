require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const app = express();
const path = require('path');
const fs = require('fs');
const { auth, admin } = require('./middleware/auth');

const allowedOrigins = [
  'https://threeb-clientes.onrender.com',
  'https://threeb-pagina.onrender.com',
  'http://127.0.0.1:5500',
  'http://localhost:5500'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS no permitido: ' + origin));
    }
  },
  credentials: true
}));


// Middlewares
app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.json());

// Conexión a MongoDB
mongoose.connect(process.env.DB_URI)
  .then(() => console.log('✅ Conectado a MongoDB'))
  .catch(err => console.error('❌ Error de conexión:', err));

// Modelos
require('./models/pedidos');
require('./models/producto');
require('./models/usuarios');  
require('./models/categorias');

// Importación de rutas
const apiRoutes = require('./routes/shopRoutes');
const adminRoutes = require('./routes/adminRoutes');
const pedidosRoutes = require('./routes/pedidosRoutes');
const authRoutes = require('./routes/authRoutes');

// Configuración de rutas API (DEBEN IR ANTES DEL CATCH-ALL)
app.use('/api', apiRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/pedidos', pedidosRoutes);
app.use('/api/auth', authRoutes);

app.use('/admin', express.static(path.join(__dirname, '../client/paginaAdmin')));
app.use('/empleado', express.static(path.join(__dirname, '../client/paginaEmpleados')));

// Ruta de información del servidor
app.get('/server-info', (req, res) => {
  res.json({
    nodeVersion: process.version,
    port: process.env.PORT || 3000,
    environment: process.env.NODE_ENV || 'development'
  });
});

// Configuración de archivos estáticos (SOLO PARA PRODUCCIÓN)
const CLIENT_DIR = path.join(__dirname, '../client/paginaCliente');
if (process.env.NODE_ENV === 'production') {
  if (!fs.existsSync(CLIENT_DIR)) {
    console.error(`ERROR: No se encuentra la carpeta client en ${CLIENT_DIR}`);
  } else {
    app.use(express.static(CLIENT_DIR));
    app.use('/img', express.static(path.join(CLIENT_DIR, 'img')));
    
    // Catch-all route PARA PRODUCCIÓN (solo después de las APIs)
    app.get('*', (req, res) => {
      res.sendFile(path.join(CLIENT_DIR, 'index.html'));
    });
  }
}

// Iniciar servidor
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`🚀 Servidor en puerto ${PORT}`);
  console.log(`🔗 Modo: ${process.env.NODE_ENV || 'development'}`);
});