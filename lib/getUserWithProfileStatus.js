// import { currentUser } from "@clerk/nextjs/server";
// import { db } from "./prisma"; // Ensure this path is correct

// /**
//  * Fetches the current user from the database along with their profile status.
//  * Ensures the user exists in the DB via upsert if logged in via Clerk.
//  * @param {'farmer' | 'agent'} requiredRole The role whose profile we need to check.
//  * @returns {Promise<{ user: User | null, profileExists: boolean, error?: string }>}
//  * - user: The user object from your DB (or null if not logged in/error).
//  * - profileExists: Boolean indicating if the profile for the requiredRole exists.
//  */
// export const getUserWithProfileStatus = async (requiredRole) => {
//   let clerkUser;
//   try {
//     clerkUser = await currentUser();
//     if (!clerkUser) {
//       console.log("getUserWithProfileStatus: No Clerk user found.");
//       return { user: null, profileExists: false }; // Not logged in
//     }
//   } catch (error) {
//     console.error(
//       "getUserWithProfileStatus: Error fetching currentUser:",
//       error
//     );
//     return { user: null, profileExists: false, error: "Clerk fetch failed" };
//   }

//   try {
//     // Determine which profile relation to include based on requiredRole
//     const includeProfile =
//       requiredRole === "farmer"
//         ? { farmerProfile: true }
//         : { agentProfile: true };

//     // Try to find the user, including the relevant profile
//     let dbUser = await db.user.findUnique({
//       where: { id: clerkUser.id },
//       include: includeProfile, // Include farmerProfile OR agentProfile
//     });

//     // If user doesn't exist in DB, create them (similar to checkUser)
//     if (!dbUser) {
//       console.log(
//         `getUserWithProfileStatus: DB user ${clerkUser.id} not found, creating...`
//       );
//       const email = clerkUser.emailAddresses[0]?.emailAddress;
//       if (!email) {
//         console.error(
//           `getUserWithProfileStatus: Email not found for Clerk user ${clerkUser.id}`
//         );
//         return { user: null, profileExists: false, error: "Email not found" };
//       }
//       dbUser = await db.user.create({
//         data: {
//           id: clerkUser.id,
//           email: email,
//           role: "none", // Initial role
//         },
//         include: includeProfile, // Include profile even on creation (will be null)
//       });
//       console.log(`getUserWithProfileStatus: Created new DB user ${dbUser.id}`);
//     } else {
//       console.log(
//         `getUserWithProfileStatus: Found existing DB user ${dbUser.id}`
//       );
//     }

//     // Check if the specific profile exists
//     const profileExists =
//       requiredRole === "farmer"
//         ? !!dbUser.farmerProfile
//         : !!dbUser.agentProfile;

//     console.log(
//       `getUserWithProfileStatus: User role: ${dbUser.role}, Profile exists (${requiredRole}): ${profileExists}`
//     );

//     // Return the user data and profile status
//     return { user: dbUser, profileExists: profileExists };
//   } catch (error) {
//     console.error("Error in getUserWithProfileStatus (Database ops):", error);
//     return {
//       user: null,
//       profileExists: false,
//       error: "Database operation failed",
//     };
//   }
// };

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
      console.log(
        `getUserWithProfileStatus: DB user ${clerkUser.id} not found, creating...`
      );
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
      console.log(`getUserWithProfileStatus: Created new DB user ${dbUser.id}`);
    } else {
      console.log(
        `getUserWithProfileStatus: Found existing DB user ${dbUser.id}`
      );
    }

    const profileExists =
      requiredRole === "farmer"
        ? !!dbUser.farmerProfile
        : !!dbUser.agentProfile;

    console.log(
      `getUserWithProfileStatus: User role: ${dbUser.role}, Profile exists (${requiredRole}): ${profileExists}`
    );
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
