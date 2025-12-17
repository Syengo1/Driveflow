"use client";

import { useState, useEffect, useCallback } from "react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Wrench, Activity, ShieldAlert, MapPin, CheckCircle2, TrendingUp, 
  X, Fuel, FileText, Camera, Sparkles, ArrowRight, Loader2, AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import LogServiceWizard from "./LogServiceWizard";

// --- TYPES ---
interface Unit {
  id: string;
  plate: string;
  color: string;
  fuel: string;
  mileage: number;
  status: string;
  location?: string;
  
  // Maintenance Data
  lastServiceMileage?: number;
  serviceIntervalKm?: number;
  nextServiceDate?: string;
  
  // Transient Data (Now persisted in DB)
  current_fuel?: number; 
  checkout_notes?: string; 
}

interface TimelineEvent {
  id: string;
  date: string;
  title: string;
  subtitle: string;
  type: "info" | "maintenance" | "issue";
  icon: any;
}

export default function UnitDetailSheet({ unit, isOpen, onClose, onUpdateStatus }: { 
  unit: Unit | null, 
  isOpen: boolean, 
  onClose: () => void, 
  onUpdateStatus: (id: string, status: string) => void 
}) {
  const [localUnit, setLocalUnit] = useState<Unit | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [financials, setFinancials] = useState({ revenue: 0, cost: 0, roi: 0 });
  
  // --- INSPECTION FORM STATE ---
  const [inspectionData, setInspectionData] = useState({
    fuelLevel: 50,
    notes: "",
    isClean: true,      
    hasNewDamage: false 
  });

  // --- 1. DATA HYDRATION ENGINE ---
  const fetchUnitDetails = useCallback(async () => {
    // If we don't have a unit ID to fetch, abort. 
    // We use localUnit?.id if unit prop is null during a refresh cycle.
    const targetId = unit?.id || localUnit?.id;
    if (!targetId) return;

    try {
        // A. Fetch FRESH Unit Data (Critical for Mileage updates)
        const { data: freshUnit, error: unitError } = await supabase
            .from('fleet_units')
            .select('*')
            .eq('id', targetId)
            .single();
        
        if (unitError) throw unitError;

        // B. Fetch Maintenance Logs for Timeline
        const { data: logs } = await supabase
            .from('maintenance_logs')
            .select('*')
            .eq('unit_id', targetId)
            .order('service_date', { ascending: false });

        // C. Fetch Bookings for Revenue
        const { data: bookings } = await supabase
            .from('bookings')
            .select('total_cost, status')
            .eq('unit_id', targetId)
            .neq('status', 'cancelled');

        // D. Calculate Financials
        const totalRevenue = bookings?.reduce((sum, b) => sum + (b.total_cost || 0), 0) || 0;
        const totalCost = logs?.reduce((sum, l) => sum + (l.cost || 0), 0) || 0;
        const profit = totalRevenue - totalCost;
        const calculatedRoi = totalCost > 0 ? Math.round((profit / totalCost) * 100) : 0;

        setFinancials({ revenue: totalRevenue, cost: totalCost, roi: calculatedRoi });

        // E. Build Timeline
        const mappedTimeline: TimelineEvent[] = (logs || []).map(log => ({
            id: log.id,
            date: new Date(log.service_date).toLocaleDateString('en-GB'),
            title: log.service_type,
            subtitle: `${log.notes || 'Service performed'} @ ${log.mileage_at_service.toLocaleString()}km`,
            type: "maintenance",
            icon: Wrench
        }));

        setTimeline(mappedTimeline);
        
        // F. Sync Local Unit State
        // We map the DB columns back to our frontend Interface format
        setLocalUnit({
            id: freshUnit.id,
            plate: freshUnit.plate_number,
            color: freshUnit.color,
            fuel: freshUnit.fuel_type,
            mileage: freshUnit.current_mileage,
            status: freshUnit.status,
            location: freshUnit.hub_location,
            lastServiceMileage: freshUnit.last_service_mileage,
            serviceIntervalKm: freshUnit.service_interval_km,
            nextServiceDate: freshUnit.next_service_date,
            current_fuel: freshUnit.current_fuel || 50,
            checkout_notes: freshUnit.checkout_notes || ""
        });

        // G. Sync Inspection Form
        setInspectionData(prev => ({
            ...prev,
            fuelLevel: freshUnit.current_fuel || 50,
            notes: freshUnit.checkout_notes || "" // Load notes if car is rented
        }));
    } catch (err) {
        console.error("Error refreshing unit details:", err);
    }

  }, [unit, localUnit?.id]);

  useEffect(() => {
    if (isOpen && unit) {
      // Set initial state from props to avoid flicker, then fetch fresh data
      setLocalUnit(unit); 
      fetchUnitDetails();
    }
  }, [isOpen, unit, fetchUnitDetails]);

  if (!localUnit) return null;

  // --- LOGIC ENGINE 1: MAINTENANCE HEALTH ---
  // Mileage-based calculation
  const intervalKm = localUnit.serviceIntervalKm || 5000;
  const lastServiceKm = localUnit.lastServiceMileage || 0;
  const kmSinceService = localUnit.mileage - lastServiceKm;
  const kmRemaining = Math.max(0, intervalKm - kmSinceService);
  const mileageHealthPercentage = (kmRemaining / intervalKm) * 100;

  // Time-based calculation
  let dateHealthPercentage = 100;
  let daysRemaining: number | null = null;
  if (localUnit.nextServiceDate) {
    const nextServiceDate = new Date(localUnit.nextServiceDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0); 

    const timeDiff = nextServiceDate.getTime() - today.getTime();
    daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24)); // Allow negative for overdue

    const assumedTotalIntervalDays = 182; // 6 months
    dateHealthPercentage = Math.max(0, (daysRemaining / assumedTotalIntervalDays) * 100);
  }
  
  // Overall health is the more urgent of the two percentages
  const healthPercentage = Math.min(Math.max(0, mileageHealthPercentage), Math.max(0, dateHealthPercentage));

  const getHealthStatus = () => {
    if (kmRemaining <= 0 || (daysRemaining !== null && daysRemaining <= 0)) {
        return { text: "Overdue", color: "red" };
    }
    if (healthPercentage <= 25) {
        return { text: "Service Soon", color: "orange" };
    }
    return { text: "Healthy", color: "green" };
  };
  const healthStatus = getHealthStatus();

  // --- HANDLER: PERFORM DB UPDATE ---
  const performStatusUpdate = async (newStatus: string, logTitle: string, logSubtitle: string, icon: any) => {
    setIsProcessing(true);
    try {
        const updates: any = { status: newStatus };
        
        if (newStatus === 'rented') {
            updates.current_fuel = inspectionData.fuelLevel;
            updates.checkout_notes = inspectionData.notes;
        } 
        else if (['available', 'maintenance', 'cleaning'].includes(newStatus)) {
            updates.current_fuel = inspectionData.fuelLevel;
        }

        const { error } = await supabase
            .from('fleet_units')
            .update(updates)
            .eq('id', localUnit.id);

        if (error) throw error;

        setLocalUnit(prev => prev ? ({ ...prev, ...updates }) : null);
        onUpdateStatus(localUnit.id, newStatus);
        
        toast.success(logTitle, { description: logSubtitle });
        
        if (newStatus === 'available') {
            setTimeout(onClose, 500);
        }

    } catch (err: any) {
        console.error("Update failed", err);
        toast.error("Update Failed", { description: err.message });
    } finally {
        setIsProcessing(false);
    }
  };

  const submitInspection = (type: 'checkout' | 'return') => {
    if (type === 'checkout') {
      performStatusUpdate('rented', 'Vehicle Checked Out', `Fuel: ${inspectionData.fuelLevel}% | Notes Saved`, ArrowRight);
    } else {
      if (inspectionData.hasNewDamage) {
        performStatusUpdate('maintenance', 'Flagged for Maintenance', 'Damage reported during return', ShieldAlert);
      } else if (!inspectionData.isClean) {
        performStatusUpdate('cleaning', 'Sent to Cleaning', 'Marked as dirty on return', Sparkles);
      } else {
        performStatusUpdate('available', 'Return Complete', 'Vehicle returned to fleet pool', CheckCircle2);
      }
    }
  };

  // --- HANDLER: REFRESH AFTER SERVICE ---
  const handleServiceLogSuccess = async () => {
      // 1. Re-fetch all details to update Timeline, Costs, and Mileage
      await fetchUnitDetails(); 
      // 2. Notify Admin
      toast.success("Service Logged", { description: "Maintenance record updated and schedule reset." });
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-xl border-l border-zinc-800 bg-zinc-950 text-white p-0 flex flex-col h-[100vh] shadow-2xl focus:outline-none [&>button]:hidden">
        
        {/* --- HEADER --- */}
        <div className="relative overflow-hidden p-6 pb-6 bg-zinc-900 border-b border-white/5 shrink-0 z-20">
          <div className={cn("absolute top-0 right-0 w-64 h-64 blur-[80px] opacity-20 rounded-full pointer-events-none",
            localUnit.status === 'available' ? "bg-green-500" :
            localUnit.status === 'rented' ? "bg-blue-500" :
            localUnit.status === 'maintenance' ? "bg-orange-500" : 
            "bg-purple-500" 
          )} />

          <div className="relative z-10 flex justify-between items-start">
            <div className="flex gap-4">
              <div className="w-14 h-14 rounded-xl bg-zinc-800 flex items-center justify-center border border-zinc-700 shadow-xl">
                 <span className="font-mono text-xl font-bold text-white tracking-tighter">{localUnit.plate.substring(0, 3)}</span>
              </div>
              <div>
                <SheetTitle className="text-2xl font-bold text-white tracking-tight">{localUnit.plate}</SheetTitle>
                <div className="flex items-center gap-2 text-zinc-400 text-sm mt-1">
                  <Badge variant="outline" className="border-zinc-700 text-zinc-400 font-normal h-5">{localUnit.fuel}</Badge>
                  <span>•</span>
                  <span className="font-mono text-white">{localUnit.mileage.toLocaleString()} km</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
               <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-zinc-400 hover:text-white"><X size={20} /></button>
               <Badge className={cn("px-3 py-1 text-xs font-bold capitalize", 
                localUnit.status === 'available' ? "bg-green-500 text-black" :
                localUnit.status === 'rented' ? "bg-blue-500 text-white" :
                localUnit.status === 'maintenance' ? "bg-orange-500 text-black" : 
                "bg-purple-500 text-white"
              )}>
                {localUnit.status.replace("_", " ")}
              </Badge>
            </div>
          </div>
        </div>

        {/* --- TABS --- */}
        <Tabs defaultValue="inspection" className="flex-1 flex flex-col min-h-0">
          <div className="px-6 bg-zinc-900 border-b border-zinc-800 shrink-0 z-10">
            <TabsList className="bg-transparent p-0 gap-8 h-12 w-full justify-start">
              {["inspection", "health", "finance"].map(tab => (
                 <TabsTrigger key={tab} value={tab} className="bg-transparent p-0 data-[state=active]:bg-transparent data-[state=active]:text-yellow-500 data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-yellow-500 rounded-none h-full transition-all capitalize text-zinc-400">
                   {tab}
                 </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 relative">
              
              {/* --- TAB 1: INSPECTION & LIFECYCLE --- */}
              <TabsContent value="inspection" className="mt-0 pb-8 space-y-6 animate-in fade-in slide-in-from-right-4">
                
                {/* SCENARIO A: CAR IS AVAILABLE */}
                {localUnit.status === 'available' && (
                  <div className="space-y-6">
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex gap-3">
                      <FileText className="text-blue-400 shrink-0" />
                      <div><h4 className="font-bold text-blue-400 text-sm">Ready for Checkout</h4><p className="text-zinc-400 text-xs mt-1">Document condition before handover.</p></div>
                    </div>
                    
                    {/* Fuel Slider */}
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
                      <div className="flex justify-between mb-4">
                        <label className="text-sm font-medium text-white flex items-center gap-2"><Fuel size={16} className="text-yellow-500"/> Fuel Level</label>
                        <span className="text-yellow-500 font-mono font-bold">{inspectionData.fuelLevel}%</span>
                      </div>
                      <input type="range" min="0" max="100" value={inspectionData.fuelLevel} onChange={(e) => setInspectionData({...inspectionData, fuelLevel: parseInt(e.target.value)})} className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-yellow-500"/>
                      <div className="flex justify-between text-[10px] text-zinc-500 mt-2 uppercase font-bold"><span>Empty</span><span>Half</span><span>Full</span></div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-400">Departure Notes</label>
                      <textarea className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-sm text-white focus:border-yellow-500 outline-none min-h-[120px]" placeholder="e.g. Client is taking it for a wedding..." value={inspectionData.notes} onChange={(e) => setInspectionData({...inspectionData, notes: e.target.value})}/>
                    </div>

                    <Button onClick={() => submitInspection('checkout')} disabled={isProcessing} className="w-full bg-white text-black hover:bg-zinc-200 font-bold h-12 shadow-lg">
                      {isProcessing ? <Loader2 className="animate-spin" /> : "Confirm Checkout & Mark Rented"}
                    </Button>
                  </div>
                )}

                {/* SCENARIO B: CAR IS RENTED */}
                {localUnit.status === 'rented' && (
                  <div className="space-y-6">
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                      <h4 className="font-bold text-zinc-500 text-xs uppercase mb-2">Previous Checkout Notes</h4>
                      <p className="text-white text-sm bg-black/50 p-3 rounded-lg border border-zinc-800 italic text-zinc-300">{localUnit.checkout_notes || "No notes recorded."}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                          <label className="text-xs font-bold text-zinc-500 uppercase block mb-2">Return Fuel %</label>
                          <div className="flex items-center gap-2"><Fuel className="text-yellow-500" size={18} /><input type="number" value={inspectionData.fuelLevel} onChange={(e) => setInspectionData({...inspectionData, fuelLevel: parseInt(e.target.value)})} className="bg-transparent text-2xl font-mono font-bold text-white w-full outline-none" /></div>
                        </div>
                        
                        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 flex flex-col justify-center gap-2">
                          <button 
                            onClick={() => setInspectionData(prev => ({...prev, isClean: !prev.isClean}))}
                            className={cn("text-xs font-bold py-2 px-3 rounded-lg border transition-all flex items-center justify-between", 
                              inspectionData.isClean 
                                ? "bg-green-500/10 text-green-500 border-green-500/20" 
                                : "bg-purple-500/10 text-purple-500 border-purple-500/20"
                            )}
                          >
                            Interior: {inspectionData.isClean ? "Clean" : "Dirty"} 
                            {inspectionData.isClean ? <Sparkles size={14} /> : <X size={14} />}
                          </button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium text-zinc-400">Return Notes</label>
                          <button 
                            onClick={() => setInspectionData(p => ({...p, hasNewDamage: !p.hasNewDamage}))}
                            className={cn("text-xs font-bold px-3 py-1 rounded-full transition-all border", 
                              inspectionData.hasNewDamage ? "bg-red-500 text-white border-red-600" : "bg-zinc-800 text-zinc-400 border-zinc-700"
                            )}
                          >
                            {inspectionData.hasNewDamage ? "DAMAGE REPORTED" : "No New Damage"}
                          </button>
                        </div>
                        <textarea className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-sm text-white focus:border-yellow-500 outline-none min-h-[100px]" placeholder={inspectionData.hasNewDamage ? "DESCRIBE DAMAGE HERE..." : "Notes on return condition..."} value={inspectionData.notes} onChange={(e) => setInspectionData({...inspectionData, notes: e.target.value})}/>
                    </div>

                    <Button 
                      onClick={() => submitInspection('return')} 
                      disabled={isProcessing} 
                      className={cn("w-full font-bold h-12 shadow-lg transition-all",
                        inspectionData.hasNewDamage ? "bg-red-500 hover:bg-red-600 text-white" :
                        !inspectionData.isClean ? "bg-purple-500 hover:bg-purple-600 text-white" :
                        "bg-green-500 hover:bg-green-600 text-white"
                      )}
                    >
                      {isProcessing ? <Loader2 className="animate-spin" /> : 
                        inspectionData.hasNewDamage ? "Report Damage & Flag Maintenance" :
                        !inspectionData.isClean ? "Send to Cleaning Queue" :
                        "Clear & Mark Available"
                      }
                    </Button>
                  </div>
                )}

                {/* SCENARIO C: MAINTENANCE */}
                {localUnit.status === 'maintenance' && (
                   <div className="flex flex-col items-center justify-center h-[300px] text-center space-y-4">
                      <div className="w-16 h-16 bg-orange-500/20 text-orange-500 rounded-full flex items-center justify-center animate-pulse"><Wrench size={32} /></div>
                      <div><h3 className="text-xl font-bold text-white">Under Maintenance</h3><p className="text-zinc-400 text-sm mt-1">This unit is flagged for repairs.</p></div>
                      <Button disabled={isProcessing} onClick={() => performStatusUpdate('available', 'Maintenance Complete', 'Vehicle cleared for duty', CheckCircle2)} className="mt-4 bg-white text-black hover:bg-zinc-200 font-bold">
                        {isProcessing ? <Loader2 className="animate-spin" /> : "Mark Repairs Complete"}
                      </Button>
                   </div>
                )}

                {/* SCENARIO D: CLEANING */}
                {localUnit.status === 'cleaning' && (
                   <div className="flex flex-col items-center justify-center h-[300px] text-center space-y-4">
                      <div className="w-16 h-16 bg-purple-500/20 text-purple-500 rounded-full flex items-center justify-center animate-pulse"><Sparkles size={32} /></div>
                      <div><h3 className="text-xl font-bold text-white">At the Wash Bay</h3><p className="text-zinc-400 text-sm mt-1">Vehicle returned dirty. Cleaning in progress.</p></div>
                      <Button disabled={isProcessing} onClick={() => performStatusUpdate('available', 'Cleaning Complete', 'Vehicle is spotless', CheckCircle2)} className="mt-4 bg-white text-black hover:bg-zinc-200 font-bold">
                        {isProcessing ? <Loader2 className="animate-spin" /> : "Mark Clean & Ready"}
                      </Button>
                   </div>
                )}
              </TabsContent>

              {/* --- TAB 2: HEALTH (Real DB Data) --- */}
              <TabsContent value="health" className="mt-0 space-y-6 animate-in fade-in slide-in-from-right-4">
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 relative overflow-hidden">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="font-bold text-white flex items-center gap-2 text-lg">
                        <Activity size={20} className={cn(
                          healthStatus.color === 'green' && 'text-green-500',
                          healthStatus.color === 'orange' && 'text-orange-500',
                          healthStatus.color === 'red' && 'text-red-500',
                        )} /> 
                        Maintenance Status
                      </h3>
                      <p className="text-xs text-zinc-500 mt-1 flex items-center gap-2">
                        Next service is due based on the most urgent factor.
                      </p>
                    </div>
                    {/* Log Service Wizard now triggers a DB refresh */}
                    <LogServiceWizard currentMileage={localUnit.mileage} onSave={handleServiceLogSuccess} unitId={localUnit.id} trigger={<Button size="sm" variant="outline" className="border-orange-500/50 text-orange-400 hover:bg-orange-500 hover:text-white">Log Service</Button>} />
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-end">
                      <div>
                        <span className="text-zinc-400 text-xs uppercase font-bold">Due In</span>
                        <div className="text-3xl font-mono font-bold text-white mt-1 flex items-baseline gap-2">
                          {kmRemaining.toLocaleString()} <span className="text-sm text-zinc-500">km</span>
                          {daysRemaining !== null && (
                            <>
                              <span className="text-2xl text-zinc-700 font-sans">or</span>
                              {daysRemaining} <span className="text-sm text-zinc-500">days</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={cn(
                          "text-xs font-bold px-2 py-1 rounded-full border",
                          healthStatus.color === 'green' && "border-green-500/30 text-green-500 bg-green-500/10",
                          healthStatus.color === 'orange' && "border-orange-500/30 text-orange-500 bg-orange-500/10",
                          healthStatus.color === 'red' && "border-red-500/30 text-red-500 bg-red-500/10"
                        )}>
                          {healthStatus.text}
                        </span>
                      </div>
                    </div>
                    <div className="h-4 w-full bg-zinc-950 rounded-full overflow-hidden border border-zinc-800 relative">
                        <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-zinc-800/50 z-10" />
                        <div 
                          className={cn(
                            "h-full transition-all duration-1000 ease-out relative z-0",
                            healthStatus.color === 'green' && "bg-gradient-to-r from-green-600 to-green-400",
                            healthStatus.color === 'orange' && "bg-gradient-to-r from-orange-600 to-orange-400",
                            healthStatus.color === 'red' && "bg-gradient-to-r from-red-600 to-red-400"
                          )} 
                          style={{ width: `${healthPercentage}%` }} 
                        />
                    </div>
                    <div className="flex justify-between text-[10px] text-zinc-500 uppercase font-mono">
                      <span>Target: {(lastServiceKm + intervalKm).toLocaleString()} km</span>
                      {localUnit.nextServiceDate && <span>Due Date: {new Date(localUnit.nextServiceDate).toLocaleDateString()}</span>}
                    </div>
                  </div>
                </div>

                {/* Info & Timeline (Real Data) */}
                <div className="grid grid-cols-2 gap-4">
                   <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 flex flex-col gap-2">
                      <div className="flex items-center gap-2 text-zinc-400 text-xs uppercase font-bold"><ShieldAlert size={14} /> Insurance</div>
                      <p className="text-green-400 font-medium text-sm flex items-center gap-2"><CheckCircle2 size={14}/> Active</p>
                   </div>
                   <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 flex flex-col gap-2">
                      <div className="flex items-center gap-2 text-zinc-400 text-xs uppercase font-bold"><MapPin size={14} /> Location</div>
                      <p className="text-white font-medium text-sm">{localUnit.location || "Main Hub"}</p>
                   </div>
                </div>
                
                <div className="pb-4">
                   <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-4">Maintenance History</h3>
                   {timeline.length > 0 ? (
                       <div className="relative border-l border-zinc-800 ml-3 space-y-8 pb-2">
                         {timeline.map((event) => (
                           <div key={event.id} className="ml-6 relative group">
                              <div className={cn("absolute -left-[33px] w-8 h-8 rounded-full border-4 border-zinc-950 flex items-center justify-center transition-transform group-hover:scale-110", event.type === 'maintenance' ? "bg-orange-500 text-black" : "bg-zinc-800 text-zinc-400")}><event.icon size={14} /></div>
                              <div>
                                 <div className="flex justify-between items-start"><p className="text-sm font-bold text-white">{event.title}</p><span className="text-[10px] text-zinc-600 font-mono">{event.date}</span></div>
                                 <p className="text-xs text-zinc-400 mt-1">{event.subtitle}</p>
                              </div>
                           </div>
                         ))}
                       </div>
                   ) : (
                       <p className="text-zinc-500 text-sm italic">No maintenance logs found.</p>
                   )}
                </div>
              </TabsContent>

              {/* --- TAB 3: FINANCE (Real DB Data) --- */}
              <TabsContent value="finance" className="mt-0 pb-8 animate-in fade-in slide-in-from-right-4">
                  <div className="grid grid-cols-2 gap-4 mb-6">
                     <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                        <p className="text-xs text-zinc-500 uppercase font-bold flex items-center gap-1"><TrendingUp size={14} /> Lifetime Rev.</p>
                        <p className="text-2xl font-bold text-white mt-1">KES {financials.revenue.toLocaleString()}</p>
                     </div>
                     <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                        <p className="text-xs text-zinc-500 uppercase font-bold flex items-center gap-1"><Wrench size={14} /> Total Costs</p>
                        <p className="text-2xl font-bold text-red-400 mt-1">KES {financials.cost.toLocaleString()}</p>
                     </div>
                  </div>
                  <div className="bg-gradient-to-br from-zinc-900 to-black border border-zinc-800 rounded-xl p-6 text-center">
                     <p className="text-sm text-zinc-400 mb-2">Return on Investment (ROI)</p>
                     <div className={cn("text-4xl font-black mb-2", financials.roi > 0 ? "text-green-500" : "text-zinc-500")}>{financials.roi}%</div>
                     <p className="text-xs text-zinc-500">
                        {financials.roi > 100 ? "This unit is highly profitable." : financials.roi > 0 ? "This unit is profitable." : "Not yet profitable."}
                     </p>
                  </div>
              </TabsContent>

          </div>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}