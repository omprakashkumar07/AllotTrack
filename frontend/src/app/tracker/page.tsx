import { getTrackerData } from '../actions/trackerActions';
import TrackerClient from './TrackerClient';

export const dynamic = 'force-dynamic';

export default async function TrackerPage() {
  let trackerData = [];

  try {
    trackerData = await getTrackerData();
  } catch (error) {
    console.error('Failed to fetch tracker data:', error);
  }

  return (
    <div className="w-full py-10 px-4 sm:px-6 lg:px-8">
      <div className="mb-8 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Application Tracker</h1>
      </div>
      <TrackerClient initialData={trackerData} />
    </div>
  );
}
