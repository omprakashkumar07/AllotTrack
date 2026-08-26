import Link from 'next/link';
import { Users, FileText, Activity, DollarSign, TrendingUp, CheckCircle, PackageOpen, PieChart, Banknote } from 'lucide-react';
import DashboardHeader from '@/components/DashboardHeader';
import { getTrackerData } from './actions/trackerActions';
import { getFundTransactions } from './actions/fundActions';
import { getCapitalTransactions } from './actions/capitalActions';
import { getPersonalWithdrawals } from './actions/personalWithdrawalActions';
import { getApplicants } from './actions/applicantActions';
import { calculateIpoAggregates } from '@/lib/calculations';
import { formatCurrency } from '@/lib/formatCurrency';
import { formatDate, formatTime } from '@/lib/formatDate';

// Type definitions based on what the actions return
interface ActivityEvent {
  id: string;
  date: Date;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
}

interface AppRecord {
  id: string;
  createdAt: string;
  ipoName: string;
  applicant: { name: string };
  amountSent: number;
  amountTransferred: number | null;
  receivedFromApplicant: boolean;
  amountReceivedFromApplicant: number | null;
  applied?: boolean;
  allotmentStatus?: string;
}

interface FundTxRecord {
  id: string;
  type: string;
  amount: number;
  date: string;
  applicant?: { name: string };
}

interface CapTxRecord {
  id: string;
  type: string;
  amount: number;
  createdAt: string;
}

