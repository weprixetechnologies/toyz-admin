'use client';
import { useState, useEffect } from 'react';
import { adminApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { Search, Save } from 'lucide-react';

export default function SearchSettingsPage() {
  const [keywords, setKeywords] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await adminApi.get('/settings');
        if (res.success && res.data?.settings) {
          const setting = res.data.settings.find(s => s.setting_key === 'trending_keywords');
          if (setting) {
            setKeywords(setting.setting_value);
          }
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await adminApi.post('/settings/bulk', {
        settings: [
          { setting_key: 'trending_keywords', setting_value: keywords }
        ]
      });
      if (res.success) {
        toast.success('Search keywords updated successfully');
      } else {
        toast.error('Failed to update keywords');
      }
    } catch (err) {
      toast.error('An error occurred');
    }
    setLoading(false);
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center">
          <Search size={20} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Search Settings</h1>
          <p className="text-gray-500 text-sm">Manage advanced search page features and trending keywords</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <form onSubmit={handleSave} className="p-6 md:p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">Trending Keywords</label>
            <p className="text-xs text-gray-500 mb-2">Enter comma-separated keywords to display as "Trending" on the advanced search page.</p>
            <input
              type="text"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="e.g. Action Figures, Educational Toys, Cars"
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-6 rounded-xl transition flex items-center gap-2"
            >
              <Save size={18} />
              {loading ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
