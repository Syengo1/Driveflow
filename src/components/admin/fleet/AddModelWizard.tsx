"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Car, Trash2, Video, Image as ImageIcon, Loader2, CheckCircle2, AlertTriangle, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

// --- TYPES ---
export interface ModelFormData {
  id?: string;
  make: string;
  model: string;
  year: string;
  category: string;
  baseRate: string;
  seats: string;
  tags: string[];
  coverImage: File | string | null;
  video: File | null;
}

const INITIAL_DATA: ModelFormData = {
  make: "", model: "", year: "", category: "", baseRate: "", seats: "5", tags: [], coverImage: null, video: null
};

// --- HELPER: ROBUST UPLOAD FUNCTION ---
const uploadAsset = async (file: File, folder: string): Promise<string> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${folder}/${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage.from('fleet-media').upload(fileName, file);
  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from('fleet-media').getPublicUrl(fileName);
  return data.publicUrl;
};

// --- HELPER: SINGLE ASSET DROPZONE ---
const SingleAssetDropzone = ({ 
  label, accept, icon: Icon, onUpload, error, file, preview
}: { 
  label: string, accept: string, icon: any, onUpload: (file: File | null) => void, error?: boolean, file: File | string | null, preview: string | null
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const displaySrc = preview || (typeof file === 'string' ? file : null);

  const handleFile = (uploadedFile: File) => onUpload(uploadedFile);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setIsDragging(true);
    else if (e.type === "dragleave") setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) handleFile(e.dataTransfer.files[0]);
  }, []);

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <span className={cn("text-sm font-medium capitalize", error ? "text-red-400" : "text-zinc-400")}>{label}</span>
      </div>
      <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => e.target.files && handleFile(e.target.files[0])} accept={accept} />
      <div
        onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
        onClick={() => !file && fileInputRef.current?.click()}
        className={cn(
          "relative border-2 border-dashed rounded-xl transition-all duration-300 flex flex-col items-center justify-center min-h-[140px] overflow-hidden",
          file ? "border-yellow-500/50 bg-black" : "cursor-pointer",
          isDragging ? "border-yellow-500 bg-yellow-500/10 scale-[1.01]" : !file && "bg-zinc-900/50 hover:bg-zinc-900 hover:border-zinc-600",
          error && !file ? "border-red-500/50 bg-red-500/5" : "border-zinc-800"
        )}
      >
        {file || displaySrc ? (
          <div className="relative w-full h-full flex items-center justify-center min-h-[140px] group">
            {displaySrc && accept.includes('image') ? (
              <img src={displaySrc} alt="preview" className="absolute inset-0 w-full h-full object-cover opacity-80" />
            ) : (
              <div className="flex flex-col items-center text-yellow-500 animate-pulse">
                <Icon size={32} />
                <span className="text-xs mt-2 font-mono text-center px-4 max-w-[200px] truncate">{file instanceof File ? file.name : "Asset Uploaded"}</span>
              </div>
            )}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center backdrop-blur-sm">
              <button onClick={(e) => { e.stopPropagation(); onUpload(null); if (fileInputRef.current) fileInputRef.current.value = ""; }} className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500 hover:text-white transition-all"><Trash2 size={16} /> Remove</button>
            </div>
          </div>
        ) : (
          <div className="text-center pointer-events-none p-6">
            <div className={`mx-auto w-10 h-10 mb-3 rounded-full flex items-center justify-center transition-colors ${isDragging ? 'bg-yellow-500 text-black' : 'bg-zinc-800 text-zinc-500'}`}><Icon size={18} /></div>
            <p className="text-xs text-zinc-400">Drag or Click to upload</p>
          </div>
        )}
      </div>
    </div>
  );
};

// --- MAIN WIZARD COMPONENT ---
interface WizardProps {
  mode?: "create" | "edit";
  defaultData?: ModelFormData;
  trigger?: React.ReactNode;
  onSave?: () => void;
}

