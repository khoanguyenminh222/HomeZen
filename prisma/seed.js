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

  // Create default Website Configuration
  // First, deactivate any existing active configurations
  await prisma.websiteConfiguration.updateMany({
    where: { isActive: true },
    data: { isActive: false }
  });

  // Check if default config already exists
  const existingConfig = await prisma.websiteConfiguration.findFirst({
    where: {
      websiteTitle: 'HomeZen - Ứng dụng quản lý nhà trọ',
      brandName: 'HomeZen'
    }
  });

  if (!existingConfig) {
    const websiteConfig = await prisma.websiteConfiguration.create({
      data: {
        logoUrl: '/images/home-zen-logo.png',
        faviconUrl: '/images/favicon.ico',
        heroImageUrl: '/images/home-zen-master-removebg-preview.png',
        errorImageUrl: '/images/home-zen-error.png',
        websiteTitle: 'HomeZen - Ứng dụng quản lý nhà trọ',
        websiteDescription: 'Quản lý phòng trọ, người thuê, hóa đơn điện nước dễ dàng và hiện đại',
        brandName: 'HomeZen',
        heroTitle: 'Chào Mừng Đến Với HomeZen',
        heroSubtitle: 'Quản lý nhà trọ thảnh thơi',
        footerText: 'HomeZen — Boarding House Management v1.0',
        stat1Value: '1k+',
        stat1Label: 'Tin cậy',
        stat2Value: '99%',
        stat2Label: 'Hài lòng',
        contactEmail: '',
        contactPhone: '',
        isActive: true,
        createdBy: adminUser.id,
        updatedBy: adminUser.id
      }
    });

    console.log('✅ Created default Website Configuration');
    console.log('   Brand Name:', websiteConfig.brandName);
    console.log('   Website Title:', websiteConfig.websiteTitle);
  } else {
    // Reactivate existing default config
    await prisma.websiteConfiguration.update({
      where: { id: existingConfig.id },
      data: {
        isActive: true,
        updatedBy: adminUser.id
      }
    });
    console.log('✅ Reactivated existing Website Configuration');
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
