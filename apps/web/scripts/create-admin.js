const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    // Vérifier si l'utilisateur existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email: 'alexalix58@gmail.com' }
    });

    if (existingUser) {
      console.log('⚠️ Utilisateur existe déjà:', existingUser.email);
      await prisma.$disconnect();
      return;
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash('Pozerty321', 10);

    // Créer le super admin
    const user = await prisma.user.create({
      data: {
        email: 'alexalix58@gmail.com',
        password: hashedPassword,
        name: 'Alex Admin',
        role: 'SUPER_ADMIN'
      }
    });

    console.log('✅ Super admin créé avec succès !');
    console.log('📧 Email:', user.email);
    console.log('👤 Nom:', user.name);
    console.log('🔑 Rôle:', user.role);
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Erreur lors de la création:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

createAdmin();
