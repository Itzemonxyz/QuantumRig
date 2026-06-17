import "dotenv/config";
import express from "express";
import path from "path";
import Stripe from "stripe";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import fs from "fs";
import { User, Category, Brand, Product, Order, Settings, Coupon, Offer, Banner, RestockRequest, UserNotification, SocialLink, StockAdjustmentLog, FAQItem, SharedBuild, Role } from "./src/types";

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

const originalConsoleError = console.error;
console.error = (...args) => {
  const argStr = args.map(a => typeof a === 'object' ? JSON.stringify(a, Object.getOwnPropertyNames(a)) : String(a)).join(' ');
  if (argStr.includes("PERMISSION_DENIED") || argStr.includes("CANCELLED") || argStr.includes("GrpcConnection RPC")) {
    return;
  }
  originalConsoleError(...args);
};

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  res.set('Surrogate-Control', 'no-store');
  next();
});

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

// Initialize the Admin SDK
let db: Firestore;
const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
const bucketName = process.env.VITE_FIREBASE_STORAGE_BUCKET || "emonxyz-48285.appspot.com";

if (serviceAccountJson) {
  try {
    const serviceAccount = JSON.parse(serviceAccountJson);
    initializeApp({
      credential: cert(serviceAccount),
      storageBucket: bucketName
    });
    db = getFirestore();
    console.log("🔥 Connected to Firebase Admin (bypasses security rules) with Storage bucket:", bucketName);
  } catch (error) {
    console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT environment variable:", error);
  }
} else {
  console.warn("⚠️ FIREBASE_SERVICE_ACCOUNT environment variable is missing.");
}

// IN-MEMORY DATABASE
let stockLogs: StockAdjustmentLog[] = [];
let stockNotifications: { id: string; productId: string; email: string; createdAt: string }[] = [];
let supportTickets: { id: string; productId: string; email: string; question: string; status: 'Open' | 'Closed'; createdAt: string }[] = [];
let complaints: { id: string; name: string; email: string; orderId?: string; category: string; description: string; createdAt: string }[] = [];
let analyticsEvents: { id: string; event: string; productId: string; timestamp: string }[] = [];
let restockRequests: RestockRequest[] = [];
let adminNotifications: { id: string; message: string; type: string; read: boolean; createdAt: string }[] = [];
let roles: Role[] = [];
let users: User[] = [
  { id: "admin_1", name: "Administrator", email: "admin@quantumrig.tech", password: "admin", role: "admin", savedProductIds: [], createdAt: new Date(Date.now() - 86400000 * 30).toISOString(), lastVisited: new Date().toISOString() },
  { id: "admin_2", name: "Administrator", email: "admin@quantumrig.tech", password: "admin6207", role: "admin", savedProductIds: [], createdAt: new Date(Date.now() - 86400000 * 15).toISOString(), lastVisited: new Date().toISOString() }
];

let categories: Category[] = [
  { id: "c1", name: "Processors", slug: "processors" },
  { id: "c2", name: "Motherboards", slug: "motherboards" },
  { id: "c3", name: "RAM", slug: "ram" },
  { id: "c4", name: "Storage", slug: "storage" },
  { id: "c5", name: "Graphics Cards", slug: "graphics-cards" },
  { id: "c6", name: "Power Supplies", slug: "power-supplies" },
  { id: "c7", name: "Casings", slug: "casings" },
  { id: "c8", name: "Coolers", slug: "coolers" },
  { id: "c9", name: "Monitors", slug: "monitors" },
  { id: "c10", name: "Accessories", slug: "accessories" },
  { id: "c11", name: "Laptops", slug: "laptops" }
];
let brands: Brand[] = [
  { id: "b1", name: "Intel", slug: "intel" },
  { id: "b2", name: "AMD", slug: "amd" },
  { id: "b3", name: "NVIDIA", slug: "nvidia" },
  { id: "b4", name: "Corsair", slug: "corsair" },
  { id: "b5", name: "ASUS", slug: "asus" },
  { id: "b6", name: "MSI", slug: "msi" },
  { id: "b7", name: "Gigabyte", slug: "gigabyte" },
  { id: "b8", name: "AORUS", slug: "aorus" },
  { id: "b9", name: "ROG", slug: "rog" },
  { id: "b10", name: "Razer", slug: "razer" }
];

let products: Product[] = [];

let coupons: Coupon[] = [];

let offers: Offer[] = [];

let banners: Banner[] = [
  {
    id: "b1",
    title: "Dream PC Build Highlight",
    imageUrl: "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=1400&q=80",
    description: "Ultimate Neon Rig Setup",
    active: true,
    linkUrl: "/builder",
    type: "main"
  },
  {
    id: "b2",
    title: "Next-Gen Thermal Challenge",
    imageUrl: "https://images.unsplash.com/photo-1593640408182-31c70c8268f5?auto=format&fit=crop&w=1400&q=80",
    description: "Extreme Performance Assemblies",
    active: true,
    linkUrl: "/products",
    type: "main"
  },
  {
    id: "b3",
    title: "Top Right Static Promo",
    imageUrl: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80",
    description: "Gaming Peripherals Collection",
    active: true,
    linkUrl: "/products?category=accessories",
    type: "fixed-1"
  },
  {
    id: "b4",
    title: "Bottom Right Static Promo",
    imageUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80",
    description: "Next-Gen Processor Architecture",
    active: true,
    linkUrl: "/products?category=processors",
    type: "fixed-2"
  }
];

let faqs: FAQItem[] = [
  {
    id: "faq_1",
    question: "How long does it take to assemble and ship a custom PC?",
    answer: "Custom PCs are specifically built, meticulously stress-tested, and performance-optimized within 2 to 3 business days. Shipping usually takes an additional 1 to 2 days inside Dhaka, and 3 to 4 days for deliveries outside. Rest assured, we pride ourselves on speed without sacrificing build safety.",
    category: "Shipping",
    order: 1
  },
  {
    id: "faq_2",
    question: "Are all components brand new and covered by official warranties?",
    answer: "Absolutely! At QuantumRig, we only use 100% genuine, factory-sealed components sourced directly from official authorized brand distributors. Every component maintains its full original manufacturer's warranty, which spans anywhere from 1 up to 10 years depending on the specific model and manufacturer.",
    category: "Products",
    order: 2
  },
  {
    id: "faq_3",
    question: "Do you perform stress testing and temperature optimization before shipping?",
    answer: "Yes, standard for every single machine. Each custom build undergoes a rigorous 24-hour diagnostic phase including dedicated processor and GPU stress tests. We tune custom fan speed profiles to sustain low noise levels and cool temperatures inside our deep, sleek enclosures for high-load gaming or production.",
    category: "Services",
    order: 3
  },
  {
    id: "faq_4",
    question: "What shipping protocols do you follow, and is my shipment protected?",
    answer: "We use premium domestic couriers and enforce safe, thick internal expand-wrap foam packaging to securely brace heavy graphic cards and massive air-cooler heatsinks during transit. Every dynamic shipment is fully insured by us, ensuring a seamless replacement policy in the unlikely event of arrival damage.",
    category: "Shipping",
    order: 4
  }
];

let socialLinks: SocialLink[] = [
  { id: "sl1", name: "Facebook", url: "https://facebook.com" },
  { id: "sl2", name: "WhatsApp", url: "https://whatsapp.com" },
  { id: "sl3", name: "Instagram", url: "https://instagram.com" }
];

let orders: Order[] = [];
let sharedBuilds: SharedBuild[] = [];

let settings: Settings = {
  announcementText: "Free shipping on all PC Builds over ৳2000! Use code QUANTUM24",
  facebookUrl: "https://facebook.com",
  whatsappUrl: "https://whatsapp.com",
  instagramUrl: "https://instagram.com"
};

