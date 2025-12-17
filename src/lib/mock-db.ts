// ... Keep existing imports if any

export interface Unit {
  id: string;
  publicId: string; // e.g. "UNIT-492" (Safe ID)
  color: string;
  plate: string; // Private (Admin only)
  fuel: string;
  transmission: string;
  mileage: number;
  status: 'available' | 'rented' | 'maintenance';
  images: string[]; // Array of specific car photos
  features: string[]; // "Sunroof", "Leather", "Tinted"
}

export interface FleetModel {
  id: string;
  make: string;
  model: string;
  year: string;
  category: string;
  price: number;
  coverImage: string;
  description: string;
  units: Unit[];
}

export const MOCK_FLEET: FleetModel[] = [
  {
    id: "m1",
    make: "Toyota",
    model: "Land Cruiser Prado",
    year: "2021",
    category: "SUV",
    price: 15000,
    coverImage: "https://images.unsplash.com/photo-1519245659620-e859806a8d3b?auto=format&fit=crop&w=1200",
    description: "The undisputed king of Kenyan roads. Perfect for business, safari, and weddings.",
    units: [
      { 
        id: "u1", publicId: "PRD-001", plate: "KCD 123X", color: "Silver", fuel: "Diesel", transmission: "Auto", mileage: 45000, status: 'available',
        features: ["Sunroof", "Beige Leather", "Roof Rack"],
        images: [
          "https://images.unsplash.com/photo-1519245659620-e859806a8d3b?auto=format&fit=crop&w=800",
          "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800"
        ]
      },
      { 
        id: "u2", publicId: "PRD-002", plate: "KBA 890A", color: "Black", fuel: "Diesel", transmission: "Auto", mileage: 52000, status: 'rented',
        features: ["Tinted Windows", "Off-road Tires"],
        images: ["https://images.unsplash.com/photo-1503376763036-066120622c74?auto=format&fit=crop&w=800"]
      }
    ]
  },
  {
    id: "m2",
    make: "Mercedes-Benz",
    model: "C-Class",
    year: "2019",
    category: "Luxury",
    price: 12000,
    coverImage: "https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=1200",
    description: "Sophistication meets performance. The ideal choice for executive travel.",
    units: [
      { 
        id: "u3", publicId: "BNZ-882", plate: "KCC 333B", color: "Obsidian Black", fuel: "Petrol", transmission: "Auto", mileage: 32000, status: 'available',
        features: ["AMG Line", "Red Interior", "Panoramic Roof"],
        images: ["https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=800"]
      }
    ]
  }
];