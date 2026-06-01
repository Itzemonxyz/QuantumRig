import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { motion } from 'motion/react';
import { 
  Cpu, 
  CircuitBoard, 
  MemoryStick, 
  HardDrive, 
  MonitorPlay, 
  Zap, 
  Box, 
  Fan, 
  Monitor, 
  Headphones, 
  LayoutGrid,
  Search
} from 'lucide-react';

export default function Home() {
  const { categories, products } = useStore();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchResults = searchQuery.trim() 
    ? products.filter(p => 
        (p.title || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
        (p.description || '').toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 5) // limit to 5 results
    : [];

  const getCategoryIcon = (slug: string) => {
    switch (slug) {
      case 'processors': return <Cpu className="w-5 h-5 text-indigo-600" strokeWidth={1.5} />;
      case 'motherboards': return <CircuitBoard className="w-5 h-5 text-indigo-600" strokeWidth={1.5} />;
      case 'ram': return <MemoryStick className="w-5 h-5 text-indigo-600" strokeWidth={1.5} />;
      case 'storage': return <HardDrive className="w-5 h-5 text-indigo-600" strokeWidth={1.5} />;
      case 'graphics-cards': return <MonitorPlay className="w-5 h-5 text-indigo-600" strokeWidth={1.5} />;
      case 'power-supplies': return <Zap className="w-5 h-5 text-indigo-600" strokeWidth={1.5} />;
      case 'casings': return <Box className="w-5 h-5 text-indigo-600" strokeWidth={1.5} />;
      case 'coolers': return <Fan className="w-5 h-5 text-indigo-600" strokeWidth={1.5} />;
      case 'monitors': return <Monitor className="w-5 h-5 text-indigo-600" strokeWidth={1.5} />;
      case 'accessories': return <Headphones className="w-5 h-5 text-indigo-600" strokeWidth={1.5} />;
      default: return <Box className="w-5 h-5 text-indigo-600" strokeWidth={1.5} />;
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsSearchOpen(false);
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="bg-slate-50 min-h-[calc(100vh-200px)] text-slate-900 w-full shadow-2xl relative pb-8">
      
      {/* Hero Section */}
      <div className="relative w-full h-[400px] overflow-hidden bg-slate-900 flex items-center justify-center">
        <div className="absolute inset-0 w-full h-full">
          <img 
            src="https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=2000&q=80" 
            alt="Gaming PC" 
            className="w-full h-full object-cover opacity-40 mix-blend-overlay"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent"></div>
        </div>
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto flex flex-col items-center">
          <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6 tracking-tight">
            Build Your Ultimate <span className="text-indigo-500">Gaming PC</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-300 mb-8 max-w-2xl">
            By Gamers, For Gamers. Discover premium PC components, expert advice, and the exact hardware you need to power your dreams.
          </p>
          <button 
            onClick={() => navigate('/builder')}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 px-8 rounded-xl shadow-lg shadow-indigo-600/30 transition-all hover:scale-105"
          >
            Start Your Build
          </button>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="max-w-7xl mx-auto">
        {/* Search Bar */}
        <div className="p-6 sticky top-16 bg-slate-50/90 backdrop-blur-md z-40" ref={searchRef}>
        <form onSubmit={handleSearch} className="relative max-w-xl mx-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search our entire product catalog..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsSearchOpen(true);
            }}
            onFocus={() => setIsSearchOpen(true)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 text-slate-900 rounded-full text-sm outline-none focus:border-indigo-500 transition-colors shadow-sm"
          />
          {isSearchOpen && searchQuery.trim() !== '' && (
            <div className="absolute top-14 left-0 right-0 bg-white border border-slate-200 rounded-lg shadow-xl shadow-black/5 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
              {searchResults.length > 0 ? (
                <div className="max-h-96 overflow-y-auto">
                  {searchResults.map(product => (
                    <div 
                      key={product.id}
                      onClick={() => {
                        navigate(`/products/${product.id}`);
                        setSearchQuery('');
                        setIsSearchOpen(false);
                      }}
                      className="flex items-center space-x-4 p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-0"
                    >
                      <img src={product.imageUrl} alt={product.title} className="w-12 h-12 object-contain bg-white rounded" />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-slate-900 truncate">{product.title}</h4>
                        <p className="text-xs text-slate-500 truncate">{product.description}</p>
                      </div>
                      <div className="text-sm font-bold flex flex-col items-end">
                        {product.discountPrice ? (
                          <>
                            <span className="text-rose-600">৳{Number(product.discountPrice || 0).toFixed(2)}</span>
                            <span className="text-[10px] text-slate-400 line-through">৳{Number(product.price || 0).toFixed(2)}</span>
                          </>
                        ) : (
                          <span className="text-indigo-600">৳{Number(product.price || 0).toFixed(2)}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-sm text-slate-500">
                  No products found for "{searchQuery}"
                </div>
              )}
            </div>
          )}
        </form>
      </div>

      {/* App Categories Grid */}
      <div className="px-8 mt-6">
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-y-10 gap-x-6">
          {categories.map((c) => (
            <motion.button 
               key={c.id}
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.3 }}
               onClick={() => navigate(`/products?category=${c.id}`)}
               className="flex flex-col items-center justify-start group"
            >
               <div className="w-16 h-16 rounded-full border border-slate-200 bg-white flex items-center justify-center mb-3 group-hover:border-indigo-500 group-hover:shadow-[0_0_15px_rgba(79,70,229,0.2)] transition-all">
                  {getCategoryIcon(c.slug)}
               </div>
               <span className="text-xs text-slate-600 text-center leading-tight font-medium group-hover:text-indigo-600 transition-colors px-1">{c.name}</span>
            </motion.button>
          ))}
          <motion.button 
             initial={{ opacity: 0, y: 10 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.3, delay: 0.1 }}
             onClick={() => navigate('/products')}
             className="flex flex-col items-center justify-start group"
          >
             <div className="w-16 h-16 rounded-full border border-slate-200 bg-white flex items-center justify-center mb-3 group-hover:border-indigo-500 group-hover:shadow-[0_0_15px_rgba(79,70,229,0.2)] transition-all">
                <LayoutGrid className="w-5 h-5 text-indigo-600" strokeWidth={1.5} />
             </div>
             <span className="text-xs text-slate-600 text-center leading-tight font-medium group-hover:text-indigo-600 transition-colors px-1">All Products</span>
          </motion.button>
        </div>
      </div>

      {/* Trending Products */}
      <div className="px-8 mt-20 mb-20">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Trending Now</h2>
            <p className="text-slate-500 text-sm mt-1">Our most popular hardware right now.</p>
          </div>
          <Link to="/products" className="text-indigo-600 text-sm font-medium hover:text-indigo-500">View All &rarr;</Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {products.filter(p => p.stockStatus !== 'Out of Stock').slice(0, 4).map((p) => (
            <div key={p.id} onClick={() => navigate(`/products/${p.id}`)} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer group flex flex-col h-full">
              <div className="aspect-square bg-slate-50 rounded-xl mb-4 p-4 flex items-center justify-center overflow-hidden">
                <img src={p.imageUrl} alt={p.title} className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-300 mix-blend-multiply" />
              </div>
              <div className="flex-1">
                <div className="text-xs font-medium text-indigo-600 mb-1">{p.brand || 'Premium'}</div>
                <h3 className="font-bold text-slate-900 leading-tight mb-2 line-clamp-2">{p.title}</h3>
                <div className="flex items-baseline gap-2">
                  <span className="font-bold text-lg text-slate-900">৳{p.discountPrice ? Number(p.discountPrice || 0).toFixed(2) : Number(p.price || 0).toFixed(2)}</span>
                  {p.discountPrice && <span className="text-xs text-slate-400 line-through">৳{Number(p.price || 0).toFixed(2)}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Enhancements / Features Section */}
      <div className="px-8 mb-20">
        <div className="bg-indigo-900 rounded-3xl p-8 md:p-16 text-center text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
          <div className="relative z-10 max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight">The PC Builder's Choice</h2>
            <p className="text-indigo-200 text-lg mb-10 leading-relaxed">
              We don't just sell parts. We provide an intuitive interactive builder ensuring all your components are 100% compatible. Expertly curate your next battlestation with zero guesswork.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               <div className="bg-indigo-800/50 backdrop-blur border border-indigo-700 p-6 rounded-2xl">
                 <Zap className="w-8 h-8 text-amber-400 mx-auto mb-4" />
                 <h3 className="font-bold mb-2">Fast Delivery</h3>
                 <p className="text-sm text-indigo-200">Express nationwide shipping on all orders.</p>
               </div>
               <div className="bg-indigo-800/50 backdrop-blur border border-indigo-700 p-6 rounded-2xl">
                 <Box className="w-8 h-8 text-emerald-400 mx-auto mb-4" />
                 <h3 className="font-bold mb-2">Secure Packaging</h3>
                 <p className="text-sm text-indigo-200">Your precious components are boxed with extreme care.</p>
               </div>
               <div className="bg-indigo-800/50 backdrop-blur border border-indigo-700 p-6 rounded-2xl">
                 <Headphones className="w-8 h-8 text-cyan-400 mx-auto mb-4" />
                 <h3 className="font-bold mb-2">Expert Support</h3>
                 <p className="text-sm text-indigo-200">Got a question during building? Our team is available 24/7.</p>
               </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
