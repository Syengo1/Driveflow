import Sidebar from "@/components/admin/Sidebar";
import MobileNav from "@/components/admin/MobileNav"; // Import new component
import { ThemeProvider } from "@/components/theme-provider";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
      storageKey="admin-theme"
    >
      <div className="min-h-screen bg-zinc-50 dark:bg-[#0a0a0a] text-zinc-900 dark:text-white font-sans selection:bg-yellow-500/30">
        
        {/* 1. DESKTOP SIDEBAR (Hidden on Mobile) */}
        <Sidebar />

        {/* 2. MOBILE NAVBAR (Hidden on Desktop) */}
        <MobileNav />

        {/* 3. MAIN CONTENT AREA */}
        {/* Added 'pl-0 md:pl-64' to remove left padding on mobile */}
        <main className="pl-0 md:pl-64 relative z-10 transition-all duration-300">
          <div className="p-4 md:p-8 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </ThemeProvider>
  );
}