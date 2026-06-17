import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useStore } from '../../store';
import { api } from '../../lib/api';
import { Product } from '../../types';
import { 
  ArrowUpDown, Plus, Minus, Trash2, X, PackagePlus, Copy, AlertCircle, GripVertical, 
  UploadCloud, Image as ImageIcon, FileImage, Check, Sparkles, Coins, Eye, Tag, Folder, 
  PlusCircle, CheckCircle2, ChevronRight, Sliders, Shield, RefreshCw, Layers, ArrowLeft, Cpu, Upload
} from 'lucide-react';
import { motion } from 'motion/react';
import TakaIcon from '../../components/TakaIcon';
import Papa from 'papaparse';

interface SuggestionItem {
  id: string;
  name: string;
  subText?: string;
  payload?: any;
}

function AutocompleteInput({
  label,
  value,
  onChange,
  onSelectSuggestion,
  suggestions,
  placeholder,
  required = false,
  type = "text",
  icon: Icon
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  onSelectSuggestion: (item: SuggestionItem) => void;
  suggestions: SuggestionItem[];
  placeholder?: string;
  required?: boolean;
  type?: string;
  icon?: any;
}) {
  const [showDropdown, setShowDropdown] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = suggestions.filter(s => 
    s.name.toLowerCase().includes((value || '').toLowerCase())
  ).slice(0, 5);

  return (
    <div ref={containerRef} className="relative w-full">
      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">{label}</label>
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <input
          required={required}
          type={type}
          placeholder={placeholder}
          value={value}
          onFocus={() => setShowDropdown(true)}
          onChange={(e) => {
            onChange(e.target.value);
            setShowDropdown(true);
          }}
          className={`w-full bg-white dark:bg-slate-900 border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl py-2.5 ${Icon ? 'pl-10' : 'px-3.5'} pr-4 text-sm font-medium text-slate-800 dark:text-slate-200 transition-all outline-none`}
        />
      </div>
      {showDropdown && filtered.length > 0 && (
        <div className="absolute z-50 w-full mt-1.5 bg-white dark:bg-slate-900 border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto overflow-x-hidden divide-y divide-slate-50 animate-in fade-in duration-150">
          {filtered.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                onSelectSuggestion(item);
                setShowDropdown(false);
              }}
              className="w-full text-left px-4 py-2.5 hover:bg-slate-50 dark:bg-slate-950 transition-colors flex flex-col pointer-events-auto"
            >
              <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{item.name}</span>
              {item.subText && <span className="text-[11px] text-slate-400 font-medium mt-0.5">{item.subText}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ProductsTab() {
  const location = useLocation();
  const { products, categories, brands, setProducts, token, addToast } = useStore();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<Partial<Product>>({
    title: '', slug: '', categoryId: '', price: 0, stockStatus: 'In Stock', imageUrl: '', description: '', specs: {}, socket: '', wattage: 0, inventoryCount: 0
  });
  const [specsText, setSpecsText] = useState('');
  const [additionalImagesText, setAdditionalImagesText] = useState('');
  const [imageList, setImageList] = useState<string[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  const queryParams = new URLSearchParams(location.search);
  const [searchQuery, setSearchQuery] = useState(queryParams.get('q') || '');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkStockAction, setBulkStockAction] = useState('');
  const [bulkPriceValue, setBulkPriceValue] = useState<number | ''>('');
  const [sortField, setSortField] = useState<string>('custom');

  // Drag and drop state
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);
  const [dragOverItemIndex, setDragOverItemIndex] = useState<number | null>(null);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  const [searchedProducts, setSearchedProducts] = useState<Product[]>([]);
  const [adjustingStockId, setAdjustingStockId] = useState<string | null>(null);
  const [adjustAmounts, setAdjustAmounts] = useState<Record<string, number>>({});

  // Allow manual mouse wheel scrolling and edge auto-scrolling during drag operations
  useEffect(() => {
    if (activeDragId === null && draggedItemIndex === null) return;

    let animationFrameId: number;
    let currentY = 0;

    const handleGlobalWheel = (e: WheelEvent) => {
      window.scrollBy({
        top: e.deltaY,
        behavior: 'auto'
      });
    };

    const handleGlobalDragOver = (e: DragEvent) => {
      currentY = e.clientY;
    };

    const handleGlobalTouchMove = (e: TouchEvent) => {
      if (e.touches && e.touches[0]) {
        currentY = e.touches[0].clientY;
      }
    };

    const scrollCheck = () => {
      if (activeDragId === null && draggedItemIndex === null) return;

      const threshold = 120; // proximity in pixels to top/bottom of screen
      const maxSpeed = 15;   // maximum scrolling speed
      const viewportHeight = window.innerHeight;

      if (currentY > 0) {
        if (currentY < threshold) {
          // scroll up: speed proportional to how close you are to the top
          const factor = (threshold - currentY) / threshold;
          const speed = Math.max(2, Math.round(factor * maxSpeed));
          window.scrollBy(0, -speed);
        } else if (currentY > viewportHeight - threshold) {
          // scroll down: speed proportional to how close you are to the bottom
          const factor = (currentY - (viewportHeight - threshold)) / threshold;
          const speed = Math.max(2, Math.round(factor * maxSpeed));
          window.scrollBy(0, speed);
        }
      }

      animationFrameId = requestAnimationFrame(scrollCheck);
    };

    window.addEventListener('wheel', handleGlobalWheel, { passive: true });
    window.addEventListener('dragover', handleGlobalDragOver);
    window.addEventListener('touchmove', handleGlobalTouchMove, { passive: true });
    animationFrameId = requestAnimationFrame(scrollCheck);

    return () => {
      window.removeEventListener('wheel', handleGlobalWheel);
      window.removeEventListener('dragover', handleGlobalDragOver);
      window.removeEventListener('touchmove', handleGlobalTouchMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, [activeDragId, draggedItemIndex]);

  useEffect(() => {
    const q = new URLSearchParams(location.search).get('q');
    if (q !== null && q !== searchQuery) {
      setSearchQuery(q);
    }
  }, [location.search]);

  useEffect(() => {
    const fetchSearch = async () => {
      try {
        if (!searchQuery.trim()) {
           setSearchedProducts(products);
           return;
        }
        const results = await api.get(`/admin/products/search?q=${encodeURIComponent(searchQuery)}`, token);
        setSearchedProducts(results);
      } catch (err) {
        console.error(err);
      }
    };
    
    // Simple debounce
    const timer = setTimeout(() => {
      fetchSearch();
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchQuery, products, token]);

  const sortedProducts = [...searchedProducts].sort((a, b) => {
    if (sortField === 'custom') {
      return (a.order ?? 99999) - (b.order ?? 99999);
    }
    if (sortField === 'name_asc') {
      return a.title.localeCompare(b.title);
    }
    if (sortField === 'name_desc') {
      return b.title.localeCompare(a.title);
    }
    if (sortField === 'price_asc') {
      return a.price - b.price;
    }
    if (sortField === 'price_desc') {
      return b.price - a.price;
    }
    if (sortField === 'stock_asc') {
      const aStock = a.inventoryCount || 0;
      const bStock = b.inventoryCount || 0;
      return aStock - bStock;
    }
    if (sortField === 'stock_desc') {
      const aStock = a.inventoryCount || 0;
      const bStock = b.inventoryCount || 0;
      return bStock - aStock;
    }
    if (sortField === 'category_asc') {
      const aCat = categories.find(c => c.id === a.categoryId)?.name || '';
      const bCat = categories.find(c => c.id === b.categoryId)?.name || '';
      return aCat.localeCompare(bCat);
    }
    if (sortField === 'brand_asc') {
      const aBrand = a.brand || '';
      const bBrand = b.brand || '';
      return aBrand.localeCompare(bBrand);
    }
    return (a.order ?? 99999) - (b.order ?? 99999);
  });

  // Custom Touch Event handlers for seamless mobile drag and drop support
  const handleTouchStart = (e: React.TouchEvent, index: number) => {
    if (sortField !== 'custom') return;
    setDraggedItemIndex(index);
    setDragOverItemIndex(index);
    setActiveDragId(sortedProducts[index].id);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (sortField !== 'custom') return;
    const touch = e.touches[0];
    const targetElement = document.elementFromPoint(touch.clientX, touch.clientY);
    const row = targetElement?.closest('[data-index]');
    if (row) {
      const indexAttr = row.getAttribute('data-index');
      if (indexAttr !== null) {
        const hoverIndex = parseInt(indexAttr, 10);
        if (!isNaN(hoverIndex) && hoverIndex !== dragOverItemIndex) {
          setDragOverItemIndex(hoverIndex);
        }
      }
    }
  };

  const handleTouchEnd = () => {
    handleDragEnd();
  };

  const handleDragStart = (index: number) => {
    if (sortField !== 'custom') return;
    setDraggedItemIndex(index);
  };

  const handleDragEnter = (index: number) => {
    if (sortField !== 'custom') return;
    setDragOverItemIndex(index);
  };

  const handleDragEnd = async () => {
    setActiveDragId(null);
    if (draggedItemIndex === null || dragOverItemIndex === null || draggedItemIndex === dragOverItemIndex) {
      setDraggedItemIndex(null);
      setDragOverItemIndex(null);
      return;
    }

    const newSorted = [...sortedProducts];
    const draggedItem = newSorted[draggedItemIndex];
    newSorted.splice(draggedItemIndex, 1);
    newSorted.splice(dragOverItemIndex, 0, draggedItem);

    const updatedProductsList = [...products];
    newSorted.forEach((p, idx) => {
      const mainIdx = updatedProductsList.findIndex(mp => mp.id === p.id);
      if (mainIdx > -1) {
        updatedProductsList[mainIdx].order = idx;
      }
    });
    updatedProductsList.sort((a, b) => (a.order ?? 99999) - (b.order ?? 99999));

    setProducts(updatedProductsList);
    setDraggedItemIndex(null);
    setDragOverItemIndex(null);
    
    try {
       await api.post('/products/reorder', { reorderedProducts: updatedProductsList }, token);
       const updated = await api.get('/products');
       setProducts(updated);
    } catch (e) {
       addToast("Failed to save product order", "error");
       const original = await api.get('/products');
       setProducts(original);
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(sortedProducts.map(p => p.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectProduct = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleBulkUpdateStock = async () => {
    if (!bulkStockAction || selectedIds.length === 0) return;
    setLoading(true);
    for (const id of selectedIds) {
      const p = products.find(p => p.id === id);
      if (p) {
        await api.put(`/products/${id}`, { ...p, stockStatus: bulkStockAction }, token);
      }
    }
    const updated = await api.get('/products');
    setProducts(updated);
    addToast(`Successfully updated stock for ${selectedIds.length} products!`, 'success');
    setSelectedIds([]);
    setBulkStockAction('');
    setLoading(false);
  };

  const handleBulkUpdatePrice = async () => {
    if (bulkPriceValue === '' || selectedIds.length === 0) return;
    setLoading(true);
    for (const id of selectedIds) {
      const p = products.find(p => p.id === id);
      if (p) {
        await api.put(`/products/${id}`, { ...p, price: Number(bulkPriceValue) }, token);
      }
    }
    const updated = await api.get('/products');
    setProducts(updated);
    addToast(`Successfully updated price for ${selectedIds.length} products!`, 'success');
    setSelectedIds([]);
    setBulkPriceValue('');
    setLoading(false);
  };

  const handleClone = (p: Product) => {
    const { id, code, ...rest } = p;
    let newCode = code || '';
    if (newCode) newCode = `${newCode}-CLONE`;
    
    setForm({ 
      ...rest, 
      title: `${rest.title} (Clone)`, 
      code: newCode,
      variants: p.variants || [],
      warranty: p.warranty || ''
    });
    setSpecsText(Object.entries(p.specs || {}).map(([k, v]) => `${k}:${v}`).join('\n'));
    setAdditionalImagesText(p.additionalImages?.join('\n') || '');
    setImageList([p.imageUrl, ...(p.additionalImages || [])].filter(Boolean));
    setIsEditing(true);
  };

  const handleEdit = (p: Product) => {
    setForm({
      ...p,
      variants: p.variants || [],
      warranty: p.warranty || ''
    });
    setSpecsText(Object.entries(p.specs || {}).map(([k, v]) => `${k}:${v}`).join('\n'));
    setAdditionalImagesText(p.additionalImages?.join('\n') || '');
    setImageList([p.imageUrl, ...(p.additionalImages || [])].filter(Boolean));
    setIsEditing(true);
  };

  const handleNew = () => {
    setForm({ 
      title: '', 
      slug: '', 
      categoryId: categories[0]?.id || '', 
      price: 0, 
      stockStatus: 'In Stock', 
      imageUrl: '', 
      description: '', 
      specs: {}, 
      socket: '', 
      wattage: 0, 
      inventoryCount: 0,
      variants: [],
      warranty: ''
    });
    setSpecsText('');
    setAdditionalImagesText('');
    setImageList([]);
    setIsEditing(true);
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await api.delete(`/products/${id}`, token);
      const updated = await api.get('/products');
      setProducts(updated);
    } catch (e) {
      console.error(e);
      alert('Failed to delete product');
    } finally {
      setDeletingId(null);
    }
  };

  const handleSetStock = async (p: Product, newInventoryCount: number) => {
    try {
      const sanitizedCount = Math.max(0, newInventoryCount);
      const newStockStatus = sanitizedCount > 0 ? 'In Stock' : 'Out of Stock';
      const payload = {
        ...p,
        inventoryCount: sanitizedCount,
        stockStatus: newStockStatus
      };
      await api.put(`/products/${p.id}`, payload, token);
      const updated = await api.get('/products');
      setProducts(updated);
      addToast(`Updated stock count for ${p.title} to ${sanitizedCount}!`, 'success');
    } catch (e) {
      console.error(e);
      addToast('Failed to update stock count', 'error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (form.discountPrice && form.price && form.discountPrice > form.price) {
      alert("Offer Price cannot be higher than Regular Price.");
      setLoading(false);
      return;
    }
    
    // Parse specs
    const specs: Record<string, string> = {};
    specsText.split('\n').forEach(line => {
      const [k, v] = line.split(':');
      if (k && v) specs[k.trim()] = v.trim();
    });

    const mainImageUrl = imageList[0] || form.imageUrl || '';
    const additionalImagesList = imageList.length > 1 ? imageList.slice(1) : [];

    const payload = { 
      ...form, 
      imageUrl: mainImageUrl, 
      additionalImages: additionalImagesList, 
      specs 
    };

    try {
      if (form.id) {
        await api.put(`/products/${form.id}`, payload, token);
      } else {
        await api.post('/products', payload, token);
      }
      const updated = await api.get('/products');
      setProducts(updated);
      setIsEditing(false);
      addToast(form.id ? 'Product updated successfully!' : 'Product created successfully!', 'success');
    } catch (e) {
      alert('Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  if (isEditing) {
    // Computed recommendations for the active category
    const activeCategoryProducts = products.filter(p => p.categoryId === form.categoryId);
    const avgPrice = activeCategoryProducts.length > 0 
      ? Math.round(activeCategoryProducts.reduce((sum, p) => sum + (p.price || 0), 0) / activeCategoryProducts.length) 
      : 0;

    const handleFilesUpload = async (files: FileList) => {
      const imagesToLoad = Array.from(files).slice(0, 5); // accept up to 5 images at once
      addToast(`Uploading ${imagesToLoad.length} asset(s) to cloud storage...`, "info");
      
      for (const file of imagesToLoad) {
        const reader = new FileReader();
        reader.onload = async (e) => {
          const resultObj = e.target?.result;
          if (typeof resultObj === 'string') {
             try {
                const res = await api.post('/upload', { image: resultObj }, token);
                const finalUrl = res?.url || resultObj;
                setImageList(prev => {
                  if (prev.includes(finalUrl)) return prev;
                  return [...prev, finalUrl];
                });
             } catch (err) {
                console.error("Image upload failed", err);
                setImageList(prev => [...prev, resultObj]);
             }
          }
        };
        reader.readAsDataURL(file);
      }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        handleFilesUpload(e.target.files);
      }
    };

    return (
      <div className="p-6 max-w-7xl mx-auto col-span-12">
        {/* Workspace Header with Innovative Console theme */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 p-6 mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm select-none">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-1.5">
              <Shield className="w-3.5 h-3.5 shrink-0" />
              <span>Admin Center // Instant Launcher</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              {form.id ? `Edit Product // ${form.title || 'Draft'}` : 'Launch New Product'}
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button 
              type="button"
              onClick={() => {
                setForm({ title: '', slug: '', categoryId: categories[0]?.id || '', price: 0, stockStatus: 'In Stock', imageUrl: '', description: '', specs: {}, socket: '', wattage: 0, inventoryCount: 0 });
                setImageList([]);
                setSpecsText('');
                addToast("Cleared editing draft template!", "success");
              }}
              className="px-4 py-2 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5 border border-slate-200"
            >
              <RefreshCw className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              Reset Form
            </button>
            <button 
              type="button"
              onClick={() => setIsEditing(false)} 
              className="p-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-white rounded-xl transition-all border border-transparent flex items-center justify-center"
              title="Return to general products table"
            >
              <ArrowLeft className="w-5 h-5"/>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN: Data Fields Form (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* BOX 1: General HW Details */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100 mb-2">
                <FileImage className="w-4 h-4 text-indigo-500 shrink-0" />
                <h3 className="font-bold text-slate-800 dark:text-slate-200 text-xs uppercase tracking-widest">Metadata General Configuration</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Product Code */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Product Code (Optional)</label>
                  <input 
                    type="text" 
                    value={form.code || ''} 
                    onChange={e => setForm({...form, code: e.target.value})} 
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 focus:border-indigo-500 focus:bg-white dark:bg-slate-900 focus:ring-2 focus:ring-indigo-100 rounded-xl py-2.5 px-3.5 text-sm font-mono text-slate-800 dark:text-slate-200 transition-all outline-none" 
                    placeholder="Auto-generated if empty" 
                  />
                </div>

                {/* Autocomplete Title with Clone template feature */}
                <div className="relative">
                  <AutocompleteInput 
                    label="Product Title"
                    placeholder="Enter model name (e.g. Core i9 / RTX 4090)"
                    value={form.title || ''}
                    required
                    onChange={(val) => {
                      setForm({...form, title: val, slug: (val || '').toLowerCase().replace(/[^a-z0-9]+/g, '-')});
                    }}
                    suggestions={products.map(p => ({
                      id: p.id,
                      name: p.title,
                      subText: `${p.brand || 'Hardware'} - ৳${p.price.toLocaleString()}`,
                      payload: p
                    }))}
                    onSelectSuggestion={(item) => {
                      const p = item.payload;
                      if (p) {
                        const confirmTemplate = window.confirm(`Rapid Launch: Use "${p.title}" as a boilerplate baseline template to fill up categories, brand, price and specifications?`);
                        if (confirmTemplate) {
                          setForm({
                            ...form,
                            title: p.title,
                            slug: (p.title || '').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                            brand: p.brand || '',
                            categoryId: p.categoryId,
                            price: p.price,
                            discountPrice: p.discountPrice,
                            description: p.description,
                            socket: p.socket || '',
                            wattage: p.wattage || 0,
                            stockStatus: p.stockStatus,
                            inventoryCount: p.inventoryCount || 0
                          });
                          setSpecsText(Object.entries(p.specs || {}).map(([k, v]) => `${k}:${v}`).join('\n'));
                          setImageList([p.imageUrl, ...(p.additionalImages || [])].filter(Boolean));
                          addToast("Quick boilerplate template imported!", "success");
                        } else {
                          setForm({...form, title: p.title, slug: (p.title || '').toLowerCase().replace(/[^a-z0-9]+/g, '-')});
                        }
                      }
                    }}
                    icon={Cpu}
                  />
                </div>

                {/* Autocomplete Brand */}
                <div className="relative">
                  <AutocompleteInput 
                    label="Brand Name"
                    placeholder="ASUS, Intel, MSI, AMD, etc."
                    value={form.brand || ''}
                    onChange={(val) => setForm({...form, brand: val})}
                    suggestions={brands.map(b => ({
                      id: b.id,
                      name: b.name,
                      subText: 'Verified Manufacturer'
                    }))}
                    onSelectSuggestion={(item) => {
                      setForm({...form, brand: item.name});
                    }}
                    icon={Tag}
                  />
                </div>

                {/* Autocomplete Category */}
                <div className="relative">
                  <AutocompleteInput 
                    label="Official Category"
                    placeholder="Search or enter PC category"
                    value={categories.find(c => c.id === form.categoryId)?.name || ''}
                    required
                    onChange={(val) => {
                      const matched = categories.find(c => (c.name || '').toLowerCase() === val.toLowerCase());
                      if (matched) {
                        setForm({...form, categoryId: matched.id});
                      } else {
                        setForm({...form, categoryId: val}); 
                      }
                    }}
                    suggestions={categories.map(c => ({
                      id: c.id,
                      name: c.name,
                      subText: 'Active System Category'
                    }))}
                    onSelectSuggestion={(item) => {
                      setForm({...form, categoryId: item.id});
                    }}
                    icon={Folder}
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Detailed Description</label>
                <textarea 
                  required 
                  value={form.description || ''} 
                  onChange={e => setForm({...form, description: e.target.value})} 
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl py-2.5 px-3.5 text-sm text-slate-800 dark:text-slate-200 transition-all outline-none" 
                  rows={3}
                  placeholder="Review the technical specifications and specify details to capture customers..."
                />
              </div>
            </div>

            {/* BOX 2: Pricing, Stock, and Inventory Controls */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100">
                <Coins className="w-4 h-4 text-emerald-500 shrink-0" />
                <h3 className="font-bold text-slate-800 dark:text-slate-200 text-xs uppercase tracking-widest">Pricing & Stock Metrics</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Regular Price input with automatic smart recommendations */}
                <div className="relative">
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 font-sans">Regular Price (৳)</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-bold text-sm">৳</span>
                    <input 
                      required 
                      type="number" 
                      step="0.01" 
                      value={form.price === undefined || isNaN(form.price) ? '' : form.price} 
                      onChange={e => setForm({...form, price: parseFloat(e.target.value)})} 
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl py-2.5 pl-8 pr-4 text-sm font-semibold text-slate-800 dark:text-slate-200 transition-all outline-none" 
                    />
                  </div>
                  {avgPrice > 0 && (
                    <button
                      type="button"
                      onClick={() => setForm({...form, price: avgPrice})}
                      className="mt-1.5 text-[11px] text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      MSRP Suggestion (৳{avgPrice.toLocaleString()})
                    </button>
                  )}
                </div>

                {/* Offer Price input with dynamic calculation */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 font-sans">Offer / Special Price (Optional)</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-bold text-sm">৳</span>
                    <input 
                      type="number" 
                      step="0.01" 
                      value={form.discountPrice === undefined || isNaN(form.discountPrice) ? '' : form.discountPrice} 
                      onChange={e => setForm({...form, discountPrice: e.target.value ? parseFloat(e.target.value) : undefined})} 
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl py-2.5 pl-8 pr-4 text-sm font-semibold text-slate-800 dark:text-slate-200 transition-all outline-none" 
                    />
                  </div>
                  {form.price ? (
                    <button
                      type="button"
                      onClick={() => setForm({...form, discountPrice: Math.round(form.price! * 0.95)})}
                      className="mt-1.5 text-[11px] text-emerald-600 hover:text-emerald-800 font-bold flex items-center gap-1 transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Calculate 5% Promo discount (৳{Math.round(form.price * 0.95).toLocaleString()})
                    </button>
                  ) : null}
                </div>

                {/* Stock Status Selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 font-sans">Warehouse Stock Status</label>
                  <select 
                    value={form.stockStatus || 'In Stock'} 
                    onChange={e => setForm({...form, stockStatus: e.target.value as any})} 
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl py-2.5 px-3.5 text-sm font-medium text-slate-800 dark:text-slate-200 outline-none transition-all cursor-pointer"
                  >
                    <option value="In Stock">In Stock (Active Selling)</option>
                    <option value="Low Stock">Low Stock Alert</option>
                    <option value="Out of Stock">Out of Stock</option>
                    <option value="Discontinued">Discontinued (Archived)</option>
                  </select>
                </div>

                {/* Inventory Stock Count */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 font-sans">Warehouse Item Count</label>
                  <input 
                    required 
                    type="number" 
                    min="0" 
                    value={form.inventoryCount === undefined || isNaN(form.inventoryCount) ? '' : form.inventoryCount} 
                    onChange={e => {
                      const count = parseInt(e.target.value) || 0;
                      setForm({
                        ...form, 
                        inventoryCount: count,
                        stockStatus: count > 0 ? 'In Stock' : 'Out of Stock'
                      });
                    }} 
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl py-2.5 px-3.5 text-sm font-semibold text-slate-850 outline-none transition-all" 
                  />
                </div>
              </div>
            </div>

            {/* BOX 3: Technical Specs (Socket, Wattage, Key-Value) */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100">
                <Sliders className="w-4 h-4 text-amber-500 shrink-0" />
                <h3 className="font-bold text-slate-800 dark:text-slate-200 text-xs uppercase tracking-widest">Hardware Characteristics</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Socket Support (Optional)</label>
                  <input 
                    type="text" 
                    value={form.socket || ''} 
                    onChange={e => setForm({...form, socket: e.target.value})} 
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl py-2.5 px-3.5 text-sm font-medium text-slate-800 dark:text-slate-200 transition-all outline-none" 
                    placeholder="e.g. LGA1700, AM5"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Power Budget (Wattage)</label>
                  <input 
                    type="number" 
                    value={form.wattage === undefined || isNaN(form.wattage) ? '' : form.wattage} 
                    onChange={e => setForm({...form, wattage: parseInt(e.target.value)})} 
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl py-2.5 px-3.5 text-sm font-medium text-slate-800 dark:text-slate-200 transition-all outline-none" 
                    placeholder="e.g. 125, 750"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Custom Key:Value Specs (One per line)</label>
                <textarea 
                  value={specsText} 
                  onChange={e => setSpecsText(e.target.value)} 
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl py-2.5 px-3.5 text-sm font-mono text-slate-700 dark:text-slate-300 transition-all outline-none" 
                  rows={4} 
                  placeholder="Cores:24&#10;Threads:32&#10;Base Clock:3.2 GHz&#10;Memory Type:DDR5"
                />
              </div>
            </div>

            {/* BOX 4: Variants & Warranty Controls */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100">
                <Layers className="w-4 h-4 text-indigo-500 shrink-0" />
                <h3 className="font-bold text-slate-850 text-xs uppercase tracking-widest font-sans">Variants & Warranty Panels</h3>
              </div>
              
              {/* Warranty Segment */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Product Warranty Segment</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Shield className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={form.warranty || ''}
                    onChange={e => setForm({ ...form, warranty: e.target.value })}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl py-2.5 pl-10 pr-4 text-sm font-medium text-slate-800 dark:text-slate-200 transition-all outline-none"
                    placeholder="e.g. 3 Years Brand Warranty, No Warranty"
                  />
                </div>
                <div className="flex flex-wrap gap-1.5 mt-1 select-none">
                  {['No Warranty', '1 Year Warranty', '2 Years Warranty', '3 Years Brand Warranty', 'Lifetime Warranty'].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setForm({ ...form, warranty: preset })}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition-all ${
                        form.warranty === preset 
                          ? 'bg-indigo-50 border-indigo-200 text-indigo-600' 
                          : 'bg-slate-50 dark:bg-slate-950 border-slate-200 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:bg-slate-800'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Variants Dynamic Panel */}
              <div className="border-t border-slate-100 pt-4 space-y-4">
                <div className="flex items-center justify-between select-none">
                  <div>
                    <span className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Dynamic Variants System</span>
                    <span className="text-[10px] text-slate-400 font-medium">Add product choices (e.g. Color, Type, RAM option)</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const currentVariants = form.variants || [];
                      setForm({
                        ...form,
                        variants: [...currentVariants, { name: '', options: [] }]
                      });
                    }}
                    className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 text-indigo-600 hover:text-indigo-700 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all flex items-center gap-1 shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    New Variant
                  </button>
                </div>

                {(!form.variants || form.variants.length === 0) ? (
                  <div className="text-center py-6 border border-dashed border-slate-200 rounded-xl bg-slate-50/50 select-none col-span-12">
                    <Sliders className="w-8 h-8 text-slate-300 mx-auto mb-1.5 stroke-1" />
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">No Active Product Variants</span>
                    <span className="text-[10px] text-slate-400">Variant panel will remain closed for this model.</span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {form.variants.map((v, vIdx) => (
                      <div key={vIdx} className="p-4 border border-slate-200 rounded-xl bg-slate-50/40 relative group/var">
                        <button
                          type="button"
                          onClick={() => {
                            const updated = (form.variants || []).filter((_, idx) => idx !== vIdx);
                            setForm({ ...form, variants: updated });
                          }}
                          className="absolute top-3 right-3 text-slate-400 hover:text-rose-500 transition-colors p-1"
                          title="Remove Variant option type"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                          <div className="md:col-span-4">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Variant Name</label>
                            <input
                              type="text"
                              required
                              value={v.name}
                              onChange={(e) => {
                                const updated = [...(form.variants || [])];
                                updated[vIdx] = { ...updated[vIdx], name: e.target.value };
                                setForm({ ...form, variants: updated });
                              }}
                              className="w-full bg-white dark:bg-slate-900 border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 rounded-lg py-1.5 px-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 transition-all outline-none"
                              placeholder="e.g. Color, Size, RAM"
                            />
                          </div>

                          <div className="md:col-span-8 pr-6">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Add Options</label>
                            <div className="flex gap-1.5">
                              <input
                                id={`new-option-${vIdx}`}
                                type="text"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    const input = e.currentTarget;
                                    const val = input.value.trim();
                                    if (val) {
                                      const updated = [...(form.variants || [])];
                                      if (!updated[vIdx].options.includes(val)) {
                                        updated[vIdx].options = [...updated[vIdx].options, val];
                                        setForm({ ...form, variants: updated });
                                      }
                                      input.value = '';
                                    }
                                  }
                                }}
                                className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 rounded-lg py-1.5 px-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 outline-none"
                                placeholder="Type options (e.g. 16GB) & press Enter"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const input = document.getElementById(`new-option-${vIdx}`) as HTMLInputElement;
                                  const val = input?.value.trim();
                                  if (val) {
                                    const updated = [...(form.variants || [])];
                                    if (!updated[vIdx].options.includes(val)) {
                                      updated[vIdx].options = [...updated[vIdx].options, val];
                                      setForm({ ...form, variants: updated });
                                    }
                                    if (input) input.value = '';
                                  }
                                }}
                                className="px-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:bg-slate-700 border border-slate-200 text-slate-600 dark:text-slate-400 rounded-lg text-xs font-bold transition-all"
                              >
                                Add
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* List Option Badges */}
                        <div className="mt-2.5 flex flex-wrap gap-1.5 select-none">
                          {v.options.map((opt, oIdx) => (
                            <span 
                              key={oIdx} 
                              className="inline-flex items-center gap-1 pl-2.5 pr-1.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-lg leading-none shadow-sm font-sans"
                            >
                              {opt}
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = [...(form.variants || [])];
                                  updated[vIdx].options = updated[vIdx].options.filter((_, i) => i !== oIdx);
                                  setForm({ ...form, variants: updated });
                                }}
                                className="text-slate-400 hover:text-rose-500 p-0.5 rounded-full hover:bg-slate-50 dark:bg-slate-950 transition-colors"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                          {v.options.length === 0 && (
                            <span className="text-[10px] text-amber-500 font-bold">Please add at least one option.</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Save Action panel */}
            <div className="flex items-center justify-end gap-3 pt-4 select-none">
              <button 
                type="button" 
                onClick={() => setIsEditing(false)} 
                className="px-5 py-3 border border-slate-200 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:bg-slate-950 font-bold uppercase text-xs tracking-wider rounded-xl transition-all"
              >
                Cancel Draft
              </button>
              <button 
                type="submit" 
                disabled={loading} 
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold uppercase text-xs tracking-wider rounded-xl transition-all shadow-md hover:shadow-lg flex items-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                {form.id ? 'Save Updates' : 'Launch Product Official'}
              </button>
            </div>
          </div>

          {/* RIGHT COLUMN: Visual Assets & Live High Fidelity Mockup (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Visual Image Manager Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 select-none">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-pink-500 shrink-0" />
                  <h3 className="font-bold text-slate-800 dark:text-slate-200 text-xs uppercase tracking-widest">Interactive Galleries</h3>
                </div>
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full uppercase">
                  {imageList.length} Files loaded
                </span>
              </div>

              {/* Direct image input link with clear text label, resolving the default image input prompt */}
              <div className="space-y-2 select-none">
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Main Default Image URL Input</label>
                <div className="flex gap-2">
                  <input 
                    type="url" 
                    value={imageList[0] || ''} 
                    onChange={e => {
                      const newUrl = e.target.value.trim();
                      setImageList(prev => {
                        const next = [...prev];
                        if (next.length > 0) next[0] = newUrl;
                        else if (newUrl) next.push(newUrl);
                        return next.filter(Boolean);
                      });
                    }}
                    className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl py-2 px-3.5 text-xs text-slate-800 dark:text-slate-200 transition-all outline-none font-mono" 
                    placeholder="https://example.com/main-hardware.jpg"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const url = prompt("Input or paste absolute URL of main product image:");
                      if (url) {
                        setImageList(prev => [url, ...prev].filter(Boolean));
                      }
                    }}
                    className="p-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl border border-indigo-100 transition-all flex items-center justify-center shrink-0"
                    title="Paste Image link"
                  >
                    <PlusCircle className="w-4.5 h-4.5" />
                  </button>
                </div>
              </div>

              {/* Robust Drag & Drop zone supporting multiple base64 captures */}
              <div 
                className="border-2 border-dashed border-slate-200 hover:border-indigo-500/80 bg-slate-50/50 hover:bg-white dark:bg-slate-900 rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center relative select-none"
                onDragOver={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.add('border-indigo-500', 'bg-indigo-50/25');
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.remove('border-indigo-500', 'bg-indigo-50/25');
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.remove('border-indigo-500', 'bg-indigo-50/25');
                  if (e.dataTransfer.files) {
                    handleFilesUpload(e.dataTransfer.files);
                  }
                }}
                onClick={() => {
                  const input = document.getElementById('hidden-file-input-edit');
                  input?.click();
                }}
              >
                <input 
                  id="hidden-file-input-edit" 
                  type="file" 
                  multiple 
                  accept="image/*" 
                  onChange={handleFileChange} 
                  className="hidden" 
                />
                
                <UploadCloud className="w-10 h-10 text-indigo-500 mb-2" />
                <span className="text-sm font-bold text-slate-800 dark:text-slate-200 block leading-tight">Drag and Drop 4-5 Images</span>
                <span className="text-xs text-slate-400 mt-1 block">or click to browse from local computer</span>
                <span className="text-[10px] uppercase font-bold text-indigo-600 tracking-wider bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full mt-3.5 block">
                  Clickable Plus / Multi Drop Uploads
                </span>
              </div>

              {/* Proportional Expanded Gallery Thumbnails Box, resolving "Fix issue where box stayed small" */}
              {imageList.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between select-none">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Real-time Asset Gallery</label>
                    <button 
                      type="button" 
                      onClick={() => {
                        setImageList([]);
                        addToast("Cleared product assets deck", "info");
                      }} 
                      className="text-[10px] font-bold text-rose-600 hover:underline uppercase tracking-wider"
                    >
                      Clear Assets
                    </button>
                  </div>
                  
                  {/* Grid elements for image previewing and changing default state */}
                  <div className="grid grid-cols-2 gap-3">
                    {imageList.map((img, idx) => {
                      const isMain = idx === 0;
                      return (
                        <div 
                          key={idx} 
                          className={`group/card relative rounded-xl border overflow-hidden bg-slate-50 dark:bg-slate-950 transition-all flex flex-col justify-between ${isMain ? 'border-2 border-indigo-500 shadow-md ring-4 ring-indigo-50 bg-white dark:bg-slate-900' : 'border-slate-200'}`}
                        >
                          {/* Sized correctly, no squishing, robust rendering */}
                          <div className="aspect-video w-full flex items-center justify-center p-2 bg-white dark:bg-slate-900 relative">
                            <img 
                              src={img} 
                              alt={`Preview ${idx}`} 
                              className="max-h-24 max-w-full object-contain"
                            />

                            {isMain ? (
                              <div className="absolute top-1.5 left-1.5 bg-indigo-600 text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md flex items-center gap-0.5 select-none font-sans">
                                <Check className="w-2.5 h-2.5 shrink-0" />
                                Default
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setImageList(prev => {
                                    const next = [...prev];
                                    const item = next.splice(idx, 1)[0];
                                    return [item, ...next];
                                  });
                                  addToast("New default item selected!", "success");
                                }}
                                className="absolute top-1.5 left-1.5 opacity-0 group-hover/card:opacity-100 bg-slate-900/90 text-white text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded transition-opacity"
                              >
                                Set Main
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => {
                                setImageList(prev => prev.filter((_, i) => i !== idx));
                                addToast("Image removed", "info");
                              }}
                              className="absolute top-1.5 right-1.5 opacity-0 group-hover/card:opacity-100 p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-md transition-opacity"
                              title="Delete model image"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                          
                          <div className="p-1 px-2 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                            <span className="text-[9px] font-bold text-slate-400 font-mono">#{idx + 1}</span>
                            <span className="text-[9px] text-slate-400 truncate max-w-[80px] font-mono">{img.startsWith('data:') ? 'Base64 Local' : 'External Asset'}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* High-fidelity Visual Preview Mockup, satisfying "Provide a way to preview images, allowing administrators to get visual sense" */}
            <div className="bg-slate-900 text-slate-100 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-4 relative overflow-hidden">
              <div className="absolute -right-16 -top-16 w-36 h-36 bg-indigo-600/10 rounded-full blur-2xl pointer-events-none" />
              
              <div className="flex items-center gap-2 pb-2 border-b border-slate-800 select-none">
                <Eye className="w-4 h-4 text-cyan-400 shrink-0" />
                <h3 className="font-bold text-xs uppercase tracking-widest text-slate-300">Live Custom UI Preview</h3>
              </div>

              {/* Exact public model card alignment */}
              <div className="p-4 bg-white dark:bg-slate-900/5 border border-white/10 rounded-xl relative">
                <div className="flex items-center justify-between gap-2 mb-2 select-none">
                  <span className="text-[9px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-500/30 px-2.5 py-0.5 rounded-full uppercase tracking-widest">
                    {form.brand || "MSRP ACCREDITED"}
                  </span>
                  <span className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${form.stockStatus === 'Out of Stock' ? 'bg-rose-950 text-rose-300' : 'bg-emerald-950 text-emerald-300'}`}>
                    {form.stockStatus || 'In Stock'}
                  </span>
                </div>

                {/* Main image layout aspect-ratio */}
                <div className="aspect-square w-full rounded-lg bg-white dark:bg-slate-900 p-4 flex items-center justify-center mb-4 border border-slate-800">
                  {imageList[0] ? (
                    <img 
                      src={imageList[0]} 
                      alt="Product preview" 
                      className="max-h-44 object-contain"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-300">
                      <FileImage className="w-10 h-10 stroke-1 mb-2 text-slate-400" />
                      <span className="text-xs font-semibold text-slate-400 font-sans">No Image Placed</span>
                    </div>
                  )}
                </div>

                <h4 className="text-base font-bold text-slate-100 truncate mb-0.5">
                  {form.title || "Elite hardware Title Model"}
                </h4>
                
                <p className="text-xs text-slate-400 font-medium mb-3 select-none">
                  Line Cat: <strong className="text-cyan-400">{categories.find(c => c.id === form.categoryId)?.name || 'Uncategorized Component'}</strong>
                </p>

                {/* Rating & Warranty mockup */}
                <div className="flex flex-wrap items-center gap-3 mb-3 text-xs select-none">
                  <div className="flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-slate-300 font-bold">4.9 // Verified Node</span>
                  </div>
                  {form.warranty && (
                    <div className="flex items-center gap-1 bg-slate-800 px-2 py-0.5 rounded-md border border-slate-700">
                      <Shield className="w-3 h-3 text-indigo-400" />
                      <span className="text-[10px] font-bold text-slate-200">{form.warranty}</span>
                    </div>
                  )}
                </div>

                {/* Dynamic Variants Preview inside Live Mockup */}
                {form.variants && form.variants.filter(v => v.name && v.options.length > 0).length > 0 && (
                  <div className="mb-4 mt-1.5 space-y-2 border-t border-white/5 pt-2.5">
                    {form.variants.filter(v => v.name && v.options.length > 0).map((v, idx) => (
                      <div key={idx} className="space-y-1">
                        <span className="block text-[9px] font-bold text-slate-450 uppercase tracking-widest leading-none mb-1">{v.name}</span>
                        <div className="flex flex-wrap gap-1">
                          {v.options.map((opt, oIdx) => (
                            <span 
                              key={oIdx} 
                              className={`px-2 py-0.5 border rounded-md text-[10px] font-semibold leading-normal ${
                                oIdx === 0 
                                  ? 'bg-indigo-600/35 border-indigo-500 text-indigo-100' 
                                  : 'bg-white dark:bg-slate-900/5 border-white/10 text-slate-300 hover:bg-white dark:bg-slate-900/10'
                              }`}
                            >
                              {opt}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Pricing section with Taka Icon */}
                <div className="flex items-end justify-between border-t border-white/5 pt-3">
                  <div>
                    <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider select-none">Catalog Price</span>
                    <span className="text-lg font-bold text-white flex items-center gap-0.5">
                      <TakaIcon className="w-4 h-4" />
                      {Number(form.price || 0).toLocaleString("en-BD", {minimumFractionDigits: 2})}
                    </span>
                    {form.discountPrice && (
                      <span className="text-xs text-slate-300 line-through flex items-center gap-0.5">
                        <TakaIcon className="w-3 h-3" />
                        {Number(form.discountPrice || 0).toLocaleString("en-BD", {minimumFractionDigits: 2})}
                      </span>
                    )}
                  </div>
                  <button type="button" className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors select-none">
                    Add To Cart
                  </button>
                </div>
              </div>
            </div>

          </div>
        </form>
      </div>
    );
  }

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadCSV = () => {
    const headers = ['code', 'title', 'brand', 'categoryId', 'price', 'discountPrice', 'inventoryCount', 'stockStatus', 'imageUrl', 'description', 'socket', 'wattage'];
    const csvContent = [
      headers.join(','),
      ...products.map(p => 
        [
          p.code || p.id,
          `"${(p.title || '').replace(/"/g, '""')}"`,
          `"${p.brand || ''}"`,
          p.categoryId,
          p.price || 0,
          p.discountPrice || '',
          p.inventoryCount || 0,
          p.stockStatus || 'In Stock',
          `"${(p.imageUrl || '').replace(/"/g, '""')}"`,
          `"${(p.description || '').replace(/"/g, '""')}"`,
          `"${p.socket || ''}"`,
          p.wattage || 0
        ].join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'products.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleUploadCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const parsedProducts = results.data.map((row: any) => ({
             code: row.code || undefined,
             title: row.title || 'Untitled',
             brand: row.brand || '',
             categoryId: row.categoryId || categories[0]?.id || '',
             price: parseFloat(row.price) || 0,
             discountPrice: row.discountPrice ? parseFloat(row.discountPrice) : undefined,
             inventoryCount: parseInt(row.inventoryCount) || 0,
             stockStatus: row.stockStatus || 'In Stock',
             imageUrl: row.imageUrl || '',
             description: row.description || '',
             socket: row.socket || '',
             wattage: parseInt(row.wattage) || 0,
          }));

          const res = await api.post('/products/bulk', { products: parsedProducts }, token);
          addToast(`Bulk importing processing... ${res.successCount} items synced.`, 'success');
          
          const updated = await api.get('/products');
          setProducts(updated);
        } catch (err) {
          console.error(err);
          addToast('Failed to import CSV.', 'error');
        } finally {
          setLoading(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      },
      error: (err) => {
        console.error(err);
        addToast('Error reading CSV file', 'error');
        setLoading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    });
  };

  return (
    <div>
      <div className="p-6 border-b border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 flex-shrink-0">Products</h2>
        
        <div className="flex-1 w-full md:max-w-md">
          <input 
            type="text" 
            placeholder="Search by product code or title..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full border border-slate-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 w-full md:w-auto">
          <input 
            type="file" 
            accept=".csv" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleUploadCSV} 
          />
          <button onClick={() => fileInputRef.current?.click()} disabled={loading} className="bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center shadow hover:bg-slate-700 transition-colors whitespace-nowrap flex-1 sm:flex-none">
            <Upload className="w-4 h-4 mr-1 shrink-0"/> Import
          </button>
          <button onClick={handleDownloadCSV} disabled={loading} className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center shadow hover:bg-emerald-500 transition-colors whitespace-nowrap flex-1 sm:flex-none">
            Download CSV
          </button>
          <button onClick={handleNew} disabled={loading} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center shadow hover:bg-indigo-500 transition-colors whitespace-nowrap flex-1 sm:flex-none">
            <Plus className="w-4 h-4 mr-1 shrink-0"/> Add Product
          </button>
        </div>
      </div>

      {selectedIds.length > 0 && (
        <div className="bg-indigo-50 p-4 border-b border-indigo-100 flex flex-wrap items-center gap-4">
          <span className="text-sm font-medium text-indigo-800">
            {selectedIds.length} product(s) selected
          </span>
          <div className="flex items-center gap-2">
            <select 
              value={bulkStockAction} 
              onChange={e => setBulkStockAction(e.target.value)}
              className="border border-slate-300 rounded px-2 py-1.5 text-sm"
            >
              <option value="">Update Stock Status...</option>
              <option value="In Stock">In Stock</option>
              <option value="Low Stock">Low Stock</option>
              <option value="Out of Stock">Out of Stock</option>
              <option value="Discontinued">Discontinued</option>
            </select>
            <button 
              onClick={handleBulkUpdateStock}
              disabled={loading || !bulkStockAction}
              className="bg-indigo-600 text-white px-3 py-1.5 rounded text-sm disabled:opacity-50"
            >
              Apply Status
            </button>
          </div>
          <div className="flex items-center gap-2">
            <input 
              type="number" 
              placeholder="New Bulk Price" 
              value={bulkPriceValue}
              onChange={e => setBulkPriceValue(e.target.value ? Number(e.target.value) : '')}
              className="border border-slate-300 rounded px-2 py-1.5 text-sm w-32"
            />
            <button 
              onClick={handleBulkUpdatePrice}
              disabled={loading || bulkPriceValue === ''}
              className="bg-indigo-600 text-white px-3 py-1.5 rounded text-sm disabled:opacity-50"
            >
              Apply Price
            </button>
          </div>
        </div>
      )}

      {/* Select All, Sorting Options Action Bar */}
      <div className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
        <label className="flex items-center space-x-3 text-sm text-slate-600 dark:text-slate-400 font-medium cursor-pointer self-start sm:self-auto">
          <input 
            type="checkbox" 
            checked={searchedProducts.length > 0 && selectedIds.length === searchedProducts.length}
            onChange={handleSelectAll}
            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer w-4 h-4"
          />
          <span>Select All Products ({sortedProducts.length})</span>
        </label>
        
        <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest shrink-0">Sort By</span>
          <select 
            value={sortField} 
            onChange={e => setSortField(e.target.value)}
            className="border border-slate-200 bg-white dark:bg-slate-900 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 hover:border-slate-300 cursor-pointer w-full sm:w-48"
          >
            <option value="custom">Custom Order (Draggable)</option>
            <option value="name_asc">Name (A-Z)</option>
            <option value="name_desc">Name (Z-A)</option>
            <option value="price_asc">Price (Low to High)</option>
            <option value="price_desc">Price (High to Low)</option>
            <option value="stock_asc">Stock Count (Low to High)</option>
            <option value="stock_desc">Stock Count (High to Low)</option>
            <option value="category_asc">Category Name (A-Z)</option>
            <option value="brand_asc">Brand Name (A-Z)</option>
          </select>
        </div>
      </div>

      <div className="bg-slate-50/50 p-6 space-y-4">
        {sortedProducts.map((p, index) => {
          const isCurrentlyDragged = draggedItemIndex === index;
          const isSelected = selectedIds.includes(p.id);
          const showIndicatorAbove = draggedItemIndex !== null && dragOverItemIndex === index && index < draggedItemIndex;
          const showIndicatorBelow = draggedItemIndex !== null && dragOverItemIndex === index && index > draggedItemIndex;

          return (
            <div key={p.id} data-index={index} className="relative transition-all duration-150">
              {/* Visual Drop Placement Line Indicator */}
              {showIndicatorAbove && (
                <div className="h-1.5 w-full bg-indigo-500 rounded-full my-2 animate-pulse shadow-[0_0_12px_#6366f1]" />
              )}

              <div
                draggable={sortField === 'custom' && activeDragId === p.id}
                onDragStart={() => handleDragStart(index)}
                onDragEnter={() => handleDragEnter(index)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => { e.preventDefault(); }}
                onClick={() => handleEdit(p)}
                className={`
                  group flex flex-col sm:flex-row items-center justify-between p-5 bg-white dark:bg-slate-900 border rounded-2xl shadow-sm transition-all duration-200 cursor-pointer select-none
                  ${isCurrentlyDragged ? 'opacity-40 border-dashed border-2 border-indigo-500 bg-indigo-50 scale-[0.98] shadow-lg' : isSelected ? 'border-indigo-400 bg-indigo-50/20 shadow-sm' : 'border-slate-200 hover:border-slate-300 hover:shadow-md'}
                `}
              >
                {/* Left Block: Reorder Grabber, Selection Checkbox, Image and Info */}
                <div className={`flex items-center space-x-4 flex-1 w-full min-w-0 ${draggedItemIndex !== null ? 'pointer-events-none' : ''}`}>
                  
                  {/* Grab Handle - only active and visible when Custom Order sort is active */}
                  {sortField === 'custom' && (
                    <div 
                      className="cursor-grab hover:bg-slate-100 dark:bg-slate-800 p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:text-slate-400 transition-colors active:cursor-grabbing select-none shrink-0 pointer-events-auto"
                      onMouseDown={() => setActiveDragId(p.id)}
                      onTouchStart={(e) => {
                        setActiveDragId(p.id);
                        handleTouchStart(e, index);
                      }}
                      onTouchMove={handleTouchMove}
                      onTouchEnd={handleTouchEnd}
                      onMouseUp={() => { if (draggedItemIndex === null) setActiveDragId(null); }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <GripVertical className="w-5 h-5" />
                    </div>
                  )}

                  {/* Selection Checkbox */}
                  <input 
                    type="checkbox" 
                    checked={isSelected}
                    onChange={(e) => {
                      e.stopPropagation();
                      handleSelectProduct(p.id);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer w-5 h-5 shrink-0 pointer-events-auto"
                  />

                  {/* Image */}
                  <img 
                    src={p.imageUrl} 
                    alt={p.title} 
                    className="w-16 h-16 object-contain bg-slate-50 dark:bg-slate-950 border border-slate-100 rounded-xl shrink-0 p-1" 
                  />

                  {/* Title & Metadata */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      {p.brand && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200">
                          {p.brand}
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-100">
                        {categories.find(c => c.id === p.categoryId)?.name || 'PC Component'}
                      </span>
                    </div>
                    <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors text-base truncate pr-2">
                      {p.title}
                    </h3>
                    <p className="text-xs font-mono text-slate-400 mt-0.5">
                      Code: <strong className="font-semibold text-slate-600 dark:text-slate-400">{p.code || 'N/A'}</strong>
                    </p>
                  </div>
                </div>

                {/* Right Block: Price, Stock, Actions */}
                <div className={`flex flex-col sm:flex-row items-center justify-between sm:space-x-8 space-y-4 sm:space-y-0 w-full sm:w-auto mt-4 sm:mt-0 pt-4 sm:pt-0 border-t sm:border-t-0 border-slate-100 ${draggedItemIndex !== null ? 'pointer-events-none' : ''}`}>
                  
                  {/* Price Block */}
                  <div className="text-center sm:text-right shrink-0">
                    <span className="font-bold text-slate-900 dark:text-white text-lg flex items-center justify-center sm:justify-end">
                      <TakaIcon className="w-4 h-4 mr-[1px]" />
                      {Number(p.price || 0).toLocaleString("en-BD", {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                    </span>
                    {p.discountPrice && (
                      <span className={`text-xs mt-0.5 flex items-center justify-center sm:justify-end gap-1 ${p.discountPrice > p.price ? 'text-rose-600 font-bold' : 'text-emerald-600 font-medium'}`} title={p.discountPrice > p.price ? "Offer price is higher than regular price!" : ""}>
                        <TakaIcon className="w-3 h-3" />
                        {Number(p.discountPrice || 0).toLocaleString("en-BD", {minimumFractionDigits: 2, maximumFractionDigits: 2})} (Offer)
                        {p.discountPrice > p.price && <AlertCircle className="w-3.5 h-3.5" />}
                      </span>
                    )}
                  </div>

                  {/* Stock Status Block */}
                  <div className="shrink-0 text-center">
                    <motion.div 
                      key={p.inventoryCount}
                      initial={{ scale: 1.1, backgroundColor: '#fef3c7' }}
                      animate={{ scale: 1, backgroundColor: 'transparent' }}
                      transition={{ duration: 0.4 }}
                      className="inline-block rounded-xl px-3 py-1 bg-slate-50 dark:bg-slate-950"
                    >
                      {p.stockStatus === 'Out of Stock' || p.inventoryCount === 0 ? (
                        <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-rose-100 text-rose-800">
                          Out of Stock
                        </span>
                      ) : p.inventoryCount !== undefined && p.inventoryCount < 5 ? (
                        <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-800">
                          Low Stock ({p.inventoryCount})
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800">
                          {p.stockStatus} ({p.inventoryCount})
                        </span>
                      )}
                    </motion.div>
                  </div>

                  {/* Action Controls */}
                  <div className="flex items-center space-x-2 shrink-0 pointer-events-auto" onClick={(e) => e.stopPropagation()}>
                    {adjustingStockId === p.id ? (
                      <div className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-800 p-2 rounded-xl border border-slate-200 shadow-sm" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            const currentVal = adjustAmounts[p.id] !== undefined && adjustAmounts[p.id] !== "" ? parseInt(adjustAmounts[p.id]) : (p.inventoryCount || 0);
                            const newVal = Math.max(0, currentVal - 1);
                            setAdjustAmounts(prev => ({ ...prev, [p.id]: newVal.toString() }));
                            await handleSetStock(p, newVal);
                          }}
                          className="w-9 h-9 bg-rose-600 text-white rounded-lg hover:bg-rose-700 font-bold transition-colors shadow-sm flex items-center justify-center shrink-0"
                          title="Subtract Stock (-1)"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        
                        <input
                          type="number"
                          min="0"
                          value={adjustAmounts[p.id] !== undefined ? adjustAmounts[p.id] : (p.inventoryCount || 0)}
                          onChange={(e) => {
                            const valStr = e.target.value;
                            setAdjustAmounts(prev => ({
                              ...prev,
                              [p.id]: valStr
                            }));
                            
                            if (valStr !== "") {
                              const valInt = parseInt(valStr, 10);
                              if (!isNaN(valInt) && valInt >= 0) {
                                handleSetStock(p, valInt);
                              }
                            }
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="w-16 text-center bg-white dark:bg-slate-900 border border-slate-300 rounded-lg px-2 py-1 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-slate-800 dark:text-slate-200 h-9"
                          placeholder="Count"
                        />
                        
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            const currentVal = adjustAmounts[p.id] !== undefined && adjustAmounts[p.id] !== "" ? parseInt(adjustAmounts[p.id]) : (p.inventoryCount || 0);
                            const newVal = currentVal + 1;
                            setAdjustAmounts(prev => ({ ...prev, [p.id]: newVal.toString() }));
                            await handleSetStock(p, newVal);
                          }}
                          className="w-9 h-9 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-bold transition-colors shadow-sm flex items-center justify-center shrink-0"
                          title="Add Stock (+1)"
                        >
                          <Plus className="w-4 h-4" />
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setAdjustingStockId(null);
                          }}
                          className="text-slate-400 hover:text-slate-600 dark:text-slate-400 w-9 h-9 hover:bg-slate-200 dark:bg-slate-700 rounded-lg transition-colors shrink-0 flex items-center justify-center"
                          title="Cancel"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          setAdjustingStockId(p.id); 
                          setAdjustAmounts(prev => ({
                            ...prev,
                            [p.id]: (p.inventoryCount || 0).toString()
                          }));
                        }} 
                        className="text-indigo-600 hover:bg-indigo-50 p-2.5 rounded-xl border border-transparent hover:border-indigo-150 transition-all shadow-sm bg-white dark:bg-slate-900 flex items-center space-x-1" 
                        title="Adjust Stock"
                      >
                        <PackagePlus className="w-4 h-4" />
                        <span className="text-xs font-semibold px-0.5">Adjust Stock</span>
                      </button>
                    )}

                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }} 
                      disabled={deletingId === p.id} 
                      title="Delete" 
                      className="text-rose-600 hover:bg-rose-50 p-2.5 rounded-xl border border-transparent hover:border-rose-100 transition-all shadow-sm bg-white dark:bg-slate-900 disabled:opacity-50"
                    >
                      {deletingId === p.id ? (
                        <div className="w-4 h-4 rounded-full border-2 border-rose-600 border-t-transparent animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                </div>
              </div>

              {showIndicatorBelow && (
                <div className="h-1.5 w-full bg-indigo-500 rounded-full my-2 animate-pulse shadow-[0_0_12px_#6366f1]" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