// ================= FIRESTORE SYNC =================
async function syncDatabase() {
  if (!db) return;
  try {
    // 1. Sync Products
    const pSnap = await db.collection("products").get();
    if (!pSnap.empty) {
      products = pSnap.docs.map((d: any) => d.data() as Product);
      
      // Ensure product code is a 5-digit number and has a valid order index
      let dbUpdated = false;
      for (const [index, p] of products.entries()) {
        let changed = false;
        if (p.order === undefined) {
          p.order = index;
          changed = true;
        }
        if (!p.code || p.code.startsWith('p') || p.code.length > 5) {
          p.code = Math.floor(10000 + Math.random() * 90000).toString();
          changed = true;
        }
        if (changed) {
          await db.collection("products").doc(p.id).set(JSON.parse(JSON.stringify(p))).catch(console.error);
          dbUpdated = true;
        }
      }
      products.sort((a, b) => (a.order ?? 99999) - (b.order ?? 99999));
    } else {
      for (const [index, p] of products.entries()) {
        p.order = index;
        await db.collection("products").doc(p.id).set(JSON.parse(JSON.stringify(p)));
      }
    }

    // 2. Sync Categories
    const cSnap = await db.collection("categories").get();
    if (!cSnap.empty) {
      categories = cSnap.docs.map((d: any) => d.data() as Category);
      categories.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    } else {
      for (const [index, c] of categories.entries()) {
        c.order = index;
        await db.collection("categories").doc(c.id).set(JSON.parse(JSON.stringify(c)));
      }
    }

    // 3. Sync Brands
    const bSnap = await db.collection("brands").get();
    if (!bSnap.empty) {
      brands = bSnap.docs.map((d: any) => d.data() as Brand);
      
      let maxId = 0;
      brands.forEach(b => {
        if (/^b\d+$/.test(b.id)) {
          const num = parseInt(b.id.substring(1));
          if (num > maxId && num < 1000000) maxId = num;
        }
      });
      let nextId = maxId + 1;

      for (const b of brands) {
        if (b.id && b.id.length > 5) { // Assuming timestamp ids are long
          const oldId = b.id;
          b.id = `b${nextId}`;
          nextId++;
          await db.collection("brands").doc(b.id).set(JSON.parse(JSON.stringify(b))).catch(console.error);
          await db.collection("brands").doc(oldId).delete().catch(console.error);
        }
      }
    } else {
      for (const b of brands) {
        await db.collection("brands").doc(b.id).set(JSON.parse(JSON.stringify(b)));
      }
    }

    // 4. Sync Users 
    const uSnap = await db.collection("users").get();
    if (!uSnap.empty) {
       // Merge users carefully so we don't overwrite mock memory if there's no auth system.
       const fsUsers = uSnap.docs.map((d: any) => d.data() as User);
       const uMap = new Map();
       users.forEach(u => uMap.set(u.email, u));
       fsUsers.forEach(u => uMap.set(u.email, { ...uMap.get(u.email), ...u }));
       users = Array.from(uMap.values());
    }

    // 5. Sync Orders
    const oSnap = await db.collection("orders").get();
    if (!oSnap.empty) {
      orders = oSnap.docs.map((d: any) => d.data() as Order);
      
      // Clean up any stray mock orders from the DB
      const mockOrdersToDelete = orders.filter(o => o.id && o.id.startsWith("mock_"));
      if (mockOrdersToDelete.length > 0) {
        for (const mo of mockOrdersToDelete) {
          await db.collection("orders").doc(mo.id).delete().catch(console.error);
        }
        orders = orders.filter(o => !o.id || !o.id.startsWith("mock_"));
      }
    } // if empty, do not seed mock orders to avoid bloat

    // 6. Sync Settings
    const setSnap = await db.collection("settings").get();
    if (!setSnap.empty) {
      const globalSet = setSnap.docs.find(d => d.id === 'global');
      if (globalSet) settings = globalSet.data() as Settings;
    } else {
      await db.collection("settings").doc("global").set(JSON.parse(JSON.stringify(settings))).catch(console.error);
    }

    // 7. Sync Coupons
    const cpSnap = await db.collection("coupons").get();
    if (!cpSnap.empty) {
      coupons = cpSnap.docs.map((d: any) => d.data() as Coupon);
    }

    // 8. Sync Offers
    const ofSnap = await db.collection("offers").get();
    if (!ofSnap.empty) {
      offers = ofSnap.docs.map((d: any) => d.data() as Offer);
    }

    // 8b. Sync Banners
    const bnSnap = await db.collection("banners").get();
    if (!bnSnap.empty) {
      banners = bnSnap.docs.map((d: any) => d.data() as Banner);
    }

    // 9. Sync Restock Requests
    const rrSnap = await db.collection("restocks").get();
    if (!rrSnap.empty) {
      restockRequests = rrSnap.docs.map((d: any) => d.data() as RestockRequest);
    }

    // 10. Sync Support Tickets
    const stSnap = await db.collection("support").get();
    if (!stSnap.empty) {
      supportTickets = stSnap.docs.map((d: any) => d.data() as any);
      
      let dbUpdated = false;
      for (const t of supportTickets) {
        if (t.id && t.id.startsWith('st_')) {
          const oldId = t.id;
          t.id = t.id.replace('st_', '');
          await db.collection("support").doc(t.id).set(JSON.parse(JSON.stringify(t))).catch(console.error);
          await db.collection("support").doc(oldId).delete().catch(console.error);
          dbUpdated = true;
        }
      }
    }

    // 11. Sync Social Links
    const slSnap = await db.collection("social_links").get();
    if (!slSnap.empty) {
      socialLinks = slSnap.docs.map((d: any) => d.data() as SocialLink);
    } else {
      for (const sl of socialLinks) {
        await db.collection("social_links").doc(sl.id).set(JSON.parse(JSON.stringify(sl))).catch(console.error);
      }
    }

    // 12. Sync Complaints
    const cmpSnap = await db.collection("complaints").get();
    if (!cmpSnap.empty) {
      complaints = cmpSnap.docs.map((d: any) => d.data() as any);
      
      for (const c of complaints) {
        if (c.id && c.id.startsWith('cmp_')) {
          const oldId = c.id;
          c.id = c.id.replace('cmp_', '');
          await db.collection("complaints").doc(c.id).set(JSON.parse(JSON.stringify(c))).catch(console.error);
          await db.collection("complaints").doc(oldId).delete().catch(console.error);
        }
      }
    }

    // 13. Sync Stock Logs
    const slgsSnap = await db.collection("stock_logs").get();
    if (!slgsSnap.empty) {
      stockLogs = slgsSnap.docs.map((d: any) => d.data() as StockAdjustmentLog);
      stockLogs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    // 14. Sync FAQs
    const faqSnap = await db.collection("faqs").get();
    if (!faqSnap.empty) {
      faqs = faqSnap.docs.map((d: any) => d.data() as FAQItem);
      faqs.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    } else {
      for (const f of faqs) {
        await db.collection("faqs").doc(f.id).set(JSON.parse(JSON.stringify(f))).catch(console.error);
      }
    }

    // 15. Sync Shared Builds
    const sbSnap = await db.collection("shared_builds").get();
    if (!sbSnap.empty) {
      sharedBuilds = sbSnap.docs.map((d: any) => d.data() as SharedBuild);
    }
    
    // 16. Sync Roles
    const rolesSnap = await db.collection("roles").get();
    if (!rolesSnap.empty) {
      roles = rolesSnap.docs.map((d: any) => d.data() as Role);
    }
  } catch (error: any) {
    if (error && error.message && error.message.includes('PERMISSION_DENIED')) return;
    console.warn("Firestore Sync Error (rules may not open yet):", error);
  }
}

const initialSyncPromise = syncDatabase();

// ================= API ROUTES =================

app.use(async (req, res, next) => {
  if (initialSyncPromise) {
    await initialSyncPromise;
  }
  next();
});

// Stripe Payment
let stripeClient: Stripe | null = null;
function getStripe(): Stripe {
  if (!stripeClient) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error('STRIPE_SECRET_KEY environment variable is missing');
    }
    stripeClient = new Stripe(key);
  }
  return stripeClient;
}

app.get("/api/stripe-config", (req, res) => {
  res.json({ 
    publicKey: process.env.VITE_STRIPE_PUBLIC_KEY || process.env.STRIPE_PUBLIC_KEY || 'pk_test_TYooMQauvdEDq54NiTphI7jx' 
  });
});

app.post("/api/create-payment-intent", async (req, res) => {
  try {
    const stripe = getStripe();
    const { amount } = req.body;
    
    // Create a PaymentIntent with the order amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe expects cents, or paisa equivalent
      currency: "usd",
      automatic_payment_methods: {
        enabled: true,
      },
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error: any) {
    console.error("Stripe Error:", error);
    res.status(400).json({ error: error.message });
  }
});

// Update Order Payment Status
app.put("/api/orders/:id/pay", async (req, res) => {
  const { id } = req.params;
  const { paymentIntentId } = req.body;
  const orderIdx = orders.findIndex((o) => o.id === id);
  if (orderIdx !== -1) {
    orders[orderIdx].status = 'Accepted';
    orders[orderIdx].paymentMethod = 'Credit Card (Stripe)';
    orders[orderIdx].transactionId = paymentIntentId;
    if (db) await db.collection("orders").doc(id).set(JSON.parse(JSON.stringify(orders[orderIdx]))).catch(console.error);
    res.json(orders[orderIdx]);
  } else {
    res.status(404).json({ error: "Order not found" });
  }
});

