"use server";

import { db } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { sendDeliveryJobNotificationEmail } from "@/lib/email";
import { sanitizeContent } from "@/lib/utils";

import { getOSRMDistance, getHaversineDistance, generateOTP } from "@/lib/utils";
import { isSellerOfOrder, isAssignedDeliveryPartner, apiResponse } from "@/lib/permissions";

/**
 * Fetch available delivery boys within range of the delivery location.
 */
export async function getAvailableDeliveryBoys(lat = null, lng = null, orderId = null) {
  // Coords are now optional to prevent UI blackout
  try {
    // Get all approved delivery partners (including offline)
    const deliveryBoys = await db.deliveryProfile.findMany({
      where: {
        approvalStatus: "APPROVED",
      },
      select: {
        id: true,
        name: true,
        lat: true,
        lng: true,
        isOnline: true,
        pricePerKm: true,
        vehicleType: true,
        vehicleType: true,
        jobs: {
          where: {
            status: { notIn: ["DELIVERED", "CANCELLED", "REJECTED"] }
          }
        }
      }
    });

    // If orderId provided, get all requests sent for THIS order
    let existingRequests = [];
    if (orderId) {
      existingRequests = await db.deliveryJob.findMany({
        where: { orderId }
      });
    }

    // Filter by radius and calculate distance
    const eligible = deliveryBoys.map(boy => {
      const distance = getHaversineDistance(lat, lng, boy.lat, boy.lng);

      // Check if THIS specific boy has a request for THIS specific order
      const myRequestForThisOrder = existingRequests.find(r => r.deliveryBoyId === boy.id);

      // Advanced Availability Logic
      let availability = "AVAILABLE";

      if (!boy.isOnline) {
        availability = "OFFLINE";
      } else {
        // Check active jobs for OTHER orders
        const activeJobs = boy.jobs.filter(j => j.orderId !== orderId);

        if (activeJobs.length > 0) {
          // If they are already in transit, they will be free soon
          if (activeJobs.some(j => j.status === "IN_TRANSIT")) {
            availability = "AVAILABLE_SOON";
          } else {
            // If they just accepted or are picking up, they will take longer
            availability = "AVAILABLE_LATER";
          }
        }
      }

      return {
        ...boy,
        distance: parseFloat(distance.toFixed(2)),
        availability,
        hiringStatus: myRequestForThisOrder ? myRequestForThisOrder.status : null,
        hiringJobId: myRequestForThisOrder ? myRequestForThisOrder.id : null,
        jobs: undefined // Clean up
      };
    });

    // Sort: 
    // 1. Those who haven't been hired yet for this order
    // 2. AVAILABLE -> AVAILABLE_SOON -> AVAILABLE_LATER -> OFFLINE
    // 3. Nearest first
    const priority = { "AVAILABLE": 0, "AVAILABLE_SOON": 1, "AVAILABLE_LATER": 2, "OFFLINE": 3 };

    eligible.sort((a, b) => {
      // Keep those with an active request at the top (if they haven't rejected)
      const aHired = a.hiringStatus && a.hiringStatus !== 'REJECTED';
      const bHired = b.hiringStatus && b.hiringStatus !== 'REJECTED';

      if (aHired && !bHired) return -1;
      if (!aHired && bHired) return 1;

      return (priority[a.availability] - priority[b.availability]) || (a.distance - b.distance);
    });

    return apiResponse.success(eligible);
  } catch (error) {
    return apiResponse.error("Failed: " + error.message);
  }
}

/**
 * Request a delivery partner for an order.
 */
