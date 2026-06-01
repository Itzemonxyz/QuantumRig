import express from "express";
import path from "path";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import { User, Category, Brand, Product, Order, Settings, Coupon, Offer, RestockRequest, UserNotification } from "./src/types";

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// IN-MEMORY DATABASE
let stockNotifications: { id: string; productId: string; email: string; createdAt: string }[] = [];
let supportTickets: { id: string; productId: string; email: string; question: string; status: 'Open' | 'Closed'; createdAt: string }[] = [];
let analyticsEvents: { id: string; event: string; productId: string; timestamp: string }[] = [];
let restockRequests: RestockRequest[] = [];
let users: User[] = [
  { id: "u1", name: "Admin", email: "admin@quantumrig.tech", password: "admin6207", role: "admin", savedProductIds: [] },
  { id: "u2", name: "Test Customer", email: "test@example.com", password: "password", role: "user", savedProductIds: [] }
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
  { id: "b6", name: "MSI", slug: "msi" }
];

import { demoProducts } from "./src/data/demoProducts";

let products: Product[] = demoProducts.map((p: any, i) => ({
  ...p,
  code: p.code || `PRD-${10000 + i}`,
  reviews: Array.from({ length: Math.floor(Math.random() * 6) }).map((_, rIdx) => ({ id: `rev_${i}_${rIdx}`, userId: `u_dummy_${Math.floor(Math.random()*15)}`, userName: `Tester ${rIdx}`, rating: 3 + Math.floor(Math.random() * 3), comment: "Awesome performance for the price. Highly recommended!", createdAt: new Date(Date.now() - Math.random() * 10000000000).toISOString() }))
}));

let coupons: Coupon[] = [
  { id: "cp1", code: "QUANTUM24", discountPercentage: 10, isActive: true, applicableProductIds: [] }
];

let offers: Offer[] = [];

let orders: Order[] = [];

// Generate fake traffic for analytics testing
const statuses: Array<Order["status"]> = ["Pending", "Accepted", "Shipped", "Delivered", "Cancelled"];

for (let i = 0; i < 15; i++) {
  users.push({
    id: `u_dummy_${i}`,
    name: `User ${i}`,
    email: `user${i}@example.com`,
    password: "password",
    role: "user",
    savedProductIds: [products[Math.floor(Math.random() * products.length)]?.id],
    loyaltyPoints: Math.floor(Math.random() * 1000)
  });
}


coupons.push(
  { id: "cp2", code: "SUMMER", discountPercentage: 15, isActive: true, applicableProductIds: [] },
  { id: "cp3", code: "FLASH50", discountPercentage: 5, isActive: false, applicableProductIds: [] }
);


for (let i = 0; i < 12; i++) {
  supportTickets.push({
    id: `sup_${i}`,
    productId: products[Math.floor(Math.random() * products.length)]?.id,
    email: `user${i}@example.com`,
    question: "Is this compatible with my current build?",
    status: Math.random() > 0.5 ? 'Open' : 'Closed',
    createdAt: new Date(Date.now() - Math.random() * 10000000000).toISOString()
  });
}


for (let i = 0; i < 8; i++) {
  restockRequests.push({
    id: `res_${i}`,
    productId: products[Math.floor(Math.random() * products.length)]?.id,
    userId: `u_dummy_${i}`,
    status: 'pending',
    createdAt: new Date(Date.now() - Math.random() * 8000000000).toISOString()
  } as any);
}

for (let i = 0; i < 45; i++) {
  const d = new Date();
  d.setDate(d.getDate() - Math.floor(Math.random() * 7)); // Last 7 days
  const randomProduct = products[Math.floor(Math.random() * Math.min(10, products.length))] || { id: "p1", title: "Test Product", price: 5000 };
  const qty = Math.floor(Math.random() * 3) + 1;
  const status = statuses[Math.floor(Math.random() * statuses.length)];
  
  orders.push({
    id: `ord_mock_${i}`,
    userId: "guest",
    items: [{
      productId: randomProduct.id,
      title: randomProduct.title,
      price: randomProduct.price,
      quantity: qty
    }],
    totalAmount: randomProduct.price * qty,
    status: status,
    deliveryDetails: {
      fullName: `User ${i}`,
      phone: `01711000${i.toString().padStart(3, '0')}`,
      address: "Dhaka, Bangladesh",
      email: `user${i}@example.com`
    },
    paymentMethod: Math.random() > 0.5 ? "Cash on Delivery" : "Manual Payment",
    paymentStatus: status === "Accepted" || status === "Shipped" || status === "Delivered" ? "Verified" : "Pending",
    createdAt: d.toISOString(),
    trackingHistory: [
      { status: "Pending", date: d.toISOString(), description: "Order Placed" },
      ...(status !== "Pending" ? [{ status, date: d.toISOString(), description: `Order ${status}` }] : [])
    ]
  });
}