export default function AddModelWizard({ mode = "create", defaultData, trigger, onSave }: WizardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const [formData, setFormData] = useState<ModelFormData>(INITIAL_DATA);
  const [errors, setErrors] = useState<Partial<Record<keyof ModelFormData, boolean>>>({});
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const availableTags = ["Safari Ready", "Chauffeur Option", "Wedding Class", "Fuel Saver", "Off-Road Beast", "7-Seater"];

  // --- FIX: Reset state completely when opening ---
  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" && defaultData) {
        setFormData(defaultData);
        if (typeof defaultData.coverImage === 'string') setImagePreview(defaultData.coverImage);
      } else {
        setFormData(INITIAL_DATA);
        setImagePreview(null);
      }
      setStep(1);
      setIsSuccess(false); // <--- FIX: Ensure success screen is hidden on reopen
      setDuplicateWarning(null);
      setErrors({});
    }
  }, [isOpen, mode, defaultData]);

  const updateForm = (key: keyof ModelFormData, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    if (["make", "model", "year"].includes(key)) setDuplicateWarning(null); 
    if (key === 'coverImage') {
      if (value instanceof File) setImagePreview(URL.createObjectURL(value));
      else if (value === null) setImagePreview(null);
    }
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: false }));
  };

  const toggleTag = (tag: string) => {
    const newTags = formData.tags.includes(tag) ? formData.tags.filter(t => t !== tag) : [...formData.tags, tag];
    updateForm("tags", newTags);
  };

  const checkForDuplicates = async (): Promise<boolean> => {
    if (mode === "edit") return false;
    const { data } = await supabase
      .from('fleet_models')
      .select('id, make, model, year')
      .ilike('make', formData.make)
      .ilike('model', formData.model)
      .eq('year', parseInt(formData.year) || 0)
      .maybeSingle();

    if (data) {
      setDuplicateWarning(`${data.year} ${data.make} ${data.model}`);
      return true;
    }
    return false;
  };

  const validateStep = (currentStep: number): boolean => {
    const newErrors: Partial<Record<keyof ModelFormData, boolean>> = {};
    let isValid = true;

    if (currentStep === 1) {
      if (!formData.make) newErrors.make = true;
      if (!formData.model) newErrors.model = true;
      if (!formData.year || formData.year.length !== 4) newErrors.year = true;
      if (!formData.category) newErrors.category = true;
      if (!formData.baseRate) newErrors.baseRate = true;
      if (!formData.seats || parseInt(formData.seats) < 1) newErrors.seats = true; 
    }
    if (currentStep === 3) {
      if (!formData.coverImage && !formData.video) newErrors.coverImage = true;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      isValid = false;
    }
    return isValid;
  };

  const handleNext = async () => {
    if (validateStep(step)) {
      if (step === 1) {
        setIsLoading(true);
        const isDuplicate = await checkForDuplicates();
        setIsLoading(false);
        if (isDuplicate) return;
      }
      setStep(prev => prev + 1);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(3)) return;
    setIsLoading(true);

    try {
        let coverImageUrl: string | null = null;
        let videoUrl: string | null = null;

        if (formData.coverImage instanceof File) {
           coverImageUrl = await uploadAsset(formData.coverImage, 'models/images');
        } else if (typeof formData.coverImage === 'string') {
           coverImageUrl = formData.coverImage;
        }

        if (formData.video instanceof File) {
           videoUrl = await uploadAsset(formData.video, 'models/videos');
        } else if (typeof formData.video === 'string') {
           videoUrl = formData.video;
        }

        const dbPayload = {
            make: formData.make,
            model: formData.model,
            year: parseInt(formData.year),
            category: formData.category,
            daily_rate: parseFloat(formData.baseRate),
            seats: parseInt(formData.seats),
            tags: formData.tags,
            image_url: coverImageUrl,
            video_url: videoUrl
        };

        let error;

        if (mode === "create") {
            const res = await supabase.from('fleet_models').insert(dbPayload);
            error = res.error;
        } else {
             const res = await supabase.from('fleet_models').update(dbPayload).eq('id', defaultData?.id);
             error = res.error;
        }

        if (error) throw error;

        setIsSuccess(true);
        toast.success(mode === "create" ? "Model Added" : "Model Updated");
        if (onSave) onSave(); 

    } catch (err: any) {
        console.error("Submission Error:", err);
        toast.error("Operation Failed", { description: err.message });
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger ? trigger : (
          <button className="flex items-center gap-2 px-5 py-2.5 bg-yellow-500 hover:bg-yellow-400 text-zinc-950 font-bold rounded-xl transition-all shadow-lg shadow-yellow-500/20">
            <Plus size={20} /><span>Add New Model</span>
          </button>
        )}
      </DialogTrigger>
      
      <DialogContent className="glass-panel border-zinc-800 text-white max-w-2xl max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0">
        
        {isSuccess ? (
          <div className="h-[400px] flex flex-col items-center justify-center p-8 text-center animate-in zoom-in-95 duration-300">
            {/* --- FIX: Added Hidden Title for Accessibility --- */}
            <DialogTitle className="sr-only">Operation Successful</DialogTitle>
            
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center text-green-500 mb-6 shadow-[0_0_30px_-5px_rgba(34,197,94,0.4)]"><CheckCircle2 size={40} /></div>
            <h2 className="text-2xl font-bold text-white mb-2">{mode === "create" ? "Model Created!" : "Changes Saved!"}</h2>
            <p className="text-zinc-400 mb-8 max-w-xs"><span className="text-yellow-500 font-semibold">{formData.make} {formData.model}</span> is now active.</p>
            <div className="flex gap-4">
              <button onClick={() => setIsOpen(false)} className="px-6 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg font-medium transition-colors">Close</button>
              {mode === "create" && (
                <button onClick={() => { setIsSuccess(false); setStep(1); setFormData(INITIAL_DATA); setErrors({}); setImagePreview(null); }} className="px-6 py-2 bg-white text-black hover:bg-zinc-200 rounded-lg font-bold transition-colors">Add Another</button>
              )}
            </div>
          </div>
        ) : (
          <>
            <DialogHeader className="p-6 pb-4 border-b border-white/5 bg-zinc-900">
              <DialogTitle className="text-xl font-bold flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-600 to-yellow-800 flex items-center justify-center text-white shadow-lg"><Car size={20} /></div>
                <div className="flex flex-col">
                  <span>{mode === "create" ? "Create Parent Model" : "Edit Model Details"}</span>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex gap-1">{[1, 2, 3].map(i => <div key={i} className={cn("h-1 w-6 rounded-full transition-colors", step >= i ? "bg-yellow-500" : "bg-zinc-800")} />)}</div>
                    <span className="text-[10px] font-normal text-zinc-400 uppercase tracking-widest ml-2">Step {step} of 3</span>
                  </div>
                </div>
              </DialogTitle>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-zinc-950/50">
              
              {duplicateWarning && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl animate-in fade-in slide-in-from-top-2">
                  <div className="flex gap-3">
                    <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center shrink-0 text-red-500"><AlertTriangle size={20} /></div>
                    <div>
                      <h4 className="font-bold text-red-500 text-sm">Duplicate Model Detected</h4>
                      <p className="text-zinc-400 text-xs mt-1 leading-relaxed"><span className="text-white font-medium">{duplicateWarning}</span> already exists. Add a <strong>Unit</strong> instead.</p>
                    </div>
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="grid gap-6 animate-in slide-in-from-right-4 duration-300">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2"><Label className={errors.make ? "text-red-400" : "text-zinc-400"}>Make *</Label><Input value={formData.make} onChange={(e) => updateForm("make", e.target.value)} placeholder="e.g. Toyota" className={cn("bg-zinc-900 border-zinc-800 focus:border-yellow-500", errors.make && "border-red-500/50")} /></div>
                    <div className="space-y-2"><Label className={errors.model ? "text-red-400" : "text-zinc-400"}>Model *</Label><Input value={formData.model} onChange={(e) => updateForm("model", e.target.value)} placeholder="e.g. Land Cruiser" className={cn("bg-zinc-900 border-zinc-800 focus:border-yellow-500", errors.model && "border-red-500/50")} /></div>
                  </div>
                  
                  {/* SPECS GRID: Year, Seats, Rate */}
                  <div className="grid grid-cols-3 gap-6">
                    <div className="space-y-2"><Label className={errors.year ? "text-red-400" : "text-zinc-400"}>Year *</Label><Input type="number" value={formData.year} onChange={(e) => updateForm("year", e.target.value)} placeholder="2022" className={cn("bg-zinc-900 border-zinc-800", errors.year && "border-red-500/50")} /></div>
                    
                    <div className="space-y-2">
                        <Label className={errors.seats ? "text-red-400" : "text-zinc-400"}>Seats *</Label>
                        <div className="relative">
                            <Users size={14} className="absolute left-3 top-3 text-zinc-500" />
                            <Input type="number" value={formData.seats} onChange={(e) => updateForm("seats", e.target.value)} placeholder="5" className={cn("pl-9 bg-zinc-900 border-zinc-800", errors.seats && "border-red-500/50")} />
                        </div>
                    </div>

                    <div className="space-y-2"><Label className={errors.baseRate ? "text-red-400" : "text-zinc-400"}>Base Rate *</Label><Input type="number" value={formData.baseRate} onChange={(e) => updateForm("baseRate", e.target.value)} placeholder="15000" className={cn("bg-zinc-900 border-zinc-800 text-yellow-500 font-bold", errors.baseRate && "border-red-500/50")} /></div>
                  </div>
                  
                  <div className="space-y-2"><Label className={errors.category ? "text-red-400" : "text-zinc-400"}>Category *</Label><Select value={formData.category} onValueChange={(val) => updateForm("category", val)}><SelectTrigger className={cn("bg-zinc-900 border-zinc-800", errors.category && "border-red-500/50")}><SelectValue placeholder="Select..." /></SelectTrigger><SelectContent className="bg-zinc-900 border-zinc-800 text-white"><SelectItem value="SUV">SUV</SelectItem><SelectItem value="Sedan">Sedan</SelectItem><SelectItem value="Luxury">Luxury</SelectItem><SelectItem value="Hatchback">Hatchback</SelectItem></SelectContent></Select></div>
                </div>
              )}

              {step === 2 && (
                <div className="animate-in slide-in-from-right-4 duration-300">
                  <Label className="text-zinc-400 mb-4 block">Select Use Cases (Optional)</Label>
                  <div className="flex flex-wrap gap-3">
                    {availableTags.map(tag => (
                      <button key={tag} onClick={() => toggleTag(tag)} className={cn("px-4 py-2 rounded-full text-sm font-medium border transition-all", formData.tags.includes(tag) ? "bg-yellow-500 text-black border-yellow-500 shadow-[0_0_15px_-3px_rgba(234,179,8,0.4)]" : "bg-zinc-900 text-zinc-400 border-zinc-700 hover:border-zinc-500")}>{tag}</button>
                    ))}
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="animate-in slide-in-from-right-4 duration-300">
                   <div className="grid grid-cols-2 gap-4">
                    <SingleAssetDropzone label="Cover Photo" accept="image/*" icon={ImageIcon} onUpload={(file: any) => updateForm("coverImage", file)} error={!!errors.coverImage && !formData.video} file={formData.coverImage} preview={imagePreview} />
                    <SingleAssetDropzone label="Hero Video" accept="video/*" icon={Video} onUpload={(file: any) => updateForm("video", file)} error={!!errors.coverImage && !formData.coverImage} file={formData.video} preview={null} />
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 pt-4 border-t border-white/10 bg-zinc-950/30 flex items-center justify-between shrink-0">
              <button onClick={() => setIsOpen(false)} className="flex items-center gap-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 px-4 py-2 rounded-lg transition-all text-sm font-medium">Cancel</button>
              <div className="flex gap-3">
                <button onClick={() => step > 1 && setStep(step - 1)} disabled={step === 1 || isLoading} className={cn("px-4 py-2 rounded-lg text-sm transition-all", step === 1 ? "text-zinc-600 cursor-not-allowed hidden" : "text-zinc-400 hover:text-white hover:bg-zinc-800")}>Back</button>
                <button 
                  onClick={() => step < 3 ? handleNext() : handleSubmit()} 
                  disabled={isLoading || !!duplicateWarning} 
                  className={cn(
                    "bg-white text-black px-6 py-2 rounded-lg font-bold transition-all shadow-[0_0_20px_-5px_rgba(255,255,255,0.3)] text-sm min-w-[120px] flex items-center justify-center",
                    duplicateWarning ? "opacity-50 cursor-not-allowed bg-zinc-600 text-zinc-400 shadow-none" : "hover:bg-zinc-200"
                  )}
                >
                  {isLoading ? <Loader2 className="animate-spin" size={18} /> : step === 3 ? (mode === "create" ? "Create Model" : "Save Changes") : "Next Step"}
                </button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}