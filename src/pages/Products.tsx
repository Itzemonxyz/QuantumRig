import React, { useState, useMemo } from 'react';
import { useStore } from '../store';
import { Scale, X, Filter, Search } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import ProductSkeleton from '../components/ProductSkeleton';
import Breadcrumbs from '../components/Breadcrumbs';
import ScrollToTopButton from '../components/ScrollToTopButton';
import { Product } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function Products() {
  const { products, categories, isLoading, compareIds, toggleCompare, clearCompare } = useStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeCategory = searchParams.get('category');
  const searchQuery = searchParams.get('search');

  const [showCompareModal, setShowCompareModal] = useState(false);
  const [sortBy, setSortBy] = useState('newest');
  
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);

  // New filter states
  const [stockFilter, setStockFilter] = useState('all'); // all, in-stock, out-of-stock
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [localPriceRange, setLocalPriceRange] = useState({ min: '', max: '' });

  React.useEffect(() => {
    setLocalPriceRange(priceRange);
  }, [priceRange]);

  let filteredProducts = products;
  
  const allBrands = useMemo(() => {
    return Array.from(new Set(products.map(p => p.brand).filter(Boolean) as string[])).sort();
  }, [products]);
  
  if (activeCategory) {
    filteredProducts = filteredProducts.filter(p => p.categoryId === activeCategory);
  }
  
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filteredProducts = filteredProducts.filter(p => 
      p.title.toLowerCase().includes(q) || 
      p.description.toLowerCase().includes(q) || 
      (p.brand && p.brand.toLowerCase().includes(q))
    );
  }

  if (stockFilter === 'in-stock') {
    filteredProducts = filteredProducts.filter(p => p.stockStatus === 'In Stock');
  } else if (stockFilter === 'out-of-stock') {
    filteredProducts = filteredProducts.filter(p => p.stockStatus === 'Out of Stock');
  }

  if (priceRange.min !== '') {
    filteredProducts = filteredProducts.filter(p => p.price >= Number(priceRange.min));
  }
  if (priceRange.max !== '') {
    filteredProducts = filteredProducts.filter(p => p.price <= Number(priceRange.max));
  }
  
  if (selectedBrands.length > 0) {
    filteredProducts = filteredProducts.filter(p => p.brand && selectedBrands.includes(p.brand));
  }
  
  const sortOptions = useMemo(() => {
    const options = [
      { value: 'newest', label: 'Newest Arrivals' },
      { value: 'default', label: 'Featured' },
      { value: 'price-asc', label: 'Price: Low to High' },
      { value: 'price-desc', label: 'Price: High to Low' },
      { value: 'name-asc', label: 'Name: A to Z' },
      { value: 'name-desc', label: 'Name: Z to A' },
    ];
    
    if (activeCategory && filteredProducts.length > 0) {
       const specKeys = new Set<string>();
       products.filter(p => p.categoryId === activeCategory).forEach(p => {
           Object.keys(p.specs || {}).forEach(k => specKeys.add(k));
       });
       
       const formatKey = (key: string) => key.replace(/([A-Z])/g, ' $1').trim();
       
       Array.from(specKeys).forEach(key => {
           options.push({ value: `spec-${key}-asc`, label: `${formatKey(key)}: Low to High`});
           options.push({ value: `spec-${key}-desc`, label: `${formatKey(key)}: High to Low`});
       });
    }
    return options;
  }, [activeCategory, products, filteredProducts.length]);

  const sortedProducts = useMemo(() => {
    let sorted = [...filteredProducts];
    if (sortBy === 'newest') {
       sorted.sort((a, b) => b.id.localeCompare(a.id));
    } else if (sortBy === 'price-asc') {
       sorted.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
       sorted.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'name-asc') {
       sorted.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === 'name-desc') {
       sorted.sort((a, b) => b.title.localeCompare(a.title));
    } else if (sortBy !== 'default') {
       const isDesc = sortBy.endsWith('-desc');
       const specKey = sortBy.replace('spec-', '').replace('-asc', '').replace('-desc', '');
       
       sorted.sort((a, b) => {
           const valA = a.specs?.[specKey] || "";
           const valB = b.specs?.[specKey] || "";
           const numA = parseFloat(valA.toString().replace(/[^0-9.-]+/g,""));
           const numB = parseFloat(valB.toString().replace(/[^0-9.-]+/g,""));
           
           if (!isNaN(numA) && !isNaN(numB)) {
               return isDesc ? numB - numA : numA - numB;
           }
           return isDesc ? String(valB).localeCompare(String(valA)) : String(valA).localeCompare(String(valB));
       });
    }
    return sorted;
  }, [filteredProducts, sortBy]);

  const handleCompareToggle = (product: Product) => {
    toggleCompare(product.id);
  };

  const comparedProducts = compareIds.map(id => products.find(p => p.id === id)!).filter(Boolean);
  const allSpecKeys = Array.from(new Set(comparedProducts.flatMap(p => Object.keys(p.specs || {}))));

  const breadcrumbItems = [
    { label: 'Products', path: '/products' },
    ...(activeCategory ? [{ label: categories.find(c => c.id === activeCategory)?.name || 'Category' }] : [])
  ];

  const productPrices = products.map(p => p.price);
  const minPriceLimit = productPrices.length > 0 ? Math.floor(Math.min(...productPrices)) : 0;
  const maxPriceLimit = productPrices.length > 0 ? Math.ceil(Math.max(...productPrices)) : 100000;

  const clearFilters = () => {
    setSearchParams({});
    setStockFilter('all');
    setPriceRange({ min: '', max: '' });
    setSelectedBrands([]);
  };

  const filterSidebarContent = (
    <div className="space-y-6">
      <div>
        <h3 className="font-bold text-sm mb-3 text-slate-900 uppercase tracking-wider">Availability</h3>
        <ul className="space-y-2 text-sm">
          {['all', 'in-stock', 'out-of-stock'].map(status => (
            <li key={status}>
               <label className="flex items-center space-x-3 cursor-pointer py-2">
                 <input 
                   type="radio" 
                   name="stockStatus" 
                   value={status}
                   checked={stockFilter === status}
                   onChange={(e) => setStockFilter(e.target.value)}
                   className="w-5 h-5 text-indigo-600 focus:ring-indigo-500 border-slate-300"
                 />
                 <span className="text-slate-700 font-medium">
                   {status === 'all' ? 'All Items' : status === 'in-stock' ? 'In Stock' : 'Out of Stock'}
                 </span>
               </label>
            </li>
          ))}
        </ul>
      </div>

      <div className="border-t border-slate-200 pt-6">
        <h3 className="font-bold text-sm mb-3 text-slate-900 uppercase tracking-wider">Price Range</h3>
        <div className="flex items-center gap-2 mb-4">
          <input 
            type="number" 
            placeholder={String(minPriceLimit)}
            value={localPriceRange.min}
            onChange={(e) => {
              const val = e.target.value;
              setLocalPriceRange(prev => ({ ...prev, min: val }));
            }}
            onBlur={(e) => {
              const val = e.target.value;
              setPriceRange(prev => ({ ...prev, min: val }));
            }}
            onKeyDown={(e) => {
              const val = e.currentTarget.value;
              if (e.key === 'Enter') setPriceRange(prev => ({ ...prev, min: val }));
            }}
            className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
          />
          <span className="text-slate-400">-</span>
          <input 
            type="number" 
            placeholder={String(maxPriceLimit)}
            value={localPriceRange.max}
            onChange={(e) => {
              const val = e.target.value;
              setLocalPriceRange(prev => ({ ...prev, max: val }));
            }}
            onBlur={(e) => {
              const val = e.target.value;
              setPriceRange(prev => ({ ...prev, max: val }));
            }}
            onKeyDown={(e) => {
              const val = e.currentTarget.value;
              if (e.key === 'Enter') setPriceRange(prev => ({ ...prev, max: val }));
            }}
            className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
          />
        </div>
        
        <div className="flex flex-col gap-4">
           <div>
             <div className="flex justify-between items-center text-xs text-slate-500 mb-1">
               <span>Min Price: ৳{localPriceRange.min || minPriceLimit}</span>
             </div>
             <input 
               type="range"
               min={minPriceLimit}
               max={maxPriceLimit}
               step={10}
               value={localPriceRange.min || minPriceLimit}
               onChange={(e) => {
                 const val = e.target.value;
                 setLocalPriceRange(prev => ({ ...prev, min: val }));
               }}
               onMouseUp={(e) => {
                 const val = e.currentTarget.value;
                 setPriceRange(prev => ({ ...prev, min: val }));
               }}
               onTouchEnd={(e) => {
                 const val = e.currentTarget.value;
                 setPriceRange(prev => ({ ...prev, min: val }));
               }}
               className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 mb-1"
             />
           </div>
           <div>
             <div className="flex justify-between items-center text-xs text-slate-500 mb-1">
               <span>Max Price: ৳{localPriceRange.max || maxPriceLimit}</span>
             </div>
             <input 
               type="range"
               min={minPriceLimit}
               max={maxPriceLimit}
               step={10}
               value={localPriceRange.max || maxPriceLimit}
               onChange={(e) => {
                 const val = e.target.value;
                 setLocalPriceRange(prev => ({ ...prev, max: val }));
               }}
               onMouseUp={(e) => {
                 const val = e.currentTarget.value;
                 setPriceRange(prev => ({ ...prev, max: val }));
               }}
               onTouchEnd={(e) => {
                 const val = e.currentTarget.value;
                 setPriceRange(prev => ({ ...prev, max: val }));
               }}
               className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
             />
           </div>
        </div>
      </div>

      {allBrands.length > 0 && (
        <div className="border-t border-slate-200 pt-6">
          <h3 className="font-bold text-sm mb-3 text-slate-900 uppercase tracking-wider">Brands</h3>
          <ul className="space-y-2 text-sm max-h-48 overflow-y-auto pr-2">
            {allBrands.map(brand => (
              <li key={brand}>
                 <label className="flex items-center space-x-3 cursor-pointer py-2">
                   <input 
                     type="checkbox" 
                     checked={selectedBrands.includes(brand)}
                     onChange={(e) => {
                       if (e.target.checked) {
                         setSelectedBrands(prev => [...prev, brand]);
                       } else {
                         setSelectedBrands(prev => prev.filter(b => b !== brand));
                       }
                     }}
                     className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                   />
                   <span className="text-slate-700 font-medium">{brand}</span>
                 </label>
              </li>
            ))}
          </ul>
        </div>
      )}

      {(stockFilter !== 'all' || priceRange.min || priceRange.max || selectedBrands.length > 0 || searchQuery) && (
        <div className="border-t border-slate-200 pt-4">
          <button 
            onClick={clearFilters}
            className="w-full py-2 text-sm text-slate-600 font-medium bg-slate-100 rounded md:hover:bg-slate-200 transition-colors"
          >
            Clear All Filters
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative text-slate-900">
      <Breadcrumbs items={breadcrumbItems} />
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
         <div>
           <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mb-2">
             {searchQuery ? `Search Results for "${searchQuery}"` : activeCategory ? categories.find(c => c.id === activeCategory)?.name || 'Products' : 'All Products'}
           </h1>
           <p className="text-sm text-slate-500">Showing {sortedProducts.length} results</p>
         </div>
         
         <div className="flex items-center gap-4">
           <button 
             onClick={() => setShowMobileFilters(true)}
             className="md:hidden flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-lg text-sm font-medium focus:ring-indigo-500"
           >
             <Filter className="w-4 h-4" /> Filters
           </button>
           <div className="flex items-center gap-2 flex-1 md:flex-none">
             <select 
                id="sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-white border border-slate-200 text-slate-900 text-sm font-medium rounded-lg focus:ring-2 focus:ring-indigo-500 block p-2 w-full md:w-auto outline-none cursor-pointer"
             >
                {sortOptions.map(opt => (
                   <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
             </select>
           </div>
         </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Desktop Sidebar */}
        <div className="hidden md:block col-span-1 border border-slate-200 bg-white p-5 rounded-xl h-fit sticky top-24 shadow-sm">
          {filterSidebarContent}
        </div>
        
        {/* Mobile Filters Drawer */}
        <AnimatePresence>
          {showMobileFilters && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-slate-900/50 flex md:hidden"
            >
              <motion.div 
                initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
                className="w-4/5 max-w-sm bg-white h-full shadow-2xl flex flex-col"
              >
                <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 sticky top-0 z-10">
                  <h2 className="font-bold text-lg">Filters</h2>
                  <div className="flex items-center space-x-4">
                    <button 
                      onClick={() => {
                        setSelectedBrands([]);
                        setStockFilter('all');
                        setPriceRange({ min: '', max: '' });
                        setLocalPriceRange({ min: '', max: '' });
                        if (activeCategory || searchQuery) setSearchParams({});
                      }} 
                      className="text-sm font-bold text-indigo-600 hover:text-indigo-700"
                    >
                      Clear Filters
                    </button>
                    <button onClick={() => setShowMobileFilters(false)} className="p-1"><X className="w-6 h-6 text-slate-500" /></button>
                  </div>
                </div>
                <div className="p-4 overflow-y-auto flex-1">
                  {filterSidebarContent}
                </div>
                <div className="p-4 border-t border-slate-200 bg-white sticky bottom-0 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                  <div className="flex items-center justify-between mb-3 text-sm font-bold">
                    <span className="text-slate-500">Products found:</span>
                    <span className="text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">{sortedProducts.length}</span>
                  </div>
                  <button onClick={() => setShowMobileFilters(false)} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl shadow-lg transition-transform active:scale-95">
                    Show {sortedProducts.length} Results
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Products Grid */}
        <div className="col-span-1 md:col-span-3 pb-24">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {Array.from({ length: 8 }).map((_, index) => (
                <ProductSkeleton key={`skeleton-${index}`} />
              ))}
            </div>
          ) : sortedProducts.length === 0 ? (
            <div className="text-center py-16 px-4 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col items-center">
              <Search className="w-12 h-12 text-slate-300 mb-4" />
              <h3 className="text-lg font-bold text-slate-900 mb-1">No products found</h3>
              <p className="text-slate-500 mb-4">Try adjusting your filters or search criteria.</p>
              <button onClick={clearFilters} className="text-indigo-600 font-medium hover:underline">Clear all filters</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {sortedProducts.map((p, index) => (
                <motion.div 
                  key={p.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="h-full"
                >
                  <ProductCard product={p} />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {compareIds.length > 0 && (
        <div className="fixed bottom-0 sm:bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] z-40 transform transition-transform animate-in slide-in-from-bottom flex flex-col sm:flex-row justify-center items-center gap-4 pb-safe">
          <div className="flex items-center gap-4 overflow-x-auto max-w-full pb-2 sm:pb-0 scrollbar-hide">
            {comparedProducts.map(p => (
              <div key={p.id} className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded px-3 py-2 min-w-[200px] shrink-0 relative">
                <img src={p.imageUrl} className="w-10 h-10 object-contain mix-blend-multiply bg-white" />
                <div className="flex-1 truncate mt-0.5">
                  <p className="text-xs font-bold truncate text-slate-900">{p.title}</p>
                  <div className="flex items-center gap-1.5 line-clamp-1">
                    {p.discountPrice ? (
                      <>
                        <p className="text-[10px] text-slate-500 line-through">৳{p.price.toFixed(0)}</p>
                        <p className="text-xs font-bold text-rose-600">৳{p.discountPrice.toFixed(0)}</p>
                      </>
                    ) : (
                      <p className="text-xs font-bold text-indigo-600">৳{p.price.toFixed(0)}</p>
                    )}
                  </div>
                </div>
                <button 
                  onClick={() => handleCompareToggle(p)}
                  className="p-1 md:hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-900 absolute -top-2 -right-2 bg-white border border-slate-200"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            {compareIds.length === 1 && (
              <div className="flex items-center justify-center bg-slate-50 border border-dashed border-slate-300 rounded px-3 py-2 w-[200px] h-[58px] shrink-0 text-xs text-slate-500 font-medium text-center">
                Select another product to compare
              </div>
            )}
          </div>
          
          <div className="flex gap-4">
            <button
              onClick={() => setShowCompareModal(true)}
              disabled={compareIds.length < 2}
              className="bg-indigo-600 text-white px-6 py-3 rounded font-bold md:hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed shadow whitespace-nowrap"
            >
              Compare Devices
            </button>
            <button
              onClick={clearCompare}
              className="bg-slate-50 text-slate-600 px-4 py-3 rounded font-medium md:hover:bg-slate-100 hidden sm:block border border-slate-200"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {showCompareModal && comparedProducts.length === 2 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h2 className="text-xl font-bold text-slate-900 flex items-center">
                <Scale className="w-5 h-5 mr-2 text-indigo-600" />
                Compare Products
              </h2>
              <button 
                onClick={() => setShowCompareModal(false)}
                className="text-slate-400 md:hover:text-slate-900 p-2"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <div className="grid grid-cols-2 gap-8 relative">
                 <div className="absolute left-1/2 top-0 bottom-0 w-px bg-slate-200 -translate-x-1/2 hidden md:block"></div>
                 {comparedProducts.map(p => (
                   <div key={p.id} className="flex flex-col relative">
                     <div className="aspect-video bg-white rounded-lg p-4 mb-4 flex items-center justify-center">
                       <img src={p.imageUrl} alt={p.title} className="max-h-40 object-contain mix-blend-multiply" />
                     </div>
                     <h3 className="font-bold text-lg text-slate-900 mb-2">{p.title}</h3>
                     <div className="mb-6 flex flex-wrap items-center gap-2">
                       {p.discountPrice ? (
                         <>
                           <span className="text-2xl font-bold text-rose-600">৳{p.discountPrice.toFixed(0)}</span>
                           <span className="text-sm font-medium text-slate-400 line-through">৳{p.price.toFixed(0)}</span>
                         </>
                       ) : (
                         <span className="text-2xl font-bold text-indigo-600">৳{p.price.toFixed(0)}</span>
                       )}
                     </div>
                     
                     <div className="space-y-4">
                       <div>
                         <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Stock Status</h4>
                         <p className="font-medium text-slate-700">{p.stockStatus}</p>
                       </div>
                       
                       {p.socket && (
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Socket</h4>
                          <p className="font-medium text-slate-700">{p.socket}</p>
                        </div>
                       )}

                       {p.wattage !== undefined && p.wattage > 0 && (
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Wattage</h4>
                          <p className="font-medium text-slate-700">{p.wattage}W</p>
                        </div>
                       )}

                       {allSpecKeys.map((key: string) => (
                         <div key={key}>
                           <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                             {key.replace(/([A-Z])/g, ' $1').trim()}
                           </h4>
                           <p className="font-medium text-slate-700">
                             {(p.specs as any)[key] || '-'}
                           </p>
                         </div>
                       ))}
                     </div>
                   </div>
                 ))}
              </div>

              {(() => {
                const getNumericValue = (val: any) => {
                  if (typeof val === 'number') return val;
                  if (typeof val === 'string') {
                    const match = val.match(/[\d.]+/);
                    return match ? parseFloat(match[0]) : null;
                  }
                  return null;
                };

                const numericSpecKeys = allSpecKeys.filter(key => {
                  return comparedProducts.some(p => {
                    const val = getNumericValue((p.specs as any)[key]);
                    return val !== null;
                  });
                });

                const chartData = numericSpecKeys.map(key => {
                  const dataObj: any = {
                    name: key.replace(/([A-Z])/g, ' $1').trim()
                  };
                  comparedProducts.forEach((p, i) => {
                    dataObj[`Product ${i + 1}`] = getNumericValue((p.specs as any)[key]) || 0;
                  });
                  return dataObj;
                });

                if (comparedProducts.some(p => p.wattage && p.wattage > 0)) {
                  const dataObj: any = { name: 'Wattage' };
                  comparedProducts.forEach((p, i) => {
                    dataObj[`Product ${i + 1}`] = p.wattage || 0;
                  });
                  chartData.unshift(dataObj);
                }

                if (chartData.length === 0) return null;

                return (
                  <div className="mt-12 border-t border-slate-200 pt-8">
                    <h3 className="text-lg font-bold text-slate-900 mb-6 text-center">Hardware Metrics Comparison</h3>
                    <div className="h-80 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={chartData}
                          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                          <XAxis dataKey="name" tick={{fill: '#64748b', fontSize: 12}} tickLine={false} axisLine={false} />
                          <YAxis tick={{fill: '#64748b', fontSize: 12}} tickLine={false} axisLine={false} />
                          <Tooltip 
                            cursor={{fill: '#f1f5f9'}}
                            contentStyle={{borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                          />
                          <Legend wrapperStyle={{paddingTop: '20px'}} />
                          <Bar dataKey="Product 1" name={comparedProducts[0].title} fill="#4f46e5" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="Product 2" name={comparedProducts[1].title} fill="#38bdf8" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
      <ScrollToTopButton />
    </div>
  );
}

