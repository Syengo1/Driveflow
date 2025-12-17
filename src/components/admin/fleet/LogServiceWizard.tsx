"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Wrench, Calendar, Gauge, DollarSign, Loader2, Clock, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

interface Props {
  unitId: string; // ADDED: Required to link log to specific car
  currentMileage: number;
  onSave: () => void; // CHANGED: Parent just needs to know we finished
  trigger: React.ReactNode;
}

export default function LogServiceWizard({ unitId, currentMileage, onSave, trigger }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Calculate default next date (6 months from now)
  const defaultNextDate = new Date();
  defaultNextDate.setMonth(defaultNextDate.getMonth() + 6);

  const [formData, setFormData] = useState({
    // Current Service Details
    date: new Date().toISOString().split('T')[0],
    mileage: currentMileage.toString(),
    cost: "",
    type: "Routine Service",
    notes: "",
    
    // Next Service Parameters
    nextIntervalKm: "5000", 
    nextIntervalTime: defaultNextDate.toISOString().split('T')[0], 
  });

  const handleSubmit = async () => {
    // 1. Basic Validation
    if (!formData.cost || !formData.mileage) {
        toast.error("Missing Data", { description: "Please enter valid mileage and cost." });
        return;
    }

    setIsLoading(true);

    try {
        // 2. Insert into maintenance_logs
        const { error: logError } = await supabase
            .from('maintenance_logs')
            .insert({
                unit_id: unitId,
                service_date: formData.date,
                service_type: formData.type,
                mileage_at_service: parseInt(formData.mileage) || 0,
                cost: parseFloat(formData.cost) || 0,
                notes: formData.notes
            });

        if (logError) throw logError;

        // 3. Update the Vehicle Health Logic (fleet_units)
        // We update the 'last_service_mileage' and 'next_service_date' 
        // so the system knows when to alert us next.
        const { error: unitError } = await supabase
            .from('fleet_units')
            .update({
                current_mileage: parseInt(formData.mileage) || 0, // Update current mileage in case it changed
                last_service_mileage: parseInt(formData.mileage) || 0,
                service_interval_km: parseInt(formData.nextIntervalKm) || 0,
                next_service_date: formData.nextIntervalTime
            })
            .eq('id', unitId);

        if (unitError) throw unitError;

        // 4. Success State
        toast.success("Service Logged", { description: "Vehicle schedule has been updated." });
        onSave(); // Refresh parent data
        setIsOpen(false);

    } catch (error: any) {
        console.error("Service Log Error:", error);
        toast.error("Failed to Log Service", { description: error.message });
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="glass-panel border-zinc-800 text-white max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-500 flex items-center justify-center border border-orange-500/30">
              <Wrench size={20} />
            </div>
            <div>
              <span>Log Maintenance</span>
              <p className="text-xs text-zinc-400 font-normal mt-1">Record service & set next schedule</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-2">
          
          {/* SECTION 1: WHAT HAPPENED TODAY */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-zinc-400 text-xs uppercase">Service Date</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-2.5 text-zinc-500" size={14} />
                  <Input 
                    type="date" 
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    className="pl-9 bg-zinc-950/50 border-zinc-800 [color-scheme:dark]" 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-400 text-xs uppercase">Mileage Now (km)</Label>
                <div className="relative">
                  <Gauge className="absolute left-3 top-2.5 text-zinc-500" size={14} />
                  <Input 
                    type="number" 
                    value={formData.mileage}
                    onChange={(e) => setFormData({...formData, mileage: e.target.value})}
                    className="pl-9 bg-zinc-950/50 border-zinc-800 font-mono font-bold" 
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label className="text-zinc-400 text-xs uppercase">Type</Label>
                    <select 
                        className="w-full h-10 bg-zinc-950/50 border border-zinc-800 rounded-md px-3 text-sm text-white focus:border-yellow-500 outline-none"
                        value={formData.type}
                        onChange={(e) => setFormData({...formData, type: e.target.value})}
                    >
                        <option>Routine Service</option>
                        <option>Major Repair</option>
                        <option>Tyre Change</option>
                        <option>Inspection</option>
                        <option>Body Work</option>
                    </select>
                </div>
                <div className="space-y-2">
                    <Label className="text-zinc-400 text-xs uppercase">Total Cost (KES)</Label>
                    <div className="relative">
                    <DollarSign className="absolute left-3 top-2.5 text-zinc-500" size={14} />
                    <Input 
                        type="number" 
                        placeholder="0.00"
                        value={formData.cost}
                        onChange={(e) => setFormData({...formData, cost: e.target.value})}
                        className="pl-9 bg-zinc-950/50 border-zinc-800" 
                    />
                    </div>
                </div>
            </div>
            
            <div className="space-y-2">
                <Label className="text-zinc-400 text-xs uppercase">Technician Notes</Label>
                <textarea 
                className="w-full bg-zinc-950/50 border border-zinc-800 rounded-md p-3 text-sm text-white min-h-[60px] focus:border-yellow-500 outline-none"
                placeholder="Details of work done..."
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                />
            </div>
          </div>

          {/* SECTION 2: NEXT SCHEDULE */}
          <div className="bg-zinc-900/80 rounded-xl p-4 border border-zinc-800">
            <div className="flex items-center gap-2 mb-4 text-yellow-500">
                <Clock size={16} />
                <span className="text-sm font-bold uppercase tracking-wider">Next Service Due</span>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label className="text-zinc-500 text-[10px] uppercase">After Distance (+km)</Label>
                    <div className="relative">
                        <ArrowRight className="absolute left-3 top-2.5 text-zinc-600" size={14} />
                        <Input 
                            type="number" 
                            value={formData.nextIntervalKm}
                            onChange={(e) => setFormData({...formData, nextIntervalKm: e.target.value})}
                            className="pl-9 bg-black border-zinc-700 text-yellow-500 font-mono font-bold" 
                        />
                    </div>
                    <p className="text-[10px] text-zinc-500">Target: {((parseInt(formData.mileage) || 0) + (parseInt(formData.nextIntervalKm) || 0)).toLocaleString()} km</p>
                </div>

                <div className="space-y-2">
                    <Label className="text-zinc-500 text-[10px] uppercase">Or By Date (Time Limit)</Label>
                    <div className="relative">
                        <Calendar className="absolute left-3 top-2.5 text-zinc-600" size={14} />
                        <Input 
                            type="date" 
                            value={formData.nextIntervalTime}
                            onChange={(e) => setFormData({...formData, nextIntervalTime: e.target.value})}
                            className="pl-9 bg-black border-zinc-700 text-yellow-500 font-bold [color-scheme:dark]" 
                        />
                    </div>
                </div>
            </div>
          </div>

          <Button 
            onClick={handleSubmit} 
            disabled={isLoading}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold h-11"
          >
            {isLoading ? <Loader2 className="animate-spin" size={18} /> : "Confirm Service & Update Schedule"}
          </Button>

        </div>
      </DialogContent>
    </Dialog>
  );
}