let settings: Settings = {
  announcementText: "🚀 Free shipping on all PC Builds over ৳2000! Use code QUANTUM24",
  facebookUrl: "https://facebook.com",
  whatsappUrl: "https://whatsapp.com",
  instagramUrl: "https://instagram.com"
};

// ================= API ROUTES =================

// Users & Auth
app.post("/api/users/me/saved-products", (req, res) => {
  const token = req.headers.authorization?.replace("Bearer dummy-token-", "");
  const user = users.find((u) => u.id === token);
  if (!user) return res.status(401).json({ error: "Unauthorized" });
  
  if (!user.savedProductIds) user.savedProductIds = [];
  const { productId } = req.body;
  if (!user.savedProductIds.includes(productId)) {
    user.savedProductIds.push(productId);
  }
  const { password, ...userWithoutPassword } = user;
  res.json(userWithoutPassword);
});

app.delete("/api/users/me/saved-products/:productId", (req, res) => {
  const token = req.headers.authorization?.replace("Bearer dummy-token-", "");
  const user = users.find((u) => u.id === token);
  if (!user) return res.status(401).json({ error: "Unauthorized" });
  
  if (user.savedProductIds) {
    user.savedProductIds = user.savedProductIds.filter(id => id !== req.params.productId);
  }
  const { password, ...userWithoutPassword } = user;
  res.json(userWithoutPassword);
});

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  const user = users.find((u) => u.email === email && u.password === password);
  if (user) {
    const { password, ...userWithoutPassword } = user;
    res.json({ token: `dummy-token-${user.id}`, user: userWithoutPassword });
  } else {
    res.status(401).json({ error: "Invalid credentials" });
  }
});

app.post("/api/auth/register", (req, res) => {
  const { name, email, password, phone } = req.body;
  if (users.find(u => u.email === email)) {
    return res.status(400).json({ error: "Email taken" });
  }
  const newUser: User = { id: `u${Date.now()}`, name, email, password, phone, role: "user", savedProductIds: [] };
  users.push(newUser);
  const { password: _, ...userWithoutPassword } = newUser;
  res.json({ token: `dummy-token-${newUser.id}`, user: userWithoutPassword });
});

app.post("/api/auth/google", (req, res) => {
  const { email, name, avatar, phone } = req.body;
  let user = users.find((u) => u.email === email);
  if (user) {
    if (phone) user.phone = phone;
    if (avatar) user.avatar = avatar;
    if (name) user.name = name;
  } else {
    user = { id: `u${Date.now()}`, name, email, phone, avatar, role: "user", savedProductIds: [] };
    users.push(user);
  }
  const { password, ...userWithoutPassword } = user;
  res.json({ token: `dummy-token-${user.id}`, user: userWithoutPassword });
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
     res.json({ ...userWithoutPassword, loyaltyPoints });
  } else {
    res.status(401).json({ error: "Unauthorized" });
  }
});

// Settings
app.get("/api/settings", (req, res) => res.json(settings));
app.put("/api/settings", (req, res) => {
  settings = { ...settings, ...req.body };
  res.json(settings);
});

// Categories
app.get("/api/categories", (req, res) => res.json(categories));
// Note: In a real app we'd save this to a database

app.get("/api/admin/restock-requests", (req, res) => res.json(restockRequests));

app.post("/api/restock-requests", (req, res) => {
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
  restockRequests.push(newReq);
  res.json(newReq);
});

