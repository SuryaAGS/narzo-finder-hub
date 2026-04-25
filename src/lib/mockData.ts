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
    { name: "Sona Masuri Rice", unit: "kg", defaultPrice: 60 },
    { name: "Sunflower Oil", unit: "L", defaultPrice: 145 },
    { name: "Toor Dal", unit: "kg", defaultPrice: 130 },
    { name: "Sugar", unit: "kg", defaultPrice: 45 },
    { name: "Salt", unit: "kg", defaultPrice: 22 },
    { name: "Tea Powder", unit: "100g", defaultPrice: 55 },
    { name: "Lifebuoy Soap", unit: "pc", defaultPrice: 25 },
    { name: "Clinic Plus Shampoo", unit: "sachet", defaultPrice: 3 },
    { name: "Colgate Toothpaste", unit: "100g", defaultPrice: 60 },
    { name: "Atta Flour", unit: "kg", defaultPrice: 45 },
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
    { name: "Cow Milk", unit: "L", defaultPrice: 56 },
    { name: "Buffalo Milk", unit: "L", defaultPrice: 65 },
    { name: "Curd", unit: "kg", defaultPrice: 70 },
    { name: "Paneer", unit: "250g", defaultPrice: 90 },
    { name: "Ghee", unit: "500ml", defaultPrice: 320 },
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
