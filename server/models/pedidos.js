  const mongoose = require('mongoose');

  const ItemSchema = new mongoose.Schema({
      producto: { type: mongoose.Schema.Types.ObjectId, ref: 'Producto', required: true },
      nombre: { type: String, required: true },
      precioUnitario: { type: Number, required: true },
      subtotal: { type: Number, required: true },  
      peso: { type: String, required: true },
      cantidad: { type: Number, required: true },  
      precioTotal: { type: Number, required: true }
  });

  const PedidoSchema = new mongoose.Schema({
    usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' },
    items: [ItemSchema],
    total: { type: Number, required: true },
    estado: { type: String, default: 'pendiente', enum: ['pendiente', 'en_proceso' , 'completado', 'cancelado'] },
    fecha: { type: Date, default: Date.now },
    direccionEnvio: {
      calle: String,
      ciudad: String,
      codigoPostal: String
    }
  });

  module.exports = mongoose.model('Pedido', PedidoSchema);
