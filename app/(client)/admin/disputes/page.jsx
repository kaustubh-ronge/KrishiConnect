import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import DisputesClient from "./_components/DisputesClient";
import { getAllDisputes } from "@/actions/disputes";

export default async function AdminDisputesPage() {
  const user = await currentUser();
  
  if (!user) {
    redirect("/sign-in");
  }

  // Check if user is admin
  const { db } = await import('@/lib/prisma');
  const dbUser = await db.user.findUnique({
    where: { id: user.id },
    select: { role: true }
  });

  if (!dbUser || dbUser.role !== 'admin') {
    redirect("/");
  }

  const disputesResult = await getAllDisputes();

  return (
    <DisputesClient 
      initialDisputes={disputesResult.success ? disputesResult.data : []}
    />
  );
}

