const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const templates = await prisma.reportTemplate.findMany({
        select: { id: true, name: true }
    });
    console.log(JSON.stringify(templates, null, 2));
    await prisma.$disconnect();
}

main().catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
});
