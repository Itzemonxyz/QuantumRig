import { useState, useMemo, useEffect } from 'react';
import { useStore } from '../store';
import { Product } from '../types';
import { Check, AlertTriangle, Plus, ShoppingBag, Copy, CheckCircle2 } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ScrollToTopButton from '../components/ScrollToTopButton';

export default function Builder() {
  const { categories, products, builderCart, addToBuilder, removeFromBuilder, addToCart, isLoading } = useStore();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [loadingCategory, setLoadingCategory] = useState<string | null>(null);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [copiedLink, setCopiedLink] = useState(false);
  const [isAdded, setIsAdded] = useState(false);

  useEffect(() => {
    if (activeCategory) {
      setLoadingCategory(activeCategory);
      const timer = setTimeout(() => {
        setLoadingCategory(null);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setLoadingCategory(null);
    }
  }, [activeCategory]);

  useEffect(() => {
    const buildParam = searchParams.get('build');
    if (buildParam && products.length > 0) {
      const parts = buildParam.split(',');
      parts.forEach(part => {
        const [catId, prodId] = part.split(':');
        const product = products.find(p => p.id === prodId);
        if (product) {
          addToBuilder(catId, product);
        }
      });
    }
  }, []); // Only parse on mount

  const handleCopyLink = () => {
    const buildParam = Object.entries(builderCart)
      .map(([catId, product]) => `${catId}:${product.id}`)
      .join(',');
    
    const url = new URL(window.location.origin + window.location.pathname);
    url.searchParams.set('build', buildParam);
    
    navigator.clipboard.writeText(url.toString());
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Builder Logic Check
  const compatibility = useMemo(() => {
    let warnings: string[] = [];
    const cpu = Object.values(builderCart).find(p => ['c1', 'processors'].includes(p.categoryId));
    const mobo = Object.values(builderCart).find(p => ['c2', 'motherboards'].includes(p.categoryId));
    const psu = Object.values(builderCart).find(p => ['c6', 'power-supplies'].includes(p.categoryId));

    const totalWattage = Object.values(builderCart).reduce((acc, p) => acc + (p.wattage || 0), 0);

    if (cpu && mobo && cpu.socket && mobo.socket) {
      if (cpu.socket !== mobo.socket) {
        warnings.push(`Socket Mismatch: CPU needs ${cpu.socket} but Motherboard is ${mobo.socket}`);
      }
    }

    if (psu && psu.wattage) {
       if (totalWattage > psu.wattage) {
         warnings.push(`Power Warning: Selected components use ~${totalWattage}W which exceeds PSU (${psu.wattage}W)`);
       }
    }

    return { totalWattage, warnings };
  }, [builderCart]);

  const totalCost = Object.values(builderCart).reduce((acc, p) => acc + (p.discountPrice || p.price), 0);

  const addAllToCart = () => {
    setIsAdded(true);
    Object.values(builderCart).forEach(p => addToCart(p));
    setTimeout(() => {
      navigate('/cart');
    }, 600);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Custom PC Builder</h1>
          <p className="text-slate-500 mt-2">Select parts to assemble your dream PC. We'll check basic compatibility.</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 min-w-[250px]">
          <div className="text-sm text-slate-500 mb-1">Estimated Total</div>
          <div className="text-3xl font-bold text-indigo-600">৳{Number(totalCost || 0).toFixed(2)}</div>
          <div className="text-xs text-slate-400 mt-1">Est. Wattage: {compatibility.totalWattage}W</div>
          <div className="flex gap-2 mt-4 w-full">
            <button 
              onClick={addAllToCart}
              disabled={Object.values(builderCart).length === 0}
              className={`flex-1 transition-all duration-300 py-2 rounded-lg font-medium flex items-center justify-center space-x-2 ${isAdded ? 'bg-emerald-500 text-white shadow-lg' : 'bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white'}`}
            >
              {isAdded ? (
                <>
                  <CheckCircle2 className="w-4 h-4 animate-in zoom-in" />
                  <span>Added!</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4" />
                  <span>Add All to Cart</span>
                </>
              )}
            </button>
            <button
              onClick={handleCopyLink}
              disabled={Object.values(builderCart).length === 0}
              className="bg-slate-100 hover:bg-slate-200 disabled:bg-slate-50 disabled:text-slate-300 text-slate-700 py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center"
              title="Copy shareable link"
            >
              {copiedLink ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <Copy className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {compatibility.warnings.length > 0 && (
        <div className="mb-8 p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-rose-500 mt-0.5" />
          <div>
            <h4 className="font-bold text-rose-800">Compatibility Warnings</h4>
            <ul className="list-disc ml-5 mt-2 space-y-1 text-sm text-rose-700">
              {compatibility.warnings.map((w, i) => <li key={i}>{w}</li>)}
            </ul>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="col-span-1 lg:col-span-2 space-y-4">
          {categories.map(category => {
            const selected = builderCart[category.id];
            
            return (
              <div key={category.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div 
                  className={`p-4 flex items-center justify-between cursor-pointer transition-colors ${activeCategory === category.id ? 'bg-indigo-50 border-b border-indigo-100' : 'hover:bg-slate-50'}`}
                  onClick={() => setActiveCategory(activeCategory === category.id ? null : category.id)}
                >
                  <div className="flex items-center space-x-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${selected ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                       {selected ? <Check className="w-5 h-5" /> : category.name.substring(0, 1)}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">{category.name}</h3>
                      {selected ? (
                        <p className="text-sm font-medium text-indigo-600 line-clamp-1">{selected.title}</p>
                      ) : (
                        <p className="text-sm text-slate-400">Not selected</p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    {selected && (
                      <div className="flex flex-col items-end">
                        {selected.discountPrice ? (
                          <>
                            <span className="text-[10px] sm:text-xs text-slate-500 line-through">৳{Number(selected.price || 0).toFixed(2)}</span>
                            <span className="font-bold text-rose-600">৳{Number(selected.discountPrice || 0).toFixed(2)}</span>
                          </>
                        ) : (
                          <span className="font-bold text-slate-900">৳{Number(selected.price || 0).toFixed(2)}</span>
                        )}
                      </div>
                    )}
                    {selected && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); removeFromBuilder(category.id); }}
                        className="text-xs text-rose-500 hover:underline mt-1"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
                
                {/* Product Selection Drawer */}
                {activeCategory === category.id && (
                  <div className="p-4 bg-slate-50 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 border-t border-slate-200">
                    {loadingCategory === category.id || isLoading ? (
                      Array.from({ length: 3 }).map((_, idx) => (
                        <div 
                          key={`loader-${idx}`}
                          className="product-card-container relative bg-white rounded-xl border border-slate-200 flex flex-col overflow-hidden animate-pulse h-full min-h-[340px] pointer-events-none"
                        >
                          <div className="p-4 flex justify-center items-center h-36 relative bg-slate-100/50">
                            {/* Shimmer Image Box */}
                            <div className="w-24 h-24 bg-slate-200 rounded-lg"></div>
                          </div>
                          <div className="p-4 flex-1 flex flex-col bg-slate-50/50 space-y-3">
                            {/* Shimmer Title lines */}
                            <div className="space-y-2">
                              <div className="h-4 bg-slate-200 rounded w-11/12"></div>
                              <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                            </div>
                            
                            {/* Shimmer Specs pills */}
                            <div className="flex flex-wrap gap-1.5 pt-2">
                              <div className="h-5 bg-slate-200 rounded-lg w-16"></div>
                              <div className="h-5 bg-slate-200 rounded-lg w-12"></div>
                              <div className="h-5 bg-slate-200 rounded-lg w-20"></div>
                            </div>
                            
                            {/* Shimmer Bottom footer */}
                            <div className="mt-auto pt-4 border-t border-slate-200/60 flex justify-between items-center">
                              <div className="space-y-1">
                                <div className="h-3 bg-slate-200 rounded w-8"></div>
                                <div className="h-5 bg-slate-200 rounded w-16"></div>
                              </div>
                              <div className="h-8 bg-slate-200 rounded-lg w-16"></div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <>
                        {products.filter(p => p.categoryId === category.id).map(p => {
                          const isSelected = selected?.id === p.id;
                          return (
                            <div 
                              key={p.id} 
                              className={`product-card-container relative bg-white rounded-xl border-2 flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-lg cursor-pointer ${isSelected ? 'border-indigo-600 shadow-md ring-2 ring-indigo-600/20' : 'border-slate-200 hover:border-indigo-300'}`}
                              onClick={() => {
                                if (isSelected) {
                                  removeFromBuilder(category.id);
                                } else {
                                  addToBuilder(category.id, p);
                                  setActiveCategory(categories.find((_, i) => categories[i].id === category.id && i < categories.length - 1 ? categories[i+1].id : null)?.id ?? null);
                                }
                              }}
                            >
                              {isSelected && (
                                <div className="absolute top-3 left-3 z-10 bg-indigo-600 text-white rounded-full p-1.5 shadow-sm">
                                  <Check className="w-4 h-4" />
                                </div>
                              )}
                              <div className="p-4 flex justify-center h-36 relative bg-white rounded-t-xl group border-b border-slate-100">
                                <img src={p.imageUrl} className="max-w-full h-full object-contain mix-blend-multiply transition-transform group-hover:scale-105 duration-300" alt={p.title} />
                              </div>
                              <div className="p-4 flex-1 flex flex-col bg-slate-50/50 rounded-b-xl">
                                <h4 className="font-medium text-slate-900 text-sm line-clamp-2 mb-2" title={p.title}>{p.title}</h4>
                                <div className="text-[10px] text-slate-500 mb-3 flex flex-wrap gap-1.5 line-clamp-2">
                                   {Object.entries(p.specs || {}).slice(0, 3).map(([k, v]) => (
                                     <span key={k} className="bg-white border border-slate-200 px-1.5 py-0.5 rounded shadow-sm">{k}: {v as string}</span>
                                   ))}
                                   {p.socket && <span className="bg-indigo-50 border border-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded shadow-sm">Socket: {p.socket}</span>}
                                </div>
                                <div className="mt-auto pt-3 border-t border-slate-200 flex justify-between items-center gap-2 grow-0 shrink-0">
                                  <div className="flex flex-col items-start whitespace-nowrap">
                                    {p.discountPrice ? (
                                      <>
                                        <span className="text-[10px] text-slate-500 line-through">৳{Number(p.price || 0).toFixed(2)}</span>
                                        <span className="font-bold text-rose-600 text-sm">৳{Number(p.discountPrice || 0).toFixed(2)}</span>
                                      </>
                                    ) : (
                                      <span className="font-bold text-slate-900 text-sm">৳{Number(p.price || 0).toFixed(2)}</span>
                                    )}
                                  </div>
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (isSelected) {
                                        removeFromBuilder(category.id);
                                      } else {
                                        addToBuilder(category.id, p);
                                        setActiveCategory(categories.find((_, i) => categories[i].id === category.id && i < categories.length - 1 ? categories[i+1].id : null)?.id ?? null);
                                      }
                                    }}
                                    className={`text-xs px-3 py-1.5 rounded-lg flex items-center space-x-1 font-bold transition-colors ${isSelected ? 'bg-rose-100 text-rose-700 hover:bg-rose-200' : 'bg-indigo-600 text-white hover:bg-indigo-500'}`}
                                  >
                                    {isSelected ? <span>Remove</span> : <span>Select</span>}
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        {products.filter(p => p.categoryId === category.id).length === 0 && (
                          <div className="col-span-full py-8 text-center text-slate-500 bg-white rounded-xl border border-slate-200">
                            No products found in this category.
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="col-span-1 border-t md:border-t-0 md:border-l border-slate-200 pt-8 md:pt-0 md:pl-8">
           <h3 className="font-bold text-lg mb-4 text-slate-900 tracking-tight">Your Build Summary</h3>
           {Object.values(builderCart).length === 0 ? (
             <div className="text-slate-500 text-sm p-8 bg-slate-100 rounded-xl text-center border border-dashed border-slate-300">
               Your build is empty. Select components to start building.
             </div>
           ) : (
             <div className="space-y-4">
                {Object.values(builderCart).map(p => (
                  <div key={p.id} className="flex justify-between items-start text-sm">
                    <span className="text-slate-600 max-w-[200px] line-clamp-2">{p.title}</span>
                    <span className="font-bold text-slate-900 block ml-4 whitespace-nowrap">৳{Number(p.discountPrice || p.price || 0).toFixed(2)}</span>
                  </div>
                ))}
                <div className="pt-4 border-t border-slate-200 mt-6 flex justify-between items-center text-lg font-bold text-slate-900">
                  <span>Total</span>
                  <span>৳{Number(totalCost || 0).toFixed(2)}</span>
                </div>
             </div>
           )}
        </div>
      </div>
      <ScrollToTopButton />
    </div>
  );
}
