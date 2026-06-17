import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useStore } from '../store';
import { Product, SharedBuild } from '../types';
import { motion } from 'motion/react';
import { Box, PlugZap, ArrowLeft, ShoppingBag } from 'lucide-react';

export default function SharedBuildView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { products, addToCart, addToast, token } = useStore();
  const [build, setBuild] = useState<SharedBuild | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchBuild = async () => {
      try {
        const data = await api.get(`/shared-builds/${id}`);
        setBuild(data);
      } catch (err: any) {
        console.error("Failed to fetch shared build:", err);
        setError("Build not found or link expired.");
      } finally {
        setLoading(false);
      }
    };
    if (id) {
      fetchBuild();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20 px-4">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !build) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-4">Build Not Found</h2>
        <p className="text-slate-600 dark:text-slate-400 mb-8">{error}</p>
        <button onClick={() => navigate('/builder')} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold transition-transform active:scale-95">
          Start Your Own Build
        </button>
      </div>
    );
  }

  const buildProducts = Object.values(build.items || {})
    .map(productId => products.find(p => p.id === productId))
    .filter(Boolean) as Product[];

  const handleAddAllToCart = () => {
    if (!token) {
      navigate('/login');
      return;
    }
    buildProducts.forEach(p => addToCart(p, 1, true));
    addToast('All build components added to cart!', 'success');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link to="/builder" className="text-sm font-medium text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 mb-8 flex items-center gap-1 w-fit">
        <ArrowLeft className="w-4 h-4" /> Back to Builder
      </Link>
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 text-xs font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 px-3 py-1 rounded-full mb-3">
             <Box className="w-4 h-4" />
             <span>Shared Build #{build.id}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">Custom PC Configuration</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">Check out this custom PC build selected by another user.</p>
        </div>
        
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 min-w-[280px]">
          <div className="text-sm text-slate-500 dark:text-slate-400 flex justify-between">
             <span>Estimated Total</span>
             <span className="flex items-center gap-1"><PlugZap className="w-3 h-3"/> {build.totalWattage}W</span>
          </div>
          <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">৳{build.totalPrice.toLocaleString("en-IN", {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
          <button
              onClick={handleAddAllToCart}
              className="mt-4 w-full bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 py-3 rounded-xl font-bold transition-transform active:scale-95 flex justify-center items-center gap-2"
          >
             <ShoppingBag className="w-4 h-4" />
             Add Build to Cart
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {buildProducts.map((product, idx) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="flex items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800"
          >
            <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-lg flex-shrink-0 flex items-center justify-center p-2">
               <img src={product.imageUrl} alt={product.title} className="max-w-full max-h-full object-contain mix-blend-multiply dark:mix-blend-normal" />
            </div>
            <div className="flex-1 min-w-0">
               <h3 className="font-bold text-slate-900 dark:text-white text-lg truncate">{product.title}</h3>
               <p className="text-sm font-mono text-slate-500 dark:text-slate-400 mt-1">{product.brand}</p>
            </div>
            <div className="text-right">
               <div className="font-bold text-slate-900 dark:text-white text-lg">৳{(product.discountPrice || product.price).toLocaleString("en-IN")}</div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
