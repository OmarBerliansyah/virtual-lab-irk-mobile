import CustomSplashScreen from '@/components/SplashScreen';
import { AuthProvider, useAuth } from '@/contexts/AuthContext.clerk';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { tokenCache } from '@/utils/clerkTokenCache';
import { ClerkLoaded, ClerkProvider } from '@clerk/clerk-expo';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { Platform, View } from 'react-native';
import 'react-native-reanimated';
import Toast from 'react-native-toast-message';
import '../global.css';

const clerkPublishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

if (!clerkPublishableKey && Platform.OS !== 'web') {
  throw new Error('Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY');
}

if (Platform.OS !== 'web') {
  SplashScreen.preventAutoHideAsync();
}

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
  const segments = useSegments();
  const router = useRouter();
  const [isSplashReady, setSplashReady] = useState(false);
  const isWeb = Platform.OS === 'web';
  const authContext = isWeb ? { isAuthenticated: false, isLoading: false } : useAuth();
  const { isAuthenticated, isLoading } = authContext;

  useEffect(() => {
    if (isSplashReady && !isLoading && !isWeb) {
      SplashScreen.hideAsync();
    }
  }, [isSplashReady, isLoading, isWeb]);

  useEffect(() => {
    if (isLoading) return;
    const inAuthGroup = segments[0] === '(tabs)';
    if (!isAuthenticated && inAuthGroup && !isWeb) {
      router.replace('/login');
    } else if (isAuthenticated && segments[0] === 'login' && !isWeb) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isLoading, segments, router, isWeb]);

  if (!isSplashReady || isLoading) {
    if (isWeb) {
      if (!isSplashReady) setSplashReady(true);
      if (isLoading) return null;
    }
    return <CustomSplashScreen onFinish={() => setSplashReady(true)} />;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <View style={{ flex: 1 }}>
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
      </View>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  if (Platform.OS === 'web') {
    return (
      <QueryClientProvider client={queryClient}>
        <RootLayoutNav />
        <Toast />
      </QueryClientProvider>
    );
  }
  return (
    <ClerkProvider publishableKey={clerkPublishableKey!} tokenCache={tokenCache}>
      <ClerkLoaded>
        <AuthProvider>
          <QueryClientProvider client={queryClient}>
            <RootLayoutNav />
            <Toast />
          </QueryClientProvider>
        </AuthProvider>
      </ClerkLoaded>
    </ClerkProvider>
  );
}
