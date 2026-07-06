import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { Colors } from '@/constants/theme';
import preferencesDb from '@/db/preferences';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  themeColors: typeof Colors.light | typeof Colors.dark;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');

  useEffect(() => {
    async function loadTheme() {
      try {
        const prefs = await preferencesDb.getPreferences();
        if (prefs && prefs.theme) {
          setThemeModeState(prefs.theme as ThemeMode);
        }
      } catch (err) {
        console.warn('Failed to load theme preference', err);
      }
    }
    loadTheme();
  }, []);

  const setThemeMode = async (mode: ThemeMode) => {
    setThemeModeState(mode);
    try {
      await preferencesDb.setPreferences({ theme: mode, aiProvider: 'gemini' });
    } catch (err) {
      console.warn('Failed to save theme preference', err);
    }
  };

  const activeTheme = themeMode === 'system'
    ? (systemScheme === 'dark' ? 'dark' : 'light')
    : themeMode;

  const themeColors = Colors[activeTheme === 'dark' ? 'dark' : 'light'];

  return React.createElement(
    ThemeContext.Provider,
    { value: { themeMode, setThemeMode, themeColors } },
    children
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    const systemScheme = useColorScheme();
    const activeTheme = systemScheme === 'dark' ? 'dark' : 'light';
    return Colors[activeTheme];
  }
  return context.themeColors;
}

export function useThemeMode() {
  const context = useContext(ThemeContext);
  if (!context) {
    return {
      themeMode: 'system' as ThemeMode,
      setThemeMode: async () => {},
    };
  }
  return {
    themeMode: context.themeMode,
    setThemeMode: context.setThemeMode,
  };
}
