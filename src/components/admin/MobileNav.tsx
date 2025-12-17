"use client";

import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"; // Added SheetTitle
import { Button } from "@/components/ui/button";
import { Menu, ShieldCheck } from "lucide-react";
import Sidebar from "./Sidebar";

export default function MobileNav() {
  return (
    <header className="md:hidden sticky top-0 z-50 w-full border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-xl px-4 h-16 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center border border-yellow-500/20">
          <ShieldCheck className="text-yellow-500 w-5 h-5" />
        </div>
        <span className="font-bold text-white tracking-wide">DRIVEFLOW</span>
      </div>

      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white">
            <Menu size={24} />
          </Button>
        </SheetTrigger>
        
        <SheetContent side="left" className="p-0 w-72 bg-zinc-950 border-r-zinc-800 text-white">
          {/* ACCESSIBILITY FIX: Hidden Title */}
          <SheetTitle className="sr-only">Mobile Navigation Menu</SheetTitle>
          
          <Sidebar mobileMode={true} />
        </SheetContent>
      </Sheet>
    </header>
  );
}