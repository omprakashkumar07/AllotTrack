import { getIpos } from '../actions/ipoActions';
import IpoListClient from './IpoListClient';

export const dynamic = 'force-dynamic';

export default async function IposPage() {
  let initialIpos = [];
  try {
    initialIpos = await getIpos();
  } catch (error) {
    console.error('Failed to fetch IPOs:', error);
  }

  return (
    <div className="w-full py-10 px-4 sm:px-6 lg:px-8">
      <IpoListClient initialIpos={initialIpos} />
    </div>
  );
}
