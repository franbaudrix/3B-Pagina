const express = require('express');
const router = express.Router();
const Producto = require('../models/producto');
const Categoria = require('../models/categorias');

// GET: Obtener todos los productos (con filtros opcionales)
router.get('/producto', async (req, res) => {
  try {
    const { categoria, subcategoria, search, page = 1, limit = 12 } = req.query;
    const query = {};

    if (categoria) query.categoria = categoria;
    if (subcategoria) query.subcategoria = subcategoria;
    if (search) {
      query.$or = [
        { nombre: { $regex: search, $options: 'i' } },
        { descripcion: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const productos = await Producto.find(query).skip(skip).limit(parseInt(limit));

    res.json(productos);
  } catch (error) {
    console.error('Error al obtener productos paginados:', error);
    res.status(500).json({ error: 'Error al obtener productos' });
  }
});


// GET: Obtener categorías y subcategorías disponibles (versión mejorada)
router.get('/categorias', async (req, res) => {
  try {
    const categorias = await Categoria.find({}, '_id nombre subcategorias'); // Proyección para incluir solo estos campos
    res.json(categorias);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;