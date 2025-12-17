"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { supabase } from "@/lib/supabase"; 
import {
  ChevronDown,
  ChevronRight,
  MoreVertical,
  Fuel,
  Gauge,
  Pencil,
  AlertTriangle,
  Search,
  Plus,
  Loader2
} from "lucide-react";

import AddModelWizard, { ModelFormData } from "./AddModelWizard";
import AddUnitWizard, { UnitFormData } from "./AddUnitWizard";
import UnitDetailSheet from "./UnitDetailSheet";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// ============================================================
// TYPES 
// ============================================================
interface Unit {
  id: string;
  public_id: string; 
  model_id: string; 
  plate_number: string;
  color: string;
  status: string;
  current_mileage: number;
  fuel_type: string;
  transmission?: string; // ADDED: Matches DB
  insurance_expiry?: string;
  vin?: string; 
  tracker_id?: string;
  hub_location?: string;
  images?: string[]; 
}

interface FleetModel {
  id: string;
  make: string;
  model: string;
  year: number;
  category: string;
  daily_rate: number;
  image_url: string;
  seats?: number; // ADDED: Matches DB
  tags?: string[];
  features?: string[];
  units: Unit[]; 
}

interface FleetTableProps {
  statusFilter?: string;
}

export default function FleetTable({ statusFilter = "all" }: FleetTableProps) {
  const [fleetData, setFleetData] = useState<FleetModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedRows, setExpandedRows] = useState<string[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [unitToDelete, setUnitToDelete] = useState<string | null>(null);

  // ------------------------------------------------------------
  // DATA FETCHING (SPLIT STRATEGY)
  // ------------------------------------------------------------
  const fetchFleet = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch Models
      const { data: modelsData, error: modelsError } = await supabase
        .from('fleet_models')
        .select('*')
        .order('created_at', { ascending: false });

      if (modelsError) throw modelsError;

      // 2. Fetch ALL Units
      const { data: unitsData, error: unitsError } = await supabase
        .from('fleet_units')
        .select('*');

      if (unitsError) throw unitsError;

      // 3. Map Units to Models
      const joinedData: FleetModel[] = (modelsData || []).map((model: any) => {
          const modelUnits = (unitsData || []).filter((u: any) => u.model_id === model.id);
          return {
              ...model,
              units: modelUnits as Unit[]
          };
      });

      setFleetData(joinedData);
      
    } catch (err: any) {
      console.error("Fetch Error:", err.message || err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFleet();
  }, []);

  const handleRefresh = () => {
    fetchFleet();
  };

  // ------------------------------------------------------------
  // HANDLERS
  // ------------------------------------------------------------
  const handleUnitStatusUpdate = useCallback((unitId: string, newStatus: string) => {
    setFleetData((prev) =>
      prev.map((m) => ({
        ...m,
        units: m.units.map((u) =>
          u.id === unitId ? { ...u, status: newStatus } : u
        ),
      }))
    );

    setSelectedUnit((prev) => {
        if (prev && prev.id === unitId) {
            return { ...prev, status: newStatus };
        }
        return prev;
    });
  }, []);

  // Sync Logic
  useEffect(() => {
    if (selectedUnit) {
      const parentModel = fleetData.find(m => m.units.some(u => u.id === selectedUnit.id));
      const freshUnit = parentModel?.units.find(u => u.id === selectedUnit.id);
      
      if (freshUnit && JSON.stringify(freshUnit) !== JSON.stringify(selectedUnit)) {
        setSelectedUnit(freshUnit);
      }
    }
  }, [fleetData, selectedUnit]);

  const handleDeleteUnit = async () => {
    if (!unitToDelete) return;
    
    const { error } = await supabase.from('fleet_units').delete().eq('id', unitToDelete);
    
    if (!error) {
      setFleetData((prev) =>
        prev.map((m) => ({
          ...m,
          units: m.units.filter((u) => u.id !== unitToDelete),
        }))
      );
    } else {
      alert("Failed to delete unit: " + error.message);
    }
    setUnitToDelete(null);
  };

  const toggleRow = useCallback((id: string) => {
    setExpandedRows((prev) =>
      prev.includes(id)
        ? prev.filter((rowId) => rowId !== id)
        : [...prev, id]
    );
  }, []);

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case "available": return "text-green-400 bg-green-400/10 border-green-400/20";
      case "rented": return "text-blue-400 bg-blue-400/10 border-blue-400/20";
      case "maintenance": return "text-orange-400 bg-orange-400/10 border-orange-400/20";
      case "cleaning": return "text-purple-400 bg-purple-400/10 border-purple-400/20";
      default: return "text-zinc-400";
    }
  }, []);

  // ------------------------------------------------------------
  // FILTER LOGIC
  // ------------------------------------------------------------
  const filteredFleet = useMemo(() => {
    let data = fleetData;

    if (statusFilter !== "all") {
      data = data
        .map((model) => {
          const matchUnits = model.units.filter((u) =>
            statusFilter === "maintenance"
              ? u.status === "maintenance" || u.status === "cleaning"
              : u.status === statusFilter
          );
          return matchUnits.length ? { ...model, units: matchUnits } : null;
        })
        .filter(Boolean) as FleetModel[];
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      data = data
        .map((model) => {
          const modelMatch = `${model.make} ${model.model}`.toLowerCase().includes(query);
          const unitMatch = model.units.some((u) => u.plate_number.toLowerCase().includes(query));

          if (modelMatch) return model;
          if (unitMatch)
            return {
              ...model,
              units: model.units.filter((u) => u.plate_number.toLowerCase().includes(query)),
            };

          return null;
        })
        .filter(Boolean) as FleetModel[];
    }

    return data;
  }, [fleetData, searchQuery, statusFilter]);

  const stats = useMemo(() => {
    let available = 0;
    let rented = 0;
    let total = 0;

    fleetData.forEach((m) => {
      m.units.forEach((u) => {
        total++;
        if (u.status === "available") available++;
        if (u.status === "rented") rented++;
      });
    });

    return { total, available, rented };
  }, [fleetData]);

  // ------------------------------------------------------------
  // RENDER
  // ------------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* COMMAND BAR */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-end md:items-center bg-zinc-900/50 p-4 rounded-2xl border border-white/5">
        <div className="relative w-full md:w-96 group">
          <Search className="absolute left-3 top-3 text-zinc-500 group-focus-within:text-yellow-500 transition-colors" size={18} />
          <Input
            placeholder="Search by Model or Plate..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (e.target.value) setExpandedRows(fleetData.map((m) => m.id));
            }}
            className="pl-10 bg-black border-zinc-800 focus:border-yellow-500/50 h-11 rounded-xl"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden lg:flex gap-2">
            <Badge className="h-9 px-4 border-zinc-700 text-zinc-400 font-normal bg-transparent">Total {stats.total}</Badge>
            <Badge className="h-9 px-4 border-green-900/30 bg-green-500/10 text-green-500">Available {stats.available}</Badge>
            <Badge className="h-9 px-4 border-blue-900/30 bg-blue-500/10 text-blue-500">Rented {stats.rented}</Badge>
          </div>

          <AddModelWizard 
             mode="create"
             onSave={handleRefresh} 
             trigger={
               <Button className="h-11 bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-6 shadow-lg shadow-yellow-500/20">
                 <Plus size={18} className="mr-2" /> Add Model
               </Button>
             }
          />
        </div>
      </div>

      {/* DETAIL SHEET */}
      <UnitDetailSheet
        unit={selectedUnit ? {
            id: selectedUnit.id,
            plate: selectedUnit.plate_number,
            color: selectedUnit.color,
            fuel: selectedUnit.fuel_type,
            mileage: selectedUnit.current_mileage,
            status: selectedUnit.status
        } : null}
        isOpen={!!selectedUnit}
        onClose={() => setSelectedUnit(null)}
        onUpdateStatus={handleUnitStatusUpdate}
      />

      {/* DELETE DIALOG */}
      <AlertDialog open={!!unitToDelete} onOpenChange={() => setUnitToDelete(null)}>
        <AlertDialogContent className="glass-panel border-zinc-800 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-400"><AlertTriangle size={20} /> Delete Unit?</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">This action is permanent and will remove the vehicle from your records.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-zinc-700 hover:bg-zinc-800 hover:text-white">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUnit} className="bg-red-500 text-white hover:bg-red-600">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* TABLE */}
      {isLoading ? (
         <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <Loader2 className="animate-spin text-yellow-500" size={40} />
            <p className="text-zinc-500">Loading fleet data...</p>
         </div>
      ) : (
        <div className="space-y-4">
          {filteredFleet.length > 0 ? (
            filteredFleet.map((car) => {
              const isExpanded = expandedRows.includes(car.id);
              const availableUnits = car.units.filter((u) => u.status === "available").length;

              // --- FIX 1: Add 'seats' to ModelFormData ---
              const modelForm: ModelFormData = {
                id: car.id,
                make: car.make,
                model: car.model,
                year: String(car.year),
                category: car.category,
                baseRate: String(car.daily_rate),
                seats: String(car.seats || 5), // Added seats
                tags: car.features || [],
                coverImage: car.image_url,
                video: null,
              };

              return (
                <div key={car.id} className="glass-panel rounded-xl overflow-hidden transition-all duration-300 hover:border-zinc-700">
                  {/* PARENT ROW */}
                  <div
                    onClick={() => toggleRow(car.id)}
                    className="p-4 flex flex-col md:flex-row gap-4 cursor-pointer hover:bg-white/5 transition-colors border-l-4 border-transparent hover:border-yellow-500"
                  >
                    <div className="flex items-center gap-4 w-full md:w-auto flex-1">
                      <button className="p-1 rounded-full hover:bg-white/10 text-yellow-500 transition-transform duration-200">
                        {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                      </button>
                      <div className="w-20 h-14 rounded-lg overflow-hidden border border-zinc-800 relative shadow-sm">
                        <img src={car.image_url} alt={car.model} className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-lg font-bold text-white truncate">{car.make} {car.model}</h3>
                        <div className="flex items-center gap-2 text-xs text-zinc-400 mt-1">
                          <span className="font-mono px-1.5 py-0.5 bg-zinc-900 rounded border border-zinc-800">{car.year}</span>
                          <span className="text-yellow-500 font-medium bg-yellow-500/10 px-2 py-0.5 rounded">{car.category}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between w-full md:w-auto gap-6">
                      <div className="flex flex-col items-end text-right">
                        <span className="text-xl font-bold text-white">KES {car.daily_rate.toLocaleString()}</span>
                        <div className="flex gap-2 text-xs">
                           <span className="text-zinc-500 flex items-center gap-1"><Gauge size={12}/> {car.units.length} Units</span>
                           <span className="text-green-500 font-medium">{availableUnits} Free</span>
                        </div>
                      </div>

                      <div onClick={(e) => e.stopPropagation()} className="flex items-center gap-2">
                        <AddModelWizard
                          mode="edit"
                          defaultData={modelForm}
                          onSave={handleRefresh}
                          trigger={
                            <button className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors" title="Edit Model"><Pencil size={18} /></button>
                          }
                        />
                      </div>
                    </div>
                  </div>

                  {/* CHILD ROWS */}
                  {isExpanded && (
                    <div className="bg-zinc-950/50 border-t border-white/5 animate-accordion-down">
                      <div className="px-4 md:px-16 py-4 grid grid-cols-1 gap-2">
                        <div className="hidden md:grid grid-cols-6 text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2 px-4">
                          <span className="col-span-1">Plate</span><span className="col-span-1">Color</span><span className="col-span-1">Fuel</span><span className="col-span-1">Mileage</span><span className="col-span-1">Status</span><span className="col-span-1 text-right">Actions</span>
                        </div>

                        {car.units.map((unit) => {
                          // --- FIX 2: Add 'transmission' to UnitFormData ---
                          const unitForm: UnitFormData = {
                            id: unit.id,
                            plate: unit.plate_number, 
                            color: unit.color, 
                            fuel: unit.fuel_type, 
                            transmission: unit.transmission || "Automatic", // Added Transmission
                            mileage: String(unit.current_mileage),
                            vin: unit.vin || "", 
                            insuranceExpiry: unit.insurance_expiry || "", 
                            trackerId: unit.tracker_id || "", 
                            location: unit.hub_location || "", 
                            imageMap: {},
                            tagsMap: {},
                            savedImages: unit.images || [],
                          };

                          return (
                            <div key={unit.id} onClick={() => setSelectedUnit(unit)} className="grid grid-cols-2 md:grid-cols-6 items-center px-4 py-3 rounded-lg hover:bg-white/5 border border-transparent hover:border-yellow-500/30 transition-all cursor-pointer group/unit">
                              <span className="font-mono text-white text-lg md:text-base group-hover/unit:text-yellow-500">{unit.plate_number}</span>
                              <span className="hidden md:block text-zinc-400">{unit.color}</span>
                              <span className="hidden md:flex items-center gap-2 text-zinc-400"><Fuel size={14} /> {unit.fuel_type}</span>
                              <span className="hidden md:block text-zinc-400">{unit.current_mileage.toLocaleString()} km</span>
                              <span className="justify-self-end md:justify-self-start"><span className={`px-2 py-1 rounded-full text-xs font-medium border whitespace-nowrap ${getStatusColor(unit.status)}`}>{unit.status.toUpperCase()}</span></span>
                              
                              <div onClick={(e) => e.stopPropagation()} className="hidden md:flex col-span-1 justify-end items-center gap-2">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild><button className="p-1.5 rounded hover:bg-white/10 text-zinc-400 hover:text-white"><MoreVertical size={16} /></button></DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="bg-zinc-950 border-zinc-800 text-white">
                                    <DropdownMenuLabel className="text-xs text-zinc-500">Unit Actions</DropdownMenuLabel>
                                    <DropdownMenuItem onClick={() => setSelectedUnit(unit)}>View Full Details</DropdownMenuItem>
                                    <AddUnitWizard mode="edit" defaultData={unitForm} onSave={handleRefresh} trigger={<div className="px-2 py-1.5 text-sm hover:bg-zinc-900 cursor-pointer">Edit Details</div>} />
                                    <DropdownMenuSeparator className="bg-zinc-800" />
                                    <DropdownMenuItem onClick={() => setUnitToDelete(unit.id)} className="text-red-400 hover:bg-red-500/10 cursor-pointer">Delete Unit</DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <div className="px-4 md:px-16 pb-4"><AddUnitWizard parentModelName={`${car.make} ${car.model}`} parentModelId={car.id} onSave={handleRefresh} /></div>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-zinc-900/30 rounded-2xl border border-dashed border-zinc-800">
              <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center text-zinc-600 mb-4"><Search size={32} /></div>
              <h3 className="text-white font-bold text-lg">No vehicles found</h3>
              <p className="text-zinc-500 max-w-xs mx-auto mb-6">No cars in your database yet.</p>
              <AddModelWizard mode="create" onSave={handleRefresh} trigger={<Button className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold">Add First Model</Button>} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}