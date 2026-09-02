const { SuperAdmin, User, Tenant } = require('./models');
const sequelize = require('./config/database');

async function createSuperAdmin() {
  const args = process.argv.slice(2);
  const email = args[0] || process.env.ADMIN_EMAIL || 'admin@rubricalo.com';
  const password = args[1] || process.env.ADMIN_PASSWORD || 'RubricaloAdmin2026!';
  const name = args[2] || 'SuperAdministrador Rubrícalo';

  console.log(`[SEED-ADMIN] Creando o actualizando SuperAdmin: ${email}...`);

  try {
    await sequelize.authenticate();

    // 1. Crear en tabla SuperAdmin
    const passwordHash = await SuperAdmin.hashPassword(password);
    const [superAdmin, createdSA] = await SuperAdmin.findOrCreate({
      where: { email },
      defaults: { email, passwordHash }
    });

    if (!createdSA) {
      superAdmin.passwordHash = passwordHash;
      await superAdmin.save();
    }

    // 2. Asegurar que exista Tenant Principal
    let [tenant] = await Tenant.findOrCreate({
      where: { email },
      defaults: {
        name: 'Plataforma Rubrícalo',
        email,
        licenseKey: 'SUPERADMIN-KEY',
        status: 'active',
        plan: 'enterprise'
      }
    });

    // 3. Crear/Actualizar usuario con rol SUPERADMIN
    const userPass = await User.hashPassword(password);
    const [user, createdUser] = await User.findOrCreate({
      where: { email },
      defaults: {
        tenantId: tenant.id,
        name,
        email,
        passwordHash: userPass,
        role: 'SUPERADMIN',
        isActive: true
      }
    });

    if (!createdUser) {
      user.passwordHash = userPass;
      user.role = 'SUPERADMIN';
      user.isActive = true;
      await user.save();
    }

    console.log(`\n✅ ¡SuperAdministrador configurado con éxito!`);
    console.log(`--------------------------------------------------`);
    console.log(` Correo:   ${email}`);
    console.log(` Clave:    ${password}`);
    console.log(` Rol:      SUPERADMIN`);
    console.log(`--------------------------------------------------\n`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creando SuperAdmin:', error);
    process.exit(1);
  }
}

createSuperAdmin();
