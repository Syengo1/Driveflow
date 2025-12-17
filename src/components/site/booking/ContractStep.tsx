"use client";

import { useRef } from "react";
import SignatureCanvas from 'react-signature-canvas';
import { FileSignature } from "lucide-react";
import { Label } from "@/components/ui/label";
import { KycData, FleetUnit, TripDetails } from "@/types/booking.types";

interface ContractStepProps {
    kyc: KycData;
    selectedUnit: FleetUnit;
    trip: TripDetails;
    // FIX: Pass costs explicitly so we don't rely on 'trip.totalCost' which doesn't exist
    costs: { total: number }; 
    sigPad: React.RefObject<any>;
}

export function ContractStep({ kyc, selectedUnit, trip, costs, sigPad }: ContractStepProps) {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl shadow-sm">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><FileSignature className="text-yellow-500" /> Rental Agreement</h3>
                <div className="h-48 bg-zinc-50 dark:bg-zinc-950 rounded-xl p-4 overflow-y-auto text-xs text-zinc-600 dark:text-zinc-400 mb-6 border border-zinc-200 dark:border-zinc-800 leading-relaxed">
                    <p><strong>1. PARTIES:</strong> This agreement is between Driveflow Rentals and {kyc.fullName || "the renter"}.</p>
                    <p className="mt-2"><strong>2. VEHICLE:</strong> The renter agrees to rent {selectedUnit.modelName} (ID: {selectedUnit.public_id}).</p>
                    <p className="mt-2"><strong>3. LOGISTICS:</strong> Handover via {trip.pickupType === 'delivery' ? `Delivery to ${trip.deliveryAddress}` : 'Hub Pickup'}.</p>
                    <p className="mt-2"><strong>4. LIABILITY:</strong> The renter is responsible for all fines, tolls, and damages not covered by insurance. Use of the vehicle for any illegal purpose is strictly prohibited.</p>
                    {/* FIX: Use costs.total instead of trip.totalCost */}
                    <p className="mt-2"><strong>5. PAYMENT:</strong> The total rental cost of KES {costs.total.toLocaleString()} is due upfront. By signing, you authorize Driveflow to charge any additional fees incurred.</p>
                </div>
                <div className="mb-4">
                    <Label className="text-zinc-500 text-xs uppercase font-bold mb-2 block">Sign Below</Label>
                    <div className="border border-zinc-300 dark:border-zinc-700 rounded-xl overflow-hidden bg-white">
                        <SignatureCanvas ref={sigPad} penColor="black" canvasProps={{ width: 500, height: 150, className: 'sigCanvas w-full' }} />
                    </div>
                    <button onClick={() => sigPad.current?.clear()} className="text-xs text-red-500 hover:underline mt-2 p-1">Clear Signature</button>
                </div>
            </div>
        </div>
    );
}