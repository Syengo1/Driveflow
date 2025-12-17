"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface SettingsContextType {
  siteName: string;
  setSiteName: (name: string) => void;
  currency: string;
  setCurrency: (curr: string) => void;
  supportEmail: string;
  setSupportEmail: (email: string) => void;
  vatEnabled: boolean;
  setVatEnabled: (enabled: boolean) => void;
  saveSettings: () => Promise<void>;
  isLoading: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [siteName, setSiteName] = useState("Driveflow");
  const [currency, setCurrency] = useState("KES");
  const [supportEmail, setSupportEmail] = useState("help@driveflow.co.ke");
  const [vatEnabled, setVatEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [recordId, setRecordId] = useState<number | null>(null);

  // --- 1. LOAD SETTINGS FROM DB ---
  useEffect(() => {
    async function loadSettings() {
      try {
        const { data, error } = await supabase
          .from('system_settings')
          .select('*')
          .single(); // Get the single configuration row

        if (error) {
            console.error("Error loading settings:", error);
            // Optional: If no row exists, you could insert one here, 
            // but our SQL script handles the initial seed.
        } else if (data) {
            setRecordId(data.id);
            setSiteName(data.site_name);
            setCurrency(data.currency);
            setSupportEmail(data.support_email);
            setVatEnabled(data.vat_enabled);
        }
      } catch (err) {
        console.error("Settings load failed", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadSettings();
  }, []);

  // --- 2. SAVE SETTINGS TO DB ---
  const saveSettings = async () => {
    // Optimistic UI update is already happening via setters
    try {
      const { error } = await supabase
        .from('system_settings')
        .update({
            site_name: siteName,
            currency: currency,
            support_email: supportEmail,
            vat_enabled: vatEnabled,
            updated_at: new Date().toISOString()
        })
        .eq('id', recordId || 1); // Default to ID 1 if state missing

      if (error) throw error;

      toast.success("System Settings Updated", {
        description: "Changes are live across the platform."
      });

    } catch (error: any) {
      console.error("Save Error:", error);
      toast.error("Failed to Save", { description: error.message });
    }
  };

  return (
    <SettingsContext.Provider value={{ 
      siteName, setSiteName, 
      currency, setCurrency, 
      supportEmail, setSupportEmail,
      vatEnabled, setVatEnabled,
      saveSettings,
      isLoading
    }}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) throw new Error("useSettings must be used within a SettingsProvider");
  return context;
};