"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Search, Filter, Plus, MoreVertical, Calendar, 
  User, Car, CheckCircle2, XCircle, Clock, Loader2 
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import CreateBookingWizard from "@/components/admin/bookings/CreateBookingWizard";
import BookingDetailSheet from "@/components/admin/bookings/BookingDetailSheet";

// --- TYPES ---
interface Booking {
  id: string;
  created_at: string;
  status: string;
  start_date: string;
  end_date: string;
  amount_paid: number;
  total_cost: number;
  payment_status: string;
  // Joins
  customer: {
    full_name: string;
    phone: string;
  };
  unit: {
    plate_number: string;
    model: {
      make: string;
      model: string;
      image_url: string;
    };
  };
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  
  // Sheet State
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);

  // --- 1. DATA FETCHING ---
  const fetchBookings = useCallback(async () => {
    setIsLoading(true);
    try {
      // The "Magic Query" that joins 3 tables at once
      let query = supabase
        .from('bookings')
        .select(`
          *,
          customer:customers!inner(full_name, phone),
          unit:fleet_units!inner(
            plate_number,
            model:fleet_models(make, model, image_url)
          )
        `)
        .order('created_at', { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      setBookings(data as any); // Type cast for complex join
    } catch (err) {
      console.error("Error fetching bookings:", err);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  // Initial Load
  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // --- 2. HELPERS ---
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return "bg-green-500/10 text-green-500 border-green-500/20";
      case 'pending': return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case 'completed': return "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
      case 'cancelled': return "bg-red-500/10 text-red-500 border-red-500/20";
      default: return "bg-zinc-800 text-zinc-400";
    }
  };

  const getPaymentStatusColor = (status: string) => {
    return status === 'paid' ? "text-green-500" : status === 'partial' ? "text-orange-500" : "text-red-500";
  };

  // --- 3. FILTERING ---
  const filteredBookings = bookings.filter(b => 
    b.customer.full_name.toLowerCase().includes(search.toLowerCase()) ||
    b.unit.plate_number.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Bookings</h1>
          <p className="text-zinc-400 text-sm mt-1">Manage reservations, trips, and payments.</p>
        </div>
        
        {/* NEW BOOKING WIZARD */}
        <CreateBookingWizard onBookingCreated={fetchBookings} />
      </div>

      {/* FILTERS */}
      <div className="flex flex-col md:flex-row gap-4 bg-zinc-900/50 p-4 rounded-xl border border-white/5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 text-zinc-500" size={18} />
          <Input 
            placeholder="Search customer or plate number..." 
            className="pl-10 bg-black border-zinc-800"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
          {["all", "pending", "active", "completed", "cancelled"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all whitespace-nowrap ${
                statusFilter === status 
                  ? "bg-white text-black font-bold" 
                  : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* TABLE */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <Loader2 className="animate-spin text-yellow-500" size={40} />
          <p className="text-zinc-500">Loading records...</p>
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center border border-dashed border-zinc-800 rounded-xl bg-zinc-900/30">
          <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mb-4">
            <Calendar size={32} className="text-zinc-600" />
          </div>
          <h3 className="text-lg font-bold text-white">No Bookings Found</h3>
          <p className="text-zinc-500 text-sm">Try adjusting your filters or create a new booking.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredBookings.map((booking) => (
            <div 
              key={booking.id} 
              onClick={() => setSelectedBookingId(booking.id)}
              className="group bg-zinc-900/50 hover:bg-zinc-900 border border-white/5 hover:border-zinc-700 p-4 rounded-xl transition-all cursor-pointer flex flex-col md:flex-row items-start md:items-center gap-6"
            >
              {/* Status Indicator */}
              <div className={`hidden md:block w-1.5 self-stretch rounded-full ${booking.status === 'active' ? 'bg-green-500' : booking.status === 'pending' ? 'bg-yellow-500' : 'bg-zinc-700'}`} />

              {/* Car Info */}
              <div className="flex items-center gap-4 min-w-[200px]">
                <div className="w-12 h-12 rounded-lg bg-black border border-zinc-800 overflow-hidden flex items-center justify-center">
                  {booking.unit.model.image_url ? (
                    <img src={booking.unit.model.image_url} alt="Car" className="w-full h-full object-cover" />
                  ) : (
                    <Car className="text-zinc-600" size={20} />
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">{booking.unit.model.make} {booking.unit.model.model}</h4>
                  <p className="text-xs text-zinc-500 font-mono">{booking.unit.plate_number}</p>
                </div>
              </div>

              {/* Customer Info */}
              <div className="flex-1 min-w-[200px]">
                <div className="flex items-center gap-2 mb-1">
                  <User size={14} className="text-zinc-500" />
                  <span className="text-sm font-medium text-zinc-200">{booking.customer.full_name}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-zinc-500">
                  <Clock size={12} />
                  <span>{new Date(booking.start_date).toLocaleDateString()} - {new Date(booking.end_date).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Financials */}
              <div className="min-w-[150px] text-right md:text-left">
                <p className="text-sm font-bold text-white">KES {booking.total_cost.toLocaleString()}</p>
                <p className={`text-xs font-medium uppercase ${getPaymentStatusColor(booking.payment_status)}`}>
                  {booking.payment_status}
                </p>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-4 ml-auto">
                <Badge className={`capitalize border ${getStatusColor(booking.status)}`}>
                  {booking.status}
                </Badge>
                <button className="p-2 hover:bg-white/10 rounded-full text-zinc-500 hover:text-white transition-colors">
                  <MoreVertical size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* DETAIL SHEET */}
      <BookingDetailSheet 
        bookingId={selectedBookingId} 
        isOpen={!!selectedBookingId} 
        onClose={() => setSelectedBookingId(null)}
        onUpdateCallback={fetchBookings}
      />

    </div>
  );
}