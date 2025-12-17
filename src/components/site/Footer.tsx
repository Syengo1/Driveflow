"use client";

import { useState } from "react";
import Link from "next/link";
import { ShieldCheck, Facebook, Twitter, Instagram, Linkedin, Lock, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setSubscribed(true);
    }, 1500);
  };

  return (
    <footer className="bg-zinc-100 dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-900 transition-colors duration-300">
      
      {/* Top Section */}
      <div className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-4 gap-12">
        
        {/* Brand Column */}
        <div className="space-y-6">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-yellow-500 flex items-center justify-center text-black shadow-lg group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <span className="font-black text-xl tracking-wide text-zinc-900 dark:text-white">DRIVEFLOW</span>
          </Link>
          <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed">
            Kenya's premier car rental service. We provide luxury, comfort, and reliability for every journey across East Africa.
          </p>
          <div className="flex gap-4">
            {[Facebook, Twitter, Instagram, Linkedin].map((Icon, i) => (
              <a 
                key={i} 
                href="#" 
                className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-900 flex items-center justify-center text-zinc-600 dark:text-zinc-400 hover:bg-yellow-500 hover:text-black dark:hover:bg-yellow-500 dark:hover:text-black transition-all duration-300"
              >
                <Icon size={18} />
              </a>
            ))}
          </div>
        </div>

        {/* Links Column 1 */}
        <div>
          <h4 className="font-bold text-zinc-900 dark:text-white mb-6">Company</h4>
          <ul className="space-y-4 text-sm text-zinc-600 dark:text-zinc-400">
            <li><Link href="/about" className="hover:text-yellow-600 dark:hover:text-yellow-500 transition-colors flex items-center gap-2 group"><span className="w-0 group-hover:w-2 h-0.5 bg-yellow-500 transition-all"/> About Us</Link></li>
            <li><Link href="/fleet" className="hover:text-yellow-600 dark:hover:text-yellow-500 transition-colors flex items-center gap-2 group"><span className="w-0 group-hover:w-2 h-0.5 bg-yellow-500 transition-all"/> Our Fleet</Link></li>
            <li><Link href="/careers" className="hover:text-yellow-600 dark:hover:text-yellow-500 transition-colors flex items-center gap-2 group"><span className="w-0 group-hover:w-2 h-0.5 bg-yellow-500 transition-all"/> Careers</Link></li>
            <li><Link href="/admin" className="hover:text-yellow-600 dark:hover:text-yellow-500 transition-colors flex items-center gap-2 group"><Lock size={14} className="text-zinc-400 group-hover:text-yellow-500"/> Staff Portal</Link></li>
          </ul>
        </div>

        {/* Links Column 2 */}
        <div>
          <h4 className="font-bold text-zinc-900 dark:text-white mb-6">Support</h4>
          <ul className="space-y-4 text-sm text-zinc-600 dark:text-zinc-400">
            <li><Link href="/contact" className="hover:text-yellow-600 dark:hover:text-yellow-500 transition-colors flex items-center gap-2 group"><span className="w-0 group-hover:w-2 h-0.5 bg-yellow-500 transition-all"/> Help Center</Link></li>
            <li><Link href="/terms" className="hover:text-yellow-600 dark:hover:text-yellow-500 transition-colors flex items-center gap-2 group"><span className="w-0 group-hover:w-2 h-0.5 bg-yellow-500 transition-all"/> Terms of Service</Link></li>
            <li><Link href="/privacy" className="hover:text-yellow-600 dark:hover:text-yellow-500 transition-colors flex items-center gap-2 group"><span className="w-0 group-hover:w-2 h-0.5 bg-yellow-500 transition-all"/> Privacy Policy</Link></li>
            <li><Link href="/insurance" className="hover:text-yellow-600 dark:hover:text-yellow-500 transition-colors flex items-center gap-2 group"><span className="w-0 group-hover:w-2 h-0.5 bg-yellow-500 transition-all"/> Insurance Info</Link></li>
          </ul>
        </div>

        {/* Newsletter */}
        <div>
          <h4 className="font-bold text-zinc-900 dark:text-white mb-6">Stay Updated</h4>
          <p className="text-zinc-600 dark:text-zinc-400 text-sm mb-4">
            Join our newsletter for exclusive deals and safari guides.
          </p>
          
          {subscribed ? (
            <div className="flex items-center gap-2 text-green-600 dark:text-green-500 bg-green-100 dark:bg-green-900/20 p-3 rounded-xl border border-green-200 dark:border-green-900">
              <CheckCircle2 size={20} />
              <span className="text-sm font-bold">You're subscribed!</span>
            </div>
          ) : (
            <form onSubmit={handleSubscribe} className="flex flex-col gap-3">
              <div className="relative">
                <Input 
                  type="email" 
                  required
                  placeholder="Enter your email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 h-11 pr-10 focus:ring-2 focus:ring-yellow-500"
                />
              </div>
              <Button type="submit" disabled={isLoading} className="bg-zinc-900 dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 h-11 font-bold">
                {isLoading ? <Loader2 className="animate-spin" /> : "Subscribe Now"}
              </Button>
            </form>
          )}
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-zinc-200 dark:border-zinc-900 py-8 bg-zinc-50 dark:bg-black">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-zinc-500 text-xs font-medium">
            © 2025 Driveflow Rentals. All rights reserved.
          </p>
          <div className="flex gap-6 text-xs text-zinc-500 font-medium uppercase tracking-wider">
            <span>Nairobi, Kenya</span>
            <span>•</span>
            <span>Built with Precision</span>
          </div>
        </div>
      </div>
    </footer>
  );
}