const express = require('express');
const app = express();
const router = express.Router();
const mongoose = require('mongoose');
const Producto = require('../models/producto');

// Middleware de autenticación básica
const autenticar = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader === process.env.API_ADMIN_KEY) { 
    next();
  } else {
    res.status(401).json({ error: "Acceso no autorizado" });
  }
};

// Ruta para obtener un producto por ID
router.get('/productos/:id', async (req, res) => {
    try {
        const producto = await Producto.findById(req.params.id); // Usa mongoose
        if (!producto) return res.status(404).json({ error: "Producto no encontrado" });
        res.json(producto);
    } catch (error) {
        res.status(500).json({ error: "Error al buscar producto" });
    }
});

// POST: Crear producto
router.post('/productos', autenticar, async (req, res) => {
  try {
    const producto = new Producto(req.body);
    await producto.save();
    res.status(201).json(producto);
  } catch (error) {
    res.status(400).json({ error: "Error al crear el producto" });
  }
});

// PUT: Actualizar producto
router.put('/productos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const productoActualizado = await Producto.findByIdAndUpdate(id, req.body, { new: true });
        if (!productoActualizado) {
            return res.status(404).json({ error: "Producto no encontrado" });
        }
        res.json(productoActualizado);
    } catch (error) {
        res.status(400).json({ error: "Error al actualizar el producto" });
    }
});

// DELETE: Eliminar producto
router.delete('/productos/:id', autenticar, async (req, res) => {
  try {
    await Producto.findByIdAndDelete(req.params.id);
    res.json({ message: "Producto eliminado" });
  } catch (error) {
    res.status(400).json({ error: "Error al eliminar el producto" });
  }
});

module.exports = router;