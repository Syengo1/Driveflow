"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, ArrowRight, Loader2, CreditCard, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface Trip {
  id: string;
  carName: string;
  plate: string;
  currentEndDate: string; // ISO String
  dailyRate: number;
}

interface Props {
  trip: Trip;
  onExtendConfirm: (newDate: string) => void;
  trigger?: React.ReactNode;
}

export default function ExtendTripWizard({ trip, onExtendConfirm, trigger }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1); // 1=Select, 2=Pay
  const [isLoading, setIsLoading] = useState(false);
  const [newEndDate, setNewEndDate] = useState("");
  const [error, setError] = useState<string | null>(null);

  // --- LOGIC: CALCULATE COSTS ---
  const calculateExtension = () => {
    if (!newEndDate) return { days: 0, cost: 0 };
    
    const current = new Date(trip.currentEndDate);
    const extended = new Date(newEndDate);
    
    // Difference in time
    const diffTime = extended.getTime() - current.getTime();
    // Difference in days (Math.ceil to charge for full days)
    const extraDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (extraDays <= 0) return { days: 0, cost: 0 };
    
    return {
      days: extraDays,
      cost: extraDays * trip.dailyRate
    };
  };

  const { days, cost } = calculateExtension();

  // --- LOGIC: CHECK AVAILABILITY ---
  const handleCheckAndProceed = () => {
    setError(null);
    if (days <= 0) {
      setError("New return date must be after current return date.");
      return;
    }

    setIsLoading(true);
    
    // Simulate DB Check (Is the car free for these specific extra days?)
    setTimeout(() => {
      const isAvailable = true; // Mock result
      
      if (isAvailable) {
        setIsLoading(false);
        setStep(2); // Move to Payment
      } else {
        setIsLoading(false);
        setError("This vehicle is already booked by another client for those dates. Please select an earlier return date or contact support.");
      }
    }, 1500);
  };

  // --- LOGIC: PROCESS PAYMENT ---
  const handlePayment = () => {
    setIsLoading(true);
    
    // Simulate M-Pesa STK Push
    setTimeout(() => {
      setIsLoading(false);
      onExtendConfirm(newEndDate); // Update parent state
      setIsOpen(false);
      setStep(1); // Reset
    }, 2500);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger ? trigger : <Button>Extend Trip</Button>}
      </DialogTrigger>
      
      <DialogContent className="glass-panel border-zinc-800 text-white max-w-md p-0 gap-0 overflow-hidden">
        
        <DialogHeader className="p-6 border-b border-white/10 bg-zinc-900">
          <DialogTitle className="flex items-center gap-2">
            <Clock className="text-yellow-500" size={20} />
            <span>Extend Rental Period</span>
          </DialogTitle>
        </DialogHeader>

        <div className="p-6">
          
          {/* STEP 1: SELECT NEW DATE */}
          {step === 1 && (
            <div className="space-y-6 animate-in slide-in-from-right-4">
              <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl flex justify-between items-center">
                <div>
                  <p className="text-xs text-zinc-500 uppercase font-bold">Current Return</p>
                  <p className="text-white font-mono">{new Date(trip.currentEndDate).toLocaleDateString("en-GB")}</p>
                </div>
                <ArrowRight className="text-zinc-600" />
                <div className="text-right">
                  <p className="text-xs text-yellow-500 uppercase font-bold">New Return</p>
                  <p className="text-white font-mono font-bold">
                    {newEndDate ? new Date(newEndDate).toLocaleDateString("en-GB") : "Select Date"}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Select New Return Date</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 text-zinc-400" size={16} />
                  <Input 
                    type="date" 
                    min={new Date(trip.currentEndDate).toISOString().split('T')[0]} // Can't pick past dates
                    className="pl-10 bg-black border-zinc-800 [color-scheme:dark]" 
                    onChange={(e) => setNewEndDate(e.target.value)}
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex gap-2 text-red-400 text-sm">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {days > 0 && (
                <div className="flex justify-between items-center pt-2 border-t border-white/10">
                  <span className="text-zinc-400 text-sm">Additional Cost ({days} days)</span>
                  <span className="text-xl font-black text-white">KES {cost.toLocaleString()}</span>
                </div>
              )}

              <Button 
                onClick={handleCheckAndProceed} 
                disabled={isLoading || !newEndDate}
                className="w-full bg-white text-black hover:bg-zinc-200 font-bold h-12 rounded-xl"
              >
                {isLoading ? <Loader2 className="animate-spin" /> : "Check Availability & Proceed"}
              </Button>
            </div>
          )}

          {/* STEP 2: PAYMENT */}
          {step === 2 && (
            <div className="space-y-6 animate-in slide-in-from-right-4">
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-green-500">
                  <CreditCard size={32} />
                </div>
                <h3 className="text-xl font-bold mb-1">Confirm Payment</h3>
                <p className="text-zinc-400 text-sm">Pay the difference to confirm extension.</p>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Extra Time</span>
                  <span className="text-white">{days} Days</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">New Return Date</span>
                  <span className="text-white">{new Date(newEndDate).toLocaleDateString("en-GB")}</span>
                </div>
                <div className="h-px bg-zinc-800 my-2" />
                <div className="flex justify-between text-lg font-black">
                  <span className="text-white">Total Due</span>
                  <span className="text-green-500">KES {cost.toLocaleString()}</span>
                </div>
              </div>

              <Button 
                onClick={handlePayment} 
                disabled={isLoading}
                className="w-full bg-green-600 hover:bg-green-500 text-white font-bold h-12 rounded-xl shadow-lg shadow-green-900/20"
              >
                {isLoading ? (
                  <><Loader2 className="animate-spin mr-2" /> Processing M-Pesa...</>
                ) : (
                  "Pay & Extend"
                )}
              </Button>
              
              <button onClick={() => setStep(1)} className="w-full text-xs text-zinc-500 hover:text-white py-2">
                Cancel and go back
              </button>
            </div>
          )}
          
        </div>
      </DialogContent>
    </Dialog>
  );
}