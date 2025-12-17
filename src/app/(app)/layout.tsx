import UserNavbar from "@/components/site/UserNavbar";
import { ThemeProvider } from "@/components/theme-provider";
import { SettingsProvider } from "@/context/SettingsContext";


export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      storageKey="site-theme" // Share theme with public site
    >
      <SettingsProvider>
        <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-white font-sans selection:bg-yellow-500/30">
          {/* THE USER NAVBAR */}
          <UserNavbar />
          
          {/* MAIN CONTENT */}
          <main>
            {children}
          </main>
        </div>
      </SettingsProvider>
    </ThemeProvider>
  );
}