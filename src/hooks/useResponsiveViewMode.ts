import { useState, useEffect } from 'react';
import { useMediaQuery } from './useMediaQuery';

export function useResponsiveViewMode() {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>(isMobile ? 'grid' : 'list');

  useEffect(() => {
    setViewMode(isMobile ? 'grid' : 'list');
  }, [isMobile]);

  return { viewMode, setViewMode };
}
