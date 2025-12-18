import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import ReviewOrderClient from "./_components/ReviewOrderClient";
import { db } from "@/lib/prisma";

export default async function ReviewOrderPage({ params }) {
  const user = await currentUser();
  
  if (!user) {
    redirect("/sign-in");
  }

  const { orderId } = params;

  // Fetch the order with its items
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: {
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

  if (!order || order.buyerId !== user.id) {
    redirect("/my-orders");
  }

  if (order.orderStatus !== 'DELIVERED') {
    redirect("/my-orders");
  }

  return <ReviewOrderClient order={order} />;
}

