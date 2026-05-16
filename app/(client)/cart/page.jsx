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
      include: { farmerProfile: true, agentProfile: true, deliveryProfile: true }
  });

  if (dbUser?.role === 'admin' || dbUser?.role === 'super_admin') {
      redirect("/");
  }

  const profile = dbUser?.farmerProfile || dbUser?.agentProfile || dbUser?.deliveryProfile;

  const userData = {
      fullName: profile?.name || dbUser?.name || user.fullName || user.firstName || "",
      email: user.primaryEmailAddress?.emailAddress || user.emailAddresses?.[0]?.emailAddress || "",
      phone: profile?.phone || user.phoneNumbers?.[0]?.phoneNumber || "",
      address: profile?.address || "",
      lat: profile?.lat ?? null,
      lng: profile?.lng ?? null,
      // Pass the individual profiles to satisfy client-side profile detection logic
      farmerProfile: dbUser?.farmerProfile,
      agentProfile: dbUser?.agentProfile,
      deliveryProfile: dbUser?.deliveryProfile,
      role: dbUser?.role
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