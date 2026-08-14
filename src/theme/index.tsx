import React, { createContext, useContext, useState, useEffect } from 'react';
import { ThemeName, ThemeOption, AVAILABLE_THEMES } from './types';
import { t, getTheme, ThemeTokens, ThemeProduct } from './tokens';

export * from './types';
export * from './tokens';

interface ThemeContextType {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  t: ThemeTokens;
}

const ThemeContext = createContext<ThemeContextType>({ 
  theme: 'vintage', 
  setTheme: () => {}, 
  t 
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<ThemeName>('vintage');
  
  useEffect(() => {
    try {
      const saved = localStorage.getItem('enigma_theme') as ThemeName;
      if (AVAILABLE_THEMES.some((opt) => opt.id === saved)) {
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

  const handleSetTheme = (newTheme: ThemeName) => {
    setTheme(newTheme);
    try { 
      localStorage.setItem('enigma_theme', newTheme); 
    } catch(e) {}
    AVAILABLE_THEMES.forEach((themeOpt) => {
      document.documentElement.classList.remove(`theme-${themeOpt.id}`);
    });
    document.documentElement.classList.add(`theme-${newTheme}`);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme: handleSetTheme, t }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
