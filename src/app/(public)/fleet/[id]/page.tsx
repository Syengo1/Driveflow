"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Gauge, Fuel, Users, Shield, CheckCircle2, 
  Calendar, MapPin, ArrowLeft, Clock, Share2, 
  Zap, Camera, Loader2, AlertCircle, Info
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

// --- TYPES ---
interface UnitDetails {
  id: string;
  public_id: string;
  color: string;
  fuel_type: string;
  transmission: string;
  features: string[];
  images: string[];
  model: {
    make: string;
    model: string;
    year: number;
    category: string;
    daily_rate: number;
    description: string;
    image_url: string;
    seats: number; // Ensure this exists in your DB model
    features?: string[];
  };
}

// --- TIME PICKER COMPONENT ---
const TimePicker = ({ value, onChange }: { value: string, onChange: (val: string) => void }) => (
  <div className="relative">
    <Clock className="absolute left-3 top-3 text-zinc-400" size={16} />
    <select 
      value={value} 
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl py-3 pl-10 text-sm text-zinc-900 dark:text-white focus:ring-2 focus:ring-yellow-500 outline-none appearance-none"
    >
      {Array.from({ length: 24 }).map((_, i) => {
        const hour = i.toString().padStart(2, '0');
        return <option key={i} value={`${hour}:00`}>{hour}:00</option>
      })}
    </select>
  </div>
);

