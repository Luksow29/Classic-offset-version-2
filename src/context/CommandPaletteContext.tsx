
import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';

interface CommandPaletteContextType {
    isOpen: boolean;
    openPalette: () => void;
    closePalette: () => void;
    togglePalette: () => void;
}

const CommandPaletteContext = createContext<CommandPaletteContextType | undefined>(undefined);

export const CommandPaletteProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isOpen, setIsOpen] = useState(false);

    const openPalette = useCallback(() => {
        setIsOpen(true);
    }, []);

    const closePalette = useCallback(() => {
        setIsOpen(false);
    }, []);

    const togglePalette = useCallback(() => {
        setIsOpen(prev => !prev);
    }, []);

    // Handle global keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            // Cmd+K (Mac) or Ctrl+K (Windows/Linux)
            if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
                event.preventDefault();
                togglePalette();
            }

            // Cmd+Shift+P (Mac) or Ctrl+Shift+P (Windows/Linux) - Alternative shortcut
            if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key === 'P') {
                event.preventDefault();
                togglePalette();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [togglePalette]);

    return (
        <CommandPaletteContext.Provider value={{ isOpen, openPalette, closePalette, togglePalette }}>
            {children}
        </CommandPaletteContext.Provider>
    );
};

export const useCommandPaletteContext = () => {
    const context = useContext(CommandPaletteContext);
    if (context === undefined) {
        throw new Error('useCommandPaletteContext must be used within a CommandPaletteProvider');
    }
    return context;
};