// Users & Auth
app.post("/api/users/me/saved-products", async (req, res) => {
  const token = req.headers.authorization?.replace("Bearer dummy-token-", "");
  const user = users.find((u) => u.id === token);
  if (!user) return res.status(401).json({ error: "Unauthorized" });
  
  if (!user.savedProductIds) user.savedProductIds = [];
  const { productId } = req.body;
  if (!user.savedProductIds.includes(productId)) {
    user.savedProductIds.push(productId);
    if (db) await db.collection("users").doc(user.id).set({ savedProductIds: user.savedProductIds }, { merge: true }).catch(console.error);
  }
  const { password, ...userWithoutPassword } = user;
  res.json(userWithoutPassword);
});

app.delete("/api/users/me/saved-products/:productId", async (req, res) => {
  const token = req.headers.authorization?.replace("Bearer dummy-token-", "");
  const user = users.find((u) => u.id === token);
  if (!user) return res.status(401).json({ error: "Unauthorized" });
  
  if (user.savedProductIds) {
    user.savedProductIds = user.savedProductIds.filter(id => id !== req.params.productId);
    if (db) await db.collection("users").doc(user.id).set({ savedProductIds: user.savedProductIds }, { merge: true }).catch(console.error);
  }
  const { password, ...userWithoutPassword } = user;
  res.json(userWithoutPassword);
});

app.post("/api/users/me/cart", async (req, res) => {
  const token = req.headers.authorization?.replace("Bearer dummy-token-", "");
  const user = users.find((u) => u.id === token);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const { cart } = req.body;
  user.cart = Array.isArray(cart) ? cart : [];
  
  if (db) {
    await db.collection("users").doc(user.id).set({ cart: user.cart }, { merge: true }).catch(console.error);
  }
  
  const { password, ...userWithoutPassword } = user;
  res.json(userWithoutPassword);
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  const user = users.find((u) => u.email === email && u.password === password);
  if (user) {
    user.lastVisited = new Date().toISOString();
    if (db) await db.collection("users").doc(user.id).set({ lastVisited: user.lastVisited }, { merge: true }).catch(console.error);
    const { password, ...userWithoutPassword } = user;
    res.json({ token: `dummy-token-${user.id}`, user: userWithoutPassword });
  } else {
    res.status(401).json({ error: "Invalid credentials" });
  }
});

app.post("/api/auth/register", async (req, res) => {
  const { name, email, password, phone, role } = req.body;
  if (users.find(u => u.email === email)) {
    return res.status(400).json({ error: "Email taken" });
  }
  const newUser: User = { id: `u${Date.now()}`, name, email, password, phone, role: role || "user", savedProductIds: [], createdAt: new Date().toISOString(), lastVisited: new Date().toISOString() };
  if (db) await db.collection("users").doc(newUser.id).set(JSON.parse(JSON.stringify(newUser))).catch(console.error);
  users.push(newUser);
  const { password: _, ...userWithoutPassword } = newUser;
  res.json({ token: `dummy-token-${newUser.id}`, user: userWithoutPassword });
});

app.post("/api/auth/google", async (req, res) => {
  const { email, name, avatar, phone, role } = req.body;
  let user = users.find((u) => u.email === email);
  if (user) {
    if (phone) user.phone = phone;
    if (avatar) user.avatar = avatar;
    if (name) user.name = name;
    if (role) user.role = role;
    user.lastVisited = new Date().toISOString();
    if (db) await db.collection("users").doc(user.id).set({ lastVisited: user.lastVisited }, { merge: true }).catch(console.error);
  } else {
    user = { id: `u${Date.now()}`, name, email, phone, avatar, role: role || "user", savedProductIds: [], createdAt: new Date().toISOString(), lastVisited: new Date().toISOString() };
    if (db) await db.collection("users").doc(user.id).set(JSON.parse(JSON.stringify(user))).catch(console.error);
    users.push(user);
  }
  const { password, ...userWithoutPassword } = user;
  res.json({ token: `dummy-token-${user.id}`, user: userWithoutPassword });
});

app.post("/api/auth/forgot-password", (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }
  // Standard success response for forgot password
  res.json({ success: true, message: "If the email exists, a password reset link has been sent." });
});

app.get("/api/users/me", (req, res) => {
  const token = req.headers.authorization?.replace("Bearer dummy-token-", "");
  const user = users.find((u) => u.id === token);
  if (user) {
     const { password, ...userWithoutPassword } = user;
     // Calculate loyalty points
     const userOrders = orders.filter((o) => o.userId === user.id && o.status !== 'Cancelled');
     const totalSpent = userOrders.reduce((acc, order) => acc + order.totalAmount, 0);
     const loyaltyPoints = Math.floor(totalSpent / 100);
     
     const userTickets = supportTickets.filter(t => t.email === user.email);
     
     res.json({ ...userWithoutPassword, loyaltyPoints, tickets: userTickets });
  } else {
    res.status(401).json({ error: "Unauthorized" });
  }
});