export async function hireDeliveryBoy(orderId, deliveryBoyId, distance) {
  try {
    const user = await currentUser();
    if (!user) throw new Error("Unauthorized");

    const boy = await db.deliveryProfile.findUnique({
      where: { id: deliveryBoyId }
    });

    if (!boy) throw new Error("Delivery partner not found");

    // Calculate accurate road distance using OSRM
    // Note: The distance passed from frontend is Haversine for initial filtering,
    // we recalculate here for final billing/hiring.
    // 1. Order Existence & Payment Check
    const order = await db.order.findUnique({ where: { id: orderId } });
    if (!order) throw new Error("Order not found");

    // CRITICAL: Block hiring for UNPAID online orders
    if (order.paymentMethod === 'ONLINE' && order.paymentStatus !== 'PAID') {
      throw new Error("Cannot hire delivery for an unpaid online order. Wait for payment confirmation.");
    }

    // 2. Authorization: Only the seller hires.
    const isSeller = await isSellerOfOrder(user.id, orderId);
    if (!isSeller) throw new Error("Unauthorized: Only the seller can hire a delivery partner for this order.");

    // Pickup: Boy's current location -> Order location
    const safeDistance = parseFloat(distance?.toString() || "0");
    let roadDistance = isNaN(safeDistance) ? 0 : Math.max(0, safeDistance);

    // Fetch full order with items and products for delivery charge calculation
    const orderWithItems = await db.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: { product: true }
        }
      }
    });

    if (!orderWithItems) throw new Error("Order not found");

    if (orderWithItems.lat && orderWithItems.lng && boy.lat && boy.lng) {
      const osrmDist = await getOSRMDistance(boy.lat, boy.lng, orderWithItems.lat, orderWithItems.lng);
      if (!isNaN(osrmDist)) roadDistance = osrmDist;
    }

    // Calculate dynamic pricing: (Distance * Rate) + (Sum of Product Delivery Charges)
    const travelCost = roadDistance * (boy.pricePerKm || 0);
    const cargoCost = orderWithItems.items.reduce((sum, item) => {
      const charge = item.deliveryChargeAtPurchase || item.product?.deliveryCharge || 0;
      // If flat, we count it once per listing. If per_unit, we multiply.
      const type = item.deliveryChargeTypeAtPurchase || item.product?.deliveryChargeType || 'per_unit';
      return sum + (type === 'flat' ? charge : charge * item.quantity);
    }, 0);

    const totalPrice = Math.max(0, travelCost + cargoCost);
    const otp = generateOTP();

    // Use a transaction to handle the potential state transitions gracefully
    const job = await db.$transaction(async (tx) => {
      const currentActive = await tx.deliveryJob.findFirst({
        where: {
          orderId,
          status: { in: ["ACCEPTED", "PICKED_UP", "IN_TRANSIT", "DELIVERED"] }
        }
      });

      if (currentActive) {
        throw new Error(`Order already assigned to ${currentActive.id.slice(-6)}. Revoke it first.`);
      }

      const existing = await tx.deliveryJob.findUnique({
        where: { orderId_deliveryBoyId: { orderId, deliveryBoyId } }
      });

      if (existing && !["REJECTED", "CANCELLED"].includes(existing.status)) {
        throw new Error("A request for this partner is already active.");
      }

      return await tx.deliveryJob.upsert({
        where: {
          orderId_deliveryBoyId: { orderId, deliveryBoyId }
        },
        update: {
          status: "REQUESTED",
          distance: roadDistance,
          totalPrice,
          otp,
          updatedAt: new Date()
        },
        create: {
          orderId,
          deliveryBoyId,
          status: "REQUESTED",
          distance: roadDistance,
          totalPrice,
          otp
        },
        include: {
          deliveryBoy: {
            include: { user: true }
          }
        }
      });
    });

    // Send Email Notification
    const targetEmail = job.deliveryBoy.user.email;
    if (targetEmail) {
      sendDeliveryJobNotificationEmail(targetEmail, {
        orderId,
        distance,
        totalPrice
      });
    }

    revalidatePath("/farmer-dashboard/manage-orders");
    revalidatePath("/agent-dashboard/manage-orders");

    return apiResponse.success(job, "Delivery partner requested successfully.");
  } catch (error) {
    return apiResponse.error(error.message);
  }
}

/**
 * Update job status (for delivery boys).
 */
