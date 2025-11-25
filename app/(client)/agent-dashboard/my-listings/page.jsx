import { getMyListings } from "@/actions/products";
import { Button } from "@/components/ui/button";
import { Plus, ArrowLeft, PackageOpen } from "lucide-react";
import Link from "next/link";
import AgentListingsClient from "./_components/AgentListingsClient";

export default async function AgentMyListingsPage() {
  const { data: listings, success } = await getMyListings();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 pb-12">
      <div className="bg-white/80 backdrop-blur-md border-b border-blue-100 px-4 py-6 mb-8 sticky top-0 z-20 shadow-sm">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <Link href="/agent-dashboard" className="text-sm text-gray-500 hover:text-blue-600 flex items-center transition-colors mb-2"><ArrowLeft className="h-4 w-4 mr-1" /> Back to Dashboard</Link>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2"><PackageOpen className="h-8 w-8 text-blue-600" /> My Inventory (Agent)</h1>
            </div>
            <Button asChild className="bg-blue-600 hover:bg-blue-700 shadow-md"><Link href="/agent-dashboard/create-listing"><Plus className="mr-2 h-4 w-4" /> Add Stock</Link></Button>
          </div>
        </div>
      </div>
      <div className="container mx-auto max-w-6xl px-4">
        <AgentListingsClient initialListings={success ? listings : []} />
      </div>
    </div>
  );
}