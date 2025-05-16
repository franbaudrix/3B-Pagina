require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const app = express();
const path = require('path');
const fs = require('fs');

// Middlewares
app.use(cors());
app.use(express.json());
app.use(cookieParser());

const CLIENT_DIR = path.join(__dirname, '../client/paginaCliente');

if (!fs.existsSync(CLIENT_DIR)) {
  console.error(`ERROR: No se encuentra la carpeta client en ${CLIENT_DIR}`);
}

// Servir archivos estáticos
app.use(express.static(CLIENT_DIR));
app.use('/img', express.static(path.join(CLIENT_DIR, 'img')));

// Ruta principal
app.get('*', (req, res) => {
  res.sendFile(path.join(CLIENT_DIR, 'index.html'));
});

app.get('/server-info', (req, res) => {
  res.json({
    nodeVersion: process.version,
    port: process.env.PORT || 3000,
    actualPort: server.address().port, // ← Esto muestra el puerto real
    environment: process.env.NODE_ENV || 'development'
  });
});

// Conexión a MongoDB
mongoose.connect(process.env.DB_URI)

.then(() => console.log('✅ Conectado a MongoDB'))
.catch(err => console.error('❌ Error de conexión:', err));

require('./models/pedidos');
require('./models/producto');
require('./models/usuarios');  
require('./models/categorias');  

// Importación de rutas
const apiRoutes = require('./routes/shopRoutes');
const adminRoutes = require('./routes/adminRoutes');
const pedidosRoutes = require('./routes/pedidosRoutes');
const authRoutes = require('./routes/authRoutes')

// Configuración de rutas
app.use('/api', apiRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/pedidos', pedidosRoutes);
app.use('/api/auth', authRoutes);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'client', 'paginaCliente', 'index.html'));
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor en http://localhost:${PORT}`));