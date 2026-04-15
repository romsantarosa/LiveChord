import { useState, useRef, useEffect, useCallback } from 'react';

/**
 * Custom hook to manage the Screen Wake Lock API.
 * Prevents the screen from turning off during performance.
 */
export function useWakeLock() {
  const [isWakeLocked, setIsWakeLocked] = useState(false);
  const wakeLock = useRef<any>(null);

  const requestWakeLock = useCallback(async () => {
    if ('wakeLock' in navigator) {
      try {
        wakeLock.current = await (navigator as any).wakeLock.request('screen');
        setIsWakeLocked(true);
        
        wakeLock.current.addEventListener('release', () => {
          setIsWakeLocked(false);
        });
      } catch (err) {
        if (err instanceof Error && err.name === 'NotAllowedError') {
          console.warn('Wake Lock permission denied. This is expected in some environments like iframes.');
        } else {
          console.error(`Wake Lock Error: ${err}`);
        }
      }
    }
  }, []);

  const releaseWakeLock = useCallback(async () => {
    if (wakeLock.current) {
      await wakeLock.current.release();
      wakeLock.current = null;
      setIsWakeLocked(false);
    }
  }, []);

  const toggleWakeLock = useCallback(async () => {
    if (isWakeLocked) {
      await releaseWakeLock();
    } else {
      await requestWakeLock();
    }
  }, [isWakeLocked, requestWakeLock, releaseWakeLock]);

  useEffect(() => {
    return () => {
      if (wakeLock.current) {
        wakeLock.current.release();
      }
    };
  }, []);

  return { isWakeLocked, toggleWakeLock, requestWakeLock, releaseWakeLock };
}
