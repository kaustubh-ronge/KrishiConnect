
"use server";

import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// --- BUYER ACTION: Create Dispute ---
export async function createDispute(formData) {
  const user = await currentUser();
  if (!user) return { success: false, error: "Not logged in" };

  try {
    const orderId = formData.get("orderId");
    const reason = formData.get("reason");

    if (!reason || reason.trim().length < 10) {
      return { success: false, error: "Please provide a detailed reason (min 10 chars)." };
    }

    // 1. Fetch Order & Verify Ownership
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: { items: true } 
    });

    if (!order) return { success: false, error: "Order not found." };
    if (order.buyerId !== user.id) return { success: false, error: "Unauthorized." };

    // 2. Check Status (Must be Delivered)
    if (order.orderStatus !== 'DELIVERED') {
       return { success: false, error: "You can only report issues for delivered orders." };
    }

    // 3. Check Duplicate
    if (order.disputeStatus === 'OPEN') {
        return { success: false, error: "A dispute is already open for this order." };
    }

    // 4. Update Order to Dispute State & Freeze Payout
    await db.order.update({
      where: { id: orderId },
      data: {
        disputeStatus: 'OPEN',
        disputeReason: reason,
        disputeCreatedAt: new Date(),
        payoutStatus: 'ON_HOLD' // Freeze money automatically
      }
    });

    revalidatePath('/my-orders');
    return { success: true, message: "Issue reported. Support team will contact you shortly." };

  } catch (error) {
    console.error("Dispute Error:", error);
    return { success: false, error: "Failed to submit report." };
  }
}

// --- ADMIN ACTION: Get All Disputes ---
export async function getAllDisputes() {
  const user = await currentUser();
  if (!user) return { success: false, error: "Not logged in" };

  try {
     // Verify Admin Role
     const dbUser = await db.user.findUnique({ where: { id: user.id }, select: { role: true } });
     if (dbUser?.role !== 'admin') return { success: false, error: "Unauthorized" };

     const disputes = await db.order.findMany({
        where: {
            disputeStatus: { not: null } // Fetch anything that has/had a dispute
        },
        orderBy: { disputeCreatedAt: 'desc' },
        include: {
            buyerUser: { 
                select: { 
                    email: true, 
                    farmerProfile: { select: { name: true } }, 
                    agentProfile: { select: { name: true, companyName: true } } 
                } 
            },
            items: {
                include: {
                    product: {
                        select: {
                            productName: true,
                            sellerType: true,
                            // Get seller details to contact them
                            farmer: { select: { name: true, phone: true } },
                            agent: { select: { companyName: true, phone: true } }
                        }
                    }
                }
            }
        }
     });

     return { success: true, data: disputes };
  } catch (error) {
     console.error("Get Disputes Error:", error);
     return { success: false, error: "Failed to fetch disputes" };
  }
}

// --- ADMIN ACTION: Resolve Dispute ---
export async function resolveDispute(formData) {
    const user = await currentUser();
    if (!user) return { success: false, error: "Not logged in" };

    try {
        // Verify Admin Role
        const dbUser = await db.user.findUnique({ where: { id: user.id }, select: { role: true } });
        if (dbUser?.role !== 'admin') return { success: false, error: "Unauthorized" };

        const orderId = formData.get("orderId");
        const resolution = formData.get("resolution"); // 'RESOLVED' (Buyer Wins) or 'REJECTED' (Seller Wins)

        if (!['RESOLVED', 'REJECTED'].includes(resolution)) {
            return { success: false, error: "Invalid resolution status" };
        }

        // Logic:
        // If RESOLVED (Buyer was right) -> Cancel Payout (Refund manually via Razorpay)
        // If REJECTED (Seller was right) -> Release Payout (Set to PENDING)
        let newPayoutStatus = 'PENDING';
        if (resolution === 'RESOLVED') {
            newPayoutStatus = 'CANCELLED'; 
        }

        await db.order.update({
            where: { id: orderId },
            data: {
                disputeStatus: resolution,
                disputeResolvedAt: new Date(),
                payoutStatus: newPayoutStatus
            }
        });

        revalidatePath('/admin/disputes');
        return { success: true, message: `Dispute marked as ${resolution}` };

    } catch (error) {
        console.error("Resolve Error:", error);
        return { success: false, error: "Failed to resolve dispute." };
    }
}