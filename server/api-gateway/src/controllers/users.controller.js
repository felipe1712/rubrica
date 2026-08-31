const { User, Tenant, sequelize } = require('../models');
const bcrypt = require('bcryptjs');

// GET /users — Listar usuarios del tenant
exports.listUsers = async (req, res) => {
  try {
    const tenantId = req.tenantId || req.user?.tenantId;
    if (!tenantId) return res.json([]);

    const users = await User.findAll({
      where: { tenantId },
      attributes: ['id', 'name', 'email', 'role', 'isActive', 'lastLoginAt', 'createdAt'],
      order: [sequelize.literal('created_at DESC')]
    });

    res.json(users);
  } catch (error) {
    console.error('Error listando usuarios:', error);
    res.status(500).json({ error: 'Error al obtener los usuarios del equipo.' });
  }
};

// POST /users — Crear/Invitar un nuevo usuario al tenant
exports.createUser = async (req, res) => {
  try {
    const tenantId = req.tenantId || req.user?.tenantId;
    if (!tenantId) return res.status(400).json({ error: 'Identificador de organización no encontrado.' });

    const { name, email, password, role } = req.body;
    if (!email) return res.status(400).json({ error: 'El correo electrónico es obligatorio.' });

    // Verificar si ya existe en el tenant
    const existing = await User.findOne({ where: { tenantId, email } });
    if (existing) {
      return res.status(400).json({ error: 'Ya existe un usuario con este correo en tu organización.' });
    }

    const defaultPassword = password || 'Rubricalo' + Math.floor(1000 + Math.random() * 9000);
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    const newUser = await User.create({
      tenantId,
      name: name || email.split('@')[0],
      email,
      passwordHash,
      role: role || 'member',
      isActive: true
    });

    res.status(201).json({
      message: 'Usuario creado exitosamente.',
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        isActive: newUser.isActive,
        createdAt: newUser.createdAt
      },
      temporaryPassword: password ? null : defaultPassword
    });
  } catch (error) {
    console.error('Error creando usuario:', error);
    res.status(500).json({ error: 'Error al crear el usuario.' });
  }
};

// PUT /users/:id — Actualizar usuario (rol, nombre, estado, contraseña)
exports.updateUser = async (req, res) => {
  try {
    const tenantId = req.tenantId || req.user?.tenantId;
    const user = await User.findOne({ where: { id: req.params.id, tenantId } });
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado.' });

    const { name, role, isActive, password } = req.body;

    if (name !== undefined) user.name = name;
    if (role !== undefined) user.role = role;
    if (isActive !== undefined) user.isActive = isActive;
    if (password) {
      user.passwordHash = await bcrypt.hash(password, 10);
    }

    await user.save();

    res.json({
      message: 'Usuario actualizado correctamente.',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    console.error('Error actualizando usuario:', error);
    res.status(500).json({ error: 'Error al actualizar el usuario.' });
  }
};

// DELETE /users/:id — Desactivar o eliminar usuario
exports.deleteUser = async (req, res) => {
  try {
    const tenantId = req.tenantId || req.user?.tenantId;
    const user = await User.findOne({ where: { id: req.params.id, tenantId } });
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado.' });

    // Evitar eliminar la propia cuenta
    if (req.user && req.user.id === user.id) {
      return res.status(400).json({ error: 'No puedes desactivar tu propia cuenta activa.' });
    }

    user.isActive = false;
    await user.save();

    res.json({ message: 'Usuario desactivado correctamente.' });
  } catch (error) {
    console.error('Error eliminando usuario:', error);
    res.status(500).json({ error: 'Error al desactivar el usuario.' });
  }
};
