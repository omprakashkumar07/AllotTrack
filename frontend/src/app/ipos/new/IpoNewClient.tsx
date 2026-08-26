'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import { createIpo } from '../../actions/ipoActions';

export default function IpoNewClient() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    category: 'mainboard',
    openDate: '',
    closeDate: '',
    allotmentDate: '',
    listingDate: '',
    priceBand: '',
    lotSize: '',
    lotValue: ''
  });

  const handleSaveIpo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      setError('IPO Name is required');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const payload: Record<string, unknown> = {
        name: formData.name,
        category: formData.category,
        priceBand: formData.priceBand || null,
        lotSize: formData.lotSize ? parseInt(formData.lotSize, 10) : null,
        lotValue: formData.lotValue ? parseInt(formData.lotValue, 10) : null,
      };

      if (formData.openDate) payload.openDate = new Date(formData.openDate).toISOString();
      if (formData.closeDate) payload.closeDate = new Date(formData.closeDate).toISOString();
      if (formData.allotmentDate) payload.allotmentDate = new Date(formData.allotmentDate).toISOString();
      if (formData.listingDate) payload.listingDate = new Date(formData.listingDate).toISOString();

      const created = await createIpo(payload);
      router.push(`/ipos/${created.id}`);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to create IPO');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-12 flex flex-col">
      <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/ipos')} className="text-gray-500 hover:text-gray-900 transition-colors">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Add New IPO</h1>
        </div>
      </div>

      {error && <div className="p-4 bg-red-50 text-red-600 font-medium text-sm border-b border-red-100">{error}</div>}

      <form onSubmit={handleSaveIpo} className="p-6 md:p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8 mb-8">
          
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Offering Details</h3>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">IPO Name *</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 placeholder-gray-400 rounded-md font-medium outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="e.g. Acme Corp Ltd" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Category</label>
                <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 rounded-md outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                  <option value="mainboard">Mainboard</option>
                  <option value="sme">SME</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Price Band</label>
                <input type="text" value={formData.priceBand} onChange={e => setFormData({...formData, priceBand: e.target.value})} className="w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 placeholder-gray-400 rounded-md outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="e.g. ₹100 - ₹105" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Lot Size</label>
                <input type="number" value={formData.lotSize} onChange={e => setFormData({...formData, lotSize: e.target.value})} className="w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 placeholder-gray-400 rounded-md outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="e.g. 150" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Lot Value (₹)</label>
                <input type="number" value={formData.lotValue} onChange={e => setFormData({...formData, lotValue: e.target.value})} className="w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 placeholder-gray-400 rounded-md outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="e.g. 15000" />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Key Dates</h3>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Open Date</label>
                <input type="date" value={formData.openDate} onChange={e => setFormData({...formData, openDate: e.target.value})} className="w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 placeholder-gray-400 rounded-md outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Close Date</label>
                <input type="date" value={formData.closeDate} onChange={e => setFormData({...formData, closeDate: e.target.value})} className="w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 placeholder-gray-400 rounded-md outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Allotment Date</label>
                <input type="date" value={formData.allotmentDate} onChange={e => setFormData({...formData, allotmentDate: e.target.value})} className="w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 placeholder-gray-400 rounded-md outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Listing Date</label>
                <input type="date" value={formData.listingDate} onChange={e => setFormData({...formData, listingDate: e.target.value})} className="w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 placeholder-gray-400 rounded-md outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-gray-100">
          <button type="submit" disabled={loading} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors shadow-sm disabled:opacity-70">
            <Save size={18} /> {loading ? 'Saving...' : 'Save IPO'}
          </button>
        </div>
      </form>
    </div>
  );
}
