const mongoose = require('mongoose');

const categoriaSchema = new mongoose.Schema({
  nombre: { type: String, required: true, unique: true },
  subcategorias: [{ type: String }] 
}, { timestamps: true });

module.exports = mongoose.model('Categorias', categoriaSchema);