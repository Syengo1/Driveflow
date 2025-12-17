"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Map, Calendar, Trash2, Edit, Compass, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import SafariWizard, { SafariOffering } from "@/components/admin/safari/SafariWizard";

export default function SafariPage() {
  const [packages, setPackages] = useState<SafariOffering[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchPackages = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('safari_offerings')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error("Failed to load safaris");
    } else {
      setPackages(data as any[]);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchPackages();
  }, [fetchPackages]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this package? This cannot be undone.")) return;
    const { error } = await supabase.from('safari_offerings').delete().eq('id', id);
    if (!error) {
      setPackages(prev => prev.filter(p => p.id !== id));
      toast.success("Package removed");
    }
  };

  const filtered = packages.filter(p => 
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.destinations.some(d => d.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Compass className="text-green-500" size={32} /> Safari Expeditions
          </h1>
          <p className="text-zinc-400 text-sm mt-1">Curate experiences, game drives, and tours.</p>
        </div>
        <div className="flex gap-3">
           <div className="relative w-64">
             <Search className="absolute left-3 top-3 text-zinc-500" size={18} />
             <Input 
               placeholder="Search packages..." 
               value={searchQuery}
               onChange={e => setSearchQuery(e.target.value)}
               className="pl-10 bg-zinc-900 border-zinc-800 rounded-xl focus:border-green-500/50"
             />
           </div>
           <SafariWizard onSave={fetchPackages} />
        </div>
      </div>

      {/* CARD GRID */}
      {isLoading ? (
        <div className="text-center py-20 text-zinc-500">Loading expeditions...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-zinc-900/30 rounded-xl border border-dashed border-zinc-800">
          <p className="text-zinc-500">No safari packages found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map((pkg) => (
            <div key={pkg.id} className="glass-panel border border-zinc-800 rounded-xl overflow-hidden group hover:border-zinc-600 transition-all flex flex-col h-full">
              
              {/* Image & Overlay */}
              <div className="h-56 w-full bg-zinc-900 relative overflow-hidden">
                {pkg.image_url ? (
                  <img src={pkg.image_url} alt={pkg.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-600 text-xs uppercase">No Image</div>
                )}
                
                <div className="absolute top-3 right-3">
                   <Badge className={pkg.status === 'active' ? "bg-green-500 text-black" : "bg-zinc-500 text-white"}>
                     {pkg.status}
                   </Badge>
                </div>

                <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-black via-black/80 to-transparent">
                   <h3 className="text-xl font-bold text-white leading-tight shadow-black drop-shadow-md">{pkg.title}</h3>
                   <div className="flex items-center gap-4 mt-2 text-xs font-medium text-zinc-300">
                      <span className="flex items-center gap-1"><Calendar size={12}/> {pkg.duration_days} Days</span>
                      <span className="flex items-center gap-1"><Map size={12}/> {pkg.destinations.length} Stops</span>
                   </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                 <div>
                    <p className="text-sm text-zinc-400 line-clamp-2 mb-4">{pkg.description || "No description provided."}</p>
                    
                    {/* Destinations Tags */}
                    <div className="flex flex-wrap gap-1.5">
                       {pkg.destinations.slice(0, 3).map(dest => (
                          <span key={dest} className="text-[10px] px-2 py-0.5 rounded border border-zinc-700 text-zinc-300 bg-zinc-900">{dest}</span>
                       ))}
                       {pkg.destinations.length > 3 && <span className="text-[10px] px-2 py-0.5 text-zinc-500">+{pkg.destinations.length - 3}</span>}
                    </div>
                 </div>

                 <div className="pt-4 border-t border-zinc-800 flex items-center justify-between">
                    <div>
                        <p className="text-[10px] text-zinc-500 uppercase font-bold">Price ({pkg.price_model.replace('_', ' ')})</p>
                        <p className="text-lg font-bold text-white">KES {pkg.price.toLocaleString()}</p>
                    </div>
                    <div className="flex gap-2">
                        <SafariWizard 
                          mode="edit" 
                          defaultData={pkg} 
                          onSave={fetchPackages} 
                          trigger={
                            <Button size="icon" variant="ghost" className="hover:bg-zinc-800 text-zinc-400 hover:text-white"><Edit size={16}/></Button>
                          }
                        />
                        <Button size="icon" onClick={() => handleDelete(pkg.id!)} variant="ghost" className="hover:bg-red-500/10 text-zinc-400 hover:text-red-400"><Trash2 size={16}/></Button>
                    </div>
                 </div>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}