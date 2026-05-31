import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc } from 'firebase/firestore';
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

import { demoProducts } from './src/data/demoProducts.ts';

const categories = [
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

const brands = [
  { id: "b1", name: "Intel", slug: "intel" },
  { id: "b2", name: "AMD", slug: "amd" },
  { id: "b3", name: "NVIDIA", slug: "nvidia" },
  { id: "b4", name: "Corsair", slug: "corsair" },
  { id: "b5", name: "ASUS", slug: "asus" },
  { id: "b6", name: "MSI", slug: "msi" }
];

async function seed() {
  console.log("Seeding Database...");
  
  for (const c of categories) {
    await setDoc(doc(db, 'categories', c.id), c);
  }
  
  for (const b of brands) {
    await setDoc(doc(db, 'brands', b.id), b);
  }
  
  for (let i = 0; i < demoProducts.length; i++) {
    const p = demoProducts[i];
    const pData: any = {
      ...p,
      id: `p${Date.now() + i}`,
      code: p.code || `PRD-${10000 + i}`
    };
    await setDoc(doc(db, 'products', pData.id), pData);
  }
  
  await setDoc(doc(db, 'settings', 'global'), {
    announcementText: "🚀 Free shipping on all PC Builds over ৳2000! Use code QUANTUM24",
    facebookUrl: "https://facebook.com",
    whatsappUrl: "https://whatsapp.com",
    instagramUrl: "https://instagram.com"
  });
  
  await setDoc(doc(db, 'coupons', 'c1'), {
    id: 'c1',
    code: 'QUANTUM24',
    discountPercentage: 10,
    isActive: true,
    applicableProductIds: []
  });
  
  console.log("Database seeded successfully!");
  process.exit(0);
}

seed().catch(console.error);
