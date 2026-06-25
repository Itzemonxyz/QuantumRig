import React, { useState, useEffect } from 'react';
import { useStore } from '../../store';
import { api, compressImage } from '../../lib/api';
import { Plus, Edit2, Trash2, Check, XCircle, Loader2, Upload, Link as LinkIcon, FileText, Image as ImageIcon, Sparkles, AlertCircle } from 'lucide-react';
import { Banner } from '../../types';

export default function BannersTab() {
  const { banners, setBanners, token } = useStore();
  const [isEditing, setIsEditing] = useState(false);
  const [currentBanner, setCurrentBanner] = useState<Partial<Banner>>({});
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);

  const fetchBanners = async () => {
    try {
      const data = await api.get('/banners', token);
      setBanners(data || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchBanners();
    const intervalId = setInterval(() => {
      fetchBanners();
    }, 5000);
    return () => clearInterval(intervalId);
  }, [token]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (PNG, JPG, JPEG, WEBP)');
      return;
    }
    
    try {
      const compressed = await compressImage(file, 1200, 0.7);
      setCurrentBanner(prev => ({ ...prev, imageUrl: compressed }));
    } catch (err) {
      console.error('Failed to compress image:', err);
      alert('Error compressing image. Please try again.');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBanner.imageUrl) {
      alert('Please select or enter an image URL');
      return;
    }

    try {
      if (currentBanner.id) {
        const updated = await api.put(`/banners/${currentBanner.id}`, {
          ...currentBanner,
          type: currentBanner.type || 'main'
        });
        setBanners(banners.map(b => b.id === updated.id ? updated : b));
      } else {
        const newBanner = await api.post('/banners', {
          ...currentBanner,
          type: currentBanner.type || 'main',
          active: currentBanner.active !== false
        });
        setBanners([...banners, newBanner]);
      }
      setIsEditing(false);
      setCurrentBanner({});
    } catch (err) {
      console.error(err);
    }
  };

  const executeDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await api.delete(`/banners/${id}`);
      setBanners(banners.filter(b => b.id !== id));
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingId(null);
      setDeleteConfirmId(null);
    }
  };

  if (isEditing) {
    return (
      <div className="p-6 w-full">
        <div className="flex items-center space-x-2 text-slate-500 mb-2">
          <Sparkles className="w-4 h-4 text-indigo-500" />
          <span className="text-xs font-bold tracking-wider uppercase">Storefront Display Banners</span>
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-6 tracking-tight">
          {currentBanner.id ? 'Edit Display Banner' : 'Create Display Banner'}
        </h2>
        
        <form onSubmit={handleSave} className="w-full space-y-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-slate-400" /> Administrative Title
              </label>
              <input 
                required
                type="text"
                placeholder="e.g. Winter Extreme Components Promo"
                value={currentBanner.title || ''}
                onChange={e => setCurrentBanner({...currentBanner, title: e.target.value})}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all text-sm outline-none text-slate-800"
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1">
                <LinkIcon className="w-3.5 h-3.5 text-slate-400" /> Destination Redirect path
              </label>
              <input 
                type="text"
                placeholder="e.g. /builder, /products?category=processors"
                value={currentBanner.linkUrl || ''}
                onChange={e => setCurrentBanner({...currentBanner, linkUrl: e.target.value})}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all text-sm outline-none text-slate-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1">
              <ImageIcon className="w-3.5 h-3.5 text-slate-400" /> Display Banner Placement/Slot
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setCurrentBanner({...currentBanner, type: 'main'})}
                className={`p-3 border rounded-xl text-left transition-all cursor-pointer ${
 (currentBanner.type || 'main') === 'main'
 ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-500'
 : 'border-slate-200 bg-slate-50 hover:bg-slate-100 '
 }`}
              >
                <div className="text-xs font-bold text-slate-800 mb-1">Main Rotating Carousel</div>
                <div className="text-[10px] text-slate-500 leading-normal">Cycles automatically on the left side of the welcome container.</div>
              </button>
              
              <button
                type="button"
                onClick={() => setCurrentBanner({...currentBanner, type: 'fixed-1'})}
                className={`p-3 border rounded-xl text-left transition-all cursor-pointer ${
 currentBanner.type === 'fixed-1'
 ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-500'
 : 'border-slate-200 bg-slate-50 hover:bg-slate-100 '
 }`}
              >
                <div className="text-xs font-bold text-slate-800 mb-1">Top Right Fixed Banner</div>
                <div className="text-[10px] text-slate-500 leading-normal">Static secondary promo banner displayed at the top right of the homepage.</div>
              </button>
              
              <button
                type="button"
                onClick={() => setCurrentBanner({...currentBanner, type: 'fixed-2'})}
                className={`p-3 border rounded-xl text-left transition-all cursor-pointer ${
 currentBanner.type === 'fixed-2'
 ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-500'
 : 'border-slate-200 bg-slate-50 hover:bg-slate-100 '
 }`}
              >
                <div className="text-xs font-bold text-slate-800 mb-1">Bottom Right Fixed Banner</div>
                <div className="text-[10px] text-slate-500 leading-normal">Static secondary promo banner displayed at the bottom right of the homepage.</div>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1">
              <Upload className="w-3.5 h-3.5 text-slate-400" /> Upload Highlighted Banner Image (Horizontal aspect ratio best)
            </label>
            
            {/* File Drag & Drop Field */}
            <div 
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
 isDragActive ? 'border-indigo-500 bg-indigo-50/50' : 'border-slate-200 hover:border-slate-300 bg-slate-50 '
 }`}
            >
              <input 
                type="file"
                id="banner-file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="flex flex-col items-center justify-center">
                <Upload className="w-8 h-8 text-slate-400 mb-2" />
                <p className="text-sm text-slate-700 font-medium mb-1">
                  Drag and drop your poster file here, or{' '}
                  <label htmlFor="banner-file" className="text-indigo-600 hover:text-indigo-500 cursor-pointer font-bold outline-none">
                    browse files
                  </label>
                </p>
                <p className="text-xs text-slate-500 font-normal">Supports JPEG, PNG, WEBP. Horizontal aspect ratio (e.g. 21:9 or 16:7) is best.</p>
              </div>
            </div>

            <div className="mt-4">
              <span className="text-xs text-slate-500 block mb-1">Or enter a Direct Image URL</span>
              <input 
                type="text"
                placeholder="https://images.unsplash.com/photo-..."
                value={currentBanner.imageUrl || ''}
                onChange={e => setCurrentBanner({...currentBanner, imageUrl: e.target.value})}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all text-sm outline-none text-slate-800"
              />
            </div>

            {currentBanner.imageUrl && (
              <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-xs font-bold text-slate-400 block mb-1.5 uppercase">Banner Preview (Natural Aspect Ratio):</span>
                <div className="w-full border border-slate-200 rounded-xl overflow-hidden bg-slate-100 flex flex-col items-center justify-center">
                  <img 
                    src={currentBanner.imageUrl} 
                    alt="Banner Preview" 
                    className="w-full h-auto block pointer-events-none select-none"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-2">Preview illustrates how it is fitted on the homepage. The natural ratio of the image is maintained to ensure no part is cut off.</p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-slate-400" /> Detail / Administrative Notes / Campaign Info
            </label>
            <textarea 
              rows={3}
              placeholder="Provide clean internal administrative explanations and details about this homepage banner campaign."
              value={currentBanner.description || ''}
              onChange={e => setCurrentBanner({...currentBanner, description: e.target.value})}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all text-sm outline-none text-slate-800 resize-none"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="active-toggle"
              checked={currentBanner.active !== false}
              onChange={(e) => setCurrentBanner({...currentBanner, active: e.target.checked})}
              className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500/50"
            />
            <label htmlFor="active-toggle" className="ml-2 text-sm font-medium text-slate-700 select-none">
              Publish this banner image immediately on the storefront slideshow rotation
            </label>
          </div>

          <div className="flex space-x-4 pt-4 border-t border-slate-100">
            <button 
              type="submit" 
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-6 rounded-xl transition-all cursor-pointer text-xs uppercase tracking-wider"
            >
              Save Banner
            </button>
            <button 
              type="button" 
              onClick={() => { setIsEditing(false); setCurrentBanner({}); }}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 px-6 rounded-xl transition-all cursor-pointer text-xs uppercase tracking-wider"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center space-x-2 text-slate-500 mb-1">
            <ImageIcon className="w-4 h-4 text-indigo-500" />
            <span className="text-xs font-bold tracking-wider uppercase">Marketing Asset Manager</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Storefront Banners</h2>
          <p className="text-xs text-slate-500 mt-1">Upload and manage rotating horizontal posters that will dynamically scale to their natural ratios on the homepage.</p>
        </div>
        
        <button
          onClick={() => {
            setCurrentBanner({ active: true });
            setIsEditing(true);
          }}
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-5 rounded-xl shadow-lg shadow-indigo-600/15 hover:shadow-indigo-600/30 transition-all hover:scale-[1.02] cursor-pointer text-xs uppercase tracking-widest self-start"
        >
          <Plus className="w-4 h-4" /> Add Display Banner
        </button>
      </div>

      {banners.length === 0 ? (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-12 text-center">
          <ImageIcon className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600 font-medium mb-1">No homepage banners found</p>
          <p className="text-xs text-slate-400">Click the button above to upload or assign your first product/campaign banner poster.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {banners.map((banner) => (
            <div 
              key={banner.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col lg:flex-row group"
            >
              {/* Banner Poster Container (Correct horizontal aspect ratio) */}
              <div className="w-full lg:w-80 aspect-[16/9] bg-[#111827] flex items-center justify-center border-b lg:border-b-0 lg:border-r border-slate-200 overflow-hidden">
                <img 
                  src={banner.imageUrl} 
                  alt={banner.title} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Banner Details Info */}
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h3 className="text-lg font-bold text-slate-900 mr-auto">{banner.title || 'Untitled Banner'}</h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
 (banner.type || 'main') === 'main'
 ? 'bg-indigo-50 text-indigo-700 border border-indigo-100'
 : banner.type === 'fixed-1'
 ? 'bg-amber-50 text-amber-700 border border-amber-100'
 : 'bg-teal-50 text-teal-700 border border-teal-100'
 }`}>
                      {(banner.type || 'main') === 'main' ? 'Main Carousel' : banner.type === 'fixed-1' ? 'Top Right Slot' : 'Bottom Right Slot'}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
 banner.active 
 ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
 : 'bg-slate-100 text-slate-600 border border-slate-200'
 }`}>
                      {banner.active ? 'Active on Storefront' : 'Inactive Draft'}
                    </span>
                  </div>

                  {banner.description && (
                    <p className="text-sm text-slate-600 mb-3 line-clamp-2">{banner.description}</p>
                  )}

                  <div className="space-y-1.5 pt-2">
                    <p className="text-xs text-slate-500 flex items-center gap-1.5">
                      <LinkIcon className="w-3.5 h-3.5 text-slate-400" /> Redirect: 
                      <span className="text-slate-700 font-medium">{banner.linkUrl || 'None (Static asset)'}</span>
                    </p>
                    <p className="text-xs text-slate-500 flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-slate-400" /> Asset URL: 
                      <span className="text-indigo-600 hover:underline truncate max-w-sm block">{banner.imageUrl}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-6 border-t border-slate-100 mt-4">
                  <button
                    onClick={() => {
                      setCurrentBanner(banner);
                      setIsEditing(true);
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-indigo-600 transition-colors uppercase tracking-wider"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Edit Details
                  </button>
                  
                  {deleteConfirmId === banner.id ? (
                    <div className="flex items-center gap-2 ml-auto">
                      <button 
                        onClick={() => executeDelete(banner.id)}
                        disabled={deletingId === banner.id}
                        className="px-2 py-1 text-white bg-rose-500 hover:bg-rose-600 rounded-md transition-colors font-bold text-xs shadow-sm flex items-center gap-1"
                      >
                        {deletingId === banner.id && <Loader2 className="w-3 h-3 animate-spin" />}
                        Confirm Delete
                      </button>
                      <button 
                        disabled={deletingId === banner.id}
                        onClick={() => setDeleteConfirmId(null)}
                        className="px-2 py-1 text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors font-semibold text-xs shadow-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirmId(banner.id)}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 transition-colors uppercase tracking-wider ml-auto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete Poster
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
