import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Theme = 'light' | 'dark' | 'auto';

interface ThemeContextProps {
  isDark: boolean;
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextProps>({
  isDark: false,
  theme: 'auto',
  setTheme: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [theme, setTheme] = useState<Theme>('auto');

  useEffect(() => {
    AsyncStorage.getItem('theme-preference').then((savedTheme) => {
      if (savedTheme && ['light', 'dark', 'auto'].includes(savedTheme)) {
        setTheme(savedTheme as Theme);
      }
    });
  }, []);

  useEffect(() => {
    AsyncStorage.setItem('theme-preference', theme);
  }, [theme]);

  const isDark = theme === 'dark' || (theme === 'auto' && systemColorScheme === 'dark');

  return (
    <ThemeContext.Provider value={{ isDark, theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext); 