import React, { createContext, useContext, useState, useEffect } from 'react';

export type ThemeName = 'vintage' | 'modern';

interface ThemeContextType {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
}

const ThemeContext = createContext<ThemeContextType>({ theme: 'vintage', setTheme: () => {} });

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<ThemeName>('vintage');
  
  useEffect(() => {
    try {
      const saved = localStorage.getItem('enigma_theme');
      if (saved === 'vintage' || saved === 'modern') setTheme(saved);
    } catch(e) {}
  }, []);

  const handleSetTheme = (t: ThemeName) => {
    setTheme(t);
    try { localStorage.setItem('enigma_theme', t); } catch(e) {}
    if (t === 'modern') {
      document.documentElement.classList.add('theme-modern');
    } else {
      document.documentElement.classList.remove('theme-modern');
    }
  };

  return <ThemeContext.Provider value={{ theme, setTheme: handleSetTheme }}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);

export const getTheme = (theme: ThemeName) => ({
  // Layout
  appBg: theme === 'vintage' ? 'bg-[#0a0806] text-[#ede1cd] selection:bg-amber-900/50' : 'bg-slate-50 text-slate-900 selection:bg-blue-200',
  sidebarBg: theme === 'vintage' ? 'bg-[#120e04] border-[#3b3426]' : 'bg-white border-slate-200',
  headerBg: theme === 'vintage' ? 'bg-[#120e04] border-[#3b3426]' : 'bg-white border-slate-200',
  panelBg: theme === 'vintage' ? 'bg-[#120e04] border-[#3b3426]' : 'bg-white border-slate-200 shadow-sm',
  panelInner: theme === 'vintage' ? 'bg-[#1b170e] border-[#3b3426]' : 'bg-slate-50 border-slate-200',
  modalBg: theme === 'vintage' ? 'bg-[#201b0f] border-[#4e453b] text-[#ede1cd] texture-metal' : 'bg-white border-slate-200 text-slate-900 shadow-xl',
  modalHeaderBg: theme === 'vintage' ? 'bg-[#3b3426] border-[#4e453b]' : 'bg-slate-50 border-slate-200',
  modalFooterBg: theme === 'vintage' ? 'bg-[#120e04] border-[#3b3426]' : 'bg-slate-50 border-slate-200',
  
  // Text
  textPrimary: theme === 'vintage' ? 'text-[#ede1cd]' : 'text-slate-900',
  textSecondary: theme === 'vintage' ? 'text-[#8c7e6a]' : 'text-slate-500',
  textAccent: theme === 'vintage' ? 'text-[#ebc238]' : 'text-blue-600',
  textMuted: theme === 'vintage' ? 'text-[#d1c4b7]' : 'text-slate-600',
  
  // Borders
  borderBase: theme === 'vintage' ? 'border-[#3b3426]' : 'border-slate-200',
  borderAccent: theme === 'vintage' ? 'border-[#8b6f47]' : 'border-blue-300',
  
  // Controls
  buttonPrimary: theme === 'vintage' ? 'bg-[#2a241a] hover:bg-[#3b3426] text-[#ede1cd] border-[#4e453b]' : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-300 shadow-sm',
  buttonHighlight: theme === 'vintage' ? 'bg-[#8b6f47] hover:bg-[#8b6f47]/90 text-[#fffaf8]' : 'bg-blue-600 hover:bg-blue-700 text-white',
  buttonDanger: theme === 'vintage' ? 'bg-red-950/90 hover:bg-red-900 text-red-200 border-red-700' : 'bg-red-50 hover:bg-red-100 text-red-700 border-red-200',
  buttonDangerSolid: theme === 'vintage' ? 'bg-[#93000a] text-[#ffdad6] hover:bg-red-900' : 'bg-red-600 text-white hover:bg-red-700',
  dangerBg: theme === 'vintage' ? 'bg-[#93000a]/20 border-red-800/40 text-[#ffdad6]' : 'bg-red-50 border-red-200 text-red-900',
  
  // Inputs
  inputBg: theme === 'vintage' ? 'bg-[#0a0806] border-[#3b3426] text-[#ebc238]' : 'bg-white border-slate-300 text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500',
  
  // Keys
  keyShape: theme === 'vintage' ? 'rounded-full' : 'rounded-md',
  keyBase: theme === 'vintage' 
    ? 'border-[#83715d] bg-[#3b3426] shadow-key-base hover:border-[#e3c193] hover:bg-[#4e453b]' 
    : 'border-slate-300 bg-white shadow-sm hover:border-slate-400 hover:bg-slate-50 text-slate-700',
  keyPressed: theme === 'vintage'
    ? 'bg-[#ebc238] text-[#25190b] border-white ring-4 ring-[#ebc238]/40 shadow-[0_0_15px_#ebc238]'
    : 'bg-blue-100 text-blue-700 border-blue-400 ring-2 ring-blue-500/30 shadow-[0_0_10px_rgba(59,130,246,0.3)]',
  keyCompactBase: theme === 'vintage'
    ? 'bakelite-key text-[#e3c193]'
    : 'bg-white border border-slate-300 text-slate-700 shadow-sm hover:bg-slate-50',
  keyCompactPressed: theme === 'vintage'
    ? 'key-pressed ring-2 ring-[#ebc238]/60 text-[#ebc238]'
    : 'bg-blue-100 border-blue-400 text-blue-700 ring-2 ring-blue-500/30',

  // Lamps
  lampShape: theme === 'vintage' ? 'rounded-full' : 'rounded-md',
  lampBase: theme === 'vintage'
    ? 'bg-[#120e04] border-[#3b3426] text-[#83715d] shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)]'
    : 'bg-slate-100 border-slate-300 text-slate-400 shadow-sm',
  lampLit: theme === 'vintage'
    ? 'bg-[#ebc238] border-[#fff5d6] text-[#25190b] shadow-lamp-glow font-bold scale-105'
    : 'bg-blue-500 border-blue-400 text-white shadow-[0_0_15px_rgba(59,130,246,0.6)] font-bold scale-105',
  lampDim: theme === 'vintage'
    ? 'lamp-dim-glow border-[#ebc238]/50'
    : 'bg-blue-50 border-blue-200 text-blue-600 shadow-sm animate-bulb-flicker',
  
  // Specific Panel BGs
  keyboardPanelBg: theme === 'vintage' ? 'bg-[#181307] border-[#4e453b] texture-wood shadow-panel' : 'bg-white border-slate-200 shadow-sm',
  lampboardPanelBg: theme === 'vintage' ? 'bg-[#201b0f] border-[#4e453b] texture-metal shadow-panel' : 'bg-slate-50 border-slate-200 shadow-sm',
  compactPlateBg: theme === 'vintage' ? 'metal-plate shadow-md' : 'bg-white border border-slate-200 shadow-sm',
  paperTapeBg: theme === 'vintage' ? 'bg-[#f6dfc7] text-[#25190b]' : 'bg-white text-slate-900 border border-slate-300',
  paperTapeBorder: theme === 'vintage' ? 'border-[#ebc238]' : 'border-blue-500',
  selectBg: theme === 'vintage' ? 'bg-[#1b170e] text-[#ede1cd] border-[#3b3426]' : 'bg-white text-slate-800 border-slate-300',
  fontHeader: theme === 'vintage' ? 'font-ui-header' : 'font-sans font-semibold tracking-tight',
  fontBody: theme === 'vintage' ? 'font-ui-body' : 'font-sans',
  fontMono: theme === 'vintage' ? 'font-monospaced-technical' : 'font-mono text-[0.9em]',
  fontRotor: theme === 'vintage' ? 'font-rotor-label text-[#ebc238]' : 'font-sans font-bold text-slate-800',
});