export async function updateDeliveryJobStatus(jobId, status, notes = "", lat = null, lng = null) {
  try {
    const user = await currentUser();
    if (!user) throw new Error("Unauthorized");

    const cleanNotes = sanitizeContent(notes);
    const updateData = { status, notes: cleanNotes };
    if (status === "PICKED_UP" && lat && lng) {
      updateData.startLat = parseFloat(lat);
      updateData.startLng = parseFloat(lng);
    }

    const job = await db.deliveryJob.findUnique({
      where: { id: jobId },
      include: {
        order: {
          include: {
            buyerUser: true
          }
        }
      }
    });

    if (!job) throw new Error("Job not found");

    // CRITICAL: Role Authorization Check
    const isAssigned = await isAssignedDeliveryPartner(user.id, jobId);
    const isSeller = await isSellerOfOrder(user.id, job.orderId);

    if (!isAssigned) {
      // Allow the seller to CANCEL/REVOKE the request if not picked up yet
      if (status === "CANCELLED" && isSeller) {
        if (job.status !== "REQUESTED" && job.status !== "ACCEPTED") {
          throw new Error("You cannot revoke a hire once the items have been picked up.");
        }
      } else {
        throw new Error("Unauthorized: You are not the assigned delivery partner for this job.");
      }
    } else {
      // Delivery partner is trying to update
      if (status === "CANCELLED") {
        if (job.status === "PICKED_UP" || job.status === "IN_TRANSIT") {
          throw new Error("You cannot cancel the job after picking up the items. Please contact support.");
        }
      }
    }

    // CRITICAL: State Machine Guard
    const validTransitions = {
      "REQUESTED": ["ACCEPTED", "REJECTED", "CANCELLED"], // Added CANCELLED for seller revocation
      "ACCEPTED": ["PICKED_UP", "CANCELLED"],
      "PICKED_UP": ["IN_TRANSIT"], // Removed CANCELLED for partner after pickup
      "IN_TRANSIT": ["DELIVERED"]   // Removed CANCELLED for partner in transit
    };

    if (status !== "CANCELLED" && status !== "REJECTED") {
      if (!validTransitions[job.status]?.includes(status)) {
        throw new Error(`Invalid transition from ${job.status} to ${status}`);
      }
    }

    await db.$transaction(async (tx) => {
      // CRITICAL: Acceptance & Pickup Guard (Inside TX)
      if (status === "ACCEPTED" || status === "PICKED_UP") {
        const alreadyAssigned = await tx.deliveryJob.findFirst({
          where: {
            orderId: job.orderId,
            status: { in: ["ACCEPTED", "PICKED_UP", "IN_TRANSIT", "DELIVERED"] },
            id: { not: jobId } // Exclude the current job
          }
        });

        if (alreadyAssigned) {
          throw new Error("This order has already been accepted by another delivery partner.");
        }
      }
      // If accepting, cancel all other REQUESTED jobs for this order to clean up dashboards
      if (status === "ACCEPTED") {
        await tx.deliveryJob.updateMany({
          where: {
            orderId: job.orderId,
            status: "REQUESTED",
            id: { not: jobId }
          },
          data: {
            status: "CANCELLED",
            notes: "This order has already been accepted by another delivery partner."
          }
        });
      }

      // Use updateMany for atomic status-checked update
      const updated = await tx.deliveryJob.updateMany({
        where: {
          id: jobId,
          status: job.status // Ensure it hasn't changed since we read it
        },
        data: updateData
      });

      if (updated.count === 0) {
        throw new Error("Job status changed or already updated by another process.");
      }

      // Sync status with Order if applicable
      let orderStatus = job.order.orderStatus;
      if (status === "ACCEPTED" && orderStatus === "PROCESSING") orderStatus = "PROCESSING";
      if (status === "PICKED_UP") orderStatus = "SHIPPED";
      if (status === "IN_TRANSIT") orderStatus = "IN_TRANSIT";
      if (status === "DELIVERED") orderStatus = "DELIVERED";
      if (status === "CANCELLED") orderStatus = "PROCESSING";

      await tx.order.update({
        where: { id: job.orderId },
        data: { orderStatus }
      });

      // Also update order tracking table
      await tx.orderTracking.create({
        data: {
          orderId: job.orderId,
          status: orderStatus,
          notes: notes || `Status updated by delivery partner: ${status}`,
          updatedBy: user.id
        }
      });
    });

    // ─── NEW: Send OTP to Buyer when package is Picked Up ───
    if (status === "PICKED_UP" && job.order.buyerUser?.email) {
      const { sendDeliveryOTPEmail } = await import("@/lib/email");
      await sendDeliveryOTPEmail(job.order.buyerUser.email, job.orderId, job.otp);
    }

    revalidatePath("/delivery-dashboard");
    revalidatePath("/farmer-dashboard/manage-orders");
    revalidatePath("/farmer-dashboard/sales");
    revalidatePath("/agent-dashboard/manage-orders");
    revalidatePath("/agent-dashboard/sales");
    revalidatePath("/my-orders");
    return apiResponse.success(null, "Status updated successfully.");
  } catch (error) {
    return apiResponse.error(error.message);
  }
}

