const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Hash password for Super Admin
  const adminPassword = await bcrypt.hash('admin123', 10);

  // Create default Super Admin user (no PropertyInfo needed)
  const adminUser = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {
      role: 'SUPER_ADMIN',
      isActive: true,
    },
    create: {
      username: 'admin',
      password: adminPassword,
      role: 'SUPER_ADMIN',
      isActive: true,
    },
  });

  console.log('✅ Created default Super Admin user:', { username: adminUser.username, role: adminUser.role });
  console.log('   Username: admin');
  console.log('   Password: admin123');
  console.log('   Role: SUPER_ADMIN');

  // Optional: Create a sample Property Owner with PropertyInfo for testing
  const ownerPassword = await bcrypt.hash('owner123', 10);
  
  const propertyOwner = await prisma.user.upsert({
    where: { username: 'owner' },
    update: {
      role: 'PROPERTY_OWNER',
      isActive: true,
    },
    create: {
      username: 'owner',
      password: ownerPassword,
      role: 'PROPERTY_OWNER',
      isActive: true,
      propertyInfo: {
        create: {
          name: 'Nhà trọ Mẫu',
          address: '123 Đường Mẫu, Quận 1, TP.HCM',
          phone: '0901234567',
          ownerName: 'Nguyễn Văn Mẫu',
          email: 'owner@example.com',
          maxElectricMeter: 999999,
          maxWaterMeter: 99999,
        }
      }
    },
    include: {
      propertyInfo: true
    }
  });

  if (propertyOwner.propertyInfo) {
    console.log('✅ Created sample Property Owner:', { username: propertyOwner.username, role: propertyOwner.role });
    console.log('   Username: owner');
    console.log('   Password: owner123');
    console.log('   Property:', propertyOwner.propertyInfo.name);
  }
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
