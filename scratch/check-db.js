const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const count = await prisma.productListing.count();
  console.log(`Total Products: ${count}`);
  
  const available = await prisma.productListing.count({
    where: { isAvailable: true, availableStock: { gt: 0 } }
  });
  console.log(`Available Products: ${available}`);
  
  const products = await prisma.productListing.findMany({
    take: 5,
    select: { id: true, productName: true, isAvailable: true, availableStock: true, sellerType: true }
  });
  console.log('Sample Products:', JSON.stringify(products, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
