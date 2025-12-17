"use client";

import { useState, useMemo } from "react";
import { 
  Search, Calendar, MapPin, Clock, MoreVertical, 
  Download, Car, AlertCircle, ChevronRight, Navigation, 
  ShieldCheck, Repeat
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuTrigger, DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import Link from "next/link";
import ExtendTripWizard from "@/components/site/dashboard/ExtendTripWizard";
import ReportIssueWizard from "@/components/site/dashboard/ReportIssueWizard";
import { ArrowLeft } from "lucide-react";

// --- MOCK DATA ---
const INITIAL_TRIPS = [
  {
    id: "TRIP-8821",
    carModel: "Toyota Land Cruiser Prado",
    plate: "KCD 123X",
    image: "https://images.unsplash.com/photo-1519245659620-e859806a8d3b?auto=format&fit=crop&w=800",
    startDate: "2025-11-25",
    endDate: "2025-11-28",
    pickup: "Westlands Hub",
    dropoff: "Westlands Hub",
    cost: 45000,
    dailyRate: 15000, // Added for calculator
    status: "active",
    driver: "Self-drive"
  },
  {
    id: "TRIP-9002",
    carModel: "Mercedes C200",
    plate: "KCC 333B",
    image: "https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=800",
    startDate: "2025-12-10",
    endDate: "2025-12-12",
    pickup: "JKIA Airport",
    dropoff: "JKIA Airport",
    cost: 24000,
    dailyRate: 12000,
    status: "upcoming",
    driver: "Chauffeur"
  },
  {
    id: "TRIP-7710",
    carModel: "Mazda Demio",
    plate: "KBA 890A",
    image: "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=800",
    startDate: "2025-10-05",
    endDate: "2025-10-08",
    pickup: "Karen Branch",
    dropoff: "Karen Branch",
    cost: 12000,
    dailyRate: 4000,
    status: "completed",
    driver: "Self-drive"
  },
  {
    id: "TRIP-6500",
    carModel: "Toyota Alphard",
    plate: "KDA 001Z",
    image: "https://images.unsplash.com/photo-1609520505218-7421eb341eb3?auto=format&fit=crop&w=800",
    startDate: "2025-09-12",
    endDate: "2025-09-13",
    pickup: "Westlands Hub",
    dropoff: "Westlands Hub",
    cost: 18000,
    dailyRate: 18000,
    status: "cancelled",
    driver: "Chauffeur"
  }
];

export default function MyTripsPage() {
  // State allows us to update trips in real-time
  const [trips, setTrips] = useState(INITIAL_TRIPS);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  // --- LOGIC: HANDLE EXTENSION ---
  const handleExtendTrip = (tripId: string, newEndDate: string) => {
    setTrips(prevTrips => prevTrips.map(trip => {
      if (trip.id === tripId) {
        // Calculate new cost logic could go here, for now we just update date
        return { ...trip, endDate: newEndDate };
      }
      return trip;
    }));
  };

  // --- FILTER LOGIC ---
  const filteredTrips = useMemo(() => {
    return trips.filter(trip => {
      const matchesSearch = trip.carModel.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            trip.id.toLowerCase().includes(searchQuery.toLowerCase());
      
      if (activeTab === 'all') return matchesSearch;
      if (activeTab === 'active') return matchesSearch && trip.status === 'active';
      if (activeTab === 'upcoming') return matchesSearch && trip.status === 'upcoming';
      if (activeTab === 'history') return matchesSearch && (trip.status === 'completed' || trip.status === 'cancelled');
      
      return matchesSearch;
    });
  }, [trips, searchQuery, activeTab]); // Depend on 'trips' state now

  // --- HELPER: STATUS BADGE ---
  const renderStatus = (status: string) => {
    switch(status) {
      case 'active': 
        return <Badge className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20 px-3 py-1 animate-pulse">Live Rental</Badge>;
      case 'upcoming': 
        return <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 px-3 py-1">Confirmed</Badge>;
      case 'completed': 
        return <Badge variant="outline" className="text-zinc-500 border-zinc-300 dark:border-zinc-700 px-3 py-1">Completed</Badge>;
      case 'cancelled': 
        return <Badge variant="destructive" className="bg-red-500/10 text-red-500 border-red-500/20 px-3 py-1 shadow-none">Cancelled</Badge>;
      default: return null;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* --- NEW: BACK BUTTON --- */}
      <div>
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors group">
          <div className="w-8 h-8 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center group-hover:border-zinc-400 dark:group-hover:border-zinc-600 transition-all">
            <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
          </div>
          Back to Dashboard
        </Link>
      </div>
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-zinc-900 dark:text-white">My Journeys</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">Track your active rentals and booking history.</p>
        </div>
        
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-3 text-zinc-400" size={18} />
          <Input 
            placeholder="Search by car or booking ID..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-xl h-11 focus:ring-2 focus:ring-yellow-500 transition-all"
          />
        </div>
      </div>

      {/* TABS & CONTENT */}
      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-1 h-12 rounded-xl w-full md:w-auto inline-flex">
          {["all", "active", "upcoming", "history"].map((tab) => (
            <TabsTrigger 
              key={tab} 
              value={tab}
              className="rounded-lg px-6 h-10 text-sm capitalize data-[state=active]:bg-yellow-500 data-[state=active]:text-black data-[state=active]:font-bold transition-all text-zinc-500"
            >
              {tab === 'history' ? 'Past Trips' : tab}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* GRID OF TRIPS */}
        <div className="grid grid-cols-1 gap-6">
          {filteredTrips.length > 0 ? (
            filteredTrips.map((trip) => (
              <div 
                key={trip.id}
                className={cn(
                  "group relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden transition-all hover:shadow-lg",
                  trip.status === 'active' ? "ring-2 ring-green-500/50 dark:ring-green-500/30" : ""
                )}
              >
                <div className="flex flex-col md:flex-row">
                  
                  {/* Image Section */}
                  <div className="w-full md:w-64 h-48 md:h-auto relative bg-zinc-100 dark:bg-black">
                    <img 
                      src={trip.image} 
                      alt={trip.carModel} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute top-3 left-3">
                      {renderStatus(trip.status)}
                    </div>
                  </div>

                  {/* Content Section */}
                  <div className="flex-1 p-6 flex flex-col justify-between">
                    
                    {/* Top Row */}
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-1">{trip.id}</p>
                        <h3 className="text-xl font-bold text-zinc-900 dark:text-white">{trip.carModel}</h3>
                        <p className="text-sm text-zinc-500 mt-1 flex items-center gap-2">
                           <Car size={14} /> {trip.plate} • {trip.driver}
                        </p>
                      </div>
                      <div className="text-right">
                         <p className="text-xl font-black text-zinc-900 dark:text-white">KES {trip.cost.toLocaleString()}</p>
                         {trip.status === 'active' && (
                           <p className="text-xs text-red-500 font-bold mt-1 animate-pulse">Return Due: {new Date(trip.endDate).toLocaleDateString("en-GB")}</p>
                         )}
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="h-px w-full bg-zinc-100 dark:bg-zinc-800 my-2" />

                    {/* Bottom Row */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-2">
                      
                      {/* Schedule */}
                      <div className="flex gap-6">
                        <div>
                           <p className="text-[10px] text-zinc-400 uppercase font-bold">Pickup</p>
                           <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-1">
                             <Calendar size={14} className="text-yellow-500"/> {trip.startDate}
                           </p>
                           <p className="text-xs text-zinc-500">{trip.pickup}</p>
                        </div>
                        <div>
                           <p className="text-[10px] text-zinc-400 uppercase font-bold">Return</p>
                           <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-1">
                             <Clock size={14} className="text-yellow-500"/> {trip.endDate}
                           </p>
                           <p className="text-xs text-zinc-500">{trip.dropoff}</p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 mt-2 md:mt-0">
                        {trip.status === 'active' ? (
                          <>
                            <ReportIssueWizard 
                                tripId={trip.id}
                                trigger={
                                  <Button variant="outline" className="border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 h-9 text-xs">
                                    <AlertCircle size={14} className="mr-2"/> Report Issue
                                  </Button>
                                }/>
                            
                            {/* EXTEND TRIP WIZARD INTEGRATION */}
                            <ExtendTripWizard 
                              trip={{
                                id: trip.id,
                                carName: trip.carModel,
                                plate: trip.plate,
                                currentEndDate: trip.endDate,
                                dailyRate: trip.dailyRate || 0
                              }}
                              onExtendConfirm={(newDate) => handleExtendTrip(trip.id, newDate)}
                              trigger={
                                <Button className="bg-zinc-900 dark:bg-white text-white dark:text-black hover:bg-zinc-800 h-9 text-xs">
                                  <Navigation size={14} className="mr-2"/> Extend Trip
                                </Button>
                              }
                            />
                          </>
                        ) : trip.status === 'upcoming' ? (
                          <Button variant="outline" className="border-zinc-300 dark:border-zinc-700 h-9 text-xs">
                            Modify Booking
                          </Button>
                        ) : (
                          <>
                            <Button variant="ghost" className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white h-9 text-xs">
                              <Download size={14} className="mr-2"/> Receipt
                            </Button>
                            <Link href={`/fleet?model=${trip.carModel.split(" ")[0]}`}>
                                <Button variant="outline" className="border-zinc-300 dark:border-zinc-700 h-9 text-xs hover:bg-yellow-500 hover:text-black hover:border-yellow-500 transition-colors">
                                <Repeat size={14} className="mr-2"/> Book Again
                                </Button>
                            </Link>
                          </>
                        )}
                        
                        {/* Menu */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-9 w-9 text-zinc-400 hover:text-zinc-900 dark:hover:text-white">
                              <MoreVertical size={16} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800 text-white">
                             <DropdownMenuItem>View Full Itinerary</DropdownMenuItem>
                             <DropdownMenuItem>Contact Support</DropdownMenuItem>
                             <DropdownMenuSeparator className="bg-zinc-800" />
                             <DropdownMenuItem className="text-red-500 hover:text-red-400 hover:bg-red-500/10 cursor-pointer">Cancel Booking</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-white/50 dark:bg-zinc-900/50 rounded-3xl border border-dashed border-zinc-300 dark:border-zinc-800">
              <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 mb-4">
                <Car size={32} />
              </div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-1">No trips found</h3>
              <p className="text-zinc-500 max-w-xs mx-auto mb-6">
                {activeTab === 'all' ? "You haven't booked any trips yet." : `You have no ${activeTab} trips.`}
              </p>
              <Link href="/fleet">
                <Button className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-full">
                  Start a New Adventure
                </Button>
              </Link>
            </div>
          )}
        </div>

      </Tabs>
    </div>
  );
}