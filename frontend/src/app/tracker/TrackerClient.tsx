'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Download, Eye, EyeOff } from 'lucide-react';
import { formatCurrency } from '@/lib/formatCurrency';
import { formatDate } from '@/lib/formatDate';
import { calculateApplicationMetrics, calculateIpoAggregates } from '@/lib/calculations';
import IpoStatusBadge from '@/components/IpoStatusBadge';
import { getApplicant } from '@/app/actions/applicantActions';

interface ApplicantData {
  id: string;
  name: string;
  panEncrypted: string;
}

interface ApplicationData {
  id: string;
  amountSent: number;
  allotmentStatus: string;
  sharesAllotted: number | null;
  amountReceivedBack: number | null;
  amountTransferred: number | null;
  receivedFromApplicant: boolean;
  amountReceivedFromApplicant: number | null;
  applied: boolean;
  sourceOfFunds: string;
  applicant: ApplicantData;
}

interface IpoTrackerData {
  id: string;
  name: string;
  category: string;
  openDate: string | null;
  closeDate: string | null;
  allotmentDate: string | null;
  listingDate: string | null;
  lotSize: number | null;
  lotValue: number | null;
  applications: ApplicationData[];
}

function PanRevealCell({ applicantId, encryptedPan }: { applicantId: string, encryptedPan: string }) {
  const [revealedPan, setRevealedPan] = useState<string | null>(null);
  
  const handleRevealToggle = async () => {
    if (revealedPan) {
      setRevealedPan(null);
    } else {
      try {
        const fullData = await getApplicant(applicantId, true);
        setRevealedPan(fullData.panEncrypted);
      } catch (err) {
        console.error('Failed to reveal PAN', err);
      }
    }
  };

  return (
    <span className="font-mono text-gray-900">
      {revealedPan || encryptedPan}
      <button 
        onClick={(e) => { e.stopPropagation(); handleRevealToggle(); }}
        className="ml-2 text-gray-400 hover:text-blue-600 transition-colors focus:outline-none"
        title={revealedPan ? "Hide PAN" : "Reveal PAN"}
      >
        {revealedPan ? <EyeOff size={14} className="inline" /> : <Eye size={14} className="inline" />}
      </button>
    </span>
  );
}

