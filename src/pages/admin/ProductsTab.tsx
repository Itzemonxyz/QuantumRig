import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useStore } from '../../store';
import { api } from '../../lib/api';
import { Product } from '../../types';
import { ArrowUpDown, Plus, Minus, Trash2, X, PackagePlus, Copy, AlertCircle, GripVertical } from 'lucide-react';
import { motion } from 'motion/react';
import TakaIcon from '../../components/TakaIcon';

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
    
    setForm({ ...rest, title: `${rest.title} (Clone)`, code: newCode });
    setSpecsText(Object.entries(p.specs || {}).map(([k, v]) => `${k}:${v}`).join('\n'));
    setAdditionalImagesText(p.additionalImages?.join('\n') || '');
    setIsEditing(true);
  };

  const handleEdit = (p: Product) => {
    setForm(p);
    setSpecsText(Object.entries(p.specs || {}).map(([k, v]) => `${k}:${v}`).join('\n'));
    setAdditionalImagesText(p.additionalImages?.join('\n') || '');
    setIsEditing(true);
  };

  const handleNew = () => {
    setForm({ title: '', slug: '', categoryId: categories[0]?.id || '', price: 0, stockStatus: 'In Stock', imageUrl: '', description: '', specs: {}, socket: '', wattage: 0, inventoryCount: 0 });
    setSpecsText('');
    setAdditionalImagesText('');
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

    const additionalImages: string[] = additionalImagesText.split('\n').map(l => l.trim()).filter(l => l);

    const payload = { ...form, specs, additionalImages };

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
    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
           <h2 className="text-xl font-bold text-slate-800">{form.id ? 'Edit Product' : 'New Product'}</h2>
           <button onClick={() => setIsEditing(false)} className="text-slate-400 hover:text-slate-600"><X className="w-6 h-6"/></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Product Code</label>
              <input type="text" value={form.code || ''} onChange={e => setForm({...form, code: e.target.value})} className="w-full sm:w-2/3 border rounded p-2 text-sm font-mono" placeholder="Leave empty to auto-generate (e.g. 39614)" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Title</label>
              <input required type="text" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full border rounded p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Brand</label>
              <select value={form.brand || ''} onChange={e => setForm({...form, brand: e.target.value})} className="w-full border rounded p-2">
                 <option value="">Select a Brand (Optional)</option>
                 {brands.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <select required value={form.categoryId} onChange={e => setForm({...form, categoryId: e.target.value})} className="w-full border rounded p-2">
                 {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Regular Price</label>
              <input required type="number" step="0.01" value={form.price === undefined || isNaN(form.price) ? '' : form.price} onChange={e => setForm({...form, price: parseFloat(e.target.value)})} className="w-full border rounded p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Offer Price (Optional)</label>
              <input type="number" step="0.01" value={form.discountPrice === undefined || isNaN(form.discountPrice) ? '' : form.discountPrice} onChange={e => setForm({...form, discountPrice: e.target.value ? parseFloat(e.target.value) : undefined})} className="w-full border rounded p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Stock Status</label>
              <select value={form.stockStatus} onChange={e => setForm({...form, stockStatus: e.target.value as any})} className="w-full border rounded p-2">
                 <option value="In Stock">In Stock</option>
                 <option value="Out of Stock">Out of Stock</option>
                 <option value="Discontinued">Discontinued</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Inventory Count</label>
              <input required type="number" min="0" value={form.inventoryCount === undefined || isNaN(form.inventoryCount) ? '' : form.inventoryCount} onChange={e => setForm({...form, inventoryCount: parseInt(e.target.value)})} className="w-full border rounded p-2" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Image URL</label>
              <input required type="url" value={form.imageUrl} onChange={e => setForm({...form, imageUrl: e.target.value})} className="w-full border rounded p-2" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Additional Images (One URL per line)</label>
              <textarea value={additionalImagesText} onChange={e => setAdditionalImagesText(e.target.value)} className="w-full border rounded p-2 font-mono text-sm" rows={2} placeholder="https://example.com/img2.jpg&#10;https://example.com/img3.jpg"></textarea>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea required value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full border rounded p-2" rows={3}></textarea>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Socket (Optional)</label>
              <input type="text" value={form.socket || ''} onChange={e => setForm({...form, socket: e.target.value})} className="w-full border rounded p-2" />
            </div>
             <div>
              <label className="block text-sm font-medium mb-1">Wattage (Optional)</label>
              <input type="number" value={form.wattage === undefined || isNaN(form.wattage) ? '' : form.wattage} onChange={e => setForm({...form, wattage: parseInt(e.target.value)})} className="w-full border rounded p-2" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Specs (Format: Key:Value per line)</label>
              <textarea value={specsText} onChange={e => setSpecsText(e.target.value)} className="w-full border rounded p-2 font-mono text-sm" rows={4} placeholder="Cores: 24&#10;Threads: 32"></textarea>
            </div>
          </div>
          <button type="submit" disabled={loading} className="bg-indigo-600 text-white px-4 py-2 rounded shadow">Save Product</button>
        </form>
      </div>
    );
  }

  const handleDownloadCSV = () => {
    const headers = ['Title', 'Price', 'Stock Count'];
    const csvContent = [
      headers.join(','),
      ...products.map(p => `"${p.title.replace(/"/g, '""')}",${Number(p.price || 0).toLocaleString("en-BD", {minimumFractionDigits: 2, maximumFractionDigits: 2})},${p.inventoryCount || 0}`)
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

  return (
    <div>
      <div className="p-6 border-b border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
        <h2 className="text-xl font-bold text-slate-800 flex-shrink-0">Products</h2>
        
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
          <button onClick={handleDownloadCSV} className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center shadow hover:bg-emerald-500 transition-colors whitespace-nowrap flex-1 sm:flex-none">
            Download CSV
          </button>
          <button onClick={handleNew} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center shadow hover:bg-indigo-500 transition-colors whitespace-nowrap flex-1 sm:flex-none">
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
      <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
        <label className="flex items-center space-x-3 text-sm text-slate-600 font-medium cursor-pointer self-start sm:self-auto">
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
            className="border border-slate-200 bg-white rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 hover:border-slate-300 cursor-pointer w-full sm:w-48"
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
                  group flex flex-col sm:flex-row items-center justify-between p-5 bg-white border rounded-2xl shadow-sm transition-all duration-200 cursor-pointer select-none
                  ${isCurrentlyDragged ? 'opacity-40 border-dashed border-2 border-indigo-500 bg-indigo-50 scale-[0.98] shadow-lg' : isSelected ? 'border-indigo-400 bg-indigo-50/20 shadow-sm' : 'border-slate-200 hover:border-slate-300 hover:shadow-md'}
                `}
              >
                {/* Left Block: Reorder Grabber, Selection Checkbox, Image and Info */}
                <div className={`flex items-center space-x-4 flex-1 w-full min-w-0 ${draggedItemIndex !== null ? 'pointer-events-none' : ''}`}>
                  
                  {/* Grab Handle - only active and visible when Custom Order sort is active */}
                  {sortField === 'custom' && (
                    <div 
                      className="cursor-grab hover:bg-slate-100 p-2 rounded-lg text-slate-400 hover:text-slate-600 transition-colors active:cursor-grabbing select-none shrink-0 pointer-events-auto"
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
                    className="w-16 h-16 object-contain bg-slate-50 border border-slate-100 rounded-xl shrink-0 p-1" 
                  />

                  {/* Title & Metadata */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      {p.brand && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                          {p.brand}
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-100">
                        {categories.find(c => c.id === p.categoryId)?.name || 'PC Component'}
                      </span>
                    </div>
                    <h3 className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors text-base truncate pr-2">
                      {p.title}
                    </h3>
                    <p className="text-xs font-mono text-slate-400 mt-0.5">
                      Code: <strong className="font-semibold text-slate-600">{p.code || 'N/A'}</strong>
                    </p>
                  </div>
                </div>

                {/* Right Block: Price, Stock, Actions */}
                <div className={`flex flex-col sm:flex-row items-center justify-between sm:space-x-8 space-y-4 sm:space-y-0 w-full sm:w-auto mt-4 sm:mt-0 pt-4 sm:pt-0 border-t sm:border-t-0 border-slate-100 ${draggedItemIndex !== null ? 'pointer-events-none' : ''}`}>
                  
                  {/* Price Block */}
                  <div className="text-center sm:text-right shrink-0">
                    <span className="font-bold text-slate-900 text-lg flex items-center justify-center sm:justify-end">
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
                      className="inline-block rounded-xl px-3 py-1 bg-slate-50"
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
                      <div className="flex items-center space-x-2 bg-slate-100 p-2 rounded-xl border border-slate-200 shadow-sm" onClick={(e) => e.stopPropagation()}>
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
                          className="w-16 text-center bg-white border border-slate-300 rounded-lg px-2 py-1 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-slate-800 h-9"
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
                          className="text-slate-400 hover:text-slate-600 w-9 h-9 hover:bg-slate-200 rounded-lg transition-colors shrink-0 flex items-center justify-center"
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
                        className="text-indigo-600 hover:bg-indigo-50 p-2.5 rounded-xl border border-transparent hover:border-indigo-150 transition-all shadow-sm bg-white flex items-center space-x-1" 
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
                      className="text-rose-600 hover:bg-rose-50 p-2.5 rounded-xl border border-transparent hover:border-rose-100 transition-all shadow-sm bg-white disabled:opacity-50"
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
