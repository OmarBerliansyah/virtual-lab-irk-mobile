import CustomSplashScreen from '@/components/SplashScreen';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import 'react-native-reanimated';
import Toast from 'react-native-toast-message';
import '../global.css';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  anchor: '(tabs)',
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      staleTime: 10 * 60 * 1000,
      gcTime: 15 * 60 * 1000,
      retry: 2,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30_000),
    },
    mutations: { retry: 1 },
  },
});

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [isSplashReady, setSplashReady] = useState(false);

  useEffect(() => {
    if (isSplashReady && !isLoading) {
      // Hide the splash screen once authentication state is loaded and splash animation is done
      SplashScreen.hideAsync();
    }
  }, [isSplashReady, isLoading]);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(tabs)';

    if (!isAuthenticated && inAuthGroup) {
      // Redirect to login if not authenticated
      router.replace('/login');
    } else if (isAuthenticated && segments[0] === 'login') {
      // Redirect to tabs if authenticated and on login screen
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isLoading, segments, router]);

  if (!isSplashReady || isLoading) {
    return <CustomSplashScreen onFinish={() => setSplashReady(true)} />;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        <Stack.Screen name="assistant-dashboard" options={{ title: 'Assistant Dashboard' }} />
        <Stack.Screen name="admin-dashboard" options={{ title: 'Admin Dashboard' }} />
        <Stack.Screen name="task-detail/[id]" options={{ title: 'Task Details', presentation: 'card' }} />
        <Stack.Screen name="task-management-detail/[id]" options={{ title: 'Task Management', presentation: 'card' }} />
        <Stack.Screen name="highlight-detail/[id]" options={{ title: 'Highlight Details', presentation: 'card' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <RootLayoutNav />
        <Toast />
      </QueryClientProvider>
    </AuthProvider>
  );
}