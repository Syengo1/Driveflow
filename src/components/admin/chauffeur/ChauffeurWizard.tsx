"use client";

import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserCheck, Upload, X, Loader2, Plus, DollarSign, Users, Briefcase } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// --- TYPES ---
export interface ChauffeurUnit {
  id?: string;
  name: string;
  plate_number: string;
  image_url: string;
  rate_hourly: string;
  rate_daily: string;
  rate_airport: string;
  features: string[];
  passengers: string;
  luggage_capacity: string;
  status: 'available' | 'booked' | 'maintenance';
}

const INITIAL_DATA: ChauffeurUnit = {
  name: "", plate_number: "", image_url: "",
  rate_hourly: "", rate_daily: "", rate_airport: "",
  features: ["Wifi", "Water"], passengers: "4", luggage_capacity: "3",
  status: "available"
};

interface Props {
  mode?: "create" | "edit";
  defaultData?: ChauffeurUnit;
  trigger?: React.ReactNode;
  onSave: () => void;
}

export default function ChauffeurWizard({ mode = "create", defaultData, trigger, onSave }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<ChauffeurUnit>(INITIAL_DATA);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [newFeature, setNewFeature] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- INIT ---
  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" && defaultData) {
        setFormData(defaultData);
        setImagePreview(defaultData.image_url);
      } else {
        setFormData(INITIAL_DATA);
        setImagePreview(null);
      }
      setImageFile(null);
    }
  }, [isOpen, mode, defaultData]);

  // --- HANDLERS ---
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const addFeature = () => {
    if (newFeature.trim()) {
      setFormData(prev => ({ ...prev, features: [...prev.features, newFeature.trim()] }));
      setNewFeature("");
    }
  };

  const removeFeature = (index: number) => {
    setFormData(prev => ({ ...prev, features: prev.features.filter((_, i) => i !== index) }));
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.plate_number) {
      toast.error("Missing Details", { description: "Vehicle name and plate are required." });
      return;
    }

    setIsLoading(true);
    try {
      let finalImageUrl = formData.image_url;

      // 1. Upload Image if changed
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `chauffeur/${formData.plate_number}_${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('fleet-media') // Ensure this bucket exists and is public
          .upload(fileName, imageFile);

        if (uploadError) throw uploadError;

        const { data: publicData } = supabase.storage.from('fleet-media').getPublicUrl(fileName);
        finalImageUrl = publicData.publicUrl;
      }

      // 2. Prepare Payload
      const payload = {
        name: formData.name,
        plate_number: formData.plate_number,
        image_url: finalImageUrl,
        rate_hourly: parseFloat(formData.rate_hourly) || 0,
        rate_daily: parseFloat(formData.rate_daily) || 0,
        rate_airport: parseFloat(formData.rate_airport) || 0,
        features: formData.features,
        passengers: parseInt(formData.passengers),
        luggage_capacity: parseInt(formData.luggage_capacity),
        status: formData.status
      };

      // 3. Insert/Update
      if (mode === "create") {
        const { error } = await supabase.from('chauffeur_fleet').insert(payload);
        if (error) throw error;
        toast.success("Vehicle Added", { description: `${formData.name} is now available.` });
      } else {
        const { error } = await supabase.from('chauffeur_fleet').update(payload).eq('id', defaultData?.id);
        if (error) throw error;
        toast.success("Vehicle Updated");
      }

      onSave();
      setIsOpen(false);

    } catch (err: any) {
      console.error(err);
      toast.error("Operation Failed", { description: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger ? trigger : <Button className="bg-yellow-500 text-black hover:bg-yellow-400 font-bold"><Plus size={18} className="mr-2"/> Add Chauffeur Unit</Button>}
      </DialogTrigger>
      <DialogContent className="glass-panel border-zinc-800 text-white max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar p-0 gap-0">
        
        <DialogHeader className="p-6 border-b border-zinc-800 bg-zinc-900 sticky top-0 z-10">
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center border border-purple-500/20">
              <UserCheck size={20} />
            </div>
            <div>
              <h2>{mode === "create" ? "Add Luxury Vehicle" : `Edit ${formData.name}`}</h2>
              <p className="text-xs text-zinc-400 font-normal mt-1">Chauffeur & Transfer Fleet Management</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="p-6 space-y-6 bg-zinc-950/50">
          
          {/* Section 1: Basic Info & Image */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
               <div className="space-y-2">
                 <Label className="text-zinc-400">Vehicle Name</Label>
                 <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Mercedes S-Class" className="bg-black border-zinc-800"/>
               </div>
               <div className="space-y-2">
                 <Label className="text-zinc-400">Plate Number</Label>
                 <Input value={formData.plate_number} onChange={e => setFormData({...formData, plate_number: e.target.value.toUpperCase()})} placeholder="KDB 123A" className="bg-black border-zinc-800 font-mono"/>
               </div>
               <div className="grid grid-cols-2 gap-3">
                 <div className="space-y-2">
                    <Label className="text-zinc-400">Passengers</Label>
                    <div className="relative"><Users size={14} className="absolute left-3 top-3 text-zinc-500"/><Input type="number" value={formData.passengers} onChange={e => setFormData({...formData, passengers: e.target.value})} className="pl-9 bg-black border-zinc-800"/></div>
                 </div>
                 <div className="space-y-2">
                    <Label className="text-zinc-400">Luggage</Label>
                    <div className="relative"><Briefcase size={14} className="absolute left-3 top-3 text-zinc-500"/><Input type="number" value={formData.luggage_capacity} onChange={e => setFormData({...formData, luggage_capacity: e.target.value})} className="pl-9 bg-black border-zinc-800"/></div>
                 </div>
               </div>
            </div>

            {/* Image Dropzone */}
            <div onClick={() => fileInputRef.current?.click()} className={cn("border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all group relative overflow-hidden h-full min-h-[200px]", imagePreview ? "border-purple-500/30" : "border-zinc-800 hover:border-zinc-600")}>
               <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageSelect} />
               {imagePreview ? (
                 <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
               ) : (
                 <div className="text-center text-zinc-500">
                   <Upload className="mx-auto mb-2 group-hover:text-purple-500 transition-colors" />
                   <p className="text-xs font-medium">Upload Vehicle Photo</p>
                 </div>
               )}
               {imagePreview && <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition-opacity">Change Photo</div>}
            </div>
          </div>

          {/* Section 2: Pricing */}
          <div className="space-y-3">
            <Label className="text-zinc-400 text-xs uppercase font-bold tracking-wider">Pricing Structures (KES)</Label>
            <div className="grid grid-cols-3 gap-4">
               <div className="space-y-1">
                 <span className="text-[10px] text-zinc-500">Per Hour</span>
                 <div className="relative"><DollarSign size={12} className="absolute left-3 top-3 text-zinc-500"/><Input type="number" value={formData.rate_hourly} onChange={e => setFormData({...formData, rate_hourly: e.target.value})} placeholder="5000" className="pl-8 bg-black border-zinc-800"/></div>
               </div>
               <div className="space-y-1">
                 <span className="text-[10px] text-zinc-500">Per Day</span>
                 <div className="relative"><DollarSign size={12} className="absolute left-3 top-3 text-zinc-500"/><Input type="number" value={formData.rate_daily} onChange={e => setFormData({...formData, rate_daily: e.target.value})} placeholder="40000" className="pl-8 bg-black border-zinc-800"/></div>
               </div>
               <div className="space-y-1">
                 <span className="text-[10px] text-zinc-500">Airport Transfer</span>
                 <div className="relative"><DollarSign size={12} className="absolute left-3 top-3 text-zinc-500"/><Input type="number" value={formData.rate_airport} onChange={e => setFormData({...formData, rate_airport: e.target.value})} placeholder="8000" className="pl-8 bg-black border-zinc-800"/></div>
               </div>
            </div>
          </div>

          {/* Section 3: Features */}
          <div className="space-y-3">
             <Label className="text-zinc-400">Amenities & Features</Label>
             <div className="flex gap-2">
                <Input value={newFeature} onChange={e => setNewFeature(e.target.value)} onKeyDown={e => e.key === 'Enter' && addFeature()} placeholder="Add feature (e.g. Champagne)..." className="bg-black border-zinc-800"/>
                <Button onClick={addFeature} variant="secondary"><Plus size={18}/></Button>
             </div>
             <div className="flex flex-wrap gap-2">
                {formData.features.map((f, i) => (
                  <div key={i} className="bg-purple-500/10 text-purple-400 border border-purple-500/20 px-3 py-1 rounded-full text-xs flex items-center gap-2">
                    {f} <button onClick={() => removeFeature(i)} className="hover:text-white"><X size={12}/></button>
                  </div>
                ))}
             </div>
          </div>

          {/* Section 4: Status */}
          <div className="space-y-2">
             <Label className="text-zinc-400">Current Status</Label>
             <Select value={formData.status} onValueChange={(v: any) => setFormData({...formData, status: v})}>
               <SelectTrigger className="bg-black border-zinc-800"><SelectValue /></SelectTrigger>
               <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                 <SelectItem value="available">Available for Booking</SelectItem>
                 <SelectItem value="booked">Currently Booked</SelectItem>
                 <SelectItem value="maintenance">Maintenance / Offline</SelectItem>
               </SelectContent>
             </Select>
          </div>

        </div>

        <div className="p-6 border-t border-zinc-800 bg-zinc-900 flex justify-end gap-3">
           <Button variant="ghost" onClick={() => setIsOpen(false)} className="text-zinc-400 hover:text-white">Cancel</Button>
           <Button onClick={handleSubmit} disabled={isLoading} className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-8">
             {isLoading ? <Loader2 className="animate-spin" /> : (mode === 'create' ? "Add Vehicle" : "Save Changes")}
           </Button>
        </div>

      </DialogContent>
    </Dialog>
  );
}