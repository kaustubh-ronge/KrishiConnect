const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const count = await prisma.supportMessage.count();
  const msgs = await prisma.supportMessage.findMany({
    orderBy: { createdAt: 'desc' }
  });
  console.log('Total messages:', count);
  console.log(JSON.stringify(msgs, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
