import { SettingsProvider } from "@/context/SettingsContext";
import SettingsView from "@/components/admin/settings/SettingsView";

export default function SettingsPage() {
  return (
    // FIX: Wrap the view in the Provider
    <SettingsProvider>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6 text-white">Platform Settings</h1>
        <SettingsView />
      </div>
    </SettingsProvider>
  );
}