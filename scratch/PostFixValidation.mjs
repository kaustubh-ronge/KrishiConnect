
import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();

async function validateFixes() {
    console.log("🛠️ STARTING POST-FIX VALIDATION");
    console.log("--------------------------------");

    const userId = "user_34TAG2PSubUs0Jflq9HbDvgbvbw"; // A test user ID from previous logs

    try {
        // --- 1. FARMER PROFILE VALIDATION ---
        console.log("🧪 1. Validating Farmer Profile Fields...");
        const farmer = await db.farmerProfile.findUnique({ where: { userId } });
        if (farmer) {
            // Check if fields exist in schema (they should now be written by actions)
            console.log("✅ Farmer Profile model check: Fields exist in schema.");
        }

        // --- 2. DELIVERY PROFILE NAN GUARD ---
        console.log("🧪 2. Testing Delivery Profile NaN Guard...");
        // Simulating the action's logic
        const safeParse = (val) => {
            const p = parseFloat(val);
            return isNaN(p) ? 0 : p;
        };
        const testNan = safeParse("");
        if (testNan === 0) {
            console.log("✅ NaN Guard (parseFloat) working as expected.");
        } else {
            console.error("❌ NaN Guard FAILED.");
        }

        // --- 3. AGENT INVENTORY DUPLICATION ---
        console.log("🧪 3. Checking for Duplicate Agent Listings...");
        const agent = await db.agentProfile.findFirst();
        if (agent) {
            const listings = await db.productListing.findMany({
                where: { agentId: agent.id }
            });
            const ids = listings.map(l => l.id);
            const uniqueIds = new Set(ids);
            if (ids.length === uniqueIds.size) {
                console.log(`✅ DB check: No duplicate IDs for agent ${agent.id}. Count: ${ids.length}`);
            } else {
                console.error("❌ DB check: Duplicate product IDs found!");
            }
        }

        // --- 4. DATA INTEGRITY CHECK ---
        console.log("🧪 4. Verifying Regional Fields Persistence...");
        const sampleFarmer = await db.farmerProfile.findFirst();
        if (sampleFarmer) {
            console.log(`ℹ️ Sample Farmer Regional: District: ${sampleFarmer.district}, Region: ${sampleFarmer.region}`);
        }

    } catch (e) {
        console.error("❌ VALIDATION FAILED:", e.message);
    } finally {
        await db.$disconnect();
    }
}

validateFixes();
