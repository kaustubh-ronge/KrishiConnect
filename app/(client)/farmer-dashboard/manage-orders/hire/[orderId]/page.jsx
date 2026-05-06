export const dynamic = 'force-dynamic';
import { db } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import HireDeliveryClient from "@/components/Dashboard/HireDeliveryClient";

export default async function HireDeliveryPage({ params }) {
    const { orderId } = await params;
    const user = await currentUser();
    if (!user) redirect("/sign-in");

    // Fetch order with buyer profile for location fallback
    const order = await db.order.findUnique({
        where: { id: orderId },
        include: {
            buyerUser: {
                include: {
                    farmerProfile: true,
                    agentProfile: true
                }
            },
            items: {
                include: {
                    product: true
                }
            }
        }
    });

    if (!order) notFound();

    // Determine delivery coordinates (Order explicitly stored coords > Buyer Profile fallback)
    const lat = order.lat || order.buyerUser.farmerProfile?.lat || order.buyerUser.agentProfile?.lat;
    const lng = order.lng || order.buyerUser.farmerProfile?.lng || order.buyerUser.agentProfile?.lng;

    // Fetch delivery boys nearby
    const { getAvailableDeliveryBoys } = await import("@/actions/delivery-job");
    const boysRes = await getAvailableDeliveryBoys(lat, lng, orderId);

    return (
        <div className="min-h-screen bg-gray-50/50 py-8">
            <HireDeliveryClient 
                order={order} 
                initialBoys={boysRes.success ? boysRes.data : []}
                deliveryCoords={{ lat, lng }}
                userType="farmer"
            />
        </div>
    );
}
