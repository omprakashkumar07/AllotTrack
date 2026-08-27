'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Edit2, Save, X, Plus, Trash2, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { updateIpo } from '../../actions/ipoActions';
import { getApplicants, getApplicant } from '../../actions/applicantActions';
import { getApplications, createApplication, deleteApplication, updateApplication } from '../../actions/applicationActions';
import { formatCurrency } from '@/lib/formatCurrency';
import { formatDate } from '@/lib/formatDate';
import { calculateApplicationMetrics } from '@/lib/calculations';
import IpoStatusBadge from '@/components/IpoStatusBadge';

interface IpoData {
  id: string;
  name: string;
  category: string;
  openDate: string | null;
  closeDate: string | null;
  allotmentDate: string | null;
  listingDate: string | null;
  priceBand: string | null;
  lotSize: number | null;
  lotValue: number | null;
  dataSource: string;
}

interface ApplicantData {
  id: string;
  name: string;
  panEncrypted: string;
  mobileNumber: string;
}

interface ApplicationData {
  id: string;
  ipoId: string;
  applicantId: string;
  applied: boolean;
  amountSent: number;
  sourceOfFunds: string;
  allotmentStatus: string;
  sharesAllotted: number | null;
  amountReceivedBack: number | null;
  amountTransferred: number | null;
  receivedFromApplicant: boolean;
  amountReceivedFromApplicant: number | null;
  applicant: ApplicantData;
}

