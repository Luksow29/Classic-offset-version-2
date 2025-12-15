import { useRef, useEffect, useState } from 'react';

interface UseVirtualScrollOptions<T> {
  items: T[];
  itemHeight: number;
  overscan?: number;
  scrollingDelay?: number;
}

interface UseVirtualScrollReturn<T> {
  containerRef: React.RefObject<HTMLDivElement>;
  virtualItems: {
    index: number;
    start: number;
    end: number;
    size: number;
    item: T;
  }[];
  totalHeight: number;
  isScrolling: boolean;
}

export function useVirtualScroll<T>({
  items,
  itemHeight,
  overscan = 3,
  scrollingDelay = 150,
}: UseVirtualScrollOptions<T>): UseVirtualScrollReturn<T> {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  
  // Update viewport size on resize
  useEffect(() => {
    const scrollContainer = containerRef.current;
    if (!scrollContainer) return;
    
    const resizeObserver = new ResizeObserver(entries => {
      const { height } = entries[0].contentRect;
      setViewportHeight(height);
    });
    
    resizeObserver.observe(scrollContainer);
    setViewportHeight(scrollContainer.clientHeight);
    
    return () => {
      resizeObserver.disconnect();
    };
  }, []);
  
  // Handle scroll events
  useEffect(() => {
    const scrollContainer = containerRef.current;
    if (!scrollContainer) return;
    
    let scrollTimeout: number;
    
    const handleScroll = () => {
      setScrollTop(scrollContainer.scrollTop);
      setIsScrolling(true);
      
      clearTimeout(scrollTimeout);
      scrollTimeout = window.setTimeout(() => {
        setIsScrolling(false);
      }, scrollingDelay);
    };
    
    scrollContainer.addEventListener('scroll', handleScroll);
    
    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, [scrollingDelay]);
  
  // Calculate visible items
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length - 1,
    Math.floor((scrollTop + viewportHeight) / itemHeight) + overscan
  );
  
  const virtualItems = [];
  for (let i = startIndex; i <= endIndex; i++) {
    virtualItems.push({
      index: i,
      start: i * itemHeight,
      end: (i + 1) * itemHeight,
      size: itemHeight,
      item: items[i],
    });
  }
  
  return {
    containerRef,
    virtualItems,
    totalHeight: items.length * itemHeight,
    isScrolling,
  };
}
