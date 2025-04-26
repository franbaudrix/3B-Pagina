const express = require('express');
const router = express.Router();
const Producto = require('../models/producto');

// GET: Obtener todos los productos (con filtros opcionales)
router.get('/producto', async (req, res) => {
  try {
    const { categoria, subcategoria, search } = req.query;
    let query = {};
    
    if (categoria) query.categoria = categoria;
    if (subcategoria) query.subcategoria = subcategoria;
    if (search) {
      query.$or = [
        { nombre: { $regex: search, $options: 'i' } },
        { descripcion: { $regex: search, $options: 'i' } }
      ];
    }
    
    const productos = await Producto.find(query);
    res.json(productos);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener productos" });
  }
});

// GET: Obtener categorías y subcategorías disponibles
router.get('/categorias', async (req, res) => {
  try {
    const categorias = await Producto.distinct('categoria');
    const subcategorias = await Producto.distinct('subcategoria');
    
    res.json({
      categorias,
      subcategorias
    });
  } catch (error) {
    res.status(500).json({ error: "Error al obtener categorías" });
  }
});

module.exports = router;