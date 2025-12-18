
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/prisma";
import ReviewFormClient from "./_components/ReviewOrderClient";

export default async function ReviewPage({ params, searchParams }) {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const { orderId } = await params; // Next 15 await
  const { productId } = await searchParams; // Next 15 await

  // Verify Order Ownership
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { items: { include: { product: true } } }
  });

  if (!order || order.buyerId !== user.id) {
    redirect("/my-orders"); // Unauthorized
  }

  // Find the specific item to review
  const itemToReview = order.items.find(item => item.productId === productId);
  if (!itemToReview) {
      // If no productId in query, maybe list all items? For now redirect back
      redirect("/my-orders");
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 flex justify-center items-center px-4">
       <ReviewFormClient 
          orderId={orderId} 
          product={itemToReview.product} 
          userId={user.id} 
       />
    </div>
  );
}