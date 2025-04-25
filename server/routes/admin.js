const express = require('express');
const router = express.Router();
const Producto = require('../models/producto');
const Pedido = require('../models/pedidos');


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

// Obtener pedidos con filtros
router.get('/pedidos', autenticar , async (req, res) => {
  try {
      const { estado, tipoEnvio, fecha } = req.query;
      
      const filtro = {};
      if (estado && estado !== 'todos') filtro.estado = estado;
      if (tipoEnvio && tipoEnvio !== 'todos') filtro.tipoEnvio = tipoEnvio;
      if (fecha) {
          const fechaInicio = new Date(fecha);
          const fechaFin = new Date(fechaInicio);
          fechaFin.setDate(fechaFin.getDate() + 1);
          
          filtro.fecha = {
              $gte: fechaInicio,
              $lt: fechaFin
          };
      }
      
      const pedidos = await Pedido.find(filtro)
          .sort({ fecha: -1 })
          .select('cliente.nombre cliente.direccion.localidad total tipoEnvio estado fecha');
      
      res.json(pedidos);
  } catch (error) {
      res.status(500).json({ message: error.message });
  }
});

// Obtener detalles de un pedido
router.get('/pedidos/:id', autenticar, async (req, res) => {
  try {
      const pedido = await Pedido.findById(req.params.id);
      if (!pedido) return res.status(404).json({ message: 'Pedido no encontrado' });
      res.json(pedido);
  } catch (error) {
      res.status(500).json({ message: error.message });
  }
});

// Actualizar estado de un pedido
router.put('/pedidos/:id/estado', autenticar, async (req, res) => {
  console.log('estoy actualizando el estado XD');
  try {
      const { estado } = req.body;
      const estadosPermitidos = ['revision', 'pendiente', 'en_proceso', 'completado', 'cancelado'];
      
      if (!estadosPermitidos.includes(estado)) {
          return res.status(400).json({ message: 'Estado no válido' });
      }
      
      const pedido = await Pedido.findByIdAndUpdate(
          req.params.id,
          { estado },
          { new: true }
      );
      
      if (!pedido) return res.status(404).json({ message: 'Pedido no encontrado' });
      res.json(pedido);
  } catch (error) {
      res.status(500).json({ message: error.message });
  }
});

// Eliminar un pedido
router.delete('/pedidos/:id', autenticar, async (req, res) => {
  try {
    const pedido = await Pedido.findByIdAndDelete(req.params.id);
    if (!pedido) {
      return res.status(404).json({ message: 'Pedido no encontrado' });
    }
    res.json({ message: 'Pedido eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error al eliminar pedido',
      details: error.message 
    });
  }
});

module.exports = router;