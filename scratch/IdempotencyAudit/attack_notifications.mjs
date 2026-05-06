
import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();

async function attackNotifications() {
    console.log("🧨 ATTACKING createNotification (Simultaneous Execution)");

    const userId = "user_34Yh1vTuoKzapmiYNijyQ7BSLiJ";
    const type = "ORDER_RECEIVED";
    const message = "Hammer test notification";

    try {
        console.log("🔥 Hammering createNotification with 5 parallel requests...");
        
        // This simulates calling the action 5 times at once
        const results = await Promise.all([
            (async () => {
                const existing = await db.notification.findFirst({ where: { userId, type, message } });
                if (existing) return "SUPPRESSED";
                return db.notification.create({ data: { userId, type, title: "T", message, linkUrl: "/" } });
            })(),
            (async () => {
                const existing = await db.notification.findFirst({ where: { userId, type, message } });
                if (existing) return "SUPPRESSED";
                return db.notification.create({ data: { userId, type, title: "T", message, linkUrl: "/" } });
            })(),
            (async () => {
                const existing = await db.notification.findFirst({ where: { userId, type, message } });
                if (existing) return "SUPPRESSED";
                return db.notification.create({ data: { userId, type, title: "T", message, linkUrl: "/" } });
            })(),
            (async () => {
                const existing = await db.notification.findFirst({ where: { userId, type, message } });
                if (existing) return "SUPPRESSED";
                return db.notification.create({ data: { userId, type, title: "T", message, linkUrl: "/" } });
            })(),
            (async () => {
                const existing = await db.notification.findFirst({ where: { userId, type, message } });
                if (existing) return "SUPPRESSED";
                return db.notification.create({ data: { userId, type, title: "T", message, linkUrl: "/" } });
            })()
        ]);

        console.log("🔎 Results Summary:", results.map(r => r === "SUPPRESSED" ? "SUPPRESSED" : "CREATED"));

        const count = await db.notification.count({ where: { userId, type, message } });
        console.log(`📊 Duplicate Notifications in DB: ${count}`);

        if (count > 1) {
            console.warn("💀 VULNERABILITY CONFIRMED: Multiple Identical Notifications Created!");
        } else {
            console.log("✅ PASS: Logic suppressed duplicates.");
        }

        // Cleanup
        await db.notification.deleteMany({ where: { userId, type, message } });

    } catch (e) {
        console.error(e);
    } finally {
        await db.$disconnect();
    }
}

attackNotifications().catch(console.error);
