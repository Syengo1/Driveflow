"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, MapPin, Users, Briefcase, Trash2, Edit, UserCheck, Star } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import ChauffeurWizard, { ChauffeurUnit } from "@/components/admin/chauffeur/ChauffeurWizard";

export default function ChauffeurPage() {
  const [units, setUnits] = useState<ChauffeurUnit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchUnits = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('chauffeur_fleet')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error("Failed to load fleet");
    } else {
      setUnits(data as any[]);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchUnits();
  }, [fetchUnits]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this vehicle? This cannot be undone.")) return;
    const { error } = await supabase.from('chauffeur_fleet').delete().eq('id', id);
    if (!error) {
      setUnits(prev => prev.filter(u => u.id !== id));
      toast.success("Vehicle removed");
    }
  };

  const filteredUnits = units.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.plate_number.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <UserCheck className="text-purple-500" size={32} /> Chauffeur Fleet
          </h1>
          <p className="text-zinc-400 text-sm mt-1">Manage luxury vehicles and airport transfer units.</p>
        </div>
        <div className="flex gap-3">
           <div className="relative w-64">
             <Search className="absolute left-3 top-3 text-zinc-500" size={18} />
             <Input 
               placeholder="Search fleet..." 
               value={searchQuery}
               onChange={e => setSearchQuery(e.target.value)}
               className="pl-10 bg-zinc-900 border-zinc-800 rounded-xl focus:border-purple-500/50"
             />
           </div>
           <ChauffeurWizard onSave={fetchUnits} />
        </div>
      </div>

      {/* GRID LAYOUT */}
      {isLoading ? (
        <div className="text-center py-20 text-zinc-500">Loading showroom...</div>
      ) : filteredUnits.length === 0 ? (
        <div className="text-center py-20 bg-zinc-900/30 rounded-xl border border-dashed border-zinc-800">
          <p className="text-zinc-500">No chauffeur vehicles found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredUnits.map((unit) => (
            <div key={unit.id} className="glass-panel border border-zinc-800 rounded-xl overflow-hidden group hover:border-zinc-600 transition-all flex flex-col">
              
              {/* Image Area */}
              <div className="h-48 w-full bg-zinc-900 relative overflow-hidden">
                {unit.image_url ? (
                  <img src={unit.image_url} alt={unit.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-600 text-xs uppercase">No Image</div>
                )}
                
                <div className="absolute top-3 right-3 flex gap-2">
                   <Badge className={cn("capitalize shadow-lg", 
                     unit.status === 'available' ? "bg-green-500 text-black" : 
                     unit.status === 'booked' ? "bg-purple-500 text-white" : 
                     "bg-orange-500 text-black"
                   )}>
                     {unit.status}
                   </Badge>
                </div>
                
                <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-black/90 to-transparent">
                   <h3 className="text-xl font-bold text-white truncate">{unit.name}</h3>
                   <p className="text-xs text-zinc-400 font-mono">{unit.plate_number}</p>
                </div>
              </div>

              {/* Specs */}
              <div className="p-4 flex gap-4 text-xs text-zinc-400 border-b border-zinc-800 bg-zinc-900/30">
                 <span className="flex items-center gap-1"><Users size={14} /> {unit.passengers} Pass.</span>
                 <span className="flex items-center gap-1"><Briefcase size={14} /> {unit.luggage_capacity} Bags</span>
                 {unit.features.length > 0 && <span className="flex items-center gap-1 text-purple-400"><Star size={12} fill="currentColor" /> {unit.features.length} Features</span>}
              </div>

              {/* Pricing & Actions */}
              <div className="p-4 flex flex-col gap-3 flex-1 justify-end">
                 <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-zinc-900 rounded p-2 border border-zinc-800">
                       <p className="text-[10px] text-zinc-500 uppercase">Hourly</p>
                       <p className="font-mono font-bold text-white">K{parseInt(unit.rate_hourly).toLocaleString()}</p>
                    </div>
                    <div className="bg-zinc-900 rounded p-2 border border-zinc-800">
                       <p className="text-[10px] text-zinc-500 uppercase">Daily</p>
                       <p className="font-mono font-bold text-white">K{parseInt(unit.rate_daily).toLocaleString()}</p>
                    </div>
                    <div className="bg-zinc-900 rounded p-2 border border-zinc-800">
                       <p className="text-[10px] text-zinc-500 uppercase">Transfer</p>
                       <p className="font-mono font-bold text-white">K{parseInt(unit.rate_airport).toLocaleString()}</p>
                    </div>
                 </div>

                 <div className="flex gap-2 pt-2">
                    <ChauffeurWizard 
                      mode="edit" 
                      defaultData={unit} 
                      onSave={fetchUnits} 
                      trigger={
                        <Button variant="outline" className="flex-1 border-zinc-700 hover:bg-zinc-800 text-zinc-300">
                          <Edit size={14} className="mr-2" /> Edit
                        </Button>
                      }
                    />
                    <Button onClick={() => handleDelete(unit.id!)} variant="outline" className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300">
                       <Trash2 size={14} />
                    </Button>
                 </div>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}