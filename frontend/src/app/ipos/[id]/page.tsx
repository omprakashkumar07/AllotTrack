import { getIpo } from '../../actions/ipoActions';
import IpoDetailClient from './IpoDetailClient';

export const dynamic = 'force-dynamic';

export default async function IpoDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  let initialIpo = null;

  try {
    initialIpo = await getIpo(id);
  } catch (error) {
    console.error('Failed to fetch IPO detail:', error);
  }

  if (!initialIpo) {
    return (
      <div className="w-full py-10 px-4 text-center">
        <h1 className="text-2xl font-bold text-gray-900">IPO Not Found</h1>
      </div>
    );
  }

  return (
    <div className="w-full py-10 px-4 sm:px-6 lg:px-8">
      <IpoDetailClient initialIpo={initialIpo} />
    </div>
  );
}
