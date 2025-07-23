'use client';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

export function GlobalNetworkStatusButton() {
  const { online } = useNetworkStatus();
  return (
    <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 1000 }}>
      <button
        type="button"
        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border transition-colors duration-200 shadow ${online ? 'bg-green-100 text-green-800 border-green-200' : 'bg-yellow-100 text-yellow-800 border-yellow-200'}`}
        disabled
        aria-label={online ? 'Online' : 'Offline'}
      >
        <svg className={`w-3 h-3 mr-1 ${online ? 'fill-green-500' : 'fill-yellow-500'}`} viewBox="0 0 8 8"><circle cx="4" cy="4" r="4"/></svg>
        {online ? 'Online' : 'Offline'}
      </button>
    </div>
  );
} 