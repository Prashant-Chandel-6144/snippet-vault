import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import React from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';

import { SplashOverlay } from '@/components/SplashOverlay';
import { ThemeProvider, useTheme } from '@/hooks/use-theme';
import { SnippetStoreProvider } from '@/hooks/store';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function AppContent() {
  const theme = useTheme();
  const isDark = theme.text === '#ffffff';

  return (
    <NavigationThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
      <View style={{ flex: 1, backgroundColor: theme.background }}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="privacy" />
        </Stack>
      </View>
      <SplashOverlay />
    </NavigationThemeProvider>
  );
}

export default function TabLayout() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <SnippetStoreProvider>
          <AppContent />
        </SnippetStoreProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
