"use client";

import { useState, useMemo, useEffect } from "react";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import UnitsModal, { FleetModel as ModalModel } from "@/components/site/fleet/UnitsModal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from  "@/components/ui/skeleton";
import { Users, Fuel, Gauge, Search, ArrowLeft, X, CarFront, Compass, Briefcase, Zap } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

// --- TYPES ---
interface FleetUnit {
  id: string;
  public_id: string;
  status: 'available' | 'rented' | 'maintenance' | 'cleaning';
  fuel_type: string;
  transmission: string;
  features: string[];
  images: string[];
  plate_number: string;
  color: string;
}

interface FleetModel {
  id: string;
  make: string;
  model: string;
  year: number;
  category: string;
  daily_rate: number;
  description: string;
  image_url: string;
  seats: number; // ADDED
  tags: string[]; // ADDED (e.g. "Safari Ready")
  units: FleetUnit[];
}

export default function FleetPage() {
  const [fleetModels, setFleetModels] = useState<FleetModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedModel, setSelectedModel] = useState<ModalModel | null>(null);
  
  // --- FILTER STATE ---
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeTag, setActiveTag] = useState("All");

  // --- 1. DATA FETCHING ---
  useEffect(() => {
    async function fetchFleet() {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('fleet_models')
          .select(`
            *,
            units:fleet_units ( 
              id, public_id, status, fuel_type, transmission, features, images, plate_number, color 
            )
          `)
          .order('daily_rate', { ascending: true });

        if (error) throw error;

        // Filter out empty models
        const activeModels = (data as any[]).filter(m => m.units && m.units.length > 0);
        setFleetModels(activeModels);
        
      } catch (err: any) {
        console.error("Error loading fleet:", err);
        toast.error("Could not load vehicle fleet.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchFleet();
  }, []);

  // --- 2. DYNAMIC METADATA EXTRACTION ---
  
  // Extract Categories
  const categories = useMemo(() => {
    const cats = new Set(fleetModels.map(c => c.category).filter(Boolean));
    return ["All", ...Array.from(cats)];
  }, [fleetModels]);
  
  // Extract Unique Tags (e.g. "Safari Ready", "Wedding")
  const uniqueTags = useMemo(() => {
    const tags = new Set<string>();
    fleetModels.forEach(model => {
      model.tags?.forEach(t => tags.add(t));
    });
    return ["All", ...Array.from(tags)];
  }, [fleetModels]);

  // --- 3. FILTERING LOGIC ---
  const filteredFleet = useMemo(() => {
    return fleetModels.filter(model => {
      // Search Match
      const searchLower = searchQuery.toLowerCase();
      const matchSearch = 
        model.model.toLowerCase().includes(searchLower) || 
        model.make.toLowerCase().includes(searchLower);

      // Category Match
      const matchCategory = activeCategory === "All" || model.category === activeCategory;

      // Tag Match (Check model tags OR unit features)
      const matchTag = activeTag === "All" || 
                       model.tags?.includes(activeTag) ||
                       model.units.some(unit => unit.features?.includes(activeTag));

      return matchSearch && matchCategory && matchTag;
    });
  }, [searchQuery, activeCategory, activeTag, fleetModels]);

  const clearFilters = () => {
    setSearchQuery("");
    setActiveCategory("All");
    setActiveTag("All");
  };

  const handleOpenModal = (model: FleetModel) => {
    setSelectedModel({
        id: model.id,
        make: model.make,
        model: model.model,
        year: model.year,
        seats: model.seats || 5,
        image_url: model.image_url,
        units: model.units as any 
    });
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-white font-sans selection:bg-yellow-500/30 transition-colors duration-300">
      <Navbar />
      
      <div className="pt-32 pb-20 container mx-auto px-6">
        
        {/* --- HEADER --- */}
        <div className="mb-12">
          <Link href="/" className="inline-flex items-center gap-2 text-zinc-500 hover:text-yellow-500 transition-colors mb-6 text-sm font-bold group">
            <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-900 flex items-center justify-center group-hover:bg-yellow-500 group-hover:text-black transition-all">
              <ArrowLeft size={16} />
            </div>
            Back Home
          </Link>

          <div className="flex flex-col md:flex-row justify-between items-end gap-6">
            <div>
              <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-4">
                The <span className="text-yellow-500">Driveflow</span> Collection
              </h1>
              <p className="text-zinc-500 dark:text-zinc-400 max-w-2xl">
                Curated for comfort, performance, and style. Filter by category or use case to find your perfect match.
              </p>
            </div>
          </div>
        </div>

        {/* --- PREMIUM FILTER BAR --- */}
        <div className="sticky top-24 z-40 mb-12 -mx-6 px-6 py-4 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-y border-zinc-200 dark:border-zinc-900 transition-all shadow-sm">
          <div className="flex flex-col xl:flex-row gap-6 items-start xl:items-center justify-between">
            
            {/* Search & Categories */}
            <div className="flex flex-col md:flex-row gap-4 w-full xl:w-auto">
              <div className="relative w-full md:w-72 group">
                <Search className="absolute left-3 top-2.5 text-zinc-400 group-focus-within:text-yellow-500 transition-colors" size={18} />
                <input 
                  type="text" 
                  placeholder="Search model..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-10 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-transparent focus:border-yellow-500 focus:bg-white dark:focus:bg-black outline-none transition-all text-sm font-medium"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")} className="absolute right-3 top-2.5 text-zinc-500 hover:text-red-500">
                    <X size={14} />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={cn(
                      "px-4 py-2 rounded-full text-xs font-bold border transition-all whitespace-nowrap",
                      activeCategory === cat
                        ? "bg-zinc-900 dark:bg-white text-white dark:text-black border-transparent shadow-lg"
                        : "bg-transparent border-zinc-300 dark:border-zinc-800 text-zinc-500 hover:border-zinc-400 dark:hover:border-zinc-600"
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Smart Tags (Use Cases) */}
            <div className="flex items-center gap-3 w-full xl:w-auto overflow-x-auto pb-2 xl:pb-0 border-t xl:border-t-0 border-zinc-100 dark:border-zinc-900 pt-3 xl:pt-0">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider whitespace-nowrap flex items-center gap-1">
                <Compass size={12} /> Perfect For:
              </span>
              {uniqueTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => setActiveTag(activeTag === tag ? "All" : tag)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all whitespace-nowrap border",
                    activeTag === tag
                      ? "bg-yellow-500/10 text-yellow-600 dark:text-yellow-500 border-yellow-500/50"
                      : "bg-zinc-100 dark:bg-zinc-900 text-zinc-500 border-transparent hover:bg-zinc-200 dark:hover:bg-zinc-800"
                  )}
                >
                  {tag === "All" ? "Any" : tag}
                </button>
              ))}
            </div>

          </div>
        </div>

        {/* --- GRID --- */}
        {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
               {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="rounded-3xl border border-zinc-200 dark:border-zinc-800 overflow-hidden h-[400px] bg-zinc-100 dark:bg-zinc-900/50">
                     <Skeleton className="h-48 w-full bg-zinc-200 dark:bg-zinc-800" />
                     <div className="p-6 space-y-4">
                        <Skeleton className="h-6 w-3/4 bg-zinc-200 dark:bg-zinc-800" />
                        <Skeleton className="h-4 w-1/2 bg-zinc-200 dark:bg-zinc-800" />
                        <Skeleton className="h-10 w-full mt-6 bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
                     </div>
                  </div>
               ))}
            </div>
        ) : filteredFleet.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
            {filteredFleet.map((model) => {
              const availableUnits = model.units.filter(u => u.status === 'available').length;
              const firstUnit = model.units[0]; // Used for preview specs (Fuel/Trans)

              return (
                <div key={model.id} className="group bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden hover:shadow-2xl hover:shadow-yellow-500/5 transition-all duration-500 flex flex-col">
                  
                  {/* Image Area */}
                  <div className="aspect-[16/10] relative overflow-hidden bg-zinc-100 dark:bg-black">
                    {model.image_url ? (
                        <img 
                        src={model.image_url} 
                        alt={model.model} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-500">No Image Available</div>
                    )}
                    
                    {/* Floating Badges */}
                    <div className="absolute top-4 right-4 flex gap-2">
                       <Badge className="bg-black/60 backdrop-blur-md text-white border-0">{model.category}</Badge>
                       {/* Display Tag if exists */}
                       {model.tags?.[0] && (
                           <Badge className="bg-yellow-500 text-black border-0 font-bold">{model.tags[0]}</Badge>
                       )}
                    </div>
                  </div>

                  {/* Content Area */}
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider">{model.make}</p>
                        <h3 className="text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                            {model.model}
                            <span className="text-sm font-normal text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md">{model.year}</span>
                        </h3>
                      </div>
                      <div className="text-right">
                        <span className="block text-lg font-black text-yellow-600 dark:text-yellow-500">KES {model.daily_rate.toLocaleString()}</span>
                        <span className="text-xs text-zinc-500">/day</span>
                      </div>
                    </div>

                    {/* Metadata Grid */}
                    <div className="flex items-center gap-4 mb-6 text-xs text-zinc-500 font-medium border-y border-zinc-100 dark:border-zinc-800 py-3 mt-4">
                      {/* Use Model's Seats if defined, otherwise 5 */}
                      <span className="flex items-center gap-1"><Users size={14} /> {model.seats || 5} Seats</span>
                      
                      {/* Pull Specs from first unit found */}
                      <span className="flex items-center gap-1"><Gauge size={14} /> {firstUnit?.transmission || 'Auto'}</span>
                      <span className="flex items-center gap-1"><Fuel size={14} /> {firstUnit?.fuel_type || 'Petrol'}</span>
                    </div>

                    <div className="mt-auto">
                      <Button 
                        onClick={() => handleOpenModal(model)}
                        className={cn(
                            "w-full h-12 rounded-xl font-bold text-base shadow-lg group-hover:scale-[1.02] transition-transform flex justify-between px-6",
                            availableUnits > 0 
                                ? "bg-zinc-900 dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200" 
                                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed"
                        )}
                        disabled={availableUnits === 0}
                      >
                        <span>{availableUnits > 0 ? "Check Availability" : "Fully Booked"}</span>
                        {availableUnits > 0 && <span className="text-xs bg-black/10 dark:bg-black/10 px-2 py-1 rounded">{availableUnits} Units</span>}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* --- EMPTY STATE --- */
          <div className="flex flex-col items-center justify-center py-20 text-center animate-in zoom-in-95">
            <div className="w-20 h-20 bg-zinc-100 dark:bg-zinc-900 rounded-full flex items-center justify-center text-zinc-400 mb-6">
              <CarFront size={40} />
            </div>
            <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">No vehicles found</h3>
            <p className="text-zinc-500 max-w-md mx-auto mb-8">
              We couldn't find any cars matching "<strong>{searchQuery}</strong>" with the selected filters.
            </p>
            <Button onClick={clearFilters} variant="outline" className="border-zinc-300 dark:border-zinc-700">
              Clear All Filters
            </Button>
          </div>
        )}
      </div>

      <UnitsModal 
        model={selectedModel} 
        isOpen={!!selectedModel} 
        onClose={() => setSelectedModel(null)} 
      />

      <Footer />
    </div>
  );
}