"use client";

import { Dispatch, SetStateAction } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PaymentDetails } from "@/types/booking.types";

interface CreditCardFormProps {
    payment: PaymentDetails;
    setPayment: Dispatch<SetStateAction<PaymentDetails>>;
}

export function CreditCardForm({ payment, setPayment }: CreditCardFormProps) {
    return (
        <div className="space-y-4">
             <div className="space-y-2">
                <Label>Name on Card</Label>
                <Input 
                    placeholder="John M. Doe" 
                    value={payment.cardName}
                    onChange={(e) => setPayment(prev => ({...prev, cardName: e.target.value}))}
                    className="h-11"
                />
            </div>
            <div className="space-y-2">
                <Label>Card Number</Label>
                <Input 
                    placeholder="**** **** **** 1234" 
                    value={payment.cardNumber}
                    onChange={(e) => setPayment(prev => ({...prev, cardNumber: e.target.value}))}
                    className="h-11"
                />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Expiry Date</Label>
                    <Input 
                        placeholder="MM/YY" 
                        value={payment.cardExpiry}
                        onChange={(e) => setPayment(prev => ({...prev, cardExpiry: e.target.value}))}
                        className="h-11"
                    />
                </div>
                <div className="space-y-2">
                    <Label>CVC</Label>
                    <Input 
                        placeholder="123" 
                        value={payment.cardCvc}
                        onChange={(e) => setPayment(prev => ({...prev, cardCvc: e.target.value}))}
                        className="h-11"
                    />
                </div>
            </div>
        </div>
    );
}
