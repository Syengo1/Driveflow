"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  ShieldCheck, Bell, User, LogOut, Settings, 
  CreditCard, History, LayoutDashboard, ChevronDown, Search, Menu, Lock
} from "lucide-react";
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/site/ThemeToggle";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

export default function UserNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  
  // FIX: Use 'signOut' to match the updated AuthContext
  const { user, signOut } = useAuth();

  const NAV_LINKS = [
    { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { name: "My Trips", href: "/dashboard/trips", icon: History },
    { name: "Wallet", href: "/dashboard/wallet", icon: CreditCard },
  ];

  // FIX: Updated logout handler
  const handleLogout = async () => {
    await signOut();
    // The AuthContext will handle the redirect, but we can force it just in case
    router.push("/auth/signin");
  };

  return (
    <nav className="sticky top-0 z-50 w-full min-w-[320px] border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl transition-all">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
        
        {/* 1. LEFT: Logo & Context */}
        <div className="flex items-center gap-8 shrink-0">
          <Link href="/dashboard" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-yellow-500 flex items-center justify-center text-black shadow-sm group-hover:scale-105 transition-transform">
              <ShieldCheck size={18} />
            </div>
            {/* Hidden on small mobile, visible on tablet+ */}
            <span className="font-black text-lg tracking-tight hidden sm:block text-zinc-900 dark:text-white">
              DRIVEFLOW
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link 
                  key={link.name}
                  href={link.href}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2",
                    isActive 
                      ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-bold shadow-sm" 
                      : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-900"
                  )}
                >
                  <link.icon size={16} className={cn(isActive ? "text-yellow-500" : "opacity-70")} />
                  {link.name}
                </Link>
              );
            })}
          </div>
        </div>

        {/* 2. CENTER: Global Search (Fluid Width) */}
        <div className="hidden lg:block relative flex-1 max-w-md mx-4">
           <Search className="absolute left-3 top-2.5 text-zinc-400" size={14} />
           <Input 
             placeholder="Search bookings, vehicles, or invoices..." 
             className="h-9 pl-9 bg-zinc-100 dark:bg-zinc-900 border-transparent focus:bg-white dark:focus:bg-black focus:border-yellow-500 transition-all text-xs rounded-full w-full"
           />
        </div>

        {/* 3. RIGHT: Utilities */}
        <div className="flex items-center gap-3 shrink-0">
          <ThemeToggle />

          {/* Mobile Menu Trigger */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden text-zinc-500">
                <Menu size={20} />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="bg-zinc-950 border-zinc-800 text-white w-[300px]">
              <SheetTitle className="text-left text-yellow-500 flex items-center gap-2 mb-8 font-bold">
                <ShieldCheck /> Dashboard
              </SheetTitle>
              <div className="flex flex-col gap-2">
                {NAV_LINKS.map((link) => (
                  <Link 
                    key={link.name} 
                    href={link.href} 
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-xl transition-colors",
                      pathname === link.href ? "bg-zinc-900 text-white" : "hover:bg-zinc-900/50 text-zinc-400"
                    )}
                  >
                    <link.icon size={18} />
                    <span className="font-medium">{link.name}</span>
                  </Link>
                ))}
              </div>
            </SheetContent>
          </Sheet>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative text-zinc-500 hover:text-black dark:hover:text-white">
                <Bell size={20} />
                {/* Optional: Add logic to check real notifications count */}
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-black" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 p-4 bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 shadow-xl">
               <div className="flex justify-between items-center mb-2">
                 <h4 className="font-bold text-sm">Notifications</h4>
                 <Badge variant="secondary" className="text-[10px]">New</Badge>
               </div>
               <div className="space-y-2">
                  <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-xs border border-zinc-100 dark:border-zinc-800">
                     <p className="font-bold text-green-600 mb-1">Welcome!</p>
                     <p className="text-zinc-500">Your account setup is complete. Start exploring the fleet.</p>
                  </div>
               </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Profile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-3 pl-1 pr-2 py-1 rounded-full border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all group">
                <div className="w-8 h-8 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-black flex items-center justify-center font-bold text-sm">
                  {/* Safety check for user name */}
                  {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                </div>
                <div className="text-left hidden lg:block">
                   <p className="text-xs font-bold leading-none truncate max-w-[100px]">{user?.name || "Guest"}</p>
                   <p className="text-[10px] text-zinc-500 capitalize">{user?.role || "Member"}</p>
                </div>
                <ChevronDown size={14} className="text-zinc-400 group-hover:text-zinc-600" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 shadow-xl">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              {/* UPGRADE: Admin Link if user is admin */}
              {user?.role === 'admin' && (
                <Link href="/admin">
                  <DropdownMenuItem className="cursor-pointer bg-yellow-500/10 text-yellow-600 dark:text-yellow-500 focus:bg-yellow-500/20 mb-1">
                    <Lock className="mr-2 h-4 w-4" /> Admin Portal
                  </DropdownMenuItem>
                </Link>
              )}

              <DropdownMenuItem className="cursor-pointer">
                <User className="mr-2 h-4 w-4" /> Profile
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" /> Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={handleLogout}
                className="text-red-500 focus:text-red-500 focus:bg-red-500/10 cursor-pointer"
              >
                <LogOut className="mr-2 h-4 w-4" /> Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

      </div>
    </nav>
  );
}