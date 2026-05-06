export type StockStatus = "in" | "out";

export type InventoryItem = {
  id: string;
  name: string;
  aliases: string[]; // for fuzzy / multi-language match
  price: number;
  unit: string;
  status: StockStatus;
  updatedAt: number;
};

export type Shop = {
  id: string;
  name: string;
  owner: string;
  category: string;
  village: string;
  distanceKm: number;
  whatsapp: string; // E.164 without +
  updatedAt: number;
  items: InventoryItem[];
};

const now = Date.now();
const m = 60_000;

export const SHOPS: Shop[] = [
  {
    id: "s1",
    name: "Lakshmi Kirana",
    owner: "Ramesh",
    category: "Kirana / Grocery",
    village: "Pothavaram",
    distanceKm: 0.6,
    whatsapp: "919999900001",
    updatedAt: now - 12 * m,
    items: [
      { id: "i1", name: "Sona Masuri Rice", aliases: ["rice", "biyyam", "chawal"], price: 62, unit: "kg", status: "in", updatedAt: now - 12 * m },
      { id: "i2", name: "Sunflower Oil", aliases: ["oil", "tel", "noone"], price: 145, unit: "L", status: "in", updatedAt: now - 30 * m },
      { id: "i3", name: "Lifebuoy Soap", aliases: ["soap", "sabbu", "saabun"], price: 25, unit: "pc", status: "in", updatedAt: now - 60 * m },
      { id: "i4", name: "Clinic Plus Shampoo", aliases: ["shampoo", "sampoo", "shampu"], price: 3, unit: "sachet", status: "out", updatedAt: now - 240 * m },
      { id: "i5", name: "Toor Dal", aliases: ["dal", "kandipappu", "arhar"], price: 130, unit: "kg", status: "in", updatedAt: now - 90 * m },
    ],
  },
  {
    id: "s2",
    name: "Sai Medical & General",
    owner: "Padma",
    category: "Medical / General",
    village: "Pothavaram",
    distanceKm: 1.2,
    whatsapp: "919999900002",
    updatedAt: now - 45 * m,
    items: [
      { id: "i6", name: "Paracetamol 500", aliases: ["paracetamol", "fever tablet", "jwaram"], price: 18, unit: "strip", status: "in", updatedAt: now - 45 * m },
      { id: "i7", name: "Dettol Antiseptic", aliases: ["dettol", "antiseptic"], price: 75, unit: "100ml", status: "in", updatedAt: now - 70 * m },
      { id: "i8", name: "Clinic Plus Shampoo", aliases: ["shampoo", "sampoo"], price: 3, unit: "sachet", status: "in", updatedAt: now - 20 * m },
    ],
  },
  {
    id: "s3",
    name: "Ganesh Vegetables",
    owner: "Ganesh",
    category: "Vegetables",
    village: "Mallavaram",
    distanceKm: 2.4,
    whatsapp: "919999900003",
    updatedAt: now - 8 * m,
    items: [
      { id: "i9", name: "Tomato", aliases: ["tomato", "tamata", "tamatar"], price: 28, unit: "kg", status: "in", updatedAt: now - 8 * m },
      { id: "i10", name: "Onion", aliases: ["onion", "ulli", "pyaaz"], price: 35, unit: "kg", status: "in", updatedAt: now - 8 * m },
      { id: "i11", name: "Potato", aliases: ["potato", "bangaladumpa", "aloo"], price: 30, unit: "kg", status: "out", updatedAt: now - 200 * m },
    ],
  },
  {
    id: "s4",
    name: "Anjaneya Dairy",
    owner: "Suresh",
    category: "Dairy",
    village: "Pothavaram",
    distanceKm: 0.9,
    whatsapp: "919999900004",
    updatedAt: now - 5 * m,
    items: [
      { id: "i12", name: "Cow Milk", aliases: ["milk", "paalu", "doodh"], price: 56, unit: "L", status: "in", updatedAt: now - 5 * m },
      { id: "i13", name: "Curd", aliases: ["curd", "perugu", "dahi"], price: 70, unit: "kg", status: "in", updatedAt: now - 5 * m },
    ],
  },
];

