const express = require('express');
const router = express.Router();
const Producto = require('../models/producto');

// Middleware de autenticación
const autenticar = (req, res, next) => {
  //console.log("Body recibido (sin autenticación):", req.body); 
  const authHeader = req.headers.authorization;
  if (authHeader === '3BGOD') { // Hardcodeado para prueba
    next();
  } else {
    res.status(401).json({ error: "Acceso no autorizado" });
  }
};


// Configuración de rutas API
router.get('/producto', async (req, res) => { // Nueva ruta GET todos
  try {
    const productos = await Producto.find();
    res.json(productos);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener productos" });
  }
});

router.get('/producto/:id', async (req, res) => {
  try {
    const producto = await Producto.findById(req.params.id);
    if (!producto) return res.status(404).json({ error: "Producto no encontrado" });
    res.json(producto);
  } catch (error) {
    res.status(500).json({ error: "Error al buscar producto" });
  }
});

router.post('/producto', autenticar, async (req, res) => {
  //console.log("Body recibido:", req.body);
  try {
    const producto = new Producto(req.body);
    await producto.save();
    res.status(201).json(producto);
  } catch (error) {
    console.error("Error en POST /api/admin/producto:", error);
    res.status(400).json({ error: error.message });
  }
});

router.put('/producto/:id', autenticar, async (req, res) => {
  try {
    const producto = await Producto.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!producto) return res.status(404).json({ error: "Producto no encontrado" });
    res.json(producto);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/producto/:id', autenticar, async (req, res) => {
  try {
    const producto = await Producto.findByIdAndDelete(req.params.id);
    if (!producto) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }
    res.json({ message: "Producto eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar:", error);
    res.status(500).json({ 
      error: "Error al eliminar producto",
      details: error.message 
    });
  }
});

module.exports = router;