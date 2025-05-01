// middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/usuarios');

const auth = async (req, res, next) => {
  try {
    // Obtener token del header
    const token = req.header('Authorization').replace('Bearer ', '');
    
    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Buscar usuario
    const user = await User.findOne({ _id: decoded._id });
    
    if (!user) {
      throw new Error();
    }

    // Agregar usuario y token al request
    req.token = token;
    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Por favor autentícate' });
  }
};

const admin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acceso denegado' });
  }
  next();
};

module.exports = { auth, admin };