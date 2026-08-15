import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { ThemeName, ThemeOption, AVAILABLE_THEMES, CustomTheme } from './types';
import { t, getTheme, ThemeTokens, ThemeProduct } from './tokens';

export * from './types';
export * from './tokens';

interface ThemeContextType {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  t: ThemeTokens;
  customThemes: CustomTheme[];
  saveCustomTheme: (theme: CustomTheme) => void;
  deleteCustomTheme: (id: string) => void;
  getAvailableThemes: () => ThemeOption[];
}

const ThemeContext = createContext<ThemeContextType>({ 
  theme: 'vintage', 
  setTheme: () => {}, 
  t,
  customThemes: [],
  saveCustomTheme: () => {},
  deleteCustomTheme: () => {},
  getAvailableThemes: () => AVAILABLE_THEMES
});

function hexToRgba(hex: string, alpha: number): string {
  let c = hex.replace('#', '');
  if (c.length === 3) {
    c = c.split('').map(y => y + y).join('');
  }
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return `rgba(${isNaN(r) ? 0 : r}, ${isNaN(g) ? 0 : g}, ${isNaN(b) ? 0 : b}, ${alpha})`;
}

function isColorDark(hex: string): boolean {
  let c = hex.replace('#', '');
  if (c.length === 3) {
    c = c.split('').map(y => y + y).join('');
  }
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return true;
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return yiq < 128;
}

function generateHuesFromColor(hex: string, count: number): string[] {
  let c = hex.replace('#', '');
  if (c.length === 3) {
    c = c.split('').map(y => y + y).join('');
  }
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) {
    return Array.from({ length: count }, (_, i) => `hsl(${(i * 360 / count) % 360}, 70%, 50%)`);
  }

  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;
  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rNorm: h = (gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0); break;
      case gNorm: h = (bNorm - rNorm) / d + 2; break;
      case bNorm: h = (rNorm - gNorm) / d + 4; break;
    }
    h /= 6;
  }

  const hDegrees = h * 360;
  const sPercent = Math.round(s * 100);
  const lPercent = Math.round(l * 100);

  return Array.from({ length: count }, (_, i) => {
    const nextHue = (hDegrees + (i * (360 / count))) % 360;
    return `hsl(${Math.round(nextHue)}, ${sPercent}%, ${lPercent}%)`;
  });
}

function interpolateColor(color1: string, color2: string, factor: number): string {
  let c1 = color1.replace('#', '');
  let c2 = color2.replace('#', '');
  if (c1.length === 3) c1 = c1.split('').map(y => y + y).join('');
  if (c2.length === 3) c2 = c2.split('').map(y => y + y).join('');
  
  const r1 = parseInt(c1.substring(0, 2), 16);
  const g1 = parseInt(c1.substring(2, 4), 16);
  const b1 = parseInt(c1.substring(4, 6), 16);

  const r2 = parseInt(c2.substring(0, 2), 16);
  const g2 = parseInt(c2.substring(2, 4), 16);
  const b2 = parseInt(c2.substring(4, 6), 16);

  if (isNaN(r1) || isNaN(g1) || isNaN(b1) || isNaN(r2) || isNaN(g2) || isNaN(b2)) {
    return color1;
  }

  const r = Math.round(r1 + factor * (r2 - r1));
  const g = Math.round(g1 + factor * (g2 - g1));
  const b = Math.round(b1 + factor * (b2 - b1));

  const rHex = r.toString(16).padStart(2, '0');
  const gHex = g.toString(16).padStart(2, '0');
  const bHex = b.toString(16).padStart(2, '0');

  return `#${rHex}${gHex}${bHex}`;
}

