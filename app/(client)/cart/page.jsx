import { getCart } from "@/actions/cart";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import CartClient from "./components/CartClient";

export const dynamic = 'force-dynamic';

export default async function CartPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const { data: cart } = await getCart();

  return (
    <div className="min-h-screen bg-gray-50/50">
       <CartClient initialCart={cart} />
    </div>
  );
}