'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Download, X, Loader2 } from 'lucide-react';
import { createIpo, fetchExternalIposList, fetchExternalIpoDetail } from '../../actions/ipoActions';

export default function IpoNewClient() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // External Fetch State
  const [showExternalModal, setShowExternalModal] = useState(false);
  const [isLoadingExternal, setIsLoadingExternal] = useState(false);
  const [isFetchingDetails, setIsFetchingDetails] = useState(false);
  const [externalIpos, setExternalIpos] = useState<{ name: string; priceBand: string; detailUrl: string }[]>([]);
  const [externalError, setExternalError] = useState('');
  const [expandedIpoIdx, setExpandedIpoIdx] = useState<number | null>(null);
  interface ExpandedIpoDetails {
    lotSize: number | null;
    openDate: string | null;
    closeDate: string | null;
    allotmentDate: string | null;
    listingDate: string | null;
    calculatedLotValue: string;
    gmp?: number | null;
    gmpPercentage?: string | null;
  }
  const [expandedIpoDetails, setExpandedIpoDetails] = useState<ExpandedIpoDetails | null>(null);
  
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

  const handleFetchExternalList = async () => {
    setIsLoadingExternal(true);
    setExternalError('');
    setExpandedIpoIdx(null);
    setExpandedIpoDetails(null);
    setShowExternalModal(true);
    try {
      const data = await fetchExternalIposList();
      if (data.success) {
        setExternalIpos(data.ipos);
      } else {
        setExternalError(data.error || 'Failed to fetch IPO list');
      }
    } catch {
      setExternalError('Failed to connect to server');
    } finally {
      setIsLoadingExternal(false);
    }
  };

  const handleSelectExternalIpo = async (ipo: { name: string; priceBand: string; detailUrl: string }, idx: number) => {
    if (expandedIpoIdx === idx) {
      setExpandedIpoIdx(null);
      return;
    }
    setExpandedIpoIdx(idx);
    setIsFetchingDetails(true);
    setExternalError('');
    setExpandedIpoDetails(null);
    try {
      const data = await fetchExternalIpoDetail(ipo.detailUrl);
      if (data.success) {
        const details = data.details;
        
        let calculatedLotValue = '';
        let gmpPercentage = null;
        if (details.lotSize && ipo.priceBand) {
          const matches = ipo.priceBand.match(/\d+(\.\d+)?/g);
          if (matches && matches.length > 0) {
            const maxPrice = Math.max(...matches.map(m => parseFloat(m)));
            calculatedLotValue = String(Math.round(details.lotSize * maxPrice));
            if (details.gmp !== undefined && details.gmp !== null) {
              gmpPercentage = ((details.gmp / maxPrice) * 100).toFixed(2);
            }
          }
        }
        setExpandedIpoDetails({
          ...details,
          calculatedLotValue,
          gmpPercentage
        });
      } else {
        setExternalError(data.error || 'Failed to fetch IPO details');
      }
    } catch {
      setExternalError('Failed to fetch IPO details');
    } finally {
      setIsFetchingDetails(false);
    }
  };

  const handleConfirmIpo = (ipo: { name: string; priceBand: string; detailUrl: string }) => {
    if (!expandedIpoDetails) return;
    setFormData({
      ...formData,
      name: ipo.name || '',
      priceBand: ipo.priceBand || '',
      lotSize: expandedIpoDetails.lotSize ? String(expandedIpoDetails.lotSize) : '',
      lotValue: expandedIpoDetails.calculatedLotValue,
      openDate: expandedIpoDetails.openDate ? expandedIpoDetails.openDate.split('T')[0] : '',
      closeDate: expandedIpoDetails.closeDate ? expandedIpoDetails.closeDate.split('T')[0] : '',
      allotmentDate: expandedIpoDetails.allotmentDate ? expandedIpoDetails.allotmentDate.split('T')[0] : '',
      listingDate: expandedIpoDetails.listingDate ? expandedIpoDetails.listingDate.split('T')[0] : '',
    });
    setShowExternalModal(false);
    setExpandedIpoIdx(null);
    setExpandedIpoDetails(null);
  };

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
    <>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-12 flex flex-col relative z-0">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50 flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push('/ipos')} className="text-gray-500 hover:text-gray-900 transition-colors">
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Add New IPO</h1>
          </div>
          <button 
            onClick={handleFetchExternalList}
            type="button"
            className="flex items-center gap-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-4 py-2 rounded-lg font-medium transition-colors border border-indigo-200"
          >
            <Download size={18} /> Fetch from IPOCentral
          </button>
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

      {/* External Fetch Modal */}
      {showExternalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[80vh]">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Select IPO</h2>
              <button onClick={() => setShowExternalModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 bg-gray-50">
              {isLoadingExternal ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                  <Loader2 className="animate-spin mb-4" size={32} />
                  <p>Fetching active IPOs from IPOCentral...</p>
                </div>
              ) : externalError ? (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg text-center">
                  {externalError}
                </div>
              ) : externalIpos.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No active IPOs found.
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {externalIpos.map((ipo, idx) => (
                    <div
                      key={idx}
                      className="bg-white border border-gray-200 rounded-lg overflow-hidden transition-all"
                    >
                      <button
                        onClick={() => handleSelectExternalIpo(ipo, idx)}
                        disabled={isFetchingDetails && expandedIpoIdx !== idx}
                        className="w-full text-left p-4 hover:bg-gray-50 flex justify-between items-center group disabled:opacity-50"
                      >
                        <div>
                          <div className="font-bold text-gray-900 group-hover:text-indigo-700">{ipo.name}</div>
                          <div className="text-sm text-gray-500 mt-1">{ipo.priceBand}</div>
                        </div>
                        {isFetchingDetails && expandedIpoIdx === idx && (
                          <Loader2 className="animate-spin text-indigo-500" size={20} />
                        )}
                      </button>
                      
                      {expandedIpoIdx === idx && (
                        <div className="p-4 border-t border-gray-100 bg-gray-50 text-sm">
                          {isFetchingDetails ? (
                            <div className="text-gray-500 italic flex items-center gap-2">
                              <Loader2 className="animate-spin" size={16} /> loading details...
                            </div>
                          ) : expandedIpoDetails ? (
                            <div className="space-y-3">
                              <div className="grid grid-cols-2 gap-2 text-gray-700">
                                <div><span className="font-medium text-gray-900">Open:</span> {expandedIpoDetails.openDate ? new Date(expandedIpoDetails.openDate).toLocaleDateString() : 'N/A'}</div>
                                <div><span className="font-medium text-gray-900">Close:</span> {expandedIpoDetails.closeDate ? new Date(expandedIpoDetails.closeDate).toLocaleDateString() : 'N/A'}</div>
                                <div><span className="font-medium text-gray-900">Allotment:</span> {expandedIpoDetails.allotmentDate ? new Date(expandedIpoDetails.allotmentDate).toLocaleDateString() : 'N/A'}</div>
                                <div><span className="font-medium text-gray-900">Listing:</span> {expandedIpoDetails.listingDate ? new Date(expandedIpoDetails.listingDate).toLocaleDateString() : 'N/A'}</div>
                                <div><span className="font-medium text-gray-900">Price per Lot:</span> {expandedIpoDetails.calculatedLotValue ? `₹${expandedIpoDetails.calculatedLotValue}` : 'N/A'}</div>
                                {expandedIpoDetails.gmp !== undefined && expandedIpoDetails.gmp !== null && (
                                  <div><span className="font-medium text-gray-900">GMP:</span> ₹{expandedIpoDetails.gmp} ({expandedIpoDetails.gmpPercentage}%)</div>
                                )}
                              </div>
                              <div className="pt-2">
                                <button
                                  type="button"
                                  onClick={() => handleConfirmIpo(ipo)}
                                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
                                >
                                  Use this IPO
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="text-red-500">Failed to load details.</div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
