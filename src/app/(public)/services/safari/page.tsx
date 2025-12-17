"use client";

import { useState } from "react";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Compass, Map, Binoculars, Mountain, User, CheckCircle2, 
  Tent, Sun, ShieldCheck, ChevronRight, Phone, ArrowDown, ArrowLeft 
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

// --- MOCK DATA ---
const SAFARI_FLEET = [
  {
    id: "safari-1",
    name: "Land Cruiser V8 (Safari Spec)",
    type: "The Explorer",
    image: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?q=80&w=3200&auto=format&fit=crop",
    price: "KES 18,000",
    features: ["Pop-up Roof", "Fridge", "Off-road Tires", "CB Radio"],
    tag: "Most Popular"
  },
  {
    id: "safari-2",
    name: "Land Cruiser 70 Series",
    type: "The Legend",
    image: "https://images.unsplash.com/photo-1632245889029-e406faaa34cd?q=80&w=3200&auto=format&fit=crop",
    price: "KES 22,000",
    features: ["Double Rooftop Tent", "Water Tank", "Full Kitchen Kit", "Dual Battery"],
    tag: "Camping Ready"
  },
  {
    id: "safari-3",
    name: "Toyota Prado TX",
    type: "The Lightweight",
    image: "https://images.unsplash.com/photo-1594233466680-4600af8a1c96?q=80&w=3200&auto=format&fit=crop",
    price: "KES 12,000",
    features: ["Sunroof", "All-Terrain Tires", "7 Seats", "Economical"],
    tag: "Budget Friendly"
  }
];

const GUIDES = [
  { name: "James K.", exp: "15 Years", lang: "English, Swahili, French", special: "Big 5 Tracking" },
  { name: "Sarah M.", exp: "8 Years", lang: "English, Spanish", special: "Bird Watching" }
];

