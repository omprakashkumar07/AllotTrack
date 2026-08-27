'use client';

import { useState } from 'react';
import { Eye, EyeOff, Edit, Trash2, Plus, X, Copy, Check, Loader2 } from 'lucide-react';
import { createApplicant, updateApplicant, deleteApplicant, getApplicant, getApplicants } from '../actions/applicantActions';

interface ApplicantData {
  id: string;
  name: string;
  panEncrypted: string;
  mobileNumber: string;
}

export default function ApplicantClient({ initialApplicants }: { initialApplicants: ApplicantData[] }) {
  const [applicants, setApplicants] = useState(initialApplicants);
  const [revealedPans, setRevealedPans] = useState<Record<string, string>>({});
  const [copyingIds, setCopyingIds] = useState<Record<string, boolean>>({});
  const [copiedIds, setCopiedIds] = useState<Record<string, boolean>>({});
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState('');
  
  // Form state
  const [formData, setFormData] = useState({ name: '', pan: '', mobileNumber: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const refreshList = async () => {
    try {
      const data = await getApplicants();
      setApplicants(data);
    } catch (err) {
      console.error('Failed to refresh list', err);
    }
  };

  const handleCopyPan = async (id: string) => {
    if (copyingIds[id]) return;
    setCopyingIds(prev => ({ ...prev, [id]: true }));
    setCopiedIds(prev => ({ ...prev, [id]: false }));
    try {
      const fullData = await getApplicant(id, true);
      await navigator.clipboard.writeText(fullData.panEncrypted);
      setCopiedIds(prev => ({ ...prev, [id]: true }));
      setTimeout(() => setCopiedIds(prev => ({ ...prev, [id]: false })), 2000);
    } catch (err) {
      console.error('Failed to copy PAN', err);
    } finally {
      setCopyingIds(prev => ({ ...prev, [id]: false }));
    }
  };

  const handleRevealToggle = async (id: string) => {
    if (revealedPans[id]) {
      // Hide it
      const newRevealed = { ...revealedPans };
      delete newRevealed[id];
      setRevealedPans(newRevealed);
    } else {
      // Fetch unmasked
      try {
        const fullData = await getApplicant(id, true);
        setRevealedPans({ ...revealedPans, [id]: fullData.panEncrypted });
      } catch (err) {
        console.error('Failed to reveal PAN', err);
      }
    }
  };

  const openAddModal = () => {
    setIsEditing(false);
    setFormData({ name: '', pan: '', mobileNumber: '' });
    setError('');
    setIsModalOpen(true);
  };

  const openEditModal = (app: ApplicantData) => {
    setIsEditing(true);
    setCurrentId(app.id);
    // Note: We don't populate PAN so they only update it if they want to
    setFormData({ name: app.name, pan: '', mobileNumber: app.mobileNumber });
    setError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isEditing) {
        const updateData: Record<string, string> = { name: formData.name, mobileNumber: formData.mobileNumber };
        if (formData.pan.trim() !== '') {
          updateData.pan = formData.pan;
        }
        await updateApplicant(currentId, updateData);
        // Clear revealed state for this ID if they updated PAN
        if (formData.pan.trim() !== '') {
           const newRevealed = { ...revealedPans };
           delete newRevealed[currentId];
           setRevealedPans(newRevealed);
        }
      } else {
        await createApplicant(formData);
      }
      await refreshList();
      setIsModalOpen(false);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this applicant?')) return;
    try {
      await deleteApplicant(id);
      await refreshList();
    } catch (err: unknown) {
      console.error('Failed to delete', err);
      if (err instanceof Error) {
        alert(err.message);
      } else {
        alert('Failed to delete applicant');
      }
    }
  };

  return (
    <div>
      <div className="mb-6 flex justify-end">
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <Plus size={20} />
          Add Applicant
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">PAN</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Mobile</th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {applicants.map((app) => (
              <tr key={app.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{app.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-mono flex items-center gap-3">
                  {revealedPans[app.id] || app.panEncrypted}
                  <button 
                    onClick={() => handleRevealToggle(app.id)}
                    className="text-gray-400 hover:text-blue-600 transition-colors focus:outline-none"
                    title={revealedPans[app.id] ? "Hide PAN" : "Reveal PAN"}
                  >
                    {revealedPans[app.id] ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                  <button
                    onClick={() => handleCopyPan(app.id)}
                    disabled={copyingIds[app.id]}
                    className="text-gray-400 hover:text-green-600 transition-colors focus:outline-none disabled:opacity-50"
                    title="Copy full PAN"
                  >
                    {copyingIds[app.id] ? <Loader2 size={16} className="animate-spin" /> : copiedIds[app.id] ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{app.mobileNumber}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button onClick={() => openEditModal(app)} className="text-blue-600 hover:text-blue-900 mr-4 transition-colors">
                    <Edit size={18} className="inline" />
                  </button>
                  <button onClick={() => handleDelete(app.id)} className="text-red-600 hover:text-red-900 transition-colors">
                    <Trash2 size={18} className="inline" />
                  </button>
                </td>
              </tr>
            ))}
            {applicants.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                  No applicants found. Add one to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">
                {isEditing ? 'Edit Applicant' : 'Add Applicant'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-medium">
                  {error}
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 bg-white text-gray-900 placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  placeholder="John Doe"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  PAN Number {isEditing && <span className="text-gray-400 font-normal">(Leave blank to keep existing)</span>}
                </label>
                <input
                  type="text"
                  required={!isEditing}
                  value={formData.pan}
                  onChange={(e) => setFormData({...formData, pan: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 bg-white text-gray-900 placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-mono"
                  placeholder="ABCDE1234F"
                  maxLength={10}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
                <input
                  type="tel"
                  required
                  value={formData.mobileNumber}
                  onChange={(e) => setFormData({...formData, mobileNumber: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 bg-white text-gray-900 placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  placeholder="+91 9876543210"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-70"
                >
                  {loading ? 'Saving...' : 'Save Applicant'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