export default function UnitDetailPage() {
  const params = useParams();
  const router = useRouter();
  const unitId = params.id as string;

  const [unit, setUnit] = useState<UnitDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Gallery State
  const [activeImage, setActiveImage] = useState<string | null>(null);
  
  // Booking State
  const [bookingData, setBookingData] = useState({
    startDate: "",
    startTime: "09:00",
    endDate: "",
    endTime: "09:00",
    location: "Westlands Hub"
  });

  // Derived Financial State
  const [totalCost, setTotalCost] = useState(0);
  const [durationDays, setDurationDays] = useState(0);

  // --- 1. FETCH DATA ---
  const fetchUnit = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('fleet_units')
        .select(`
          *,
          model:fleet_models ( * )
        `)
        .eq('id', unitId)
        .single();

      if (error) throw error;

      setUnit(data as any);
      
      // Initialize Image
      if (data.images && data.images.length > 0) {
        setActiveImage(data.images[0]);
      } else if (data.model?.image_url) {
        setActiveImage(data.model.image_url);
      }

    } catch (error) {
      console.error("Error fetching unit:", error);
      toast.error("Vehicle unavailable", { description: "This vehicle may have been removed or booked." });
      router.push('/fleet');
    } finally {
      setIsLoading(false);
    }
  }, [unitId, router]);

  useEffect(() => {
    fetchUnit();
  }, [fetchUnit]);

  // --- 2. DYNAMIC CALCULATIONS ---
  useEffect(() => {
    if (bookingData.startDate && bookingData.endDate && unit) {
      const start = new Date(`${bookingData.startDate}T${bookingData.startTime}`);
      const end = new Date(`${bookingData.endDate}T${bookingData.endTime}`);
      
      // Calculate difference in milliseconds
      const diff = end.getTime() - start.getTime();
      
      // Convert to days (Round up to ensure at least 1 day charge if < 24h but valid)
      // Logic: Rental days are usually 24h blocks. 
      const days = Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
      
      if (diff > 0) {
        setDurationDays(days);
        setTotalCost(days * unit.model.daily_rate);
      } else {
        setDurationDays(0);
        setTotalCost(0);
      }
    }
  }, [bookingData, unit]);

  // --- 3. MERGE FEATURES ---
  const displayFeatures = useMemo(() => {
    if (!unit) return [];
    const combined = [...(unit.model.features || []), ...(unit.features || [])];
    return Array.from(new Set(combined));
  }, [unit]);

  // --- 4. HANDLERS ---
  const handleProceed = async () => {
    // Validation
    if (!bookingData.startDate || !bookingData.endDate) {
      toast.error("Dates Required", { description: "Please select pickup and return dates." });
      return;
    }

    const start = new Date(bookingData.startDate);
    const end = new Date(bookingData.endDate);
    const today = new Date();
    today.setHours(0,0,0,0);

    if (start < today) {
        toast.error("Invalid Date", { description: "Pickup date cannot be in the past." });
        return;
    }

    if (end <= start) {
        toast.error("Invalid Duration", { description: "Return date must be after pickup date." });
        return;
    }

    const queryParams = new URLSearchParams({
      unitId: unitId,
      start: `${bookingData.startDate}T${bookingData.startTime}`,
      end: `${bookingData.endDate}T${bookingData.endTime}`,
      loc: bookingData.location
    }).toString();

    router.push(`/book?${queryParams}`);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link Copied", { description: "Vehicle link copied to clipboard." });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-black flex items-center justify-center">
        <Loader2 className="animate-spin text-yellow-500" size={40} />
      </div>
    );
  }

  if (!unit) return null;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-white font-sans selection:bg-yellow-500/30 transition-colors duration-300">
      <Navbar />

      <div className="pt-24 md:pt-32 pb-32 container mx-auto px-6">
        
        {/* HEADER */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <Link href="/fleet" className="inline-flex items-center gap-2 text-zinc-500 hover:text-yellow-500 transition-colors text-sm font-medium">
                <ArrowLeft size={16} /> Back to Fleet
            </Link>
            <Button variant="ghost" size="sm" onClick={handleShare} className="text-zinc-500 hover:text-white">
                <Share2 size={16} className="mr-2" /> Share
            </Button>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-start gap-4">
             <div>
               <div className="flex items-center gap-3 mb-2">
                 <Badge variant="outline" className="border-yellow-500 text-yellow-500 bg-yellow-500/10 uppercase tracking-wider text-[10px]">{unit.model.category}</Badge>
                 <span className="text-xs text-zinc-500 font-mono flex items-center gap-1">
                    ID: {unit.public_id}
                 </span>
               </div>
               <h1 className="text-4xl md:text-5xl font-black tracking-tight text-zinc-900 dark:text-white">{unit.model.make} {unit.model.model} <span className="text-zinc-400 font-normal text-2xl">{unit.model.year}</span></h1>
               <p className="text-zinc-500 mt-2 max-w-xl">{unit.model.description}</p>
             </div>
             <div className="text-right hidden md:block">
               <div className="text-3xl font-black text-yellow-600 dark:text-yellow-500">KES {unit.model.daily_rate.toLocaleString()}</div>
               <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Per Day</p>
             </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* LEFT COLUMN: VISUALS & SPECS */}
          <div className="lg:col-span-2 space-y-12">
             
             {/* --- IMAGE GALLERY --- */}
             <div className="space-y-4">
                <div className="aspect-video w-full bg-zinc-100 dark:bg-zinc-900 rounded-3xl overflow-hidden relative group border border-zinc-200 dark:border-zinc-800 shadow-2xl">
                    <img 
                        src={activeImage || '/placeholder-car.jpg'} 
                        alt={unit.model.model} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                    />
                    <div className="absolute bottom-4 right-4 bg-black/70 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-2">
                        <Camera size={14} />
                        {unit.images.length + (unit.model.image_url ? 1 : 0)} Photos
                    </div>
                </div>

                {(unit.images.length > 0 || unit.model.image_url) && (
                    <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
                        {unit.model.image_url && (
                            <button 
                                onClick={() => setActiveImage(unit.model.image_url)}
                                className={cn("w-24 h-16 rounded-lg overflow-hidden border-2 shrink-0 transition-all", activeImage === unit.model.image_url ? "border-yellow-500 ring-2 ring-yellow-500/20" : "border-transparent opacity-70 hover:opacity-100")}
                            >
                                <img src={unit.model.image_url} className="w-full h-full object-cover" alt="Default" />
                            </button>
                        )}
                        {unit.images.map((img, idx) => (
                            <button 
                                key={idx}
                                onClick={() => setActiveImage(img)}
                                className={cn("w-24 h-16 rounded-lg overflow-hidden border-2 shrink-0 transition-all", activeImage === img ? "border-yellow-500 ring-2 ring-yellow-500/20" : "border-transparent opacity-70 hover:opacity-100")}
                            >
                                <img src={img} className="w-full h-full object-cover" alt={`View ${idx}`} />
                            </button>
                        ))}
                    </div>
                )}
             </div>

             {/* --- SPECS GRID --- */}
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col items-center text-center gap-2 hover:border-yellow-500/30 transition-colors">
                   <Gauge className="text-zinc-400" />
                   <div><p className="text-xs text-zinc-500 uppercase font-bold">Transmission</p><p className="font-bold">{unit.transmission || "Automatic"}</p></div>
                </div>
                <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col items-center text-center gap-2 hover:border-yellow-500/30 transition-colors">
                   <Fuel className="text-zinc-400" />
                   <div><p className="text-xs text-zinc-500 uppercase font-bold">Fuel Type</p><p className="font-bold capitalize">{unit.fuel_type}</p></div>
                </div>
                <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col items-center text-center gap-2 hover:border-yellow-500/30 transition-colors">
                   <Users className="text-zinc-400" />
                   <div><p className="text-xs text-zinc-500 uppercase font-bold">Capacity</p><p className="font-bold">{unit.model.seats || 5} Seats</p></div>
                </div>
                <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col items-center text-center gap-2 hover:border-green-500/30 transition-colors">
                   <Shield className="text-green-500" />
                   <div><p className="text-xs text-zinc-500 uppercase font-bold">Insurance</p><p className="font-bold text-green-600 dark:text-green-400">Comprehensive</p></div>
                </div>
             </div>

             {/* --- FEATURES LIST --- */}
             <div className="bg-zinc-100 dark:bg-zinc-900/50 rounded-3xl p-8 border border-zinc-200 dark:border-zinc-800">
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                    <Zap className="text-yellow-500" size={20} /> Premium Features
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
                   {displayFeatures.length > 0 ? displayFeatures.map((feature, i) => (
                      <div key={i} className="flex items-center gap-3 text-zinc-700 dark:text-zinc-300">
                         <div className="w-6 h-6 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-600 dark:text-yellow-500 shrink-0">
                            <CheckCircle2 size={14} />
                         </div>
                         <span className="font-medium">{feature}</span>
                      </div>
                   )) : (
                       <p className="text-zinc-500 italic">Standard configuration.</p>
                   )}
                </div>
             </div>

          </div>

          {/* RIGHT COLUMN: BOOKING ACTION (STICKY) */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-2xl shadow-zinc-200/50 dark:shadow-none ring-1 ring-black/5">
              
              <div className="mb-6 pb-6 border-b border-zinc-100 dark:border-zinc-800">
                <p className="text-zinc-500 text-sm font-medium">Daily Rate</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black text-zinc-900 dark:text-white">KES {unit.model.daily_rate.toLocaleString()}</span>
                </div>
                <div className="mt-3 flex gap-2">
                   <Badge className="bg-green-500/10 text-green-600 dark:text-green-400 hover:bg-green-500/20 border-0">Available Now</Badge>
                   <Badge variant="outline" className="text-zinc-500 border-zinc-300 dark:border-zinc-700">Zero Deposit*</Badge>
                </div>
              </div>

              {/* Dynamic Price Summary */}
              {durationDays > 0 && (
                <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex justify-between items-center animate-in fade-in slide-in-from-top-2">
                    <div>
                        <p className="text-xs text-yellow-700 dark:text-yellow-500 font-bold uppercase">Estimated Total</p>
                        <p className="text-xs text-zinc-500">{durationDays} Day(s) Rental</p>
                    </div>
                    <p className="text-xl font-black text-zinc-900 dark:text-white">KES {totalCost.toLocaleString()}</p>
                </div>
              )}

              <div className="space-y-4 mb-6">
                <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2 space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase">Pick-up Date</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-3 text-zinc-400" size={16} />
                            <input 
                                type="date" 
                                className="w-full bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl py-3 pl-10 text-sm text-zinc-900 dark:text-white focus:ring-2 focus:ring-yellow-500 outline-none transition-all [color-scheme:dark]" 
                                onChange={(e) => setBookingData({ ...bookingData, startDate: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase">Time</label>
                        <TimePicker value={bookingData.startTime} onChange={(val) => setBookingData({...bookingData, startTime: val})} />
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2 space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase">Return Date</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-3 text-zinc-400" size={16} />
                            <input 
                                type="date" 
                                className="w-full bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl py-3 pl-10 text-sm text-zinc-900 dark:text-white focus:ring-2 focus:ring-yellow-500 outline-none transition-all [color-scheme:dark]" 
                                onChange={(e) => setBookingData({ ...bookingData, endDate: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase">Time</label>
                        <TimePicker value={bookingData.endTime} onChange={(val) => setBookingData({...bookingData, endTime: val})} />
                    </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Pick-up Location</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 text-zinc-400" size={16} />
                    <select 
                      className="w-full bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl py-3 pl-10 text-sm text-zinc-900 dark:text-white focus:ring-2 focus:ring-yellow-500 outline-none appearance-none"
                      onChange={(e) => setBookingData({ ...bookingData, location: e.target.value })}
                      value={bookingData.location}
                    >
                      <option value="Westlands Hub">Westlands Hub (HQ)</option>
                      <option value="JKIA Airport">JKIA Airport (Terminal 1)</option>
                      <option value="Karen Branch">Karen Branch</option>
                    </select>
                  </div>
                </div>
              </div>

              <Button 
                onClick={handleProceed} 
                className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-black h-14 rounded-xl text-lg shadow-lg shadow-yellow-500/20 transition-transform hover:scale-[1.02]"
              >
                Proceed to Book
              </Button>
              
              <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                  <div className="flex items-start gap-3">
                      <Info size={16} className="text-zinc-400 mt-0.5" />
                      <p className="text-xs text-zinc-500 leading-relaxed">
                          Pickup is free at our hubs. Delivery is calculated at next step. Requirements: Valid ID & Driver's License.
                      </p>
                  </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* --- MOBILE FLOATING ACTION BAR --- */}
      <div className="fixed bottom-0 left-0 w-full bg-zinc-900/90 backdrop-blur-xl border-t border-zinc-800 p-4 lg:hidden z-50">
          <div className="flex items-center justify-between gap-4">
              <div>
                  <p className="text-xs text-zinc-400 uppercase font-bold">Daily Rate</p>
                  <p className="text-xl font-black text-white">KES {unit.model.daily_rate.toLocaleString()}</p>
              </div>
              <Button onClick={handleProceed} className="bg-yellow-500 text-black font-bold h-12 px-8 rounded-xl shadow-lg">
                  Book Now
              </Button>
          </div>
      </div>

      <Footer />
    </div>
  );
}