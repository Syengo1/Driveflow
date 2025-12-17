"use client";

import { useState, useEffect, useMemo } from "react";
import FleetTable from "@/components/admin/fleet/FleetTable";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { 
  Car, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  TrendingUp, 
  MapPin, 
  CalendarDays, 
  DollarSign,
  Wrench,
  Sparkles,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

// --- TYPES ---
interface DashboardMetrics {
  totalVehicles: number;
  available: number;
  rented: number;
  maintenance: number;
  utilization: number;
  totalDailyRevenue: number; // Sum of daily rates of RENTED cars
  totalFleetPotential: number; // Sum of daily rates of ALL cars
}

const INITIAL_METRICS: DashboardMetrics = {
  totalVehicles: 0,
  available: 0,
  rented: 0,
  maintenance: 0,
  utilization: 0,
  totalDailyRevenue: 0,
  totalFleetPotential: 0,
};

// --- METRIC CARD COMPONENT ---
const MetricCard = ({ title, value, subtext, icon: Icon, colorClass, isLoading }: any) => (
  <div className="glass-panel p-5 rounded-xl border border-white/5 relative overflow-hidden group hover:border-white/10 transition-all">
    <div className={cn("absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity", colorClass)}>
      <Icon size={80} />
    </div>
    <div className="relative z-10">
      <p className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-1">{title}</p>
      
      {isLoading ? (
        <div className="h-9 w-24 bg-white/10 rounded animate-pulse mb-1" />
      ) : (
        <h3 className="text-3xl font-black text-white mb-1 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {value}
        </h3>
      )}
      
      <p className={cn("text-xs font-medium flex items-center gap-1", colorClass)}>
        {subtext}
      </p>
    </div>
  </div>
);

export default function FleetPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [metrics, setMetrics] = useState<DashboardMetrics>(INITIAL_METRICS);
  const [isLoading, setIsLoading] = useState(true);

  // --- 1. DATA FETCHING & REALTIME SUBSCRIPTION ---
  const fetchMetrics = async () => {
    try {
      // Fetch Units combined with their Model data
      // FIXED QUERY: Removed the alias 'model:' to ensure strict matching first
      const { data, error } = await supabase
        .from('fleet_units')
        .select(`
          status,
          fleet_models ( daily_rate )
        `);

      if (error) {
        console.error("Supabase Error Details:", error.message, error.details); // Better debugging
        throw error;
      }

      if (data) {
        // Calculate Metrics
        const total = data.length;
        const available = data.filter(u => u.status === 'available').length;
        const rented = data.filter(u => u.status === 'rented').length;
        const maintenance = data.filter(u => ['maintenance', 'cleaning'].includes(u.status)).length;
        
        // Calculate Financials
        let currentRevenue = 0;
        let potentialRevenue = 0;

        data.forEach((unit: any) => {
            // Handle the nested data safely (it might be an array or object)
            const modelData = Array.isArray(unit.fleet_models) ? unit.fleet_models[0] : unit.fleet_models;
            const rate = modelData?.daily_rate || 0;
            
            potentialRevenue += rate;
            if (unit.status === 'rented') {
                currentRevenue += rate;
            }
        });

        setMetrics({
          totalVehicles: total,
          available,
          rented,
          maintenance,
          utilization: total > 0 ? Math.round((rented / total) * 100) : 0,
          totalDailyRevenue: currentRevenue,
          totalFleetPotential: potentialRevenue
        });
      }
    } catch (err) {
      console.error("Error fetching metrics:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();

    // Set up Realtime Subscription
    // This makes the dashboard update instantly when a unit status changes in the table
    const channel = supabase
      .channel('fleet-dashboard-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'fleet_units' },
        () => {
          fetchMetrics(); // Re-fetch metrics on any change
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="space-y-8">
      
      {/* 1. PAGE HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Fleet Management</h1>
          <p className="text-zinc-400 text-sm mt-1">Monitor vehicle health, availability, and lifecycle.</p>
        </div>
      </div>

      {/* 2. CONTEXTUAL METRICS (Dynamic Data) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-in slide-in-from-top-4 duration-500">
        
        {/* TAB: ALL CARS */}
        {activeTab === "all" && (
          <>
            <MetricCard 
                title="Daily Revenue Pot." 
                value={`KES ${metrics.totalFleetPotential.toLocaleString()}`} 
                subtext="If 100% booked" 
                icon={DollarSign} 
                colorClass="text-green-500" 
                isLoading={isLoading}
            />
            <MetricCard 
                title="Total Vehicles" 
                value={metrics.totalVehicles} 
                subtext={`${metrics.available} currently free`} 
                icon={Car} 
                colorClass="text-blue-500" 
                isLoading={isLoading}
            />
            <MetricCard 
                title="Fleet Utilization" 
                value={`${metrics.utilization}%`} 
                subtext={metrics.utilization > 75 ? "Excellent Efficiency" : "Needs Optimization"} 
                icon={TrendingUp} 
                colorClass={metrics.utilization > 75 ? "text-green-500" : "text-yellow-500"} 
                isLoading={isLoading}
            />
            <MetricCard 
                title="Pending Actions" 
                value={metrics.maintenance} 
                subtext="Maintenance & Cleaning" 
                icon={AlertTriangle} 
                colorClass={metrics.maintenance > 0 ? "text-red-500" : "text-zinc-500"} 
                isLoading={isLoading}
            />
          </>
        )}

        {/* TAB: AVAILABLE */}
        {activeTab === "available" && (
          <>
            <MetricCard title="Ready to Rent" value={metrics.available} subtext="Instantly Available" icon={CheckCircle2} colorClass="text-green-500" isLoading={isLoading} />
            <MetricCard title="Westlands Hub" value="--" subtext="Tracking Coming Soon" icon={MapPin} colorClass="text-purple-500" isLoading={isLoading} />
            <MetricCard title="JKIA Airport" value="--" subtext="Tracking Coming Soon" icon={MapPin} colorClass="text-orange-500" isLoading={isLoading} />
            <MetricCard title="Fleet Health" value="100%" subtext="Available units ready" icon={Car} colorClass="text-blue-500" isLoading={isLoading} />
          </>
        )}

        {/* TAB: RENTED */}
        {activeTab === "rented" && (
          <>
            <MetricCard title="Active Rentals" value={metrics.rented} subtext="Currently on road" icon={Clock} colorClass="text-blue-500" isLoading={isLoading} />
            <MetricCard title="Revenue Active" value={`KES ${metrics.totalDailyRevenue.toLocaleString()}`} subtext="Daily Run Rate" icon={TrendingUp} colorClass="text-green-500" isLoading={isLoading} />
            <MetricCard title="Returns Today" value="--" subtext="Check Booking Log" icon={CalendarDays} colorClass="text-yellow-500" isLoading={isLoading} />
            <MetricCard title="Overdue" value="0" subtext="No late returns" icon={AlertTriangle} colorClass="text-red-500" isLoading={isLoading} />
          </>
        )}

        {/* TAB: MAINTENANCE */}
        {activeTab === "maintenance" && (
          <>
            <MetricCard title="In Garage" value={metrics.maintenance} subtext="Units Unavailable" icon={Wrench} colorClass="text-red-500" isLoading={isLoading} />
            <MetricCard title="Est. Loss/Day" value="--" subtext="Due to downtime" icon={DollarSign} colorClass="text-orange-500" isLoading={isLoading} />
            <MetricCard title="Avg Downtime" value="3 Days" subtext="Turnaround Time" icon={Clock} colorClass="text-zinc-400" isLoading={isLoading} />
            <MetricCard title="Cleaning" value="--" subtext="Queue count" icon={Sparkles} colorClass="text-purple-500" isLoading={isLoading} />
          </>
        )}
      </div>

      {/* 3. TABS & TABLE */}
      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        
        <div className="flex items-center justify-between">
          <TabsList className="bg-zinc-900/50 border border-zinc-800 p-1 h-12 rounded-xl">
            {["all", "available", "rented", "maintenance"].map((tab) => (
              <TabsTrigger 
                key={tab} 
                value={tab}
                className="rounded-lg px-6 h-10 text-sm capitalize data-[state=active]:bg-yellow-500 data-[state=active]:text-black data-[state=active]:font-bold transition-all text-zinc-400"
              >
                {tab}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* We render the same table but pass the status prop */}
        <TabsContent value="all" className="mt-0 animate-in fade-in slide-in-from-bottom-4">
          <FleetTable statusFilter="all" />
        </TabsContent>
        <TabsContent value="available" className="mt-0 animate-in fade-in slide-in-from-bottom-4">
          <FleetTable statusFilter="available" />
        </TabsContent>
        <TabsContent value="rented" className="mt-0 animate-in fade-in slide-in-from-bottom-4">
          <FleetTable statusFilter="rented" />
        </TabsContent>
        <TabsContent value="maintenance" className="mt-0 animate-in fade-in slide-in-from-bottom-4">
          <FleetTable statusFilter="maintenance" />
        </TabsContent>

      </Tabs>
    </div>
  );
}