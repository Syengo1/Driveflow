"use client";

import { useState } from "react";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  User, Shield, Clock, MapPin, Star, CheckCircle2, 
  Plane, Briefcase, Crown, ArrowRight, Phone, ArrowLeft 
} from "lucide-react";
import Link from "next/link";

// --- MOCK DATA ---
const SERVICE_TIERS = [
  {
    id: "airport",
    title: "Airport Transfer",
    icon: Plane,
    description: "Seamless pickup from JKIA or Wilson Airport. Flight tracking included.",
    price: "KES 5,000",
    unit: "per trip",
    features: ["60 min wait time", "Meet & Greet", "Flight Tracking", "Luggage Assistance"]
  },
  {
    id: "hourly",
    title: "Hourly Charter",
    icon: Clock,
    description: "Complete flexibility for business meetings or city errands.",
    price: "KES 3,500",
    unit: "per hour",
    features: ["Min. 4 hours", "Unlimited Stops", "In-car Wi-Fi", "Refreshments"]
  },
  {
    id: "safari",
    title: "Safari Guide",
    icon: MapPin,
    description: "Expert driver-guides for long-distance tours and game drives.",
    price: "KES 12,000",
    unit: "per day",
    features: ["KPSGA Certified", "Off-road Expert", "10 Hours/Day", "Accommodation Excl."]
  }
];

const CHAUFFEUR_FLEET = [
  { id: 1, name: "Mercedes-Benz S-Class", type: "First Class", image: "https://images.unsplash.com/photo-1622199465467-62a3e4c8f55c?q=80&w=1000&auto=format&fit=crop" },
  { id: 2, name: "Toyota Land Cruiser V8", type: "Safari / VIP", image: "https://images.unsplash.com/photo-1594233466680-4600af8a1c96?q=80&w=1000&auto=format&fit=crop" },
  { id: 3, name: "Toyota Alphard", type: "Business Van", image: "https://images.unsplash.com/photo-1609520505218-7421eb341eb3?q=80&w=1000&auto=format&fit=crop" },
];

