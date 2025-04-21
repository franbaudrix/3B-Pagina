const express = require('express');
const router = express.Router();
const Producto = require('../models/producto');

// GET: Obtener todos los productos
router.get('/producto', async (req, res) => {
  try {
    const productos = await Producto.find();
    res.json(productos);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener productos" });
  }
});

module.exports = router;