function generateCSSForCustomTheme(ct: CustomTheme): string {
  const cableMode = ct.colors.plugboardCableMode || 'multicolor';
  const cableBaseColor = ct.colors.plugboardCableColor || '#b33939';
  const cableEndColor = ct.colors.plugboardCableColorEnd || '#d1ccc0';
  const customColors = ct.colors.plugboardCableCustomColors || [];
  let cableCSSLines = '';

  let colorsList: string[] = [];
  if (cableMode === 'single') {
    colorsList = Array(13).fill(cableBaseColor);
  } else if (cableMode === 'gradient') {
    colorsList = Array.from({ length: 13 }, (_, i) => interpolateColor(cableBaseColor, cableEndColor, i / 12));
  } else if (cableMode === 'custom') {
    const defaultFallbacks = [
      '#b33939', '#218c74', '#227093', '#cc8e35', '#40407a',
      '#ff5252', '#33d9b2', '#34ace0', '#ffb142', '#706fd3',
      '#ff793f', '#84817a', '#d1ccc0'
    ];
    colorsList = Array.from({ length: 13 }, (_, i) => customColors[i] || defaultFallbacks[i]);
  } else {
    colorsList = generateHuesFromColor(cableBaseColor, 13);
  }

  cableCSSLines = colorsList.map((color, idx) => `  --cable-color-${idx}: ${color};`).join('\n');

  return `
.theme-${ct.id} {
  ${cableCSSLines}
  --bg-app: ${ct.colors.bgApp};
  --bg-sidebar: ${ct.colors.bgPanel};
  --bg-header: ${ct.colors.bgPanel};
  --bg-panel: ${ct.colors.bgPanel};
  --bg-panel-inner: ${ct.colors.bgPanelInner};
  --bg-modal: ${ct.colors.bgPanel};
  --bg-modal-header: ${ct.colors.bgPanelInner};
  --bg-modal-footer: ${ct.colors.bgPanel};
  --bg-well: ${ct.colors.bgPanelInner};
  --bg-well-inner: ${ct.colors.bgPanel};
  --text-primary: ${ct.colors.textPrimary};
  --text-secondary: ${ct.colors.textSecondary};
  --text-accent: ${ct.colors.textAccent};
  --text-muted: ${ct.colors.textSecondary};
  --border-base: ${ct.colors.borderBase};
  --border-accent: ${ct.colors.textAccent};
  --border-modal: ${ct.colors.borderBase};
  --badge-active-bg: ${ct.colors.textAccent};
  --badge-active-text: ${ct.colors.bgApp};
  --badge-inactive-bg: ${ct.colors.bgPanelInner};
  --badge-inactive-text: ${ct.colors.textSecondary};
  --badge-success-bg: #1c4520;
  --badge-success-text: #bbf7d0;
  --badge-success-border: #22c55e;
  --badge-danger-bg: #4c1116;
  --badge-danger-text: #fecaca;
  --badge-danger-border: #ef4444;
  --accent-light-bg: ${hexToRgba(ct.colors.textAccent, 0.2)};
  --accent-solid-bg: ${ct.colors.textAccent};
  --accent-solid-hover: ${ct.colors.textAccent};
  --muted-bg: ${ct.colors.bgPanelInner};
  --indicator-bg: ${ct.colors.bgPanelInner};
  --success-light-bg: rgba(5, 46, 22, 0.25);
  --danger-light-bg: rgba(69, 10, 10, 0.45);
  --success-text: #4ade80;
  --danger-text: #f87171;
  --slider-accent: ${ct.colors.textAccent};
  --progress-fill: ${ct.colors.textAccent};
  --btn-primary-bg: ${ct.colors.bgPanelInner};
  --btn-primary-hover: ${ct.colors.bgPanel};
  --btn-primary-text: ${ct.colors.textPrimary};
  --btn-primary-border: ${ct.colors.borderBase};
  --btn-highlight-bg: ${ct.colors.textAccent};
  --btn-highlight-hover: ${ct.colors.textAccent};
  --btn-highlight-text: ${ct.colors.bgApp};
  --btn-danger-bg: rgba(127, 29, 29, 0.9);
  --btn-danger-hover: #7f1d1d;
  --btn-danger-text: #fecaca;
  --btn-danger-border: #b91c1c;
  --btn-danger-solid-bg: #93000a;
  --btn-danger-solid-hover: #7f1d1d;
  --btn-danger-solid-text: #ffdad6;
  --control-btn-bg: ${ct.colors.bgPanelInner};
  --control-btn-hover: ${ct.colors.textAccent};
  --control-btn-text: ${ct.colors.textPrimary};
  --control-btn-active-bg: ${ct.colors.textAccent};
  --control-btn-active-text: ${ct.colors.bgApp};
  --input-bg: ${ct.colors.bgApp};
  --input-border: ${ct.colors.borderBase};
  --input-text: ${ct.colors.textAccent};
  --key-base-bg: ${ct.colors.keyBaseBg || ct.colors.bgPanelInner};
  --key-base-border: ${ct.colors.borderBase};
  --key-base-hover-bg: ${ct.colors.bgPanel};
  --key-base-hover-border: ${ct.colors.textAccent};
  --key-base-text: ${ct.colors.textPrimary};
  --key-pressed-bg: ${ct.colors.keyPressedBg || ct.colors.textAccent};
  --key-pressed-border: ${ct.colors.textPrimary};
  --key-pressed-text: ${ct.colors.bgApp};
  --lamp-base-bg: ${ct.colors.bgPanelInner};
  --lamp-base-border: ${ct.colors.borderBase};
  --lamp-base-text: ${ct.colors.textSecondary};
  --lamp-lit-bg: ${ct.colors.lampLitBg};
  --lamp-lit-border: ${ct.colors.textPrimary};
  --lamp-lit-text: ${ct.colors.bgApp};
  --lamp-lit-glow: ${ct.colors.lampLitBg};
  --lamp-lit-dkl-bg: ${hexToRgba(ct.colors.lampLitBg || '#f59e0b', 0.6)};
  --lamp-lit-dkl-text: ${ct.colors.bgApp};
  --lamp-lit-sammler-bg: ${hexToRgba(ct.colors.lampLitBg || '#f59e0b', 0.95)};
  --lamp-lit-sammler-text: ${ct.colors.bgApp};
  --keyboard-panel-bg: ${ct.colors.bgPanel};
  --keyboard-panel-border: ${ct.colors.borderBase};
  --lampboard-panel-bg: ${ct.colors.bgPanel};
  --lampboard-panel-border: ${ct.colors.borderBase};
  --paper-tape-bg: ${ct.colors.paperTapeBg || '#f6dfc7'};
  --paper-tape-text: ${ct.colors.paperTapeText || '#25190b'};
  --paper-tape-border: ${ct.colors.textAccent};
  --rotor-window-bg: ${ct.colors.rotorWindowBg || ct.colors.bgPanelInner};
  --rotor-window-border: ${ct.colors.borderBase};
  --rotor-label-color: ${ct.colors.rotorLabelColor || ct.colors.textAccent};
  --chart-bar-plain: ${ct.colors.textSecondary};
  --chart-bar-cipher: ${ct.colors.textAccent};
  --radio-chassis-bg: ${ct.colors.radioChassisBg};
  --radio-header-border: ${ct.colors.borderBase};
  --radio-power-switch-bg: ${ct.colors.bgApp};
  --radio-power-on-text: ${ct.colors.textAccent};
  --radio-power-off-text: #f87171;
  --radio-power-knob-from: ${ct.colors.bgPanelInner};
  --radio-power-knob-via: ${ct.colors.bgPanel};
  --radio-power-knob-to: ${ct.colors.bgApp};
  --radio-rotary-knob-notch: ${ct.colors.textAccent};
  --mix-blend-mode: ${isColorDark(ct.colors.bgApp || '#1c1c1c') ? 'screen' : 'multiply'};
  --radio-glass-dial-on: linear-gradient(to bottom, ${ct.colors.textAccent}22, ${ct.colors.bgApp}f2, ${ct.colors.textAccent}22);
  --radio-glass-dial-border: ${ct.colors.borderBase};
  --radio-dial-text: ${ct.colors.textAccent};
  --radio-dial-tick: ${ct.colors.textAccent}b3;
  --radio-needle-bg: ${ct.colors.radioNeedleBg || '#f87171'};
  --radio-needle-glow: ${hexToRgba(ct.colors.radioNeedleBg || '#f87171', 0.8)};
  --radio-smeter-bg: ${ct.colors.bgPanelInner}80;
  --radio-smeter-text: ${ct.colors.textAccent};
  --radio-display-box-bg: ${ct.colors.bgApp};
  --radio-display-readout-on: ${ct.colors.textAccent};
  --radio-display-readout-off: ${ct.colors.textSecondary}40;
  --radio-scope-bg: ${ct.colors.bgApp};
  --radio-scope-grid: ${ct.colors.textAccent}15;
  --radio-scope-wave-active: ${ct.colors.textAccent};
  --radio-scope-wave-idle: ${ct.colors.textSecondary}40;
  --battery-panel-stop-0: ${ct.colors.bgPanelInner};
  --battery-panel-stop-100: ${ct.colors.bgApp};
  --battery-brass-stop-0: ${hexToRgba(ct.colors.textAccent, 0.9)};
  --battery-brass-stop-40: ${ct.colors.textAccent};
  --battery-brass-stop-80: ${hexToRgba(ct.colors.textAccent, 0.6)};
  --battery-brass-stop-100: ${hexToRgba(ct.colors.textAccent, 0.3)};
  --battery-bakelite-stop-0: ${ct.colors.bgPanelInner};
  --battery-bakelite-stop-40: ${ct.colors.bgPanel};
  --battery-bakelite-stop-85: ${ct.colors.bgApp};
  --battery-bakelite-stop-100: ${hexToRgba(ct.colors.bgApp, 0.8)};
  --battery-plate-shadow-opacity: 0.8;
  --battery-rect-stroke: ${ct.colors.borderBase};
  --battery-axle-fill: ${ct.colors.bgApp};
  --battery-axle-stroke: ${ct.colors.borderBase};
  --battery-arc-stroke: ${ct.colors.borderBase};
  --battery-knob-base-fill: ${ct.colors.bgPanelInner};
  --battery-knob-base-stroke: ${ct.colors.borderBase};
  --battery-knob-handle-stroke: ${ct.colors.bgApp};
  --battery-knob-ridge-fill: ${ct.colors.bgPanel};
  --battery-knob-ridge-stroke: ${ct.colors.borderBase};
  --battery-hub-stroke: ${ct.colors.borderBase};
  --battery-hub-center-fill: ${ct.colors.bgPanelInner};
  --battery-arrow-stroke: ${ct.colors.textAccent};
}
`;
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<ThemeName>('vintage');
  const [customThemes, setCustomThemes] = useState<CustomTheme[]>([]);
  
  const isLoaded = useRef(false);

  // Load custom themes and initial theme
  useEffect(() => {
    try {
      const savedThemes = localStorage.getItem('enigma_custom_themes');
      if (savedThemes) {
        const parsed = JSON.parse(savedThemes) as CustomTheme[];
        if (Array.isArray(parsed)) {
          setCustomThemes(parsed);
        }
      }
    } catch (e) {
      console.error('Failed to parse custom themes', e);
    } finally {
      isLoaded.current = true;
    }
  }, []);

  // Save custom themes to localStorage whenever customThemes list changes
  useEffect(() => {
    if (!isLoaded.current) return;
    try {
      const themesToSave = customThemes.filter(ct => !ct.isDraft);
      localStorage.setItem('enigma_custom_themes', JSON.stringify(themesToSave));
      window.dispatchEvent(new Event('local-storage-change'));
    } catch (e) {
      console.error('Failed to save custom themes to localStorage', e);
    }
  }, [customThemes]);

  // Update dynamic head style block whenever customThemes list changes
  useEffect(() => {
    let styleEl = document.getElementById('enigma-custom-themes-style');
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'enigma-custom-themes-style';
      document.head.appendChild(styleEl);
    }
    
    const cssContent = customThemes.map(generateCSSForCustomTheme).join('\n');
    styleEl.textContent = cssContent;
  }, [customThemes]);

  const cleanThemeClasses = () => {
    const classes = Array.from(document.documentElement.classList);
    classes.forEach(c => {
      if (c.startsWith('theme-')) {
        document.documentElement.classList.remove(c);
      }
    });
  };

  useEffect(() => {
    try {
      const saved = localStorage.getItem('enigma_theme') as ThemeName;
      const customOpts = customThemes.map(ct => ({ id: ct.id, name: ct.name, isCustom: true }));
      const allOpts = [...AVAILABLE_THEMES, ...customOpts];
      
      cleanThemeClasses();
      if (allOpts.some((opt) => opt.id === saved)) {
        setTheme(saved);
        document.documentElement.classList.add(`theme-${saved}`);
      } else {
        setTheme('vintage');
        localStorage.setItem('enigma_theme', 'vintage');
        document.documentElement.classList.add('theme-vintage');
      }
    } catch(e) {
      cleanThemeClasses();
      document.documentElement.classList.add('theme-vintage');
    }
  }, [customThemes]);

  const handleSetTheme = (newTheme: ThemeName) => {
    setTheme(newTheme);
    try { 
      localStorage.setItem('enigma_theme', newTheme); 
    } catch(e) {}
    
    cleanThemeClasses();
    document.documentElement.classList.add(`theme-${newTheme}`);
  };

  const saveCustomTheme = (newTheme: CustomTheme) => {
    const updatedTheme = {
      ...newTheme,
      enabled: newTheme.enabled !== undefined ? newTheme.enabled : true
    };
    setCustomThemes(prev => {
      const filtered = prev.filter(t => t.id !== updatedTheme.id);
      return [...filtered, updatedTheme];
    });
  };

  const deleteCustomTheme = (id: string) => {
    setCustomThemes(prev => prev.filter(t => t.id !== id));
    
    const savedTheme = localStorage.getItem('enigma_theme');
    if (savedTheme === id || theme === id) {
      handleSetTheme('vintage');
    }
  };

  const getAvailableThemes = () => {
    const customOpts = customThemes
      .filter(ct => ct.enabled === true && !ct.isDraft)
      .map(ct => ({ id: ct.id, name: ct.name, isCustom: true }));
    return [...AVAILABLE_THEMES, ...customOpts];
  };

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      setTheme: handleSetTheme, 
      t, 
      customThemes, 
      saveCustomTheme, 
      deleteCustomTheme,
      getAvailableThemes
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
