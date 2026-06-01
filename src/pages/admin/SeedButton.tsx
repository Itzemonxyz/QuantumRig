import React, { useState } from 'react';
import { Database } from 'lucide-react';
import { demoProducts } from '../../data/demoProducts';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

export function SeedButton() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const db = getFirestore();

  const handleSeed = async () => {
    if (!window.confirm('Are you sure you want to seed the database? This might overwrite some documents.')) return;
    try {
      setLoading(true);
      setMessage('Seeding...');
      
      const brands = [
        { id: "b1", name: "Intel", slug: "intel" },
        { id: "b2", name: "AMD", slug: "amd" },
        { id: "b3", name: "NVIDIA", slug: "nvidia" },
        { id: "b4", name: "Corsair", slug: "corsair" },
        { id: "b5", name: "ASUS", slug: "asus" },
        { id: "b6", name: "MSI", slug: "msi" }
      ];

      for (const b of brands) {
        await setDoc(doc(db, 'brands', b.id), b);
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

      setMessage('Seeded Successfully! Refresh the page.');
    } catch (e: any) {
      setMessage('Error: ' + e.message);
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(''), 8000);
    }
  };

  return (
    <button 
       onClick={handleSeed}
       disabled={loading}
       className="bg-indigo-50 border text-center border-indigo-200 p-8 rounded-2xl shadow-sm hover:shadow-md hover:border-indigo-300 transition-all flex flex-col items-center group cursor-pointer"
    >
       <div className="group-hover:scale-110 transition-transform">
          <Database className="w-8 h-8 text-indigo-500 mb-4" />
       </div>
       <h3 className="text-xl font-bold text-indigo-800 mb-2">{loading ? 'Seeding...' : 'Seed Database'}</h3>
       <p className="text-indigo-600/80 text-sm whitespace-pre-wrap">{message || 'Populate initial demo data'}</p>
    </button>
  );
}
