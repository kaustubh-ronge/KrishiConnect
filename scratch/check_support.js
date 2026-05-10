
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const messages = await prisma.supportMessage.findMany();
  console.log('Total Support Messages:', messages.length);
  console.log('Sample Message:', JSON.stringify(messages[0], null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
