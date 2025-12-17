"use client";

import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Compass, Upload, X, Loader2, Plus, MapPin, CheckCircle2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// --- TYPES ---
export interface SafariOffering {
  id?: string;
  title: string;
  description: string;
  image_url: string;
  duration_days: string;
  price: string;
  price_model: string;
  destinations: string[];
  inclusions: string[];
  status: 'active' | 'draft' | 'archived';
}

const INITIAL_DATA: SafariOffering = {
  title: "", description: "", image_url: "",
  duration_days: "3", price: "", price_model: "per_person",
  destinations: [], inclusions: ["Game Drives", "Transport", "Guide"],
  status: "active"
};

interface Props {
  mode?: "create" | "edit";
  defaultData?: SafariOffering;
  trigger?: React.ReactNode;
  onSave: () => void;
}

export default function SafariWizard({ mode = "create", defaultData, trigger, onSave }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<SafariOffering>(INITIAL_DATA);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  // Tag Inputs
  const [newDest, setNewDest] = useState("");
  const [newInc, setNewInc] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const addTag = (type: 'dest' | 'inc') => {
    if (type === 'dest' && newDest.trim()) {
      setFormData(prev => ({ ...prev, destinations: [...prev.destinations, newDest.trim()] }));
      setNewDest("");
    }
    if (type === 'inc' && newInc.trim()) {
      setFormData(prev => ({ ...prev, inclusions: [...prev.inclusions, newInc.trim()] }));
      setNewInc("");
    }
  };

  const removeTag = (type: 'dest' | 'inc', index: number) => {
    if (type === 'dest') {
        setFormData(prev => ({ ...prev, destinations: prev.destinations.filter((_, i) => i !== index) }));
    } else {
        setFormData(prev => ({ ...prev, inclusions: prev.inclusions.filter((_, i) => i !== index) }));
    }
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.price) {
      toast.error("Missing Details", { description: "Title and Price are required." });
      return;
    }

    setIsLoading(true);
    try {
      let finalImageUrl = formData.image_url;

      // 1. Upload Image
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `safari/${Date.now()}_${Math.random()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('fleet-media').upload(fileName, imageFile);
        if (uploadError) throw uploadError;
        const { data: publicData } = supabase.storage.from('fleet-media').getPublicUrl(fileName);
        finalImageUrl = publicData.publicUrl;
      }

      // 2. Payload
      const payload = {
        title: formData.title,
        description: formData.description,
        image_url: finalImageUrl,
        duration_days: parseInt(formData.duration_days) || 1,
        price: parseFloat(formData.price) || 0,
        price_model: formData.price_model,
        destinations: formData.destinations,
        inclusions: formData.inclusions,
        status: formData.status
      };

      // 3. Database Action
      if (mode === "create") {
        const { error } = await supabase.from('safari_offerings').insert(payload);
        if (error) throw error;
        toast.success("Safari Package Created");
      } else {
        const { error } = await supabase.from('safari_offerings').update(payload).eq('id', defaultData?.id);
        if (error) throw error;
        toast.success("Package Updated");
      }

      onSave();
      setIsOpen(false);

    } catch (err: any) {
      console.error(err);
      toast.error("Error", { description: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger ? trigger : <Button className="bg-yellow-500 text-black hover:bg-yellow-400 font-bold"><Plus size={18} className="mr-2"/> Create Package</Button>}
      </DialogTrigger>
      <DialogContent className="glass-panel border-zinc-800 text-white max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar p-0 gap-0">
        
        <DialogHeader className="p-6 border-b border-zinc-800 bg-zinc-900 sticky top-0 z-10">
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="w-10 h-10 rounded-xl bg-green-500/10 text-green-500 flex items-center justify-center border border-green-500/20">
              <Compass size={20} />
            </div>
            <div>
              <h2>{mode === "create" ? "Create Safari Package" : "Edit Package"}</h2>
              <p className="text-xs text-zinc-400 font-normal mt-1">Expeditions & Tour Management</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="p-6 space-y-6 bg-zinc-950/50">
          
          {/* Section 1: Essentials */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
               <div className="space-y-2">
                 <Label className="text-zinc-400">Package Title</Label>
                 <Input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="e.g. 3-Day Masai Mara Safari" className="bg-black border-zinc-800"/>
               </div>
               <div className="space-y-2">
                 <Label className="text-zinc-400">Price (KES)</Label>
                 <div className="flex gap-2">
                    <Input type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} placeholder="45000" className="bg-black border-zinc-800 flex-1"/>
                    <Select value={formData.price_model} onValueChange={(v) => setFormData({...formData, price_model: v})}>
                        <SelectTrigger className="w-[140px] bg-zinc-900 border-zinc-800"><SelectValue /></SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                            <SelectItem value="per_person">Per Person</SelectItem>
                            <SelectItem value="per_vehicle">Per Vehicle</SelectItem>
                            <SelectItem value="total_package">Total</SelectItem>
                        </SelectContent>
                    </Select>
                 </div>
               </div>
               <div className="space-y-2">
                 <Label className="text-zinc-400">Duration (Days)</Label>
                 <Input type="number" value={formData.duration_days} onChange={e => setFormData({...formData, duration_days: e.target.value})} className="bg-black border-zinc-800"/>
               </div>
            </div>

            {/* Image Upload */}
            <div onClick={() => fileInputRef.current?.click()} className={cn("border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all group relative overflow-hidden h-full min-h-[200px]", imagePreview ? "border-green-500/30" : "border-zinc-800 hover:border-zinc-600")}>
               <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageSelect} />
               {imagePreview ? (
                 <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
               ) : (
                 <div className="text-center text-zinc-500">
                   <Upload className="mx-auto mb-2 group-hover:text-green-500 transition-colors" />
                   <p className="text-xs font-medium">Upload Cover Image</p>
                 </div>
               )}
            </div>
          </div>

          {/* Section 2: Destinations (Tags) */}
          <div className="space-y-3">
             <Label className="text-zinc-400">Destinations / Route</Label>
             <div className="flex gap-2">
                <div className="relative flex-1">
                    <MapPin className="absolute left-3 top-2.5 text-zinc-500" size={16} />
                    <Input value={newDest} onChange={e => setNewDest(e.target.value)} onKeyDown={e => e.key === 'Enter' && addTag('dest')} placeholder="Add location (e.g. Nakuru)..." className="pl-9 bg-black border-zinc-800"/>
                </div>
                <Button onClick={() => addTag('dest')} variant="secondary"><Plus size={18}/></Button>
             </div>
             <div className="flex flex-wrap gap-2">
                {formData.destinations.map((d, i) => (
                  <div key={i} className="bg-zinc-800 text-zinc-300 px-3 py-1 rounded-full text-xs flex items-center gap-2 border border-zinc-700">
                    {d} <button onClick={() => removeTag('dest', i)} className="hover:text-white"><X size={12}/></button>
                  </div>
                ))}
             </div>
          </div>

          {/* Section 3: Inclusions (Tags) */}
          <div className="space-y-3">
             <Label className="text-zinc-400">Package Inclusions</Label>
             <div className="flex gap-2">
                <div className="relative flex-1">
                    <CheckCircle2 className="absolute left-3 top-2.5 text-zinc-500" size={16} />
                    <Input value={newInc} onChange={e => setNewInc(e.target.value)} onKeyDown={e => e.key === 'Enter' && addTag('inc')} placeholder="Add inclusion (e.g. Park Fees)..." className="pl-9 bg-black border-zinc-800"/>
                </div>
                <Button onClick={() => addTag('inc')} variant="secondary"><Plus size={18}/></Button>
             </div>
             <div className="flex flex-wrap gap-2">
                {formData.inclusions.map((inc, i) => (
                  <div key={i} className="bg-green-500/10 text-green-400 border border-green-500/20 px-3 py-1 rounded-full text-xs flex items-center gap-2">
                    {inc} <button onClick={() => removeTag('inc', i)} className="hover:text-white"><X size={12}/></button>
                  </div>
                ))}
             </div>
          </div>

          {/* Section 4: Details & Status */}
          <div className="space-y-2">
            <Label className="text-zinc-400">Description</Label>
            <Textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="bg-black border-zinc-800 min-h-[100px]" placeholder="Detailed itinerary..."/>
          </div>

          <div className="space-y-2">
             <Label className="text-zinc-400">Publish Status</Label>
             <Select value={formData.status} onValueChange={(v: any) => setFormData({...formData, status: v})}>
               <SelectTrigger className="bg-black border-zinc-800"><SelectValue /></SelectTrigger>
               <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                 <SelectItem value="active">Active (Public)</SelectItem>
                 <SelectItem value="draft">Draft (Hidden)</SelectItem>
                 <SelectItem value="archived">Archived</SelectItem>
               </SelectContent>
             </Select>
          </div>

        </div>

        <div className="p-6 border-t border-zinc-800 bg-zinc-900 flex justify-end gap-3">
           <Button variant="ghost" onClick={() => setIsOpen(false)} className="text-zinc-400 hover:text-white">Cancel</Button>
           <Button onClick={handleSubmit} disabled={isLoading} className="bg-green-600 hover:bg-green-500 text-white font-bold px-8">
             {isLoading ? <Loader2 className="animate-spin" /> : (mode === 'create' ? "Publish Package" : "Save Changes")}
           </Button>
        </div>

      </DialogContent>
    </Dialog>
  );
}