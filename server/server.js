require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const app = express();
const path = require('path');

// Middlewares
app.use(cors());
app.use(express.json());
app.use(cookieParser());

// Servir archivos estáticos
app.use(express.static(path.join(__dirname)));
app.use('/client', express.static(path.join(__dirname, 'client')));

// Todas las demás rutas van al index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/debug', (req, res) => {
  const fs = require('fs');
  const files = fs.readdirSync(__dirname);
  res.send(`
    <h1>Estructura de archivos:</h1>
    <pre>${files.join('\n')}</pre>
    <h2>Client:</h2>
    <pre>${fs.readdirSync(path.join(__dirname, 'client')).join('\n')}</pre>
  `);
});

app.get('/file-structure', (req, res) => {
  const fs = require('fs');
  const path = require('path');
  
  const listFiles = (dir, indent = 0) => {
    try {
      return fs.readdirSync(dir).map(file => {
        const fullPath = path.join(dir, file);
        const stats = fs.statSync(fullPath);
        return ' '.repeat(indent) + 
               (stats.isDirectory() ? `📁 ${file}/` : `📄 ${file}`) +
               (stats.isFile() ? ` (${stats.size} bytes)` : '') +
               '\n' +
               (stats.isDirectory() ? listFiles(fullPath, indent + 4) : '');
      }).join('\n');
    } catch (error) {
      return `❌ Error reading ${dir}: ${error.message}`;
    }
  };

  res.type('text/plain').send(`Estructura de archivos:\n${listFiles(__dirname)}`);
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