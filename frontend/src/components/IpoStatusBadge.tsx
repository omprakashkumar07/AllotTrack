import { CheckCircle, Clock } from 'lucide-react';

export function getIpoStatus(listingDate: string | null): 'Completed' | 'In Progress' {
  if (!listingDate) return 'In Progress';
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const listing = new Date(listingDate);
  listing.setHours(0, 0, 0, 0);
  
  return today >= listing ? 'Completed' : 'In Progress';
}

export default function IpoStatusBadge({ listingDate }: { listingDate: string | null }) {
  const status = getIpoStatus(listingDate);
  
  if (status === 'Completed') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 uppercase">
        <CheckCircle size={14} /> Completed
      </span>
    );
  }
  
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 uppercase">
      <Clock size={14} /> In Progress
    </span>
  );
}
