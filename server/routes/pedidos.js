const express = require('express');
const mongoose = require('mongoose'); 
const router = express.Router();
const Pedido = require('../models/pedidos');

router.get('/', async (req, res) => {
  try {
    const pedidos = await Pedido.find().populate('cliente'); // Obtiene todos los pedidos
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
      const estadosPermitidos = ['revision', 'pendiente', 'en_proceso' , 'completado', 'cancelado'];
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
    try {
      const { itemsCompletados } = req.body; // Array con el estado de cada item
      
      const pedido = await Pedido.findById(req.params.id);
      if (!pedido) {
        return res.status(404).json({ 
          success: false,
          message: "Pedido no encontrado" 
        });
      }
  
      // Actualizar estado de cada item
      if (itemsCompletados && itemsCompletados.length > 0) {
        itemsCompletados.forEach(itemUpdate => {
            const item = pedido.items.id(itemUpdate._id);
            if (item) {
                item.completado = itemUpdate.completado;
                item.motivoIncompleto = itemUpdate.motivoIncompleto;
                item.observaciones = itemUpdate.observaciones;
            }
        });
      }
  
      // Marcar pedido como completado
      pedido.estado = 'completado';
      pedido.fechaCompletado = new Date();
      
      await pedido.save();
  
      res.json({
        success: true,
        message: "Pedido completado exitosamente",
        pedido: await Pedido.findById(pedido._id).populate('items.producto')
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
      console.log("Body recibido anashe:", req.body);
      
      // Validar campos obligatorios
      if (!req.body.items || req.body.items.length === 0) {
          return res.status(400).json({ message: "El pedido debe contener items" });
      }
      
      if (!req.body.tipoEnvio || !req.body.cliente || !req.body.cliente.nombre || 
          !req.body.cliente.whatsapp || !req.body.cliente.email) {
          return res.status(400).json({ message: "Faltan datos obligatorios del cliente" });
      }
      
      // Validar dirección según tipo de envío
      if (req.body.tipoEnvio === 'bahia-blanca') {
          if (!req.body.cliente.direccion || !req.body.cliente.direccion.calle || !req.body.cliente.direccion.numero) {
              return res.status(400).json({ message: "Falta la dirección para envío en Bahía Blanca" });
          }
      }
      
      if (req.body.tipoEnvio === 'otra-localidad') {
          if (!req.body.cliente.direccion || !req.body.cliente.direccion.calle || 
              !req.body.cliente.direccion.numero || !req.body.cliente.direccion.localidad || 
              !req.body.cliente.direccion.provincia || !req.body.cliente.direccion.codigoPostal) {
              return res.status(400).json({ message: "Faltan datos de dirección para envío a otra localidad" });
          }
      }

      const nuevoPedido = new Pedido({
          ...req.body,
          usuario: req.userId // Si tienes autenticación
      });

      const pedidoGuardado = await nuevoPedido.save();
      res.status(201).json(pedidoGuardado);

  } catch (error) {
      console.error("Error al crear pedido:", error);
      res.status(500).json({ 
          message: error.message || "Error interno del servidor al crear el pedido" 
      });
  }
});

module.exports = router;