export default function ChauffeurPage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-white font-sans selection:bg-yellow-500/30 transition-colors duration-300">
      <Navbar />

      {/* --- HERO SECTION (FIXED LAYOUT) --- */}
      {/* Changed h-[90vh] to min-h-screen. Added pb-20 to ensure bottom spacing. */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pb-20 pt-32">
        
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?q=80&w=3200&auto=format&fit=crop"
            alt="Chauffeur Service" 
            className="w-full h-full object-cover"
          />
          {/* Stronger Gradient for Light Mode readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-black/40 dark:to-transparent" />
        </div>

        <div className="container mx-auto px-6 relative z-10">
          
          {/* Back Button (Absolute positioning relative to container, ensures it's always top left of content) */}
          <Link href="/" className="absolute -top-0 left-1 md:left-6 inline-flex items-center gap-2 text-white/70 hover:text-yellow-400 transition-colors text-sm font-bold group">
            <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center group-hover:bg-yellow-500 group-hover:text-black transition-all">
              <ArrowLeft size={16} />
            </div>
            Back Home
          </Link>

          <div className="max-w-3xl mt-10 md:mt-0">
            <Badge className="bg-yellow-500 text-black border-0 mb-8 mt-12 px-4 py-1.5 uppercase tracking-widest text-[11px] font-bold shadow-lg shadow-yellow-500/20 inline-flex">
              Premium Service
            </Badge>
            
            {/* Hero Text */}
            <h1 className="text-5xl md:text-7xl font-black text-white leading-[1.1] mb-6 drop-shadow-xl">
              Sit Back.<br />
              We'll Handle the <span className="text-yellow-500">Drive.</span>
            </h1>
            
            <p className="text-lg md:text-xl text-zinc-200 mb-10 leading-relaxed max-w-xl font-medium drop-shadow-md">
              Experience Nairobi in the backseat of luxury. Professional, vetted chauffeurs for your business meetings, airport transfers, and safari adventures.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button className="h-14 px-8 bg-white text-black hover:bg-zinc-200 font-bold text-base rounded-full shadow-xl transition-transform hover:scale-105">
                Book a Chauffeur
              </Button>
              <Button variant="outline" className="h-14 px-8 border-white/30 text-white hover:bg-white/10 hover:border-white font-medium text-base rounded-full backdrop-blur-sm">
                View Corporate Rates
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* --- VALUE PROP (Floating Cards) --- */}
      {/* Changed -mt-20 to simple py-20 to avoid overlap issues on mobile */}
      <section className="py-20 bg-zinc-50 dark:bg-black border-b border-zinc-200 dark:border-zinc-900">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 -mt-32 relative z-20">
            {[
              { icon: Shield, title: "Vetted Professionals", text: "Every driver undergoes background checks and defensive driving training." },
              { icon: Clock, title: "Always On Time", text: "We guarantee punctuality. 15-minute complimentary wait time included." },
              { icon: Crown, title: "VIP Treatment", text: "Door opening, luggage assistance, and complete discretion assured." }
            ].map((item, i) => (
              <div key={i} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-8 rounded-3xl shadow-2xl shadow-zinc-200/50 dark:shadow-none hover:transform hover:-translate-y-2 transition-all duration-300">
                <div className="w-14 h-14 bg-yellow-500/10 rounded-2xl flex items-center justify-center text-yellow-600 dark:text-yellow-500 mb-6">
                  <item.icon size={28} />
                </div>
                <h3 className="text-xl font-bold mb-2 text-zinc-900 dark:text-white">{item.title}</h3>
                <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- SERVICE TIERS --- */}
      <section className="py-24 bg-white dark:bg-zinc-950">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4 text-zinc-900 dark:text-white">Tailored Services</h2>
            <p className="text-zinc-600 dark:text-zinc-400 text-lg">Choose the package that fits your itinerary.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {SERVICE_TIERS.map((tier) => (
              <div key={tier.id} className="group relative bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 hover:border-yellow-500/50 transition-all hover:shadow-2xl hover:shadow-yellow-500/5">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="flex justify-between items-start mb-6">
                  <div className="p-3 bg-white dark:bg-zinc-800 rounded-xl shadow-sm">
                    <tier.icon size={24} className="text-zinc-900 dark:text-white" />
                  </div>
                  <Badge variant="outline" className="border-zinc-300 dark:border-zinc-700 text-zinc-500 uppercase tracking-wider text-[10px]">
                    {tier.id}
                  </Badge>
                </div>

                <h3 className="text-2xl font-bold mb-2 text-zinc-900 dark:text-white">{tier.title}</h3>
                <p className="text-zinc-600 dark:text-zinc-400 text-sm mb-6 min-h-[40px]">{tier.description}</p>

                <div className="mb-8 p-4 bg-white dark:bg-black rounded-xl border border-zinc-100 dark:border-zinc-800">
                  <span className="text-3xl font-black text-zinc-900 dark:text-white">{tier.price}</span>
                  <span className="text-zinc-500 text-sm ml-1">/ {tier.unit}</span>
                </div>

                <ul className="space-y-3 mb-8">
                  {tier.features.map((feat) => (
                    <li key={feat} className="flex items-center gap-3 text-sm text-zinc-700 dark:text-zinc-300">
                      <CheckCircle2 size={16} className="text-yellow-500 shrink-0" />
                      {feat}
                    </li>
                  ))}
                </ul>

                <Button className="w-full bg-zinc-900 dark:bg-white text-white dark:text-black font-bold h-12 rounded-xl hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all">
                  Book {tier.title}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- MEET THE FLEET --- */}
      <section className="py-24 bg-zinc-50 dark:bg-black border-y border-zinc-200 dark:border-zinc-900">
        <div className="container mx-auto px-6 flex flex-col lg:flex-row items-center gap-12">
          <div className="lg:w-1/2">
            <h2 className="text-4xl font-black mb-6 text-zinc-900 dark:text-white">The Chauffeur Fleet</h2>
            <p className="text-zinc-600 dark:text-zinc-400 text-lg leading-relaxed mb-8">
              Our chauffeur service isn't just about the driver; it's about the machine. We strictly use high-spec, immaculate vehicles designed for rear-seat comfort.
            </p>
            <ul className="space-y-4 mb-8">
              <li className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-white dark:bg-zinc-900 flex items-center justify-center text-yellow-600 dark:text-yellow-500 shadow-sm"><Briefcase size={20}/></div>
                <div>
                  <h4 className="font-bold text-zinc-900 dark:text-white">Executive Sedans</h4>
                  <p className="text-sm text-zinc-500">Mercedes C & E Class for city business.</p>
                </div>
              </li>
              <li className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-white dark:bg-zinc-900 flex items-center justify-center text-yellow-600 dark:text-yellow-500 shadow-sm"><Crown size={20}/></div>
                <div>
                  <h4 className="font-bold text-zinc-900 dark:text-white">VIP SUVs</h4>
                  <p className="text-sm text-zinc-500">Land Cruiser V8 & Prado for presence & power.</p>
                </div>
              </li>
            </ul>
            <Link href="/fleet">
              <Button variant="outline" className="border-zinc-300 dark:border-zinc-700 h-12 px-8 rounded-full text-zinc-900 dark:text-white hover:bg-white dark:hover:bg-zinc-900 bg-white dark:bg-transparent">
                View All Vehicles
              </Button>
            </Link>
          </div>

          <div className="lg:w-1/2 grid gap-6">
            {CHAUFFEUR_FLEET.map((car) => (
              <div key={car.id} className="flex items-center gap-6 p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-yellow-500/30 transition-colors group cursor-pointer shadow-sm hover:shadow-md">
                <div className="w-32 h-20 rounded-lg overflow-hidden relative bg-zinc-100 dark:bg-black">
                  <img src={car.image} alt={car.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                </div>
                <div>
                  <p className="text-xs font-bold text-yellow-600 dark:text-yellow-500 uppercase tracking-wider mb-1">{car.type}</p>
                  <h4 className="font-bold text-lg text-zinc-900 dark:text-white">{car.name}</h4>
                </div>
                <div className="ml-auto">
                  <div className="w-10 h-10 rounded-full border border-zinc-200 dark:border-zinc-800 flex items-center justify-center group-hover:bg-yellow-500 group-hover:text-black transition-all text-zinc-400">
                    <ArrowRight size={18} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- CTA: CORPORATE --- */}
      <section className="py-24 bg-zinc-100 dark:bg-zinc-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 dark:opacity-20">
            <img src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=3200&auto=format&fit=crop" alt="Corporate" className="w-full h-full object-cover grayscale" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-100 via-zinc-100/90 to-transparent dark:from-black dark:via-black/80" />
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-2xl">
            <h2 className="text-4xl md:text-5xl font-black text-zinc-900 dark:text-white mb-6">Corporate Accounts</h2>
            <p className="text-xl text-zinc-600 dark:text-zinc-300 mb-8">
              Streamline your company's transport needs. Monthly billing, priority booking, and detailed reporting for businesses.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button className="h-14 px-8 bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-base rounded-full shadow-lg transition-transform hover:scale-105">
                Open Corporate Account
              </Button>
              <Button variant="outline" className="h-14 px-8 border-zinc-400 dark:border-zinc-700 text-zinc-900 dark:text-white hover:bg-white/50 dark:hover:bg-white/10 font-medium text-base rounded-full gap-2">
                <Phone size={18} /> Contact Sales
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}