import { useClerk } from '@clerk/clerk-expo';
import { Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

export const SignOutButton = () => {
  const { signOut } = useClerk();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut();
      // Redirect to login page
      router.replace('/login');
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  return (
    <TouchableOpacity style={styles.button} onPress={handleSignOut}>
      <Text style={styles.buttonText}>Sign out</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#ef4444',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

