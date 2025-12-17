"use client";

import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { 
  UserPlus, User, Phone, Mail, BadgeCheck, Loader2, 
  ArrowRight, Upload, CheckCircle2, Trash2, FileText, ShieldAlert
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

// --- TYPES ---
interface CustomerFormData {
  name: string;
  phone: string;
  email: string;
  idNumber: string;
  dlNumber: string; 
  notes: string;
  idImage: File | null;
  dlImage: File | null;
}

const INITIAL_DATA: CustomerFormData = {
  name: "", phone: "", email: "", idNumber: "", dlNumber: "", notes: "", idImage: null, dlImage: null
};

// --- HELPER: DOCUMENT DROPZONE ---
const DocumentDropzone = ({ label, onUpload, file }: { label: string, onUpload: (f: File | null) => void, file: File | null }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFile = (f: File) => {
    onUpload(f);
    setPreview(URL.createObjectURL(f));
  };

  return (
    <div 
      onClick={() => inputRef.current?.click()}
      className={cn(
        "border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all group relative overflow-hidden h-32",
        file ? "border-green-500/50 bg-green-500/5" : "border-zinc-800 bg-zinc-900/50 hover:border-zinc-600"
      )}
    >
      <input type="file" ref={inputRef} className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
      
      {file ? (
        <>
          <img src={preview!} alt="doc" className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity" />
          <div className="relative z-10 flex flex-col items-center">
             <CheckCircle2 className="text-green-500 mb-1" size={24} />
             <p className="text-xs text-green-400 font-bold truncate max-w-[100px]">{file.name}</p>
          </div>
          <button 
            onClick={(e) => { e.stopPropagation(); onUpload(null); setPreview(null); }}
            className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white hover:bg-red-500 transition-colors z-20"
          >
            <Trash2 size={14} />
          </button>
        </>
      ) : (
        <>
          <Upload className="text-zinc-500 group-hover:text-zinc-300 mb-2" size={20} />
          <p className="text-xs text-zinc-500 text-center uppercase font-bold">{label}</p>
        </>
      )}
    </div>
  );
};

interface Props {
  onAdd: () => void; // Changed: Parent just refreshes data
}

export default function AddCustomerWizard({ onAdd }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<CustomerFormData>(INITIAL_DATA);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isCheckingID, setIsCheckingID] = useState(false);

  // --- LOGIC: FORMATTERS ---
  const handleNameChange = (val: string) => {
    const formatted = val.replace(/\b\w/g, char => char.toUpperCase());
    setFormData(prev => ({ ...prev, name: formatted }));
    if (errors.name) setErrors(prev => ({ ...prev, name: "" }));
  };

  const handlePhoneChange = (val: string) => {
    let clean = val.replace(/[^0-9+]/g, '');
    if (clean.startsWith('07') || clean.startsWith('01')) {
      clean = '+254' + clean.substring(1);
    }
    setFormData(prev => ({ ...prev, phone: clean }));
    if (errors.phone) setErrors(prev => ({ ...prev, phone: "" }));
  };

  const handleIDChange = (val: string) => {
    const clean = val.toUpperCase().replace(/[^A-Z0-9]/g, '');
    setFormData(prev => ({ ...prev, idNumber: clean }));
    if (errors.idNumber) setErrors(prev => ({ ...prev, idNumber: "" }));
    if (errors.global) setErrors(prev => ({ ...prev, global: "" }));
  };

  // --- LOGIC: REAL-TIME DUPLICATE CHECK ---
  const checkDuplicateID = async (id: string) => {
    if (id.length < 6) return false;
    setIsCheckingID(true);
    
    const { data } = await supabase
      .from('customers')
      .select('id')
      .eq('id_number', id)
      .maybeSingle();
      
    setIsCheckingID(false);
    
    if (data) {
      setErrors(prev => ({ ...prev, global: "This ID Number is already registered." }));
      return true;
    }
    return false;
  };

  const validateStep1 = async () => {
    const newErrors: Record<string, string> = {};
    
    if (formData.name.length < 3) newErrors.name = "Full name required";
    if (!/^\+[1-9]\d{9,14}$/.test(formData.phone)) newErrors.phone = "Invalid format (e.g. +254...)";
    if (!formData.idNumber || formData.idNumber.length < 6) newErrors.idNumber = "Valid ID required";
    
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return false;

    // Async check
    const isDuplicate = await checkDuplicateID(formData.idNumber);
    if (isDuplicate) return false;

    return true;
  };

  // --- LOGIC: SUBMIT TO DATABASE ---
  const handleSubmit = async () => {
    setIsLoading(true);
    
    try {
        // 1. Upload Documents (If Any)
        let idUrl = null;
        let dlUrl = null;

        // Ensure bucket exists or handle error silently if public policy is tricky
        if (formData.idImage) {
            const fileName = `ids/${formData.idNumber}_${Date.now()}`;
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('customer-docs') // Ensure this bucket exists
                .upload(fileName, formData.idImage);
            
            if (uploadData) {
                const { data: pub } = supabase.storage.from('customer-docs').getPublicUrl(fileName);
                idUrl = pub.publicUrl;
            }
        }

        if (formData.dlImage) {
            const fileName = `licenses/${formData.idNumber}_${Date.now()}`;
            const { data: uploadData } = await supabase.storage
                .from('customer-docs')
                .upload(fileName, formData.dlImage);
            
            if (uploadData) {
                const { data: pub } = supabase.storage.from('customer-docs').getPublicUrl(fileName);
                dlUrl = pub.publicUrl;
            }
        }

        // 2. Insert Customer Record
        const { error: insertError } = await supabase
            .from('customers')
            .insert({
                full_name: formData.name,
                phone: formData.phone,
                email: formData.email || null,
                id_number: formData.idNumber,
                dl_number: formData.dlNumber || null,
                id_image_url: idUrl,
                dl_image_url: dlUrl,
                status: 'active',
                trust_score: (idUrl && dlUrl) ? 100 : 80 // Dynamic Trust Score based on Docs
            });

        if (insertError) throw insertError;

        // 3. Success
        toast.success("Customer Created", { description: `${formData.name} added to database.` });
        onAdd(); // Refresh parent table
        setIsOpen(false);
        
        // Reset Form
        setTimeout(() => {
            setStep(1);
            setFormData(INITIAL_DATA);
            setErrors({});
        }, 500);

    } catch (error: any) {
        console.error("Submission error:", error);
        toast.error("Failed to create customer", { description: error.message });
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold gap-2 shadow-lg shadow-yellow-500/20">
          <UserPlus size={18} /> Add Customer
        </Button>
      </DialogTrigger>
      
      <DialogContent className="glass-panel border-zinc-800 text-white max-w-md h-[600px] flex flex-col p-0 gap-0 overflow-hidden">
        
        {/* HEADER */}
        <DialogHeader className="p-6 border-b border-white/10 bg-zinc-900 shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-yellow-500/10 text-yellow-500 flex items-center justify-center">
              <UserPlus size={18} />
            </div>
            <span>New Customer Profile</span>
          </DialogTitle>
          <div className="flex items-center gap-2 mt-2">
            {[1, 2].map(i => <div key={i} className={cn("h-1 w-full rounded-full transition-colors", step >= i ? "bg-yellow-500" : "bg-zinc-800")} />)}
          </div>
        </DialogHeader>
        
        {/* BODY */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-zinc-950/50">
          
          {/* STEP 1: BASIC DETAILS */}
          {step === 1 && (
            <div className="space-y-4 animate-in slide-in-from-right-4">
              
              {/* Global Error Alert */}
              {errors.global && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3 text-red-400">
                  <ShieldAlert size={18} className="shrink-0 mt-0.5" /> 
                  <span className="text-xs font-bold">{errors.global}</span>
                </div>
              )}

              <div className="space-y-2">
                <Label className={errors.name ? "text-red-400" : "text-zinc-400"}>Full Name *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 text-zinc-500" size={16} />
                  <Input 
                    className={cn("pl-10 bg-black border-zinc-800", errors.name && "border-red-500/50")} 
                    placeholder="John Doe" 
                    value={formData.name} 
                    onChange={e => handleNameChange(e.target.value)} 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className={errors.phone ? "text-red-400" : "text-zinc-400"}>Phone Number *</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 text-zinc-500" size={16} />
                  <Input 
                    className={cn("pl-10 bg-black border-zinc-800 font-mono", errors.phone && "border-red-500/50")} 
                    placeholder="+254..." 
                    value={formData.phone} 
                    onChange={e => handlePhoneChange(e.target.value)} 
                  />
                </div>
                {errors.phone && <p className="text-xs text-red-500">{errors.phone}</p>}
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-400">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 text-zinc-500" size={16} />
                  <Input 
                    className="pl-10 bg-black border-zinc-800" 
                    placeholder="john@example.com" 
                    value={formData.email} 
                    onChange={e => setFormData({...formData, email: e.target.value})} 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className={errors.idNumber ? "text-red-400" : "text-zinc-400"}>ID / Passport Number *</Label>
                <div className="relative">
                  <BadgeCheck className="absolute left-3 top-2.5 text-zinc-500" size={16} />
                  <Input 
                    className={cn("pl-10 bg-black border-zinc-800 font-mono uppercase", errors.idNumber && "border-red-500/50")} 
                    placeholder="ID Number" 
                    value={formData.idNumber} 
                    onChange={e => handleIDChange(e.target.value)} 
                  />
                  {isCheckingID && <Loader2 className="absolute right-3 top-2.5 animate-spin text-zinc-500" size={16} />}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: KYC DOCUMENTS */}
          {step === 2 && (
            <div className="space-y-6 animate-in slide-in-from-right-4">
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 flex gap-3">
                <FileText className="text-blue-400 shrink-0" />
                <div>
                  <h4 className="font-bold text-blue-400 text-sm">KYC Documents</h4>
                  <p className="text-zinc-400 text-xs mt-1">Uploading these now speeds up the first checkout.</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-zinc-400">Driving License No.</Label>
                  <Input 
                    className="bg-black border-zinc-800 font-mono uppercase" 
                    placeholder="DL-..." 
                    value={formData.dlNumber} 
                    onChange={e => setFormData({...formData, dlNumber: e.target.value.toUpperCase()})} 
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <DocumentDropzone label="ID Card Front" file={formData.idImage} onUpload={(f) => setFormData({...formData, idImage: f})} />
                  <DocumentDropzone label="Driving License" file={formData.dlImage} onUpload={(f) => setFormData({...formData, dlImage: f})} />
                </div>
              </div>
            </div>
          )}

        </div>

        {/* FOOTER */}
        <div className="p-6 border-t border-white/10 bg-zinc-900 flex justify-between items-center shrink-0">
          <Button variant="ghost" onClick={() => step > 1 && setStep(step - 1)} disabled={step === 1} className="text-zinc-400 hover:text-white">
            Back
          </Button>
          
          {step === 1 ? (
            <Button onClick={async () => { if (await validateStep1()) setStep(2); }} disabled={isCheckingID} className="bg-white text-black hover:bg-zinc-200 font-bold px-6">
              Next: Documents <ArrowRight size={16} className="ml-2" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={isLoading} className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-6 shadow-lg shadow-yellow-500/20">
              {isLoading ? <Loader2 className="animate-spin" /> : "Create Customer Profile"}
            </Button>
          )}
        </div>

      </DialogContent>
    </Dialog>
  );
}