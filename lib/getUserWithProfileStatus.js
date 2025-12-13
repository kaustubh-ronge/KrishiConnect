
import { currentUser } from "@clerk/nextjs/server";
import { db } from "./prisma";

/**
 * Fetches the current user from the DB along with their profile status.
 * Ensures the user exists in the DB (via checkUser logic).
 */
export const getUserWithProfileStatus = async (requiredRole) => {
  let clerkUser;
  try {
    clerkUser = await currentUser();
    if (!clerkUser) {
      return { user: null, profileExists: false }; // Not logged in
    }
  } catch (error) {
    console.error(
      "getUserWithProfileStatus: Error fetching currentUser:",
      error
    );
    return { user: null, profileExists: false, error: "Clerk fetch failed" };
  }

  try {
    const includeProfile =
      requiredRole === "farmer"
        ? { farmerProfile: true }
        : { agentProfile: true };

    let dbUser = await db.user.findUnique({
      where: { id: clerkUser.id },
      include: includeProfile,
    });

    if (!dbUser) {
      const email = clerkUser.emailAddresses[0]?.emailAddress;
      if (!email) {
        console.error(
          `getUserWithProfileStatus: Email not found for Clerk user ${clerkUser.id}`
        );
        return { user: null, profileExists: false, error: "Email not found" };
      }
      dbUser = await db.user.create({
        data: { id: clerkUser.id, email: email, role: "none" },
        include: includeProfile,
      });
    } else {
      // DB user exists
    }

    const profileExists =
      requiredRole === "farmer"
        ? !!dbUser.farmerProfile
        : !!dbUser.agentProfile;

    // User role/profile status evaluated
    return { user: dbUser, profileExists: profileExists };
  } catch (error) {
    console.error("Error in getUserWithProfileStatus (Database ops):", error);
    return {
      user: null,
      profileExists: false,
      error: "Database operation failed",
    };
  }
};
