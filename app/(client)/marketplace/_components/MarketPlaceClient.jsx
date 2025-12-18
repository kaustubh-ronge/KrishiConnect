"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter, X, Sprout, Briefcase, ArrowUpDown, MapPin } from "lucide-react";
import ProductCard from "./ProductCard";
import { motion, AnimatePresence } from "framer-motion";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function MarketplaceClient({ initialListings, userRole, recentlyViewed }) {
  const [searchQuery, setSearchQuery] = useState("");

  // --- Filter States ---
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [activeTab, setActiveTab] = useState("all"); // all, farmer, agent
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });
  const [showOutOfStock, setShowOutOfStock] = useState(false);
  const [sortBy, setSortBy] = useState("newest");
  
  // Enhanced filters
  const [locationFilter, setLocationFilter] = useState("");
  const [freshnessFilter, setFreshnessFilter] = useState("all"); // all, week, month

  // --- 1. Dynamic Categories ---
  // Automatically extract unique product names from the listings
  const categories = useMemo(() => {
    const uniqueNames = new Set(initialListings.map(item => item.productName));
    return ["All", ...Array.from(uniqueNames).sort()];
  }, [initialListings]);

  // --- 2. Filter Logic ---
  const filteredListings = initialListings.filter(item => {
    // Search
    const matchesSearch = item.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase());

    // Category
    const matchesCategory = selectedCategory === "All" || item.productName === selectedCategory;

    // Seller Type (Tab)
    const matchesTab = activeTab === "all" ? true :
      activeTab === "farmers" ? item.sellerType === 'farmer' :
        item.sellerType === 'agent';

    // Price Range
    const price = item.pricePerUnit;
    const minPrice = priceRange.min ? parseFloat(priceRange.min) : 0;
    const maxPrice = priceRange.max ? parseFloat(priceRange.max) : Infinity;
    const matchesPrice = price >= minPrice && price <= maxPrice;

    // Availability
    const matchesStock = showOutOfStock ? true : item.availableStock > 0;

    // Location Filter
    const sellerLocation = item.sellerType === 'farmer' 
      ? (item.farmer?.region || item.farmer?.district || '').toLowerCase()
      : (item.agent?.region || item.agent?.district || '').toLowerCase();
    const matchesLocation = !locationFilter || sellerLocation.includes(locationFilter.toLowerCase());

    // Freshness Filter
    let matchesFreshness = true;
    if (freshnessFilter !== 'all' && item.harvestDate) {
      const harvestDate = new Date(item.harvestDate);
      const now = new Date();
      const daysDiff = (now - harvestDate) / (1000 * 60 * 60 * 24);
      
      if (freshnessFilter === 'week') {
        matchesFreshness = daysDiff <= 7;
      } else if (freshnessFilter === 'month') {
        matchesFreshness = daysDiff <= 30;
      }
    }

    return matchesSearch && matchesCategory && matchesTab && matchesPrice && matchesStock && matchesLocation && matchesFreshness;
  }).sort((a, b) => {
    // Sorting Logic
    if (sortBy === "price_low") return a.pricePerUnit - b.pricePerUnit;
    if (sortBy === "price_high") return b.pricePerUnit - a.pricePerUnit;
    if (sortBy === "rating") return (b.averageRating || 0) - (a.averageRating || 0);
    if (sortBy === "harvest") {
      if (!a.harvestDate) return 1;
      if (!b.harvestDate) return -1;
      return new Date(b.harvestDate) - new Date(a.harvestDate);
    }
    if (sortBy === "newest") return new Date(b.createdAt) - new Date(a.createdAt);
    return 0;
  });

  // Helper to reset filters
  const resetFilters = () => {
    setSearchQuery("");
    setSelectedCategory("All");
    setPriceRange({ min: "", max: "" });
    setSortBy("newest");
    setLocationFilter("");
    setFreshnessFilter("all");
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl min-h-screen">

      {/* --- Header --- */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Marketplace</h1>
          <p className="text-gray-500 mt-1">
            Browsing as: <span className="font-semibold capitalize text-green-600">{userRole}</span>
          </p>
        </div>

        <div className="flex gap-2 w-full md:w-auto items-center">
          {/* Sort Dropdown (Desktop) */}
          <div className="hidden md:block w-40">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="bg-white border-gray-200">
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="price_low">Price: Low to High</SelectItem>
                <SelectItem value="price_high">Price: High to Low</SelectItem>
                <SelectItem value="rating">Highest Rated</SelectItem>
                <SelectItem value="harvest">Freshest Harvest</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Search Bar */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search crops..."
              className="pl-10 h-10 bg-white border-gray-200 shadow-sm rounded-lg"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Mobile Filter Trigger */}
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild><Button variant="outline" className="h-10"><Filter className="mr-2 h-4 w-4" /> Filters</Button></SheetTrigger>
              <SheetContent side="left" className="overflow-y-auto">
                <SheetHeader><SheetTitle>Filters</SheetTitle></SheetHeader>
                <FilterSidebar
                  categories={categories}
                  selectedCategory={selectedCategory} setSelectedCategory={setSelectedCategory}
                  priceRange={priceRange} setPriceRange={setPriceRange}
                  showOutOfStock={showOutOfStock} setShowOutOfStock={setShowOutOfStock}
                  locationFilter={locationFilter} setLocationFilter={setLocationFilter}
                  freshnessFilter={freshnessFilter} setFreshnessFilter={setFreshnessFilter}
                />
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      {/* --- Tabs Navigation --- */}
      <Tabs defaultValue="all" onValueChange={setActiveTab} className="w-full mb-8">
        <div className="flex justify-center">
          <TabsList className="h-12 p-1 bg-gray-100/80 rounded-full shadow-inner">
            <TabsTrigger value="all" className="rounded-full px-6 h-full text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm">All</TabsTrigger>
            <TabsTrigger value="farmers" className="rounded-full px-6 h-full text-sm data-[state=active]:bg-green-600 data-[state=active]:text-white data-[state=active]:shadow-sm">
              <Sprout className="mr-2 h-4 w-4" /> Farm Fresh
            </TabsTrigger>
            <TabsTrigger value="agents" className="rounded-full px-6 h-full text-sm data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm">
              <Briefcase className="mr-2 h-4 w-4" /> Traders
            </TabsTrigger>
          </TabsList>
        </div>
      </Tabs>

      <div className="flex gap-8 items-start">

        {/* --- LEFT: Sidebar Filters (Desktop - Sticky & Scrollable) --- */}
        <div className="hidden md:block w-64 flex-shrink-0 sticky top-24 h-[calc(100vh-8rem)] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-200">
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <span className="text-gray-900 font-bold text-lg flex items-center gap-2"><Filter className="h-5 w-5" /> Filters</span>
              <button onClick={resetFilters} className="text-xs text-red-500 hover:underline font-medium">Reset</button>
            </div>
            <FilterSidebar
              categories={categories}
              selectedCategory={selectedCategory} setSelectedCategory={setSelectedCategory}
              priceRange={priceRange} setPriceRange={setPriceRange}
              showOutOfStock={showOutOfStock} setShowOutOfStock={setShowOutOfStock}
              locationFilter={locationFilter} setLocationFilter={setLocationFilter}
              freshnessFilter={freshnessFilter} setFreshnessFilter={setFreshnessFilter}
            />
          </div>
        </div>

        {/* --- RIGHT: Product Grid --- */}
        <div className="flex-grow">
          {/* Recently Viewed Section */}
          {recentlyViewed && recentlyViewed.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Recently Viewed</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {recentlyViewed.slice(0, 3).map((product) => (
                  <ProductCard key={product.id} product={product} index={0} />
                ))}
              </div>
              <div className="border-t mt-6 pt-6"></div>
            </div>
          )}

          {filteredListings.length > 0 ? (
            <>
              <p className="text-sm text-gray-500 mb-4">Showing {filteredListings.length} results</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
                <AnimatePresence mode="popLayout">
                  {filteredListings.map((product, index) => (
                    <ProductCard key={product.id} product={product} index={index} />
                  ))}
                </AnimatePresence>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-32 text-center bg-white rounded-2xl border-2 border-dashed border-gray-200">
              <Search className="h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900">No products found</h3>
              <p className="text-gray-500 mb-4">Try adjusting your search or filters.</p>
              <Button variant="outline" onClick={resetFilters} className="border-green-200 text-green-700 hover:bg-green-50">
                Clear all filters
              </Button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

// --- Filter Component (Reusable) ---
function FilterSidebar({ categories, selectedCategory, setSelectedCategory, priceRange, setPriceRange, showOutOfStock, setShowOutOfStock, locationFilter, setLocationFilter, freshnessFilter, setFreshnessFilter }) {
  return (
    <div className="space-y-8">

      {/* Location Filter */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider flex items-center gap-2">
          <MapPin className="h-4 w-4" /> Location
        </h4>
        <Input
          type="text"
          placeholder="Search by region/district"
          className="h-9"
          value={locationFilter}
          onChange={(e) => setLocationFilter(e.target.value)}
        />
        <p className="text-xs text-gray-500">Find farmers/agents near you</p>
      </div>

      {/* Freshness Filter */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Freshness</h4>
        <div className="space-y-2">
          {[
            { value: 'all', label: 'All Products' },
            { value: 'week', label: 'Harvested this week' },
            { value: 'month', label: 'Harvested this month' }
          ].map(option => (
            <button
              key={option.value}
              onClick={() => setFreshnessFilter(option.value)}
              className={`block text-sm w-full text-left px-3 py-2 rounded-md transition-all ${freshnessFilter === option.value ? "bg-green-50 text-green-700 font-medium border-l-4 border-green-600 shadow-sm" : "text-gray-600 hover:bg-gray-50"}`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Availability */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Availability</h4>
        <div className="flex items-center space-x-2">
          <Checkbox id="stock" checked={showOutOfStock} onCheckedChange={setShowOutOfStock} />
          <Label htmlFor="stock" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            Show Sold Out Items
          </Label>
        </div>
      </div>

      {/* Price Range */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Price Range (₹)</h4>
        <div className="flex gap-2">
          <Input
            type="number" placeholder="Min" className="h-9"
            value={priceRange.min}
            onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
          />
          <Input
            type="number" placeholder="Max" className="h-9"
            value={priceRange.max}
            onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
          />
        </div>
      </div>

      {/* Dynamic Categories */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Categories</h4>
        <div className="space-y-1 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-200">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`block text-sm w-full text-left px-3 py-2 rounded-md transition-all ${selectedCategory === cat ? "bg-green-50 text-green-700 font-medium border-l-4 border-green-600 shadow-sm" : "text-gray-600 hover:bg-gray-50"}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}