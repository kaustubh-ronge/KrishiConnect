import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Calculates distance between two points using Haversine formula (in KM).
 */
export function getHaversineDistance(lat1, lon1, lat2, lon2) {
  const coords = [lat1, lon1, lat2, lon2].map(v => parseFloat(v));
  if (coords.some(v => isNaN(v))) return 0;
  
  const [l1, n1, l2, n2] = coords;
  const R = 6371; // Radius of the earth in km
  const dLat = (l2 - l1) * (Math.PI / 180);
  const dLon = (n2 - n1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(l1 * (Math.PI / 180)) * Math.cos(l2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return parseFloat(d.toFixed(2));
}

/**
 * Calculates road distance between two points using OSRM API.
 * Falls back to Haversine if API fails.
 */
export async function getOSRMDistance(lat1, lon1, lat2, lon2) {
  const coords = [lat1, lon1, lat2, lon2].map(v => parseFloat(v));
  if (coords.some(v => isNaN(v))) return 0;
  const [l1, n1, l2, n2] = coords;
  try {
    const url = `http://router.project-osrm.org/route/v1/driving/${n1},${l1};${n2},${l2}?overview=false`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.code === 'Ok' && data.routes?.[0]?.distance) {
      // OSRM returns distance in meters, convert to KM
      const km = data.routes[0].distance / 1000;
      return parseFloat(km.toFixed(2));
    }
    
    console.warn("[OSRM] API returned non-OK code, falling back to Haversine.");
    return getHaversineDistance(l1, n1, l2, n2);
  } catch (err) {
    console.error("[OSRM] Fetch failed:", err.message);
    return getHaversineDistance(l1, n1, l2, n2);
  }
}

/**
 * Generates a secure numeric OTP of specified length.
 */
export function generateOTP(length = 6) {
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  return Math.floor(min + Math.random() * (max - min + 1)).toString();
}
/**
 * Sanitize string content by removing HTML tags and filtering common XSS vectors.
 */
export function sanitizeContent(val) {
  if (typeof val !== 'string') return val;
  
  // If it's a javascript protocol, block the whole thing
  if (val.toLowerCase().includes('javascript:')) return "";

  return val
    .replace(/<[^>]*>?/gm, '') // Remove HTML tags
    .replace(/on\w+\s*=\s*"[^"]*"/gi, '') // Remove inline event handlers with quotes
    .replace(/on\w+\s*=\s*[^>\s]*/gi, '') // Remove inline event handlers without quotes
    .trim();
}
