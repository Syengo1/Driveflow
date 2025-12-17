"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import { BookingWizard } from "@/components/site/booking/BookingWizard";
import { Loader2, ShieldCheck } from "lucide-react";

function BookingPageContent() {
  const searchParams = useSearchParams();
  const unitId = searchParams.get('unitId');
  const paramStart = searchParams.get('start') || "";
  const paramEnd = searchParams.get('end') || "";

  if (!unitId) {
    return (
      <div className="container mx-auto max-w-7xl px-6 text-center py-48">
        <h1 className="text-2xl font-bold">No vehicle selected</h1>
        <p className="text-zinc-500">Please go back to the fleet and select a vehicle to book.</p>
      </div>
    )
  }

  return <BookingWizard unitId={unitId} paramStart={paramStart} paramEnd={paramEnd} />;
}


export default function BookingPage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-white font-sans selection:bg-yellow-500/30">
      <Navbar />
      <div className="pt-32 pb-20 container mx-auto px-6 max-w-7xl">
          <div className="mb-8">
              <h1 className="text-3xl font-black mb-2">Secure Checkout</h1>
              <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
                <ShieldCheck size={16} className="text-green-500" />
                <span>Bank-Grade Encryption • Instant Verification</span>
              </div>
          </div>
          <Suspense fallback={<div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-yellow-500" size={40} /></div>}>
            <BookingPageContent />
          </Suspense>
      </div>
      <Footer />
    </div>
  );
}
