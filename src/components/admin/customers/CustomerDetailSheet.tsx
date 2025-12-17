"use client";

import { useState, useEffect, useCallback } from "react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  User, Phone, Mail, ShieldCheck, AlertTriangle, 
  History, FileText, Ban, Star, CreditCard, MessageCircle, X, 
  CheckCircle2, Calendar, ExternalLink, Loader2, Car
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

// --- TYPES ---
interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  idNumber: string;
  status: string;
  id_image_url?: string;
  dl_image_url?: string;
  joined_at?: string;
}

interface BookingHistory {
  id: string;
  carModel: string;
  plate: string;
  startDate: string;
  endDate: string;
  totalCost: number;
  status: string;
}

// --- COMPONENT ---
export default function CustomerDetailSheet({ customer, isOpen, onClose, onUpdateStatus }: { 
  customer: Customer | null, 
  isOpen: boolean, 
  onClose: () => void, 
  onUpdateStatus: (id: string, status: string) => void 
}) {
  const [localCustomer, setLocalCustomer] = useState<Customer | null>(null);
  const [history, setHistory] = useState<BookingHistory[]>([]);
  const [stats, setStats] = useState({ totalSpent: 0, rentalCount: 0, trustScore: 100 });
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // --- 1. DATA FETCHING (Now fetches Customer + Bookings) ---
  const fetchCustomerData = useCallback(async () => {
    if (!customer) return;
    setIsLoading(true);

    try {
      // 1. Fetch Fresh Customer Profile (To get the Image URLs)
      // We perform parallel fetching for speed [Customer, Bookings]
      const [customerRes, bookingsRes] = await Promise.all([
        supabase
          .from('customers')
          .select('*')
          .eq('id', customer.id)
          .single(),
        
        supabase
          .from('bookings')
          .select(`
            id, 
            start_date, 
            end_date, 
            total_cost, 
            status,
            unit:fleet_units ( plate_number, model:fleet_models ( make, model ) )
          `)
          .eq('customer_id', customer.id)
          .order('created_at', { ascending: false })
      ]);

      if (customerRes.error) throw customerRes.error;
      if (bookingsRes.error) throw bookingsRes.error;

      // A. Update Local Customer with FRESH data (including images)
      // We map DB snake_case columns to our UI camelCase interface or use directly
      const rawC = customerRes.data;
      setLocalCustomer({
        id: rawC.id,
        name: rawC.full_name, // Map full_name -> name
        phone: rawC.phone,
        email: rawC.email,
        idNumber: rawC.id_number, // Map id_number -> idNumber
        status: rawC.status,
        joined_at: rawC.created_at,
        id_image_url: rawC.id_image_url, // Critical: Ensure these are captured
        dl_image_url: rawC.dl_image_url
      });

      // B. Process Bookings
      const bookings = bookingsRes.data;
      if (bookings) {
        const mappedHistory: BookingHistory[] = bookings.map((b: any) => ({
          id: b.id,
          carModel: `${b.unit?.model?.make} ${b.unit?.model?.model}`,
          plate: b.unit?.plate_number,
          startDate: b.start_date,
          endDate: b.end_date,
          totalCost: b.total_cost,
          status: b.status
        }));
        setHistory(mappedHistory);

        // Calculate Stats Live
        const totalSpent = bookings
            .filter(b => b.status !== 'cancelled')
            .reduce((acc, curr) => acc + (curr.total_cost || 0), 0);
        
        const count = bookings.length;
        
        // Dynamic Trust Score
        const cancelledCount = bookings.filter(b => b.status === 'cancelled').length;
        const calculatedTrust = Math.max(0, 100 - (cancelledCount * 20));

        setStats({ totalSpent, rentalCount: count, trustScore: calculatedTrust });
      }

    } catch (err) {
      console.error("Error fetching customer details:", err);
      toast.error("Failed to load profile data");
    } finally {
      setIsLoading(false);
    }
  }, [customer]);

  useEffect(() => {
    if (isOpen && customer) {
      // Reset local state to basic props first to show immediate UI
      setLocalCustomer(customer); 
      // Then fetch detailed data
      fetchCustomerData();
    }
  }, [isOpen, customer, fetchCustomerData]);

  if (!localCustomer) return null;

  // --- LOGIC: ACTIONS ---
  const toggleBlacklist = async () => {
    setIsUpdating(true);
    const newStatus = localCustomer.status === 'active' ? 'blacklisted' : 'active';
    
    const { error } = await supabase
      .from('customers')
      .update({ status: newStatus })
      .eq('id', localCustomer.id);

    if (!error) {
        setLocalCustomer(prev => prev ? ({ ...prev, status: newStatus }) : null);
        onUpdateStatus(localCustomer.id, newStatus);
        toast.success(`Customer marked as ${newStatus}`);
    } else {
        toast.error("Failed to update status");
    }
    setIsUpdating(false);
  };

  const handleWhatsApp = () => {
    let cleanNumber = localCustomer.phone.replace(/\D/g, '');
    if (cleanNumber.startsWith('0')) cleanNumber = '254' + cleanNumber.substring(1);
    window.open(`https://wa.me/${cleanNumber}`, '_blank');
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-xl border-l border-zinc-800 bg-zinc-950 text-white p-0 flex flex-col h-[100vh] shadow-2xl focus:outline-none [&>button]:hidden">
        
        {/* --- HEADER --- */}
        <div className="relative overflow-hidden p-6 pb-6 bg-zinc-900 border-b border-white/5 shrink-0 z-20">
          <div className={cn("absolute top-0 right-0 w-64 h-64 blur-[80px] opacity-20 rounded-full pointer-events-none",
            localCustomer.status === 'active' ? "bg-blue-500" : "bg-red-500"
          )} />

          <div className="relative z-10">
            <div className="flex justify-between items-start mb-6">
              <div className="flex gap-4 items-center">
                <div className="w-16 h-16 rounded-full bg-zinc-800 border-2 border-zinc-700 flex items-center justify-center text-zinc-400 shadow-xl overflow-hidden">
                   <User size={32} />
                </div>
                <div>
                  <SheetTitle className="text-2xl font-bold text-white tracking-tight">{localCustomer.name}</SheetTitle>
                  <div className="flex items-center gap-3 text-zinc-400 text-sm mt-1">
                    <div className="flex items-center text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded border border-yellow-500/20">
                      <Star size={12} fill="currentColor" />
                      <span className="ml-1 font-bold">{stats.trustScore}% Trust</span>
                    </div>
                    <span>•</span>
                    <span className="text-zinc-400">{stats.rentalCount} Trips</span>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col items-end gap-2">
                  <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-zinc-400 hover:text-white"><X size={20} /></button>
                  <Badge className={cn("px-3 py-1 text-xs font-bold capitalize", 
                   localCustomer.status === 'active' ? "bg-blue-500 text-white" : "bg-red-500 text-white"
                 )}>
                   {localCustomer.status}
                 </Badge>
              </div>
            </div>

            {/* Contact Grid */}
            <div className="grid grid-cols-2 gap-3">
              <Button onClick={handleWhatsApp} className="bg-[#25D366] hover:bg-[#128C7E] text-white font-bold border-none shadow-lg">
                <MessageCircle size={18} className="mr-2" /> WhatsApp
              </Button>
              <div className="grid grid-cols-2 gap-2">
                <Button onClick={() => window.location.href = `tel:${localCustomer.phone}`} variant="outline" className="border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800 px-0">
                  <Phone size={18} />
                </Button>
                {localCustomer.email && (
                    <Button onClick={() => window.location.href = `mailto:${localCustomer.email}`} variant="outline" className="border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800 px-0">
                    <Mail size={18} />
                    </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* --- TABS --- */}
        <Tabs defaultValue="overview" className="flex-1 flex flex-col min-h-0">
          <div className="px-6 bg-zinc-900 border-b border-zinc-800 shrink-0 z-10">
            <TabsList className="bg-transparent p-0 gap-8 h-12 w-full justify-start">
              {["overview", "documents", "history"].map(tab => (
                 <TabsTrigger key={tab} value={tab} className="bg-transparent p-0 data-[state=active]:bg-transparent data-[state=active]:text-yellow-500 data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-yellow-500 rounded-none h-full transition-all capitalize text-zinc-400">
                   {tab}
                 </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 relative">
            
            {/* Show loader only on initial mount or full refresh */}
            {isLoading && !localCustomer.idNumber ? (
                <div className="flex h-full items-center justify-center text-zinc-500 gap-2"><Loader2 className="animate-spin" /> Loading Profile...</div>
            ) : (
                <>
                {/* TAB 1: OVERVIEW */}
                <TabsContent value="overview" className="mt-0 space-y-6 animate-in fade-in slide-in-from-right-4">
                
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-6 opacity-5">
                    <CreditCard size={120} />
                    </div>
                    <div className="relative z-10">
                    <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Lifetime Value</h4>
                    <h2 className="text-4xl font-black text-white tracking-tight">KES {stats.totalSpent.toLocaleString()}</h2>
                    <div className="mt-4 flex items-center gap-2">
                        <Badge variant="outline" className="border-zinc-700 text-zinc-400">
                        Avg: KES {(stats.totalSpent / (stats.rentalCount || 1)).toLocaleString(undefined, {maximumFractionDigits: 0})} / Trip
                        </Badge>
                    </div>
                    </div>
                </div>

                {stats.trustScore < 60 ? (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex gap-3">
                    <AlertTriangle className="text-red-500 shrink-0" />
                    <div>
                        <h4 className="font-bold text-red-500 text-sm">High Risk Customer</h4>
                        <p className="text-zinc-400 text-xs mt-1">Trust score is low due to previous cancellations or issues. Require higher deposit.</p>
                    </div>
                    </div>
                ) : (
                    <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex gap-3">
                    <ShieldCheck className="text-green-500 shrink-0" />
                    <div>
                        <h4 className="font-bold text-green-500 text-sm">Verified & Trusted</h4>
                        <p className="text-zinc-400 text-xs mt-1">Customer has a good track record. Eligible for standard rates.</p>
                    </div>
                    </div>
                )}

                <div className="space-y-4">
                    <h4 className="text-sm font-bold text-white">Details</h4>
                    <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-zinc-900 rounded-lg border border-zinc-800">
                        <span className="text-xs text-zinc-500 block mb-1 uppercase">ID Number</span>
                        <span className="font-mono text-white text-sm">{localCustomer.idNumber}</span>
                    </div>
                    <div className="p-3 bg-zinc-900 rounded-lg border border-zinc-800">
                        <span className="text-xs text-zinc-500 block mb-1 uppercase">Joined</span>
                        <span className="text-white text-sm">{new Date(localCustomer.joined_at || Date.now()).toLocaleDateString()}</span>
                    </div>
                    <div className="p-3 bg-zinc-900 rounded-lg border border-zinc-800 col-span-2">
                        <span className="text-xs text-zinc-500 block mb-1 uppercase">Email</span>
                        <span className="text-white text-sm flex items-center gap-2">
                        <Mail size={14} /> {localCustomer.email || "N/A"}
                        </span>
                    </div>
                    </div>
                </div>
                </TabsContent>

                {/* TAB 2: DOCUMENTS */}
                <TabsContent value="documents" className="mt-0 space-y-6 animate-in fade-in slide-in-from-right-4">
                <div className="grid grid-cols-1 gap-4">
                    {/* ID CARD RENDERER */}
                    <div className="flex items-center justify-between p-4 bg-zinc-900 border border-zinc-800 rounded-xl group hover:border-zinc-600 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center text-zinc-500 border border-zinc-800 overflow-hidden">
                                {localCustomer.id_image_url ? (
                                    <img src={localCustomer.id_image_url} alt="ID" className="w-full h-full object-cover" />
                                ) : <FileText size={24} />}
                            </div>
                            <div>
                                <p className="text-sm font-bold text-white">National ID / Passport</p>
                                {localCustomer.id_image_url ? (
                                    <p className="text-xs text-green-500 flex items-center gap-1 mt-1"><CheckCircle2 size={12} /> Uploaded</p>
                                ) : (
                                    <p className="text-xs text-red-500 flex items-center gap-1 mt-1"><AlertTriangle size={12} /> Missing</p>
                                )}
                            </div>
                        </div>
                        {localCustomer.id_image_url && (
                            <Button variant="ghost" size="icon" onClick={() => window.open(localCustomer.id_image_url, '_blank')} className="text-zinc-400 hover:text-white">
                                <ExternalLink size={18} />
                            </Button>
                        )}
                    </div>

                    {/* LICENSE RENDERER */}
                    <div className="flex items-center justify-between p-4 bg-zinc-900 border border-zinc-800 rounded-xl group hover:border-zinc-600 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center text-zinc-500 border border-zinc-800 overflow-hidden">
                                {localCustomer.dl_image_url ? (
                                    <img src={localCustomer.dl_image_url} alt="DL" className="w-full h-full object-cover" />
                                ) : <FileText size={24} />}
                            </div>
                            <div>
                                <p className="text-sm font-bold text-white">Driving License</p>
                                {localCustomer.dl_image_url ? (
                                    <p className="text-xs text-green-500 flex items-center gap-1 mt-1"><CheckCircle2 size={12} /> Uploaded</p>
                                ) : (
                                    <p className="text-xs text-red-500 flex items-center gap-1 mt-1"><AlertTriangle size={12} /> Missing</p>
                                )}
                            </div>
                        </div>
                        {localCustomer.dl_image_url && (
                            <Button variant="ghost" size="icon" onClick={() => window.open(localCustomer.dl_image_url, '_blank')} className="text-zinc-400 hover:text-white">
                                <ExternalLink size={18} />
                            </Button>
                        )}
                    </div>
                </div>
                </TabsContent>

                {/* TAB 3: HISTORY */}
                <TabsContent value="history" className="mt-0 space-y-6 animate-in fade-in slide-in-from-right-4">
                {history.length > 0 ? (
                    <div className="relative border-l border-zinc-800 ml-3 space-y-8 pb-2">
                        {history.map((trip) => (
                        <div key={trip.id} className="ml-6 relative group">
                            <div className="absolute -left-[33px] w-8 h-8 rounded-full bg-zinc-900 border-4 border-zinc-950 flex items-center justify-center text-zinc-400 group-hover:text-white transition-colors">
                                <History size={14} />
                            </div>
                            <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl hover:bg-zinc-900 transition-colors">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                        <Car size={16} className="text-yellow-500" />
                                        <p className="text-sm font-bold text-white">{trip.carModel}</p>
                                    </div>
                                    <span className="text-xs font-mono text-green-500 font-bold">KES {trip.totalCost.toLocaleString()}</span>
                                </div>
                                <div className="flex items-center gap-3 text-xs text-zinc-500">
                                    <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(trip.startDate).toLocaleDateString()}</span>
                                    <span className={cn("flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] uppercase font-bold", 
                                        trip.status === 'completed' ? "bg-green-900/20 text-green-400 border-green-900/30" : 
                                        trip.status === 'active' ? "bg-blue-900/20 text-blue-400 border-blue-900/30" : 
                                        "bg-zinc-800 text-zinc-400 border-zinc-700"
                                    )}>
                                        {trip.status}
                                    </span>
                                </div>
                            </div>
                        </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-10 text-zinc-500">
                        <History size={40} className="mx-auto mb-2 opacity-20" />
                        <p>No booking history found.</p>
                    </div>
                )}
                </TabsContent>
                </>
            )}

          </div>
        </Tabs>

        {/* --- FOOTER --- */}
        <div className="p-6 border-t border-white/10 bg-zinc-900/90 backdrop-blur-sm absolute bottom-0 w-full">
          {localCustomer.status === 'active' ? (
            <Button 
              onClick={toggleBlacklist} 
              disabled={isUpdating}
              variant="outline" 
              className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 h-12 font-bold"
            >
              {isUpdating ? <Loader2 className="animate-spin" /> : <><Ban size={18} className="mr-2" /> Blacklist Customer</>}
            </Button>
          ) : (
            <Button 
              onClick={toggleBlacklist} 
              disabled={isUpdating}
              className="w-full bg-green-600 hover:bg-green-500 text-white h-12 font-bold shadow-lg shadow-green-900/20"
            >
              {isUpdating ? <Loader2 className="animate-spin" /> : <><ShieldCheck size={18} className="mr-2" /> Re-activate Account</>}
            </Button>
          )}
        </div>

      </SheetContent>
    </Sheet>
  );
}