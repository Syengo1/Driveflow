"use client";

import { CheckCircle2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function SuccessStep() {
    const router = useRouter();

    return (
        <div className="text-center py-12 animate-in zoom-in-95">
            <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center text-green-500 mx-auto mb-6">
                <CheckCircle2 size={48} />
            </div>
            <h2 className="text-3xl font-black mb-2 text-zinc-900 dark:text-white">Booking Confirmed!</h2>
            <p className="text-zinc-500 mb-8 max-w-md mx-auto">We have received your request. Our team will verify your payment and documents shortly.</p>
            <div className="flex items-center justify-center gap-2 text-sm text-zinc-500">
                <Loader2 className="animate-spin" size={16} />
                Redirecting you now...
            </div>
        </div>
    );
}
