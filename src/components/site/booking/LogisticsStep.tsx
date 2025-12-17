"use client";

import { Dispatch, SetStateAction } from "react";
import { Calendar, MapPin, Navigation, AlertOctagon } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { TripDetails } from "@/types/booking.types";

interface LogisticsStepProps {
    trip: TripDetails;
    setTrip: Dispatch<SetStateAction<TripDetails>>;
    conflictError: string | null;
}

export function LogisticsStep({ trip, setTrip, conflictError }: LogisticsStepProps) {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-left-4">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl shadow-sm">
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2"><Calendar className="text-yellow-500" /> Rental Period</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase text-zinc-500">Pickup</Label>
                        <input type="datetime-local" className="w-full bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-700 rounded-xl py-3 px-4 text-sm dark:text-white [color-scheme:dark]" value={trip.startDate} onChange={(e) => setTrip({ ...trip, startDate: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase text-zinc-500">Return</Label>
                        <input type="datetime-local" className="w-full bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-700 rounded-xl py-3 px-4 text-sm dark:text-white [color-scheme:dark]" value={trip.endDate} onChange={(e) => setTrip({ ...trip, endDate: e.target.value })} />
                    </div>
                </div>
            </div>
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl shadow-sm">
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2"><MapPin className="text-yellow-500" /> Logistics</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <button onClick={() => setTrip({ ...trip, pickupType: 'hub' })} className={cn("p-4 rounded-xl border-2 text-left transition-all", trip.pickupType === 'hub' ? "border-yellow-500 bg-yellow-500/5" : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700")}>
                        <span className="font-bold block text-zinc-900 dark:text-white mb-1">Hub Pickup</span>
                        <span className="text-xs text-zinc-500 block">Pick up at {trip.location}</span>
                        <span className="text-xs font-bold text-green-500 mt-2 block">Free</span>
                    </button>
                    <button onClick={() => setTrip({ ...trip, pickupType: 'delivery' })} className={cn("p-4 rounded-xl border-2 text-left transition-all", trip.pickupType === 'delivery' ? "border-yellow-500 bg-yellow-500/5" : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700")}>
                        <span className="font-bold block text-zinc-900 dark:text-white mb-1">Deliver to Me</span>
                        <span className="text-xs text-zinc-500 block">We bring the car to you</span>
                        <span className="text-xs font-bold text-yellow-600 dark:text-yellow-500 mt-2 block">KES 100 / km</span>
                    </button>
                </div>
                {trip.pickupType === 'delivery' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2 bg-zinc-50 dark:bg-black/50 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800">
                        <div className="space-y-2">
                            <Label className="text-zinc-500 text-xs uppercase font-bold">Delivery Address</Label>
                            <Input placeholder="Enter street name..." className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 h-11" value={trip.deliveryAddress} onChange={(e) => setTrip({ ...trip, deliveryAddress: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-zinc-500 text-xs uppercase font-bold flex justify-between">
                                <span>Distance (KM)</span>
                                <span className="text-yellow-500">Rate: 100/- per km</span>
                            </Label>
                            <div className="relative">
                                <Navigation className="absolute left-3 top-3 text-zinc-400" size={16} />
                                <Input type="number" placeholder="e.g. 15" className="pl-10 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 h-11" value={trip.distanceKm} onChange={(e) => setTrip({ ...trip, distanceKm: parseFloat(e.target.value) || 0 })} />
                            </div>
                            <p className="text-[10px] text-zinc-500 text-right">Cost: <span className="font-bold text-zinc-900 dark:text-white">KES {(trip.distanceKm * 100).toLocaleString()}</span></p>
                        </div>
                    </div>
                )}
            </div>
            {conflictError && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-500 text-sm font-medium animate-pulse">
                    <AlertOctagon size={20} /> {conflictError}
                </div>
            )}
        </div>
    );
}
