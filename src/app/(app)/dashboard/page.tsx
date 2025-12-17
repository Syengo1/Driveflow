"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Car, Calendar, MapPin, Clock, ShieldCheck, 
  CreditCard, History, ChevronRight, Star, AlertTriangle, Download, CheckCircle2, Copy 
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import ExtendTripWizard from "@/components/site/dashboard/ExtendTripWizard"; 
import ReportIssueWizard from "@/components/site/dashboard/ReportIssueWizard"; 
import { toast } from "sonner";

// --- MOCK USER DATA ---
const USER = {
  name: "John Kamau",
  tier: "Silver Member",
  points: 450,
  verificationStatus: "verified",
  referralCode: "JOHN-8821",
  activeTrip: {
    id: "TRIP-8821",
    car: "Toyota Land Cruiser Prado",
    plate: "KCD 123X",
    image: "https://images.unsplash.com/photo-1519245659620-e859806a8d3b?auto=format&fit=crop&w=800",
    startDate: "2025-11-25",
    endDate: "2025-11-28",
    status: "active", 
    pickup: "Westlands Hub",
    dailyRate: 15000
  },
  history: [
    { id: "TRIP-7710", car: "Mercedes C200", date: "10 Oct 2025", cost: "KES 24,000", status: "Completed" },
    { id: "TRIP-6602", car: "Mazda Demio", date: "12 Aug 2025", cost: "KES 8,000", status: "Completed" },
  ]
};

