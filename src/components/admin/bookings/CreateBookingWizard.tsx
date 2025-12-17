"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  User, Phone, Car, CheckCircle2, ArrowRight, Loader2, 
  FileText, Search, Upload, Trash2, AlertTriangle, 
  Download, Ban, CalendarClock, CreditCard
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

// --- TYPES ---
interface FleetCar {
  id: string; // unit_id
  model: string;
  plate: string;
  price: number;
  status: string;
  image: string;
}

// --- HELPER: DOCUMENT UPLOAD ZONE ---
const DocumentDropzone = ({ label, onUpload, file }: { label: string, onUpload: (f: File | null) => void, file: File | null }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFile = (f: File) => {
    onUpload(f);
    setPreview(URL.createObjectURL(f));
  };

  return (
    <div 
      onClick={() => inputRef.current?.click()}
      className={cn(
        "border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all group relative overflow-hidden h-32",
        file ? "border-green-500/50 bg-green-500/5" : "border-zinc-800 bg-zinc-900/50 hover:border-zinc-600"
      )}
    >
      <input type="file" ref={inputRef} className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
      
      {file ? (
        <>
          <img src={preview!} alt="doc" className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity" />
          <div className="relative z-10 flex flex-col items-center">
             <CheckCircle2 className="text-green-500 mb-1" size={24} />
             <p className="text-xs text-green-400 font-bold truncate max-w-[100px]">{file.name}</p>
          </div>
          <button onClick={(e) => { e.stopPropagation(); onUpload(null); setPreview(null); }} className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white hover:bg-red-500 transition-colors z-20"><Trash2 size={14} /></button>
        </>
      ) : (
        <>
          <Upload className="text-zinc-500 group-hover:text-zinc-300 mb-2" size={20} />
          <p className="text-xs text-zinc-500 text-center uppercase font-bold">{label}</p>
        </>
      )}
    </div>
  );
};

interface Props {
  onBookingCreated: () => void;
}

