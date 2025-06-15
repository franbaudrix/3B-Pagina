const mongoose = require('mongoose');

const ProductoSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  precio: { type: Number, required: true },
  imagen: { type: String, required: true },
  descripcion: String,
  categoria: { type: String, required: true },
  subcategoria: String,
  unidadMedida: { 
    type: String, 
    enum: ['kg', 'unidad'], 
    default: 'kg' 
  },
  stock: { 
    type: Number, 
    required: true, 
    default: 0,
    min: 0 
  }
}, { timestamps: true });

module.exports = mongoose.model('Producto', ProductoSchema);