const express = require('express');
const mongoose = require('mongoose'); 
const router = express.Router();
const Pedido = require('../models/pedidos');
const { auth } = require('../middleware/auth');

// Middleware de autenticación
router.use(auth);

// Todas las rutas requieren autenticación
router.use((req, res, next) => {
  if (req.method === 'POST' && req.path === '/') {
    return next(); // Saltar el middleware de autenticación para POST /
  }
  auth(req, res, next); // Aplicar autenticación a todas las demás rutas
});

router.get('/', async (req, res) => {
  try {
    const { estado, nombre, fecha } = req.query;
    const query = { estado: { $ne: 'revision' } }; // Excluir pedidos en revisión

    // Filtro por estado
    if (estado && estado !== 'todos') {
      query.estado = estado;
    }

    // Filtro por nombre de cliente
    if (nombre) {
      query['cliente.nombre'] = { $regex: nombre, $options: 'i' };
    }

    // Filtro por fecha
    if (fecha) {
      const startDate = new Date(fecha);
      const endDate = new Date(fecha);
      endDate.setDate(endDate.getDate() + 1);
      query.fecha = { $gte: startDate, $lt: endDate };
    }

    const pedidos = await Pedido.find(query)
      .populate('cliente')
      .sort({ fecha: -1 });

    res.json(pedidos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/pedidos/:id - Obtener un pedido específico por ID
router.get('/:id', async (req, res) => {
  try {
    const pedido = await Pedido.findById(req.params.id)
      .populate('cliente')
      .populate('completadoPor', 'nombre email');

    if (!pedido) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }

    res.json(pedido);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/pedidos/:id - Actualizar pedido
router.put('/:id', async (req, res) => {
  try {
    const { estado, items, esActualizacion } = req.body;
    const pedido = await Pedido.findById(req.params.id);

    if (!pedido) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }

    // Actualización de items
    if (items && Array.isArray(items)) {
      items.forEach(itemUpdate => {
        const item = pedido.items.id(itemUpdate._id);
        if (item) {
          item.completado = itemUpdate.completado;
          item.motivoIncompleto = itemUpdate.completado ? null : itemUpdate.motivoIncompleto;
          item.observaciones = itemUpdate.completado ? null : itemUpdate.observaciones;
        }
      });
    }

    // Actualización de estado (excepto para actualizaciones de completados)
    if (estado && !esActualizacion) {
      const estadosValidos = ['pendiente', 'en_proceso', 'completado', 'cancelado'];
      if (!estadosValidos.includes(estado)) {
        return res.status(400).json({ error: 'Estado inválido' });
      }
      pedido.estado = estado;

      // Registrar completado
      if (estado === 'completado') {
        pedido.fechaCompletado = new Date();
        pedido.completadoPor = req.user._id;
      }
    }

    // Guardar cambios
    const updatedPedido = await pedido.save();
    const populatedPedido = await Pedido.findById(pedido._id)
      .populate('cliente')
      .populate('completadoPor', 'nombre email');

    res.json({
      success: true,
      pedido: populatedPedido
    });

  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
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
    const pedido = await Pedido.findById(req.params.id);
    
    if (!pedido) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }

    // Marcar todos los items como completados si no se especifican
    if (!req.body.items || req.body.items.length === 0) {
      pedido.items.forEach(item => {
        item.completado = true;
        item.motivoIncompleto = null;
        item.observaciones = null;
      });
    }

    // Actualizar estado
    pedido.estado = 'completado';
    pedido.fechaCompletado = new Date();
    pedido.completadoPor = req.user._id;

    await pedido.save();

    res.json({
      success: true,
      pedido: await Pedido.findById(pedido._id)
        .populate('cliente')
        .populate('completadoPor', 'nombre email')
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