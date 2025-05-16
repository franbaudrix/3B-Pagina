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

app.use(express.static(path.join(__dirname, '..', 'client')));

app.get('/file-structure', (req, res) => {
  try {
    const getStructure = (dir, depth = 0) => {
      if (depth > 3) return '[...]'; // Limitar profundidad
      
      try {
        return fs.readdirSync(dir).map(file => {
          const fullPath = path.join(dir, file);
          try {
            const stats = fs.statSync(fullPath);
            if (stats.isDirectory()) {
              return `${'  '.repeat(depth)}📂 ${file}/\n${getStructure(fullPath, depth + 1)}`;
            } else {
              return `${'  '.repeat(depth)}📄 ${file} (${stats.size} bytes)`;
            }
          } catch (e) {
            return `${'  '.repeat(depth)}❌ ${file} (Error: ${e.message})`;
          }
        }).join('\n');
      } catch (e) {
        return `❌ Error leyendo directorio: ${e.message}`;
      }
    };

    const structure = `
      Directorio actual: ${__dirname}
      Estructura:
      ${getStructure(__dirname)}
      
      ¿Existe /client?
      ${fs.existsSync(path.join(__dirname, 'client')) ? '✅ Sí' : '❌ No'}
      
      ¿Existe /client/paginaClientes?
      ${fs.existsSync(path.join(__dirname, 'client', 'paginaClientes')) ? '✅ Sí' : '❌ No'}
    `;

    res.type('text/plain').send(structure);
  } catch (error) {
    res.status(500).send(`Error en el diagnóstico: ${error.message}`);
  }
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