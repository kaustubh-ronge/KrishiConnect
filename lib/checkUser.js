
import { currentUser } from "@clerk/nextjs/server";
import { db } from "./prisma";

export const checkUser = async () => {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) return null;

    let dbUser = await db.user.findUnique({ where: { id: clerkUser.id } });
    if (dbUser) return dbUser;

    console.log(`checkUser: Creating new user: ${clerkUser.id}`);
    const email = clerkUser.emailAddresses[0]?.emailAddress;
    if (!email) {
      console.error(
        `checkUser: Email not found for Clerk user ${clerkUser.id}`
      );
      return null;
    }

    dbUser = await db.user.create({
      data: {
        id: clerkUser.id,
        email: email,
        role: "none",
      },
    });
    console.log(`checkUser: Created new DB user: ${dbUser.id}`);
    return dbUser;
  } catch (error) {
    console.error("Error in checkUser:", error);
    return null;
  }
};
