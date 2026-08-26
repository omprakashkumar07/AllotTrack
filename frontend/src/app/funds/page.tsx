import { getFundTransactions } from '../actions/fundActions';
import { getApplicants } from '../actions/applicantActions';
import { getCapitalTransactions } from '../actions/capitalActions';
import { getPersonalWithdrawals } from '../actions/personalWithdrawalActions';
import FundsClient from './FundsClient';

export const dynamic = 'force-dynamic';

export default async function FundsPage() {
  let initialTransactions = [];
  let initialApplicants = [];
  let initialCapitalTransactions = [];
  let initialPersonalWithdrawals = [];

  try {
    initialTransactions = await getFundTransactions();
    initialApplicants = await getApplicants();
    initialCapitalTransactions = await getCapitalTransactions();
    initialPersonalWithdrawals = await getPersonalWithdrawals();
  } catch (error) {
    console.error('Failed to fetch funds data:', error);
  }

  return (
    <div className="w-full py-10 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Funds Dashboard</h1>
      </div>
      <FundsClient 
        initialTransactions={initialTransactions} 
        initialApplicants={initialApplicants} 
        initialCapitalTransactions={initialCapitalTransactions}
        initialPersonalWithdrawals={initialPersonalWithdrawals}
      />
    </div>
  );
}
