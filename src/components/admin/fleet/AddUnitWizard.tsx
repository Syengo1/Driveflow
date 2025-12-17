"use client";

import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, CarFront, Loader2, CheckCircle2, Camera, ShieldAlert, MapPin, Satellite, AlertOctagon, Pencil, X, Gauge } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase"; 

// --- TYPES ---
export interface UnitFormData {
  id?: string;
  plate: string;
  color: string;
  fuel: string;
  transmission: string; // ADDED: Transmission Field
  mileage: string;
  vin: string;
  insuranceExpiry: string;
  trackerId: string;
  location: string;
  // Supports both new Files (uploads) and string URLs (existing)
  imageMap: Record<string, (File | string)[]>; 
  tagsMap: Record<string, string[]>; 
  savedImages?: string[];
}

const INITIAL_DATA: UnitFormData = {
  plate: "", color: "", fuel: "Petrol", transmission: "Automatic", mileage: "", vin: "", insuranceExpiry: "", trackerId: "", location: "", imageMap: {},
  tagsMap: {
    exterior: ["General View"],
    interior: ["General View"],
    boot: ["General View"],
    engine: ["General View"]
  },
  savedImages: []
};

// --- HELPER: IMAGE DROPZONE ---
const ImageDropzone = ({ label, files, onUpload, onRemove }: { label: string, files: (File|string)[], onUpload: (files: File[]) => void, onRemove: (index: number) => void }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Create previews: Strings are URLs, Files are ObjectURLs
  const previews = files.map(f => (typeof f === 'string' ? f : URL.createObjectURL(f)));

  return (
    <div className="mb-4 animate-in fade-in zoom-in-95 duration-300">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-white capitalize">{label}</span>
        <span className="text-xs text-zinc-500">{files.length} added</span>
      </div>
      <input type="file" multiple ref={fileInputRef} className="hidden" onChange={(e) => e.target.files && onUpload(Array.from(e.target.files))} accept="image/*" />
      <div className={cn("relative border-2 border-dashed rounded-xl p-4 transition-all duration-300 flex flex-col items-center justify-center min-h-[100px] group", files.length > 0 ? "border-green-500/50 bg-green-500/5" : "border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900 hover:border-zinc-600")}>
        {files.length > 0 ? (
          <div className="grid grid-cols-5 gap-2 w-full">
            {previews.map((src, idx) => (
              <div key={idx} className="aspect-square rounded-md overflow-hidden relative group/img border border-zinc-700">
                <img src={src} alt="preview" className="w-full h-full object-cover" />
                <button onClick={(e) => { e.stopPropagation(); onRemove(idx); }} className="absolute top-1 right-1 bg-black/50 hover:bg-red-500 text-white rounded-full p-1 opacity-0 group-hover/img:opacity-100 transition-opacity"><X size={12} /></button>
              </div>
            ))}
            <div onClick={() => fileInputRef.current?.click()} className="aspect-square rounded-md border border-dashed border-zinc-700 flex items-center justify-center text-zinc-600 hover:text-yellow-500 hover:border-yellow-500 transition-colors cursor-pointer"><Plus size={20} /></div>
          </div>
        ) : (
          <div onClick={() => fileInputRef.current?.click()} className="text-center cursor-pointer w-full h-full flex flex-col items-center justify-center">
            <div className="flex items-center justify-center gap-2 text-zinc-500 group-hover:text-zinc-300"><Camera size={18} /><span className="text-xs">Add photos</span></div>
          </div>
        )}
      </div>
    </div>
  );
};

// --- HELPER: CATEGORY TABS ---
interface CategoryProps {
    category: string;
    imageMap: Record<string, (File|string)[]>;
    tags: string[];
    onUpdateMap: (key: string, files: (File|string)[]) => void;
    onAddTag: (tag: string) => void;
}

