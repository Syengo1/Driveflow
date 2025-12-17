"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Search, Users, ShieldCheck, Ban, Crown, MoreHorizontal, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import CustomerDetailSheet from "@/components/admin/customers/CustomerDetailSheet";
import AddCustomerWizard from "@/components/admin/customers/AddCustomerWizard";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

// --- TYPES ---
interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  idNumber: string;
  status: string;
  totalSpent: number;
  rentalsCount: number;
  trustScore: number;
  joinedDate: string;
  kycStatus: string;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // --- 1. DATA FETCHING ENGINE ---
  const fetchCustomers = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch Customers & Join with Bookings to calculate stats
      // Note: In a large app, you'd use a Postgres View or RPC function for this aggregation.
      // For now, we fetch bookings and aggregate client-side for simplicity.
      
      const { data: customerData, error } = await supabase
        .from('customers')
        .select(`
          *,
          bookings:bookings ( total_cost, status )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (customerData) {
        const transformed: Customer[] = customerData.map((c: any) => {
            const validBookings = c.bookings?.filter((b: any) => b.status !== 'cancelled') || [];
            const totalSpent = validBookings.reduce((sum: number, b: any) => sum + (b.total_cost || 0), 0);
            const rentalCount = c.bookings?.length || 0;
            const cancelledCount = c.bookings?.filter((b: any) => b.status === 'cancelled').length || 0;
            
            // Dynamic Trust Score
            let score = c.trust_score || 100;
            if (rentalCount > 0) score += (validBookings.length * 2); // Bonus for good trips
            if (cancelledCount > 0) score -= (cancelledCount * 20); // Penalty for cancels
            score = Math.min(100, Math.max(0, score));

            return {
                id: c.id,
                name: c.full_name,
                phone: c.phone,
                email: c.email || "",
                idNumber: c.id_number,
                status: c.status,
                totalSpent: totalSpent,
                rentalsCount: rentalCount,
                trustScore: score,
                joinedDate: new Date(c.created_at).toISOString().split('T')[0],
                kycStatus: (c.id_image_url && c.dl_image_url) ? 'verified' : 'pending'
            };
        });
        setCustomers(transformed);
      }
    } catch (err) {
      console.error("Error loading customers:", err);
      toast.error("Failed to load customer list");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // --- 2. FILTERING ---
  const filteredCustomers = useMemo(() => {
    if (!searchQuery) return customers;
    const lower = searchQuery.toLowerCase();
    return customers.filter(c => 
      c.name.toLowerCase().includes(lower) || 
      c.phone.includes(lower) ||
      c.idNumber.toLowerCase().includes(lower)
    );
  }, [customers, searchQuery]);

  // --- 3. STATS ---
  const stats = useMemo(() => ({
    total: customers.length,
    active: customers.filter(c => c.status === 'active').length,
    blacklisted: customers.filter(c => c.status === 'blacklisted').length,
    vip: customers.filter(c => c.totalSpent > 100000).length // VIP threshold: 100k
  }), [customers]);

  // --- HANDLERS ---
  const handleUpdateStatus = (id: string, status: string) => {
    setCustomers(prev => prev.map(c => c.id === id ? { ...c, status } : c));
    // Usually Sheet handles the DB update, this just updates local UI instantly
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* HEADER & STATS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-1">
          <h1 className="text-3xl font-bold text-white">Customers</h1>
          <p className="text-zinc-400 text-sm mt-1">CRM & Identity Verification.</p>
        </div>
        
        <div className="glass-panel p-4 rounded-xl border border-white/5 flex items-center justify-between">
          <div><p className="text-xs text-zinc-500 uppercase font-bold">Active Clients</p><h3 className="text-2xl font-bold text-blue-500">{stats.active}</h3></div>
          <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500"><Users size={20}/></div>
        </div>
        <div className="glass-panel p-4 rounded-xl border border-white/5 flex items-center justify-between">
          <div><p className="text-xs text-zinc-500 uppercase font-bold">VIP Members</p><h3 className="text-2xl font-bold text-yellow-500">{stats.vip}</h3></div>
          <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-500"><Crown size={20}/></div>
        </div>
        <div className="glass-panel p-4 rounded-xl border border-white/5 flex items-center justify-between">
          <div><p className="text-xs text-zinc-500 uppercase font-bold">Blacklisted</p><h3 className="text-2xl font-bold text-red-500">{stats.blacklisted}</h3></div>
          <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-500"><Ban size={20}/></div>
        </div>
      </div>

      {/* COMMAND BAR */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-end md:items-center bg-zinc-900/50 p-4 rounded-2xl border border-white/5">
        <div className="relative w-full md:w-96 group">
          <Search className="absolute left-3 top-3 text-zinc-500 group-focus-within:text-yellow-500 transition-colors" size={18} />
          <Input 
            placeholder="Search Name, Phone or ID..." 
            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-black border-zinc-800 focus:border-yellow-500/50 h-11 rounded-xl"
          />
        </div>
        <AddCustomerWizard onAdd={fetchCustomers} />
      </div>

      {/* CUSTOMER LIST */}
      <div className="space-y-3">
        {isLoading ? (
            <div className="text-center py-20 flex flex-col items-center gap-3">
                <Loader2 className="animate-spin text-yellow-500" size={32} />
                <p className="text-zinc-500">Loading Customer Database...</p>
            </div>
        ) : filteredCustomers.length > 0 ? (
            filteredCustomers.map((customer) => (
            <div 
                key={customer.id}
                onClick={() => setSelectedCustomer(customer)}
                className="glass-panel p-4 rounded-xl border border-white/5 hover:border-zinc-700 cursor-pointer transition-all group flex flex-col md:flex-row items-center gap-6"
            >
                {/* Avatar & Name */}
                <div className="flex items-center gap-4 w-full md:w-auto flex-1">
                <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-400 font-bold">
                    {customer.name.charAt(0)}
                </div>
                <div>
                    <h4 className="font-bold text-white group-hover:text-yellow-500 transition-colors">{customer.name}</h4>
                    <p className="text-xs text-zinc-500">{customer.email || customer.idNumber}</p>
                </div>
                </div>

                {/* Details Grid */}
                <div className="flex-[2] grid grid-cols-2 md:grid-cols-3 gap-4 w-full items-center">
                <div>
                    <p className="text-xs text-zinc-500 uppercase">Phone</p>
                    <p className="text-sm font-mono text-zinc-300">{customer.phone}</p>
                </div>
                <div>
                    <p className="text-xs text-zinc-500 uppercase">Total Spent</p>
                    <p className="text-sm font-bold text-green-500">KES {customer.totalSpent.toLocaleString()}</p>
                </div>
                <div className="hidden md:block">
                    <p className="text-xs text-zinc-500 uppercase">Status</p>
                    <Badge className={cn("capitalize", customer.status === 'active' ? "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20" : "bg-red-500/10 text-red-500")}>
                    {customer.status}
                    </Badge>
                </div>
                </div>

                {/* Action */}
                <div className="hidden md:block">
                <button className="p-2 hover:bg-zinc-800 rounded-full text-zinc-500 hover:text-white transition-colors">
                    <MoreHorizontal size={20} />
                </button>
                </div>
            </div>
            ))
        ) : (
            <div className="text-center py-20 bg-zinc-900/30 rounded-2xl border border-dashed border-zinc-800">
                <p className="text-zinc-500">No customers found.</p>
            </div>
        )}
      </div>

      {/* DETAILS SHEET */}
      <CustomerDetailSheet 
        customer={selectedCustomer} 
        isOpen={!!selectedCustomer} 
        onClose={() => setSelectedCustomer(null)} 
        onUpdateStatus={handleUpdateStatus}
      />

    </div>
  );
}