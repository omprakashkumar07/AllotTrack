'use client';

import { useState } from 'react';
import { RefreshCw, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getIpos, fetchLiveIpos } from '../actions/ipoActions';
import { formatDate } from '@/lib/formatDate';

interface IpoData {
  id: string;
  name: string;
  category: string;
  openDate: string | null;
  closeDate: string | null;
  priceBand: string | null;
  dataSource: string;
}

export default function IpoListClient({ initialIpos }: { initialIpos: IpoData[] }) {
  const [ipos, setIpos] = useState<IpoData[]>(initialIpos);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRefreshLive = async () => {
    setLoading(true);
    try {
      await fetchLiveIpos();
      const updatedIpos = await getIpos();
      setIpos(updatedIpos);
    } catch (error) {
      console.error('Failed to fetch live IPOs:', error);
      alert('Failed to refresh live IPOs from Gemini.');
    } finally {
      setLoading(false);
    }
  };

  const formatDateDisplay = (d: string | null) => formatDate(d);

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold text-gray-900">IPOs</h1>
        <div className="flex gap-3">
          <button
            onClick={() => router.push('/ipos/new')}
            className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <Plus size={20} />
            Manual Add
          </button>
          <button
            onClick={handleRefreshLive}
            disabled={loading}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-70"
          >
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
            {loading ? 'Fetching...' : 'Refresh from live data'}
          </button>
        </div>
      </div>

      {ipos.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200 text-gray-500">
          No IPOs found. Click &quot;Refresh from live data&quot; to fetch currently open IPOs.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ipos.map(ipo => (
            <div 
              key={ipo.id} 
              onClick={() => router.push(`/ipos/${ipo.id}`)}
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer relative group"
            >
              <div className="absolute top-4 right-4 text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded uppercase font-semibold tracking-wider">
                {ipo.category}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2 pr-20">{ipo.name}</h3>
              <div className="space-y-2 mt-4 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span className="font-medium">Open Date:</span>
                  <span>{formatDateDisplay(ipo.openDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Close Date:</span>
                  <span>{formatDateDisplay(ipo.closeDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Price Band:</span>
                  <span>{ipo.priceBand || 'TBA'}</span>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-gray-100 text-xs text-gray-400 flex justify-between items-center">
                <span>Source: {ipo.dataSource}</span>
                <span className="text-blue-600 group-hover:underline">View details &rarr;</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
