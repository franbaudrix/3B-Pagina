require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/usuarios');
const bcrypt = require('bcryptjs');

mongoose.connect(process.env.DB_URI)
  .then(() => console.log('Conectado a MongoDB'))
  .catch(err => console.error('Error de conexión:', err));

async function createAdmin() {
  const admin = new User({
    email: 'empleado@example.com',
    password: 'password123', 
    name: 'Empleado',
    role: 'employee'
  });

  try {
    await admin.save();
    console.log('Usuario admin creado exitosamente');
  } catch (err) {
    console.error('Error creando usuario admin:', err);
  } finally {
    mongoose.disconnect();
  }
}

createAdmin();