"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutDashboard, 
  Car, 
  CalendarRange, 
  Users, 
  Settings, 
  LogOut,
  ShieldCheck,
  ExternalLink,
  Globe,
  Briefcase, // For Careers
  Compass,   // For Safari
  UserCheck  // For Chauffeur
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  mobileMode?: boolean;
}

// --- ORGANIZED NAVIGATION STRUCTURE ---
const navigationGroups = [
  {
    groupLabel: "Operations",
    items: [
      { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
      { name: "Fleet Manager", href: "/admin/fleet", icon: Car },
      { name: "Bookings", href: "/admin/bookings", icon: CalendarRange },
      { name: "Customers", href: "/admin/customers", icon: Users },
    ]
  },
  {
    groupLabel: "Services Management",
    items: [
      { name: "Chauffeur Services", href: "/admin/chauffeur", icon: UserCheck },
      { name: "Safari Packages", href: "/admin/safari", icon: Compass },
    ]
  },
  {
    groupLabel: "Company",
    items: [
      { name: "Careers & Jobs", href: "/admin/careers", icon: Briefcase },
      { name: "Settings", href: "/admin/settings", icon: Settings },
    ]
  }
];

export default function Sidebar({ mobileMode = false }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    console.log("Signing out...");
    // Add real auth signout logic here (e.g., supabase.auth.signOut())
    router.push("/");
  };

  return (
    <aside 
      className={cn(
        "flex flex-col border-r border-white/10 bg-zinc-950/95 backdrop-blur-xl transition-all duration-300",
        mobileMode
          ? "w-full h-full" 
          : "w-72 h-screen fixed left-0 top-0 z-50 hidden md:flex" // Increased width slightly for better readability
      )}
    >

      {/* BRAND HEADER */}
      <div className={cn(
        "h-20 flex items-center px-8 border-b border-white/5 bg-zinc-950",
        mobileMode && "hidden"
      )}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-yellow-600 to-yellow-400 flex items-center justify-center shadow-lg shadow-yellow-900/20">
            <ShieldCheck className="text-zinc-950 w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-wide">DRIVEFLOW</h1>
            <p className="text-[10px] text-yellow-500/80 uppercase tracking-wider font-semibold">Admin Portal</p>
          </div>
        </div>
      </div>

      {/* NAVIGATION SCROLL AREA */}
      <nav className="flex-1 py-6 px-4 overflow-y-auto custom-scrollbar space-y-8">
        
        {navigationGroups.map((group, groupIndex) => (
          <div key={groupIndex}>
            <p className="px-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3">
              {group.groupLabel}
            </p>
            <div className="space-y-1">
              {group.items.map((link) => {
                const isActive = pathname === link.href;

                return (
                  <Link 
                    key={link.href} 
                    href={link.href}
                    className={cn(
                      "flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group relative overflow-hidden",
                      isActive 
                        ? "bg-yellow-500 text-black font-bold shadow-[0_0_20px_-5px_rgba(234,179,8,0.4)]" 
                        : "text-zinc-400 hover:text-white hover:bg-white/5"
                    )}
                  >
                    <link.icon 
                      className={cn(
                        "w-5 h-5 transition-colors",
                        isActive ? "text-black" : "text-zinc-500 group-hover:text-white"
                      )} 
                    />
                    
                    <span className="text-sm">{link.name}</span>
                    
                    {/* Active Indicator Dot */}
                    {isActive && (
                      <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-black/50" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

      </nav>

      {/* FOOTER ACTIONS */}
      <div className="p-4 border-t border-white/5 bg-zinc-900/30 space-y-2">
        
        <Link 
          href="/" 
          target="_blank"
          className="flex items-center gap-3 w-full px-4 py-3 rounded-xl hover:bg-blue-500/10 hover:text-blue-400 transition-all duration-300 text-zinc-400 group border border-transparent hover:border-blue-500/20"
        >
          <div className="p-1.5 bg-zinc-900 rounded-lg group-hover:bg-blue-500/20 transition-colors">
             <Globe className="w-4 h-4" />
          </div>
          <div className="flex flex-col items-start leading-tight">
            <span className="font-medium text-xs">Live Website</span>
            <span className="text-[10px] text-zinc-600 group-hover:text-blue-400/70">driveflow.co.ke</span>
          </div>
          <ExternalLink className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
        </Link>

        <button 
          onClick={handleSignOut}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-xl hover:bg-red-500/10 hover:text-red-400 transition-all duration-300 text-zinc-400 group border border-transparent hover:border-red-500/20"
        >
          <div className="p-1.5 bg-zinc-900 rounded-lg group-hover:bg-red-500/20 transition-colors">
            <LogOut className="w-4 h-4" />
          </div>
          <span className="font-medium text-sm">Sign Out</span>
        </button>

      </div>
    </aside>
  );
}