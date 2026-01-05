import { useAuth } from '@/contexts/AuthContext.clerk';
import { Redirect } from 'expo-router';
import { View, ActivityIndicator, Text } from 'react-native';
import { useEffect } from 'react';

export default function Index() {
  const { isAuthenticated, isLoading, user } = useAuth();

  useEffect(() => {
    console.log('═══════════════════════════════════════');
    console.log('🏠 INDEX SCREEN - Auth State:');
    console.log('   isLoading:', isLoading);
    console.log('   isAuthenticated:', isAuthenticated);
    console.log('   user:', user);
    console.log('   role:', user?.role);
    console.log('═══════════════════════════════════════');
  }, [isLoading, isAuthenticated, user]);

  // Show loading while checking auth state
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={{ marginTop: 16, color: '#666' }}>Checking authentication...</Text>
      </View>
    );
  }

  // Not authenticated → redirect to login
  if (!isAuthenticated) {
    console.log('📍 INDEX: Redirecting to → LOGIN');
    return <Redirect href="/login" />;
  }

  // All authenticated users go to main dashboard (tabs)
  // Content will be different based on role
  const role = user?.role || 'user';
  
  console.log('═══════════════════════════════════════');
  console.log('📍 AUTHENTICATED REDIRECT:');
  console.log('   User Role:', role);
  console.log('   → Redirecting to: MAIN DASHBOARD (tabs)');
  console.log('   Dashboard will show role-specific content');
  console.log('═══════════════════════════════════════');
  
  return <Redirect href="/(tabs)" />;
}
