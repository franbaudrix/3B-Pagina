const express = require('express');
const Pedido = require('../models/Pedido');
const router = express.Router();

router.post('/', async (req, res) => {
  try {
    // Validar items (puedes añadir más validaciones)
    if (!req.body.items || req.body.items.length === 0) {
      return res.status(400).json({ message: "El pedido debe contener items" });
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