export type Product = {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  stock: number;
  status: "active" | "draft" | "out_of_stock";
  image?: string;
};

export type Offer = {
  id: string;
  productId: string;
  title: string;
  discountPct: number;
  startsAt: string;
  endsAt: string;
  status: "active" | "scheduled" | "expired";
};

export type CartItem = { productId: string; qty: number };
export type Cart = {
  id: string;
  customer: string;
  email: string;
  items: CartItem[];
  updatedAt: string;
  status: "active" | "abandoned" | "checkout";
  location: string;
};

export type BillItem = { name: string; qty: number; price: number };
export type Bill = {
  id: string;
  number: string;
  customer: string;
  email: string;
  items: BillItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: "paid" | "unpaid" | "overdue";
  issuedAt: string;
  dueAt: string;
};

export const seedProducts: Product[] = [
  { id: "p1", name: "Aurora Wireless Headphones", sku: "AWH-001", category: "Audio", price: 189, stock: 42, status: "active" },
  { id: "p2", name: "Nimbus Smart Watch", sku: "NSW-220", category: "Wearables", price: 249, stock: 18, status: "active" },
  { id: "p3", name: "Pulse Bluetooth Speaker", sku: "PBS-340", category: "Audio", price: 89, stock: 0, status: "out_of_stock" },
  { id: "p4", name: "Lumen Desk Lamp", sku: "LDL-110", category: "Home", price: 59, stock: 76, status: "active" },
  { id: "p5", name: "Echo Mechanical Keyboard", sku: "EMK-455", category: "Computing", price: 139, stock: 31, status: "active" },
  { id: "p6", name: "Vista 4K Webcam", sku: "V4K-090", category: "Computing", price: 119, stock: 22, status: "active" },
  { id: "p7", name: "Cocoon Laptop Sleeve", sku: "CLS-015", category: "Accessories", price: 39, stock: 120, status: "active" },
  { id: "p8", name: "Drift Ergonomic Mouse", sku: "DEM-077", category: "Computing", price: 69, stock: 8, status: "active" },
  { id: "p9", name: "Halo Ring Light", sku: "HRL-300", category: "Studio", price: 79, stock: 0, status: "draft" },
  { id: "p10", name: "Orbit Charging Pad", sku: "OCP-201", category: "Accessories", price: 45, stock: 60, status: "active" },
];

export const seedOffers: Offer[] = [
  { id: "o1", productId: "p1", title: "Spring Sale", discountPct: 20, startsAt: "2026-04-01", endsAt: "2026-05-15", status: "active" },
  { id: "o2", productId: "p4", title: "Home Refresh", discountPct: 15, startsAt: "2026-04-10", endsAt: "2026-04-30", status: "active" },
  { id: "o3", productId: "p7", title: "Bundle Bonus", discountPct: 25, startsAt: "2026-05-01", endsAt: "2026-05-20", status: "scheduled" },
  { id: "o4", productId: "p2", title: "Winter Clearance", discountPct: 30, startsAt: "2026-01-01", endsAt: "2026-02-15", status: "expired" },
];

export const seedCarts: Cart[] = [
  {
    id: "c1",
    customer: "Maya Patel",
    email: "maya@northwind.io",
    items: [{ productId: "p1", qty: 1 }, { productId: "p10", qty: 2 }],
    updatedAt: "2026-04-25T09:14:00Z",
    status: "active",
    location: "Mumbai, IN",
  },
  {
    id: "c2",
    customer: "Liam Becker",
    email: "liam.b@hexa.de",
    items: [{ productId: "p5", qty: 1 }, { productId: "p8", qty: 1 }, { productId: "p7", qty: 1 }],
    updatedAt: "2026-04-25T08:42:00Z",
    status: "checkout",
    location: "Berlin, DE",
  },
  {
    id: "c3",
    customer: "Sofia Reyes",
    email: "sofia@aurelia.mx",
    items: [{ productId: "p2", qty: 1 }],
    updatedAt: "2026-04-24T22:10:00Z",
    status: "abandoned",
    location: "Mexico City, MX",
  },
  {
    id: "c4",
    customer: "Noah Chen",
    email: "noah@kite.sg",
    items: [{ productId: "p4", qty: 3 }, { productId: "p6", qty: 1 }],
    updatedAt: "2026-04-25T11:02:00Z",
    status: "active",
    location: "Singapore, SG",
  },
  {
    id: "c5",
    customer: "Amara Ojo",
    email: "amara@lumi.ng",
    items: [{ productId: "p3", qty: 2 }],
    updatedAt: "2026-04-23T15:33:00Z",
    status: "abandoned",
    location: "Lagos, NG",
  },
];

export const seedBills: Bill[] = [
  {
    id: "b1",
    number: "INV-2026-0041",
    customer: "Northwind Studios",
    email: "billing@northwind.io",
    items: [
      { name: "Aurora Wireless Headphones", qty: 4, price: 189 },
      { name: "Orbit Charging Pad", qty: 4, price: 45 },
    ],
    subtotal: 936,
    tax: 93.6,
    total: 1029.6,
    status: "paid",
    issuedAt: "2026-04-12",
    dueAt: "2026-04-26",
  },
  {
    id: "b2",
    number: "INV-2026-0042",
    customer: "Hexa GmbH",
    email: "ap@hexa.de",
    items: [
      { name: "Echo Mechanical Keyboard", qty: 6, price: 139 },
      { name: "Drift Ergonomic Mouse", qty: 6, price: 69 },
    ],
    subtotal: 1248,
    tax: 124.8,
    total: 1372.8,
    status: "unpaid",
    issuedAt: "2026-04-18",
    dueAt: "2026-05-02",
  },
  {
    id: "b3",
    number: "INV-2026-0040",
    customer: "Aurelia Co.",
    email: "ana@aurelia.mx",
    items: [{ name: "Nimbus Smart Watch", qty: 2, price: 249 }],
    subtotal: 498,
    tax: 49.8,
    total: 547.8,
    status: "overdue",
    issuedAt: "2026-03-28",
    dueAt: "2026-04-11",
  },
];

export const analyticsTrend = [
  { month: "Nov", revenue: 12400, orders: 142, customers: 96 },
  { month: "Dec", revenue: 18950, orders: 211, customers: 148 },
  { month: "Jan", revenue: 15200, orders: 178, customers: 121 },
  { month: "Feb", revenue: 17840, orders: 196, customers: 139 },
  { month: "Mar", revenue: 21300, orders: 234, customers: 167 },
  { month: "Apr", revenue: 24680, orders: 271, customers: 192 },
];

export const categoryShare = [
  { name: "Audio", value: 32 },
  { name: "Computing", value: 28 },
  { name: "Wearables", value: 18 },
  { name: "Home", value: 12 },
  { name: "Accessories", value: 10 },
];