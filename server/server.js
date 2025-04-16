require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const adminRoutes = require('./routes/admin');
const bodyParser = require('body-parser');
const app = express();
const pedidosRouter = require('./routers/pedidos');

// Middlewares
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());

// Conexión a MongoDB
mongoose.connect(process.env.DB_URI)
    .then(() => console.log('✅ Conectado a MongoDB'))
    .catch(err => console.error('❌ Error de conexión:', err));

// Modelo de Pedido
const Pedido = mongoose.model('Pedido', {
    fecha: Date,
    items: [{
        producto: String,
        precioUnitario: Number,
        peso: String,
        cantidad: Number,
        precioTotal: Number
    }],
    total: Number,
    estado: String
});

// Rutas
app.use('/api/admin', adminRoutes);
app.use('/api', require('./routes/api')); // GET /api/productos
app.use('/api/admin', require('./routes/admin')); // POST /api/admin/productos
app.use('/api/pedidos', require('.routes/pedidosRouter'));

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor en http://localhost:${PORT}`));