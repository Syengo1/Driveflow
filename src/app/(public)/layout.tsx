import { ThemeProvider } from "@/components/theme-provider";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light" // Users start in Light Mode (Safari Day)
      enableSystem
      disableTransitionOnChange
      storageKey="site-theme" // <--- UNIQUE KEY FOR USERS
    >
      {children}
    </ThemeProvider>
  );
}