app.put("/api/users/me", (req, res) => {
  const token = req.headers.authorization?.replace("Bearer dummy-token-", "");
  const user = users.find((u) => u.id === token);
  if (user) {
    const { name, phone, password, avatar } = req.body;
    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (avatar !== undefined) user.avatar = avatar;
    if (password) user.password = password; // Only saving in mock memory
    const { password: currentPassword, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } else {
    res.status(401).json({ error: "Unauthorized" });
  }
});

// Roles
app.get("/api/roles", (req, res) => res.json(roles));
app.post("/api/roles", async (req, res) => {
  const role: Role = { id: `role_${Date.now()}`, ...req.body, createdAt: new Date().toISOString() };
  if (db) await db.collection("roles").doc(role.id).set(JSON.parse(JSON.stringify(role))).catch(console.error);
  roles.push(role);
  res.json(role);
});
app.put("/api/roles/:id", async (req, res) => {
  const idx = roles.findIndex(r => r.id === req.params.id);
  if (idx > -1) {
    roles[idx] = { ...roles[idx], ...req.body };
    if (db) await db.collection("roles").doc(roles[idx].id).set(JSON.parse(JSON.stringify(roles[idx]))).catch(console.error);
    res.json(roles[idx]);
  } else res.status(404).json({ error: "Not found" });
});
app.delete("/api/roles/:id", async (req, res) => {
  roles = roles.filter(r => r.id !== req.params.id);
  if (db) await db.collection("roles").doc(req.params.id).delete().catch(console.error);
  // Optional: Also find users with this role and remove or set role='user'
  res.sendStatus(204);
});

// Admin Users Route
app.get("/api/admin/users", (req, res) => {
  const token = req.headers.authorization?.replace("Bearer dummy-token-", "");
  const admin = users.find(u => u.id === token && (u.role === 'admin' || u.role === 'staff'));
  if (!admin) return res.status(401).json({ error: 'Unauthorized' });
  const sanitizedUsers = users.map(u => {
    const { password, ...uSafe } = u;
    return uSafe;
  });
  res.json(sanitizedUsers);
});
app.put("/api/admin/users/:id", async (req, res) => {
  const token = req.headers.authorization?.replace("Bearer dummy-token-", "");
  const admin = users.find(u => u.id === token && (u.role === 'admin' || u.role === 'staff'));
  if (!admin) return res.status(401).json({ error: 'Unauthorized' });

  const idx = users.findIndex(u => u.id === req.params.id);
  if (idx > -1) {
    users[idx] = { ...users[idx], ...req.body };
    if (db) await db.collection("users").doc(users[idx].id).set(JSON.parse(JSON.stringify(users[idx]))).catch(console.error);
    res.json(users[idx]);
  } else {
    res.status(404).json({ error: "Not found" });
  }
});

// Social Links
app.get("/api/social-links", (req, res) => res.json(socialLinks));
app.post("/api/social-links", async (req, res) => {
  const sl: SocialLink = { id: `sl${Date.now()}`, ...req.body };
  if (db) await db.collection("social_links").doc(sl.id).set(JSON.parse(JSON.stringify(sl))).catch(console.error);
  socialLinks.push(sl);
  res.json(sl);
});
app.put("/api/social-links/:id", async (req, res) => {
  const idx = socialLinks.findIndex(sl => sl.id === req.params.id);
  if (idx > -1) {
    socialLinks[idx] = { ...socialLinks[idx], ...req.body };
    if (db) await db.collection("social_links").doc(socialLinks[idx].id).set(JSON.parse(JSON.stringify(socialLinks[idx]))).catch(console.error);
    res.json(socialLinks[idx]);
  } else res.status(404).json({ error: "Not found" });
});
app.delete("/api/social-links/:id", async (req, res) => {
  socialLinks = socialLinks.filter(sl => sl.id !== req.params.id);
  if (db) await db.collection("social_links").doc(req.params.id).delete().catch(console.error);
  res.sendStatus(204);
});

// Settings
app.get("/api/settings", (req, res) => res.json(settings));
app.put("/api/settings", async (req, res) => {
  settings = { ...settings, ...req.body };
  if (db) await db.collection("settings").doc("global").set(JSON.parse(JSON.stringify(settings))).catch(console.error);
  res.json(settings);
});

// Categories
app.get("/api/categories", (req, res) => res.json(categories));
// Note: In a real app we'd save this to a database

app.get("/api/admin/restock-requests", (req, res) => res.json(restockRequests));

app.post("/api/restock-requests", async (req, res) => {
  const token = req.headers.authorization?.replace("Bearer dummy-token-", "");
  const user = users.find((u) => u.id === token);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { productId } = req.body;
  if (!productId) return res.status(400).json({ error: 'Missing productId' });

  const product = products.find((p) => p.id === productId);
  if (!product) return res.status(404).json({ error: 'Product not found' });

  const newReq: RestockRequest = {
    id: `rr_${Date.now()}`,
    userId: user.id,
    userName: user.name,
    userEmail: user.email,
    productId,
    productTitle: product.title,
    status: 'pending',
    createdAt: new Date().toISOString()
  };
  if (db) await db.collection("restocks").doc(newReq.id).set(JSON.parse(JSON.stringify(newReq))).catch(console.error);
  restockRequests.push(newReq);
  res.json(newReq);
});

app.delete("/api/restock-requests/:id", async (req, res) => {
  restockRequests = restockRequests.filter(r => r.id !== req.params.id);
  if (db) await db.collection("restocks").doc(req.params.id).delete().catch(console.error);
  res.sendStatus(204);
});

app.put("/api/admin/restock-requests/:id/accept", async (req, res) => {
  const reqId = req.params.id;
  const idx = restockRequests.findIndex(r => r.id === reqId);
  if (idx === -1) return res.status(404).json({ error: "Not found" });
  
  restockRequests[idx] = { ...restockRequests[idx], status: 'accepted' };
  const updatedReq = restockRequests[idx];
  
  if (db) {
    await db.collection("restocks").doc(reqId).update({ status: 'accepted' }).catch(console.error);
  }
  
  // Admin Notification
  adminNotifications.push({
    id: `notif_${Date.now()}_${Math.random()}`,
    message: `Restock request for ${updatedReq.productTitle} was successfully accepted.`,
    type: 'restock_accepted',
    read: false,
    createdAt: new Date().toISOString()
  });

  // Notify user
  const uIdx = users.findIndex(u => u.id === updatedReq.userId);
  if (uIdx > -1) {
    const notifUser = users[uIdx];
    notifUser.notifications = notifUser.notifications || [];
    notifUser.notifications.push({
      id: `notif_${Date.now()}_${Math.random()}`,
      message: `Your restock request for ${updatedReq.productTitle} has been accepted by the admin. You will be notified when it is available in stock!`,
      link: `/products/${updatedReq.productId}`,
      read: false,
      createdAt: new Date().toISOString()
    });
    if (db) {
      await db.collection("users").doc(notifUser.id).set({ notifications: notifUser.notifications }, { merge: true }).catch(console.error);
    }
  }
  
  res.json(updatedReq);
});

app.post("/api/users/me/price-alerts", async (req, res) => {
  const token = req.headers.authorization?.replace("Bearer dummy-token-", "");
  const user = users.find((u) => u.id === token);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { productId } = req.body;
  if (!productId) return res.status(400).json({ error: 'Missing productId' });

  // In a real app we'd save this to a database, but for now we just return ok
  res.json({ success: true, productId });
});

app.get("/api/users/me/notifications", (req, res) => {
  const token = req.headers.authorization?.replace("Bearer dummy-token-", "");
  const user = users.find((u) => u.id === token);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  res.json(user.notifications || []);
});

app.put("/api/users/me/notifications/:id/read", async (req, res) => {
  const token = req.headers.authorization?.replace("Bearer dummy-token-", "");
  const user = users.find((u) => u.id === token);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  const notif = (user.notifications || []).find((n) => n.id === req.params.id);
  if (notif) {
    notif.read = true;
    if (db) await db.collection("users").doc(user.id).set({ notifications: user.notifications }, { merge: true }).catch(console.error);
  }
  res.json({ success: true });
});

app.post("/api/users/me/request-deletion", async (req, res) => {
  const token = req.headers.authorization?.replace("Bearer dummy-token-", "");
  const user = users.find((u) => u.id === token);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  
  user.deletionRequested = true;
  if (db) await db.collection("users").doc(user.id).set({ deletionRequested: true }, { merge: true }).catch(console.error);
  
  // Notify admin
  adminNotifications.push({
    id: `notif_${Date.now()}_${Math.random()}`,
    message: `User ${user.name} (${user.email}) has requested account deletion.`,
    type: 'deletion_request',
    read: false,
    createdAt: new Date().toISOString()
  });
  
  res.json({ success: true });
});

app.post("/api/admin/users/:id/approve-deletion", async (req, res) => {
  const token = req.headers.authorization?.replace("Bearer dummy-token-", "");
  const admin = users.find((u) => u.id === token && (u.role === 'admin' || u.role === 'staff'));
  if (!admin) return res.status(401).json({ error: 'Unauthorized' });
  
  const userId = req.params.id;
  users = users.filter(u => u.id !== userId);
  
  if (db) await db.collection("users").doc(userId).delete().catch(console.error);
  
  res.json({ success: true });
});

app.post("/api/admin/users/:id/deny-deletion", async (req, res) => {
  const token = req.headers.authorization?.replace("Bearer dummy-token-", "");
  const admin = users.find((u) => u.id === token && (u.role === 'admin' || u.role === 'staff'));
  if (!admin) return res.status(401).json({ error: 'Unauthorized' });
  
  const userId = req.params.id;
  const userToDeny = users.find(u => u.id === userId);
  if (userToDeny) {
    userToDeny.deletionRequested = false;
    userToDeny.notifications = userToDeny.notifications || [];
    userToDeny.notifications.push({
      id: `notif_${Date.now()}_${Math.random()}`,
      message: `Your account deletion request was denied by the administrator.`,
      read: false,
      createdAt: new Date().toISOString()
    });
    
    if (db) {
      await db.collection("users").doc(userId).set({ 
        deletionRequested: false, 
        notifications: userToDeny.notifications 
      }, { merge: true }).catch(console.error);
    }
  }
  
  res.json({ success: true });
});

app.post("/api/notify-stock", (req, res) => {
  const { productId, email } = req.body;
  if (!productId || !email) return res.status(400).json({ error: 'Missing fields' });
  stockNotifications.push({ id: `sn_${Date.now()}`, productId, email, createdAt: new Date().toISOString() });
  res.json({ success: true });
});

app.post("/api/analytics/track", (req, res) => {
  const { event, productId } = req.body;
  analyticsEvents.push({ id: `evt_${Date.now()}`, event, productId, timestamp: new Date().toISOString() });
  res.json({ success: true });
});

app.get("/api/support-tickets", (req, res) => res.json(supportTickets));

app.post("/api/support-tickets", async (req, res) => {
  const { productId, email, question } = req.body;
  if (!productId || !email || !question) return res.status(400).json({ error: 'Missing fields' });
  const ticket = { id: Date.now().toString(), productId, email, question, status: 'Open' as const, createdAt: new Date().toISOString() };
  if (db) await db.collection("support").doc(ticket.id).set(JSON.parse(JSON.stringify(ticket))).catch(console.error);
  supportTickets.push(ticket);
  res.json(ticket);
});

app.put("/api/support-tickets/:id", async (req, res) => {
  const idx = supportTickets.findIndex(t => t.id === req.params.id);
  if (idx !== -1) {
    supportTickets[idx] = { ...supportTickets[idx], ...req.body };
    if (db) await db.collection("support").doc(supportTickets[idx].id).set(JSON.parse(JSON.stringify(supportTickets[idx]))).catch(console.error);
    res.json(supportTickets[idx]);
  } else {
    res.status(404).json({ error: "Not found" });
  }
});

app.delete("/api/support-tickets/:id", async (req, res) => {
  supportTickets = supportTickets.filter(t => t.id !== req.params.id);
  if (db) await db.collection("support").doc(req.params.id).delete().catch(console.error);
  res.sendStatus(204);
});

// Complaints endpoints
app.get("/api/complaints", (req, res) => res.json(complaints));

app.post("/api/complaints", async (req, res) => {
  const { name, email, orderId, category, description } = req.body;
  if (!name || !email || !category || !description) return res.status(400).json({ error: 'Missing fields' });
  const complaint = {
    id: Date.now().toString(),
    name,
    email,
    orderId: orderId || '',
    category,
    description,
    createdAt: new Date().toISOString()
  };
  if (db) await db.collection("complaints").doc(complaint.id).set(JSON.parse(JSON.stringify(complaint))).catch(console.error);
  complaints.push(complaint);
  res.json(complaint);
});

app.delete("/api/complaints/:id", async (req, res) => {
  complaints = complaints.filter(c => c.id !== req.params.id);
  if (db) await db.collection("complaints").doc(req.params.id).delete().catch(console.error);
  res.sendStatus(204);
});

app.post("/api/categories", async (req, res) => {
  const c: Category = { id: `c${Date.now()}`, ...req.body };
  if (db) await db.collection("categories").doc(c.id).set(JSON.parse(JSON.stringify(c))).catch(console.error);
  categories.push(c);
  res.json(c);
});
app.put("/api/categories/:id", async (req, res) => {
  const idx = categories.findIndex(c => c.id === req.params.id);
  if (idx > -1) {
    categories[idx] = { ...categories[idx], ...req.body };
    if (db) await db.collection("categories").doc(categories[idx].id).set(JSON.parse(JSON.stringify(categories[idx]))).catch(console.error);
    res.json(categories[idx]);
  } else res.status(404).json({ error: "Not found" });
});
app.delete("/api/categories/:id", async (req, res) => {
  categories = categories.filter(c => c.id !== req.params.id);
  if (db) await db.collection("categories").doc(req.params.id).delete().catch(console.error);
  res.sendStatus(204);
});

app.post("/api/categories/reorder", async (req, res) => {
  const { reorderedCategories } = req.body;
  if (Array.isArray(reorderedCategories)) {
    reorderedCategories.forEach((rc, i) => {
      const idx = categories.findIndex(c => c.id === rc.id);
      if (idx > -1) {
        categories[idx].order = i;
        if (db) db.collection("categories").doc(categories[idx].id).update({ order: i }).catch(console.error);
      }
    });
    categories.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    res.json(categories);
  } else {
    res.status(400).json({ error: "Invalid data" });
  }
});

// Brands
app.get("/api/brands", (req, res) => res.json(brands));
app.post("/api/brands", async (req, res) => {
  let maxId = 0;
  brands.forEach(b => {
    if (/^b\d+$/.test(b.id)) {
      const num = parseInt(b.id.substring(1));
      if (num > maxId) maxId = num;
    }
  });
  const nextId = maxId + 1;
  const b: Brand = { id: `b${nextId}`, ...req.body };
  if (db) await db.collection("brands").doc(b.id).set(JSON.parse(JSON.stringify(b))).catch(console.error);
  brands.push(b);
  res.json(b);
});
app.put("/api/brands/:id", async (req, res) => {
  const idx = brands.findIndex(b => b.id === req.params.id);
  if (idx > -1) {
    brands[idx] = { ...brands[idx], ...req.body };
    if (db) await db.collection("brands").doc(brands[idx].id).set(JSON.parse(JSON.stringify(brands[idx]))).catch(console.error);
    res.json(brands[idx]);
  } else res.status(404).json({ error: "Not found" });
});
app.delete("/api/brands/:id", async (req, res) => {
  brands = brands.filter(b => b.id !== req.params.id);
  if (db) await db.collection("brands").doc(req.params.id).delete().catch(console.error);
  res.sendStatus(204);
});

app.delete("/api/internal/clear-all", async (req, res) => {
  products = [];
  try {
    if (db) {
      const snap = await db.collection("products").get();
      const promises = snap.docs.map(d => d.ref.delete());
      await Promise.all(promises);
    }
    res.sendStatus(204);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Image Upload
app.post("/api/upload", async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) {
      return res.status(400).json({ error: "No image provided" });
    }
    
    // Process base64
    const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      // It might already be a URL if it was uploaded before
      if (image.startsWith('http')) {
        return res.json({ url: image });
      }
      return res.status(400).json({ error: "Invalid base64 string" });
    }
    
    if (!db) {
       // If no Firebase admin initialized (local fallback), just return the base64 or a dummy
       return res.json({ url: image }); 
    }
    
    const mimeType = matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');
    
    const extMatch = mimeType.split('/')[1];
    const ext = extMatch ? extMatch.replace('jpeg', 'jpg') : 'jpg';
    const fileName = `uploads/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${ext}`;
    
    let downloadUrl = image;
    try {
      const bucket = getStorage().bucket(process.env.VITE_FIREBASE_STORAGE_BUCKET || "emonxyz-48285.appspot.com");
      const file = bucket.file(fileName);
      
      await file.save(buffer, {
        metadata: { contentType: mimeType },
      });

      try {
        await file.makePublic();
      } catch(e) {
        // Ignored
      }
      downloadUrl = `https://storage.googleapis.com/${bucket.name}/${file.name}`;
    } catch (uploadObjError: any) {
      console.warn("Firebase storage failed, falling back to base64 string.", uploadObjError.message);
    }

    res.json({ url: downloadUrl });
  } catch (error: any) {
    console.error("Upload error:", error);
    res.status(500).json({ error: error.message || "Failed to upload image" });
  }
});

