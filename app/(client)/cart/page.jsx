import { getCart } from "@/actions/cart";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import CartClient from "./components/CartClient";

export const dynamic = 'force-dynamic';

export default async function CartPage() {
  let user;
  try {
    user = await currentUser();
  } catch (error) {
    console.error("CartPage Auth Error:", error);
  }
  if (!user) redirect("/sign-in");

  const { data: cart } = await getCart();

  // Fetch more user info from DB
  const { db } = await import("@/lib/prisma");
  const dbUser = await db.user.findUnique({
      where: { id: user.id },
      include: { farmerProfile: true, agentProfile: true }
  });

  if (dbUser?.role === 'admin' || dbUser?.role === 'super_admin') {
      redirect("/");
  }

  const userData = {
      fullName: dbUser?.farmerProfile?.name || dbUser?.agentProfile?.name || user.fullName || user.firstName || "",
      email: user.primaryEmailAddress?.emailAddress || user.emailAddresses?.[0]?.emailAddress || "",
      phone: dbUser?.farmerProfile?.phone || dbUser?.agentProfile?.phone || user.phoneNumbers?.[0]?.phoneNumber || "",
      address: dbUser?.farmerProfile?.address || dbUser?.agentProfile?.address || "",
      lat: dbUser?.farmerProfile?.lat || dbUser?.agentProfile?.lat || null,
      lng: dbUser?.farmerProfile?.lng || dbUser?.agentProfile?.lng || null
  };

  const { calculateDynamicDeliveryFee } = await import("@/actions/orders");
  const { getUserSpecialDeliveryRequests } = await import("@/actions/special-delivery");

  let initialUnserviceableIds = [];
  let initialSpecialRequests = [];

  if (cart && cart.items.length > 0) {
      const { data: requests } = await getUserSpecialDeliveryRequests();
      initialSpecialRequests = requests || [];

      if (userData.lat && userData.lng) {
          const allItemIds = cart.items.map(it => it.id);
          const res = await calculateDynamicDeliveryFee(allItemIds, userData.lat, userData.lng);
          if (res.success) {
              initialUnserviceableIds = res.unserviceableIds || [];
          }
      }
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
       <CartClient 
          initialCart={cart} 
          user={userData} 
          initialUnserviceableIds={initialUnserviceableIds}
          initialSpecialRequests={initialSpecialRequests}
       />
    </div>
  );
}