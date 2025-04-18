const mongoose = require('mongoose');

const ProductoSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  precio: { type: Number, required: true },
  imagen: { type: String, required: true },
  descripcion: String,
  categoria: String,
});

module.exports = mongoose.model('Producto', ProductoSchema);