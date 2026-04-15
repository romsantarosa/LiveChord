import { useState, useEffect, useRef, useCallback } from 'react';

interface UseAutoScrollProps {
  initialSpeed?: number;
  isActive?: boolean;
}

/**
 * Custom hook for automatic scrolling of a container.
 * Uses requestAnimationFrame for smooth performance.
 */
export function useAutoScroll<T extends HTMLElement>({ initialSpeed = 5, isActive = true }: UseAutoScrollProps = {}) {
  const [isScrolling, setIsScrolling] = useState(false);
  const [speed, setSpeed] = useState(initialSpeed);
  
  const scrollRef = useRef<T | null>(null);
  const requestRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const speedRef = useRef(speed);

  // Sync speed ref
  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  const stopScroll = useCallback(() => {
    setIsScrolling(false);
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
      requestRef.current = null;
    }
    lastTimeRef.current = null;
  }, []);

  const startScroll = useCallback(() => {
    if (!isScrolling) {
      setIsScrolling(true);
    }
  }, [isScrolling]);

  const manualScroll = useCallback((distance: number = 100) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({
        top: distance,
        behavior: 'smooth'
      });
    }
  }, []);

  useEffect(() => {
    if (!isActive || !isScrolling) {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      lastTimeRef.current = null;
      return;
    }

    const scroll = (time: number) => {
      if (lastTimeRef.current !== null) {
        const deltaTime = time - lastTimeRef.current;
        if (scrollRef.current) {
          // Speed calculation: speed 1-20
          const pixelsPerMs = (speedRef.current * 3) / 1000;
          scrollRef.current.scrollTop += pixelsPerMs * deltaTime;
          
          const isAtBottom = 
            Math.ceil(scrollRef.current.scrollTop + scrollRef.current.clientHeight) >= 
            scrollRef.current.scrollHeight - 1; // Small buffer
            
          if (isAtBottom) {
            stopScroll();
            return;
          }
        }
      }
      lastTimeRef.current = time;
      requestRef.current = requestAnimationFrame(scroll);
    };

    requestRef.current = requestAnimationFrame(scroll);
    
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isScrolling, isActive, stopScroll]);

  return {
    isScrolling,
    speed,
    setSpeed,
    startScroll,
    stopScroll,
    manualScroll,
    scrollRef
  };
}
