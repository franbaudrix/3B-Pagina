const mongoose = require('mongoose');

const ItemSchema = new mongoose.Schema({
    producto: { type: mongoose.Schema.Types.ObjectId, ref: 'Producto', required: true },
    nombre: { type: String, required: true },
    precioUnitario: { type: Number, required: true },
    subtotal: { type: Number, required: true },  
    peso: { type: String, required: true },
    cantidad: { type: Number, required: true },  
    precioTotal: { type: Number, required: true },
    completado: { type: Boolean, default: false },
    motivoIncompleto: {
        type: String,
        enum: ['sin stock', 'dañado', 'no solicitado', 'otro'],
        default: null
    },
    observaciones: String
});

const PedidoSchema = new mongoose.Schema({
  usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, 
  asignados: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  items: [ItemSchema],
  total: { type: Number, required: true },
  estado: { 
    type: String, 
    default: 'revision', 
    enum: ['revision', 'pendiente', 'en_proceso', 'completado', 'cancelado', 'entregado'] 
  },
  fecha: { type: Date, default: Date.now },
  tipoEnvio: {
    type: String,
    required: true,
    enum: ['bahia-blanca', 'retiro', 'otra-localidad']
  },
  cliente: {
    nombre: { type: String, required: true },
    whatsapp: { type: String, required: true },
    email: { type: String, required: true },
    direccion: {
      calle: { type: String },
      numero: { type: String },
      localidad: { type: String },
      provincia: { type: String },
      codigoPostal: { type: String }
    }
  },
  observaciones: String,
  completadoPor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  bultos: [{
    tipo: {
      type: String,
      enum: ['bolsa', 'caja', 'bolson'],
      required: true
    },
    cantidad: {
      type: Number,
      required: true,
      min: 1
    }
  }],
  fechaCompletado: { type: Date }
}, { versionKey: false });

module.exports = mongoose.model('Pedido', PedidoSchema);
