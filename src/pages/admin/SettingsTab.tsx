import React, { useState, useEffect } from 'react';
import { useStore } from '../../store';
import { api } from '../../lib/api';
import { Settings } from '../../types';
import { Save, Megaphone } from 'lucide-react';

export default function SettingsTab() {
  const { settings, setSettings, token } = useStore();
  const [form, setForm] = useState<Settings>({
    announcementText: '', facebookUrl: '', whatsappUrl: '', instagramUrl: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      setForm(settings);
    }
  }, [settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await api.put('/settings', form, token);
      setSettings(updated);
      alert('Settings saved!');
    } catch(err) {
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl">
      <h2 className="text-xl font-bold text-slate-800 mb-6">Store Settings</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-slate-50 p-6 border border-slate-200 rounded-2xl space-y-4">
          <h3 className="font-extrabold text-slate-900 flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-indigo-500" />
            Movable Announcement Ticker
          </h3>
          <p className="text-xs text-slate-500 font-medium">
            Configure the moving ticker text that is displayed immediately below the storefront banners.
          </p>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-slate-700">Scrolling Marquee Text</label>
            <input 
              type="text" 
              value={form.announcementText} 
              onChange={e => setForm({...form, announcementText: e.target.value})} 
              className="w-full border border-slate-200 bg-white rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all text-slate-800" 
              placeholder="e.g. Free shipping on all systems over ৳2000! Use code QUANTUM24" 
            />
          </div>
        </div>

        <button type="submit" disabled={saving} className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg shadow font-medium flex items-center hover:bg-indigo-500 transition-colors disabled:opacity-70">
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </form>
    </div>
  );
}
