import { useClerk } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';

export default function ForceLogout() {
  const { signOut } = useClerk();
  const router = useRouter();

  useEffect(() => {
    const logout = async () => {
      console.log('🚪 Force logout initiated...');
      try {
        await signOut();
        console.log('✅ Logout successful');
        router.replace('/login');
      } catch (error) {
        console.error('❌ Logout error:', error);
        router.replace('/login');
      }
    };

    logout();
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#ef4444" />
      <Text style={styles.text}>Logging out...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  text: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
});

