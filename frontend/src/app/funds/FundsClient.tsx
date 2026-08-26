'use client';

import { useState } from 'react';
import { Plus, X, Trash2, TrendingUp, DollarSign, Briefcase, Wallet, CheckCircle, Percent, ArrowUpCircle, ArrowDownCircle, Clock, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import { createFundTransaction, deleteFundTransaction, getFundTransactions } from '../actions/fundActions';
import { getCapitalTransactions, createCapitalTransaction } from '../actions/capitalActions';
import { getPersonalWithdrawals, createPersonalWithdrawal } from '../actions/personalWithdrawalActions';
import { formatCurrency } from '@/lib/formatCurrency';
import { formatDate, formatTime } from '@/lib/formatDate';

interface ApplicantData {
  id: string;
  name: string;
}

interface FundTransaction {
  id: string;
  applicantId: string;
  type: string; // 'sent' | 'received'
  amount: number;
  date: string;
  notes: string | null;
  applicant: ApplicantData;
}

interface CapitalTransaction {
  id: string;
  type: string; // 'add' | 'withdraw'
  amount: number;
  reason: string;
  createdAt: string;
}

interface PersonalWithdrawal {
  id: string;
  amount: number;
  reason: string;
  createdAt: string;
}

export default function FundsClient({ 
  initialTransactions, 
  initialApplicants,
  initialCapitalTransactions,
  initialPersonalWithdrawals
}: { 
  initialTransactions: FundTransaction[], 
  initialApplicants: ApplicantData[],
  initialCapitalTransactions: CapitalTransaction[],
  initialPersonalWithdrawals: PersonalWithdrawal[]
}) {
  const [transactions, setTransactions] = useState<FundTransaction[]>(initialTransactions);
  const [capitalTransactions, setCapitalTransactions] = useState<CapitalTransaction[]>(initialCapitalTransactions);
  const [personalWithdrawals, setPersonalWithdrawals] = useState<PersonalWithdrawal[]>(initialPersonalWithdrawals);
  
  // Transaction Form State
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [applicantId, setApplicantId] = useState('');
  const [type, setType] = useState('sent');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');

  // Capital Modal State
  const [showCapitalModal, setShowCapitalModal] = useState(false);
  const [capitalFormOpen, setCapitalFormOpen] = useState(false);
  const [capitalType, setCapitalType] = useState<'add' | 'withdraw'>('add');
  const [capitalAmount, setCapitalAmount] = useState('');
  const [capitalReason, setCapitalReason] = useState('');
  const [capitalLoading, setCapitalLoading] = useState(false);
  const [capitalError, setCapitalError] = useState('');

  // Personal Withdrawal Modal State
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [withdrawalFormOpen, setWithdrawalFormOpen] = useState(false);
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [withdrawalReason, setWithdrawalReason] = useState('');
  const [withdrawalLoading, setWithdrawalLoading] = useState(false);
  const [withdrawalError, setWithdrawalError] = useState('');

  const refreshTransactions = async () => {
    try {
      const data = await getFundTransactions();
      setTransactions(data);
    } catch (err) {
      console.error('Failed to fetch transactions', err);
    }
  };

  const refreshCapitalTransactions = async () => {
    try {
      const data = await getCapitalTransactions();
      setCapitalTransactions(data);
    } catch (err) {
      console.error('Failed to fetch capital transactions', err);
    }
  };

  const refreshPersonalWithdrawals = async () => {
    try {
      const data = await getPersonalWithdrawals();
      setPersonalWithdrawals(data);
    } catch (err) {
      console.error('Failed to fetch personal withdrawals', err);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applicantId || !amount) {
      setError('Applicant and Amount are required.');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      await createFundTransaction({
        applicantId,
        type,
        amount: parseInt(amount, 10),
        notes: notes || null
      });
      await refreshTransactions();
      setShowForm(false);
      setApplicantId('');
      setAmount('');
      setNotes('');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to create transaction');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this transaction?')) return;
    try {
      await deleteFundTransaction(id);
      refreshTransactions();
    } catch (err) {
      console.error(err);
      alert('Failed to delete transaction.');
    }
  };

  const handleSaveCapital = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!capitalAmount || !capitalReason) {
      setCapitalError('Amount and Reason are required.');
      return;
    }

    const val = parseInt(capitalAmount, 10);
    if (isNaN(val) || val <= 0) {
      setCapitalError('Enter a valid positive number');
      return;
    }

    setCapitalLoading(true);
    setCapitalError('');

    try {
      await createCapitalTransaction({
        type: capitalType,
        amount: val,
        reason: capitalReason
      });
      await refreshCapitalTransactions();
      setCapitalFormOpen(false);
      setCapitalAmount('');
      setCapitalReason('');
    } catch(err: unknown) {
      if (err instanceof Error) {
        setCapitalError(err.message);
      } else {
        setCapitalError('Failed to save capital transaction');
      }
    } finally {
      setCapitalLoading(false);
    }
  };

  const handleSaveWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!withdrawalAmount || !withdrawalReason) {
      setWithdrawalError('Amount and Reason are required.');
      return;
    }

    const val = parseInt(withdrawalAmount, 10);
    if (isNaN(val) || val <= 0) {
      setWithdrawalError('Enter a valid positive number');
      return;
    }

    setWithdrawalLoading(true);
    setWithdrawalError('');

    try {
      await createPersonalWithdrawal({
        amount: val,
        reason: withdrawalReason
      });
      await refreshPersonalWithdrawals();
      setWithdrawalFormOpen(false);
      setWithdrawalAmount('');
      setWithdrawalReason('');
    } catch(err: unknown) {
      if (err instanceof Error) {
        setWithdrawalError(err.message);
      } else {
        setWithdrawalError('Failed to save personal withdrawal');
      }
    } finally {
      setWithdrawalLoading(false);
    }
  };

  // Metrics Calculations
  const totalFunds = capitalTransactions.reduce((sum, ct) => {
    return ct.type === 'add' ? sum + ct.amount : sum - ct.amount;
  }, 0);

  const totalPersonalWithdrawals = personalWithdrawals.reduce((sum, pw) => sum + pw.amount, 0);

  const totalSent = transactions.filter(t => t.type === 'sent').reduce((sum, t) => sum + t.amount, 0);
  const totalReceived = transactions.filter(t => t.type === 'received').reduce((sum, t) => sum + t.amount, 0);
  const netDeployed = totalSent - totalReceived; // What is currently locked in IPOs
  
  const availableBalance = totalFunds - totalSent + totalReceived - totalPersonalWithdrawals;
  
  // Portfolio Change
  const portfolioChangeAmount = availableBalance - totalFunds;
  const portfolioChangePct = totalFunds > 0 ? (portfolioChangeAmount / totalFunds) * 100 : null;

  // Recovery Status
  const pendingAmount = totalSent - totalReceived;
  const recoveredPercent = totalSent > 0 ? (totalReceived / totalSent) * 100 : null;
  
  // Chart Data preparation
  const applicantTotals = initialApplicants.reduce((acc, app) => {
    acc[app.id] = { name: app.name, sent: 0, received: 0 };
    return acc;
  }, {} as Record<string, { name: string, sent: number, received: number }>);

  transactions.forEach(t => {
    if (applicantTotals[t.applicantId]) {
      if (t.type === 'sent') applicantTotals[t.applicantId].sent += t.amount;
      if (t.type === 'received') applicantTotals[t.applicantId].received += t.amount;
    }
  });

  const chartData = Object.values(applicantTotals).filter(d => d.sent > 0 || d.received > 0);

  return (
    <div className="space-y-8 relative">
      
      {/* Top Level Cards: Total Funds, Available Balance, Portfolio Change */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Total Funds */}
        <div 
          onClick={() => setShowCapitalModal(true)}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex items-center justify-between cursor-pointer hover:shadow-md transition-shadow group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center shrink-0">
              <Wallet size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 group-hover:text-blue-600 transition-colors">My Total Funds</p>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-2xl font-bold text-gray-900">
                  ₹{formatCurrency(totalFunds)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Available Balance */}
        <div 
          onClick={() => setShowWithdrawalModal(true)}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex items-center gap-4 cursor-pointer hover:shadow-md transition-shadow group"
        >
          <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center shrink-0">
            <DollarSign size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 group-hover:text-indigo-600 transition-colors">Available Balance</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">₹{formatCurrency(availableBalance)}</p>
          </div>
        </div>

        {/* Portfolio Change */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex items-center gap-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${totalFunds > 0 ? (portfolioChangeAmount >= 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600') : 'bg-gray-100 text-gray-400'}`}>
            <Percent size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Portfolio Change</p>
            {totalFunds > 0 ? (
              <p className={`text-2xl font-bold mt-1 flex items-baseline gap-2 ${portfolioChangeAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {portfolioChangeAmount >= 0 ? '+₹' : '-₹'}{formatCurrency(Math.abs(portfolioChangeAmount))}
                <span className="text-sm font-semibold opacity-80">
                  ({portfolioChangeAmount >= 0 ? '+' : ''}{portfolioChangePct?.toFixed(2)}%)
                </span>
              </p>
            ) : (
              <p className="text-2xl font-bold mt-1 text-gray-400 italic">N/A</p>
            )}
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center shrink-0">
            <Briefcase size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total Sent</p>
            <p className="text-2xl font-bold text-gray-900">₹{formatCurrency(totalSent)}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex items-center gap-4">
          <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center shrink-0">
            <DollarSign size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total Received</p>
            <p className="text-2xl font-bold text-gray-900">₹{formatCurrency(totalReceived)}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center shrink-0">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Net Deployed</p>
            <p className="text-2xl font-bold text-gray-900">₹{formatCurrency(netDeployed)}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex items-center gap-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${pendingAmount <= 0 ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
            {pendingAmount <= 0 ? <CheckCircle size={24} /> : <AlertCircle size={24} />}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Recovery Status</p>
            {pendingAmount <= 0 ? (
              <>
                <p className="text-2xl font-bold text-green-600 mt-1">Fully Recovered</p>
                {pendingAmount < 0 && (
                  <p className="text-xs text-green-600 font-semibold">+₹{formatCurrency(Math.abs(pendingAmount))} extra</p>
                )}
              </>
            ) : (
              <>
                <p className="text-2xl font-bold text-gray-700 mt-1">₹{formatCurrency(pendingAmount)} Pending</p>
                <p className="text-xs text-gray-500 font-medium">
                  {recoveredPercent?.toFixed(1)}% Recovered, {(100 - (recoveredPercent || 0)).toFixed(1)}% Pending
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-6">Funds by Applicant</h3>
        {chartData.length > 0 ? (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(val) => `₹${(val / 1000)}k`} axisLine={false} tickLine={false} />
                <RechartsTooltip cursor={{fill: 'transparent'}} formatter={(value) => `₹${formatCurrency(Number(value || 0))}`} />
                <Legend iconType="circle" />
                <Bar dataKey="sent" name="Total Sent" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                <Bar dataKey="received" name="Total Received" fill="#22c55e" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-80 flex items-center justify-center text-gray-400">
            No transaction data available yet.
          </div>
        )}
      </div>

      {/* Transactions Table Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="text-lg font-bold text-gray-900">Transaction History</h3>
          {!showForm && (
            <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm">
              <Plus size={16} /> Log Manual Transaction
            </button>
          )}
        </div>

        {showForm && (
          <div className="p-6 bg-gray-50 border-b border-gray-200">
            <div className="flex justify-between items-start mb-4">
              <h4 className="text-md font-semibold text-gray-900">New Transaction</h4>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              {error && <div className="text-red-600 text-sm">{error}</div>}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Applicant</label>
                  <select required value={applicantId} onChange={e => setApplicantId(e.target.value)} className="w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="" disabled>Select Applicant</option>
                    {initialApplicants.map(app => (
                      <option key={app.id} value={app.id}>{app.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select value={type} onChange={e => setType(e.target.value)} className="w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="sent">Sent</option>
                    <option value="received">Received</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
                  <input type="number" required value={amount} onChange={e => setAmount(e.target.value)} className="w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
                  <input type="text" value={notes} onChange={e => setNotes(e.target.value)} className="w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. UPI transfer" />
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <button type="submit" disabled={loading} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium">
                  {loading ? 'Saving...' : 'Save Transaction'}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-white">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Applicant</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Notes</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transactions.map(t => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(t.date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {t.applicant.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${t.type === 'received' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                      {t.type.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                    ₹{formatCurrency(t.amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {t.notes || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => handleDelete(t.id)} className="text-red-600 hover:text-red-900">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500 text-sm">
                    No transactions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Capital Management Modal */}
      {showCapitalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm transition-all">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 sticky top-0 z-10">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Wallet className="text-blue-600" size={20} />
                Manage Capital
              </h3>
              <button onClick={() => { setShowCapitalModal(false); setCapitalFormOpen(false); }} className="text-gray-400 hover:text-gray-600 bg-white p-1 rounded-full shadow-sm">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto">
              {/* Add / Withdraw Action Buttons */}
              {!capitalFormOpen && (
                <div className="flex gap-4 mb-8">
                  <button 
                    onClick={() => { setCapitalType('add'); setCapitalFormOpen(true); setCapitalError(''); }}
                    className="flex-1 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 py-3 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors"
                  >
                    <ArrowUpCircle size={20} />
                    Add Funds
                  </button>
                  <button 
                    onClick={() => { setCapitalType('withdraw'); setCapitalFormOpen(true); setCapitalError(''); }}
                    className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 py-3 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors"
                  >
                    <ArrowDownCircle size={20} />
                    Withdraw Funds
                  </button>
                </div>
              )}

              {/* Capital Form */}
              {capitalFormOpen && (
                <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 mb-8">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                      {capitalType === 'add' ? <ArrowUpCircle className="text-green-600" size={18} /> : <ArrowDownCircle className="text-gray-600" size={18} />}
                      {capitalType === 'add' ? 'Add Capital' : 'Withdraw Capital'}
                    </h4>
                    <button onClick={() => setCapitalFormOpen(false)} className="text-sm text-gray-500 hover:text-gray-800">Cancel</button>
                  </div>
                  
                  {capitalError && <div className="text-red-600 text-sm mb-4 bg-red-50 p-2 rounded">{capitalError}</div>}
                  
                  <form onSubmit={handleSaveCapital} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
                        <input 
                          type="number" 
                          required 
                          value={capitalAmount} 
                          onChange={e => setCapitalAmount(e.target.value)} 
                          className="w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                        <input 
                          type="text" 
                          required 
                          value={capitalReason} 
                          onChange={e => setCapitalReason(e.target.value)} 
                          className="w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                          placeholder="e.g. Fresh infusion" 
                        />
                      </div>
                    </div>
                    <div className="flex justify-end pt-2">
                      <button 
                        type="submit" 
                        disabled={capitalLoading} 
                        className={`px-6 py-2 text-white rounded-lg font-medium transition-colors ${capitalType === 'add' ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-800 hover:bg-gray-900'}`}
                      >
                        {capitalLoading ? 'Saving...' : 'Confirm'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Capital History */}
              <div>
                <h4 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
                  <Clock className="text-gray-400" size={18} />
                  Capital Ledger History
                </h4>
                
                <div className="space-y-3">
                  {capitalTransactions.length === 0 ? (
                    <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                      No capital transactions yet.
                    </div>
                  ) : (
                    capitalTransactions.map((ct) => (
                      <div key={ct.id} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl hover:shadow-sm transition-shadow">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${ct.type === 'add' ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-600'}`}>
                            {ct.type === 'add' ? <ArrowUpCircle size={20} /> : <ArrowDownCircle size={20} />}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{ct.reason}</p>
                            <p className="text-xs text-gray-500">{formatDate(ct.createdAt)} &bull; {formatTime(ct.createdAt)}</p>
                          </div>
                        </div>
                        <div className={`font-bold ${ct.type === 'add' ? 'text-green-600' : 'text-gray-900'}`}>
                          {ct.type === 'add' ? '+' : '-'}₹{formatCurrency(ct.amount)}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Personal Withdrawal Modal */}
      {showWithdrawalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm transition-all">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 sticky top-0 z-10">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <DollarSign className="text-indigo-600" size={20} />
                Personal Withdrawals
              </h3>
              <button onClick={() => { setShowWithdrawalModal(false); setWithdrawalFormOpen(false); }} className="text-gray-400 hover:text-gray-600 bg-white p-1 rounded-full shadow-sm">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto">
              {/* Withdraw Action Button */}
              {!withdrawalFormOpen && (
                <div className="flex gap-4 mb-8">
                  <button 
                    onClick={() => { setWithdrawalFormOpen(true); setWithdrawalError(''); }}
                    className="flex-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 py-3 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors"
                  >
                    <ArrowDownCircle size={20} />
                    Withdraw from Balance
                  </button>
                </div>
              )}

              {/* Withdrawal Form */}
              {withdrawalFormOpen && (
                <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 mb-8">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                      <ArrowDownCircle className="text-indigo-600" size={18} />
                      Withdraw Available Balance
                    </h4>
                    <button onClick={() => setWithdrawalFormOpen(false)} className="text-sm text-gray-500 hover:text-gray-800">Cancel</button>
                  </div>
                  
                  {withdrawalError && <div className="text-red-600 text-sm mb-4 bg-red-50 p-2 rounded">{withdrawalError}</div>}
                  
                  <form onSubmit={handleSaveWithdrawal} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
                        <input 
                          type="number" 
                          required 
                          max={availableBalance}
                          value={withdrawalAmount} 
                          onChange={e => setWithdrawalAmount(e.target.value)} 
                          className="w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                        />
                        <p className="text-xs text-gray-500 mt-1">Max available: ₹{formatCurrency(availableBalance)}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                        <input 
                          type="text" 
                          required 
                          value={withdrawalReason} 
                          onChange={e => setWithdrawalReason(e.target.value)} 
                          className="w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                          placeholder="e.g. Living expenses" 
                        />
                      </div>
                    </div>
                    <div className="flex justify-end pt-2">
                      <button 
                        type="submit" 
                        disabled={withdrawalLoading} 
                        className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
                      >
                        {withdrawalLoading ? 'Saving...' : 'Confirm Withdrawal'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Withdrawal History */}
              <div>
                <h4 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
                  <Clock className="text-gray-400" size={18} />
                  Withdrawal History
                </h4>
                
                <div className="space-y-3">
                  {personalWithdrawals.length === 0 ? (
                    <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                      No personal withdrawals yet.
                    </div>
                  ) : (
                    personalWithdrawals.map((pw) => (
                      <div key={pw.id} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl hover:shadow-sm transition-shadow">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-gray-100 text-gray-600">
                            <ArrowDownCircle size={20} />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{pw.reason}</p>
                            <p className="text-xs text-gray-500">{formatDate(pw.createdAt)} &bull; {formatTime(pw.createdAt)}</p>
                          </div>
                        </div>
                        <div className="font-bold text-gray-900">
                          -₹{formatCurrency(pw.amount)}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
