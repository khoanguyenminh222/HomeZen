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
    const existingUser = await prisma.user.findUnique({
      where: { username }
    });

    if (existingUser) {
      console.log(`\n⚠️  User "${username}" đã tồn tại!`);
      const update = await question('Bạn có muốn cập nhật thành Super Admin? (y/n): ');
      
      if (update.toLowerCase() === 'y') {
        await prisma.user.update({
          where: { username },
          data: {
            role: 'SUPER_ADMIN',
            isActive: true
          }
        });
        console.log(`\n✅ Đã cập nhật user "${username}" thành Super Admin!`);
      } else {
        console.log('❌ Hủy bỏ.');
      }
      return;
    }

    // Get password
    const password = await question('Nhập password (mặc định: admin123): ') || 'admin123';
    
    if (password.length < 6) {
      console.log('❌ Password phải có ít nhất 6 ký tự!');
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create Super Admin user
    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        role: 'SUPER_ADMIN',
        isActive: true,
      }
    });

    console.log('\n✅ Đã tạo Super Admin thành công!');
    console.log(`   Username: ${user.username}`);
    console.log(`   Role: ${user.role}`);
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
