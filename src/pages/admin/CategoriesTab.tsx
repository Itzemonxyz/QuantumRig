import React, { useState } from 'react';
import { useStore } from '../../store';
import { api } from '../../lib/api';
import { Category } from '../../types';
import { Plus, Edit2, Trash2, Loader2, GripVertical } from 'lucide-react';
import { useScrollLock } from '../../hooks/useScrollLock';

export default function CategoriesTab() {
  const { categories, setCategories, token } = useStore();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Drag and drop state
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);
  const [dragOverItemIndex, setDragOverItemIndex] = useState<number | null>(null);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  // Lock scrolling while category is being dragged (held)
  useScrollLock(false);

  // Allow manual mouse wheel scrolling and edge auto-scrolling during drag operations
  React.useEffect(() => {
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

  // Custom Touch Event handlers for seamless mobile drag and drop support
  const handleTouchStart = (e: React.TouchEvent, index: number) => {
    setDraggedItemIndex(index);
    setDragOverItemIndex(index);
    setActiveDragId(categories[index].id);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editId) {
        await api.put(`/categories/${editId}`, { name, slug }, token);
      } else {
        await api.post('/categories', { name, slug }, token);
      }
      const updated = await api.get('/categories');
      setCategories(updated);
      setEditId(null);
      setName('');
      setSlug('');
    } catch (err) {
      alert("Failed to save category");
    }
  };

  const handleEdit = (c: Category) => {
    setEditId(c.id);
    setName(c.name);
    setSlug(c.slug);
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
       await api.delete(`/categories/${id}`, token);
       const updated = await api.get('/categories');
       setCategories(updated);
    } catch(e) {
       alert("Failed to delete");
    } finally {
       setDeletingId(null);
    }
  };

  const handleDragStart = (index: number) => {
    setDraggedItemIndex(index);
  };

  const handleDragEnter = (index: number) => {
    setDragOverItemIndex(index);
  };

  const handleDragEnd = async () => {
    setActiveDragId(null);
    if (draggedItemIndex === null || dragOverItemIndex === null || draggedItemIndex === dragOverItemIndex) {
      setDraggedItemIndex(null);
      setDragOverItemIndex(null);
      return;
    }

    const newCategories = [...categories];
    const draggedItem = newCategories[draggedItemIndex];
    newCategories.splice(draggedItemIndex, 1);
    newCategories.splice(dragOverItemIndex, 0, draggedItem);
    
    // Optimistically update local state to avoid flicker
    setCategories(newCategories);
    
    setDraggedItemIndex(null);
    setDragOverItemIndex(null);
    
    try {
       await api.post('/categories/reorder', { reorderedCategories: newCategories }, token);
       const updated = await api.get('/categories');
       setCategories(updated);
    } catch (e) {
       alert("Failed to reorder");
       // Revert on failure
       const original = await api.get('/categories');
       setCategories(original);
    }
  };

  return (
    <div className="p-6">
       <h2 className="text-xl font-bold text-slate-800 mb-6 font-sans tracking-tight">Manage Categories</h2>
       <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4 mb-8 bg-white p-6 border border-slate-200 rounded-2xl shadow-sm">
         <div className="flex-1">
           <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5 font-sans">Category Name</label>
           <input required type="text" placeholder="e.g. Graphics Cards" value={name} onChange={e => { setName(e.target.value); if(!editId) setSlug(e.target.value.toLowerCase().replace(/ /g, '-')); }} className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 font-sans" />
         </div>
         <div className="flex-1">
           <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5 font-sans">Slug</label>
           <input required type="text" placeholder="e.g. graphics-cards" value={slug} onChange={e => setSlug(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 font-sans" />
         </div>
         <div className="flex items-end gap-2">
           <button type="submit" className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg shadow-md hover:bg-indigo-500 transition-colors font-medium flex items-center gap-1.5">
              <Plus className="w-4 h-4" />
              <span>{editId ? 'Update' : 'Add'}</span>
           </button>
           {editId && <button type="button" onClick={() => {setEditId(null); setName(''); setSlug('');}} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-2.5 rounded-lg font-medium transition-colors">Cancel</button>}
         </div>
       </form>

       <div className="space-y-3">
          {categories.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 font-sans">
              <p className="text-slate-400 font-medium">No categories found. Add your first above!</p>
            </div>
          ) : (
            categories.map((c, index) => {
              const isCurrentlyDragged = draggedItemIndex === index;
              const isDragOver = dragOverItemIndex === index;
              const showIndicatorAbove = draggedItemIndex !== null && dragOverItemIndex === index && index < draggedItemIndex;
              const showIndicatorBelow = draggedItemIndex !== null && dragOverItemIndex === index && index > draggedItemIndex;

              return (
                <div key={c.id} data-index={index} className="relative transition-all duration-150">
                  {/* Visual Drop Placement Line Indicator */}
                  {showIndicatorAbove && (
                    <div className="h-1 w-full bg-indigo-500 rounded-full my-2 animate-pulse shadow-[0_0_12px_#6366f1]" />
                  )}
                  
                  <div
                    draggable={activeDragId === c.id}
                    onDragStart={() => handleDragStart(index)}
                    onDragEnter={() => handleDragEnter(index)}
                    onDragEnd={handleDragEnd}
                    onDragOver={(e) => e.preventDefault()}
                    className={`
                      flex items-center justify-between p-4 bg-white border rounded-2xl shadow-sm transition-all duration-200
                      ${isCurrentlyDragged ? 'opacity-50 border-dashed border-2 border-indigo-500 bg-indigo-50 scale-[0.98] shadow-lg' : 'border-slate-200 hover:border-slate-300 hover:shadow-md'}
                    `}
                  >
                    <div className={`flex items-center space-x-4 ${draggedItemIndex !== null ? 'pointer-events-none' : ''}`}>
                      {/* Grab Handle - restricted triggers */}
                      <div 
                        className="cursor-grab hover:bg-slate-100 p-2 rounded-lg text-slate-400 hover:text-slate-600 transition-colors active:cursor-grabbing select-none pointer-events-auto"
                        onMouseDown={() => setActiveDragId(c.id)}
                        onTouchStart={(e) => {
                          setActiveDragId(c.id);
                          handleTouchStart(e, index);
                        }}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                        onMouseUp={() => { if (draggedItemIndex === null) setActiveDragId(null); }}
                      >
                        <GripVertical className="w-5 h-5" />
                      </div>

                      {/* Info Details */}
                      <div>
                        <h3 className="font-bold text-slate-800 text-base font-sans">{c.name}</h3>
                        <p className="text-xs font-mono text-slate-400 mt-0.5">slug: {c.slug}</p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className={`flex items-center space-x-2 ${draggedItemIndex !== null ? 'pointer-events-none' : ''}`}>
                      <button 
                        onClick={() => handleEdit(c)} 
                        className="text-indigo-600 hover:bg-indigo-50 p-2 rounded-lg transition-colors border border-transparent hover:border-indigo-100 disabled:opacity-50" 
                        disabled={deletingId === c.id}
                        title="Edit Category"
                      >
                        <Edit2 className="w-4 h-4"/>
                      </button>
                      <button 
                        onClick={() => handleDelete(c.id)} 
                        className="text-rose-600 hover:bg-rose-50 p-2 rounded-lg transition-colors border border-transparent hover:border-rose-100 disabled:opacity-50" 
                        disabled={deletingId === c.id}
                        title="Delete Category"
                      >
                        {deletingId === c.id ? <Loader2 className="w-4 h-4 animate-spin"/> : <Trash2 className="w-4 h-4"/>}
                      </button>
                    </div>
                  </div>

                  {showIndicatorBelow && (
                    <div className="h-1 w-full bg-indigo-500 rounded-full my-2 animate-pulse shadow-[0_0_12px_#6366f1]" />
                  )}
                </div>
              );
            })
          )}
       </div>
    </div>
  );
}
