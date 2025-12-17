"use client";

import { useMemo } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Fuel, Gauge, Palette, ArrowRight, Ban, Tag, AlertCircle, Users, CheckCircle2, X, Wrench, Sparkles, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

// --- TYPES ---
export interface FleetUnit {
  id: string;
  public_id: string;
  plate_number: string;
  color: string;
  fuel_type: string;
  transmission: string;
  status: 'available' | 'rented' | 'maintenance' | 'cleaning';
  features: string[];
  images: string[];
}

export interface FleetModel {
  id: string;
  make: string;
  model: string;
  year: number;
  image_url: string;
  seats: number; // ADDED: Matches DB Schema from parent fetch
  units: FleetUnit[];
}

interface Props {
  model: FleetModel | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function UnitsModal({ model, isOpen, onClose }: Props) {
  const router = useRouter();

  const formatText = (text: string) => {
    if (!text) return "";
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  };

  const sortedUnits = useMemo(() => {
    if (!model?.units) return [];
    return [...model.units].sort((a, b) => {
      // 1. Available first
      if (a.status === 'available' && b.status !== 'available') return -1;
      if (a.status !== 'available' && b.status === 'available') return 1;
      // 2. Then alphabetical by Color
      return a.color.localeCompare(b.color);
    });
  }, [model]);

  if (!model) return null;

  const handleViewUnit = (unit: FleetUnit) => {
    router.push(`/fleet/${unit.id}`);
  };

  const renderStatusOverlay = (status: string) => {
    switch (status) {
      case 'maintenance':
        return (
          <div className="absolute inset-0 bg-orange-950/80 z-10 flex flex-col items-center justify-center backdrop-blur-sm p-4 text-center">
             <Wrench size={24} className="text-orange-500 mb-2 animate-pulse" />
             <span className="text-xs font-bold text-orange-200 uppercase tracking-wider">Maintenance</span>
             <span className="text-[10px] text-orange-400/70 mt-1">Currently being serviced</span>
          </div>
        );
      case 'cleaning':
        return (
          <div className="absolute inset-0 bg-purple-950/80 z-10 flex flex-col items-center justify-center backdrop-blur-sm p-4 text-center">
             <Sparkles size={24} className="text-purple-400 mb-2 animate-pulse" />
             <span className="text-xs font-bold text-purple-200 uppercase tracking-wider">Cleaning</span>
             <span className="text-[10px] text-purple-400/70 mt-1">Getting ready for you</span>
          </div>
        );
      case 'rented':
        return (
          <div className="absolute inset-0 bg-zinc-950/80 z-10 flex flex-col items-center justify-center backdrop-blur-sm p-4 text-center">
             <Clock size={24} className="text-zinc-500 mb-2" />
             <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">On Trip</span>
             <span className="text-[10px] text-zinc-600 mt-1">Return Pending</span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-zinc-950 border-zinc-800 text-white w-full max-w-3xl p-0 gap-0 overflow-hidden shadow-2xl duration-300 [&>button]:hidden max-h-[85vh] flex flex-col rounded-xl sm:rounded-2xl">
        
        {/* --- STICKY HEADER --- */}
        <div className="relative p-4 sm:p-6 bg-zinc-900 border-b border-zinc-800 shrink-0 z-20 shadow-xl">
          <button 
            onClick={onClose}
            className="absolute top-3 right-3 sm:top-5 sm:right-5 p-2 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-all border border-zinc-700 hover:border-zinc-600 shadow-lg z-50 group"
          >
            <X size={18} className="group-hover:scale-110 transition-transform" />
          </button>

          <div className="flex items-center gap-4 pr-10"> 
            <div className="w-16 h-12 sm:w-20 sm:h-14 rounded-lg overflow-hidden border border-zinc-700 bg-black shadow-lg shrink-0">
              <img 
                src={model.image_url || '/placeholder-car.jpg'} 
                alt={model.model} 
                className="w-full h-full object-cover opacity-90" 
              />
            </div>
            
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="border-zinc-700 text-zinc-400 text-[10px] uppercase tracking-widest px-2 py-0.5">
                  {model.make}
                </Badge>
                <span className="text-zinc-500 text-[10px] font-mono bg-zinc-900 px-1.5 rounded">{model.year}</span>
              </div>
              <DialogTitle className="text-xl sm:text-2xl font-black text-white tracking-tight leading-none">
                {model.model}
              </DialogTitle>
              <p className="text-[10px] sm:text-xs text-green-500 flex items-center gap-1.5 mt-1 font-medium">
                <CheckCircle2 size={12} />
                {sortedUnits.filter(u => u.status === 'available').length} Units Available
              </p>
            </div>
          </div>
        </div>

        {/* --- SCROLLABLE LIST --- */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto custom-scrollbar bg-black/40 flex-1">
          
          {sortedUnits.length === 0 ? (
            <div className="text-center py-16 text-zinc-500 flex flex-col items-center gap-4">
              <AlertCircle size={32} className="opacity-30" />
              <p>No units currently active.</p>
            </div>
          ) : (
            sortedUnits.map((unit) => {
              const isAvailable = unit.status === 'available';
              const unitImage = unit.images?.[0] || model.image_url; 

              return (
                <div 
                  key={unit.id}
                  onClick={() => isAvailable && handleViewUnit(unit)}
                  className={cn(
                    "relative flex flex-col sm:flex-row gap-0 rounded-2xl border transition-all duration-300 group overflow-hidden bg-zinc-900/40",
                    isAvailable 
                      ? "border-zinc-800 hover:border-yellow-500/50 hover:bg-zinc-900 cursor-pointer hover:shadow-lg hover:shadow-yellow-500/5" 
                      : "border-zinc-900 opacity-70 cursor-not-allowed"
                  )}
                >
                  {/* --- LEFT: IMAGE --- */}
                  <div className="w-full sm:w-48 h-40 sm:h-auto relative shrink-0 bg-black">
                    <img 
                      src={unitImage} 
                      className={cn(
                        "w-full h-full object-cover transition-transform duration-700 ease-out opacity-90",
                        isAvailable && "group-hover:scale-105 group-hover:opacity-100"
                      )}
                      alt={unit.plate_number} 
                    />
                    
                    {/* Status Badge */}
                    <div className="absolute top-3 left-3 z-20">
                         {isAvailable ? (
                            <Badge className="text-[10px] font-bold shadow-xl border-0 px-2.5 py-0.5 capitalize bg-green-500 text-black">
                                Available
                            </Badge>
                         ) : (
                             <Badge variant="secondary" className="text-[10px] font-bold bg-zinc-800/80 backdrop-blur-md text-zinc-300 border-zinc-700">
                                {unit.status}
                             </Badge>
                         )}
                    </div>
                    
                    {/* Dark Overlay for Unavailable */}
                    {!isAvailable && renderStatusOverlay(unit.status)}
                  </div>

                  {/* --- RIGHT: DETAILS --- */}
                  <div className="flex-1 p-4 sm:p-5 flex flex-col justify-between">
                    
                    {/* Top Row: Title & ID */}
                    <div className="flex justify-between items-start mb-3">
                        <div>
                            <h4 className={cn("text-lg font-bold capitalize leading-tight", isAvailable ? "text-white group-hover:text-yellow-500 transition-colors" : "text-zinc-500")}>
                                {formatText(unit.color)} Edition
                            </h4>
                            <span className="text-[10px] text-zinc-500 font-mono tracking-wide uppercase mt-1 block">
                                ID: {unit.public_id || "N/A"}
                            </span>
                        </div>
                        {isAvailable && (
                            <ArrowRight className="text-zinc-600 group-hover:text-yellow-500 -translate-x-2 group-hover:translate-x-0 transition-transform duration-300" size={18} />
                        )}
                    </div>

                    {/* Middle: Specs Grid (DB Connected) */}
                    <div className="grid grid-cols-3 gap-2 py-3 border-t border-b border-zinc-800/50 mb-3 bg-zinc-950/30 rounded-lg px-2">
                        <div className="flex flex-col items-center justify-center text-center">
                            <Gauge size={14} className="text-zinc-500 mb-1"/> 
                            <span className="text-[10px] text-zinc-300 font-medium capitalize">{formatText(unit.transmission || "Auto")}</span>
                        </div>
                        <div className="flex flex-col items-center justify-center text-center border-l border-zinc-800/50">
                            <Fuel size={14} className="text-zinc-500 mb-1"/> 
                            <span className="text-[10px] text-zinc-300 font-medium capitalize">{formatText(unit.fuel_type)}</span>
                        </div>
                        <div className="flex flex-col items-center justify-center text-center border-l border-zinc-800/50">
                            <Users size={14} className="text-zinc-500 mb-1"/> 
                            {/* DYNAMIC SEATS FROM MODEL */}
                            <span className="text-[10px] text-zinc-300 font-medium">{model.seats || 5} Seats</span>
                        </div>
                    </div>

                    {/* Bottom: Features */}
                    <div className="flex flex-wrap gap-1.5">
                        {(unit.features || []).slice(0, 3).map((f, i) => (
                            <span key={i} className="px-2 py-0.5 bg-zinc-900 rounded text-[9px] text-zinc-500 border border-zinc-800 whitespace-nowrap capitalize">
                                {formatText(f)}
                            </span>
                        ))}
                         {(unit.features?.length || 0) > 3 && (
                            <span className="text-[9px] text-zinc-600 px-1 pt-1">+{unit.features.length - 3}</span>
                        )}
                    </div>

                  </div>
                </div>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}