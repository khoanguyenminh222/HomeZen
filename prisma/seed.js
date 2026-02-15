const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Hash password for Super Admin
  const adminPassword = await bcrypt.hash('admin123', 10);

  // Create default Super Admin user (no PropertyInfo needed)
  const adminUser = await prisma.uSR_NGUOI_DUNG.upsert({
    where: { tai_khoan: 'admin' },
    update: {
      vai_tro: 'SIEU_QUAN_TRI',
      trang_thai: true,
    },
    create: {
      tai_khoan: 'admin',
      mat_khau: adminPassword,
      vai_tro: 'SIEU_QUAN_TRI',
      trang_thai: true,
    },
  });

  console.log('✅ Created default Super Admin user:', { username: adminUser.tai_khoan, role: adminUser.vai_tro });
  console.log('   Username: admin');
  console.log('   Password: admin123');
  console.log('   Role: SIEU_QUAN_TRI');

  // Optional: Create a sample Property Owner with PropertyInfo for testing
  const ownerPassword = await bcrypt.hash('owner123', 10);

  const propertyOwner = await prisma.uSR_NGUOI_DUNG.upsert({
    where: { tai_khoan: 'owner' },
    update: {
      vai_tro: 'CHU_NHA_TRO',
      trang_thai: true,
    },
    create: {
      tai_khoan: 'owner',
      mat_khau: ownerPassword,
      vai_tro: 'CHU_NHA_TRO',
      trang_thai: true,
      thong_tin_nha_tro: {
        create: {
          ten: 'Nhà trọ Mẫu',
          dia_chi: '123 Đường Mẫu, Quận 1, TP.HCM',
          dien_thoai: '0901234567',
          ten_chu_nha: 'Nguyễn Văn Mẫu',
          email: 'owner@example.com',
          max_dong_ho_dien: 999999,
          max_dong_ho_nuoc: 99999,
        }
      }
    },
    include: {
      thong_tin_nha_tro: true
    }
  });

  if (propertyOwner.thong_tin_nha_tro) {
    console.log('✅ Created sample Property Owner:', { username: propertyOwner.tai_khoan, role: propertyOwner.vai_tro });
    console.log('   Username: owner');
    console.log('   Password: owner123');
    console.log('   Property:', propertyOwner.thong_tin_nha_tro.ten);
  }

  // Create default Website Configuration
  // First, deactivate any existing active configurations
  await prisma.cFG_WEBSITE.updateMany({
    where: { trang_thai: true },
    data: { trang_thai: false }
  });

  // Check if default config already exists
  const existingConfig = await prisma.cFG_WEBSITE.findFirst({
    where: {
      tieu_de_website: 'HomeZen - Ứng dụng quản lý nhà trọ',
      ten_thuong_hieu: 'HomeZen'
    }
  });

  if (!existingConfig) {
    const websiteConfig = await prisma.cFG_WEBSITE.create({
      data: {
        logo_url: '/images/home-zen-logo.png',
        favicon_url: '/images/favicon.ico',
        anh_hero_url: '/images/home-zen-master-removebg-preview.png',
        anh_loi_url: '/images/home-zen-error.png',
        tieu_de_website: 'HomeZen - Ứng dụng quản lý nhà trọ',
        mo_ta_website: 'Quản lý phòng trọ, người thuê, hóa đơn điện nước dễ dàng và hiện đại',
        ten_thuong_hieu: 'HomeZen',
        tieu_de_hero: 'Chào Mừng Đến Với HomeZen',
        phu_de_hero: 'Quản lý nhà trọ thảnh thơi',
        tieu_de_footer: 'HomeZen — Boarding House Management v1.0',
        gia_tri_thong_ke_1: '1k+',
        ten_thong_ke_1: 'Tin cậy',
        gia_tri_thong_ke_2: '99%',
        ten_thong_ke_2: 'Hài lòng',
        email_lien_he: '',
        sdt_lien_he: '',
        trang_thai: true,
        nguoi_tao: adminUser.id,
        nguoi_cap_nhat: adminUser.id
      }
    });

    console.log('✅ Created default Website Configuration');
    console.log('   Brand Name:', websiteConfig.ten_thuong_hieu);
    console.log('   Website Title:', websiteConfig.tieu_de_website);
  } else {
    // Reactivate existing default config
    await prisma.cFG_WEBSITE.update({
      where: { id: existingConfig.id },
      data: {
        trang_thai: true,
        nguoi_cap_nhat: adminUser.id
      }
    });
    console.log('✅ Reactivated existing Website Configuration');
  }

  // Seed Reports
  try {
    const { seedInitialReports } = require('../lib/utils/report-seeder');
    await seedInitialReports(adminUser.id);
  } catch (err) {
    console.error('⚠️ Report seeding skipped/failed:', err.message);
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
