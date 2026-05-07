
import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();
async function list() {
    const users = await db.user.findMany({ take: 5 });
    const farmers = await db.farmerProfile.findMany({ take: 5 });
    console.log("USERS:", users.map(u => ({ id: u.id, role: u.role })));
    console.log("FARMERS:", farmers.map(f => ({ id: f.id, userId: f.userId })));
}
list().catch(console.error).finally(() => db.$disconnect());