/**
 * Securely complete delivery using OTP verification.
 */
export async function completeDeliveryWithOtp(jobId, otp, lat = null, lng = null, paymentMethod = null, paymentStatus = null) {
  try {
    const user = await currentUser();
    if (!user) throw new Error("Unauthorized");

    const job = await db.deliveryJob.findUnique({
      where: { id: jobId },
      include: {
        order: {
          include: {
            items: {
              include: {
                product: {
                  include: {
                    farmer: { include: { user: true } },
                    agent: { include: { user: true } }
                  }
                }
              }
            }
          }
        },
        deliveryBoy: true
      }
    });

    if (!job) throw new Error("Delivery job not found");

    // SECURITY: Ensure caller is the assigned delivery partner
    const isAssigned = await isAssignedDeliveryPartner(user.id, jobId);
    if (!isAssigned) {
      throw new Error("You are not authorized to complete this delivery.");
    }

    if (job.status === "DELIVERED") {
      return apiResponse.error("This delivery has already been completed.");
    }
    if (job.status !== "PICKED_UP" && job.status !== "IN_TRANSIT" && job.status !== "ACCEPTED") {
      return apiResponse.error("You must accept and pick up the order before completing the delivery.");
    }
    if (job.otp !== otp) {
      return apiResponse.error("Invalid OTP. Please check with the buyer.");
    }

    // OTP matched, perform updates in a transaction
    const result = await db.$transaction(async (tx) => {
      const updateData = {
        status: "DELIVERED",
        notes: "Delivery completed successfully via OTP verification."
      };

      if (lat && lng) {
        const endLat = parseFloat(lat);
        const endLng = parseFloat(lng);
        updateData.endLat = endLat;
        updateData.endLng = endLng;

        let actualDist = 0;
        if (job.startLat && job.startLng) {
          // LOGIC A: Pickup Location -> Delivery Location
          actualDist = await getOSRMDistance(job.startLat, job.startLng, endLat, endLng);
          
          // PROTECTIVE FALLBACK: If the boy clicked "Picked Up" at the delivery destination (Late Click)
          // We treat it as if they "Forgot" and use the Seller -> Buyer distance instead.
          if (actualDist < 0.1) {
             const firstItem = job.order.items?.[0];
             const seller = firstItem?.product?.farmer || firstItem?.product?.agent;
             if (seller?.lat && seller?.lng && job.order.lat && job.order.lng) {
                actualDist = await getOSRMDistance(seller.lat, seller.lng, job.order.lat, job.order.lng);
             }
          }
        } else {
          // LOGIC B: Fallback (Seller Location -> Buyer/Order Location)
          const firstItem = job.order.items?.[0];
          const seller = firstItem?.product?.farmer || firstItem?.product?.agent;
          
          if (seller?.lat && seller?.lng && job.order.lat && job.order.lng) {
            actualDist = await getOSRMDistance(seller.lat, seller.lng, job.order.lat, job.order.lng);
          } else {
            actualDist = job.distance || 0; // Last resort: use the initial estimate
          }
        }

        // Recalculate cargoCost (product-specific delivery charges) to ensure it's not lost
        const cargoCost = job.order.items.reduce((sum, item) => {
          const charge = item.deliveryChargeAtPurchase || item.product?.deliveryCharge || 0;
          const type = item.deliveryChargeTypeAtPurchase || item.product?.deliveryChargeType || 'per_unit';
          return sum + (type === 'flat' ? charge : charge * item.quantity);
        }, 0);

        updateData.actualDistance = actualDist;
        updateData.totalPrice = (actualDist * job.deliveryBoy.pricePerKm) + cargoCost;
      }

      const updatedJob = await tx.deliveryJob.update({
        where: { id: jobId },
        data: updateData
      });

      await tx.order.update({
        where: { id: job.orderId },
        data: {
          orderStatus: "DELIVERED",
          deliveredAt: new Date(),
          ...(paymentMethod && { paymentMethod }),
          ...(paymentStatus && { paymentStatus })
        }
      });

      await tx.orderTracking.create({
        data: {
          orderId: job.orderId,
          status: "DELIVERED",
          notes: "Package delivered and verified via OTP.",
          updatedBy: user.id
        }
      });

      return updatedJob;
    });

    // ─── NEW: Notify Seller ───
    try {
      const firstItem = job.order.items[0];
      const sellerUser = firstItem.product.farmer?.user || firstItem.product.agent?.user;

      if (sellerUser?.email) {
        const { sendDeliveryCompletionEmailToSeller } = await import("@/lib/email");
        await sendDeliveryCompletionEmailToSeller(
          sellerUser.email,
          job.orderId,
          job.deliveryBoy.name
        );
      }
    } catch (err) {
    }

    revalidatePath("/delivery-dashboard");
    revalidatePath("/farmer-dashboard/manage-orders");
    revalidatePath("/my-orders");

    return apiResponse.success(null, "Delivery completed.");
  } catch (error) {
    return apiResponse.error(error.message);
  }
}