// Products
app.get("/api/admin/products/search", (req, res) => {
  const q = (req.query.q as string || "").toLowerCase();
  let results = products;
  if (q) {
    results = products.filter(p => 
      p.title.toLowerCase().includes(q) || 
      (p.code && p.code.toLowerCase().includes(q))
    );
  }
  res.json(results);
});

app.get("/api/products/paginated", (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 12;
  
  const category = req.query.category as string;
  const search = (req.query.search as string || "").toLowerCase();
  const brands = req.query.brands as string;
  const stockFilter = req.query.stockFilter as string;
  const minPrice = req.query.minPrice ? Number(req.query.minPrice) : null;
  const maxPrice = req.query.maxPrice ? Number(req.query.maxPrice) : null;
  const sortBy = req.query.sortBy as string;
  const builderCpuId = req.query.builderCpuId as string;
  const builderMotherboardId = req.query.builderMotherboardId as string;
  const builderRamId = req.query.builderRamId as string;

  let filtered = [...products];

  if (category) {
    filtered = filtered.filter(p => p.categoryId === category);
  }

  // Builder Compatibility Engine
  if (category && (builderCpuId || builderMotherboardId || builderRamId)) {
    let requiredSocket: string | undefined;
    let requiredRam: string | undefined;

    const builderCpu = products.find(p => p.id === builderCpuId);
    const builderMob = products.find(p => p.id === builderMotherboardId);
    const builderRam = products.find(p => p.id === builderRamId);

    if (builderCpu) {
      requiredSocket = builderCpu.socket || builderCpu.specs?.["Socket"];
    }
    if (builderMob) {
      if (!requiredSocket) requiredSocket = builderMob.socket || builderMob.specs?.["Socket"];
      
      const mobRamRaw = builderMob.specs?.["Memory Type"] || builderMob.specs?.["RAM Type"] || builderMob.specs?.["Supported Memory"] || "";
      if (mobRamRaw.toUpperCase().includes("DDR5")) requiredRam = "DDR5";
      else if (mobRamRaw.toUpperCase().includes("DDR4")) requiredRam = "DDR4";
    }
    if (!requiredRam && builderRam) {
      const ramTypeRaw = builderRam.specs?.["Type"] || builderRam.specs?.["Memory Type"] || builderRam.title || "";
      if (ramTypeRaw.toUpperCase().includes("DDR5")) requiredRam = "DDR5";
      else if (ramTypeRaw.toUpperCase().includes("DDR4")) requiredRam = "DDR4";
    }

    if (requiredSocket && (category === "c1" || category === "c2")) {
      const cleanSocket = requiredSocket.toLowerCase().replace(/[^a-z0-9]/g, '');
      filtered = filtered.filter(p => {
        const pSocket = p.socket || p.specs?.["Socket"] || "";
        if (!pSocket) return false;
        const cleanPSocket = pSocket.toLowerCase().replace(/[^a-z0-9]/g, '');
        return cleanPSocket.includes(cleanSocket) || cleanSocket.includes(cleanPSocket);
      });
    }

    if (requiredRam && (category === "c2" || category === "c3")) {
      filtered = filtered.filter(p => {
        let pRam = "";
        if (category === "c2") pRam = p.specs?.["Memory Type"] || p.specs?.["RAM Type"] || p.specs?.["Supported Memory"] || "";
        if (category === "c3") pRam = p.specs?.["Type"] || p.specs?.["Memory Type"] || p.title || "";
        return pRam.toUpperCase().includes(requiredRam!);
      });
    }
  }

  if (search) {
    filtered = filtered.filter(p => 
      (p.title || '').toLowerCase().includes(search) || 
      (p.description || '').toLowerCase().includes(search) || 
      (p.brand || '').toLowerCase().includes(search) ||
      (p.code || '').toLowerCase().includes(search)
    );
  }

  // Calculate available brands before applying stock and explicit brand filters
  const allBrands = Array.from(new Set(
    filtered.filter(p => p.stockStatus !== 'Out of Stock' && p.inventoryCount !== 0).map(p => p.brand).filter(Boolean) as string[]
  )).sort();

  if (stockFilter === 'in-stock') {
    filtered = filtered.filter(p => p.stockStatus === 'In Stock');
  } else if (stockFilter === 'out-of-stock') {
    filtered = filtered.filter(p => p.stockStatus === 'Out of Stock');
  }

  // Calculate min and max price limits before applying price filtering
  const prices = filtered.map(p => p.price).filter(p => !isNaN(p));
  const minPriceLimit = prices.length > 0 ? Math.floor(Math.min(...prices)) : 0;
  const maxPriceLimit = prices.length > 0 ? Math.ceil(Math.max(...prices)) : 100000;

  if (minPrice !== null && !isNaN(minPrice)) {
    filtered = filtered.filter(p => p.price >= minPrice);
  }
  if (maxPrice !== null && !isNaN(maxPrice)) {
    filtered = filtered.filter(p => p.price <= maxPrice);
  }

  if (brands) {
    const brandList = brands.split(',');
    filtered = filtered.filter(p => p.brand && brandList.includes(p.brand));
  }

  if (sortBy === 'price-asc') {
    filtered.sort((a, b) => a.price - b.price);
  } else if (sortBy === 'price-desc') {
    filtered.sort((a, b) => b.price - a.price);
  } else if (sortBy === 'name-asc') {
    filtered.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
  } else if (sortBy === 'name-desc') {
    filtered.sort((a, b) => (b.title || "").localeCompare(a.title || ""));
  } else if (sortBy === 'newest') {
    filtered.reverse(); // Simple reverse to simulate newest since we don't have insertion timestamps
  }

  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;

  res.json({
    data: filtered.slice(startIndex, endIndex),
    total: filtered.length,
    page,
    limit,
    totalPages: Math.ceil(filtered.length / limit),
    allBrands,
    minPriceLimit,
    maxPriceLimit
  });
});