export default function UserDashboard() {
  const [activeTab, setActiveTab] = useState("overview");

  // --- ACTIONS ---
  const handleCopyReferral = () => {
    navigator.clipboard.writeText(`https://driveflow.co.ke/invite/${USER.referralCode}`);
    toast.success("Referral Link Copied!", {
      description: "Share it with friends to earn credits.",
    });
  };

  const handleDownloadReceipt = (tripId: string) => {
    toast.info("Downloading Receipt...", { duration: 2000 });
    // Simulate download delay
    setTimeout(() => {
       const receiptText = `DRIVEFLOW RECEIPT\nTrip: ${tripId}\nDate: ${new Date().toISOString()}`;
       const blob = new Blob([receiptText], { type: "text/plain" });
       const url = URL.createObjectURL(blob);
       const a = document.createElement("a");
       a.href = url;
       a.download = `Receipt_${tripId}.txt`;
       a.click();
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-white font-sans selection:bg-yellow-500/30 transition-colors duration-300">
      
      <div className="pt-10 pb-20 container mx-auto px-6 max-w-6xl">
        
        {/* --- HEADER --- */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6 animate-in fade-in slide-in-from-top-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-14 h-14 rounded-2xl bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-xl font-bold text-zinc-600 dark:text-zinc-400 border border-zinc-300 dark:border-zinc-700 shadow-sm">
                {USER.name.charAt(0)}
              </div>
              <div>
                <h1 className="text-4xl font-black text-zinc-900 dark:text-white tracking-tight">Hello, {USER.name.split(" ")[0]}</h1>
                <div className="flex items-center gap-2 text-sm text-zinc-500 mt-1">
                  <Badge variant="outline" className="border-yellow-500 text-yellow-600 dark:text-yellow-500 bg-yellow-500/10 px-2 py-0.5">{USER.tier}</Badge>
                  <span className="text-zinc-300">•</span>
                  <span className="flex items-center gap-1 text-green-600 dark:text-green-500 font-medium"><ShieldCheck size={14}/> Verified</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="px-5 py-2 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex flex-col items-end shadow-sm">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Available Points</span>
              <span className="text-2xl font-black text-yellow-500">{USER.points}</span>
            </div>
            <Link href="/fleet">
              <Button className="h-full px-8 bg-zinc-900 dark:bg-white text-white dark:text-black font-bold rounded-2xl shadow-lg hover:scale-105 transition-transform text-base">
                Book New Trip
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* --- LEFT COLUMN: MAIN CONTENT --- */}
          <div className="lg:col-span-2 space-y-10">
            
            {/* ACTIVE TRIP CARD */}
            {USER.activeTrip ? (
              <div className="group relative overflow-hidden rounded-[2rem] bg-zinc-900 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl text-white animate-in fade-in zoom-in-95">
                {/* Background Image */}
                <div className="absolute inset-0 z-0">
                  <img src={USER.activeTrip.image} className="w-full h-full object-cover opacity-50 group-hover:scale-105 transition-transform duration-700" alt="Active Car" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
                </div>

                <div className="relative z-10 p-8">
                  <div className="flex justify-between items-start mb-24">
                    <Badge className="bg-green-500 text-white border-0 animate-pulse px-3 py-1 shadow-lg shadow-green-500/20">Live Rental</Badge>
                    <div className="text-right bg-black/40 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10">
                      <p className="text-[10px] text-zinc-300 uppercase font-bold tracking-wider">Return Due</p>
                      <p className="text-xl font-mono font-bold text-white">{new Date(USER.activeTrip.endDate).toLocaleDateString('en-GB', {day: 'numeric', month: 'short'})}</p>
                    </div>
                  </div>

                  <div>
                    <h2 className="text-3xl font-black mb-1">{USER.activeTrip.car}</h2>
                    <p className="text-zinc-300 font-mono text-sm mb-6 flex items-center gap-2">
                       <span className="bg-white/10 px-2 py-1 rounded text-white">{USER.activeTrip.plate}</span> • {USER.activeTrip.pickup}
                    </p>
                    
                    <div className="flex flex-wrap gap-3">
                      <ExtendTripWizard 
                        trip={{
                          id: USER.activeTrip.id,
                          carName: USER.activeTrip.car,
                          plate: USER.activeTrip.plate,
                          currentEndDate: USER.activeTrip.endDate,
                          dailyRate: USER.activeTrip.dailyRate 
                        }}
                        onExtendConfirm={(newDate) => toast.success(`Trip extended to ${newDate}`)}
                        trigger={
                          <Button className="bg-white text-black hover:bg-zinc-200 font-bold rounded-xl h-12 px-6 shadow-lg transition-transform hover:scale-105">
                            Extend Trip
                          </Button>
                        }
                      />

                      <ReportIssueWizard 
                        tripId={USER.activeTrip.id}
                        trigger={
                          <Button variant="outline" className="border-white/20 bg-black/20 backdrop-blur-sm text-white hover:bg-white/10 hover:border-white/40 rounded-xl h-12 px-6 gap-2">
                            <AlertTriangle size={16} /> Report Issue
                          </Button>
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
               <div className="flex flex-col items-center justify-center py-20 text-center bg-white dark:bg-zinc-900 rounded-[2rem] border border-dashed border-zinc-300 dark:border-zinc-800">
                  <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 mb-4">
                    <Car size={32} />
                  </div>
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-1">No active trips</h3>
                  <p className="text-zinc-500 max-w-xs mx-auto mb-6">Ready for your next adventure?</p>
                  <Link href="/fleet">
                    <Button className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-full px-8">Start Booking</Button>
                  </Link>
               </div>
            )}

            {/* HISTORY SECTION */}
            <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-6 flex items-center gap-2">
                <History className="text-yellow-500" /> Recent History
              </h3>
              <div className="space-y-4">
                {USER.history.map((trip) => (
                  <div key={trip.id} className="flex items-center justify-between p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl hover:border-yellow-500/50 hover:shadow-lg transition-all group">
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-black flex items-center justify-center text-zinc-400 group-hover:text-yellow-500 group-hover:bg-yellow-500/10 transition-colors">
                        <Car size={24} />
                      </div>
                      <div>
                        <h4 className="font-bold text-zinc-900 dark:text-white text-lg">{trip.car}</h4>
                        <p className="text-xs text-zinc-500 font-mono mt-0.5">{trip.date} • {trip.status}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-zinc-900 dark:text-white text-lg">{trip.cost}</p>
                      <button 
                        onClick={() => handleDownloadReceipt(trip.id)}
                        className="text-xs text-yellow-600 dark:text-yellow-500 font-bold hover:underline flex items-center gap-1 justify-end mt-1"
                      >
                        <Download size={12} /> Receipt
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* --- RIGHT COLUMN: QUICK ACTIONS --- */}
          <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-700">
            
            {/* Account Status */}
            <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] shadow-sm">
              <h3 className="font-bold text-lg text-zinc-900 dark:text-white mb-6">Verification Status</h3>
              
              <div className="space-y-3">
                {[
                  { label: "ID Card", icon: CreditCard },
                  { label: "Driver's License", icon: Car },
                  { label: "Liveness Check", icon: ShieldCheck }
                ].map((item, i) => (
                   <div key={i} className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-black rounded-xl border border-zinc-100 dark:border-zinc-800">
                     <span className="text-sm text-zinc-600 dark:text-zinc-400 flex items-center gap-3 font-medium">
                       <item.icon size={16} className="text-zinc-400"/> {item.label}
                     </span>
                     <CheckCircle2 size={18} className="text-green-500" />
                   </div>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t border-zinc-100 dark:border-zinc-800">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-3">Verified Perks</p>
                <ul className="space-y-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-yellow-500"/> <span>Skip the counter queue</span></li>
                  <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-yellow-500"/> <span>Instant bookings</span></li>
                  <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-yellow-500"/> <span>Zero deposit on Economy cars</span></li>
                </ul>
              </div>
            </div>

            {/* Invite Friends */}
            <div className="p-6 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-[2rem]">
              <h3 className="font-bold text-yellow-700 dark:text-yellow-500 mb-2 text-lg">Invite Friends</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6 leading-relaxed">
                Get <span className="font-bold text-zinc-900 dark:text-white">KES 1,000</span> off your next trip for every friend who books their first ride.
              </p>
              <Button 
                onClick={handleCopyReferral}
                variant="outline" 
                className="w-full border-yellow-500/50 text-yellow-700 dark:text-yellow-500 hover:bg-yellow-500 hover:text-black bg-transparent h-12 rounded-xl font-bold"
              >
                <Copy size={16} className="mr-2" /> Copy Referral Link
              </Button>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}