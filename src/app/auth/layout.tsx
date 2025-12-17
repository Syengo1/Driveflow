import { ThemeProvider } from "@/components/theme-provider";
import { SettingsProvider } from "@/context/SettingsContext";
import { Toaster } from "@/components/ui/sonner";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark" // Auth looks best in dark mode by default for luxury
      enableSystem
      disableTransitionOnChange
      storageKey="auth-theme"
    >
      <SettingsProvider>
        <div className="min-h-screen bg-black text-white selection:bg-yellow-500/30">
          {children}
          <Toaster />
        </div>
      </SettingsProvider>
    </ThemeProvider>
  );
}