const CategoryManager = ({ category, imageMap, tags, onUpdateMap, onAddTag }: CategoryProps) => {
  const [newTag, setNewTag] = useState("");
  const handleAdd = () => { if (!newTag.trim()) return; onAddTag(newTag); setNewTag(""); };

  return (
    <div className="space-y-4 pt-2">
      <div className="flex gap-2 p-3 bg-zinc-900/50 rounded-lg border border-zinc-800">
        <Input value={newTag} onChange={(e) => setNewTag(e.target.value)} placeholder={`Add ${category} feature...`} className="bg-black border-zinc-700 h-8 text-xs"/>
        <button onClick={handleAdd} className="bg-zinc-800 hover:bg-zinc-700 text-white px-3 rounded-md text-xs font-bold border border-zinc-700 whitespace-nowrap">+ Tag</button>
      </div>
      <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
        {tags.map((tag) => {
            const mapKey = `${category}-${tag}`;
            const currentFiles = imageMap[mapKey] || [];
            return <ImageDropzone key={tag} label={tag} files={currentFiles} onUpload={(newFiles) => onUpdateMap(mapKey, [...currentFiles, ...newFiles])} onRemove={(idx) => { const updated = [...currentFiles]; updated.splice(idx, 1); onUpdateMap(mapKey, updated); }} />
        })}
      </div>
    </div>
  );
};

// --- MAIN COMPONENT ---
interface Props {
  parentModelName?: string;
  parentModelId?: string; 
  mode?: "create" | "edit";
  defaultData?: UnitFormData;
  trigger?: React.ReactNode;
  onSave?: () => void;
}

