
import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();

async function attackNotificationsAggressive() {
    console.log("🧨 AGGRESSIVE ATTACK ON createNotification");

    const userId = "user_34Yh1vTuoKzapmiYNijyQ7BSLiJ";
    const type = "ORDER_RECEIVED";
    const message = "AGGRESSIVE_RACE_TEST_" + Date.now();

    try {
        console.log("🔥 Triggering 20 parallel requests...");
        
        const tasks = Array.from({ length: 20 }).map(async (_, i) => {
            // Simulate the logic in actions/notifications.js
            const existing = await db.notification.findFirst({
                where: { userId, type, message }
            });
            if (existing) return "SUPPRESSED";
            
            // Artificial delay to widen the race window (simulating network/DB latency)
            await new Promise(r => setTimeout(r, 5)); 
            
            return db.notification.create({
                data: { userId, type, title: "T", message, linkUrl: "/" }
            });
        });

        const results = await Promise.all(tasks);
        
        const count = await db.notification.count({ where: { userId, type, message } });
        console.log(`📊 Total Notifications in DB: ${count}`);

        if (count > 1) {
            console.warn("💀 VULNERABILITY CONFIRMED: Duplicate Effect Detected!");
        } else {
            console.log("✅ PASS: No duplicates found.");
        }

        // Cleanup
        await db.notification.deleteMany({ where: { userId, type, message } });

    } catch (e) {
        console.error(e);
    } finally {
        await db.$disconnect();
    }
}

attackNotificationsAggressive().catch(console.error);
