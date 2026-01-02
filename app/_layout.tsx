import { ClerkProvider } from '@clerk/clerk-expo';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import Toast from 'react-native-toast-message';
import '../global.css';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { tokenCache } from '@/utils/clerkTokenCache';

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

const clerkPublishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

if (!clerkPublishableKey) {
  console.error('Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY');
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ClerkProvider publishableKey={clerkPublishableKey || ''} tokenCache={tokenCache}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
            <Stack.Screen name="assistant-dashboard" options={{ title: 'Assistant Dashboard' }} />
            <Stack.Screen name="admin-dashboard" options={{ title: 'Admin Dashboard' }} />
          </Stack>
          <StatusBar style="auto" />
        </ThemeProvider>
        <Toast />
      </QueryClientProvider>
    </ClerkProvider>
  );
}
