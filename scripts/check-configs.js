const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkConfigs() {
    try {
        const configs = await prisma.websiteConfiguration.findMany({
            orderBy: { updatedAt: 'desc' },
            take: 5
        });

        console.log('--- Top 5 Website Configurations ---');
        configs.forEach((c, i) => {
            console.log(`[${i}] ID: ${c.id}`);
            console.log(`    Active: ${c.isActive}`);
            console.log(`    Favicon: "${c.faviconUrl}"`);
            console.log(`    Updated: ${c.updatedAt}`);
            console.log('---------------------------');
        });

        const activeConfigs = await prisma.websiteConfiguration.findMany({
            where: { isActive: true }
        });
        console.log(`Total Active Configs: ${activeConfigs.length}`);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkConfigs();
