import { useCommandPaletteContext } from '@/context/CommandPaletteContext';

export const useCommandPalette = () => {
  return useCommandPaletteContext();
};