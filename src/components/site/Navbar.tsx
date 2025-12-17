"use client";

import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { 
  ShieldCheck, Menu, Car, Compass, 
  Briefcase, User, LogIn, ChevronRight, Gem, LogOut, LayoutDashboard
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/site/ThemeToggle";
import { cn } from "@/lib/utils";
import Image from "next/image"; 

import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  // FIX: Destructure 'signOut' instead of 'logout'
  const { user, signOut } = useAuth(); 

  // --- SCROLL LISTENER ---
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20); 
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // --- NAV LINKS ---
  const NAV_LINKS = [
    { name: "The Fleet", href: "/fleet", icon: Car },
    { name: "Chauffeur", href: "/services/chauffeur", icon: User },
    { name: "Safari", href: "/services/safari", icon: Compass },
    { name: "Careers", href: "/careers", icon: Briefcase },
  ];

  return (
    <nav 
      className={cn(
        "fixed top-0 w-full z-50 transition-all duration-500 ease-in-out",
        isScrolled 
          ? "bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-200 dark:border-white/5 h-20 shadow-sm" 
          : "bg-transparent border-transparent h-24"
      )}
    >
      <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">

        {/* --- 1. LOGO SECTION --- */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transition-all duration-500 group-hover:scale-105",
            isScrolled 
              ? "bg-gradient-to-tr from-yellow-600 to-yellow-400 text-black" 
              : "bg-white/10 backdrop-blur-md border border-white/20 text-white"
          )}>
            <ShieldCheck className="w-6 h-6" />
          </div>
          <span className={cn(
            "text-xl font-black tracking-wide transition-colors duration-300 font-sans",
            isScrolled ? "text-zinc-900 dark:text-white" : "text-white drop-shadow-md"
          )}>
            DRIVEFLOW
          </span>
        </Link>

        {/* --- 2. DESKTOP LINKS --- */}
        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <Link 
              key={link.name}
              href={link.href} 
              className={cn(
                "text-sm font-bold transition-all duration-300 flex items-center gap-2 group relative py-1",
                isScrolled 
                  ? "text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white" 
                  : "text-white/80 hover:text-white"
              )}
            >
              {link.name}
              <span className={cn(
                "absolute bottom-0 left-0 w-0 h-[2px] transition-all duration-300 group-hover:w-full",
                isScrolled ? "bg-yellow-500" : "bg-white"
              )} />
            </Link>
          ))}
        </div>

        {/* --- 3. ACTIONS (Right) --- */}
        <div className="hidden md:flex items-center gap-5">
          <ThemeToggle />
          
          <div className={cn("h-6 w-[1px]", isScrolled ? "bg-zinc-200 dark:bg-white/10" : "bg-white/20")} />

          {user ? (
            /* --- LOGGED IN VIEW --- */
            <div className="flex items-center gap-4">

              <Link href={user.role === "admin" ? "/admin" : "/dashboard"}>
                <Button
                  variant="ghost"
                  className={cn(
                    "text-sm font-bold gap-2 hover:bg-transparent",
                    isScrolled
                      ? "text-zinc-900 dark:text-white hover:text-yellow-600 dark:hover:text-yellow-500"
                      : "text-white hover:text-yellow-400"
                  )}
                >
                  <LayoutDashboard size={18} />
                  {user.role === "admin" ? "Admin Panel" : "Dashboard"}
                </Button>
              </Link>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className={cn(
                    "flex items-center gap-2 pl-1 pr-3 py-1 rounded-full border transition-all hover:scale-105",
                    isScrolled 
                      ? "border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900" 
                      : "border-white/20 bg-white/10 backdrop-blur-md"
                  )}>
                    <div className="w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center text-black font-bold shadow-md">
                      {/* Optional Chaining for safety if avatar is missing */}
                      {user.name?.charAt(0).toUpperCase() || "U"}
                    </div>
                  </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="w-56 bg-zinc-950 border-zinc-800 text-white p-2">
                  <DropdownMenuLabel className="text-zinc-400 text-xs uppercase tracking-wider">Logged in as</DropdownMenuLabel>
                  <div className="px-2 pb-2 font-bold text-lg">{user.name}</div>
                  <DropdownMenuSeparator className="bg-zinc-800" />

                  <DropdownMenuItem
                    onClick={() => signOut()} // FIX: Use signOut()
                    className="text-red-400 focus:text-red-400 focus:bg-red-500/10 cursor-pointer rounded-lg mt-1"
                  >
                    <LogOut className="mr-2 h-4 w-4" /> Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

            </div>
          ) : (
            /* --- GUEST VIEW --- */
            <div className="flex items-center gap-4">
              <Link 
                href="/auth/signin"
                className={cn(
                  "text-sm font-bold transition-colors",
                  isScrolled ? "text-zinc-700 dark:text-white hover:text-yellow-600" : "text-white hover:text-yellow-400"
                )}
              >
                Sign In
              </Link>

              <Link href="/auth/signup">
                <Button
                  className={cn(
                    "rounded-full px-6 h-11 font-bold shadow-xl transition-all hover:scale-105",
                    isScrolled 
                      ? "bg-zinc-900 dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200" 
                      : "bg-yellow-500 hover:bg-yellow-400 text-black border-none"
                  )}
                >
                  Get Started
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* --- 4. MOBILE MENU --- */}
        <div className="flex md:hidden items-center gap-4">
          <ThemeToggle />
          <Sheet>
            <SheetTrigger className={cn("transition-colors", isScrolled ? "text-zinc-900 dark:text-white" : "text-white")}>
              <Menu size={28} />
            </SheetTrigger>
            <SheetContent className="bg-zinc-950 border-l border-zinc-800 text-white w-[300px] p-0">
              <div className="p-6 border-b border-zinc-800">
                <SheetTitle className="text-left text-white font-black flex items-center gap-2 text-xl">
                  <div className="w-8 h-8 rounded-lg bg-yellow-500 flex items-center justify-center text-black">
                    <ShieldCheck size={18} />
                  </div>
                  DRIVEFLOW
                </SheetTitle>
              </div>
              
              <div className="flex flex-col p-4 gap-2">
                {NAV_LINKS.map((link) => (
                  <Link 
                    key={link.name} 
                    href={link.href} 
                    className="flex items-center gap-4 p-4 rounded-xl hover:bg-zinc-900 transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-400 group-hover:text-yellow-500 group-hover:bg-black transition-colors">
                      <link.icon size={18} />
                    </div>
                    <span className="text-lg font-medium text-zinc-300 group-hover:text-white">{link.name}</span>
                    <ChevronRight className="ml-auto text-zinc-600 group-hover:text-yellow-500" size={16} />
                  </Link>
                ))}
              </div>

              <div className="absolute bottom-0 w-full p-6 border-t border-zinc-800 bg-zinc-900/50">
                {!user ? (
                  <div className="flex flex-col gap-3">
                    <Link href="/auth/signin" className="w-full">
                      <Button variant="outline" className="w-full justify-start gap-3 border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800 h-12 rounded-xl">
                        <LogIn size={18} /> Sign In
                      </Button>
                    </Link>
                    <Link href="/auth/signup" className="w-full">
                      <Button className="w-full justify-start gap-3 bg-yellow-500 hover:bg-yellow-400 text-black font-bold h-12 rounded-xl">
                        <Gem size={18} /> Join Driveflow
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    <Link href={user.role === "admin" ? "/admin" : "/dashboard"} className="w-full">
                      <Button className="w-full justify-start gap-3 bg-white text-black hover:bg-zinc-200 h-12 rounded-xl font-bold">
                        <LayoutDashboard size={18} /> {user.role === "admin" ? "Admin Panel" : "Dashboard"}
                      </Button>
                    </Link>

                    <Button 
                      onClick={() => signOut()} // FIX: Use signOut()
                      className="w-full justify-start gap-3 bg-red-500/10 text-red-500 hover:bg-red-500/20 h-12 rounded-xl border border-red-500/20"
                    >
                      <LogOut size={18} /> Log out
                    </Button>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>

      </div>
    </nav>
  );
}