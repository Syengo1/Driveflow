"use client";

import { useState, useMemo } from "react";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { 
  Briefcase, MapPin, Clock, ArrowRight, Search, 
  Upload, CheckCircle2, Loader2, Star, Users, Zap, ArrowLeft, X, ArrowDown
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

// --- MOCK JOBS DATA ---
const OPEN_POSITIONS = [
  {
    id: "job-1",
    title: "Fleet Operations Manager",
    department: "Operations",
    location: "Nairobi, Westlands",
    type: "Full-time",
    salary: "Competitive",
    description: "We are looking for an obsessive organizer to manage our fleet of 50+ premium vehicles. You will oversee maintenance schedules, driver rosters, and quality control.",
    requirements: ["5+ years in Logistics", "Valid DL", "Experience with ERP systems"]
  },
  {
    id: "job-2",
    title: "Senior Frontend Engineer",
    department: "Engineering",
    location: "Remote / Hybrid",
    type: "Full-time",
    salary: "KES 250k - 400k",
    description: "Help us build the future of car rental in Africa. You will own the UI/UX of our customer-facing app and admin dashboard.",
    requirements: ["React/Next.js Expert", "Tailwind CSS Mastery", "Eye for design"]
  },
  {
    id: "job-3",
    title: "Executive Chauffeur",
    department: "Fleet",
    location: "Nairobi",
    type: "Contract",
    salary: "Trip-based + Retainer",
    description: "Drive Kenya's VIPs. We need professional, discreet, and highly skilled drivers for our S-Class and Land Cruiser fleet.",
    requirements: ["PSV License", "Clean Record", "Defensive Driving Cert", "Fluent English"]
  },
  {
    id: "job-4",
    title: "Customer Success Specialist",
    department: "Support",
    location: "Nairobi, JKIA",
    type: "Full-time",
    salary: "Competitive",
    description: "Be the face of Driveflow at the airport. Handle handovers, returns, and ensure every client leaves with a smile.",
    requirements: ["Hospitality Background", "Problem Solver", "Willing to work shifts"]
  }
];

export default function CareersPage() {
  const [selectedJob, setSelectedJob] = useState<typeof OPEN_POSITIONS[0] | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDept, setFilterDept] = useState("All");
  
  // Application State
  const [isApplying, setIsApplying] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [resume, setResume] = useState<File | null>(null);

  // --- FILTER LOGIC ---
  const filteredJobs = useMemo(() => {
    return OPEN_POSITIONS.filter(job => {
      const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDept = filterDept === "All" || job.department === filterDept;
      return matchesSearch && matchesDept;
    });
  }, [searchQuery, filterDept]);

  const departments = ["All", ...Array.from(new Set(OPEN_POSITIONS.map(j => j.department)))];

  // --- HANDLER ---
  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    setIsApplying(true);
    // Simulate API
    setTimeout(() => {
      setIsApplying(false);
      setIsSuccess(true);
    }, 1500);
  };

  // Scroll handler
  const scrollToJobs = () => {
    const element = document.getElementById('open-roles');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-white font-sans selection:bg-yellow-500/30 transition-colors duration-300">
      <Navbar />

      {/* --- HERO SECTION --- */}
      {/* CHANGED: min-h-screen + pt-32 md:pt-40 */}
      <section className="relative min-h-screen flex flex-col justify-center items-center overflow-hidden pt-32 md:pt-40 pb-20">
        
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=3200&auto=format&fit=crop"
            alt="Team" 
            className="w-full h-full object-cover grayscale opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-zinc-50/50 to-zinc-50 dark:via-black/50 dark:to-black" />
        </div>

        {/* BACK BUTTON - Correctly Positioned */}
        <div className="absolute top-28 left-6 md:left-12 z-20">
           <Link href="/" className="inline-flex items-center gap-2 text-zinc-500 hover:text-yellow-500 transition-colors text-sm font-bold group">
            <div className="w-8 h-8 rounded-full bg-white/80 dark:bg-black/80 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center group-hover:bg-yellow-500 group-hover:text-black transition-all shadow-sm">
              <ArrowLeft size={16} />
            </div>
            Back Home
          </Link>
        </div>

        <div className="container mx-auto px-6 relative z-10 text-center">
          <Badge className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/50 mb-6 px-4 py-1.5 uppercase tracking-widest text-[10px]">
            We are hiring
          </Badge>
          <h1 className="text-5xl md:text-8xl font-black text-zinc-900 dark:text-white leading-[1.1] mb-6 drop-shadow-xl">
            Drive the <span className="text-yellow-500">Future.</span>
          </h1>
          <p className="text-lg md:text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto mb-12">
            Join the team that is redefining mobility in Africa. We are looking for dreamers, doers, and drivers who want to build world-class experiences.
          </p>

          <Button 
            onClick={scrollToJobs}
            className="h-14 px-8 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-black font-bold text-lg shadow-xl hover:scale-105 transition-transform"
          >
            View Open Positions
          </Button>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce text-zinc-400">
          <ArrowDown size={24} />
        </div>
      </section>

      {/* --- VALUES SECTION --- */}
      <section className="py-20 border-y border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { icon: Zap, title: "Move Fast", text: "We iterate quickly. We don't wait for permission to innovate. Speed is our strategy." },
              { icon: Users, title: "Customer Obsessed", text: "Every line of code and every clean car is for the user. We solve real problems." },
              { icon: Star, title: "Excellence Only", text: "We don't do 'good enough'. We aim for world-class in everything we touch." }
            ].map((val, i) => (
              <div key={i} className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-yellow-500 shrink-0 mb-6">
                  <val.icon size={32} />
                </div>
                <h3 className="font-bold text-xl mb-3">{val.title}</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">{val.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- JOB BOARD --- */}
      <section id="open-roles" className="py-24 bg-zinc-50 dark:bg-black">
        <div className="container mx-auto px-6 max-w-5xl">
          
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4">Open Roles</h2>
            <p className="text-zinc-500">Find your place in our team.</p>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-12 sticky top-24 z-30 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl p-2 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xl">
            <div className="relative w-full md:w-96 group">
              <Search className="absolute left-4 top-3 text-zinc-400 group-focus-within:text-yellow-500 transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="Search roles..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-2.5 rounded-xl bg-transparent outline-none text-sm font-medium text-zinc-900 dark:text-white placeholder:text-zinc-400"
              />
            </div>
            <div className="h-8 w-[1px] bg-zinc-200 dark:bg-zinc-800 hidden md:block" />
            <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 no-scrollbar px-2">
              {departments.map(dept => (
                <button
                  key={dept}
                  onClick={() => setFilterDept(dept)}
                  className={cn(
                    "px-4 py-2 rounded-lg text-xs font-bold border transition-all whitespace-nowrap",
                    filterDept === dept
                      ? "bg-zinc-900 dark:bg-white text-white dark:text-black border-transparent shadow-md"
                      : "bg-transparent border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:border-zinc-400"
                  )}
                >
                  {dept}
                </button>
              ))}
            </div>
          </div>

          {/* Jobs Grid */}
          <div className="grid gap-4">
            {filteredJobs.map((job) => (
              <div 
                key={job.id} 
                className="group bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-8 rounded-3xl hover:border-yellow-500/50 transition-all hover:shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-2xl font-bold text-zinc-900 dark:text-white group-hover:text-yellow-600 dark:group-hover:text-yellow-500 transition-colors">{job.title}</h3>
                    <Badge variant="secondary" className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-normal border-0">
                      {job.type}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-6 text-sm text-zinc-500">
                    <span className="flex items-center gap-2"><Briefcase size={16}/> {job.department}</span>
                    <span className="flex items-center gap-2"><MapPin size={16}/> {job.location}</span>
                    <span className="flex items-center gap-2 text-green-600 dark:text-green-500 font-medium"><DollarSignIcon/> {job.salary}</span>
                  </div>
                </div>
                
                <Button 
                  onClick={() => setSelectedJob(job)}
                  className="bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white hover:bg-yellow-500 hover:text-black border border-zinc-200 dark:border-zinc-700 border-transparent transition-all font-bold px-8 h-12 rounded-xl shrink-0 group-hover:scale-105"
                >
                  Apply Now <ArrowRight size={16} className="ml-2" />
                </Button>
              </div>
            ))}

            {filteredJobs.length === 0 && (
              <div className="text-center py-20">
                <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-4 text-zinc-400">
                  <Search size={24} />
                </div>
                <p className="text-zinc-500">No open positions found matching your criteria.</p>
                <Button onClick={() => {setSearchQuery(""); setFilterDept("All");}} variant="link" className="text-yellow-500">Clear Filters</Button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* --- APPLICATION DRAWER (Same logic, no changes needed) --- */}
      <Sheet open={!!selectedJob} onOpenChange={() => { setSelectedJob(null); setIsSuccess(false); }}>
        <SheetContent className="w-full sm:max-w-2xl border-l border-zinc-800 bg-zinc-50 dark:bg-black text-zinc-900 dark:text-white p-0 flex flex-col h-[100vh] shadow-2xl focus:outline-none [&>button]:hidden">
          
          {selectedJob && (
            <>
              {/* Header */}
              <div className="p-8 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
                <SheetTitle className="text-2xl font-black mb-2">{selectedJob.title}</SheetTitle>
                <div className="flex gap-3 text-sm text-zinc-500">
                  <Badge variant="outline" className="border-yellow-500 text-yellow-600 dark:text-yellow-500">{selectedJob.department}</Badge>
                  <span className="flex items-center gap-1"><MapPin size={14}/> {selectedJob.location}</span>
                </div>
                <button 
                  onClick={() => setSelectedJob(null)}
                  className="absolute top-6 right-6 p-2 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                >
                  <XIcon />
                </button>
              </div>

              {/* Scrollable Body */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
                {isSuccess ? (
                  <div className="h-full flex flex-col items-center justify-center text-center animate-in zoom-in-95">
                    <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center text-green-500 mb-6">
                      <CheckCircle2 size={48} />
                    </div>
                    <h3 className="text-2xl font-bold mb-2">Application Sent!</h3>
                    <p className="text-zinc-500 max-w-xs mx-auto mb-8">
                      Thanks for applying to be a {selectedJob.title}. Our team will review your profile and get back to you shortly.
                    </p>
                    <Button onClick={() => setSelectedJob(null)} variant="outline" className="border-zinc-300 dark:border-zinc-700">
                      Back to Jobs
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-10">
                    {/* Job Details */}
                    <div className="space-y-6">
                      <div>
                        <h4 className="font-bold text-lg mb-2">About the Role</h4>
                        <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">{selectedJob.description}</p>
                      </div>
                      <div>
                        <h4 className="font-bold text-lg mb-2">Requirements</h4>
                        <ul className="list-disc pl-5 space-y-2 text-zinc-600 dark:text-zinc-400">
                          {selectedJob.requirements.map((req, i) => (
                            <li key={i}>{req}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="h-[1px] w-full bg-zinc-200 dark:bg-zinc-800" />

                    {/* Application Form */}
                    <form onSubmit={handleApply} className="space-y-6">
                      <div>
                        <h3 className="text-xl font-bold mb-4">Apply Now</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>First Name</Label>
                            <Input required placeholder="Jane" className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800" />
                          </div>
                          <div className="space-y-2">
                            <Label>Last Name</Label>
                            <Input required placeholder="Doe" className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800" />
                          </div>
                          <div className="space-y-2 col-span-2">
                            <Label>Email</Label>
                            <Input required type="email" placeholder="jane@example.com" className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800" />
                          </div>
                          <div className="space-y-2 col-span-2">
                            <Label>Phone</Label>
                            <Input required placeholder="+254..." className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800" />
                          </div>
                          
                          {/* Resume Dropzone */}
                          <div className="col-span-2 space-y-2">
                            <Label>Resume / CV</Label>
                            <div className="relative border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl p-6 flex flex-col items-center justify-center hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors cursor-pointer group">
                              <input 
                                type="file" 
                                className="absolute inset-0 opacity-0 cursor-pointer" 
                                accept=".pdf,.doc,.docx"
                                onChange={(e) => setResume(e.target.files?.[0] || null)}
                              />
                              {resume ? (
                                <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                                  <CheckCircle2 size={20} />
                                  <span className="font-bold text-sm">{resume.name}</span>
                                </div>
                              ) : (
                                <>
                                  <div className="w-10 h-10 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center text-zinc-400 group-hover:text-yellow-500 mb-2 transition-colors">
                                    <Upload size={20} />
                                  </div>
                                  <p className="text-xs text-zinc-500">Click to upload or drag and drop</p>
                                  <p className="text-[10px] text-zinc-400 mt-1">PDF, DOCX up to 5MB</p>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      <Button disabled={isApplying || !resume} className="w-full h-12 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-xl text-base shadow-lg">
                        {isApplying ? <Loader2 className="animate-spin" /> : "Submit Application"}
                      </Button>
                    </form>
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <Footer />
    </div>
  );
}

// Icons
function DollarSignIcon() { return <span className="font-bold text-xs">KES</span>; }
function XIcon() { return <X size={20} className="text-zinc-500 hover:text-black dark:hover:text-white" />; }