function ApplicationRow({ 
  app, 
  ipo,
  onDelete,
  onRefresh
}: { 
  app: ApplicationData, 
  ipo: IpoData,
  onDelete: (id: string) => void,
  onRefresh: () => void
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [status, setStatus] = useState(app.allotmentStatus || 'pending');
  const [shares, setShares] = useState(app.sharesAllotted?.toString() || '');
  const [refund, setRefund] = useState(app.amountReceivedBack !== null && app.amountReceivedBack !== undefined ? app.amountReceivedBack.toString() : '');
  const [loading, setLoading] = useState(false);
  const [toggleLoading, setToggleLoading] = useState(false);
  const [revealedPan, setRevealedPan] = useState<string | null>(null);

  const handleRevealToggle = async () => {
    if (revealedPan) {
      setRevealedPan(null);
    } else {
      try {
        const fullData = await getApplicant(app.applicant.id, true);
        setRevealedPan(fullData.panEncrypted);
      } catch (err) {
        console.error('Failed to reveal PAN', err);
      }
    }
  };

  const handleToggleApplied = async () => {
    if (toggleLoading) return;
    setToggleLoading(true);
    try {
      await updateApplication(app.id, { applied: !app.applied });
      onRefresh();
    } catch (err) {
      console.error(err);
      alert('Failed to update applied status');
    } finally {
      setToggleLoading(false);
    }
  };

  const [settleToggleLoading, setSettleToggleLoading] = useState(false);
  const [receivedAmt, setReceivedAmt] = useState(app.amountReceivedFromApplicant?.toString() || '');

  const handleToggleSettled = async () => {
    if (settleToggleLoading) return;
    setSettleToggleLoading(true);
    try {
      const newStatus = !app.receivedFromApplicant;
      await updateApplication(app.id, { 
        receivedFromApplicant: newStatus,
        amountReceivedFromApplicant: newStatus ? (app.amountReceivedFromApplicant || null) : null 
      });
      onRefresh();
    } catch (err) {
      console.error(err);
      alert('Failed to update settlement status');
    } finally {
      setSettleToggleLoading(false);
    }
  };

  const handleSaveSettlementAmt = async () => {
    try {
      await updateApplication(app.id, {
        receivedFromApplicant: true,
        amountReceivedFromApplicant: receivedAmt !== '' ? parseInt(receivedAmt, 10) : null
      });
      onRefresh();
    } catch(err) {
      console.error(err);
      alert('Failed to save settlement amount');
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateApplication(app.id, {
        allotmentStatus: status,
        sharesAllotted: shares !== '' ? parseInt(shares, 10) : null,
        amountReceivedBack: refund !== '' ? parseInt(refund, 10) : null
      });
      setIsEditing(false);
      onRefresh();
    } catch (err) {
      console.error(err);
      alert('Failed to update allotment details');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus);
    if (newStatus === 'allotted') {
      setRefund('0');
    } else if (newStatus === 'not_allotted') {
      const fullAmount = app.amountTransferred ?? app.amountSent;
      setRefund(fullAmount.toString());
    } else {
      setRefund('');
    }
  };

  const { lotsApplied, profit, profitPercent } = calculateApplicationMetrics({
    ipo: { lotValue: ipo.lotValue, lotSize: ipo.lotSize },
    application: app
  });

  return (
    <>
    <tr className={`hover:bg-gray-50 ${isExpanded ? 'bg-blue-50/50' : ''}`}>
      <td className="px-4 py-3 whitespace-nowrap text-gray-400 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transform transition-transform ${isExpanded ? 'rotate-90' : ''}`}>
          <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        <div className="text-sm font-medium text-gray-900">{app.applicant.name}</div>
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 font-medium">
        ₹{formatCurrency(app.amountSent)}
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
        {app.amountTransferred !== null && app.amountTransferred !== undefined ? (
          <span className="text-gray-900">₹{formatCurrency(app.amountTransferred)}</span>
        ) : (
          <span className="text-gray-400 italic" title="Fallback to IPO Amount">₹{formatCurrency(app.amountSent)}</span>
        )}
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
        {lotsApplied} lot{lotsApplied !== 1 ? 's' : ''}
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        <div className="flex flex-col gap-2">
          <label className="flex items-center cursor-pointer relative">
            <input type="checkbox" className="sr-only peer" checked={app.receivedFromApplicant} onChange={handleToggleSettled} disabled={settleToggleLoading} />
            <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-600 peer-disabled:opacity-50"></div>
          </label>
          {app.receivedFromApplicant && (
            <div className="flex items-center gap-2">
              <input 
                 type="number" 
                 className="border border-gray-300 rounded px-2 py-1 w-20 text-xs" 
                 value={receivedAmt} 
                 onChange={e => setReceivedAmt(e.target.value)} 
                 placeholder="Amount" 
              />
              <button onClick={handleSaveSettlementAmt} className="text-green-600 hover:text-green-800"><CheckCircle size={14} /></button>
            </div>
          )}
        </div>
      </td>

      <>
        {isEditing ? (
          <td colSpan={3} className="px-4 py-3">
            <div className="flex gap-2 items-center">
              <select className="border border-gray-300 bg-white text-gray-900 rounded px-2 py-1 text-sm w-24" value={status} onChange={e => handleStatusChange(e.target.value)}>
                <option value="pending">Pending</option>
                <option value="allotted">Allotted</option>
                <option value="not_allotted">Not Allotted</option>
              </select>
              <input type="number" placeholder="Shares" className="border border-gray-300 bg-white text-gray-900 placeholder-gray-400 rounded px-2 py-1 w-16 text-sm" value={shares} onChange={e => setShares(e.target.value)} />
              <input type="number" placeholder="Refund (₹)" className="border border-gray-300 bg-white text-gray-900 placeholder-gray-400 rounded px-2 py-1 w-24 text-sm" value={refund} onChange={e => setRefund(e.target.value)} />
              <button onClick={handleSave} disabled={loading} className="text-green-600 hover:text-green-800"><CheckCircle size={18} /></button>
              <button onClick={() => setIsEditing(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
          </td>
        ) : (
          <>
            <td className="px-4 py-3 whitespace-nowrap text-sm">
              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${app.allotmentStatus === 'allotted' ? 'bg-green-100 text-green-800' : app.allotmentStatus === 'not_allotted' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                {app.allotmentStatus === 'allotted' ? 'Allotted' : app.allotmentStatus === 'not_allotted' ? 'Not Allotted' : 'Pending'}
              </span>
            </td>
            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 font-medium">
              {app.sharesAllotted || '-'}
            </td>
            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 font-medium">
              {app.amountReceivedBack !== null && app.amountReceivedBack !== undefined ? `₹${formatCurrency(app.amountReceivedBack)}` : '-'}
            </td>
          </>
        )}
      </>

      <td className="px-4 py-3 whitespace-nowrap text-sm">
        {profit !== null ? (
          <div className={`flex flex-col font-medium ${profit > 0 ? 'text-green-600' : profit < 0 ? 'text-red-600' : 'text-gray-600'}`}>
            <span>₹{formatCurrency(Math.abs(profit))} {profit >= 0 ? 'profit' : 'loss'}</span>
            <span className="text-xs opacity-80">{profit > 0 ? '+' : ''}{profitPercent?.toFixed(2)}%</span>
          </div>
        ) : (
          <span className="text-gray-400 font-medium">-</span>
        )}
      </td>

      <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
        {!isEditing && (
          <button onClick={() => setIsEditing(true)} className="text-blue-600 hover:text-blue-900 transition-colors mr-3">
            <Edit2 size={16} className="inline" />
          </button>
        )}
        <button onClick={() => onDelete(app.id)} className="text-red-600 hover:text-red-900 transition-colors">
          <Trash2 size={18} className="inline" />
        </button>
      </td>
    </tr>
    {isExpanded && (
      <tr className="bg-gray-50 border-b border-gray-200">
        <td colSpan={11} className="p-0">
          <div className="px-14 py-4 flex gap-12 text-sm">
            <div>
              <span className="text-gray-500 font-medium mr-2">PAN:</span>
              <span className="font-mono text-gray-900">
                {revealedPan || app.applicant.panEncrypted}
                <button 
                  onClick={handleRevealToggle}
                  className="ml-2 text-gray-400 hover:text-blue-600 transition-colors focus:outline-none"
                  title={revealedPan ? "Hide PAN" : "Reveal PAN"}
                >
                  {revealedPan ? <EyeOff size={14} className="inline" /> : <Eye size={14} className="inline" />}
                </button>
              </span>
            </div>
            <div>
              <span className="text-gray-500 font-medium mr-2">Source:</span>
              <span className="text-gray-900">{app.sourceOfFunds}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500 font-medium">Applied Status:</span>
              <label className="flex items-center cursor-pointer relative">
                <input type="checkbox" className="sr-only peer" checked={app.applied} onChange={handleToggleApplied} disabled={toggleLoading} />
                <div className="w-8 h-4 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-blue-600 peer-disabled:opacity-50"></div>
              </label>
              <span className="text-xs text-gray-500">{app.applied ? 'Applied' : 'Pending'}</span>
            </div>
          </div>
        </td>
      </tr>
    )}
    </>
  );
}

export default function IpoDetailClient({ initialIpo }: { initialIpo: IpoData }) {
  const [ipo, setIpo] = useState<IpoData>(initialIpo);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<IpoData>(initialIpo);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const [applicants, setApplicants] = useState<ApplicantData[]>([]);
  const [applications, setApplications] = useState<ApplicationData[]>([]);

  const [showAppForm, setShowAppForm] = useState(false);
  const [appFormError, setAppFormError] = useState('');
  const [appFormLoading, setAppFormLoading] = useState(false);
  const [searchDropdownOpen, setSearchDropdownOpen] = useState(false);
  const [appSearchTerm, setAppSearchTerm] = useState('');
  
  const [selectedApplicantId, setSelectedApplicantId] = useState('');
  const [amountSent, setAmountSent] = useState<string>('');
  const [amountTransferred, setAmountTransferred] = useState<string>('');
  const [sourceOfFunds, setSourceOfFunds] = useState('');
  const [appliedStatus, setAppliedStatus] = useState(true);

  const fetchApplications = useCallback(() => {
    getApplications(ipo.id).then(setApplications).catch(console.error);
  }, [ipo.id]);

  useEffect(() => {
    getApplicants().then(setApplicants).catch(console.error);
    fetchApplications();
  }, [fetchApplications]);

  const toDateInputString = (isoString: string | null) => {
    if (!isoString) return '';
    return new Date(isoString).toISOString().split('T')[0];
  };

  const handleSaveIpo = async () => {
    setLoading(true);
    setError('');
    try {
      const payload: Record<string, unknown> = {
        name: formData.name,
        category: formData.category,
        priceBand: formData.priceBand,
        lotSize: formData.lotSize ? parseInt(formData.lotSize.toString(), 10) : null,
        lotValue: formData.lotValue ? parseInt(formData.lotValue.toString(), 10) : null,
      };

      if (formData.openDate) payload.openDate = new Date(formData.openDate).toISOString();
      if (formData.closeDate) payload.closeDate = new Date(formData.closeDate).toISOString();
      if (formData.allotmentDate) payload.allotmentDate = new Date(formData.allotmentDate).toISOString();
      if (formData.listingDate) payload.listingDate = new Date(formData.listingDate).toISOString();

      const updated = await updateIpo(ipo.id, payload);
      setIpo(updated);
      setIsEditing(false);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to update IPO');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaveApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    setAppFormError('');
    
    if (!selectedApplicantId) {
      setAppFormError('Please select an applicant.');
      return;
    }

    const amount = parseInt(amountSent, 10);
    if (isNaN(amount) || amount < 0) {
      setAppFormError('Please enter a valid amount.');
      return;
    }

    setAppFormLoading(true);
    try {
      await createApplication({
        ipoId: ipo.id,
        applicantId: selectedApplicantId,
        amountSent: amount,
        amountTransferred: amountTransferred ? parseInt(amountTransferred, 10) : null,
        sourceOfFunds,
        applied: appliedStatus
      });
      fetchApplications();
      setShowAppForm(false);
      
      setSelectedApplicantId('');
      setAmountSent('');
      setAmountTransferred('');
      setSourceOfFunds('');
      setAppliedStatus(true);
      setAppSearchTerm('');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setAppFormError(err.message);
      } else {
        setAppFormError('Failed to save application');
      }
    } finally {
      setAppFormLoading(false);
    }
  };

  const handleDeleteApplication = async (appId: string) => {
    if (!confirm('Are you sure you want to delete this application?')) return;
    try {
      await deleteApplication(appId);
      fetchApplications();
    } catch (err) {
      console.error('Delete error', err);
      alert('Failed to delete application.');
    }
  };

  const formatDateDisplay = (d: string | null) => formatDate(d);
  const selectedApplicant = applicants.find(a => a.id === selectedApplicantId);
  const filteredApplicants = applicants.filter(a => a.name.toLowerCase().includes(appSearchTerm.toLowerCase()));

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-12 flex flex-col">
      <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/ipos')} className="text-gray-500 hover:text-gray-900 transition-colors">
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              {ipo.name}
              <IpoStatusBadge listingDate={ipo.listingDate} />
            </h1>
            <p className="text-sm text-gray-500 uppercase tracking-wider mt-1">{ipo.category} • {ipo.dataSource}</p>
          </div>
        </div>
        <div>
          {!isEditing ? (
            <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg font-medium transition-colors shadow-sm">
              <Edit2 size={18} /> Edit Details
            </button>
          ) : (
            <div className="flex gap-2">
              <button onClick={() => { setIsEditing(false); setFormData(ipo); setError(''); }} className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg font-medium transition-colors shadow-sm">
                <X size={18} /> Cancel
              </button>
              <button onClick={handleSaveIpo} disabled={loading} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm disabled:opacity-70">
                <Save size={18} /> {loading ? 'Saving...' : 'Save'}
              </button>
            </div>
          )}
        </div>
      </div>

      {error && <div className="p-4 bg-red-50 text-red-600 font-medium text-sm border-b border-red-100">{error}</div>}

      <div className="p-6 md:p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8 mb-12">
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Key Dates</h3>
            <div className="grid grid-cols-1 gap-4">
              <div><label className="block text-sm font-medium text-gray-500 mb-1">Open Date</label>{isEditing ? <input type="date" value={toDateInputString(formData.openDate)} onChange={e => setFormData({...formData, openDate: e.target.value})} className="w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 placeholder-gray-400 rounded-md" /> : <div className="text-gray-900 font-medium">{formatDateDisplay(ipo.openDate)}</div>}</div>
              <div><label className="block text-sm font-medium text-gray-500 mb-1">Close Date</label>{isEditing ? <input type="date" value={toDateInputString(formData.closeDate)} onChange={e => setFormData({...formData, closeDate: e.target.value})} className="w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 placeholder-gray-400 rounded-md" /> : <div className="text-gray-900 font-medium">{formatDateDisplay(ipo.closeDate)}</div>}</div>
              <div><label className="block text-sm font-medium text-gray-500 mb-1">Allotment Date</label>{isEditing ? <input type="date" value={toDateInputString(formData.allotmentDate)} onChange={e => setFormData({...formData, allotmentDate: e.target.value})} className="w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 placeholder-gray-400 rounded-md" /> : <div className="text-gray-900 font-medium">{formatDateDisplay(ipo.allotmentDate)}</div>}</div>
              <div><label className="block text-sm font-medium text-gray-500 mb-1">Listing Date</label>{isEditing ? <input type="date" value={toDateInputString(formData.listingDate)} onChange={e => setFormData({...formData, listingDate: e.target.value})} className="w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 placeholder-gray-400 rounded-md" /> : <div className="text-gray-900 font-medium">{formatDateDisplay(ipo.listingDate)}</div>}</div>
            </div>
          </div>
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Offering Details</h3>
            <div className="grid grid-cols-1 gap-4">
              {isEditing && <div><label className="block text-sm font-medium text-gray-500 mb-1">IPO Name</label><input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 placeholder-gray-400 rounded-md font-medium" /></div>}
              <div><label className="block text-sm font-medium text-gray-500 mb-1">Price Band</label>{isEditing ? <input type="text" value={formData.priceBand || ''} onChange={e => setFormData({...formData, priceBand: e.target.value})} className="w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 placeholder-gray-400 rounded-md" placeholder="e.g. ₹100 - ₹105" /> : <div className="text-gray-900 font-medium">{ipo.priceBand || 'TBA'}</div>}</div>
              <div><label className="block text-sm font-medium text-gray-500 mb-1">Lot Size</label>{isEditing ? <input type="number" value={formData.lotSize || ''} onChange={e => setFormData({...formData, lotSize: parseInt(e.target.value) || null})} className="w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 placeholder-gray-400 rounded-md" /> : <div className="text-gray-900 font-medium">{ipo.lotSize ? `${ipo.lotSize} shares` : 'TBA'}</div>}</div>
              <div><label className="block text-sm font-medium text-gray-500 mb-1">Lot Value (₹)</label>{isEditing ? <input type="number" value={formData.lotValue || ''} onChange={e => setFormData({...formData, lotValue: parseInt(e.target.value) || null})} className="w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 placeholder-gray-400 rounded-md" placeholder="e.g. 15000" /> : <div className="text-gray-900 font-medium">{ipo.lotValue ? `₹${formatCurrency(ipo.lotValue)}` : 'Not set'}</div>}</div>
            </div>
          </div>
        </div>

        <div className="border-t pt-8 overflow-visible">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-900">Applications</h3>
            {!showAppForm && (
              <button onClick={() => setShowAppForm(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm">
                <Plus size={16} /> Add Application
              </button>
            )}
          </div>

          {showAppForm && (
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 mb-8">
              <div className="flex justify-between items-start mb-4">
                <h4 className="text-lg font-semibold text-gray-900">New Application</h4>
                <button onClick={() => setShowAppForm(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
              </div>
              
              <form onSubmit={handleSaveApplication} className="space-y-6">
                {appFormError && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-medium">{appFormError}</div>}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Applicant</label>
                    <div className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white cursor-pointer" onClick={() => setSearchDropdownOpen(true)}>
                      {selectedApplicant ? selectedApplicant.name : <span className="text-gray-400">Search applicant...</span>}
                    </div>
                    {searchDropdownOpen && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
                        <div className="p-2 border-b">
                          <input type="text" autoFocus placeholder="Type to search..." className="w-full px-3 py-1.5 border border-gray-300 bg-white text-gray-900 placeholder-gray-400 rounded outline-none focus:border-blue-500" value={appSearchTerm} onChange={(e) => setAppSearchTerm(e.target.value)} />
                        </div>
                        <ul className="max-h-48 overflow-y-auto py-1">
                          {filteredApplicants.map(app => (
                            <li key={app.id} className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-sm" onClick={() => { setSelectedApplicantId(app.id); setSearchDropdownOpen(false); setAppSearchTerm(''); }}>
                              {app.name} <span className="text-gray-400">({app.panEncrypted})</span>
                            </li>
                          ))}
                          {filteredApplicants.length === 0 && <li className="px-4 py-2 text-sm text-gray-500">No applicants found</li>}
                        </ul>
                      </div>
                    )}
                    {searchDropdownOpen && <div className="fixed inset-0 z-0" onClick={() => setSearchDropdownOpen(false)}></div>}
                  </div>
                  {selectedApplicant ? (
                    <div className="bg-white border rounded-lg p-3 text-sm flex flex-col justify-center">
                      <div><span className="text-gray-500">Name:</span> <span className="font-medium text-gray-900">{selectedApplicant.name}</span></div>
                      <div><span className="text-gray-500">Mobile:</span> <span className="font-medium text-gray-900">{selectedApplicant.mobileNumber}</span></div>
                      <div><span className="text-gray-500">PAN:</span> <span className="font-medium text-gray-900 font-mono">{selectedApplicant.panEncrypted}</span></div>
                    </div>
                  ) : (
                    <div className="bg-gray-100 border border-transparent rounded-lg p-3 text-sm text-gray-400 flex items-center justify-center italic">
                      Select an applicant to view details
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Applied Status</label>
                    <div className="flex items-center mt-2">
                      <label className="flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={appliedStatus} onChange={(e) => setAppliedStatus(e.target.checked)} />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        <span className="ml-3 text-sm font-medium text-gray-900">{appliedStatus ? 'Applied' : 'Not Applied'}</span>
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">IPO Amount (₹)</label>
                    <input type="number" required value={amountSent} onChange={(e) => setAmountSent(e.target.value)} className="w-full px-4 py-2 border border-gray-300 bg-white text-gray-900 placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" placeholder="e.g. 15000" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Amount Sent to Applicant (₹)</label>
                    <input type="number" value={amountTransferred} onChange={(e) => setAmountTransferred(e.target.value)} className="w-full px-4 py-2 border border-gray-300 bg-white text-gray-900 placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" placeholder="Leave blank if same as IPO Amount" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Source of Funds</label>
                    <input type="text" required value={sourceOfFunds} onChange={(e) => setSourceOfFunds(e.target.value)} className="w-full px-4 py-2 border border-gray-300 bg-white text-gray-900 placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" placeholder="e.g. HDFC Bank Acct" />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button type="submit" disabled={appFormLoading} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-70">
                    {appFormLoading ? 'Saving...' : 'Save Application'}
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="overflow-x-auto border border-gray-200 rounded-xl w-full">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 w-10"></th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Applicant</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">IPO Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Sent to Applicant</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Lots Applied</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Settled</th>
                  
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Allotment</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Shares</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Refund</th>
                  
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Profit</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {applications.map((app) => (
                  <ApplicationRow 
                    key={app.id} 
                    app={app}
                    ipo={ipo}
                    onDelete={handleDeleteApplication}
                    onRefresh={fetchApplications}
                  />
                ))}
                {applications.length === 0 && (
                  <tr>
                    <td colSpan={11} className="px-6 py-8 text-center text-gray-500 text-sm">
                      No applications added yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