app.get("/api/users/me/notifications", (req, res) => {
  const token = req.headers.authorization?.replace("Bearer dummy-token-", "");
  const user = users.find((u) => u.id === token);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  res.json(user.notifications || []);
});

app.put("/api/users/me/notifications/:id/read", (req, res) => {
  const token = req.headers.authorization?.replace("Bearer dummy-token-", "");
  const user = users.find((u) => u.id === token);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  const notif = (user.notifications || []).find((n) => n.id === req.params.id);
  if (notif) notif.read = true;
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

app.post("/api/support-tickets", (req, res) => {
  const { productId, email, question } = req.body;
  if (!productId || !email || !question) return res.status(400).json({ error: 'Missing fields' });
  const ticket = { id: `st_${Date.now()}`, productId, email, question, status: 'Open' as const, createdAt: new Date().toISOString() };
  supportTickets.push(ticket);
  res.json(ticket);
});

app.put("/api/support-tickets/:id", (req, res) => {
  const idx = supportTickets.findIndex(t => t.id === req.params.id);
  if (idx !== -1) {
    supportTickets[idx] = { ...supportTickets[idx], ...req.body };
    res.json(supportTickets[idx]);
  } else {
    res.status(404).json({ error: "Not found" });
  }
});

app.post("/api/categories", (req, res) => {
  const c: Category = { id: `c${Date.now()}`, ...req.body };
  categories.push(c);
  res.json(c);
});
app.put("/api/categories/:id", (req, res) => {
  const idx = categories.findIndex(c => c.id === req.params.id);
  if (idx > -1) {
    categories[idx] = { ...categories[idx], ...req.body };
    res.json(categories[idx]);
  } else res.status(404).json({ error: "Not found" });
});
app.delete("/api/categories/:id", (req, res) => {
  categories = categories.filter(c => c.id !== req.params.id);
  res.sendStatus(204);
});

// Brands
app.get("/api/brands", (req, res) => res.json(brands));
app.post("/api/brands", (req, res) => {
  const b: Brand = { id: `b${Date.now()}`, ...req.body };
  brands.push(b);
  res.json(b);
});
app.put("/api/brands/:id", (req, res) => {
  const idx = brands.findIndex(b => b.id === req.params.id);
  if (idx > -1) {
    brands[idx] = { ...brands[idx], ...req.body };
    res.json(brands[idx]);
  } else res.status(404).json({ error: "Not found" });
});
app.delete("/api/brands/:id", (req, res) => {
  brands = brands.filter(b => b.id !== req.params.id);
  res.sendStatus(204);
});

// Products
app.get("/api/products", (req, res) => res.json(products));
app.post("/api/products", (req, res) => {
  // auto-generate unique SKU if not provided or empty
  let code = req.body.code;
  if (!code) {
    const brandStr = req.body.brand ? req.body.brand.substring(0, 3).toUpperCase() : 'GEN';
    const catstr = req.body.categoryId ? req.body.categoryId.substring(0, 3).toUpperCase() : 'CAT';
    const randId = Math.floor(1000 + Math.random() * 9000);
    code = `PRD-${brandStr}-${catstr}-${randId}`;
  }
  const p: Product = { id: `p${Date.now()}`, ...req.body, code };
  products.push(p);
  res.json(p);
});
app.put("/api/products/:id", (req, res) => {
  const idx = products.findIndex(p => p.id === req.params.id);
  if (idx > -1) {
    const oldProduct = products[idx];
    // Preserve old code if code not provided
    let code = req.body.code || products[idx].code;
    if (!code) {
      const brandStr = req.body.brand ? req.body.brand.substring(0, 3).toUpperCase() : 'GEN';
      const catstr = req.body.categoryId ? req.body.categoryId.substring(0, 3).toUpperCase() : 'CAT';
      const randId = Math.floor(1000 + Math.random() * 9000);
      code = `PRD-${brandStr}-${catstr}-${randId}`;
    }
    const newProduct = { ...products[idx], ...req.body, code };
    products[idx] = newProduct;
    
    if (
      (oldProduct.stockStatus === 'Out of Stock' || oldProduct.inventoryCount === 0) &&
      (newProduct.stockStatus !== 'Out of Stock' && newProduct.inventoryCount !== undefined && newProduct.inventoryCount > 0)
    ) {
      restockRequests = restockRequests.map(r => {
        if (r.productId === newProduct.id && r.status === 'pending') {
          const uIdx = users.findIndex(u => u.id === r.userId);
          if (uIdx > -1) {
            users[uIdx].notifications = users[uIdx].notifications || [];
            users[uIdx].notifications.push({
              id: `notif_${Date.now()}_${Math.random()}`,
              message: `${newProduct.title} is back in stock!`,
              link: `/products/${newProduct.id}`,
              read: false,
              createdAt: new Date().toISOString()
            });
          }
          return { ...r, status: 'fulfilled' };
        }
        return r;
      });
    }

    res.json(products[idx]);
  } else res.status(404).json({ error: "Not found" });
});
app.delete("/api/products/:id", (req, res) => {
  products = products.filter(p => p.id !== req.params.id);
  res.sendStatus(204);
});

app.get("/api/products/:id", (req, res) => {
  const p = products.find(p => p.id === req.params.id);
  if (p) res.json(p);
  else res.status(404).json({ error: "Not found" });
});

app.post("/api/products/:id/reviews", (req, res) => {
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

  res.json(review);
});

// Offers
app.get("/api/offers", (req, res) => res.json(offers));
app.post("/api/offers", (req, res) => {
  const o: Offer = { id: `of${Date.now()}`, ...req.body };
  offers.push(o);
  res.json(o);
});
app.put("/api/offers/:id", (req, res) => {
  const idx = offers.findIndex(o => o.id === req.params.id);
  if (idx > -1) {
    offers[idx] = { ...offers[idx], ...req.body };
    res.json(offers[idx]);
  } else res.status(404).json({ error: "Not found" });
});
app.delete("/api/offers/:id", (req, res) => {
  offers = offers.filter(o => o.id !== req.params.id);
  res.sendStatus(204);
});

// Coupons
app.get("/api/coupons", (req, res) => res.json(coupons));
app.post("/api/coupons", (req, res) => {
  const c: Coupon = { id: `cp${Date.now()}`, ...req.body };
  coupons.push(c);
  res.json(c);
});
app.put("/api/coupons/:id", (req, res) => {
  const idx = coupons.findIndex(c => c.id === req.params.id);
  if (idx > -1) {
    coupons[idx] = { ...coupons[idx], ...req.body };
    res.json(coupons[idx]);
  } else res.status(404).json({ error: "Not found" });
});
app.delete("/api/coupons/:id", (req, res) => {
  coupons = coupons.filter(c => c.id !== req.params.id);
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
app.get("/api/orders", (req, res) => res.json(orders));
app.get("/api/orders/user", (req, res) => {
  const token = req.headers.authorization?.replace("Bearer dummy-token-", "");
  res.json(orders.filter(o => o.userId === token));
});
app.post("/api/orders", (req, res) => {
  const token = req.headers.authorization?.replace("Bearer dummy-token-", "");
  const paymentMethod = req.body.paymentMethod || 'Cash on Delivery';
  const order: Order = {
    id: `ord_${Date.now()}`,
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
  orders.push(order);
  res.json(order);
});
app.put("/api/orders/:id/status", (req, res) => {
  const idx = orders.findIndex(o => o.id === req.params.id);
  if (idx > -1) {
    orders[idx].status = req.body.status;
    
    // Append to tracking history
    const descriptions: Record<string, string> = {
      "Accepted": "Order has been accepted and is being processed.",
      "Shipped": "Order has been dispatched and is on its way.",
      "Delivered": "Order has been delivered successfully.",
      "Cancelled": "Order has been cancelled."
    };
    
    orders[idx].trackingHistory = orders[idx].trackingHistory || [];
    orders[idx].trackingHistory.push({
      status: req.body.status,
      date: new Date().toISOString(),
      description: descriptions[req.body.status] || "Order status updated."
    });

    res.json(orders[idx]);
  } else res.status(404).json({ error: "Not found" });
});

app.put("/api/orders/:id/paymentStatus", (req, res) => {
  const idx = orders.findIndex(o => o.id === req.params.id);
  if (idx > -1) {
    orders[idx].paymentStatus = req.body.paymentStatus;
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

// Vite & Static file serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
