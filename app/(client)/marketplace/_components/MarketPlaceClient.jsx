
"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Search, Filter, X, Sprout, Briefcase, ArrowUpDown,
  MapPin, SlidersHorizontal, TrendingUp, Sparkles, Star,
  ShoppingBag, Leaf, Zap, Grid3X3, List, ChevronDown,
  RotateCcw, Package, AlertCircle, Compass, Heart,
  Flame, Crown, Gem, Clock, Shield, Award
} from "lucide-react";
import ProductCard from "./ProductCard";
import { motion, AnimatePresence } from "framer-motion";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function MarketplaceClient({ initialListings, userRole, recentlyViewed }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("grid"); // grid or list

  // --- Filter States ---
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [activeTab, setActiveTab] = useState("all");
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });
  const [showOutOfStock, setShowOutOfStock] = useState(
    initialListings?.some(item => item.availableStock > 0) ? false : true
  );
  const [sortBy, setSortBy] = useState("newest");
  const [locationFilter, setLocationFilter] = useState("");
  const [freshnessFilter, setFreshnessFilter] = useState("all");

  // --- Dynamic Categories ---
  const categories = useMemo(() => {
    const uniqueNames = new Set(initialListings.map(item => item.productName));
    return ["All", ...Array.from(uniqueNames).sort()];
  }, [initialListings]);

  // --- Filter Logic ---
  const filteredListings = useMemo(() => {
    return initialListings.filter(item => {
      const matchesSearch = item.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory = selectedCategory === "All" || item.productName === selectedCategory;

      const matchesTab = activeTab === "all" ? true :
        activeTab === "farmers" ? item.sellerType === 'farmer' : item.sellerType === 'agent';

      const price = item.pricePerUnit;
      const minPrice = priceRange.min ? parseFloat(priceRange.min) : 0;
      const maxPrice = priceRange.max ? parseFloat(priceRange.max) : Infinity;
      const matchesPrice = price >= minPrice && price <= maxPrice;

      const matchesStock = showOutOfStock ? true : item.availableStock > 0;

      const sellerLocation = item.sellerType === 'farmer'
        ? (item.farmer?.region || item.farmer?.district || '').toLowerCase()
        : (item.agent?.region || item.agent?.district || '').toLowerCase();
      const matchesLocation = !locationFilter || sellerLocation.includes(locationFilter.toLowerCase());

      let matchesFreshness = true;
      if (freshnessFilter !== 'all' && item.harvestDate) {
        const harvestDate = new Date(item.harvestDate);
        const now = new Date();
        const daysDiff = (now - harvestDate) / (1000 * 60 * 60 * 24);

        if (freshnessFilter === 'week') matchesFreshness = daysDiff <= 7;
        else if (freshnessFilter === 'month') matchesFreshness = daysDiff <= 30;
      }

      return matchesSearch && matchesCategory && matchesTab && matchesPrice && matchesStock && matchesLocation && matchesFreshness;
    }).sort((a, b) => {
      if (sortBy === "price_low") return a.pricePerUnit - b.pricePerUnit;
      if (sortBy === "price_high") return b.pricePerUnit - a.pricePerUnit;
      if (sortBy === "rating") return (b.averageRating || 0) - (a.averageRating || 0);
      if (sortBy === "harvest") {
        if (!a.harvestDate) return 1;
        if (!b.harvestDate) return -1;
        return new Date(b.harvestDate) - new Date(a.harvestDate);
      }
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
  }, [initialListings, searchQuery, selectedCategory, activeTab, priceRange, showOutOfStock, locationFilter, freshnessFilter, sortBy]);

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedCategory("All");
    setPriceRange({ min: "", max: "" });
    setSortBy("newest");
    setLocationFilter("");
    setFreshnessFilter("all");
  };

  const activeFiltersCount = [
    selectedCategory !== "All",
    priceRange.min || priceRange.max,
    locationFilter,
    freshnessFilter !== "all",
    showOutOfStock
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-50 via-emerald-50/20 to-teal-50/30">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ x: [0, 150, 0], y: [0, -80, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute -top-40 -right-40 w-[800px] h-[800px] bg-gradient-to-br from-emerald-200/20 to-green-300/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ x: [0, -120, 0], y: [0, 90, 0] }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-40 -left-40 w-[700px] h-[700px] bg-gradient-to-tr from-blue-200/20 to-indigo-300/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ scale: [1, 1.2, 1], rotate: [0, 45, 0] }}
          transition={{ duration: 35, repeat: Infinity, ease: "linear" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-yellow-100/10 to-green-200/10 rounded-full blur-3xl"
        />
      </div>

      <div className="relative container mx-auto px-4 py-8 max-w-7xl">
        {/* --- Premium Header --- */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="bg-white/70 backdrop-blur-xl border border-white/50 shadow-2xl rounded-3xl p-6 md:p-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex items-center gap-4">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 4, repeat: Infinity }}
                  className="bg-gradient-to-br from-emerald-400 to-green-600 p-4 rounded-2xl text-white shadow-xl shadow-green-500/25"
                >
                  <ShoppingBag className="h-8 w-8" />
                </motion.div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-gray-900 via-emerald-800 to-gray-900 bg-clip-text text-transparent">
                    Marketplace
                  </h1>
                  <p className="text-gray-600 mt-1 flex items-center gap-2">
                    <Compass className="h-4 w-4 text-emerald-500" />
                    Discover fresh produce from verified sellers
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Badge className="bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-700 border-emerald-200 px-4 py-2 shadow-sm">
                  <Shield className="h-4 w-4 mr-1.5" />
                  Browsing as <span className="font-bold ml-1 capitalize">{userRole}</span>
                </Badge>
                <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 px-4 py-2 shadow-sm">
                  <Sparkles className="h-4 w-4 mr-1.5" />
                  {initialListings.length} Products
                </Badge>
              </div>
            </div>

            {/* Search & Quick Stats */}
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="col-span-2 md:col-span-2 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  placeholder="Search by crop name, description..."
                  className="pl-12 h-14 bg-white/80 border-2 border-emerald-100 hover:border-emerald-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 rounded-2xl text-lg transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X className="h-4 w-4 text-gray-400" />
                  </button>
                )}
              </div>
              <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl p-3 border border-emerald-100 flex items-center gap-3">
                <div className="p-3 bg-emerald-100 rounded-xl">
                  <Leaf className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-semibold">Farm Fresh</p>
                  <p className="text-lg font-bold text-emerald-700">{initialListings.filter(i => i.sellerType === 'farmer').length}</p>
                </div>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-3 border border-blue-100 flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <Award className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-semibold">Verified</p>
                  <p className="text-lg font-bold text-blue-700">{initialListings.filter(i => i.sellerType === 'agent').length}</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* --- Tabs & Controls Bar --- */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/60 backdrop-blur-xl border border-white/50 shadow-lg rounded-2xl p-4 mb-6"
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            {/* Tabs */}
            <Tabs defaultValue="all" onValueChange={setActiveTab} className="w-full md:w-auto">
              <TabsList className="h-12 p-1 bg-gray-100/80 rounded-full">
                <TabsTrigger
                  value="all"
                  className="rounded-full px-6 h-full text-sm font-semibold data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-lg transition-all"
                >
                  <Grid3X3 className="h-4 w-4 mr-2" />
                  All Products
                </TabsTrigger>
                <TabsTrigger
                  value="farmers"
                  className="rounded-full px-6 h-full text-sm font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-green-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all"
                >
                  <Sprout className="h-4 w-4 mr-2" />
                  Farm Fresh
                </TabsTrigger>
                <TabsTrigger
                  value="agents"
                  className="rounded-full px-6 h-full text-sm font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all"
                >
                  <Briefcase className="h-4 w-4 mr-2" />
                  Traders
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Sort & Filter Controls */}
            <div className="flex items-center gap-3 w-full md:w-auto">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="h-12 bg-white border-2 border-gray-200 hover:border-emerald-300 rounded-xl font-medium min-w-[180px] transition-all">
                  <ArrowUpDown className="h-4 w-4 mr-2 text-gray-500" />
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="newest">🆕 Newest First</SelectItem>
                  <SelectItem value="price_low">💰 Price: Low to High</SelectItem>
                  <SelectItem value="price_high">💎 Price: High to Low</SelectItem>
                  <SelectItem value="rating">⭐ Highest Rated</SelectItem>
                  <SelectItem value="harvest">🌾 Freshest Harvest</SelectItem>
                </SelectContent>
              </Select>

              {/* Mobile Filter Button */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button
                    variant="outline"
                    className="md:hidden h-12 border-2 border-gray-200 hover:border-emerald-300 rounded-xl font-medium relative"
                  >
                    <SlidersHorizontal className="h-4 w-4 mr-2" />
                    Filters
                    {activeFiltersCount > 0 && (
                      <Badge className="absolute -top-2 -right-2 bg-emerald-500 text-white h-5 w-5 flex items-center justify-center p-0 text-xs">
                        {activeFiltersCount}
                      </Badge>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="overflow-y-auto w-80">
                  <SheetHeader>
                    <SheetTitle className="flex items-center gap-2">
                      <Filter className="h-5 w-5" /> Filters
                    </SheetTitle>
                  </SheetHeader>
                  <div className="mt-6">
                    <FilterSidebar
                      categories={categories}
                      selectedCategory={selectedCategory}
                      setSelectedCategory={setSelectedCategory}
                      priceRange={priceRange}
                      setPriceRange={setPriceRange}
                      showOutOfStock={showOutOfStock}
                      setShowOutOfStock={setShowOutOfStock}
                      locationFilter={locationFilter}
                      setLocationFilter={setLocationFilter}
                      freshnessFilter={freshnessFilter}
                      setFreshnessFilter={setFreshnessFilter}
                    />
                  </div>
                </SheetContent>
              </Sheet>

              {activeFiltersCount > 0 && (
                <Button
                  variant="ghost"
                  onClick={resetFilters}
                  className="h-12 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl font-medium"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              )}
            </div>
          </div>

          {/* Active Filter Chips */}
          <AnimatePresence>
            {activeFiltersCount > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100"
              >
                {selectedCategory !== "All" && (
                  <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 px-3 py-1.5">
                    Category: {selectedCategory}
                    <X className="h-3 w-3 ml-2 cursor-pointer" onClick={() => setSelectedCategory("All")} />
                  </Badge>
                )}
                {priceRange.min && (
                  <Badge className="bg-blue-100 text-blue-700 border-blue-200 px-3 py-1.5">
                    Min: ₹{priceRange.min}
                    <X className="h-3 w-3 ml-2 cursor-pointer" onClick={() => setPriceRange({ ...priceRange, min: "" })} />
                  </Badge>
                )}
                {priceRange.max && (
                  <Badge className="bg-blue-100 text-blue-700 border-blue-200 px-3 py-1.5">
                    Max: ₹{priceRange.max}
                    <X className="h-3 w-3 ml-2 cursor-pointer" onClick={() => setPriceRange({ ...priceRange, max: "" })} />
                  </Badge>
                )}
                {locationFilter && (
                  <Badge className="bg-purple-100 text-purple-700 border-purple-200 px-3 py-1.5">
                    Location: {locationFilter}
                    <X className="h-3 w-3 ml-2 cursor-pointer" onClick={() => setLocationFilter("")} />
                  </Badge>
                )}
                {freshnessFilter !== "all" && (
                  <Badge className="bg-orange-100 text-orange-700 border-orange-200 px-3 py-1.5">
                    {freshnessFilter === 'week' ? 'This Week' : 'This Month'}
                    <X className="h-3 w-3 ml-2 cursor-pointer" onClick={() => setFreshnessFilter("all")} />
                  </Badge>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Main Content */}
        <div className="flex gap-8 items-start">
          {/* Desktop Filter Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="hidden md:block w-72 flex-shrink-0 sticky top-24 h-[calc(100vh-8rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300"
          >
            <div className="bg-white/80 backdrop-blur-sm border border-white/50 shadow-xl rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <span className="text-gray-900 font-bold text-lg flex items-center gap-2">
                  <Filter className="h-5 w-5 text-emerald-600" />
                  Filters
                </span>
                {activeFiltersCount > 0 && (
                  <Badge className="bg-emerald-500 text-white">{activeFiltersCount} active</Badge>
                )}
              </div>
              <FilterSidebar
                categories={categories}
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
                priceRange={priceRange}
                setPriceRange={setPriceRange}
                showOutOfStock={showOutOfStock}
                setShowOutOfStock={setShowOutOfStock}
                locationFilter={locationFilter}
                setLocationFilter={setLocationFilter}
                freshnessFilter={freshnessFilter}
                setFreshnessFilter={setFreshnessFilter}
              />
            </div>
          </motion.div>

          {/* Product Grid */}
          <div className="flex-1 min-w-0">
            {/* Recently Viewed Section */}
            {recentlyViewed && recentlyViewed.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mb-8"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-yellow-100 rounded-xl">
                      <Clock className="h-5 w-5 text-yellow-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">Recently Viewed</h2>
                  </div>
                  <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">
                    {recentlyViewed.length} items
                  </Badge>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {recentlyViewed.slice(0, 3).map((product) => (
                    <ProductCard key={product.id} product={product} index={0} />
                  ))}
                </div>
                <Separator className="mt-8 bg-gray-200" />
              </motion.div>
            )}

            {/* Results Count */}
            <div className="flex items-center justify-between mb-6">
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm text-gray-500 font-medium"
              >
                Showing <span className="font-bold text-gray-900">{filteredListings.length}</span> results
                {searchQuery && <span className="text-gray-400"> for "{searchQuery}"</span>}
              </motion.p>
            </div>

            {/* Product Grid */}
            {filteredListings.length > 0 ? (
              <div className={`grid gap-6 ${viewMode === 'grid'
                ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3'
                : 'grid-cols-1'
                }`}>
                <AnimatePresence mode="popLayout">
                  {Array.from(new Map(filteredListings.map(item => [item.id, item])).values()).map((product, index) => (
                    <motion.div
                      key={product.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <ProductCard product={product} index={index} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-20 bg-white/60 backdrop-blur-sm rounded-3xl border-2 border-dashed border-gray-300"
              >
                <motion.div
                  animate={{
                    y: [0, -20, 0],
                    rotate: [0, 10, -10, 0]
                  }}
                  transition={{ duration: 4, repeat: Infinity }}
                  className="mb-6"
                >
                  <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                    <Search className="h-12 w-12 text-gray-400" />
                  </div>
                </motion.div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">No products found</h3>
                <p className="text-gray-500 mb-6 text-center max-w-md">
                  We couldn't find any products matching your criteria. Try adjusting your search or filters.
                </p>
                <Button
                  onClick={resetFilters}
                  className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white h-12 px-8 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Clear All Filters
                </Button>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Enhanced Filter Sidebar Component ---
function FilterSidebar({
  categories, selectedCategory, setSelectedCategory,
  priceRange, setPriceRange, showOutOfStock, setShowOutOfStock,
  locationFilter, setLocationFilter, freshnessFilter, setFreshnessFilter
}) {
  return (
    <div className="space-y-8">
      {/* Location Filter */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-purple-100 rounded-lg">
            <MapPin className="h-4 w-4 text-purple-600" />
          </div>
          <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Location</h4>
        </div>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search region/district..."
            className="pl-10 h-11 bg-gray-50 border-2 border-gray-200 hover:border-purple-300 focus:border-purple-500 rounded-xl transition-all"
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
          />
        </div>
        <p className="text-xs text-gray-400">Find sellers near your location</p>
      </div>

      <Separator />

      {/* Freshness Filter */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-orange-100 rounded-lg">
            <Leaf className="h-4 w-4 text-orange-600" />
          </div>
          <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Freshness</h4>
        </div>
        <div className="space-y-1">
          {[
            { value: 'all', label: '🌍 All Products', desc: 'Show everything' },
            { value: 'week', label: '⚡ This Week', desc: 'Harvested within 7 days' },
            { value: 'month', label: '📅 This Month', desc: 'Harvested within 30 days' }
          ].map(option => (
            <motion.button
              key={option.value}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setFreshnessFilter(option.value)}
              className={`block text-sm w-full text-left p-3 rounded-xl transition-all ${freshnessFilter === option.value
                ? "bg-gradient-to-r from-orange-50 to-amber-50 text-orange-700 font-semibold border-l-4 border-orange-500 shadow-md"
                : "text-gray-600 hover:bg-gray-50"
                }`}
            >
              <div>{option.label}</div>
              <div className="text-xs opacity-60 mt-0.5">{option.desc}</div>
            </motion.button>
          ))}
        </div>
      </div>

      <Separator />

      {/* Availability */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-green-100 rounded-lg">
            <Package className="h-4 w-4 text-green-600" />
          </div>
          <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Availability</h4>
        </div>
        <div className="flex items-center space-x-3 bg-gray-50 p-3 rounded-xl border border-gray-200 hover:border-green-300 transition-all cursor-pointer">
          <Checkbox
            id="stock"
            checked={showOutOfStock}
            onCheckedChange={setShowOutOfStock}
            className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
          />
          <Label htmlFor="stock" className="text-sm font-medium text-gray-700 cursor-pointer">
            Show Sold Out Items
          </Label>
        </div>
      </div>

      <Separator />

      {/* Price Range */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-100 rounded-lg">
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </div>
          <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Price Range (₹)</h4>
        </div>
        <div className="flex gap-2 items-center">
          <Input
            type="number"
            placeholder="Min"
            className="h-11 bg-gray-50 border-2 border-gray-200 hover:border-blue-300 focus:border-blue-500 rounded-xl transition-all text-center font-medium"
            value={priceRange.min}
            onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
          />
          <span className="text-gray-400 font-bold">-</span>
          <Input
            type="number"
            placeholder="Max"
            className="h-11 bg-gray-50 border-2 border-gray-200 hover:border-blue-300 focus:border-blue-500 rounded-xl transition-all text-center font-medium"
            value={priceRange.max}
            onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
          />
        </div>
      </div>

      <Separator />

      {/* Dynamic Categories */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-emerald-100 rounded-lg">
            <Grid3X3 className="h-4 w-4 text-emerald-600" />
          </div>
          <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Categories</h4>
        </div>
        <div className="space-y-1 max-h-[250px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300">
          {categories.map((cat, idx) => (
            <motion.button
              key={cat}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.02 }}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedCategory(cat)}
              className={`block text-sm w-full text-left px-4 py-3 rounded-xl transition-all ${selectedCategory === cat
                ? "bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-700 font-semibold border-l-4 border-emerald-500 shadow-md"
                : "text-gray-600 hover:bg-gray-50 hover:border-l-4 hover:border-gray-200"
                }`}
            >
              {cat === "All" && "🌾 "}{cat}
              {cat === "All" && (
                <Badge className="ml-2 bg-emerald-100 text-emerald-700 text-xs">
                  {categories.length - 1} types
                </Badge>
              )}
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}