export default function AddUnitWizard({ parentModelName, parentModelId, mode = "create", defaultData, trigger, onSave }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const [formData, setFormData] = useState<UnitFormData>(INITIAL_DATA);
  const [errors, setErrors] = useState<Partial<Record<keyof UnitFormData, boolean>>>({});
  const [plateErrorMsg, setPlateErrorMsg] = useState<string | null>(null);

  // --- INIT LOGIC ---
  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" && defaultData) {
        const hydratedData = { ...defaultData };
        // Ensure transmission has a default if missing in passed data
        if (!hydratedData.transmission) hydratedData.transmission = "Automatic";

        if (defaultData.savedImages && defaultData.savedImages.length > 0 && Object.keys(hydratedData.imageMap).length === 0) {
            const reconstructedMap: Record<string, string[]> = {};
            const reconstructedTags = { ...INITIAL_DATA.tagsMap }; 
            defaultData.savedImages.forEach(url => {
                try {
                    const cleanUrl = url.split('?')[0]; 
                    const decodedUrl = decodeURIComponent(cleanUrl);
                    const filename = decodedUrl.split('/').pop() || "";
                    const parts = filename.split('__');
                    if (parts.length >= 3) {
                        const category = parts[0];
                        const tag = parts[1].replace(/_/g, " "); 
                        const mapKey = `${category}-${tag}`;
                        if (!reconstructedMap[mapKey]) reconstructedMap[mapKey] = [];
                        reconstructedMap[mapKey].push(url);
                        if (!reconstructedTags[category]) reconstructedTags[category] = [];
                        if (!reconstructedTags[category].includes(tag)) reconstructedTags[category].push(tag);
                    } else {
                        const fallbackKey = "exterior-General View";
                        if (!reconstructedMap[fallbackKey]) reconstructedMap[fallbackKey] = [];
                        reconstructedMap[fallbackKey].push(url);
                    }
                } catch (e) { console.log("Failed to parse image URL", url); }
            });
            hydratedData.imageMap = reconstructedMap;
            hydratedData.tagsMap = reconstructedTags;
        }
        setFormData(hydratedData);
      } else {
        setFormData(INITIAL_DATA);
      }
      setStep(1);
      setIsSuccess(false);
      setPlateErrorMsg(null);
      setErrors({});
    }
  }, [isOpen, mode, defaultData]);

  const updateForm = (key: keyof UnitFormData, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: false }));
    if (key === "plate") setPlateErrorMsg(null);
  };

  const handleImageUpdate = (key: string, files: (File|string)[]) => {
    setFormData(prev => ({ ...prev, imageMap: { ...prev.imageMap, [key]: files } }));
  };

  const handleTagAdd = (category: string, newTag: string) => {
    setFormData(prev => {
        const currentTags = prev.tagsMap[category] || [];
        if (currentTags.includes(newTag)) return prev; 
        return { ...prev, tagsMap: { ...prev.tagsMap, [category]: [...currentTags, newTag] } };
    });
  };

  const handlePlateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (value.length > 3) value = value.slice(0, 3) + ' ' + value.slice(3);
    if (value.length > 8) value = value.slice(0, 8);
    updateForm("plate", value);
  };

  const checkPlateAvailability = async (plate: string): Promise<boolean> => {
    if (mode === "edit" && defaultData?.plate === plate) return true;
    try {
      const { data, error } = await supabase.from('fleet_units').select('id').eq('plate_number', plate).maybeSingle();
      if (error) throw error;
      if (data) {
        setPlateErrorMsg(`Unit ${plate} is already registered.`);
        setErrors(prev => ({ ...prev, plate: true }));
        return false;
      }
      return true;
    } catch (err) { return false; }
  };

  const validateStep1 = async () => {
    const newErrors: any = {};
    if (!formData.plate || formData.plate.length < 7) newErrors.plate = true;
    if (!formData.color) newErrors.color = true;
    if (!formData.fuel) newErrors.fuel = true;
    if (!formData.mileage) newErrors.mileage = true;
    if (!formData.location) newErrors.location = true;
    
    if (formData.plate && !newErrors.plate) {
      setIsLoading(true); 
      const isAvailable = await checkPlateAvailability(formData.plate);
      setIsLoading(false);
      if (!isAvailable) newErrors.plate = true;
    }
    
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return false; }
    return true;
  };

  // --- SUBMIT HANDLER ---
  const handleSubmit = async () => {
    setIsLoading(true);
    try {
        if (mode === "create" && !parentModelId) throw new Error("System Error: Missing Parent Model ID.");
        if (mode === "edit" && !formData.id) throw new Error("System Error: Unit ID is missing. Cannot update.");

        const finalImageUrls: string[] = [];
        const filesToUpload: { file: File, key: string }[] = [];

        Object.entries(formData.imageMap).forEach(([key, items]) => {
            items.forEach(item => {
                if (typeof item === 'string') {
                    finalImageUrls.push(item);
                } else {
                    filesToUpload.push({ file: item, key });
                }
            });
        });

        if (filesToUpload.length > 0) {
            for (const { file, key } of filesToUpload) {
                const fileExt = file.name.split('.').pop();
                const [category, ...tagParts] = key.split('-');
                const tag = tagParts.join('-').replace(/ /g, "_"); 
                const safeFileName = `${category}__${tag}__${formData.plate}__${Math.random().toString(36).substr(2, 5)}.${fileExt}`;
                const filePath = `${formData.plate}/${safeFileName}`;

                const { error: uploadError } = await supabase.storage.from('fleet-media').upload(filePath, file);
                if (!uploadError) {
                    const { data: publicData } = supabase.storage.from('fleet-media').getPublicUrl(filePath);
                    finalImageUrls.push(publicData.publicUrl);
                }
            }
        }

        const dbPayload: any = {
            plate_number: formData.plate,
            color: formData.color,
            fuel_type: formData.fuel.toLowerCase(),
            transmission: formData.transmission, // ADDED TO PAYLOAD
            current_mileage: parseInt(formData.mileage),
            hub_location: formData.location,
            tracker_id: formData.trackerId || null,
            insurance_expiry: formData.insuranceExpiry || null,
            vin_chassis: formData.vin || null,
            images: finalImageUrls 
        };

        if (parentModelId) dbPayload.model_id = parentModelId;

        let error;
        if (mode === "create") {
            dbPayload.status = 'available'; 
            dbPayload.public_id = `UNIT-${Math.floor(1000 + Math.random() * 9000)}`;
            const res = await supabase.from('fleet_units').insert(dbPayload);
            error = res.error;
        } else {
            const res = await supabase.from('fleet_units').update(dbPayload).eq('id', formData.id);
            error = res.error;
        }

        if (error) {
            console.error("Supabase Error Details:", JSON.stringify(error, null, 2));
            throw new Error(error.message || "Database operation failed.");
        }

        setIsSuccess(true);
        if (onSave) onSave();
        toast.success(mode === "create" ? "Unit Added" : "Unit Updated", { description: `${formData.plate} saved.` });

    } catch (error: any) {
        console.error("ERROR:", error);
        toast.error("Submission Failed", { description: error.message });
    } finally {
        setIsLoading(false);
    }
  };

  const handleClose = (open: boolean) => {
    if (!open && isSuccess) { setStep(1); setFormData(INITIAL_DATA); }
    setIsOpen(open);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogTrigger asChild>
        {trigger ? trigger : (
          <button className="w-full py-2 border border-dashed border-zinc-700 text-zinc-500 rounded-lg hover:bg-zinc-900 hover:text-yellow-500 hover:border-yellow-500/50 transition-all text-sm font-medium group">
            <span className="group-hover:mr-2 transition-all">+</span> Add New Unit {parentModelName ? `to ${parentModelName}` : ""}
          </button>
        )}
      </DialogTrigger>
      
      <DialogContent className="glass-panel border-zinc-800 text-white max-w-3xl max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0">
        {isSuccess ? (
          <div className="h-[400px] flex flex-col items-center justify-center p-8 text-center animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center text-green-500 mb-6 shadow-[0_0_30px_-5px_rgba(34,197,94,0.4)]"><CheckCircle2 size={40} /></div>
            <h2 className="text-2xl font-bold text-white mb-2">{mode === "create" ? "Unit Onboarded!" : "Updates Saved!"}</h2>
            <p className="text-zinc-400 mb-8"><span className="text-yellow-500 font-mono font-bold">{formData.plate}</span> has been synced to the fleet database.</p>
            <button onClick={() => setIsOpen(false)} className="px-6 py-2 bg-white text-black hover:bg-zinc-200 rounded-lg font-bold transition-colors">Done</button>
          </div>
        ) : (
          <>
            <DialogHeader className="p-6 pb-4 border-b border-white/5 bg-zinc-950/50">
              <DialogTitle className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-400 border border-zinc-700">{mode === "edit" ? <Pencil size={18}/> : <CarFront size={20} />}</div>
                <div>
                  <h2 className="text-lg font-bold text-white leading-none mb-1">{mode === "create" ? "Add New Unit" : `Edit ${formData.plate}`}</h2>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">{[1, 2].map(i => <div key={i} className={cn("h-1 w-6 rounded-full transition-colors", step >= i ? "bg-yellow-500" : "bg-zinc-800")} />)}</div>
                    <span className="text-[10px] text-zinc-500 uppercase tracking-widest ml-1">{step === 1 ? "Identity & Status" : "The Media Vault"}</span>
                  </div>
                </div>
              </DialogTitle>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-zinc-950/30">
              {step === 1 && (
                <div className="grid gap-6 animate-in slide-in-from-right-4 duration-300">
                  {plateErrorMsg && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-start gap-3"><AlertOctagon className="text-red-500 shrink-0 mt-0.5" size={18} /><div><p className="text-red-400 font-bold text-sm">Unavailable</p><p className="text-zinc-400 text-xs mt-1">{plateErrorMsg}</p></div></div>
                  )}
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2"><Label>Plate Number *</Label><Input value={formData.plate} onChange={handlePlateChange} placeholder="KDB 123A" maxLength={8} className={cn("bg-black border-zinc-800 focus:border-yellow-500 font-mono text-lg uppercase tracking-wider text-yellow-500 font-bold", errors.plate && "border-red-500/50")} /></div>
                    <div className="space-y-2"><Label className="text-zinc-400">Chassis / VIN</Label><Input value={formData.vin} onChange={(e) => updateForm("vin", e.target.value.toUpperCase())} className="bg-black border-zinc-800 font-mono" /></div>
                  </div>

                  {/* UPDATED: Spec Grid (Transmission, Color) */}
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2"><Label>Color *</Label><Input value={formData.color} onChange={(e) => updateForm("color", e.target.value)} className={cn("bg-black border-zinc-800", errors.color && "border-red-500/50")} /></div>
                    <div className="space-y-2">
                        <Label>Transmission *</Label>
                        <Select value={formData.transmission} onValueChange={(val) => updateForm("transmission", val)}>
                            <SelectTrigger className="bg-black border-zinc-800"><SelectValue /></SelectTrigger>
                            <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                                <SelectItem value="Automatic">Automatic</SelectItem>
                                <SelectItem value="Manual">Manual</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                  </div>

                  {/* UPDATED: Spec Grid (Mileage, Fuel) */}
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2"><Label>Mileage *</Label><Input type="number" value={formData.mileage} onChange={(e) => updateForm("mileage", e.target.value)} className={cn("bg-black border-zinc-800", errors.mileage && "border-red-500/50")} /></div>
                    <div className="space-y-2"><Label>Fuel *</Label><Select value={formData.fuel} onValueChange={(val) => updateForm("fuel", val)}><SelectTrigger className={cn("bg-black border-zinc-800", errors.fuel && "border-red-500/50")}><SelectValue /></SelectTrigger><SelectContent className="bg-zinc-900 border-zinc-800 text-white"><SelectItem value="Petrol">Petrol</SelectItem><SelectItem value="Diesel">Diesel</SelectItem><SelectItem value="Hybrid">Hybrid</SelectItem><SelectItem value="Electric">Electric</SelectItem></SelectContent></Select></div>
                  </div>

                  <div className="grid grid-cols-3 gap-6 pt-2">
                    <div className="space-y-2"><Label><MapPin size={14} className="inline mr-1"/> Hub *</Label><Select value={formData.location} onValueChange={(val) => updateForm("location", val)}><SelectTrigger className={cn("bg-black border-zinc-800", errors.location && "border-red-500/50")}><SelectValue /></SelectTrigger><SelectContent className="bg-zinc-900 border-zinc-800 text-white"><SelectItem value="Westlands">Westlands</SelectItem><SelectItem value="JKIA">JKIA</SelectItem><SelectItem value="Mombasa">Mombasa</SelectItem></SelectContent></Select></div>
                    <div className="space-y-2"><Label className="text-zinc-400"><ShieldAlert size={14} className="inline mr-1"/> Insurance</Label><Input type="date" value={formData.insuranceExpiry} onChange={(e) => updateForm("insuranceExpiry", e.target.value)} className="bg-black border-zinc-800 text-zinc-300" /></div>
                    <div className="space-y-2"><Label className="text-zinc-400"><Satellite size={14} className="inline mr-1"/> GPS ID</Label><Input value={formData.trackerId} onChange={(e) => updateForm("trackerId", e.target.value)} className="bg-black border-zinc-800 font-mono text-xs" /></div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="animate-in slide-in-from-right-4 duration-300 h-full flex flex-col">
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 mb-4 flex gap-3">
                    <Camera className="text-blue-400 shrink-0" size={18} />
                    <p className="text-xs text-blue-300">Upload photos to build the customer view.</p>
                  </div>
                  <Tabs defaultValue="exterior" className="flex-1 flex flex-col">
                    <TabsList className="bg-black border border-zinc-800 w-full justify-start p-1 h-10 mb-2">
                        {['exterior', 'interior', 'boot', 'engine'].map(cat => (
                            <TabsTrigger key={cat} value={cat} className="text-xs capitalize data-[state=active]:bg-zinc-800 data-[state=active]:text-yellow-500">{cat}</TabsTrigger>
                        ))}
                    </TabsList>
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {['exterior', 'interior', 'boot', 'engine'].map(cat => (
                            <TabsContent key={cat} value={cat}>
                                <CategoryManager category={cat} imageMap={formData.imageMap} onUpdateMap={handleImageUpdate} tags={formData.tagsMap[cat] || ["General View"]} onAddTag={(tag) => handleTagAdd(cat, tag)}/>
                            </TabsContent>
                        ))}
                    </div>
                  </Tabs>
                </div>
              )}
            </div>

            <div className="p-6 pt-4 border-t border-white/10 bg-zinc-950 flex items-center justify-between shrink-0">
              <button onClick={() => setIsOpen(false)} className="text-zinc-500 hover:text-white text-sm font-medium">Cancel</button>
              <div className="flex gap-3">
                {step === 2 && <button onClick={() => setStep(1)} className="text-zinc-400 hover:text-white text-sm px-4">Back</button>}
                <button 
                  onClick={() => step === 1 ? (validateStep1().then(valid => valid && setStep(2))) : handleSubmit()} 
                  disabled={isLoading || !!plateErrorMsg} 
                  className="bg-white text-black px-8 py-2.5 rounded-lg font-bold hover:bg-zinc-200 transition-all shadow-lg text-sm flex items-center gap-2"
                >
                  {isLoading ? <Loader2 className="animate-spin" size={16} /> : step === 1 ? "Next: Photos" : (mode === "create" ? "Add Unit" : "Save Changes")}
                </button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}