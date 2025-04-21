const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Pedido = mongoose.model('Pedido');

router.post('/', async (req, res) => {
  try {
    console.log("Body recibido:", req.body);
    // Validar items (puedes añadir más validaciones)
    if (!req.body.items || req.body.items.length === 0) {
      return res.status(400).json({ message: "El pedido debe contener items flaco" });
    }

    const nuevoPedido = new Pedido({
      ...req.body,
      usuario: req.userId // Si tienes autenticación
    });

    const pedidoGuardado = await nuevoPedido.save();
    res.status(201).json(pedidoGuardado);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/test', async (req, res) => {
  try {
    const nuevoPedido = new Pedido({
      estado: 'pendiente',
      items: [{ nombre: 'Producto Test', cantidad: 1, precioUnitario: 100 }],
      total: 100
    });
    await nuevoPedido.save();
    res.json({ message: 'Pedido creado correctamente!', pedido: nuevoPedido });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;