export default function CreateBookingWizard({ onBookingCreated }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  
  // DATA STATE
  const [availableCars, setAvailableCars] = useState<FleetCar[]>([]);
  
  // FORM STATE
  const [client, setClient] = useState({ 
    id: "", // Supabase UUID if exists
    name: "", 
    phone: "", 
    idNumber: "", 
    dlNumber: "", 
    idImage: null as File | null, 
    dlImage: null as File | null,
    isExisting: false
  });
  
  const [dates, setDates] = useState({ start: "", end: "" });
  const [carSearch, setCarSearch] = useState("");
  const [selectedCar, setSelectedCar] = useState<FleetCar | null>(null);
  const [payment, setPayment] = useState({ method: "M-Pesa", code: "", amountPaid: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // --- LOGIC 1: CUSTOMER LOOKUP ---
  const checkCustomerExists = async (idNo: string) => {
    if (idNo.length < 5) return;
    
    const { data } = await supabase
      .from('customers')
      .select('*')
      .eq('id_number', idNo)
      .single();

    if (data) {
      toast.success("Welcome back!", { description: `Found existing profile for ${data.full_name}` });
      setClient(prev => ({
        ...prev,
        id: data.id,
        name: data.full_name,
        phone: data.phone,
        dlNumber: data.dl_number || "",
        isExisting: true
      }));
    }
  };

  // Debounce customer check
  useEffect(() => {
    const timer = setTimeout(() => {
        if(client.idNumber) checkCustomerExists(client.idNumber);
    }, 800);
    return () => clearTimeout(timer);
  }, [client.idNumber]);


  // --- LOGIC 2: AVAILABILITY ENGINE ---
  useEffect(() => {
    async function fetchAvailability() {
      if (!dates.start || !dates.end) return;
      setIsCheckingAvailability(true);
      setSelectedCar(null);

      try {
        // 1. Get units that have overlapping bookings
        // Overlap Logic: (RequestStart <= ExistingEnd) AND (RequestEnd >= ExistingStart)
        const { data: busyBookings } = await supabase
          .from('bookings')
          .select('unit_id')
          .neq('status', 'cancelled')
          .or(`start_date.lte.${dates.end},end_date.gte.${dates.start}`);

        const busyUnitIds = busyBookings?.map(b => b.unit_id) || [];

        // 2. Fetch all units that are NOT busy and NOT in maintenance
        let query = supabase
          .from('fleet_units')
          .select(`
            id, 
            plate_number, 
            status,
            model:fleet_models!fleet_units_model_id_fkey ( make, model, daily_rate, image_url )
          `)
          .in('status', ['available', 'rented']) // 'rented' is okay IF the dates don't overlap (handled by busyUnitIds)
          .not('status', 'in', '("maintenance","cleaning")');

        if (busyUnitIds.length > 0) {
          query = query.not('id', 'in', `(${busyUnitIds.join(',')})`);
        }

        const { data: units, error } = await query;

        if (error) throw error;

        // Transform data
        const cleanList: FleetCar[] = (units || []).map((u: any) => ({
          id: u.id,
          plate: u.plate_number,
          status: u.status,
          model: `${u.model?.make} ${u.model?.model}`,
          price: u.model?.daily_rate || 0,
          image: u.model?.image_url || ""
        }));

        setAvailableCars(cleanList);

      } catch (err) {
        console.error("Availability Check Failed", err);
        toast.error("Could not check availability");
      } finally {
        setIsCheckingAvailability(false);
      }
    }

    fetchAvailability();
  }, [dates.start, dates.end]);

  // --- FILTERING ---
  const filteredCars = useMemo(() => {
    if (!carSearch) return availableCars;
    const lower = carSearch.toLowerCase();
    return availableCars.filter(c => c.model.toLowerCase().includes(lower) || c.plate.toLowerCase().includes(lower));
  }, [availableCars, carSearch]);


  // --- LOGIC 3: VALIDATION ---
  const formatName = (val: string) => val.replace(/\b\w/g, char => char.toUpperCase());
  const formatPhone = (val: string) => {
    let clean = val.replace(/[^0-9+]/g, '');
    if (clean.startsWith('07') || clean.startsWith('01')) clean = '+254' + clean.substring(1);
    return clean;
  };

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};
    if (client.name.length < 3) newErrors.name = "Full name required";
    if (!/^\+[1-9]\d{9,14}$/.test(client.phone)) newErrors.phone = "Format: +254...";
    if (!client.idNumber.trim() || client.idNumber.length < 6) newErrors.idNumber = "Valid ID required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // --- LOGIC 4: TOTAL COST ---
  const totalCost = useMemo(() => {
    if (!dates.start || !dates.end || !selectedCar) return 0;
    const start = new Date(dates.start);
    const end = new Date(dates.end);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
    return diffDays * selectedCar.price;
  }, [dates, selectedCar]);


  // --- LOGIC 5: SUBMIT & TRANSACTION ---
  const handleSubmit = async () => {
    setIsLoading(true);
    try {
        let customerId = client.id;

        // A. HANDLE CUSTOMER (Create or Update)
        if (!client.isExisting) {
            // 1. Upload Docs with EXTENSIONS
            let idUrl = null;
            let dlUrl = null;

            if (client.idImage) {
                const fileExt = client.idImage.name.split('.').pop();
                // Clean filename: 12345678_ID_TIMESTAMP.png
                const fileName = `${client.idNumber}_ID_${Date.now()}.${fileExt}`;
                
                const { data, error: uploadError } = await supabase.storage
                    .from('customer-docs')
                    .upload(fileName, client.idImage);
                
                if (uploadError) {
                    console.error("ID Upload Error:", uploadError);
                    toast.error("Failed to upload ID document");
                    // We continue even if upload fails, but you could throw here
                } else if (data) {
                    const { data: pub } = supabase.storage
                        .from('customer-docs')
                        .getPublicUrl(fileName);
                    idUrl = pub.publicUrl;
                }
            }

            if (client.dlImage) {
                const fileExt = client.dlImage.name.split('.').pop();
                const fileName = `${client.idNumber}_DL_${Date.now()}.${fileExt}`;
                
                const { data, error: uploadError } = await supabase.storage
                    .from('customer-docs')
                    .upload(fileName, client.dlImage);
                
                if (uploadError) {
                    console.error("DL Upload Error:", uploadError);
                    toast.error("Failed to upload License document");
                } else if (data) {
                    const { data: pub } = supabase.storage
                        .from('customer-docs')
                        .getPublicUrl(fileName);
                    dlUrl = pub.publicUrl;
                }
            }

            // 2. Insert Customer
            const { data: newCust, error: custError } = await supabase
                .from('customers')
                .insert({
                    full_name: client.name,
                    phone: client.phone,
                    id_number: client.idNumber,
                    dl_number: client.dlNumber || null,
                    id_image_url: idUrl, // Now contains a valid URL with extension
                    dl_image_url: dlUrl,
                    status: 'active'
                })
                .select()
                .single();
            
            if (custError) throw custError;
            customerId = newCust.id;
        }

        // B. CREATE BOOKING
        const { error: bookingError } = await supabase
            .from('bookings')
            .insert({
                customer_id: customerId,
                unit_id: selectedCar!.id,
                start_date: dates.start,
                end_date: dates.end,
                total_cost: totalCost,
                amount_paid: parseFloat(payment.amountPaid),
                payment_status: parseFloat(payment.amountPaid) >= totalCost ? "paid" : "partial",
                mpesa_code: payment.code,
                status: 'pending' // Or 'active' if checking out immediately
            });

        if (bookingError) throw bookingError;

        // C. INVOICE DOWNLOAD
        const invoiceContent = `DRIVEFLOW RENTALS - INVOICE\n---------------------------\nClient: ${client.name}\nID: ${client.idNumber}\nVehicle: ${selectedCar?.model}\nPlate: ${selectedCar?.plate}\n---------------------------\nTotal: KES ${totalCost.toLocaleString()}\nPaid: KES ${payment.amountPaid}\nBal: KES ${(totalCost - parseFloat(payment.amountPaid)).toLocaleString()}\n---------------------------\nDate: ${new Date().toLocaleString()}`;
        const blob = new Blob([invoiceContent], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Invoice_${client.name.replace(" ", "_")}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        // D. SUCCESS
        toast.success("Booking Created Successfully", { description: "Invoice downloaded automatically." });
        onBookingCreated();
        setIsOpen(false);
        
        // Reset
        setTimeout(() => {
            setStep(1);
            setClient({ id: "", name: "", phone: "", idNumber: "", dlNumber: "", idImage: null, dlImage: null, isExisting: false });
            setSelectedCar(null);
            setDates({ start: "", end: "" });
            setPayment({ method: "M-Pesa", code: "", amountPaid: "" });
        }, 500);

    } catch (err: any) {
        console.error("Booking Error:", err);
        toast.error("Failed to create booking", { description: err.message });
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold shadow-lg shadow-yellow-500/20 gap-2">
          <PlusIcon /> New Walk-in
        </Button>
      </DialogTrigger>
      
      <DialogContent className="glass-panel border-zinc-800 text-white max-w-4xl h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-6 border-b border-white/10 bg-zinc-900 shrink-0">
          <DialogTitle className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-yellow-500/10 text-yellow-500 flex items-center justify-center border border-yellow-500/20"><FileText size={20} /></div>
            <div>
              <h2 className="text-lg font-bold text-white">Create Booking</h2>
              <div className="flex items-center gap-2 mt-1">
                {[1, 2, 3].map(i => <div key={i} className={cn("h-1 w-8 rounded-full transition-colors", step >= i ? "bg-yellow-500" : "bg-zinc-800")} />)}
                <span className="text-[10px] text-zinc-500 uppercase tracking-widest ml-2">{step === 1 ? "Client Profile" : step === 2 ? "Check Availability" : "Invoice & Pay"}</span>
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-zinc-950/50">
          
          {/* STEP 1: CLIENT DETAILS */}
          {step === 1 && (
            <div className="space-y-6 animate-in slide-in-from-right-4">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  
                  {/* ID Input First for Lookup */}
                  <div className="space-y-2">
                    <Label className={errors.idNumber ? "text-red-400" : "text-zinc-400"}>ID / Passport No. *</Label>
                    <div className="relative">
                        <CreditCard className="absolute left-3 top-2.5 text-zinc-500" size={16} />
                        <Input placeholder="Enter ID to search..." className="pl-10 bg-black border-zinc-800 font-mono" value={client.idNumber} onChange={e => setClient({...client, idNumber: e.target.value})} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className={errors.name ? "text-red-400" : "text-zinc-400"}>Full Name *</Label>
                    <div className="relative"><User className="absolute left-3 top-2.5 text-zinc-500" size={16} /><Input placeholder="John Doe" className="pl-10 bg-black border-zinc-800" value={client.name} onChange={e => setClient({...client, name: formatName(e.target.value)})} /></div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className={errors.phone ? "text-red-400" : "text-zinc-400"}>Phone Number *</Label>
                    <div className="relative"><Phone className="absolute left-3 top-2.5 text-zinc-500" size={16} /><Input placeholder="+254..." className="pl-10 bg-black border-zinc-800 font-mono" value={client.phone} onChange={e => setClient({...client, phone: formatPhone(e.target.value)})} /></div>
                    {errors.phone && <p className="text-xs text-red-500">{errors.phone}</p>}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2"><Label className="text-zinc-400">Driver's License No.</Label><Input placeholder="DL-..." className="bg-black border-zinc-800 font-mono" value={client.dlNumber} onChange={e => setClient({...client, dlNumber: e.target.value})} /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <DocumentDropzone label="Scan ID Card" file={client.idImage} onUpload={(f) => setClient({...client, idImage: f})} />
                    <DocumentDropzone label="Scan License" file={client.dlImage} onUpload={(f) => setClient({...client, dlImage: f})} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: AVAILABILITY */}
          {step === 2 && (
            <div className="space-y-6 animate-in slide-in-from-right-4">
              <div className="grid grid-cols-2 gap-6 p-5 bg-zinc-900/50 border border-zinc-800 rounded-xl">
                <div className="space-y-2"><Label className="text-zinc-400 text-xs uppercase font-bold">Pickup Date *</Label><Input type="date" className="bg-black border-zinc-700 [color-scheme:dark]" value={dates.start} onChange={e => setDates({...dates, start: e.target.value})} /></div>
                <div className="space-y-2"><Label className="text-zinc-400 text-xs uppercase font-bold">Return Date *</Label><Input type="date" className="bg-black border-zinc-700 [color-scheme:dark]" value={dates.end} onChange={e => setDates({...dates, end: e.target.value})} /></div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-3">
                  <Label className="text-zinc-400">{dates.start && dates.end ? "Available Vehicles" : "Select Dates to View Availability"}</Label>
                  {dates.start && dates.end && <div className="relative w-48"><Search className="absolute left-2 top-2.5 text-zinc-600" size={14} /><Input placeholder="Filter fleet..." className="pl-8 h-9 bg-black border-zinc-800 text-xs" value={carSearch} onChange={e => setCarSearch(e.target.value)} /></div>}
                </div>
                {!dates.start || !dates.end ? (
                  <div className="h-40 bg-zinc-900/30 border border-dashed border-zinc-800 rounded-xl flex flex-col items-center justify-center text-zinc-500"><CalendarClock size={32} className="mb-2 opacity-50" /><p className="text-sm">Waiting for travel dates...</p></div>
                ) : isCheckingAvailability ? (
                  <div className="h-40 flex items-center justify-center text-yellow-500 gap-2"><Loader2 className="animate-spin" /> Checking live fleet schedule...</div>
                ) : filteredCars.length === 0 ? (
                  <div className="h-40 bg-red-500/5 border border-dashed border-red-500/20 rounded-xl flex flex-col items-center justify-center text-red-400"><Ban size={32} className="mb-2 opacity-50" /><p className="text-sm font-bold">No vehicles available for these dates.</p></div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {filteredCars.map(car => (
                      <div key={car.id} onClick={() => setSelectedCar(car)} className={cn("relative rounded-xl overflow-hidden border-2 cursor-pointer transition-all group", selectedCar?.id === car.id ? "border-yellow-500 bg-yellow-500/5 ring-2 ring-yellow-500/20" : "border-zinc-800 bg-zinc-900 hover:border-zinc-600")}>
                        <div className="aspect-video relative">
                          <img src={car.image || '/placeholder-car.jpg'} alt={car.model} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                          <div className="absolute top-2 right-2 bg-black/80 backdrop-blur-md px-2 py-1 rounded text-[10px] font-mono border border-white/10">{car.plate}</div>
                        </div>
                        <div className="p-3"><h4 className="font-bold text-white text-sm">{car.model}</h4><p className="text-yellow-500 text-xs font-mono mt-1">KES {car.price.toLocaleString()}/day</p></div>
                        {selectedCar?.id === car.id && <div className="absolute top-2 left-2 bg-yellow-500 text-black p-1 rounded-full shadow-lg"><CheckCircle2 size={14} /></div>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 3: PAYMENT */}
          {step === 3 && selectedCar && (
            <div className="space-y-6 animate-in slide-in-from-right-4">
              <div className="flex gap-8">
                <div className="flex-1 space-y-4">
                  <div className="bg-white text-black rounded-xl p-6 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-yellow-500 via-orange-500 to-yellow-500" />
                    <div className="flex justify-between items-start mb-6"><div><h3 className="font-black text-2xl tracking-tight">INVOICE</h3><p className="text-zinc-500 text-xs uppercase tracking-wider mt-1">Walk-in Booking</p></div><div className="text-right"><p className="font-mono font-bold text-lg">{selectedCar.plate}</p><p className="text-sm text-zinc-600">{selectedCar.model}</p></div></div>
                    <div className="space-y-3 border-b border-dashed border-zinc-300 pb-4 mb-4"><div className="flex justify-between text-sm"><span className="text-zinc-600">Rate per day</span><span className="font-mono">KES {selectedCar.price.toLocaleString()}</span></div><div className="flex justify-between text-sm"><span className="text-zinc-600">Duration</span><span className="font-mono">{Math.ceil((new Date(dates.end).getTime() - new Date(dates.start).getTime()) / (1000 * 3600 * 24))} Days</span></div></div>
                    <div className="flex justify-between items-end"><span className="text-lg font-bold">Total Due</span><span className="text-4xl font-black text-zinc-900 tracking-tighter">KES {totalCost.toLocaleString()}</span></div>
                  </div>
                </div>
                <div className="w-1/3 space-y-4">
                  <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4"><Label className="text-zinc-400 text-xs uppercase mb-2 block">Payment Method</Label><Select defaultValue="M-Pesa" onValueChange={(v) => setPayment({...payment, method: v})}><SelectTrigger className="bg-black border-zinc-700"><SelectValue /></SelectTrigger><SelectContent className="bg-zinc-900 border-zinc-800 text-white"><SelectItem value="M-Pesa">M-Pesa</SelectItem><SelectItem value="Cash">Cash</SelectItem><SelectItem value="Card">Card</SelectItem></SelectContent></Select></div>
                  <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4"><Label className="text-zinc-400 text-xs uppercase mb-2 block">Amount Paid *</Label><div className="relative"><span className="absolute left-3 top-2.5 text-zinc-500 text-xs">KES</span><Input type="number" placeholder="0" className="pl-10 bg-black border-zinc-700 font-mono text-white font-bold text-lg" value={payment.amountPaid} onChange={e => setPayment({...payment, amountPaid: e.target.value})} /></div></div>
                  <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4"><Label className="text-zinc-400 text-xs uppercase mb-2 block">Transaction Code</Label><Input placeholder="e.g. QWE123RTY" className="bg-black border-zinc-700 font-mono text-green-500 uppercase placeholder:text-zinc-700 font-bold" value={payment.code} onChange={e => setPayment({...payment, code: e.target.value.toUpperCase()})} /></div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-white/10 bg-zinc-900 flex justify-between items-center shrink-0">
          <Button variant="ghost" onClick={() => step > 1 && setStep(step - 1)} disabled={step === 1} className="text-zinc-400 hover:text-white">Back</Button>
          {step < 3 ? (
            <Button onClick={() => step === 1 ? (validateStep1() && setStep(2)) : (selectedCar && dates.start && dates.end && setStep(3))} disabled={step === 2 && (!selectedCar || !dates.start || !dates.end)} className="bg-white text-black hover:bg-zinc-200 font-bold px-8 shadow-lg">Next Step <ArrowRight size={16} className="ml-2" /></Button>
          ) : (
            <Button onClick={handleSubmit} disabled={isLoading || !payment.amountPaid} className="bg-green-500 hover:bg-green-600 text-white font-bold px-8 shadow-lg shadow-green-900/20 gap-2">{isLoading ? <Loader2 className="animate-spin" /> : <><Download size={18} /> Confirm & Download</>}</Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PlusIcon() { return <Search size={16} strokeWidth={3} />; }