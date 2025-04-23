require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Conexión a MongoDB
mongoose.connect(process.env.DB_URI)
    .then(() => console.log('✅ Conectado a MongoDB'))
    .catch(err => console.error('❌ Error de conexión:', err));

require('./models/pedidos');
require('./models/producto'); 

// Importación de rutas
const apiRoutes = require('./routes/api');
const adminRoutes = require('./routes/admin');
const pedidosRoutes = require('./routes/pedidos');

// Configuración de rutas
app.use('/api', apiRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/pedidos', pedidosRoutes);

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor en http://localhost:${PORT}`));