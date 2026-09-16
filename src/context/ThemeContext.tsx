import React, { createContext, useContext, useState, useEffect } from 'react';

export type Theme = 'adacayi' | 'light' | 'lacivert' | 'kiremit';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem('tugba-theme');
    return (saved === 'light' || saved === 'adacayi' || saved === 'lacivert' || saved === 'kiremit') ? (saved as Theme) : 'adacayi';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('tugba-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setThemeState((prev) => {
      if (prev === 'adacayi') return 'light';
      if (prev === 'light') return 'lacivert';
      if (prev === 'lacivert') return 'kiremit';
      return 'adacayi';
    });
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

