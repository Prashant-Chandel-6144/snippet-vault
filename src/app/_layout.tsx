import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import React from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { ThemeProvider, useTheme } from '@/hooks/use-theme';
import { SnippetStoreProvider } from '@/hooks/store';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function AppContent() {
  const theme = useTheme();
  const isDark = theme.text === '#ffffff';

  return (
    <NavigationThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <View style={{ flex: 1, backgroundColor: theme.background }}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
        </Stack>
      </View>
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
