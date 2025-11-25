import { getMyListings } from "@/actions/products";
import { Button } from "@/components/ui/button";
import { Plus, ArrowLeft, PackageOpen } from "lucide-react";
import Link from "next/link";
import ListingsClient from "./_component/ListingsClient";

export default async function MyListingsPage() {
  // Fetch fresh data from the server
  const { data: listings, success } = await getMyListings();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 pb-12">
      {/* Header Bar */}
      <div className="bg-white/80 backdrop-blur-md border-b border-green-100 px-4 py-6 mb-8 sticky top-0 z-20 shadow-sm">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <Link 
                href="/farmer-dashboard" 
                className="text-sm text-gray-500 hover:text-green-600 flex items-center transition-colors mb-2"
              >
                  <ArrowLeft className="h-4 w-4 mr-1" /> Back to Dashboard
              </Link>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                  <PackageOpen className="h-8 w-8 text-green-600" />
                  My Inventory
              </h1>
              <p className="text-gray-600 mt-1 text-sm">
                Manage your active listings, track stock, and remove sold items.
              </p>
            </div>
            
            <Button asChild className="bg-green-600 hover:bg-green-700 shadow-md transition-all hover:scale-105">
              <Link href="/farmer-dashboard/create-listing">
                <Plus className="mr-2 h-4 w-4" /> Add New Produce
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="container mx-auto max-w-6xl px-4">
        <ListingsClient initialListings={success ? listings : []} />
      </div>
    </div>
  );
}