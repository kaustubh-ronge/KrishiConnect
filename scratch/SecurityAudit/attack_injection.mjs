
import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();

async function attackInjection() {
    console.log("🧨 INITIATING SECURITY INJECTION TEST (XSS)");

    const userId = "user_34Yh1vTuoKzapmiYNijyQ7BSLiJ";
    const payload = "<script>alert('XSS_ATTACK')</script> Malicious Product";

    try {
        console.log(`🧪 Attempting to inject: ${payload}`);
        
        // 1. Attack Product Listing
        const p = await db.productListing.create({
            data: {
                productName: payload,
                variety: payload,
                description: "Test description",
                unit: "kg",
                pricePerUnit: 10,
                availableStock: 100,
                isAvailable: true,
                sellerType: 'farmer'
            }
        });

        console.log(`✅ Record Created. ID: ${p.id}`);
        
        const checkP = await db.productListing.findUnique({ where: { id: p.id } });
        console.log(`🔎 Content in DB: ${checkP.productName}`);

        if (checkP.productName.includes("<script>")) {
            console.warn("⚠️ WARNING: Raw HTML/Script stored in database. Potential XSS Risk!");
        } else {
            console.log("✅ PASS: Input was sanitized before storage.");
        }

        // Cleanup
        await db.productListing.delete({ where: { id: p.id } });

    } catch (e) {
        console.error(e);
    } finally {
        await db.$disconnect();
    }
}

attackInjection().catch(console.error);
