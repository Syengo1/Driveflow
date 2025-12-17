"use client";

import { useState, useEffect, useCallback } from "react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  MapPin, User, CreditCard, CheckCircle2, 
  AlertTriangle, Phone, MessageCircle, Car, Clock, 
  FileText, Download, Eye, Plus, Ban, ArrowRight, Loader2, Link as LinkIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

// --- TYPES (Mapped to DB) ---
interface BookingDetails {
  id: string;
  created_at: string;
  start_date: string;
  end_date: string;
  total_cost: number;
  amount_paid: number;
  payment_status: 'paid' | 'partial' | 'pending';
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  mpesa_code?: string;
  // Relations
  customer: {
    full_name: string;
    phone: string;
    id_image_url?: string;
  };
  unit: {
    plate_number: string;
    model: {
      make: string;
      model: string;
      image_url: string;
    };
  };
}

// --- COMPONENT ---
export default function BookingDetailSheet({ bookingId, isOpen, onClose, onUpdateCallback }: { 
  bookingId: string | null, 
  isOpen: boolean, 
  onClose: () => void, 
  onUpdateCallback: () => void 
}) {
  const [data, setData] = useState<BookingDetails | null>(null);
  const [activeTab, setActiveTab] = useState("trip");
  const [isLoading, setIsLoading] = useState(false);
  
  // Payment State
  const [isAddingPayment, setIsAddingPayment] = useState(false);
  const [newPayment, setNewPayment] = useState({ amount: "", code: "" });
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // --- 1. DATA FETCHING (FIXED QUERY) ---
  const fetchBookingDetails = useCallback(async () => {
    if (!bookingId) return;
    setIsLoading(true);
    
    // REMOVED !fk_booking_customer syntax. 
    // Supabase auto-detects relationships if standard naming conventions (customer_id, unit_id) are used.
    const { data: result, error } = await supabase
      .from('bookings')
      .select(`
        *,
        customer:customers ( full_name, phone, id_image_url ),
        unit:fleet_units ( 
          plate_number, 
          model:fleet_models ( make, model, image_url ) 
        )
      `)
      .eq('id', bookingId)
      .single();

    if (error) {
      toast.error("Error loading booking");
      console.error("Supabase Error:", error.message); // Logs actual error message
    } else {
      setData(result as any); 
    }
    setIsLoading(false);
  }, [bookingId]);

  useEffect(() => {
    if (isOpen && bookingId) {
      fetchBookingDetails();
      setIsAddingPayment(false);
      setNewPayment({ amount: "", code: "" });
    }
  }, [isOpen, bookingId, fetchBookingDetails]);

  if (!data && !isLoading) return null;

  // --- CALCULATED VALUES ---
  const balance = (data?.total_cost || 0) - (data?.amount_paid || 0);
  const isFullyPaid = balance <= 0;

  // --- ACTIONS ---

  const handleUpdateStatus = async (newStatus: string) => {
    if (!data) return;
    setIsLoading(true);
    
    // 1. Update Booking Status
    const { error } = await supabase
      .from('bookings')
      .update({ status: newStatus })
      .eq('id', data.id);

    // 2. If Active/Completed, Update Unit Status too to keep fleet sync
    if (!error) {
        let unitStatus = 'rented'; 
        if (newStatus === 'completed') unitStatus = 'cleaning'; // Good practice: Mark cleaning after return
        if (newStatus === 'cancelled') unitStatus = 'available';
        
        await supabase
            .from('fleet_units')
            .update({ status: unitStatus })
            .eq('plate_number', data.unit.plate_number);
        
        toast.success(`Booking marked as ${newStatus}`);
        onUpdateCallback();
        onClose();
    } else {
        toast.error("Failed to update status: " + error.message);
    }
    setIsLoading(false);
  };

  const handleAddPayment = async () => {
    if (!data || !newPayment.amount) return;
    setIsProcessingPayment(true);

    const paymentAmount = parseFloat(newPayment.amount);
    const newTotalPaid = (data.amount_paid || 0) + paymentAmount;
    const newPaymentStatus = newTotalPaid >= data.total_cost ? 'paid' : 'partial';

    const { error } = await supabase
        .from('bookings')
        .update({
            amount_paid: newTotalPaid,
            payment_status: newPaymentStatus,
            mpesa_code: newPayment.code || data.mpesa_code // Keep old if not provided
        })
        .eq('id', data.id);

    if (!error) {
        toast.success("Payment Recorded");
        fetchBookingDetails(); // Refresh local data to show new balance
        onUpdateCallback(); // Refresh parent table
        setIsAddingPayment(false);
        setNewPayment({ amount: "", code: "" });
    } else {
        toast.error("Failed to record payment: " + error.message);
    }
    setIsProcessingPayment(false);
  };

  // --- UTILS ---
  const handleWhatsApp = () => {
    if (!data) return;
    let cleanNumber = data.customer.phone.replace(/\D/g, '');
    if (cleanNumber.startsWith('0')) cleanNumber = '254' + cleanNumber.substring(1);
    window.open(`https://wa.me/${cleanNumber}`, '_blank');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return "bg-green-500 text-black hover:bg-green-400";
      case 'pending': return "bg-yellow-500 text-black hover:bg-yellow-400";
      case 'completed': return "bg-zinc-800 text-zinc-300";
      case 'cancelled': return "bg-red-500/20 text-red-400 border-red-500/50";
      default: return "bg-zinc-800";
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-xl border-l border-zinc-800 bg-zinc-950 text-white p-0 flex flex-col h-[100vh] shadow-2xl focus:outline-none [&>button]:hidden">
        
        {isLoading || !data ? (
            <div className="flex items-center justify-center h-full text-zinc-500 gap-2">
                <SheetTitle className="hidden">Loading</SheetTitle>
                <Loader2 className="animate-spin" /> Loading Details...
            </div>
        ) : (
        <>
        {/* --- HEADER --- */}
        <div className="relative overflow-hidden p-6 pb-6 bg-zinc-900 border-b border-white/5 shrink-0 z-20">
          <div className={cn("absolute top-0 right-0 w-64 h-64 blur-[80px] opacity-20 rounded-full pointer-events-none",
            data.status === 'active' ? "bg-green-500" :
            data.status === 'pending' ? "bg-yellow-500" : 
            data.status === 'cancelled' ? "bg-red-500" : "bg-blue-500"
          )} />

          <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
              <div className="flex gap-4 items-center">
                <div className="w-14 h-14 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-400 shadow-xl overflow-hidden">
                  <User size={28} />
                </div>
                <div>
                  <SheetTitle className="text-xl font-bold text-white">{data.customer.full_name}</SheetTitle>
                  <p className="text-sm text-zinc-400 flex items-center gap-2 mt-1">
                    <Phone size={12} className="text-green-500" /> {data.customer.phone}
                  </p>
                </div>
              </div>
              <Badge className={cn("px-3 py-1 capitalize shadow-lg border-0", getStatusColor(data.status))}>
                {data.status}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button size="sm" onClick={handleWhatsApp} className="bg-[#25D366] hover:bg-[#128C7E] text-white border-none font-bold shadow-lg">
                <MessageCircle size={16} className="mr-2" /> WhatsApp
              </Button>
              <Button size="sm" onClick={() => window.location.href = `tel:${data.customer.phone}`} variant="outline" className="border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800">
                <Phone size={16} className="mr-2" /> Call Client
              </Button>
            </div>
          </div>
        </div>

        {/* --- TABS --- */}
        <Tabs defaultValue="trip" value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <div className="px-6 bg-zinc-900 border-b border-zinc-800 shrink-0 z-10">
            <TabsList className="bg-transparent p-0 gap-8 h-12 w-full justify-start">
              {["trip", "verification", "finance"].map(tab => (
                 <TabsTrigger key={tab} value={tab} className="bg-transparent p-0 data-[state=active]:bg-transparent data-[state=active]:text-yellow-500 data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-yellow-500 rounded-none h-full transition-all capitalize text-zinc-400">
                   {tab}
                 </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 relative">
              
              {/* TAB 1: TRIP DETAILS */}
              <TabsContent value="trip" className="mt-0 space-y-6 animate-in fade-in slide-in-from-right-4">
                <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl flex justify-between items-center hover:border-zinc-700 transition-colors group">
                  <div className="flex gap-4 items-center">
                    <div className="w-16 h-12 bg-black rounded-lg flex items-center justify-center border border-zinc-800 group-hover:border-yellow-500/30 transition-colors overflow-hidden">
                      {data.unit.model.image_url ? 
                        <img src={data.unit.model.image_url} alt="Car" className="w-full h-full object-cover" /> : 
                        <Car size={24} className="text-zinc-500" />
                      }
                    </div>
                    <div>
                      <p className="font-bold text-white text-lg">{data.unit.model.make} {data.unit.model.model}</p>
                      <p className="text-xs text-zinc-500 font-mono bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800 inline-block mt-1">
                        {data.unit.plate_number}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-0 relative">
                  <div className="absolute left-[19px] top-3 bottom-3 w-0.5 bg-zinc-800" />
                  
                  <div className="flex items-start gap-4 relative z-10">
                    <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-green-500 shadow-lg">
                      <MapPin size={18} />
                    </div>
                    <div className="pt-1">
                      <p className="text-xs text-zinc-500 uppercase font-bold">Pickup</p>
                      <p className="text-white font-medium text-lg">{new Date(data.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                      <p className="text-xs text-zinc-400 flex items-center gap-1 mt-0.5"><Clock size={12}/> 09:00 AM • Westlands Hub</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 relative z-10 mt-6">
                    <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-red-500 shadow-lg">
                      <MapPin size={18} />
                    </div>
                    <div className="pt-1">
                      <p className="text-xs text-zinc-500 uppercase font-bold">Return</p>
                      <p className="text-white font-medium text-lg">{new Date(data.end_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                      <p className="text-xs text-zinc-400 flex items-center gap-1 mt-0.5"><Clock size={12}/> 09:00 AM • Westlands Hub</p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* TAB 2: VERIFICATION */}
              <TabsContent value="verification" className="mt-0 space-y-6 animate-in fade-in slide-in-from-right-4">
                <div className="p-5 bg-zinc-900/50 border border-zinc-800 rounded-xl">
                  <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                    <FileText size={16} className="text-yellow-500" /> Customer Documents
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    {data.customer.id_image_url ? (
                        <div onClick={() => window.open(data.customer.id_image_url, '_blank')} className="aspect-video bg-black rounded-lg border border-zinc-800 flex flex-col items-center justify-center cursor-pointer hover:border-zinc-600 transition-all group relative overflow-hidden">
                            <img src={data.customer.id_image_url} alt="ID" className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                            <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-1 rounded text-xs">ID Document</div>
                        </div>
                    ) : (
                        <div className="aspect-video bg-zinc-900/30 rounded-lg border border-dashed border-zinc-700 flex flex-col items-center justify-center text-zinc-600">
                            <Ban size={24} />
                            <span className="text-xs mt-2">No ID Uploaded</span>
                        </div>
                    )}
                  </div>
                </div>
                
                {data.status === 'pending' && (
                  <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 flex gap-3 items-start">
                    <AlertTriangle className="text-blue-400 shrink-0 mt-0.5" size={18} />
                    <div>
                      <h4 className="font-bold text-blue-400 text-xs uppercase tracking-wider">Verification Required</h4>
                      <p className="text-zinc-400 text-xs mt-1">Please inspect original physical documents before releasing the vehicle keys.</p>
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* TAB 3: FINANCE */}
              <TabsContent value="finance" className="mt-0 space-y-6 animate-in fade-in slide-in-from-right-4">
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 text-center relative overflow-hidden">
                  <div className="relative z-10">
                    <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider">Total Trip Cost</p>
                    <h3 className="text-4xl font-black text-white my-2 tracking-tight">KES {data.total_cost.toLocaleString()}</h3>
                    <Badge variant="outline" className={cn("border-transparent px-3 py-1", isFullyPaid ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500")}>
                      {isFullyPaid ? "Fully Paid" : `Balance: KES ${balance.toLocaleString()}`}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-end">
                    <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Payments</h4>
                    {!isFullyPaid && (
                      <button onClick={() => setIsAddingPayment(!isAddingPayment)} className="text-xs text-yellow-500 hover:underline flex items-center gap-1">
                        <Plus size={12} /> Add Payment
                      </button>
                    )}
                  </div>

                  {isAddingPayment && (
                    <div className="p-3 bg-zinc-900 border border-yellow-500/30 rounded-lg animate-in fade-in slide-in-from-top-2">
                       <div className="flex gap-2 mb-2">
                          <Input 
                            type="number"
                            placeholder="Amount (KES)" 
                            className="h-8 bg-black border-zinc-800 text-xs" 
                            value={newPayment.amount}
                            onChange={(e) => setNewPayment({...newPayment, amount: e.target.value})}
                          />
                          <Input 
                            placeholder="Code (e.g QWE...)" 
                            className="h-8 bg-black border-zinc-800 text-xs" 
                            value={newPayment.code}
                            onChange={(e) => setNewPayment({...newPayment, code: e.target.value})}
                          />
                       </div>
                       <div className="flex justify-end gap-2">
                          <Button size="sm" variant="ghost" onClick={() => setIsAddingPayment(false)} className="h-7 text-xs">Cancel</Button>
                          <Button size="sm" disabled={isProcessingPayment} onClick={handleAddPayment} className="h-7 text-xs bg-yellow-500 text-black hover:bg-yellow-400">
                            {isProcessingPayment ? <Loader2 className="animate-spin" size={12}/> : "Record"}
                          </Button>
                       </div>
                    </div>
                  )}

                  {data.amount_paid > 0 ? (
                      <div className="p-3 bg-black border border-zinc-800 rounded-lg flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
                            <CreditCard size={14} />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">Total Paid</p>
                            <p className="text-[10px] text-zinc-500 font-mono">{data.mpesa_code || "MULTIPLE/TRX"}</p>
                          </div>
                        </div>
                        <div className="text-right">
                           <span className="text-sm font-bold text-white block">KES {data.amount_paid.toLocaleString()}</span>
                        </div>
                      </div>
                  ) : (
                      <p className="text-zinc-500 text-xs italic text-center py-2">No payments recorded yet.</p>
                  )}
                </div>
              </TabsContent>

          </div>
        </Tabs>
        
        {/* --- DYNAMIC ACTION FOOTER --- */}
        <div className="p-6 border-t border-white/10 bg-zinc-900/50 backdrop-blur-xl absolute bottom-0 w-full">
          <div className="grid grid-cols-2 gap-4">
            
            {data.status === 'pending' && (
              <>
                <Button onClick={() => handleUpdateStatus('cancelled')} variant="outline" className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 font-bold h-12">
                  <Ban size={18} className="mr-2" /> Decline
                </Button>
                <Button onClick={() => handleUpdateStatus('active')} className="bg-green-500 hover:bg-green-600 text-white font-bold h-12 shadow-lg shadow-green-900/20">
                  <CheckCircle2 size={18} className="mr-2" /> Approve Booking
                </Button>
              </>
            )}

            {data.status === 'active' && (
              <>
                <Button variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 font-bold h-12">
                  Extend Trip
                </Button>
                <Button onClick={() => handleUpdateStatus('completed')} className="bg-white text-black hover:bg-zinc-200 font-bold h-12 shadow-lg">
                  Complete Trip <ArrowRight size={18} className="ml-2" />
                </Button>
              </>
            )}

            {(data.status === 'completed' || data.status === 'cancelled') && (
               <Button onClick={onClose} className="col-span-2 bg-zinc-800 hover:bg-zinc-700 text-white font-bold h-12">
                 Close Details
               </Button>
            )}

          </div>
        </div>
        </>
        )}
      </SheetContent>
    </Sheet>
  );
}