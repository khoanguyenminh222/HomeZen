const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkConfigs() {
    try {
        const configs = await prisma.cFG_WEBSITE.findMany({
            orderBy: { ngay_cap_nhat: 'desc' },
            take: 5
        });

        console.log('--- Top 5 Website Configurations ---');
        configs.forEach((c, i) => {
            console.log(`[${i}] ID: ${c.id}`);
            console.log(`    Active: ${c.trang_thai}`);
            console.log(`    Favicon: "${c.favicon_url}"`);
            console.log(`    Updated: ${c.ngay_cap_nhat}`);
            console.log('---------------------------');
        });

        const activeConfigs = await prisma.cFG_WEBSITE.findMany({
            where: { trang_thai: true }
        });
        console.log(`Total Active Configs: ${activeConfigs.length}`);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkConfigs();