/**
 * Updates the current GPS coordinates of a delivery job.
 */
export async function updateLiveLocation(jobId, lat, lng) {
  try {
    const user = await currentUser();
    if (!user) throw new Error("Unauthorized");

    // 1. Coordinate Validation
    const nLat = parseFloat(lat);
    const nLng = parseFloat(lng);
    if (isNaN(nLat) || isNaN(nLng) || nLat < -90 || nLat > 90 || nLng < -180 || nLng > 180) {
      throw new Error("Invalid GPS coordinates");
    }

    // 2. Ownership Check
    const isAssigned = await isAssignedDeliveryPartner(user.id, jobId);
    if (!isAssigned) {
      throw new Error("Unauthorized: You are not the assigned delivery partner for this job.");
    }

    await db.deliveryJob.update({
      where: { id: jobId },
      data: {
        currentLat: nLat,
        currentLng: nLng
      }
    });

    return apiResponse.success(null, "Location updated.");
  } catch (error) {
    return apiResponse.error(error.message);
  }
}
/**
 * Mark a delivery job as payment received by the partner.
 */
export async function markPartnerPaymentReceived(jobId) {
  try {
    const user = await currentUser();
    if (!user) throw new Error("Unauthorized");

    // CRITICAL: Only the delivery partner themselves can mark their payment as received
    const isAssigned = await isAssignedDeliveryPartner(user.id, jobId);
    if (!isAssigned) {
      throw new Error("Unauthorized: Only the delivery partner can mark their payment as received.");
    }

    await db.deliveryJob.update({
      where: { id: jobId },
      data: {
        partnerPaymentReceived: true,
        partnerPaymentReceivedAt: new Date()
      }
    });

    revalidatePath("/delivery-dashboard");
    return apiResponse.success(null, "Payment received marked.");
  } catch (error) {
    return apiResponse.error(error.message);
  }
}
/**
 * Resend the delivery OTP to the buyer (Recovery Action).
 */
export async function resendDeliveryOtp(jobId) {
  try {
    const user = await currentUser();
    if (!user) throw new Error("Unauthorized");

    const job = await db.deliveryJob.findUnique({
      where: { id: jobId },
      include: {
        order: {
          include: { buyerUser: true }
        },
        deliveryBoy: true
      }
    });

    if (!job) throw new Error("Job not found");
    const isAssigned = await isAssignedDeliveryPartner(user.id, jobId);
    const isSeller = await isSellerOfOrder(user.id, job.orderId);

    if (!isAssigned && !isSeller) {
      throw new Error("Unauthorized: Only the delivery partner or the seller can resend the OTP.");
    }

    if (job.status !== "PICKED_UP" && job.status !== "IN_TRANSIT") {
      throw new Error("OTP can only be resent for active deliveries (Picked up or In-transit).");
    }

    if (job.order.buyerUser?.email) {
      const { sendDeliveryOTPEmail } = await import("@/lib/email");
      await sendDeliveryOTPEmail(job.order.buyerUser.email, job.orderId, job.otp);
      return apiResponse.success(null, "OTP resent successfully.");
    }

    return apiResponse.success(null, "OTP resent.");
  } catch (error) {
    return apiResponse.error(error.message);
  }
}
