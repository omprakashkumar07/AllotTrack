import { getApplicants } from '../actions/applicantActions';
import ApplicantClient from './ApplicantClient';

export const dynamic = 'force-dynamic';

export default async function ApplicantsPage() {
  let initialApplicants = [];
  try {
    initialApplicants = await getApplicants();
  } catch (error) {
    console.error('Failed to fetch applicants:', error);
  }

  return (
    <div className="w-full py-10 px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Applicants</h1>
      </div>
      <ApplicantClient initialApplicants={initialApplicants} />
    </div>
  );
}