export default function SafariPage() {
  const [isHovered, setIsHovered] = useState(false);

  // Smooth scroll handler
  const scrollToFleet = () => {
    const element = document.getElementById('safari-fleet');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-white font-sans selection:bg-orange-500/30 transition-colors duration-300">
      <Navbar />

      {/* --- INTERACTIVE HERO (FIXED LAYOUT) --- */}
      {/* CHANGED: min-h-screen instead of h-[90vh] to prevent cutting */}
      {/* ADDED: pt-32 pb-20 to clear navbar and give button space */}
      <section 
        className="relative min-h-screen flex items-center justify-center overflow-hidden cursor-crosshair group pt-32 pb-20"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onTouchStart={() => setIsHovered(true)}
      >
        {/* 1. Grayscale Layer (Background) */}
        <div 
          className={cn(
            "absolute inset-0 z-0 transition-opacity duration-\[1500ms\] ease-in-out",
            isHovered ? "opacity-0" : "opacity-100"
          )}
        >
          <img 
            src="https://images.unsplash.com/photo-1516426122078-c23e76319801?q=80&w=3200&auto=format&fit=crop"
            alt="Safari BW" 
            className="w-full h-full object-cover grayscale contrast-125"
          />
          {/* Stronger overlay for Text Visibility */}
          <div className="absolute inset-0 bg-black/50" /> 
        </div>

        {/* 2. Color Layer (Foreground) */}
        <div 
          className={cn(
            "absolute inset-0 z-0 transition-opacity duration-\[1500ms\] ease-in-out",
            isHovered ? "opacity-100" : "opacity-0"
          )}
        >
           <img 
            src="https://images.unsplash.com/photo-1516426122078-c23e76319801?q=80&w=3200&auto=format&fit=crop"
            alt="Safari Color" 
            className="w-full h-full object-cover scale-105 transition-transform duration-\[10s\]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/50" />
        </div>

        {/* 3. Trigger Zone */}
        <div 
          className="absolute z-20 w-3/4 h-3/4 flex items-center justify-center"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onTouchStart={() => setIsHovered(true)}
        />

        {/* Content */}
        <div className="container mx-auto px-6 relative z-30 text-center pointer-events-none"> 
          
          {/* BACK BUTTON - Absolute positioning */}
          <Link href="/" className="pointer-events-auto absolute top-0 left-1 inline-flex items-center gap-2 text-white/70 hover:text-orange-400 transition-colors text-sm font-bold group">
            <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center group-hover:bg-orange-500 group-hover:text-black transition-all">
              <ArrowLeft size={16} />
            </div>
            Back Home
          </Link>

          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-orange-500/50 bg-orange-500/20 text-orange-400 backdrop-blur-md text-xs font-bold uppercase tracking-widest mb-8 animate-in fade-in slide-in-from-bottom-4">
            <Compass size={14} />
            The Wild Awaits
          </div>
          
          <h1 className="text-5xl md:text-8xl font-black text-white leading-[1.1] mb-6 drop-shadow-2xl">
            Bring the <br />
            Adventure to <span className={cn("transition-colors duration-1000", isHovered ? "text-orange-500" : "text-zinc-400")}>Life.</span>
          </h1>
          
          <p className="text-lg md:text-xl text-zinc-200 max-w-2xl mx-auto mb-12 font-medium drop-shadow-lg">
            {isHovered ? "Explore the Mara in vivid detail." : "Touch to reveal the true colors of Kenya."} <br/>
            Premium 4x4s equipped for the toughest terrains.
          </p>
          
          <div className="pointer-events-auto"> 
            <Button 
              onClick={scrollToFleet}
              className={cn(
                "h-14 px-10 font-black text-lg rounded-full transition-all duration-700 shadow-2xl hover:scale-105",
                isHovered 
                  ? "bg-orange-500 hover:bg-orange-600 text-white border-none shadow-orange-500/30" 
                  : "bg-white text-black hover:bg-zinc-200 border-none"
              )}
            >
              Find Your Beast
            </Button>
          </div>
        </div>
      </section>

      {/* --- THE SAFARI FLEET --- */}
      <section id="safari-fleet" className="py-24 bg-zinc-50 dark:bg-black transition-colors duration-300">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-zinc-900 dark:text-white mb-4">The Safari Fleet</h2>
            <p className="text-zinc-600 dark:text-zinc-400 text-lg max-w-2xl mx-auto">
              These aren't just cars; they are mobile basecamps. Lifted suspension, snorkels, and dual tanks come standard.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {SAFARI_FLEET.map((beast) => (
              <div key={beast.id} className="group relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden hover:shadow-2xl hover:shadow-orange-500/10 transition-all duration-500">
                
                {/* Image */}
                <div className="aspect-[4/3] relative overflow-hidden bg-zinc-100 dark:bg-black">
                  <img 
                    src={beast.image} 
                    alt={beast.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute top-4 left-4">
                    <Badge className="bg-orange-500 text-white border-0 font-bold uppercase tracking-wider text-[10px]">
                      {beast.tag}
                    </Badge>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider mb-1">{beast.type}</p>
                      <h3 className="text-2xl font-bold text-zinc-900 dark:text-white leading-none">{beast.name}</h3>
                    </div>
                    <div className="text-right">
                      <span className="block text-xl font-black text-orange-600 dark:text-orange-500">{beast.price}</span>
                      <span className="text-xs text-zinc-500">/day</span>
                    </div>
                  </div>

                  <div className="space-y-3 mb-8">
                    {beast.features.map((feat) => (
                      <div key={feat} className="flex items-center gap-3 text-sm text-zinc-600 dark:text-zinc-300">
                        <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                        {feat}
                      </div>
                    ))}
                  </div>

                  <Link href={`/fleet?model=${encodeURIComponent(beast.name)}`}>
                    <Button className="w-full bg-zinc-900 dark:bg-white text-white dark:text-black font-bold h-12 rounded-xl hover:bg-orange-600 dark:hover:bg-orange-500 dark:hover:text-white transition-colors group-hover:shadow-lg shadow-orange-500/20">
                        Book This Beast
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- THE GUIDE EXPERIENCE --- */}
      <section className="py-24 bg-white dark:bg-zinc-950 border-y border-zinc-200 dark:border-zinc-800 relative overflow-hidden transition-colors duration-300">
        {/* Texture */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/cubes.png")' }} />

        <div className="container mx-auto px-6 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            
            <div className="lg:w-1/2">
              <Badge variant="outline" className="border-orange-500/50 text-orange-600 dark:text-orange-500 mb-6 px-3 py-1 uppercase tracking-widest text-[10px]">
                Expert Guidance
              </Badge>
              <h2 className="text-4xl md:text-5xl font-black text-zinc-900 dark:text-white mb-6">
                Don't Just Drive.<br />
                <span className="text-orange-500">Learn the Wild.</span>
              </h2>
              <p className="text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed mb-8">
                Navigating the Mara or Tsavo isn't just about driving; it's about knowing where the lions hunt and the elephants migrate. Hire a KPSGA Silver/Gold certified driver-guide with your vehicle.
              </p>
              
              <div className="flex flex-col gap-4">
                {GUIDES.map((guide, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800">
                    <div className="w-12 h-12 rounded-full bg-zinc-200 dark:bg-zinc-900 flex items-center justify-center text-zinc-500">
                      <User size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold text-zinc-900 dark:text-white">{guide.name}</h4>
                      <p className="text-xs text-zinc-500">{guide.exp} Exp • {guide.lang}</p>
                    </div>
                    <Badge className="ml-auto bg-orange-500/10 text-orange-600 dark:text-orange-500 border-0">
                      {guide.special}
                    </Badge>
                  </div>
                ))}
              </div>

              <Link href="/services/chauffeur">
                 <Button className="mt-8 h-12 px-8 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-full shadow-lg shadow-orange-500/20">
                    Add a Guide to Booking
                 </Button>
              </Link>
            </div>

            <div className="lg:w-1/2 relative">
              <div className="relative z-10 rounded-3xl overflow-hidden shadow-2xl border-4 border-white dark:border-zinc-800 transform rotate-2 hover:rotate-0 transition-transform duration-500">
                <img 
                  src="https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?q=80&w=1000&auto=format&fit=crop" 
                  alt="Safari Guide" 
                  className="w-full h-auto"
                />
              </div>
              <div className="absolute -bottom-10 -left-10 z-0 w-full h-full border-4 border-orange-500/20 rounded-3xl" />
            </div>

          </div>
        </div>
      </section>

      {/* --- CTA --- */}
      <section className="py-24 bg-zinc-950 relative overflow-hidden">
        <div className="absolute inset-0">
             <img src="https://images.unsplash.com/photo-1519904981063-b0cf448d479e?q=80&w=3200&auto=format&fit=crop" className="w-full h-full object-cover opacity-20" alt="Safari Landscape" />
             <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />
        </div>
        <div className="container mx-auto px-6 relative z-10 text-center">
          <h2 className="text-4xl font-black text-white mb-6">Ready for the Great Migration?</h2>
          <p className="text-zinc-400 max-w-xl mx-auto mb-10">
            Book your 4x4 today and get a free "Safari Essentials" kit with every rental over 5 days.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/fleet">
                <Button className="h-14 px-10 bg-white text-black hover:bg-zinc-200 font-bold rounded-full text-lg">
                Start Booking
                </Button>
            </Link>
            <a href="tel:+254700000000">
                <Button variant="outline" className="h-14 px-10 border-zinc-700 text-white hover:bg-white/10 font-medium rounded-full gap-2">
                <Phone size={18} /> Talk to an Expert
                </Button>
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}