app.get("/api/products", (req, res) => {
  const page = parseInt(req.query.page as string);
  const limit = parseInt(req.query.limit as string);

  if (page && limit) {
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    res.json({
      data: products.slice(startIndex, endIndex),
      total: products.length,
      page,
      limit,
      totalPages: Math.ceil(products.length / limit)
    });
  } else {
    res.json(products);
  }
});

app.post("/api/products/reorder", async (req, res) => {
  const { reorderedProducts } = req.body;
  if (Array.isArray(reorderedProducts)) {
    reorderedProducts.forEach((rp, i) => {
      const idx = products.findIndex(p => p.id === rp.id);
      if (idx > -1) {
        products[idx].order = i;
        if (db) db.collection("products").doc(products[idx].id).update({ order: i }).catch(console.error);
      }
    });
    products.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    res.json(products);
  } else {
    res.status(400).json({ error: "Invalid data" });
  }
});

app.post("/api/products/bulk", async (req, res) => {
  const token = req.headers.authorization?.replace("Bearer dummy-token-", "");
  const admin = users.find(u => u.id === token && (u.role === 'admin' || u.role === 'staff'));
  if (!admin) return res.status(401).json({ error: 'Unauthorized' });

  const { products: bulkProducts } = req.body;
  if (!Array.isArray(bulkProducts)) return res.status(400).json({ error: "Invalid data format" });

  const updatedProducts = [];
  
  for (const item of bulkProducts) {
    if (item.id && products.some(p => p.id === item.id)) {
       // Update existing
       const idx = products.findIndex(p => p.id === item.id);
       products[idx] = { ...products[idx], ...item };
       const safeP = JSON.parse(JSON.stringify(products[idx]));
       if (db) await db.collection("products").doc(products[idx].id).set(safeP).catch(console.error);
       updatedProducts.push(products[idx]);
    } else {
       // Create new
       let code = item.code || item.id;
       if (!code) {
         let attempts = 0;
         while (attempts < 100) {
           const randId = Math.floor(10000 + Math.random() * 90000).toString();
           if (!products.some(p => p.code === randId || p.id === randId)) {
             code = randId;
             break;
           }
           attempts++;
         }
       }
       const p: Product = { ...item, id: code, code, order: item.order !== undefined ? item.order : products.length };
       const safeP = JSON.parse(JSON.stringify(p));
       if (db) await db.collection("products").doc(p.id).set(safeP).catch(console.error);
       products.push(p);
       updatedProducts.push(p);
    }
  }

  res.json({ message: "Bulk operation successful", successCount: updatedProducts.length });
});

app.post("/api/products", async (req, res) => {
  let code = req.body.code;
  if (!code) {
    let attempts = 0;
    while (attempts < 100) {
      const randId = Math.floor(10000 + Math.random() * 90000).toString();
      if (!products.some(p => p.code === randId || p.id === randId)) {
        code = randId;
        break;
      }
      attempts++;
    }
  }
  const p: Product = { ...req.body, id: code, code, order: req.body.order !== undefined ? req.body.order : products.length };
  const safeP = JSON.parse(JSON.stringify(p));
  if (db) await db.collection("products").doc(p.id).set(safeP).catch(console.error);
  products.push(p);
  res.json(p);
});
app.put("/api/products/:id", async (req, res) => {
  const idx = products.findIndex(p => p.id === req.params.id);
  if (idx > -1) {
    const oldProduct = products[idx];
    let code = req.body.code || products[idx].code;
    
    if (!code) {
      let attempts = 0;
      while (attempts < 100) {
        const randId = Math.floor(10000 + Math.random() * 90000).toString();
        if (!products.some((p, i) => i !== idx && p.code === randId)) {
          code = randId;
          break;
        }
        attempts++;
      }
    }
    const newProduct = { ...oldProduct, ...req.body, id: code, code };
    products[idx] = newProduct;
    const safeProduct = JSON.parse(JSON.stringify(newProduct));
    if (db) {
      if (oldProduct.id !== newProduct.id) {
        await db.collection("products").doc(oldProduct.id).delete().catch(console.error);
      }
      await db.collection("products").doc(newProduct.id).set(safeProduct).catch(console.error);
    }

    const oldInventory = oldProduct.inventoryCount || 0;
    const newInventory = newProduct.inventoryCount || 0;
    if (oldInventory !== newInventory) {
      const token = req.headers.authorization?.replace("Bearer dummy-token-", "");
      const user = users.find((u) => u.id === token);
      const userEmail = user?.email || "admin@quantumrig.tech";
      const userName = user?.name || "Administrator";
      const amountChanged = newInventory - oldInventory;
      
      const adjustmentLog: StockAdjustmentLog = {
        id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        productId: newProduct.id,
        productTitle: newProduct.title,
        productSlug: newProduct.slug,
        userEmail,
        userName,
        amountChanged,
        newQuantity: newInventory,
        createdAt: new Date().toISOString()
      };
      
      stockLogs.unshift(adjustmentLog);
      if (db) {
        await db.collection("stock_logs").doc(adjustmentLog.id).set(JSON.parse(JSON.stringify(adjustmentLog))).catch(console.error);
      }
    }
    
    if (
      (oldProduct.stockStatus === 'Out of Stock' || oldProduct.inventoryCount === 0) &&
      (newProduct.stockStatus !== 'Out of Stock' && newProduct.inventoryCount !== undefined && newProduct.inventoryCount > 0)
    ) {
      // Admin Notification
      adminNotifications.push({
        id: `admin_notif_${Date.now()}_${Math.random()}`,
        message: `Inventory updated for ${newProduct.title} (Stock: ${newProduct.inventoryCount}).`,
        type: 'inventory_updated',
        read: false,
        createdAt: new Date().toISOString()
      });

      for (let i = 0; i < restockRequests.length; i++) {
        let r = restockRequests[i];
        if (r.productId === newProduct.id && (r.status === 'pending' || r.status === 'accepted')) {
          const uIdx = users.findIndex(u => u.id === r.userId);
          if (uIdx > -1) {
            users[uIdx].notifications = users[uIdx].notifications || [];
            users[uIdx].notifications.push({
              id: `notif_${Date.now()}_${Math.random()}`,
              message: `${newProduct.title} is now back in stock! Get it before it's gone!`,
              link: `/products/${newProduct.id}`,
              read: false,
              createdAt: new Date().toISOString()
            });
            if (db) await db.collection("users").doc(users[uIdx].id).set({ notifications: users[uIdx].notifications }, { merge: true }).catch(console.error);
          }
          restockRequests[i] = { ...r, status: 'fulfilled' };
          if (db) await db.collection("restocks").doc(r.id).update({ status: 'fulfilled' }).catch(console.error);
        }
      }
    }

    res.json(products[idx]);
  } else res.status(404).json({ error: "Not found" });
});
app.delete("/api/products/:id", async (req, res) => {
  products = products.filter(p => p.id !== req.params.id);
  if (db) await db.collection("products").doc(req.params.id).delete().catch(console.error);
  res.sendStatus(204);
});

