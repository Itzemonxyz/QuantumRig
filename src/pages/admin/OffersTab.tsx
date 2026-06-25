import React, { useState, useEffect } from 'react';
import { useStore } from '../../store';
import { api, compressImage } from '../../lib/api';
import { Plus, Edit2, Trash2, CheckCircle, XCircle, Loader2, Upload, Link as LinkIcon, FileText, Sparkles, AlertCircle, ArrowDown, ArrowUp } from 'lucide-react';
import { Offer } from '../../types';

export default function OffersTab() {
  const { offers, setOffers, token } = useStore();
  const [isEditing, setIsEditing] = useState(false);
  const [currentOffer, setCurrentOffer] = useState<Partial<Offer>>({});
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const fetchOffers = async () => {
    try {
      const data = await api.get('/offers', token);
      setOffers(data || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchOffers();
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
      const compressed = await compressImage(file, 1000, 0.75);
      setCurrentOffer(prev => ({ ...prev, imageUrl: compressed }));
    } catch (err) {
      console.error('Failed to compress image:', err);
      alert('Error compressing image. Please try again.');
    }
  };


  
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (currentOffer.id) {
        const updated = await api.put(`/offers/${currentOffer.id}`, currentOffer);
        setOffers(offers.map(o => o.id === updated.id ? updated : o));
      } else {
        const newOffer = await api.post('/offers', currentOffer);
        setOffers([...offers, newOffer]);
      }
      setIsEditing(false);
      setCurrentOffer({});
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await api.delete(`/offers/${id}`);
      setOffers(offers.filter(o => o.id !== id));
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  };

  if (isEditing) {
    return (
      <div className="p-6 max-w-2xl">
        <div className="flex items-center space-x-2 text-slate-500 mb-2 font-mono">
          <Sparkles className="w-4 h-4 text-indigo-500" />
          <span className="text-xs font-bold tracking-wider uppercase">Promotional Event Banners</span>
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-6 tracking-tight">
          {currentOffer.id ? 'Edit Live Event / Banner' : 'Create Live Event / Banner'}
        </h2>
        
        <form onSubmit={handleSave} className="space-y-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-slate-400" /> Title
              </label>
              <input 
                required
                type="text"
                placeholder="e.g. Intel Extreme Rig Showcase"
                value={currentOffer.title || ''}
                onChange={e => setCurrentOffer({...currentOffer, title: e.target.value})}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all text-sm outline-none text-slate-800"
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-slate-400" /> Button Text (Optional)
              </label>
              <input 
                type="text"
                placeholder="e.g. Configure Rig, Claim Offer"
                value={currentOffer.buttonText || ''}
                onChange={e => setCurrentOffer({...currentOffer, buttonText: e.target.value})}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all text-sm outline-none text-slate-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1">
              <LinkIcon className="w-3.5 h-3.5 text-slate-400" /> CTA Link / Destination (Optional)
            </label>
            <input 
              type="text"
              placeholder="e.g. /builder, /offers, or /products?category=processors"
              value={currentOffer.linkUrl || ''}
              onChange={e => setCurrentOffer({...currentOffer, linkUrl: e.target.value})}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all text-sm outline-none text-slate-800"
            />
            <p className="text-[11px] text-slate-500 mt-1 font-mono">Suggested internal paths: /builder, /offers, /products</p>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1">
              <Upload className="w-3.5 h-3.5 text-slate-400" /> Poster/Banner Design
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
                id="poster-file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="flex flex-col items-center justify-center">
                <Upload className="w-8 h-8 text-slate-400 mb-2" />
                <p className="text-sm text-slate-700 font-medium mb-1">
                  Drag and drop your poster file here, or{' '}
                  <label htmlFor="poster-file" className="text-indigo-600 hover:text-indigo-500 cursor-pointer font-bold outline-none">
                    browse files
                  </label>
                </p>
                <p className="text-xs text-slate-500 font-normal">Supports JPEG, PNG, WEBP. Horizontal aspect ratio (e.g. 1200x500px) is best. Under 3MB.</p>
              </div>
            </div>

            <div className="mt-4">
              <span className="text-xs text-slate-500 block mb-1">Or enter a Direct Image URL</span>
              <input 
                required
                type="text"
                placeholder="https://images.unsplash.com/photo-..."
                value={currentOffer.imageUrl || ''}
                onChange={e => setCurrentOffer({...currentOffer, imageUrl: e.target.value})}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all text-sm outline-none text-slate-800"
              />
            </div>

            {currentOffer.imageUrl && (
              <div className="mt-4 p-2 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-xs font-mono font-bold text-slate-400 block mb-1.5 uppercase">Poster Preview:</span>
                <img 
                  src={currentOffer.imageUrl} 
                  alt="Poster Preview" 
                  className="w-full h-40 object-contain rounded-lg bg-slate-900 border border-slate-300"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-slate-400" /> Description / Campaign Details
            </label>
            <textarea 
              rows={3}
              placeholder="Provide a clear description about this event, discount code, or special tech specs"
              value={currentOffer.description || ''}
              onChange={e => setCurrentOffer({...currentOffer, description: e.target.value})}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all text-sm outline-none text-slate-800 resize-none"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="active-toggle"
              checked={currentOffer.active !== false}
              onChange={(e) => setCurrentOffer({...currentOffer, active: e.target.checked})}
              className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500/50"
            />
            <label htmlFor="active-toggle" className="ml-2 text-sm font-medium text-slate-700 select-none">
              Publish this event advertisement banner immediately on the storefront
            </label>
          </div>

          <div className="flex space-x-4 pt-4 border-t border-slate-100">
            <button 
              type="submit" 
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-6 rounded-xl transition-all cursor-pointer text-xs uppercase tracking-wider"
            >
              Save Campaign
            </button>
            <button 
              type="button" 
              onClick={() => setIsEditing(false)} 
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 px-6 rounded-xl transition-colors text-xs uppercase tracking-wider"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    );
  }

  const sortedOffers = [...offers].sort((a, b) => {
    return sortOrder === 'asc' ? (a.title || '').localeCompare(b.title || '') : (b.title || '').localeCompare(a.title || '');
  });

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8">
        <div>
          <div className="flex items-center space-x-2 text-slate-500 mb-1 font-mono">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            <span className="text-xs font-bold tracking-wider uppercase">Sales Campaigns & Promotions</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Manage Event Banners</h2>
        </div>
        <button 
          onClick={() => { setCurrentOffer({active: true}); setIsEditing(true); }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer text-xs uppercase tracking-wider shadow-sm self-start sm:self-center"
        >
          <Plus className="w-4 h-4" /> Add Event Banner
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center gap-2 text-xs font-mono font-bold text-slate-500">
          <AlertCircle className="w-4 h-4 text-indigo-500" />
          <span>Active banners/posters will cycle automatically at the top of the storefront homepage!</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-xs text-slate-400 font-mono uppercase tracking-widest bg-slate-50/50">
                <th 
                  className="py-4 px-6 font-semibold cursor-pointer hover:bg-slate-100 transition-colors group select-none"
                  onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                >
                  <div className="flex items-center gap-1.5">
                    Poster
                    {sortOrder === 'asc' ? (
                      <ArrowDown className="w-3.5 h-3.5 text-indigo-500" />
                    ) : (
                      <ArrowUp className="w-3.5 h-3.5 text-indigo-500" />
                    )}
                  </div>
                </th>
                <th className="py-4 px-6 font-semibold">Campaign Details</th>
                <th className="py-4 px-6 font-semibold">Destination Path</th>
                <th className="py-4 px-6 font-semibold text-center">Status</th>
                <th className="py-4 px-6 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedOffers.map(offer => (
                <tr key={offer.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-4 px-6">
                    {offer.imageUrl && (
                      <img 
                        src={offer.imageUrl} 
                        alt={offer.title} 
                        className="w-16 h-10 object-cover bg-slate-900 rounded-lg border border-slate-200" 
                      />
                    )}
                  </td>
                  <td className="py-4 px-6">
                    <span className="font-bold text-slate-900 block text-sm">{offer.title}</span>
                    {offer.description && <p className="text-xs text-slate-400 mt-1 max-w-sm line-clamp-2">{offer.description}</p>}
                  </td>
                  <td className="py-4 px-6 font-mono text-xs text-slate-500">
                    {offer.linkUrl || <span className="text-slate-300 italic">None</span>}
                    {offer.buttonText && <span className="block text-[10px] text-indigo-500 font-bold mt-1">Button: "{offer.buttonText}"</span>}
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex justify-center">
                      {offer.active ? (
                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-150 px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" /> Storefront Live
                        </span>
                      ) : (
                        <span className="bg-slate-50 text-slate-500 border border-slate-150 px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5" /> Draft/Offline
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end space-x-1.5">
                      <button 
                        onClick={() => { setCurrentOffer(offer); setIsEditing(true); }} 
                        disabled={deletingId === offer.id} 
                        className="p-1.5 rounded-lg border border-slate-250 bg-white hover:border-indigo-300 hover:text-indigo-650 text-slate-500 transition-colors disabled:opacity-50 cursor-pointer"
                        title="Edit Banner"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => handleDelete(offer.id)} 
                        disabled={deletingId === offer.id} 
                        className="p-1.5 rounded-lg border border-slate-250 bg-white hover:border-rose-300 hover:text-rose-600 text-slate-400 transition-colors disabled:opacity-50 cursor-pointer"
                        title="Delete Banner"
                      >
                        {deletingId === offer.id ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <Trash2 className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {offers.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 text-sm">
                    No custom event banners defined. Define one above, or drop an image file to publish.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
