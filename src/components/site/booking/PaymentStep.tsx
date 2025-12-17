"use client";

import { Dispatch, SetStateAction } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { PaymentDetails, FleetUnit } from "@/types/booking.types";
import { CreditCardForm } from "./CreditCardForm";

interface PaymentStepProps {
    payment: PaymentDetails;
    setPayment: Dispatch<SetStateAction<PaymentDetails>>;
    costs: { total: number };
    selectedUnit: FleetUnit;
}

export function PaymentStep({ payment, setPayment, costs, selectedUnit }: PaymentStepProps) {
    const handlePaymentMethodChange = (method: 'mpesa' | 'card') => {
        setPayment(prev => ({ ...prev, method }));
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl shadow-sm">
                <h3 className="text-lg font-bold mb-4">Complete Payment</h3>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <button 
                        onClick={() => handlePaymentMethodChange('mpesa')} 
                        className={cn("p-4 rounded-xl border-2 text-left transition-all", payment.method === 'mpesa' ? "border-yellow-500 bg-yellow-500/5" : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700")}
                    >
                        <span className="font-bold block text-zinc-900 dark:text-white mb-1">M-Pesa</span>
                        <span className="text-xs text-zinc-500 block">Pay via M-Pesa Paybill</span>
                    </button>
                    <button 
                        onClick={() => handlePaymentMethodChange('card')} 
                        className={cn("p-4 rounded-xl border-2 text-left transition-all", payment.method === 'card' ? "border-yellow-500 bg-yellow-500/5" : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700")}
                    >
                        <span className="font-bold block text-zinc-900 dark:text-white mb-1">Card</span>
                        <span className="text-xs text-zinc-500 block">Visa or Mastercard</span>
                    </button>
                </div>

                {payment.method === 'mpesa' && (
                    <div className="p-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl animate-in fade-in">
                        <Label className="text-xs font-bold uppercase text-zinc-500 block mb-2">M-Pesa Paybill</Label>
                        <p className="text-3xl font-mono font-black text-zinc-900 dark:text-white tracking-widest">522 522</p>
                        <p className="text-sm text-zinc-500 mt-1">Account No: <span className="text-zinc-900 dark:text-white font-bold">RENT-{selectedUnit.public_id.split('-')[1]}</span></p>
                        <div className="my-4 h-px bg-zinc-200 dark:bg-zinc-800" />
                        <p className="text-sm font-medium text-zinc-500">Amount to Pay: <span className="text-green-600 font-bold">KES {costs.total.toLocaleString()}</span></p>
                        <div className="mt-4 space-y-2">
                           <Label>M-Pesa Transaction Code</Label>
                           <Input 
                                placeholder="e.g. QWE123RTY" 
                                value={payment.mpesaCode} 
                                onChange={(e) => setPayment(prev => ({...prev, mpesaCode: e.target.value.toUpperCase()}))} 
                                className="h-12 font-mono uppercase text-lg tracking-wide text-green-600 font-bold" />
                        </div>
                    </div>
                )}

                {payment.method === 'card' && (
                    <div className="animate-in fade-in">
                        <CreditCardForm payment={payment} setPayment={setPayment} />
                    </div>
                )}
            </div>
        </div>
    );
}
