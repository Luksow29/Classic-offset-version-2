import React, { useState, useRef, useEffect } from 'react';

// Ensure Material Symbols font is loaded in your index.html:
// <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined" rel="stylesheet" />
const RADIO_CHECKED = (
  <span className="material-symbols-outlined align-middle text-primary text-base mr-2" aria-hidden="true" style={{ fontVariationSettings: '"FILL" 1, "wght" 400, "GRAD" 0, "opsz" 20' }}>radio_button_checked</span>
);
const RADIO_UNCHECKED = (
  <span className="material-symbols-outlined align-middle text-base mr-2 opacity-40" aria-hidden="true" style={{ fontVariationSettings: '"FILL" 0, "wght" 400, "GRAD" 0, "opsz" 20' }}>radio_button_unchecked</span>
);

const SIDEBAR_MODES = [
  { label: 'Expanded', value: 'expanded' },
  { label: 'Collapsed', value: 'collapsed' },
  { label: 'Expand on hover', value: 'hover' },
];

function getInitialSidebarMode() {
  return localStorage.getItem('sidebarMode') || 'expanded';
}

export default function SidebarControl() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState(getInitialSidebarMode());
  const [focusIdx, setFocusIdx] = useState(-1);
  const ref = useRef(null);
  const optionRefs = useRef([]);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  useEffect(() => {
    if (open && focusIdx >= 0 && optionRefs.current[focusIdx]) {
      optionRefs.current[focusIdx].focus();
    }
  }, [open, focusIdx]);

  function handleSelect(newMode) {
    setMode(newMode);
    localStorage.setItem('sidebarMode', newMode);
    setOpen(false);
    setFocusIdx(-1);
    window.dispatchEvent(new CustomEvent('sidebarModeChange', { detail: newMode }));
  }

  function handleKeyDown(e) {
    if (!open) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusIdx((idx) => (idx + 1) % SIDEBAR_MODES.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusIdx((idx) => (idx - 1 + SIDEBAR_MODES.length) % SIDEBAR_MODES.length);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (focusIdx >= 0) handleSelect(SIDEBAR_MODES[focusIdx].value);
    } else if (e.key === 'Escape') {
      setOpen(false);
      setFocusIdx(-1);
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        className="flex items-center gap-2 px-2 py-1 rounded hover:bg-muted/60 text-foreground text-sm group"
        onClick={() => { setOpen((v) => !v); setFocusIdx(0); }}
        aria-haspopup="true"
        aria-expanded={open}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        aria-label="Sidebar control"
      >
        <span className="material-symbols-outlined text-lg align-middle">more_vert</span>
        <span className="absolute left-1/2 z-50 mt-10 -translate-x-1/2 scale-0 rounded bg-black/90 px-2 py-1 text-xs text-white opacity-0 transition-all group-hover:scale-100 group-hover:opacity-100 pointer-events-none whitespace-nowrap shadow-lg">
          Sidebar control
        </span>
      </button>
      {open && (
        <div
          className="absolute left-0 mt-2 w-52 rounded-2xl shadow-2xl bg-popover border border-border z-50 animate-fade-in"
          onKeyDown={handleKeyDown}
        >
          <div className="px-4 pt-1 pb-0.5 text-sm font-medium text-muted-foreground">Sidebar control</div>
          <div className="border-b border-border mx-3 mb-1"></div>
          {SIDEBAR_MODES.map((opt, i) => (
            <button
              key={opt.value}
              ref={el => optionRefs.current[i] = el}
              className={`flex items-center w-full gap-2 px-4 py-1.5 text-base text-left whitespace-nowrap transition-colors duration-100 rounded-md ${mode === opt.value ? 'font-semibold text-primary bg-muted/30' : 'hover:bg-primary/10 hover:text-primary'} ${focusIdx === i ? 'ring-2 ring-primary/40' : ''}`}
              onClick={() => handleSelect(opt.value)}
              style={{ minHeight: '1.75rem' }}
              tabIndex={-1}
            >
              {mode === opt.value ? RADIO_CHECKED : RADIO_UNCHECKED}
              <span className="truncate block align-middle">{opt.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
