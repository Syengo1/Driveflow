"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes"; 
import { useSettings } from "@/context/SettingsContext"; 
import { 
  Settings, CreditCard, Map, Shield, Bell, 
  Save, Eye, EyeOff, Globe, Smartphone, Moon, Sun, Laptop, Loader2, CheckCircle2
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const MENU_ITEMS = [
  { id: "general", label: "General & Theme", icon: Settings },
  { id: "financials", label: "Financials & M-Pesa", icon: CreditCard },
  { id: "integrations", label: "API Integrations", icon: Map },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security", label: "Security & Team", icon: Shield },
];

export default function SettingsView() {
  const { setTheme, theme } = useTheme();
  const { siteName, setSiteName, currency, setCurrency, supportEmail, setSupportEmail, vatEnabled, setVatEnabled, saveSettings } = useSettings();
  
  const [activeTab, setActiveTab] = useState("general");
  const [showKey, setShowKey] = useState<Record<string, boolean>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  
  // --- HYDRATION FIX ---
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleKey = (key: string) => {
    setShowKey(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    await saveSettings();
    setIsSaving(false);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 h-[calc(100vh-140px)]">
      
      {/* SIDEBAR MENU */}
      <div className="w-full lg:w-64 shrink-0 space-y-2">
        {MENU_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
              activeTab === item.id 
                ? "bg-zinc-800 text-white border border-zinc-700 shadow-lg" 
                : "text-zinc-400 hover:text-white hover:bg-zinc-900"
            )}
          >
            <item.icon size={18} className={activeTab === item.id ? "text-yellow-500" : ""} />
            {item.label}
          </button>
        ))}
      </div>

      {/* CONTENT AREA */}
      <div className="flex-1 glass-panel border border-zinc-800 rounded-2xl p-8 overflow-y-auto custom-scrollbar relative">
        
        {/* --- GENERAL TAB --- */}
        {activeTab === "general" && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
            <div>
              <h2 className="text-xl font-bold text-white mb-1">General & Appearance</h2>
              <p className="text-sm text-zinc-400">Manage site identity and visual preference.</p>
            </div>
            <Separator className="bg-zinc-800" />
            
            {/* THEME SELECTOR (With Hydration Fix) */}
            <div className="space-y-3">
              <Label className="text-zinc-400">Interface Theme</Label>
              <div className="grid grid-cols-3 gap-4">
                {['light', 'dark', 'system'].map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setTheme(mode)}
                    className={cn(
                      "flex flex-col items-center justify-center gap-2 p-4 rounded-xl border transition-all",
                      // Only apply active styles IF mounted is true
                      mounted && theme === mode 
                        ? "bg-yellow-500/10 border-yellow-500 text-yellow-500" 
                        : "bg-black border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300"
                    )}
                  >
                    {mode === 'light' && <Sun size={24} />}
                    {mode === 'dark' && <Moon size={24} />}
                    {mode === 'system' && <Laptop size={24} />}
                    <span className="text-xs font-bold capitalize">{mode} Mode</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-zinc-400">Site Name</Label>
                <Input value={siteName} onChange={(e) => setSiteName(e.target.value)} className="bg-black border-zinc-800" />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-400">Support Email</Label>
                <Input value={supportEmail} onChange={(e) => setSupportEmail(e.target.value)} className="bg-black border-zinc-800" />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-400">Support Phone</Label>
                <Input defaultValue="+254 700 000 000" className="bg-black border-zinc-800" />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-400">Currency Symbol</Label>
                <Input value={currency} onChange={(e) => setCurrency(e.target.value)} className="bg-black border-zinc-800 font-mono" />
              </div>
            </div>

            <div className="space-y-4">
               <h3 className="text-sm font-bold text-white flex items-center gap-2"><Globe size={16} className="text-blue-500"/> SEO Metadata</h3>
               <div className="space-y-2">
                 <Label className="text-zinc-400">Meta Title</Label>
                 <Input defaultValue="Driveflow - Premium Car Rental in Nairobi" className="bg-black border-zinc-800" />
               </div>
               <div className="space-y-2">
                 <Label className="text-zinc-400">Meta Description</Label>
                 <textarea className="w-full bg-black border border-zinc-800 rounded-md p-3 text-sm text-white min-h-[80px]" defaultValue="Rent luxury and safari vehicles in Kenya. Best rates, verified cars, instant booking." />
               </div>
            </div>
          </div>
        )}

        {/* --- FINANCIALS TAB --- */}
        {activeTab === "financials" && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
             <div>
              <h2 className="text-xl font-bold text-white mb-1">Financials & Payments</h2>
              <p className="text-sm text-zinc-400">Configure M-Pesa integration and tax rates.</p>
            </div>
            <Separator className="bg-zinc-800" />

            <div className="p-6 bg-green-500/5 border border-green-500/10 rounded-xl space-y-6">
               <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
                    <Smartphone size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-white">M-Pesa Daraja API</h3>
                    <p className="text-xs text-zinc-400">Lipa na M-Pesa Online (STK Push)</p>
                  </div>
               </div>
               
               <div className="grid grid-cols-2 gap-6">
                 <div className="space-y-2">
                   <Label className="text-zinc-400">Paybill / Till Number</Label>
                   <Input defaultValue="522522" className="bg-black border-zinc-800 font-mono" />
                 </div>
                 <div className="space-y-2">
                   <Label className="text-zinc-400">Passkey</Label>
                   <div className="relative">
                     <Input type={showKey['mpesa'] ? "text" : "password"} defaultValue="bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919" className="bg-black border-zinc-800 font-mono pr-10" />
                     <button onClick={() => toggleKey('mpesa')} className="absolute right-3 top-2.5 text-zinc-500 hover:text-white">
                       {showKey['mpesa'] ? <EyeOff size={16}/> : <Eye size={16}/>}
                     </button>
                   </div>
                 </div>
               </div>
            </div>

            <div className="space-y-4">
               <h3 className="text-sm font-bold text-white">Tax Configuration</h3>
               <div className="flex items-center justify-between p-4 bg-zinc-900 border border-zinc-800 rounded-lg">
                 <div className="space-y-1">
                   <Label className="text-white">Enable VAT (16%)</Label>
                   <p className="text-xs text-zinc-500">Automatically add tax to all bookings</p>
                 </div>
                 <Switch checked={vatEnabled} onCheckedChange={setVatEnabled} />
               </div>
            </div>
          </div>
        )}

        {/* --- INTEGRATIONS TAB --- */}
        {activeTab === "integrations" && (
           <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">Integrations</h2>
                <p className="text-sm text-zinc-400">Connect third-party services.</p>
              </div>
              <Separator className="bg-zinc-800" />

              <div className="space-y-6">
                 <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl space-y-4">
                    <h3 className="font-bold text-white flex items-center gap-2"><Map size={18} className="text-blue-500"/> Google Maps API</h3>
                    <div className="space-y-2">
                       <Label className="text-zinc-400">API Key</Label>
                       <div className="relative">
                         <Input type={showKey['maps'] ? "text" : "password"} defaultValue="AIzaSyDOC...12345" className="bg-black border-zinc-800 font-mono pr-10" />
                         <button onClick={() => toggleKey('maps')} className="absolute right-3 top-2.5 text-zinc-500 hover:text-white">
                           {showKey['maps'] ? <EyeOff size={16}/> : <Eye size={16}/>}
                         </button>
                       </div>
                    </div>
                 </div>

                 <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl space-y-4">
                    <h3 className="font-bold text-white flex items-center gap-2"><Shield size={18} className="text-orange-500"/> Car Track / Tramigo</h3>
                    <div className="space-y-2">
                       <Label className="text-zinc-400">Client ID</Label>
                       <Input defaultValue="TRM-8829102" className="bg-black border-zinc-800 font-mono" />
                    </div>
                 </div>
              </div>
           </div>
        )}

        {/* --- SAVE BUTTON (Sticky Footer) --- */}
        <div className="sticky bottom-0 -mx-8 -mb-8 p-8 border-t border-zinc-800 bg-zinc-950/95 backdrop-blur-sm flex justify-end mt-10">
           <Button 
             onClick={handleSave} 
             disabled={isSaving}
             className={cn("font-bold px-8 shadow-lg transition-all duration-500", 
               isSaved ? "bg-green-500 hover:bg-green-600 text-white" : "bg-yellow-500 hover:bg-yellow-400 text-black shadow-yellow-500/20"
             )}
           >
             {isSaving ? (
               <Loader2 size={18} className="mr-2 animate-spin" />
             ) : isSaved ? (
               <><CheckCircle2 size={18} className="mr-2" /> Saved!</>
             ) : (
               <><Save size={18} className="mr-2" /> Save Changes</>
             )}
           </Button>
        </div>

      </div>
    </div>
  );
}