"use client";

import { useParams } from "next/navigation";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle2, MapPin, Calendar, Download, 
  UserPlus, ArrowRight, Car, ShieldCheck 
} from "lucide-react";
import Link from "next/link";

export default function GuestStatusPage() {
  const params = useParams();
  const bookingId = params.id;

  // --- MOCK DATA (In real app, fetch by bookingId) ---
  const BOOKING = {
    id: bookingId,
    carName: "Toyota Land Cruiser Prado",
    image: "https://images.unsplash.com/photo-1519245659620-e859806a8d3b?auto=format&fit=crop&w=1200",
    dates: "Nov 25 - Nov 28",
    location: "Westlands Hub",
    status: "Confirmed"
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-white font-sans selection:bg-yellow-500/30">
      <Navbar />

      <div className="pt-32 pb-20 container mx-auto px-6 max-w-4xl">
        
        {/* SUCCESS HEADER */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center text-green-500 mx-auto mb-6 animate-in zoom-in">
            <CheckCircle2 size={40} />
          </div>
          <h1 className="text-4xl font-black mb-2">Booking Confirmed!</h1>
          <p className="text-zinc-500 text-lg">
            Your booking reference is <span className="font-mono font-bold text-zinc-900 dark:text-white">{BOOKING.id}</span>
          </p>
        </div>

        {/* THE "TICKET" CARD */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-2xl relative">
          {/* Top: Car Visual */}
          <div className="h-64 relative">
            <img src={BOOKING.image} className="w-full h-full object-cover" alt="Car" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent" />
            <div className="absolute bottom-6 left-6">
              <Badge className="bg-green-500 text-white border-0 mb-2">Ready for Pickup</Badge>
              <h2 className="text-3xl font-bold text-white">{BOOKING.carName}</h2>
            </div>
          </div>

          {/* Bottom: Details */}
          <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="space-y-4">
                <div className="flex items-start gap-3">
                   <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500">
                      <Calendar size={20} />
                   </div>
                   <div>
                      <p className="text-xs font-bold text-zinc-500 uppercase">Schedule</p>
                      <p className="font-medium">{BOOKING.dates}</p>
                   </div>
                </div>
                <div className="flex items-start gap-3">
                   <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500">
                      <MapPin size={20} />
                   </div>
                   <div>
                      <p className="text-xs font-bold text-zinc-500 uppercase">Pickup Location</p>
                      <p className="font-medium">{BOOKING.location}</p>
                   </div>
                </div>
             </div>

             <div className="flex flex-col justify-center gap-3">
                <Button variant="outline" className="w-full h-12 border-zinc-300 dark:border-zinc-700">
                   <Download size={18} className="mr-2" /> Download Receipt
                </Button>
                <Button variant="outline" className="w-full h-12 border-zinc-300 dark:border-zinc-700">
                   <MapPin size={18} className="mr-2" /> Get Directions
                </Button>
             </div>
          </div>

          {/* THE UPSELL (Account Creation) */}
          <div className="bg-yellow-500/10 border-t border-yellow-500/20 p-6 flex flex-col md:flex-row items-center justify-between gap-4">
             <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-yellow-500 text-black flex items-center justify-center font-bold">
                   <UserPlus size={24} />
                </div>
                <div>
                   <h4 className="font-bold text-lg">Don't lose this booking</h4>
                   <p className="text-sm text-zinc-600 dark:text-zinc-400">Create an account to save your ID and skip verification next time.</p>
                </div>
             </div>
             <Link href="/auth/signup">
                <Button className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold shadow-lg whitespace-nowrap">
                   Create Account <ArrowRight size={18} className="ml-2" />
                </Button>
             </Link>
          </div>

        </div>

      </div>
      <Footer />
    </div>
  );
}