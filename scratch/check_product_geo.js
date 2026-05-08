const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkProduct() {
  const productId = "cmovc6i5b0001ojxweddr67l9";
  const product = await prisma.productListing.findUnique({
    where: { id: productId },
    include: { farmer: true, agent: true }
  });

  if (!product) {
    console.log("Product not found");
    return;
  }

  const seller = product.farmer || product.agent;
  console.log("--- Product Info ---");
  console.log("Name:", product.productName);
  console.log("Max Delivery Range (Product):", product.maxDeliveryRange);
  console.log("Seller Lat:", seller.lat);
  console.log("Seller Lng:", seller.lng);
  console.log("Seller Max Delivery Range (Profile):", seller.maxDeliveryRange);

  await prisma.$disconnect();
}

checkProduct();
