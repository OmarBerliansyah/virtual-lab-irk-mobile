import CustomSplashScreen from '@/components/SplashScreen';
import { AuthProvider, useAuth } from '@/contexts/AuthContext.clerk';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ClerkProvider } from '@clerk/clerk-expo';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import Constants from 'expo-constants';
import React, { useEffect, useState } from 'react';
import { LogBox } from 'react-native';
import 'react-native-reanimated';
import Toast from 'react-native-toast-message';
import '../global.css';

// Suppress known warnings from dependencies
LogBox.ignoreLogs([
  'props.pointerEvents is deprecated. Use style.pointerEvents',
  '"shadow*" style props are deprecated. Use "boxShadow".',
  'Animated: `useNativeDriver` is not supported because the native animated module is missing',
  'Supabase environment variables not set',
  'Invalid supabaseUrl: Must be a valid HTTP or HTTPS URL.',
]);

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
  const { isAuthenticated, isLoading, user } = useAuth();
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

    const inAuthGroup = segments[0] === '(tabs)' || segments[0] === 'admin-dashboard' || segments[0] === 'assistant-dashboard';
    const inLoginGroup = segments[0] === 'login' || segments[0] === '(auth)';

    if (!isAuthenticated && !inLoginGroup) {
      // Redirect to login if not authenticated and not already on login screens
      console.log('🔒 Not authenticated, redirecting to login');
      router.replace('/login');
    } else if (isAuthenticated && inLoginGroup) {
      // All authenticated users go to main dashboard
      const role = user?.role || 'user';
      console.log('✅ Authenticated with role:', role, '→ Redirecting to main dashboard');
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isLoading, user, segments, router]);

  if (!isSplashReady || isLoading) {
    return <CustomSplashScreen onFinish={() => setSplashReady(true)} />;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack 
        screenOptions={{ headerShown: false }}
        initialRouteName="index"
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="force-logout" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
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

// Get Clerk publishable key from environment or app config
const clerkPublishableKey = 
  process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY || 
  Constants.expoConfig?.extra?.clerkPublishableKey || 
  '';

if (!clerkPublishableKey) {
  console.warn(
    '⚠️ Clerk publishable key not found. Please set EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in your .env file or app.json'
  );
}

export default function RootLayout() {
  // ClerkProvider is required for Clerk authentication
  // Always wrap with ClerkProvider when using Clerk AuthContext
  return (
    <ClerkProvider publishableKey={clerkPublishableKey || 'pk_test_placeholder'}>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <RootLayoutNav />
          <Toast />
        </QueryClientProvider>
      </AuthProvider>
    </ClerkProvider>
  );
}