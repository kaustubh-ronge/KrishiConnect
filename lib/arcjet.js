import arcjet, {
  detectBot,
  fixedWindow,
  slidingWindow,
  shield
} from "@arcjet/next";
import { headers } from "next/headers";

// Central Arcjet instance for the entire app
const aj = arcjet({
  key: process.env.ARCJET_KEY,
  characteristics: ["ip.src"],
  rules: [
    shield({
      mode: "LIVE",
    }),
    detectBot({
      mode: "LIVE",
      allow: [
        "CATEGORY:SEARCH_ENGINE",
        "CATEGORY:PREVIEW",
      ],
    }),
  ],
});

export default aj;

// UX-Optimized Rate Limiters
// We use sliding windows so limits "slide" away quickly if a user stops spamming.

// High-value mutations (orders, checkout, admin ops)
// 10 requests per minute is extremely generous for a human but blocks bot flooding.
export const mutationRateLimit = slidingWindow({
  mode: "LIVE",
  interval: "1m",
  max: 10,
});

// High-frequency mutations (cart updates, increment/decrement)
// 100 requests per minute allows rapid clicking without interruption.
export const standardRateLimit = slidingWindow({
  mode: "LIVE",
  interval: "1m",
  max: 100,
});

// Brute-force protection for auth flows (sign-in/sign-up)
export const authRateLimit = fixedWindow({
  mode: "LIVE",
  window: "1h",
  max: 20,
});

/**
 * Server Action Protection Helper
 * @param {Object} rule - The Arcjet rule to apply
 */
export async function validateAction(rule = mutationRateLimit) {
  // Use Next.js headers() to get request context for Arcjet
  const head = await headers();
  const decision = await aj.protect(head, { rules: [rule] });

  if (decision.isDenied()) {
    if (decision.reason.isRateLimit()) {
      throw new Error("Action paused. You're moving a bit too fast! Please wait a moment and try again.");
    }
    if (decision.reason.isBot()) {
      throw new Error("Automated activity detected. Please use the site as a human or contact support.");
    }
    throw new Error("Security check failed. Access is temporarily restricted for your protection.");
  }
}
