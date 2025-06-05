const express = require('express');
const router = express.Router();
const Producto = require('../models/producto');
const Pedido = require('../models/pedidos');
const { auth, admin } = require('../middleware/auth');
const Categoria = require('../models/categorias');



// Todas las rutas requieren autenticación y ser admin
router.use(auth);
router.use(admin);

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

router.post('/producto', async (req, res) => {
  console.log('Datos recibidos:', req.body);
  try {
    const producto = new Producto(req.body);
    await producto.save();
    res.status(201).json(producto);
  } catch (error) {
    console.error("Error en POST /api/admin/producto:", error);
    res.status(400).json({ error: error.message });
  }
});

router.put('/producto/:id', async (req, res) => {
  try {
    const producto = await Producto.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!producto) return res.status(404).json({ error: "Producto no encontrado" });
    res.json(producto);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/producto/:id', async (req, res) => {
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

// Rutas para categorías
router.post('/categorias', async (req, res) => {
  try {
    const { nombre, descripcion } = req.body;
    
    if (!nombre) {
      return res.status(400).json({ message: 'El nombre de la categoría es requerido' });
    }
    
    // Verificar si ya existe la categoría
    const categoriaExistente = await Categoria.findOne({ nombre });
    
    if (categoriaExistente) {
      return res.status(400).json({ 
        message: 'La categoría ya existe' 
      });
    }
    
    const nuevaCategoria = new Categoria({
      nombre,
      descripcion: descripcion || ''
    });
    
    await nuevaCategoria.save();
    
    res.status(201).json(nuevaCategoria);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/categorias', async (req, res) => {
  try {
    const categorias = await Categoria.find().populate('subcategorias');
    res.json(categorias);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/categorias/:id', async (req, res) => {
  try {
    const categoria = await Categoria.findById(req.params.id).populate('subcategorias');
    if (!categoria) {
      return res.status(404).json({ message: 'Categoría no encontrada' });
    }
    res.json(categoria);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/categorias/:id', async (req, res) => {
  try {
    const categoria = await Categoria.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).populate('subcategorias');
    
    if (!categoria) {
      return res.status(404).json({ message: 'Categoría no encontrada' });
    }
    
    res.json(categoria);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/categorias/:id', async (req, res) => {
  try {
    // Verificar si hay productos asociados a esta categoría
    const productosAsociados = await Producto.findOne({ categoria: req.params.id });
    
    if (productosAsociados) {
      return res.status(400).json({ 
        message: 'No se puede eliminar la categoría porque tiene productos asociados' 
      });
    }
    
    const categoria = await Categoria.findByIdAndDelete(req.params.id);
    
    if (!categoria) {
      return res.status(404).json({ message: 'Categoría no encontrada' });
    }
    
    res.json({ message: 'Categoría eliminada correctamente' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Rutas para subcategorías
router.post('/categorias/:categoriaId/subcategorias', async (req, res) => {
  console.log('Body recibido:', req.body); // ← Agrega esto
  console.log('Tipo de dato recibido:', typeof req.body.nombre); // ← Y esto
  try {
      const { nombre } = req.body; // Solo extraemos el nombre
      
      if (!nombre) {
          return res.status(400).json({ message: 'El nombre de la subcategoría es requerido' });
      }
      
      const categoria = await Categoria.findById(req.params.categoriaId);
      
      if (!categoria) {
          return res.status(404).json({ message: 'Categoría no encontrada' });
      }
      
      // Verificar si la subcategoría ya existe
      if (categoria.subcategorias.includes(nombre)) {
          return res.status(400).json({ 
              message: 'La subcategoría ya existe en esta categoría' 
          });
      }
      
      // Agregar la subcategoría (solo el nombre como string)
      categoria.subcategorias.push(nombre);
      await categoria.save();
      
      res.status(201).json(categoria);
  } catch (error) {
      res.status(500).json({ message: error.message });
  }
});

router.put('/categorias/:categoriaId/subcategorias/:subcategoriaId', async (req, res) => {
  try {
    const { nombre, descripcion } = req.body;
    const categoria = await Categoria.findById(req.params.categoriaId);
    
    if (!categoria) {
      return res.status(404).json({ message: 'Categoría no encontrada' });
    }
    
    const subcategoria = categoria.subcategorias.id(req.params.subcategoriaId);
    
    if (!subcategoria) {
      return res.status(404).json({ message: 'Subcategoría no encontrada' });
    }
    
    if (nombre) subcategoria.nombre = nombre;
    if (descripcion) subcategoria.descripcion = descripcion;
    
    await categoria.save();
    
    res.json(subcategoria);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/categorias/:categoriaId/subcategorias/:subcategoriaId', async (req, res) => {
  try {
    const categoria = await Categoria.findById(req.params.categoriaId);
    
    if (!categoria) {
      return res.status(404).json({ message: 'Categoría no encontrada' });
    }
    
    // Verificar si hay productos asociados a esta subcategoría
    const productosAsociados = await Producto.findOne({ 
      subcategoria: req.params.subcategoriaId 
    });
    
    if (productosAsociados) {
      return res.status(400).json({ 
        message: 'No se puede eliminar la subcategoría porque tiene productos asociados' 
      });
    }
    
    const subcategoria = categoria.subcategorias.id(req.params.subcategoriaId);
    
    if (!subcategoria) {
      return res.status(404).json({ message: 'Subcategoría no encontrada' });
    }
    
    subcategoria.remove();
    await categoria.save();
    
    res.json({ message: 'Subcategoría eliminada correctamente' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Obtener pedidos con filtros
router.get('/pedidos', async (req, res) => {
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
router.get('/pedidos/:id', async (req, res) => {
  try {
      const pedido = await Pedido.findById(req.params.id)
        .populate('usuario')
        .populate('asignados')
        .populate('completadoPor');

      console.log('pedido.completadoPor:', pedido.completadoPor);
        
      if (!pedido) return res.status(404).json({ message: 'Pedido no encontrado' });
      res.json(pedido);
  } catch (error) {
      res.status(500).json({ message: error.message });
  }
});

// Actualizar estado de un pedido
router.put('/pedidos/:id/estado', async (req, res) => {
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
router.delete('/pedidos/:id', async (req, res) => {
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

// En tu archivo de rutas (pedidos.js)
router.put('/:id/completar', async (req, res) => {
  try {
      const { estado, itemsCompletados } = req.body;
      
      const pedido = await Pedido.findById(req.params.id);
      if (!pedido) {
          return res.status(404).json({ success: false, message: "Pedido no encontrado" });
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

      // Calcular nuevo total basado en items completados
      const nuevoTotal = pedido.items.reduce((total, item) => {
          return item.completado ? total + item.precioTotal : total;
      }, 0);

      // Actualizar pedido
      pedido.estado = estado;
      pedido.total = nuevoTotal;
      pedido.fechaCompletado = estado === 'completado' ? new Date() : null;
      
      await pedido.save();

      res.json({
          success: true,
          message: "Pedido actualizado exitosamente",
          pedido: await Pedido.findById(pedido._id).populate('items.producto')
      });

  } catch (error) {
      res.status(500).json({
          success: false,
          message: error.message
      });
  }
});

router.put('/pedidos/:id/items', async (req, res) => {
  try {
    const pedido = await Pedido.findById(req.params.id);
    if (!pedido) return res.status(404).json({ message: 'Pedido no encontrado' });

    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Debe enviar al menos un ítem válido' });
    }

    // Mapear productos actuales por ID para mantener estado si existe
    const itemsAnteriores = new Map();
    pedido.items.forEach(item => {
      itemsAnteriores.set(item.productoId.toString(), item);
    });

    const nuevosItems = [];
    let nuevoTotal = 0;

    for (const item of items) {
      const producto = await Producto.findById(item.productoId);
      if (!producto) {
        return res.status(400).json({ message: `Producto no encontrado: ${item.productoId}` });
      }

      const cantidad = item.cantidad || 0;
      const peso = item.peso || 0;

      const precioTotal = producto.unidadMedida === 'kg'
        ? producto.precio * peso
        : producto.precio * cantidad;

      nuevoTotal += precioTotal;

      const previo = itemsAnteriores.get(producto._id.toString());

      nuevosItems.push({
        productoId: producto._id,
        nombre: producto.nombre,
        cantidad,
        peso,
        precioUnitario: producto.precio,
        precioTotal,
        completado: previo?.completado || false,
        motivoIncompleto: previo?.motivoIncompleto || '',
        observaciones: previo?.observaciones || ''
      });
    }

    // Actualizar ítems y total
    pedido.items = nuevosItems;
    pedido.total = nuevoTotal;

    // Si estaba completado, vuelve a estado pendiente
    if (pedido.estado === 'completado') {
      pedido.estado = 'pendiente';
      pedido.fechaCompletado = null;
      pedido.completadoPor = null;
    }

    await pedido.save();

    res.json({ message: 'Ítems actualizados correctamente', pedido });
  } catch (error) {
    console.error('Error al actualizar ítems del pedido:', error);
    res.status(500).json({ message: error.message });
  }
});


module.exports = router;