app.get("/api/products/:id", (req, res) => {
  const p = products.find(p => p.id === req.params.id);
  if (p) res.json(p);
  else res.status(404).json({ error: "Not found" });
});

app.post("/api/products/:id/reviews", async (req, res) => {
  const token = req.headers.authorization?.replace("Bearer dummy-token-", "");
  const user = users.find((u) => u.id === token);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const idx = products.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Not found" });

  const review = {
    id: `rev${Date.now()}`,
    userId: user.id,
    userName: user.name,
    rating: req.body.rating,
    comment: req.body.comment,
    createdAt: new Date().toISOString()
  };

  products[idx].reviews = products[idx].reviews || [];
  products[idx].reviews.push(review);
  if (db) await db.collection("products").doc(products[idx].id).set(JSON.parse(JSON.stringify(products[idx]))).catch(console.error);

  res.json(review);
});

app.delete("/api/products/:id/reviews/:reviewId", async (req, res) => {
  const token = req.headers.authorization?.replace("Bearer dummy-token-", "");
  const user = users.find((u) => u.id === token);
  if (!user || user.role !== 'admin') return res.status(401).json({ error: "Unauthorized" });

  const idx = products.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Not found" });

  if (products[idx].reviews) {
    products[idx].reviews = products[idx].reviews.filter(r => r.id !== req.params.reviewId);
    if (db) await db.collection("products").doc(products[idx].id).set(JSON.parse(JSON.stringify(products[idx]))).catch(console.error);
  }

  res.sendStatus(204);
});

// Offers
app.get("/api/offers", (req, res) => res.json(offers));
app.post("/api/offers", async (req, res) => {
  const o: Offer = { id: `of${Date.now()}`, ...req.body };
  if (db) await db.collection("offers").doc(o.id).set(JSON.parse(JSON.stringify(o))).catch(console.error);
  offers.push(o);
  res.json(o);
});
app.put("/api/offers/:id", async (req, res) => {
  const idx = offers.findIndex(o => o.id === req.params.id);
  if (idx > -1) {
    offers[idx] = { ...offers[idx], ...req.body };
    if (db) await db.collection("offers").doc(offers[idx].id).set(JSON.parse(JSON.stringify(offers[idx]))).catch(console.error);
    res.json(offers[idx]);
  } else res.status(404).json({ error: "Not found" });
});
app.delete("/api/offers/:id", async (req, res) => {
  offers = offers.filter(o => o.id !== req.params.id);
  if (db) await db.collection("offers").doc(req.params.id).delete().catch(console.error);
  res.sendStatus(204);
});

// Banners
app.get("/api/banners", (req, res) => res.json(banners));
app.post("/api/banners", async (req, res) => {
  const b: Banner = { id: `ban${Date.now()}`, ...req.body };
  if (db) await db.collection("banners").doc(b.id).set(JSON.parse(JSON.stringify(b))).catch(console.error);
  banners.push(b);
  res.json(b);
});
app.put("/api/banners/:id", async (req, res) => {
  const idx = banners.findIndex(b => b.id === req.params.id);
  if (idx > -1) {
    banners[idx] = { ...banners[idx], ...req.body };
    if (db) await db.collection("banners").doc(banners[idx].id).set(JSON.parse(JSON.stringify(banners[idx]))).catch(console.error);
    res.json(banners[idx]);
  } else res.status(404).json({ error: "Not found" });
});
app.delete("/api/banners/:id", async (req, res) => {
  banners = banners.filter(b => b.id !== req.params.id);
  if (db) await db.collection("banners").doc(req.params.id).delete().catch(console.error);
  res.sendStatus(204);
});

// Coupons
app.get("/api/coupons", (req, res) => res.json(coupons));
app.post("/api/coupons", async (req, res) => {
  const c: Coupon = { id: `cp${Date.now()}`, ...req.body };
  if (db) await db.collection("coupons").doc(c.id).set(JSON.parse(JSON.stringify(c))).catch(console.error);
  coupons.push(c);
  res.json(c);
});
app.put("/api/coupons/:id", async (req, res) => {
  const idx = coupons.findIndex(c => c.id === req.params.id);
  if (idx > -1) {
    coupons[idx] = { ...coupons[idx], ...req.body };
    if (db) await db.collection("coupons").doc(coupons[idx].id).set(JSON.parse(JSON.stringify(coupons[idx]))).catch(console.error);
    res.json(coupons[idx]);
  } else res.status(404).json({ error: "Not found" });
});
app.delete("/api/coupons/:id", async (req, res) => {
  coupons = coupons.filter(c => c.id !== req.params.id);
  if (db) await db.collection("coupons").doc(req.params.id).delete().catch(console.error);
  res.sendStatus(204);
});

// FAQs
app.get("/api/faqs", (req, res) => res.json(faqs));
app.post("/api/faqs", async (req, res) => {
  const f: FAQItem = { id: `faq_${Date.now()}`, ...req.body };
  if (db) await db.collection("faqs").doc(f.id).set(JSON.parse(JSON.stringify(f))).catch(console.error);
  faqs.push(f);
  faqs.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  res.json(f);
});
app.put("/api/faqs/:id", async (req, res) => {
  const idx = faqs.findIndex(f => f.id === req.params.id);
  if (idx > -1) {
    faqs[idx] = { ...faqs[idx], ...req.body };
    if (db) await db.collection("faqs").doc(faqs[idx].id).set(JSON.parse(JSON.stringify(faqs[idx]))).catch(console.error);
    faqs.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    res.json(faqs[idx]);
  } else res.status(404).json({ error: "Not found" });
});
app.delete("/api/faqs/:id", async (req, res) => {
  faqs = faqs.filter(f => f.id !== req.params.id);
  if (db) await db.collection("faqs").doc(req.params.id).delete().catch(console.error);
  res.sendStatus(204);
});
app.get("/api/coupons/validate/:code", (req, res) => {
  const code = req.params.code;
  const coupon = coupons.find(c => c.code.toLowerCase() === code.toLowerCase() && c.isActive);
  if (coupon) {
    res.json(coupon);
  } else {
    res.status(404).json({ error: "Invalid or inactive coupon" });
  }
});

// Orders
app.get("/api/orders", (req, res) => {
  const page = parseInt(req.query.page as string);
  const limit = parseInt(req.query.limit as string);

  if (page && limit) {
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    res.json({
      data: orders.slice(startIndex, endIndex),
      total: orders.length,
      page,
      limit,
      totalPages: Math.ceil(orders.length / limit)
    });
  } else {
    res.json(orders);
  }
});

app.delete("/api/orders/:id", async (req, res) => {
  orders = orders.filter(o => o.id !== req.params.id);
  if (db) await db.collection("orders").doc(req.params.id).delete().catch(console.error);
  res.sendStatus(204);
});

