const express = require('express');
const mongoose = require('mongoose'); 
const router = express.Router();
const Pedido = require('../models/pedidos');

router.get('/', async (req, res) => {
  try {
    const pedidos = await Pedido.find(); // Obtiene todos los pedidos
    res.json(pedidos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/pedidos/:id - Obtener un pedido específico por ID
router.get('/:id', async (req, res) => {
  try {
    const pedido = await Pedido.findById(req.params.id)
                              .populate('usuario')
                              .populate('items.producto');
    
    if (!pedido) {
      return res.status(404).json({ message: 'Pedido no encontrado' });
    }
    
    res.json(pedido);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}); 

// PUT /api/pedidos/:id - Actualizar pedido
router.put('/:id', async (req, res) => {
  try {
      // Validación mejorada
      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
          return res.status(400).json({ 
              success: false,
              message: "ID de pedido inválido"
          });
      }

      const { estado } = req.body;

      // Validar el estado
      const estadosPermitidos = ['pendiente', 'en_proceso' , 'completado', 'cancelado'];
      if (!estadosPermitidos.includes(estado)) {
          return res.status(400).json({
              success: false,
              message: "Estado no válido"
          });
      }

      const pedido = await Pedido.findByIdAndUpdate(
          req.params.id,
          { estado },
          { new: true, runValidators: true }
      );

      if (!pedido) {
          return res.status(404).json({
              success: false,
              message: "Pedido no encontrado"
          });
      }

      res.json({
          success: true,
          pedido
      });

  } catch (error) {
      console.error("Error en PUT /pedidos:", error);
      res.status(500).json({
          success: false,
          message: error.message || "Error interno del servidor"
      });
  }
});

// PUT /api/pedidos/:id/items - Actualizar estado de ítems
router.put('/:id/items', async (req, res) => {
  try {
      const { items } = req.body;
      const pedido = await Pedido.findById(req.params.id);
      
      if (!pedido) {
          return res.status(404).json({ success: false, message: "Pedido no encontrado" });
      }
      
      // Actualizar cada ítem
      items.forEach(update => {
          const item = pedido.items.id(update._id);
          if (item) {
              item.completado = update.completado;
              item.motivoIncompleto = update.motivoIncompleto;
              item.observaciones = update.observaciones;
          }
      });
      
      await pedido.save();
      
      res.json({ 
          success: true,
          pedido: await Pedido.findById(pedido._id).populate('items.producto')
      });
  } catch (error) {
      res.status(500).json({ 
          success: false,
          message: error.message 
      });
  }
});

router.put('/:id/completar', async (req, res) => {
  console.log("Llamada a PUT /completar con ID:", req.params.id); 
  try {
      const pedido = await Pedido.findByIdAndUpdate(
          req.params.id,
          { estado: 'completado', fechaCompletado: new Date() },
          { new: true }
      ).populate('items.producto');

      if (!pedido) {
          return res.status(404).json({ 
              success: false,
              message: "Pedido no encontrado" 
          });
      }

      // Estructura de respuesta consistente
      res.json({
          success: true,
          message: "Pedido completado exitosamente",
          pedido: pedido
      });

  } catch (error) {
      res.status(500).json({
          success: false,
          message: error.message
      });
  }
});

router.post('/', async (req, res) => {
  try {
    const Pedido = require('../models/pedidos');
    console.log('Modelo Pedido cargado:', Pedido);
  } catch (err) {
    console.error('Error cargando modelo Pedido:', err);
  }

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

module.exports = router;