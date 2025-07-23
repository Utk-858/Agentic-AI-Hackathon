'use client';

import { useState, useEffect } from 'react';

export function useNetworkStatus() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function checkInternet() {
      // Only run in browser
      if (typeof window === 'undefined') return;
      if (!navigator.onLine) {
        if (mounted) setOnline(false);
        return;
      }
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000);
        const res = await fetch('/api/ping', {
          method: 'GET',
          cache: 'no-store',
          signal: controller.signal,
        });
        clearTimeout(timeout);
        const data = await res.json();
        if (mounted) setOnline(data.online === true);
      } catch {
        if (mounted) setOnline(false);
      }
    }

    // Initial check
    checkInternet();

    // Listen to browser events
    const handleOnline = () => checkInternet();
    const handleOffline = () => setOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Poll every 10 seconds
    const interval = setInterval(checkInternet, 10000);

    return () => {
      mounted = false;
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  return { online };
}