export default async function Dashboard() {
  // Fetch all data in parallel
  const [
    trackerData,
    fundTransactions,
    capitalTransactions,
    personalWithdrawals,
    applicants
  ] = await Promise.all([
    getTrackerData().catch(() => []),
    getFundTransactions().catch(() => []),
    getCapitalTransactions().catch(() => []),
    getPersonalWithdrawals().catch(() => []),
    getApplicants().catch(() => [])
  ]);

  // Metrics Logic
  let activeIposCount = 0;
  let completedIposCount = 0;
  let totalApplicationsCount = 0;
  let totalProfitRealized = 0;

  const allApplications: AppRecord[] = [];

  trackerData.forEach((ipo: { name: string; listingDate: string | null; applications: AppRecord[] }) => {
    // Basic status logic based on IpoStatusBadge (if listingDate is in the past, it's listed/completed)
    const isCompleted = ipo.listingDate && new Date(ipo.listingDate).getTime() <= new Date().getTime();
    if (isCompleted) {
      completedIposCount++;
    } else {
      activeIposCount++;
    }

    totalApplicationsCount += ipo.applications.length;
    
    // Collect all apps for activity feed
    ipo.applications.forEach((app: AppRecord) => {
      allApplications.push({ ...app, ipoName: ipo.name });
    });

    // Calculate total profit
    const aggregates = calculateIpoAggregates(ipo.applications);
    if (aggregates.totalProfit !== null) {
      totalProfitRealized += aggregates.totalProfit;
    }
  });

  // Funds Logic
  const totalSent = fundTransactions.filter((t: FundTxRecord) => t.type === 'sent').reduce((acc: number, curr: FundTxRecord) => acc + curr.amount, 0);
  const totalReceived = fundTransactions.filter((t: FundTxRecord) => t.type === 'received').reduce((acc: number, curr: FundTxRecord) => acc + curr.amount, 0);
  const totalCapital = capitalTransactions.reduce((acc: number, curr: CapTxRecord) => curr.type === 'add' ? acc + curr.amount : acc - curr.amount, 0);
  const totalPersonalWithdrawals = personalWithdrawals.reduce((acc: number, curr: { amount: number }) => acc + curr.amount, 0);
  const availableBalance = totalCapital - totalSent + totalReceived - totalPersonalWithdrawals;
  
  const recoveryPercent = totalSent > 0 ? ((totalReceived / totalSent) * 100).toFixed(1) + '%' : 'N/A';

  // Active items for badges
  const activeApplicants = applicants.length;

  const quickActionCards = [
    {
      title: 'Applicants',
      description: 'Manage applicant profiles and PAN details.',
      href: '/applicants',
      icon: Users,
      badge: `${activeApplicants} Applicant${activeApplicants !== 1 ? 's' : ''}`
    },
    {
      title: 'Apply in IPO',
      description: 'Browse live IPOs and submit applications.',
      href: '/ipos',
      icon: FileText,
      badge: `${activeIposCount} Active IPO${activeIposCount !== 1 ? 's' : ''}`
    },
    {
      title: 'My IPO Tracker',
      description: 'View master table of all IPOs and applicants.',
      href: '/tracker',
      icon: Activity,
      badge: `${totalApplicationsCount} App${totalApplicationsCount !== 1 ? 's' : ''}`
    },
    {
      title: 'Fund Dashboard',
      description: 'Track deployed capital and overall profit/loss.',
      href: '/funds',
      icon: DollarSign,
      badge: `₹${formatCurrency(availableBalance)} Available`
    },
  ];

  // Activity Feed Logic
  const events: ActivityEvent[] = [];

  // Add applications to events
  allApplications.forEach(app => {
    events.push({
      id: `app-${app.id}`,
      date: new Date(app.createdAt),
      title: 'Application Added',
      description: `Application added for ${app.ipoName} by ${app.applicant.name}`,
      icon: FileText,
      color: 'bg-blue-100 text-blue-600'
    });
  });

  // Add fund transactions
  fundTransactions.forEach((tx: FundTxRecord) => {
    const isSent = tx.type === 'sent';
    events.push({
      id: `fund-${tx.id}`,
      date: new Date(tx.date),
      title: isSent ? 'Funds Sent' : 'Funds Received',
      description: `₹${formatCurrency(tx.amount)} ${isSent ? 'sent to' : 'received from'} ${tx.applicant?.name || 'Applicant'}`,
      icon: isSent ? TrendingUp : DollarSign,
      color: isSent ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'
    });
  });

  // Add capital transactions
  capitalTransactions.forEach((tx: CapTxRecord) => {
    const isAdd = tx.type === 'add';
    events.push({
      id: `cap-${tx.id}`,
      date: new Date(tx.createdAt),
      title: isAdd ? 'Capital Added' : 'Capital Withdrawn',
      description: `Capital ${isAdd ? 'added' : 'withdrawn'}: ₹${formatCurrency(tx.amount)}`,
      icon: Banknote,
      color: isAdd ? 'bg-teal-100 text-teal-600' : 'bg-rose-100 text-rose-600'
    });
  });

  // Sort and take top 5
  events.sort((a, b) => b.date.getTime() - a.date.getTime());
  const recentEvents = events.slice(0, 5);

  const getRelativeTimeString = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins || 1} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays === 1) return `Yesterday`;
    return `${diffDays} days ago`;
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      <DashboardHeader />

      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        
        {/* KEY METRICS ROW */}
        <section>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {/* Active IPOs */}
            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><Activity size={18} /></div>
                <h3 className="text-sm font-medium text-gray-500">Active IPOs</h3>
              </div>
              <p className="text-2xl font-bold text-gray-900">{activeIposCount}</p>
            </div>
            {/* Completed IPOs */}
            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-gray-100 rounded-lg text-gray-600"><CheckCircle size={18} /></div>
                <h3 className="text-sm font-medium text-gray-500">Completed IPOs</h3>
              </div>
              <p className="text-2xl font-bold text-gray-900">{completedIposCount}</p>
            </div>
            {/* Total Applications */}
            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600"><PackageOpen size={18} /></div>
                <h3 className="text-sm font-medium text-gray-500">Total Apps</h3>
              </div>
              <p className="text-2xl font-bold text-gray-900">{totalApplicationsCount}</p>
            </div>
            {/* Available Balance */}
            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600"><DollarSign size={18} /></div>
                <h3 className="text-sm font-medium text-gray-500">Available Bal</h3>
              </div>
              <p className="text-2xl font-bold text-gray-900">₹{formatCurrency(availableBalance)}</p>
            </div>
            {/* Total Profit Realized */}
            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-purple-50 rounded-lg text-purple-600"><TrendingUp size={18} /></div>
                <h3 className="text-sm font-medium text-gray-500">Total Profit</h3>
              </div>
              <p className={`text-2xl font-bold ${totalProfitRealized > 0 ? 'text-green-600' : totalProfitRealized < 0 ? 'text-red-600' : 'text-gray-900'}`}>
                {totalProfitRealized > 0 ? '+' : ''}₹{formatCurrency(Math.abs(totalProfitRealized))}
              </p>
            </div>
            {/* Recovery % */}
            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-orange-50 rounded-lg text-orange-600"><PieChart size={18} /></div>
                <h3 className="text-sm font-medium text-gray-500">Recovery</h3>
              </div>
              <p className="text-2xl font-bold text-gray-900">{recoveryPercent}</p>
            </div>
          </div>
        </section>

        {/* QUICK ACTIONS GRID */}
        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickActionCards.map((card) => (
              <Link
                key={card.href}
                href={card.href}
                className="bg-white overflow-hidden shadow-sm rounded-xl border border-gray-100 hover:shadow-md hover:border-blue-200 transition-all group block relative"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center justify-center w-12 h-12 bg-gray-50 rounded-lg group-hover:bg-blue-50 transition-colors">
                      <card.icon className="w-6 h-6 text-gray-600 group-hover:text-blue-600 transition-colors" />
                    </div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                      {card.badge}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{card.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{card.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* RECENT ACTIVITY FEED */}
        <section className="pb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Recent Activity</h2>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {recentEvents.length > 0 ? (
              <ul className="divide-y divide-gray-100">
                {recentEvents.map((event) => (
                  <li key={event.id} className="p-5 hover:bg-gray-50/50 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className={`mt-1 p-2 rounded-full flex-shrink-0 ${event.color}`}>
                        <event.icon size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900">{event.title}</p>
                        <p className="text-sm text-gray-500 truncate">{event.description}</p>
                      </div>
                      <div className="text-xs font-medium text-gray-400 whitespace-nowrap text-right">
                        <div>{getRelativeTimeString(event.date)}</div>
                        <div className="font-normal mt-0.5">{formatDate(event.date)} &bull; {formatTime(event.date)}</div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-8 text-center text-gray-500 text-sm">
                No recent activity found in your tracker.
              </div>
            )}
          </div>
        </section>

      </main>
    </div>
  );
}
