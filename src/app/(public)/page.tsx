"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation"; 
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer"; 
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge"; 
import { 
  ArrowRight, Calendar, MapPin, Star, Shield, 
  Users, Fuel, Search, ChevronLeft, ChevronRight as ChevronIcon, 
  Trophy, Zap, CarFront, Gauge 
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import UnitsModal, { FleetModel as ModalModel } from "@/components/site/fleet/UnitsModal";
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
  seats: number;
  tags: string[];
  units: FleetUnit[];
}

export default function Home() {
  const router = useRouter();
  const [fleetModels, setFleetModels] = useState<FleetModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modal State
  const [selectedModel, setSelectedModel] = useState<ModalModel | null>(null);

  // Carousel State
  const carouselRef = useRef<HTMLDivElement>(null);
  const [carouselCategory, setCarouselCategory] = useState("All");

  // Search Bar State
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchParams, setSearchParams] = useState({
    model: "",
    startDate: "",
    endDate: "",
  });

  // --- 1. DATA FETCHING ---
  const fetchShowcaseFleet = useCallback(async () => {
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
        .order('daily_rate', { ascending: false });

      if (error) throw error;
      // Only show models that actually have available units or at least one unit
      const activeModels = (data as any[]).filter(m => m.units && m.units.length > 0);
      setFleetModels(activeModels);
    } catch (err) {
      console.error("Error loading fleet:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchShowcaseFleet();
  }, [fetchShowcaseFleet]);


  // --- 2. SMART CAROUSEL LOGIC ---
  
  const categories = useMemo(() => {
    const cats = new Set(fleetModels.map(m => m.category));
    return ["All", ...Array.from(cats)];
  }, [fleetModels]);

  const { displayedModels, shouldLoop } = useMemo(() => {
    let filtered = fleetModels;
    if (carouselCategory !== "All") {
        filtered = fleetModels.filter(m => m.category === carouselCategory);
    }

    // SMART LOGIC: Only loop if we have enough items to scroll (e.g., > 3)
    // If we have 1, 2, or 3 items, just show them centered without cloning.
    const enableLoop = filtered.length > 3;

    return {
        displayedModels: enableLoop ? [...filtered, ...filtered, ...filtered] : filtered,
        shouldLoop: enableLoop
    };
  }, [fleetModels, carouselCategory]);

  const scrollCarousel = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      const { clientWidth } = carouselRef.current;
      const scrollAmount = clientWidth * 0.5; 

      if (direction === 'left') {
           carouselRef.current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
      } else {
           carouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      }
    }
  };


  // --- 3. SEARCH LOGIC ---
  const handleSearch = () => {
    if ((searchParams.startDate && !searchParams.endDate) || (!searchParams.startDate && searchParams.endDate)) {
        toast.error("Invalid Dates", { description: "Please select both start and end dates."});
        return;
    }

    const params = new URLSearchParams();
    if (searchParams.model) params.set("search", searchParams.model);
    if (searchParams.startDate) params.set("start", searchParams.startDate);
    if (searchParams.endDate) params.set("end", searchParams.endDate);
    
    router.push(`/fleet?${params.toString()}`);
  };

  const handleOpenModal = (model: FleetModel) => {
    setSelectedModel({
        id: model.id,
        make: model.make,
        model: model.model,
        year: model.year,
        image_url: model.image_url,
        seats: model.seats || 5, 
        units: model.units as any 
    });
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-white font-sans selection:bg-yellow-500/30 transition-colors duration-300">
      <Navbar />

      {/* --- HERO SECTION --- */}
      <section className="relative min-h-[110vh] lg:min-h-screen flex flex-col justify-center items-center pt-32 pb-20 overflow-hidden">
        
        {/* Background */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?q=80&w=3200&auto=format&fit=crop"
            alt="Hero Background" 
            className="w-full h-full object-cover animate-in fade-in zoom-in-105 duration-1000"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/30 to-zinc-50 dark:to-black" />
        </div>
        
        <div className="container mx-auto px-6 relative z-10 text-center">
          
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-yellow-500/50 bg-yellow-500/10 text-yellow-400 backdrop-blur-md text-xs font-bold uppercase tracking-wider mb-8 animate-in fade-in slide-in-from-bottom-4 shadow-[0_0_20px_-5px_rgba(234,179,8,0.5)]">
            <Star size={12} fill="currentColor" />
            #1 Premium Rental in Kenya
          </div>
          
          <h1 className="text-5xl md:text-7xl lg:text-9xl font-black tracking-tighter mb-8 leading-[0.9] text-white animate-in fade-in slide-in-from-bottom-6 duration-700 drop-shadow-2xl">
            Drive the <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-yellow-200 to-yellow-500">Extraordinary.</span>
          </h1>
          
          <p className="text-lg md:text-2xl text-zinc-300 max-w-3xl mx-auto mb-16 animate-in fade-in slide-in-from-bottom-8 duration-1000 font-medium drop-shadow-lg leading-relaxed">
            From rugged Land Cruisers for your safari to sleek Mercedes for business. Experience the finest fleet in East Africa.
          </p>

          {/* --- ULTRA-PREMIUM ADAPTIVE SEARCH BAR --- */}
          <div 
             className={cn(
               "w-full max-w-6xl mx-auto relative z-20 animate-in fade-in zoom-in-95 duration-1000 transition-all duration-500",
               isSearchFocused ? "scale-105" : "scale-100"
             )}
             onFocus={() => setIsSearchFocused(true)}
             onBlur={(e) => {
              const currentTarget = e.currentTarget;
               setTimeout(() => {
                 if (!currentTarget.contains(document.activeElement)) {
                   setIsSearchFocused(false);
                 }
               }, 100);
             }}
          >
             <div className={cn(
                "group p-2 rounded-[2.5rem] flex flex-col md:flex-row gap-2 shadow-2xl transition-all duration-500 ease-out border",
                isSearchFocused 
                  ? "bg-black/80 backdrop-blur-2xl border-yellow-500/50 shadow-[0_0_60px_-10px_rgba(234,179,8,0.25)]" // FROSTED MODE
                  : "bg-white/5 backdrop-blur-[2px] border-white/10 hover:bg-black/40 hover:backdrop-blur-md" // CLEAR GLASS MODE
             )}>
                
                {/* 1. CAR TYPE / MODEL */}
                <div className="flex-[2] bg-transparent hover:bg-white/5 rounded-[2rem] px-8 py-5 transition-colors cursor-pointer group/field relative border border-transparent focus-within:border-white/10 focus-within:bg-white/5">
                   <div className="flex items-center gap-5">
                      <div className={cn("w-12 h-12 rounded-full flex items-center justify-center transition-all", isSearchFocused ? "bg-yellow-500 text-black" : "bg-white/10 text-white group-hover/field:text-yellow-400")}>
                        <Search size={24} />
                      </div>
                      <div className="text-left flex-1">
                         <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Vehicle Preference</label>
                         <input 
                           type="text" 
                           placeholder="e.g. Prado, Vitz, Benz..." 
                           value={searchParams.model}
                           onChange={(e) => setSearchParams({...searchParams, model: e.target.value})}
                           className="bg-transparent text-white font-bold placeholder:text-zinc-500 outline-none w-full text-lg" 
                         />
                      </div>
                   </div>
                </div>

                <div className={cn("w-[1px] my-4 hidden md:block transition-colors", isSearchFocused ? "bg-white/10" : "bg-white/20")} />

                {/* 2. PICKUP DATE */}
                <div className="flex-1 bg-transparent hover:bg-white/5 rounded-[2rem] px-8 py-5 transition-colors cursor-pointer group/field relative border border-transparent focus-within:border-white/10 focus-within:bg-white/5">
                   <div className="flex items-center gap-5">
                      <div className={cn("w-12 h-12 rounded-full flex items-center justify-center transition-all", isSearchFocused ? "bg-yellow-500 text-black" : "bg-white/10 text-white group-hover/field:text-yellow-400")}>
                         <Calendar size={24} />
                      </div>
                      <div className="text-left flex-1">
                         <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Start Trip</label>
                         <input 
                            type="text" 
                            placeholder="Select Date" 
                            onFocus={(e) => e.target.type='date'} 
                            onBlur={(e) => !e.target.value && (e.target.type='text')}
                            onChange={(e) => setSearchParams({...searchParams, startDate: e.target.value})}
                            className="bg-transparent text-white font-bold placeholder:text-zinc-500 outline-none w-full text-base [color-scheme:dark]" 
                         />
                      </div>
                   </div>
                </div>

                <div className={cn("w-[1px] my-4 hidden md:block transition-colors", isSearchFocused ? "bg-white/10" : "bg-white/20")} />

                {/* 3. RETURN DATE */}
                <div className="flex-1 bg-transparent hover:bg-white/5 rounded-[2rem] px-8 py-5 transition-colors cursor-pointer group/field relative border border-transparent focus-within:border-white/10 focus-within:bg-white/5">
                   <div className="flex items-center gap-5">
                      <div className="text-left flex-1">
                         <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">End Trip</label>
                         <input 
                            type="text" 
                            placeholder="Select Date" 
                            onFocus={(e) => e.target.type='date'} 
                            onBlur={(e) => !e.target.value && (e.target.type='text')}
                            onChange={(e) => setSearchParams({...searchParams, endDate: e.target.value})}
                            className="bg-transparent text-white font-bold placeholder:text-zinc-500 outline-none w-full text-base [color-scheme:dark]" 
                         />
                      </div>
                   </div>
                </div>

                {/* 4. BUTTON */}
                <div className="p-1 pl-4">
                   <Button 
                     onClick={handleSearch}
                     className="h-full w-full lg:w-auto rounded-[2rem] px-12 bg-yellow-500 hover:bg-yellow-400 text-black font-black text-xl shadow-[0_0_30px_-5px_rgba(234,179,8,0.5)] transition-all hover:scale-105 active:scale-95 border border-yellow-400"
                   >
                      Search
                   </Button>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* --- THE COLLECTION (Smart Loop Carousel) --- */}
      <section id="fleet" className="py-32 bg-white dark:bg-black relative border-t border-zinc-200 dark:border-zinc-900">
        <div className="container mx-auto px-6">
          
          <div className="flex flex-col lg:flex-row justify-between items-end mb-16 gap-8">
            <div>
              <h2 className="text-5xl md:text-7xl font-black text-zinc-900 dark:text-white mb-4 tracking-tighter">The Collection</h2>
              <p className="text-xl text-zinc-500 dark:text-zinc-400 max-w-xl">Curated for performance and prestige. Select a category to explore.</p>
            </div>
            
            {/* Category Tabs */}
            <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                    <button 
                        key={cat}
                        onClick={() => setCarouselCategory(cat)}
                        className={cn(
                            "px-6 py-3 rounded-full text-sm font-bold border transition-all duration-300",
                            carouselCategory === cat 
                                ? "bg-zinc-900 dark:bg-white text-white dark:text-black border-transparent shadow-lg scale-105" 
                                : "border-zinc-300 dark:border-zinc-800 text-zinc-500 hover:border-zinc-400 dark:hover:border-zinc-700"
                        )}
                    >
                        {cat}
                    </button>
                ))}
            </div>
          </div>

          {/* Carousel */}
          <div className="relative group/carousel">
             {/* Show Arrows ONLY if we are looping (more than 3 items) */}
             {shouldLoop && (
                 <>
                    <div className="absolute top-1/2 -translate-y-1/2 -left-4 z-30 hidden md:block opacity-0 group-hover/carousel:opacity-100 transition-opacity">
                        <Button onClick={() => scrollCarousel('left')} size="icon" variant="outline" className="h-14 w-14 rounded-full bg-white/80 dark:bg-black/80 backdrop-blur-md border-zinc-200 dark:border-zinc-800 shadow-xl hover:bg-white dark:hover:bg-zinc-900">
                            <ChevronLeft size={24} />
                        </Button>
                    </div>
                    <div className="absolute top-1/2 -translate-y-1/2 -right-4 z-30 hidden md:block opacity-0 group-hover/carousel:opacity-100 transition-opacity">
                        <Button onClick={() => scrollCarousel('right')} size="icon" variant="outline" className="h-14 w-14 rounded-full bg-white/80 dark:bg-black/80 backdrop-blur-md border-zinc-200 dark:border-zinc-800 shadow-xl hover:bg-white dark:hover:bg-zinc-900">
                            <ChevronIcon size={24} />
                        </Button>
                    </div>
                 </>
             )}

             {/* The Scroll Container - CENTER if not looping, LEFT if looping */}
             <div 
                ref={carouselRef}
                className={cn(
                    "flex gap-8 overflow-x-auto pb-12 no-scrollbar snap-x snap-mandatory scroll-smooth px-4",
                    !shouldLoop && "md:justify-center"
                )}
             >
                {isLoading ? (
                    // SKELETON
                    [1,2,3].map(i => (
                        <div key={i} className="min-w-[85vw] md:min-w-[450px] h-[550px] bg-zinc-100 dark:bg-zinc-900 rounded-[2.5rem] animate-pulse border border-zinc-200 dark:border-zinc-800" />
                    ))
                ) : displayedModels.length > 0 ? (
                    displayedModels.map((model, idx) => (
                    <div 
                        key={`${model.id}-${idx}`} // Unique key for duplicated items
                        onClick={() => handleOpenModal(model)}
                        className="min-w-[85vw] md:min-w-[420px] lg:min-w-[480px] snap-center group bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] overflow-hidden cursor-pointer hover:border-yellow-500/50 transition-all duration-500 hover:shadow-2xl hover:shadow-yellow-500/5 flex flex-col relative"
                    >
                        {/* Image */}
                        <div className="aspect-[4/3] relative overflow-hidden bg-zinc-200 dark:bg-black">
                        <img 
                            src={model.image_url || '/placeholder-car.jpg'} 
                            alt={model.model} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                        <div className="absolute top-6 left-6">
                            <Badge className="bg-white/90 dark:bg-black/60 backdrop-blur-md text-zinc-900 dark:text-white border-0 shadow-sm uppercase tracking-wider text-[10px] font-bold px-3 py-1.5">
                            {model.category}
                            </Badge>
                        </div>
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors" />
                        </div>

                        {/* Content */}
                        <div className="p-8 flex flex-col flex-1">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider mb-2">{model.make}</p>
                                <h3 className="text-3xl font-bold text-zinc-900 dark:text-white group-hover:text-yellow-600 dark:group-hover:text-yellow-500 transition-colors">
                                    {model.model}
                                </h3>
                            </div>
                            <div className="text-right">
                                <span className="block text-2xl font-black text-zinc-900 dark:text-white">K{model.daily_rate.toLocaleString()}</span>
                                <span className="text-xs text-zinc-500 font-bold uppercase">/ Day</span>
                            </div>
                        </div>

                        {/* Specs */}
                        <div className="flex items-center gap-6 mt-auto pt-6 border-t border-zinc-200 dark:border-zinc-800 text-xs text-zinc-500 font-bold uppercase tracking-wide">
                            <span className="flex items-center gap-2"><Gauge size={16} className="text-zinc-400" /> Auto</span>
                            <span className="flex items-center gap-2"><Fuel size={16} className="text-zinc-400" /> {model.units[0]?.fuel_type || 'Petrol'}</span>
                            <span className="flex items-center gap-2"><Users size={16} className="text-zinc-400" /> {model.seats || 5} Seats</span>
                        </div>
                        </div>
                    </div>
                    ))
                ) : (
                    <div className="w-full py-20 text-center text-zinc-500 bg-zinc-50 dark:bg-zinc-900 rounded-[2.5rem] border border-dashed border-zinc-300 dark:border-zinc-800">
                        <CarFront size={48} className="mx-auto mb-4 opacity-20" />
                        <p>No vehicles found in this category.</p>
                        <Button onClick={() => setCarouselCategory("All")} variant="link" className="text-yellow-500">View All</Button>
                    </div>
                )}
             </div>
          </div>
        </div>
      </section>

      {/* --- WHY US (BENTO GRID) --- */}
      <section className="py-32 bg-zinc-50 dark:bg-black border-t border-zinc-200 dark:border-zinc-900">
        <div className="container mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-black text-zinc-900 dark:text-white mb-4">Why Driveflow?</h2>
            <p className="text-zinc-500 max-w-2xl mx-auto text-lg">Redefining car rental in East Africa with technology and white-glove service.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 grid-rows-2 gap-6 h-auto md:h-[600px]">
            <div className="md:col-span-2 md:row-span-2 relative rounded-[2.5rem] overflow-hidden group border border-zinc-200 dark:border-zinc-800 shadow-2xl">
               <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-black to-black z-10 opacity-80" />
               <img src="https://images.unsplash.com/photo-1485291571150-772bcfc10da5?q=80&w=1000&auto=format&fit=crop" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="Premium" />
               <div className="relative z-20 p-12 h-full flex flex-col justify-end">
                  <div className="w-16 h-16 rounded-2xl bg-yellow-500 flex items-center justify-center text-black mb-8 shadow-lg shadow-yellow-500/20 group-hover:-translate-y-2 transition-transform duration-500">
                    <Zap size={32} strokeWidth={2.5} />
                  </div>
                  <h3 className="text-4xl font-black text-white mb-4 leading-tight">Instant, Paperless <br/>Booking</h3>
                  <p className="text-zinc-400 text-lg max-w-md">Skip the counter. Verify your ID online, sign digitally, and unlock your car. No paperwork, no queues.</p>
               </div>
            </div>
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] p-10 flex flex-col justify-between group hover:border-yellow-500/50 transition-colors shadow-lg">
               <div className="w-14 h-14 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-900 dark:text-white mb-4 group-hover:bg-green-500 group-hover:text-black transition-colors">
                 <Shield size={28} />
               </div>
               <div>
                 <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-3">Comprehensive Insurance</h3>
                 <p className="text-zinc-500">Every trip includes full coverage and 24/7 roadside assistance.</p>
               </div>
            </div>
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] p-10 flex flex-col justify-between group hover:border-yellow-500/50 transition-colors shadow-lg">
               <div className="w-14 h-14 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-900 dark:text-white mb-4 group-hover:bg-purple-500 group-hover:text-white transition-colors">
                 <Users size={28} />
               </div>
               <div>
                 <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-3">Elite Chauffeurs</h3>
                 <p className="text-zinc-500">Professional, vetted drivers for your business meetings or safari.</p>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- PARALLAX CTA --- */}
      <section className="relative py-40 overflow-hidden">
         <div className="absolute inset-0 z-0">
           <img src="https://images.unsplash.com/photo-1502877338535-766e1452684a?q=80&w=3200&auto=format&fit=crop" className="w-full h-full object-cover opacity-40 dark:opacity-30" alt="Drive" />
           <div className="absolute inset-0 bg-gradient-to-t from-zinc-50 via-zinc-50/80 to-transparent dark:from-black dark:via-black/80" />
         </div>

         <div className="container mx-auto px-6 relative z-10 flex flex-col items-center text-center">
           <div className="w-20 h-20 bg-yellow-500 rounded-3xl flex items-center justify-center text-black mb-10 shadow-2xl shadow-yellow-500/40 rotate-3 hover:rotate-0 transition-transform duration-500">
              <Trophy size={40} />
           </div>
           <h2 className="text-6xl md:text-8xl font-black text-zinc-900 dark:text-white mb-8 tracking-tighter">
             Elevate Your Journey.
           </h2>
           <div className="flex gap-6">
             <Link href="/auth/signup">
                 <Button className="h-16 px-12 bg-zinc-900 dark:bg-white text-white dark:text-black font-black rounded-full text-xl shadow-2xl hover:scale-105 transition-transform">
                   Join The Club
                 </Button>
             </Link>
           </div>
         </div>
      </section>

      {/* Units Modal Logic */}
      <UnitsModal 
        model={selectedModel} 
        isOpen={!!selectedModel} 
        onClose={() => setSelectedModel(null)} 
      />

      <Footer />
    </div>
  );
}