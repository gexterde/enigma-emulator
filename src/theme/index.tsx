import React, { createContext, useContext, useState, useEffect } from 'react';
import { ThemeName, ThemeOption, AVAILABLE_THEMES, ThemeProduct, ThemeFactory, CSS_VARIABLES_THEME } from './types';
import { VintageThemeFactory } from './vintage';
import { BakeliteBrassThemeFactory } from './bakeliteBrass';
import { BletchleyParkThemeFactory } from './bletchleyPark';
import { CipherNoirThemeFactory } from './cipherNoir';
import { VintageNavyThemeFactory } from './vintageNavy';
import { ModernThemeFactory } from './modern';
import { ModernDarkThemeFactory } from './modernDark';
import { AmberCrtThemeFactory } from './amberCrt';
import { EmeraldCrtThemeFactory } from './emeraldCrt';

export * from './types';
export * from './vintage';
export * from './bakeliteBrass';
export * from './bletchleyPark';
export * from './cipherNoir';
export * from './vintageNavy';
export * from './modern';
export * from './modernDark';
export * from './amberCrt';
export * from './emeraldCrt';

interface ThemeContextType {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
}

const ThemeContext = createContext<ThemeContextType>({ theme: 'vintage', setTheme: () => {} });

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<ThemeName>('vintage');
  
  useEffect(() => {
    try {
      const saved = localStorage.getItem('enigma_theme') as ThemeName;
      if (AVAILABLE_THEMES.some((t) => t.id === saved)) {
        setTheme(saved);
        AVAILABLE_THEMES.forEach((themeOpt) => {
          document.documentElement.classList.remove(`theme-${themeOpt.id}`);
        });
        document.documentElement.classList.add(`theme-${saved}`);
      } else {
        document.documentElement.classList.add('theme-vintage');
      }
    } catch(e) {
      document.documentElement.classList.add('theme-vintage');
    }
  }, []);

  const handleSetTheme = (t: ThemeName) => {
    setTheme(t);
    try { localStorage.setItem('enigma_theme', t); } catch(e) {}
    AVAILABLE_THEMES.forEach((themeOpt) => {
      document.documentElement.classList.remove(`theme-${themeOpt.id}`);
    });
    document.documentElement.classList.add(`theme-${t}`);
  };

  return <ThemeContext.Provider value={{ theme, setTheme: handleSetTheme }}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);

export const getTheme = (_theme?: ThemeName): ThemeProduct => {
  return CSS_VARIABLES_THEME;
};

