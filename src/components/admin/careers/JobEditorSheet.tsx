"use client";

import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Briefcase, MapPin, DollarSign, Plus, X, Loader2, Save, Send } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export interface JobPosting {
  id?: string;
  title: string;
  department: string;
  location: string;
  type: string;
  salary_range: string;
  description: string;
  requirements: string[];
  status: 'active' | 'draft' | 'closed';
  applicants_count?: number;
}

const INITIAL_JOB: JobPosting = {
  title: "", department: "", location: "Nairobi, Kenya", 
  type: "Full-time", salary_range: "", description: "", 
  requirements: [], status: "draft"
};

interface Props {
  jobToEdit?: JobPosting | null;
  trigger?: React.ReactNode;
  onSave: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export default function JobEditorSheet({ jobToEdit, trigger, onSave, isOpen: externalOpen, onClose }: Props) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = typeof externalOpen !== "undefined";
  const isOpen = isControlled ? externalOpen : internalOpen;
  
  const [formData, setFormData] = useState<JobPosting>(INITIAL_JOB);
  const [newReq, setNewReq] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Hydrate form on Edit
  useEffect(() => {
    if (isOpen) {
      setFormData(jobToEdit ? { ...jobToEdit } : INITIAL_JOB);
      setNewReq("");
    }
  }, [isOpen, jobToEdit]);

  // --- HANDLERS ---
  const handleOpenChange = (open: boolean) => {
    if (isControlled && onClose) onClose();
    else setInternalOpen(open);
  };

  const addRequirement = () => {
    if (!newReq.trim()) return;
    setFormData(prev => ({ ...prev, requirements: [...prev.requirements, newReq.trim()] }));
    setNewReq("");
  };

  const removeRequirement = (index: number) => {
    setFormData(prev => ({
      ...prev,
      requirements: prev.requirements.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (targetStatus: 'active' | 'draft') => {
    if (!formData.title || !formData.description) {
      toast.error("Missing Fields", { description: "Title and Description are required." });
      return;
    }

    setIsLoading(true);
    try {
      const payload = { ...formData, status: targetStatus };
      
      // Remove ID from payload for insert/update to avoid issues
      const { id, ...dbData } = payload; 

      let error;
      
      if (jobToEdit?.id) {
        // UPDATE
        const res = await supabase.from('careers').update(dbData).eq('id', jobToEdit.id);
        error = res.error;
      } else {
        // CREATE
        const res = await supabase.from('careers').insert(dbData);
        error = res.error;
      }

      if (error) throw error;

      toast.success(targetStatus === 'active' ? "Job Published Live" : "Draft Saved");
      onSave();
      handleOpenChange(false);

    } catch (err: any) {
      console.error(err);
      toast.error("Operation Failed", { description: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      {trigger && <SheetTrigger asChild>{trigger}</SheetTrigger>}
      <SheetContent className="w-full sm:max-w-xl border-l border-zinc-800 bg-zinc-950 text-white p-0 flex flex-col h-[100vh]">
        
        <SheetHeader className="p-6 border-b border-zinc-800 bg-zinc-900">
          <SheetTitle className="text-xl font-bold text-white flex items-center gap-2">
            <Briefcase className="text-yellow-500" /> 
            {jobToEdit ? "Edit Position" : "Post New Job"}
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          
          {/* Section 1: Key Details */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-zinc-400">Job Title</Label>
              <Input 
                value={formData.title} 
                onChange={e => setFormData({...formData, title: e.target.value})}
                placeholder="e.g. Senior Fleet Manager" 
                className="bg-zinc-900 border-zinc-800 focus:border-yellow-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-zinc-400">Department</Label>
                <Select value={formData.department} onValueChange={v => setFormData({...formData, department: v})}>
                  <SelectTrigger className="bg-zinc-900 border-zinc-800"><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                    {["Operations", "Engineering", "Marketing", "Support", "Finance"].map(d => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-400">Employment Type</Label>
                <Select value={formData.type} onValueChange={v => setFormData({...formData, type: v})}>
                  <SelectTrigger className="bg-zinc-900 border-zinc-800"><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                    {["Full-time", "Part-time", "Contract", "Internship"].map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                  <Label className="text-zinc-400">Location</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-2.5 text-zinc-500" size={16} />
                    <Input 
                      value={formData.location} 
                      onChange={e => setFormData({...formData, location: e.target.value})}
                      className="pl-10 bg-zinc-900 border-zinc-800" 
                    />
                  </div>
               </div>
               <div className="space-y-2">
                  <Label className="text-zinc-400">Salary Range</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-2.5 text-zinc-500" size={16} />
                    <Input 
                      value={formData.salary_range} 
                      onChange={e => setFormData({...formData, salary_range: e.target.value})}
                      placeholder="e.g. 50k - 80k"
                      className="pl-10 bg-zinc-900 border-zinc-800" 
                    />
                  </div>
               </div>
            </div>
          </div>

          {/* Section 2: Description */}
          <div className="space-y-2">
            <Label className="text-zinc-400">Job Description</Label>
            <Textarea 
              value={formData.description} 
              onChange={e => setFormData({...formData, description: e.target.value})}
              className="bg-zinc-900 border-zinc-800 min-h-[150px] leading-relaxed" 
              placeholder="Describe the role, responsibilities, and culture..."
            />
          </div>

          {/* Section 3: Requirements Builder */}
          <div className="space-y-3">
            <Label className="text-zinc-400">Requirements / Skills</Label>
            <div className="flex gap-2">
              <Input 
                value={newReq} 
                onChange={e => setNewReq(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addRequirement()}
                placeholder="Type a skill and press Enter..." 
                className="bg-zinc-900 border-zinc-800"
              />
              <Button onClick={addRequirement} variant="secondary"><Plus size={18} /></Button>
            </div>
            
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.requirements.map((req, idx) => (
                <div key={idx} className="bg-zinc-800 text-zinc-300 text-xs px-3 py-1.5 rounded-full flex items-center gap-2 group animate-in zoom-in">
                  {req}
                  <button onClick={() => removeRequirement(idx)} className="hover:text-white"><X size={12} /></button>
                </div>
              ))}
              {formData.requirements.length === 0 && <p className="text-xs text-zinc-600 italic">No requirements added yet.</p>}
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-zinc-800 bg-zinc-900 flex justify-between">
           <Button variant="ghost" onClick={() => handleOpenChange(false)} className="text-zinc-400 hover:text-white">Cancel</Button>
           <div className="flex gap-3">
             <Button onClick={() => handleSubmit('draft')} variant="outline" disabled={isLoading} className="border-zinc-700 text-zinc-300">
               <Save size={16} className="mr-2" /> Save Draft
             </Button>
             <Button onClick={() => handleSubmit('active')} disabled={isLoading} className="bg-yellow-500 text-black hover:bg-yellow-400 font-bold">
               {isLoading ? <Loader2 className="animate-spin" /> : <><Send size={16} className="mr-2" /> Publish Live</>}
             </Button>
           </div>
        </div>

      </SheetContent>
    </Sheet>
  );
}