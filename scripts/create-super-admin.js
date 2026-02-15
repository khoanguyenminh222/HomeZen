const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const readline = require('readline');

const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function main() {
  console.log('🔐 Tạo Super Admin User\n');

  try {
    // Get username
    const username = await question('Nhập username (mặc định: admin): ') || 'admin';

    // Check if user already exists
    const existingUser = await prisma.uSR_NGUOI_DUNG.findUnique({
      where: { tai_khoan: username }
    });

    if (existingUser) {
      console.log(`\n⚠️  User "${username}" đã tồn tại!`);
      const update = await question('Bạn có muốn cập nhật thành SIEU_QUAN_TRI? (y/n): ');

      if (update.toLowerCase() === 'y') {
        await prisma.uSR_NGUOI_DUNG.update({
          where: { tai_khoan: username },
          data: {
            vai_tro: 'SIEU_QUAN_TRI',
            trang_thai: true
          }
        });
        console.log(`\n✅ Đã cập nhật user "${username}" thành SIEU_QUAN_TRI!`);
      } else {
        console.log('❌ Hủy bỏ.');
      }
      return;
    }

    // Get password
    const password = await question('Nhập password (mặc định: admin123): ') || 'admin123';

    if (password.length < 6) {
      console.log('\n❌ Lỗi: Mật khẩu phải có ít nhất 6 ký tự!');
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create Super Admin user
    const user = await prisma.uSR_NGUOI_DUNG.create({
      data: {
        tai_khoan: username,
        mat_khau: hashedPassword,
        vai_tro: 'SIEU_QUAN_TRI',
        trang_thai: true,
      }
    });

    console.log('\n✅ Đã tạo Super Admin thành công!');
    console.log(`   Username: ${user.tai_khoan}`);
    console.log(`   Role: ${user.vai_tro}`);
    console.log(`   ID: ${user.id}`);
    console.log('\n📝 Bạn có thể đăng nhập với thông tin trên.');

  } catch (error) {
    console.error('\n❌ Lỗi:', error.message);
    process.exit(1);
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

main();