export default function TrackerClient({ initialData }: { initialData: IpoTrackerData[] }) {
  const [expandedIpos, setExpandedIpos] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpandedIpos(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleDownloadCSV = () => {
    // Flatten data for CSV
    const rows: string[][] = [
      ['IPO Name', 'Category', 'Allotment Date', 'IDs Applied', 'IDs Allotted', 'Total Profit', 'Applicant Name', 'PAN', 'Amount Sent', 'Sent to Applicant', 'Source of Funds', 'Applied', 'Allotment Status', 'Shares', 'Refund', 'Settled', 'Profit']
    ];

    initialData.forEach(ipo => {
      const allotmentDateStr = formatDate(ipo.allotmentDate);
      
      const aggregates = calculateIpoAggregates(ipo.applications);
      const idsAppliedStr = aggregates.idsApplied.toString();
      const idsAllottedStr = aggregates.idsAllotted.toString();
      const totalProfitStr = aggregates.totalProfit !== null ? aggregates.totalProfit.toString() : '-';

      if (ipo.applications.length === 0) {
        rows.push([
          `"${ipo.name}"`, 
          ipo.category, 
          allotmentDateStr,
          idsAppliedStr,
          idsAllottedStr,
          totalProfitStr,
          '-',
          '-',
          '-',
          '-',
          '-',
          '-',
          '-',
          '-',
          '-',
          '-',
          '-'
        ]);
      } else {
        ipo.applications.forEach(app => {
          const metrics = calculateApplicationMetrics({
            ipo: { lotValue: ipo.lotValue, lotSize: ipo.lotSize },
            application: app
          });

          rows.push([
            `"${ipo.name}"`,
            ipo.category,
            allotmentDateStr,
            idsAppliedStr,
            idsAllottedStr,
            totalProfitStr,
            `"${app.applicant.name}"`,
            app.applicant.panEncrypted,
            app.amountSent.toString(),
            metrics.amountTransferred.toString(),
            app.sourceOfFunds || '-',
            app.applied ? 'Yes' : 'No',
            app.allotmentStatus,
            app.sharesAllotted?.toString() || '0',
            app.amountReceivedBack?.toString() || '0',
            app.receivedFromApplicant ? 'Yes' : 'No',
            metrics.profit !== null ? metrics.profit.toString() : '-'
          ]);
        });
      }
    });

    const csvContent = rows.map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `ipo_tracker_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button 
          onClick={handleDownloadCSV}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
        >
          <Download size={18} /> Export to CSV
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="w-10 px-6 py-3"></th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">IPO Name</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Allotment Date</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Applications</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">IDs Applied</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">IDs Allotted</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Profit</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {initialData.map(ipo => {
                const isExpanded = expandedIpos[ipo.id];
                return (
                  <React.Fragment key={ipo.id}>
                    <tr 
                      className={`hover:bg-gray-50 cursor-pointer transition-colors ${isExpanded ? 'bg-blue-50/50' : ''}`}
                      onClick={() => toggleExpand(ipo.id)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-gray-400">
                        {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-gray-900">{ipo.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800 uppercase">
                          {ipo.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(ipo.allotmentDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <IpoStatusBadge listingDate={ipo.listingDate} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                        <span className="font-bold text-gray-900">{ipo.applications.length}</span>
                      </td>
                      {(() => {
                        const aggregates = calculateIpoAggregates(ipo.applications);
                        return (
                          <>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                              {aggregates.idsApplied}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                              {aggregates.idsAllotted}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {aggregates.totalProfit !== null ? (
                                <div className={`flex flex-col font-medium ${aggregates.totalProfit > 0 ? 'text-green-600' : aggregates.totalProfit < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                                  <span>₹{formatCurrency(Math.abs(aggregates.totalProfit))}</span>
                                  <span className="text-xs opacity-80">{aggregates.totalProfit > 0 ? '+' : ''}{aggregates.profitPercent?.toFixed(2)}%</span>
                                </div>
                              ) : (
                                <span className="text-gray-400 font-medium">-</span>
                              )}
                            </td>
                          </>
                        );
                      })()}
                    </tr>
                    
                    {isExpanded && (
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <td colSpan={9} className="p-0">
                          <div className="px-16 py-6 overflow-hidden">
                            {ipo.applications.length > 0 ? (
                              <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-inner">
                                <table className="min-w-full divide-y divide-gray-200">
                                  <thead className="bg-gray-100/50">
                                    <tr>
                                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Applicant Name</th>
                                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">PAN</th>
                                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Amount Sent</th>
                                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Sent to Applicant</th>
                                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Source of Funds</th>
                                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Applied</th>
                                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Allotment Status</th>
                                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Shares</th>
                                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Refund</th>
                                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Settled</th>
                                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Profit</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-200">
                                    {ipo.applications.map(app => {
                                      const metrics = calculateApplicationMetrics({
                                        ipo: { lotValue: ipo.lotValue, lotSize: ipo.lotSize },
                                        application: app
                                      });
                                      return (
                                        <tr key={app.id} className="hover:bg-gray-50">
                                          <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {app.applicant.name}
                                          </td>
                                          <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900">
                                            <PanRevealCell applicantId={app.applicant.id} encryptedPan={app.applicant.panEncrypted} />
                                          </td>
                                          <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900 font-medium">
                                            ₹{formatCurrency(app.amountSent)}
                                          </td>
                                          <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900 font-medium">
                                            {app.amountTransferred !== null && app.amountTransferred !== undefined ? (
                                              <span className="text-gray-900">₹{formatCurrency(app.amountTransferred)}</span>
                                            ) : (
                                              <span className="text-gray-400 italic">₹{formatCurrency(app.amountSent)}</span>
                                            )}
                                          </td>
                                          <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900">
                                            {app.sourceOfFunds}
                                          </td>
                                          <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900">
                                            {app.applied ? (
                                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">Applied</span>
                                            ) : (
                                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">Pending</span>
                                            )}
                                          </td>
                                          <td className="px-6 py-3 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${app.allotmentStatus === 'allotted' ? 'bg-green-100 text-green-800' : app.allotmentStatus === 'not_allotted' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                              {app.allotmentStatus === 'allotted' ? 'Allotted' : app.allotmentStatus === 'not_allotted' ? 'Not Allotted' : 'Pending'}
                                            </span>
                                          </td>
                                          <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900">
                                            {app.sharesAllotted || '-'}
                                          </td>
                                          <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900">
                                            {app.amountReceivedBack !== null && app.amountReceivedBack !== undefined ? `₹${formatCurrency(app.amountReceivedBack)}` : '-'}
                                          </td>
                                          <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900">
                                            {app.receivedFromApplicant ? (
                                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Settled</span>
                                            ) : (
                                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">Pending</span>
                                            )}
                                          </td>
                                          <td className="px-6 py-3 whitespace-nowrap text-sm">
                                            {metrics.profit !== null ? (
                                              <div className={`flex flex-col font-medium ${metrics.profit > 0 ? 'text-green-600' : metrics.profit < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                                                <span>₹{formatCurrency(Math.abs(metrics.profit))}</span>
                                                <span className="text-xs opacity-80">{metrics.profit > 0 ? '+' : ''}{metrics.profitPercent?.toFixed(2)}%</span>
                                              </div>
                                            ) : (
                                              <span className="text-gray-400 font-medium">-</span>
                                            )}
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            ) : (
                              <div className="text-sm text-gray-500 italic text-center py-4">No applications for this IPO.</div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
              {initialData.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center text-gray-500 text-sm">
                    No IPO data available.
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
