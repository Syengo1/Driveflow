"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { 
  TrendingUp, Users, Car, CalendarCheck, ArrowUpRight, 
  ArrowDownRight, DollarSign, Activity, AlertCircle, 
  Download, ChevronDown, Loader2
} from "lucide-react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell 
} from 'recharts';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import AddModelWizard from "@/components/admin/fleet/AddModelWizard";

// --- TYPES ---
interface DashboardMetrics {
  totalRevenue: number;
  activeRentals: number;
  pendingRequests: number;
  fleetHealth: number; // Percentage
}

interface ChartDataPoint {
  name: string;
  total: number;
}

interface ActivityItem {
  id: string;
  type: 'booking' | 'maintenance' | 'alert';
  title: string;
  subtitle: string;
  time: string; // Relative time string
  amount?: string;
  status: 'success' | 'warning' | 'neutral' | 'error';
  rawDate: Date; // Used for sorting
}

// --- STAT CARD COMPONENT ---
const StatCard = ({ title, value, trend, trendValue, icon: Icon, colorClass, isLoading }: any) => (
  <div className="glass-panel p-6 rounded-xl border border-white/5 relative overflow-hidden group hover:border-zinc-700 transition-all duration-300">
    <div className={cn("absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500", colorClass)}>
      <Icon size={100} />
    </div>
    <div className="relative z-10">
      <p className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">{title}</p>
      {isLoading ? (
        <div className="h-8 w-24 bg-white/10 rounded animate-pulse mb-2"/>
      ) : (
        <h3 className="text-3xl font-black text-white mb-2 tracking-tight">{value}</h3>
      )}
      
      <div className="flex items-center gap-2">
        <span className={cn("text-xs font-bold px-1.5 py-0.5 rounded flex items-center gap-1", trend === 'up' ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400")}>
          {trend === 'up' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          {trendValue}
        </span>
        <span className="text-xs text-zinc-500">vs last 30 days</span>
      </div>
    </div>
  </div>
);

export default function AdminDashboard() {
  const router = useRouter();
  const [timeRange, setTimeRange] = useState<'weekly' | 'monthly'>('weekly');
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);

  // --- DATA STATE ---
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalRevenue: 0, activeRentals: 0, pendingRequests: 0, fleetHealth: 100
  });
  const [revenueChartData, setRevenueChartData] = useState<ChartDataPoint[]>([]);
  const [statusChartData, setStatusChartData] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);

  // --- GREETING LOGIC ---
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  }, []);

  // --- THE BRAIN: DATA FETCHING ENGINE ---
  const fetchDashboardData = useCallback(async () => {
    try {
      // 1. Fetch Fleet Units (For Status Pie & Health)
      const { data: units } = await supabase.from('fleet_units').select('status, plate_number');
      
      // 2. Fetch Bookings (For Revenue & Active Count)
      // Get data for the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data: bookings } = await supabase
        .from('bookings')
        .select('id, total_cost, status, start_date, created_at, customer_id, unit_id')
        .gte('created_at', thirtyDaysAgo.toISOString());

      // 3. Fetch Maintenance Logs (For Activity Feed)
      const { data: logs } = await supabase
        .from('maintenance_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      // --- PROCESS METRICS ---
      if (units && bookings) {
        const totalUnits = units.length;
        const healthyUnits = units.filter(u => ['available', 'rented'].includes(u.status)).length;
        const healthScore = totalUnits > 0 ? Math.round((healthyUnits / totalUnits) * 100) : 100;
        
        // Calculate Total Lifetime Revenue (or Monthly based on query)
        const revenue = bookings.reduce((sum, b) => sum + (b.status !== 'cancelled' ? (b.total_cost || 0) : 0), 0);
        const active = units.filter(u => u.status === 'rented').length;
        const pending = bookings.filter(b => b.status === 'pending').length;

        setMetrics({
          totalRevenue: revenue,
          activeRentals: active,
          pendingRequests: pending,
          fleetHealth: healthScore
        });

        // --- PROCESS STATUS PIE CHART ---
        const statusCounts = {
            rented: units.filter(u => u.status === 'rented').length,
            available: units.filter(u => u.status === 'available').length,
            maintenance: units.filter(u => u.status === 'maintenance').length,
            cleaning: units.filter(u => u.status === 'cleaning').length,
        };
        setStatusChartData([
            { name: 'Rented', value: statusCounts.rented, color: '#3b82f6' },
            { name: 'Available', value: statusCounts.available, color: '#22c55e' },
            { name: 'Maintenance', value: statusCounts.maintenance, color: '#f97316' },
            { name: 'Cleaning', value: statusCounts.cleaning, color: '#a855f7' },
        ]);
      }

      // --- PROCESS REVENUE CHART (Dynamic) ---
      if (bookings) {
        const daysToProcess = timeRange === 'weekly' ? 7 : 30;
        const chartMap = new Map<string, number>();
        
        // Initialize dates with 0
        for (let i = daysToProcess - 1; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const key = d.toLocaleDateString('en-GB', { weekday: 'short' }); // e.g., "Mon"
            chartMap.set(key, 0);
        }

        // Fill Data
        bookings.forEach(b => {
            if (b.status === 'cancelled') return;
            const date = new Date(b.created_at);
            const key = date.toLocaleDateString('en-GB', { weekday: 'short' });
            if (chartMap.has(key)) {
                chartMap.set(key, (chartMap.get(key) || 0) + b.total_cost);
            }
        });

        const finalChartData = Array.from(chartMap).map(([name, total]) => ({ name, total }));
        setRevenueChartData(finalChartData);
      }

      // --- PROCESS ACTIVITY FEED (Polymorphic) ---
      const activities: ActivityItem[] = [];

      // Add recent bookings
      bookings?.slice(0, 5).forEach(b => {
         activities.push({
             id: `b-${b.id}`,
             type: 'booking',
             title: b.status === 'pending' ? 'New Booking Request' : 'Booking Confirmed',
             subtitle: `Booking ID #${b.id.substr(0,4)}`,
             time: new Date(b.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
             amount: `+ KES ${b.total_cost.toLocaleString()}`,
             status: 'success',
             rawDate: new Date(b.created_at)
         });
      });

      // Add recent logs
      logs?.forEach(l => {
          activities.push({
              id: `l-${l.id}`,
              type: 'maintenance',
              title: `Maintenance: ${l.service_type}`,
              subtitle: l.notes || 'Routine Check',
              time: new Date(l.service_date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
              amount: `- KES ${l.cost}`,
              status: 'warning',
              rawDate: new Date(l.created_at)
          });
      });

      // Sort combined feed by date and take top 5
      const sortedActivity = activities.sort((a, b) => b.rawDate.getTime() - a.rawDate.getTime()).slice(0, 5);
      setRecentActivity(sortedActivity);

    } catch (err) {
      console.error("Dashboard Sync Error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [timeRange]);

  // --- INITIAL LOAD & REALTIME SUB ---
  useEffect(() => {
    fetchDashboardData();

    // Subscribe to changes so dashboard updates live
    const channel = supabase.channel('admin-dashboard')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, fetchDashboardData)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'fleet_units' }, fetchDashboardData)
        .subscribe();

    return () => { supabase.removeChannel(channel) };
  }, [fetchDashboardData]);


  // --- REPORT GENERATION ---
  const handleDownloadReport = () => {
    setIsDownloading(true);
    // Simulate generation
    setTimeout(() => {
      const headers = ["Category,Value,Trend"];
      const rows = [
        `Total Revenue,KES ${metrics.totalRevenue},+12.5%`,
        `Active Rentals,${metrics.activeRentals},+2`,
        `Fleet Health,${metrics.fleetHealth}%,+4%`,
      ];
      const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `Driveflow_Exec_Report_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setIsDownloading(false);
    }, 1500); 
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* 1. HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">{greeting}, Admin</h1>
          <p className="text-zinc-400 mt-1 flex items-center gap-2">
            Here is what's happening at <span className="text-yellow-500 font-bold">Westlands Hub</span> today.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-zinc-900 rounded-lg border border-zinc-800 text-xs text-zinc-400">
            <CalendarCheck size={14} />
            {new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'long' })}
          </div>
          
          <Button 
            onClick={handleDownloadReport} 
            disabled={isDownloading}
            className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold shadow-lg shadow-yellow-500/20"
          >
            {isDownloading ? (
              <span className="flex items-center gap-2"><Loader2 className="animate-spin" size={16}/> Generating...</span>
            ) : (
              <span className="flex items-center gap-2"><Download size={16} /> Export Report</span>
            )}
          </Button>
        </div>
      </div>

      {/* 2. KEY METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Revenue" value={`KES ${metrics.totalRevenue.toLocaleString()}`} trend="up" trendValue="12.5%" icon={DollarSign} colorClass="text-yellow-500" isLoading={isLoading} />
        <StatCard title="Active Rentals" value={metrics.activeRentals} trend="up" trendValue="2" icon={Car} colorClass="text-blue-500" isLoading={isLoading} />
        <StatCard title="Pending Requests" value={metrics.pendingRequests} trend="down" trendValue="1" icon={Users} colorClass="text-purple-500" isLoading={isLoading} />
        <StatCard title="Fleet Health" value={`${metrics.fleetHealth}%`} trend="up" trendValue="4%" icon={Activity} colorClass="text-green-500" isLoading={isLoading} />
      </div>

      {/* 3. CHARTS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
        
        {/* REVENUE CHART */}
        <div className="lg:col-span-4 glass-panel rounded-xl border border-zinc-800 p-6 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-white text-lg">Revenue Analytics</h3>
              <p className="text-xs text-zinc-400">Income trends analysis</p>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800">
                  {timeRange === 'weekly' ? 'Last 7 Days' : 'Last 30 Days'} <ChevronDown size={14} className="ml-2"/>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800 text-white">
                <DropdownMenuItem onClick={() => setTimeRange('weekly')} className="cursor-pointer hover:bg-zinc-800">Last 7 Days</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTimeRange('monthly')} className="cursor-pointer hover:bg-zinc-800">Last 30 Days</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="h-[300px] w-full flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueChartData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EAB308" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#EAB308" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="name" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `K${value/1000}k`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '8px', color: '#fff' }}
                  itemStyle={{ color: '#EAB308' }}
                  formatter={(value: number) => [`KES ${value.toLocaleString()}`, "Revenue"]}
                />
                <Area type="monotone" dataKey="total" stroke="#EAB308" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" animationDuration={1500} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* FLEET STATUS */}
        <div className="lg:col-span-3 glass-panel rounded-xl border border-zinc-800 p-6 flex flex-col">
          <h3 className="font-bold text-white text-lg mb-2">Fleet Status</h3>
          <p className="text-xs text-zinc-400 mb-6">Real-time utilization distribution</p>
          
          <div className="flex-1 flex items-center justify-center relative">
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-bold text-white">
                {statusChartData.reduce((acc, curr) => acc + curr.value, 0)}
              </span>
              <span className="text-xs text-zinc-500 uppercase tracking-widest">Total Units</span>
            </div>
            
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {statusChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '8px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4">
            {statusChartData.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-sm text-zinc-300">{item.name}</span>
                <span className="text-xs text-zinc-500 ml-auto font-mono">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. BOTTOM ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* RECENT ACTIVITY */}
        <div className="lg:col-span-2 glass-panel rounded-xl border border-zinc-800 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-white text-lg">Live Operations Feed</h3>
            <button className="text-xs text-yellow-500 hover:underline">View All Logs</button>
          </div>
          <div className="space-y-4">
            {isLoading ? (
               <div className="text-center py-10 text-zinc-500 flex flex-col items-center gap-2">
                   <Loader2 className="animate-spin" />
                   Loading Feed...
               </div>
            ) : recentActivity.length > 0 ? (
                recentActivity.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 hover:bg-white/5 rounded-lg transition-colors group cursor-pointer">
                    <div className="flex items-center gap-4">
                    <div className={cn("w-10 h-10 rounded-full flex items-center justify-center border", 
                        item.status === 'success' ? "bg-green-500/10 border-green-500/20 text-green-500" :
                        item.status === 'warning' ? "bg-red-500/10 border-red-500/20 text-red-500" :
                        "bg-blue-500/10 border-blue-500/20 text-blue-500"
                    )}>
                        {item.type === 'booking' ? <Car size={18} /> : item.type === 'maintenance' ? <Activity size={18} /> : <AlertCircle size={18} />}
                    </div>
                    <div>
                        <p className="text-sm font-bold text-white group-hover:text-yellow-500 transition-colors">{item.title}</p>
                        <p className="text-xs text-zinc-400">{item.subtitle} • {item.time}</p>
                    </div>
                    </div>
                    <span className={cn("text-xs font-mono font-bold", 
                    item.status === 'success' ? "text-green-500" : 
                    item.status === 'warning' ? "text-red-500" : "text-zinc-500"
                    )}>
                    {item.amount}
                    </span>
                </div>
                ))
            ) : (
                <p className="text-zinc-500 text-sm text-center py-4">No recent activity found.</p>
            )}
          </div>
        </div>

        {/* QUICK ACTIONS */}
        <div className="glass-panel rounded-xl border border-zinc-800 p-6 flex flex-col">
          <h3 className="font-bold text-white text-lg mb-6">Quick Actions</h3>
          <div className="space-y-3 flex-1">
            
            <button 
              onClick={() => router.push('/admin/bookings/new')} 
              className="w-full py-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-xl text-sm font-medium text-white flex items-center justify-center gap-2 transition-all group"
            >
              <CalendarCheck size={18} className="text-blue-500 group-hover:scale-110 transition-transform" />
              Create Manual Booking
            </button>

            {/* THE "ADD VEHICLE" BUTTON (Wraps the Wizard) */}
            <AddModelWizard 
              mode="create"
              trigger={
                <button className="w-full py-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-xl text-sm font-medium text-white flex items-center justify-center gap-2 transition-all group">
                  <Car size={18} className="text-yellow-500 group-hover:scale-110 transition-transform" />
                  Add Vehicle to Fleet
                </button>
              }
            />

            <button 
              onClick={() => router.push('/admin/customers/new')}
              className="w-full py-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-xl text-sm font-medium text-white flex items-center justify-center gap-2 transition-all group"
            >
              <Users size={18} className="text-green-500 group-hover:scale-110 transition-transform" />
              Register New Customer
            </button>
          </div>
          
          <div className="mt-6 pt-6 border-t border-zinc-800">
            <div className="flex items-center justify-between text-xs text-zinc-500 mb-2">
              <span>System Status</span>
              <span className="text-green-500 flex items-center gap-1"><div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" /> Online</span>
            </div>
            <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden">
              <div className="bg-green-500 h-full w-[98%]" />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}