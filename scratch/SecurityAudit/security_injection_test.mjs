
import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();

async function testSecurityInjection() {
    console.log("🛡️ INITIATING SECURITY INJECTION TEST (XSS)");

    try {
        // Create a temporary seller
        const user = await db.user.create({ data: { id: "TEMP_SELLER", email: "temp@test.com", role: "farmer" } });
        const profile = await db.farmerProfile.create({ data: { userId: user.id, name: "Temp Farm" } });

        const payload = "<script>alert('XSS')</script> Malicious Product";
        
        console.log(`🧪 Attempting to inject: ${payload}`);

        const created = await db.productListing.create({
            data: {
                productName: payload,
                pricePerUnit: 10,
                availableStock: 10,
                unit: "kg",
                quantityLabel: "1kg",
                sellerType: "farmer",
                farmerId: profile.id,
                isAvailable: true
            }
        });

        console.log(`✅ Record Created. ID: ${created.id}`);
        console.log(`🔎 Content in DB: ${created.productName}`);

        if (created.productName.includes("<script>")) {
            console.warn("⚠️ WARNING: Raw HTML/Script stored in database. React usually escapes this, but server-side sanitization is safer.");
        }

        // Cleanup
        await db.productListing.delete({ where: { id: created.id } });
        await db.farmerProfile.delete({ where: { id: profile.id } });
        await db.user.delete({ where: { id: user.id } });

    } catch (e) {
        console.error(e);
    } finally {
        await db.$disconnect();
    }
}

testSecurityInjection().catch(console.error);