// Popular items templates by category for shopkeeper quick-curation
export const POPULAR_BY_CATEGORY: Record<string, { name: string; unit: string; defaultPrice: number }[]> = {
  "Kirana / Grocery": [
    // Grains
    { name: "Sona Masuri Rice", unit: "kg", defaultPrice: 60 },
    { name: "Basmati Rice", unit: "kg", defaultPrice: 110 },
    { name: "Wheat Flour (Atta)", unit: "kg", defaultPrice: 45 },
    { name: "Maida", unit: "kg", defaultPrice: 40 },
    // Pulses
    { name: "Toor Dal", unit: "kg", defaultPrice: 130 },
    { name: "Moong Dal", unit: "kg", defaultPrice: 120 },
    { name: "Chana Dal", unit: "kg", defaultPrice: 95 },
    { name: "Urad Dal", unit: "kg", defaultPrice: 140 },
    // Sweeteners & salts
    { name: "Refined Sugar", unit: "kg", defaultPrice: 45 },
    { name: "Jaggery (Gur)", unit: "kg", defaultPrice: 65 },
    { name: "Iodized Salt", unit: "kg", defaultPrice: 22 },
    { name: "Crystal Salt", unit: "kg", defaultPrice: 18 },
    // Oils
    { name: "Sunflower Oil", unit: "L", defaultPrice: 145 },
    { name: "Groundnut Oil", unit: "L", defaultPrice: 180 },
    { name: "Mustard Oil", unit: "L", defaultPrice: 165 },
    { name: "Ghee", unit: "500ml", defaultPrice: 320 },
    // Spices — basics
    { name: "Turmeric Powder", unit: "100g", defaultPrice: 25 },
    { name: "Red Chili Powder", unit: "100g", defaultPrice: 35 },
    { name: "Coriander Powder (Dhania)", unit: "100g", defaultPrice: 30 },
    // Whole spices
    { name: "Cumin Seeds (Jeera)", unit: "100g", defaultPrice: 45 },
    { name: "Mustard Seeds (Ava)", unit: "100g", defaultPrice: 20 },
    { name: "Cloves", unit: "50g", defaultPrice: 60 },
    { name: "Cardamom", unit: "50g", defaultPrice: 120 },
    // Masala blends
    { name: "Garam Masala", unit: "100g", defaultPrice: 45 },
    { name: "Chicken / Meat Masala", unit: "100g", defaultPrice: 50 },
    { name: "Sambar Powder", unit: "100g", defaultPrice: 40 },
    // Beverages
    { name: "Tea Powder", unit: "100g", defaultPrice: 55 },
    { name: "Instant Coffee", unit: "50g", defaultPrice: 95 },
    { name: "Filter Coffee", unit: "100g", defaultPrice: 80 },
    { name: "Horlicks", unit: "500g", defaultPrice: 260 },
    { name: "Bournvita", unit: "500g", defaultPrice: 255 },
    { name: "Boost", unit: "500g", defaultPrice: 270 },
    // Breakfast
    { name: "Poha (Flattened Rice)", unit: "kg", defaultPrice: 60 },
    { name: "Vermicelli (Semiya)", unit: "200g", defaultPrice: 30 },
    { name: "Oats", unit: "500g", defaultPrice: 110 },
    // Biscuits
    { name: "Marie Gold Biscuits", unit: "pack", defaultPrice: 20 },
    { name: "Parle-G Biscuits", unit: "pack", defaultPrice: 10 },
    { name: "Good Day Biscuits", unit: "pack", defaultPrice: 30 },
    { name: "Bourbon Biscuits", unit: "pack", defaultPrice: 35 },
    // Namkeen
    { name: "Mixture", unit: "200g", defaultPrice: 40 },
    { name: "Aloo Bhujia", unit: "200g", defaultPrice: 50 },
    { name: "Fried Peanuts", unit: "200g", defaultPrice: 45 },
    // Instant
    { name: "Maggi Noodles", unit: "pack", defaultPrice: 14 },
    { name: "Pasta", unit: "500g", defaultPrice: 65 },
    { name: "Rusks", unit: "pack", defaultPrice: 40 },
    // Personal care — soap
    { name: "Lifebuoy Soap", unit: "pc", defaultPrice: 25 },
    { name: "Santoor Soap", unit: "pc", defaultPrice: 35 },
    { name: "Rin Detergent Bar", unit: "pc", defaultPrice: 20 },
    { name: "Wheel Detergent Bar", unit: "pc", defaultPrice: 15 },
    // Hair
    { name: "Coconut Oil", unit: "100ml", defaultPrice: 40 },
    { name: "Clinic Plus Shampoo", unit: "sachet", defaultPrice: 3 },
    { name: "Sunsilk Shampoo", unit: "sachet", defaultPrice: 3 },
    // Dental
    { name: "Colgate Toothpaste", unit: "100g", defaultPrice: 60 },
    { name: "Pepsodent Toothpaste", unit: "100g", defaultPrice: 55 },
    { name: "Toothbrush", unit: "pc", defaultPrice: 25 },
    // Home
    { name: "Vim Dishwash Bar", unit: "pc", defaultPrice: 20 },
    { name: "Floor Cleaner", unit: "500ml", defaultPrice: 95 },
    { name: "Agarbatti (Incense Sticks)", unit: "pack", defaultPrice: 30 },
  ],
  Vegetables: [
    { name: "Tomato", unit: "kg", defaultPrice: 30 },
    { name: "Onion", unit: "kg", defaultPrice: 35 },
    { name: "Potato", unit: "kg", defaultPrice: 30 },
    { name: "Green Chilli", unit: "kg", defaultPrice: 60 },
    { name: "Coriander", unit: "bunch", defaultPrice: 10 },
    { name: "Curry Leaves", unit: "bunch", defaultPrice: 5 },
  ],
  Dairy: [
    { name: "Fresh Milk (Packet)", unit: "L", defaultPrice: 56 },
    { name: "Cow Milk", unit: "L", defaultPrice: 56 },
    { name: "Buffalo Milk", unit: "L", defaultPrice: 65 },
    { name: "Curd (Dahi)", unit: "kg", defaultPrice: 70 },
    { name: "Paneer", unit: "250g", defaultPrice: 90 },
    { name: "Ghee", unit: "500ml", defaultPrice: 320 },
    { name: "Eggs (Tray of 6)", unit: "tray", defaultPrice: 48 },
    { name: "Eggs (Tray of 12)", unit: "tray", defaultPrice: 90 },
  ],
  "Medical / General": [
    { name: "Paracetamol 500", unit: "strip", defaultPrice: 18 },
    { name: "ORS Sachet", unit: "pc", defaultPrice: 22 },
    { name: "Dettol Antiseptic", unit: "100ml", defaultPrice: 75 },
    { name: "Bandage Roll", unit: "pc", defaultPrice: 35 },
    { name: "Sanitary Pads", unit: "pack", defaultPrice: 50 },
  ],
};

export const CATEGORIES = Object.keys(POPULAR_BY_CATEGORY);

export function timeAgo(ts: number, now = Date.now()): string {
  const diff = Math.max(0, now - ts);
  const min = Math.floor(diff / 60_000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.floor(hr / 24);
  return `${d}d ago`;
}
