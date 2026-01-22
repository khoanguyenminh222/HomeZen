const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Hash password
  const hashedPassword = await bcrypt.hash('admin123', 10);

  // Create default Super Admin user
  const user = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {
      role: 'SUPER_ADMIN',
      isActive: true,
    },
    create: {
      username: 'admin',
      password: hashedPassword,
      role: 'SUPER_ADMIN',
      isActive: true,
    },
  });

  console.log('✅ Created default Super Admin user:', { username: user.username, role: user.role });
  console.log('   Username: admin');
  console.log('   Password: admin123');
  console.log('   Role: SUPER_ADMIN');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
