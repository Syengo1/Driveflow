"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Briefcase, Search, MapPin, Users, Plus, 
  MoreHorizontal, Pencil, Trash2, Globe, EyeOff 
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import JobEditorSheet, { JobPosting } from "@/components/admin/careers/JobEditorSheet";
import { cn } from "@/lib/utils";

export default function CareersPage() {
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingJob, setEditingJob] = useState<JobPosting | null>(null);

  // --- FETCH DATA ---
  const fetchJobs = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('careers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error("Failed to load jobs");
    } else {
      setJobs(data as JobPosting[]);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // --- ACTIONS ---
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure? This will remove the job permanently.")) return;
    
    const { error } = await supabase.from('careers').delete().eq('id', id);
    if (!error) {
      setJobs(prev => prev.filter(j => j.id !== id));
      toast.success("Job deleted successfully");
    } else {
      toast.error("Delete failed");
    }
  };

  const handleStatusToggle = async (job: JobPosting) => {
    const newStatus = job.status === 'active' ? 'closed' : 'active';
    const { error } = await supabase.from('careers').update({ status: newStatus }).eq('id', job.id);
    
    if (!error) {
      fetchJobs(); // Refresh to ensure sync
      toast.success(`Job marked as ${newStatus}`);
    }
  };

  // --- FILTERING ---
  const filteredJobs = jobs.filter(j => 
    j.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    j.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Careers Portal</h1>
          <p className="text-zinc-400 text-sm mt-1">Manage open positions and track applicants.</p>
        </div>
        <div className="flex gap-2">
           {/* Stats Capsules */}
           <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl">
              <span className="text-xs text-zinc-500 uppercase font-bold">Active Jobs</span>
              <span className="text-green-500 font-mono font-bold text-lg">{jobs.filter(j => j.status === 'active').length}</span>
           </div>
           
           <JobEditorSheet 
             onSave={fetchJobs} 
             trigger={
               <Button className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold shadow-lg shadow-yellow-500/20 gap-2">
                 <Plus size={18} /> Post Job
               </Button>
             } 
           />
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-3 text-zinc-500" size={18} />
        <Input 
          placeholder="Search by Title or Department..." 
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="pl-10 bg-zinc-900/50 border-zinc-800 h-11 rounded-xl focus:border-yellow-500/50"
        />
      </div>

      {/* Job Grid */}
      {isLoading ? (
        <div className="text-center py-20 text-zinc-500">Loading jobs...</div>
      ) : filteredJobs.length === 0 ? (
        <div className="text-center py-20 bg-zinc-900/30 rounded-xl border border-dashed border-zinc-800">
          <Briefcase className="mx-auto h-10 w-10 text-zinc-600 mb-2" />
          <p className="text-zinc-500">No jobs found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredJobs.map((job) => (
            <div key={job.id} className="glass-panel p-6 rounded-xl border border-zinc-800 hover:border-zinc-700 transition-all group flex flex-col justify-between">
              
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 group-hover:text-yellow-500 transition-colors">
                    <Briefcase size={20} />
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="text-zinc-500 hover:text-white p-1 rounded-md hover:bg-zinc-800"><MoreHorizontal size={20}/></button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800 text-white">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator className="bg-zinc-800" />
                      <DropdownMenuItem onClick={() => setEditingJob(job)} className="cursor-pointer hover:bg-zinc-800">
                        <Pencil size={14} className="mr-2" /> Edit Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleStatusToggle(job)} className="cursor-pointer hover:bg-zinc-800">
                        {job.status === 'active' ? <><EyeOff size={14} className="mr-2"/> Close Job</> : <><Globe size={14} className="mr-2"/> Publish Live</>}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDelete(job.id!)} className="text-red-400 cursor-pointer hover:bg-red-500/10">
                        <Trash2 size={14} className="mr-2" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <h3 className="font-bold text-lg text-white mb-1 line-clamp-1">{job.title}</h3>
                <p className="text-sm text-zinc-400 mb-4">{job.department}</p>

                <div className="flex flex-wrap gap-2 mb-6">
                  <Badge variant="outline" className="border-zinc-700 text-zinc-400 bg-zinc-900/50">
                    <MapPin size={10} className="mr-1" /> {job.location}
                  </Badge>
                  <Badge variant="outline" className={cn("border-zinc-700", job.type === 'Full-time' ? "text-blue-400 bg-blue-500/10" : "text-purple-400 bg-purple-500/10")}>
                    {job.type}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
                <div className="flex items-center gap-2">
                  <Users size={14} className="text-zinc-500" />
                  <span className="text-sm text-zinc-300 font-mono">{job.applicants_count || 0} <span className="text-zinc-500 text-xs">Applicants</span></span>
                </div>
                <Badge className={cn("capitalize", 
                  job.status === 'active' ? "bg-green-500 text-black hover:bg-green-400" : 
                  job.status === 'closed' ? "bg-red-500/20 text-red-400" : 
                  "bg-zinc-700 text-zinc-300"
                )}>
                  {job.status}
                </Badge>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Edit Sheet (Controlled State) */}
      <JobEditorSheet 
        isOpen={!!editingJob} 
        onClose={() => setEditingJob(null)} 
        jobToEdit={editingJob} 
        onSave={fetchJobs} 
      />

    </div>
  );
}