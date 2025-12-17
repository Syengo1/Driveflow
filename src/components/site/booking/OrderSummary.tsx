"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { FleetUnit, TripDetails } from "@/types/booking.types";

interface OrderSummaryProps {
    selectedUnit: FleetUnit;
    trip: TripDetails;
    totalDays: number;
    costs: {
        subtotal: number;
        deliveryFee: number;
        total: number;
    };
}

export function OrderSummary({ selectedUnit, trip, totalDays, costs }: OrderSummaryProps) {
    return (
        <div className="sticky top-24 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-xl">
            <h3 className="text-xl font-black mb-6 text-zinc-900 dark:text-white">Order Summary</h3>
            <div className="flex gap-4 mb-6 pb-6 border-b border-zinc-100 dark:border-zinc-800">
                <img src={selectedUnit.image} className="w-24 h-16 object-cover rounded-lg bg-zinc-100" alt="car" />
                <div>
                    <p className="font-bold text-sm text-zinc-900 dark:text-white">{selectedUnit.modelName}</p>
                    <Badge variant="outline" className="mt-1 text-[10px] border-zinc-300 dark:border-zinc-700 text-zinc-500">{selectedUnit.public_id}</Badge>
                </div>
            </div>
            <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                    <span className="text-zinc-500">Duration</span>
                    <span className="font-bold">{totalDays} {totalDays > 1 ? 'Days' : 'Day'}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-zinc-500">Car Rate</span>
                    <span className="font-mono font-bold">KES {costs.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-zinc-500">Delivery</span>
                    <span className={cn("font-mono", costs.deliveryFee > 0 ? "font-bold" : "text-green-500")}>
                        {costs.deliveryFee > 0 ? `KES ${costs.deliveryFee.toLocaleString()}` : 'Free'}
                    </span>
                </div>
                <div className="h-px bg-zinc-100 dark:bg-zinc-800 my-4" />
                <div className="flex justify-between text-lg font-black">
                    <span className="text-zinc-900 dark:text-white">Total</span>
                    <span className="text-yellow-600 dark:text-yellow-500">KES {costs.total.toLocaleString()}</span>
                </div>
            </div>
        </div>
    );
}