app.get("/api/orders/user", (req, res) => {
  const token = req.headers.authorization?.replace("Bearer dummy-token-", "") || "guest";
  const userOrders = orders.filter(o => o.userId === token);
  
  const page = parseInt(req.query.page as string);
  const limit = parseInt(req.query.limit as string);

  if (page && limit) {
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    res.json({
      data: userOrders.slice(startIndex, endIndex),
      total: userOrders.length,
      page,
      limit,
      totalPages: Math.ceil(userOrders.length / limit)
    });
  } else {
    res.json(userOrders);
  }
});
app.post("/api/orders", async (req, res) => {
  const token = req.headers.authorization?.replace("Bearer dummy-token-", "");
  const paymentMethod = req.body.paymentMethod || 'Cash on Delivery';
  
  let orderId = Math.floor(100000 + Math.random() * 900000).toString();
  while (orders.some(o => o.id === orderId)) {
    orderId = Math.floor(100000 + Math.random() * 900000).toString();
  }

  const order: Order = {
    id: orderId,
    userId: token || "guest",
    items: req.body.items,
    totalAmount: req.body.totalAmount,
    couponCode: req.body.couponCode,
    discountAmount: req.body.discountAmount,
    status: "Pending",
    deliveryDetails: req.body.deliveryDetails,
    paymentMethod,
    transactionId: req.body.transactionId,
    paymentStatus: paymentMethod === 'Manual Payment' ? 'Pending' : undefined,
    trackingHistory: [
      {
        status: "Pending",
        date: new Date().toISOString(),
        description: "Order placed successfully. Awaiting confirmation."
      }
    ],
    createdAt: new Date().toISOString()
  };
  
  // Decrease product stock and save back to database
  if (req.body.items && Array.isArray(req.body.items)) {
    for (const item of req.body.items) {
      const pIdx = products.findIndex(p => p.id === item.productId);
      if (pIdx > -1) {
        const prod = products[pIdx];
        if (prod.inventoryCount !== undefined) {
          prod.inventoryCount = Math.max(0, prod.inventoryCount - (item.quantity || 1));
          if (prod.inventoryCount === 0) {
            prod.stockStatus = 'Out of Stock';
          }
        }
        if (db) {
          await db.collection("products").doc(prod.id).set(JSON.parse(JSON.stringify(prod))).catch(console.error);
        }
      }
    }
  }

  // Remove undefined fields to prevent Firestore errors
  const safeOrder = JSON.parse(JSON.stringify(order));
  
  if (db) await db.collection("orders").doc(order.id).set(safeOrder).catch(console.error);
  orders.push(order);
  res.json(order);
});
app.put("/api/orders/:id/status", async (req, res) => {
  const idx = orders.findIndex(o => o.id === req.params.id);
  if (idx > -1) {
    orders[idx].status = req.body.status;
    if (req.body.courierName) orders[idx].courierName = req.body.courierName;
    if (req.body.trackingNumber) orders[idx].trackingNumber = req.body.trackingNumber;
    
    // Append to tracking history
    const descriptions: Record<string, string> = {
      "Accepted": "Order has been accepted and is being processed.",
      "Shipped": req.body.trackingNumber ? `Order has been dispatched via ${req.body.courierName || 'Courier'}. Tracking: ${req.body.trackingNumber}` : "Order has been dispatched and is on its way.",
      "Delivered": "Order has been delivered successfully.",
      "Cancelled": "Order has been cancelled."
    };
    
    orders[idx].trackingHistory = orders[idx].trackingHistory || [];
    orders[idx].trackingHistory.push({
      status: req.body.status,
      date: new Date().toISOString(),
      description: descriptions[req.body.status] || "Order status updated."
    });

    const updateData: any = { 
       status: req.body.status, 
       trackingHistory: orders[idx].trackingHistory 
    };
    if (req.body.courierName) updateData.courierName = req.body.courierName;
    if (req.body.trackingNumber) updateData.trackingNumber = req.body.trackingNumber;

    if (db) await db.collection("orders").doc(req.params.id).update(updateData).catch(console.error);
    res.json(orders[idx]);
  } else res.status(404).json({ error: "Not found" });
});

app.put("/api/orders/:id/paymentStatus", async (req, res) => {
  const idx = orders.findIndex(o => o.id === req.params.id);
  if (idx > -1) {
    orders[idx].paymentStatus = req.body.paymentStatus;
    if (db) await db.collection("orders").doc(req.params.id).update({ paymentStatus: req.body.paymentStatus }).catch(console.error);
    res.json(orders[idx]);
  } else res.status(404).json({ error: "Not found" });
});

app.get("/api/public/orders/:id", (req, res) => {
  const o = orders.find(o => o.id === req.params.id);
  // We explicitly strip out PII (like shipping address if any) to protect guest lookup, 
  // but we can return status, trackingHistory, items briefly
  if (o) {
    res.json({
      id: o.id,
      status: o.status,
      trackingHistory: o.trackingHistory,
      totalAmount: o.totalAmount,
      items: o.items.map(i => ({ title: i.title, quantity: i.quantity, price: i.price })),
      createdAt: o.createdAt
    });
  } else {
    res.status(404).json({ error: "Not found" });
  }
});


// Analytics
app.get("/api/admin/stock-logs", (req, res) => {
  const token = req.headers.authorization?.replace("Bearer dummy-token-", "");
  const admin = users.find((u) => u.id === token && (u.role === 'admin' || u.role === 'staff'));
  if (!admin) return res.status(401).json({ error: "Unauthorized" });
  res.json(stockLogs);
});

app.get("/api/admin/notifications", (req, res) => {
  res.json(adminNotifications);
});

app.put("/api/admin/notifications/:id/read", (req, res) => {
  const notif = adminNotifications.find(n => n.id === req.params.id);
  if (notif) {
    notif.read = true;
    res.json({ success: true });
  } else {
    res.status(404).json({ error: "Not found" });
  }
});

app.get("/api/admin/users", (req, res) => {
  res.json(users.map(u => ({
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    role: u.role,
    deletionRequested: u.deletionRequested
  })));
});

app.get("/api/admin/users/:id", (req, res) => {
  const user = users.find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: "User not found" });
  
  const userOrders = orders.filter(o => o.userId === user.id);
  const userComplaints = complaints.filter(c => c.email === user.email);
  const userTickets = supportTickets.filter(t => t.email === user.email);
  
  res.json({
    ...user,
    orders: userOrders,
    complaints: userComplaints,
    tickets: userTickets
  });
});

app.post("/api/admin/users/bulk-delete", (req, res) => {
    const { userIds } = req.body;
    if (Array.isArray(userIds)) {
        users = users.filter(u => !userIds.includes(u.id));
        res.json({ success: true });
    } else {
        res.status(400).json({ error: "Invalid request" });
    }
});

app.get("/api/admin/analytics", (req, res) => {
  const validOrders = orders.filter(o => o.status !== 'Cancelled');
  const totalRevenue = validOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  
  const orderBreakdown = {
    Pending: orders.filter(o => o.status === 'Pending').length,
    Verified: orders.filter(o => o.status === 'Accepted').length, 
    Delivered: orders.filter(o => o.status === 'Delivered').length,
    Shipped: orders.filter(o => o.status === 'Shipped').length
  };

  const productSales: Record<string, {title: string, count: number}> = {};
  validOrders.forEach(o => {
    o.items.forEach(item => {
      if (!productSales[item.productId]) {
        productSales[item.productId] = { title: item.title, count: 0 };
      }
      productSales[item.productId].count += item.quantity;
    });
  });

  const topProducts = Object.values(productSales)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const last7Days = Array.from({length: 7}).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    return { fullDate: d, dateStr: d.toISOString().split('T')[0] };
  }).reverse();

  const salesData = last7Days.map(({ fullDate, dateStr }) => {
    const dailyRevenue = validOrders
      .filter(o => {
        // Need to check if createdAt falls on this day in UTC or local, simplified by slicing
        return o.createdAt.startsWith(dateStr);
      })
      .reduce((sum, o) => sum + o.totalAmount, 0);
      
    // Format as MM/DD
    const displayMonth = fullDate.getMonth() + 1;
    const displayDay = fullDate.getDate();
    return { name: `${displayMonth}/${displayDay}`, revenue: dailyRevenue };
  });

  res.json({
    totalRevenue,
    totalOrders: orders.length,
    totalUsers: users.length,
    totalProducts: products.length,
    orderBreakdown,
    topProducts,
    salesData
  });
});

// Shared Builds
app.post("/api/shared-builds", async (req, res) => {
  const { items, totalPrice, totalWattage } = req.body;
  if (!items) {
    return res.status(400).json({ error: "Build items missing" });
  }

  const id = Math.floor(10000 + Math.random() * 90000).toString();
  const build: SharedBuild = {
    id,
    items,
    totalPrice: totalPrice || 0,
    totalWattage: totalWattage || 0,
    createdAt: new Date().toISOString()
  };

  sharedBuilds.push(build);
  if (db) await db.collection("shared_builds").doc(id).set(JSON.parse(JSON.stringify(build))).catch(console.error);
  
  res.json(build);
});

app.get("/api/shared-builds/:id", (req, res) => {
  const build = sharedBuilds.find(b => b.id === req.params.id);
  if (build) {
    res.json(build);
  } else {
    res.status(404).json({ error: "Shared build not found" });
  }
});

// Vite & Static file serving
async function startServer() {
  // Do not run vite middleware or static serving in Netlify Serverless environment
  if (process.env.NETLIFY || process.env.NETLIFY_LOCAL) {
    return;
  }

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  if (!process.env.NETLIFY && !process.env.NETLIFY_LOCAL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }
}

startServer();

// For Netlify Functions
import serverless from 'serverless-http';

export const handler = async (event: any, context: any) => {
  // Netlify sometimes sets the path to /.netlify/functions/server/...
  // We want to make sure Express receives the correct /api/... path
  if (event.path && event.path.includes('/api/')) {
    event.path = '/api/' + event.path.split('/api/')[1];
  } else if (event.path && !event.path.startsWith('/api')) {
    event.path = '/api' + event.path;
  }
  
  const serverlessHandler = serverless(app);
  return serverlessHandler(event, context);
};

export default app;
