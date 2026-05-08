export const dynamic = 'force-dynamic';
import { db } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import HireDeliveryClient from "@/components/Dashboard/HireDeliveryClient";
import { getAvailableDeliveryBoys } from "@/actions/delivery-job";

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
                    product: {
                        include: {
                            farmer: true,
                            agent: true
                        }
                    }
                }
            }
        }
    });

    if (!order) notFound();

    // Determine seller coordinates
    const firstItem = order.items[0];
    const seller = firstItem?.product?.farmer || firstItem?.product?.agent;
    const sellerLat = seller?.lat;
    const sellerLng = seller?.lng;

    // Fetch delivery boys nearby
    const boysRes = await getAvailableDeliveryBoys(lat, lng, orderId, sellerLat, sellerLng);

    return (
        <div className="min-h-screen bg-gray-50/50 py-8">
            <HireDeliveryClient 
                order={order} 
                initialBoys={boysRes.success ? boysRes.data : []}
                deliveryCoords={{ lat, lng }}
                sellerCoords={{ lat: sellerLat, lng: sellerLng }}
                userType="farmer"
            />
        </div>
    );
}
