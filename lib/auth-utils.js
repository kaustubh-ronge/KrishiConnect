// import { checkUser } from "./checkUser";

// /**
//  * Validate role access for pages
//  */
// export const validateRoleAccess = async (requiredRole) => {
//   const user = await checkUser();
  
//   if (!user) return { allowed: false, redirect: "/sign-in" };
//   if (!user.role || user.role === "none") return { allowed: false, redirect: "/onboarding" };
//   if (user.role !== requiredRole) return { allowed: false, redirect: `/${user.role}-dashboard` };
  
//   return { allowed: true, user };
// };

// /**
//  * Get user status for components
//  */
// export const getUserRoleStatus = async () => {
//   const user = await checkUser();
//   return {
//     isLoggedIn: !!user,
//     userRole: user?.role,
//     hasSelectedRole: user?.role && user.role !== "none"
//   };
// };

// /**
//  * Check if user can access onboarding
//  */
// export const canAccessOnboarding = async () => {
//   const user = await checkUser();
//   return !user || !user.role || user.role === "none";
// };


import { checkUser } from "./checkUser";

/**
 * Validate role access for pages
 */
export const validateRoleAccess = async (requiredRole) => {
  const user = await checkUser();

  if (!user) return { allowed: false, redirect: "/sign-in" };
  // Redirect to onboarding if role is missing or "none"
  if (!user.role || user.role === "none") return { allowed: false, redirect: "/onboarding" };
  // Redirect to their *own* dashboard if role doesn't match required
  if (user.role !== requiredRole) return { allowed: false, redirect: `/${user.role}-dashboard` };

  return { allowed: true, user };
};

/**
 * Get user status for components
 */
export const getUserRoleStatus = async () => {
  const user = await checkUser();
  return {
    isLoggedIn: !!user,
    userRole: user?.role,
    hasSelectedRole: user?.role && user.role !== "none"
  };
};

/**
 * Check if user should be on onboarding page
 */
export const canAccessOnboarding = async () => {
  const user = await checkUser();
  // Allow access if not logged in OR if role is missing/none
  return !user || !user.role || user.role === "none";
};