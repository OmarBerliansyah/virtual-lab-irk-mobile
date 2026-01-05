import { useAuth } from '@/contexts/AuthContext.clerk';
import { useSignUp } from '@clerk/clerk-expo';
import Toast from 'react-native-toast-message';
import { Image as ExpoImage } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from 'expo-router';
import { Lock, Mail, UserPlus } from 'lucide-react-native';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export default function SignUpScreen() {
  const { isLoading: authIsLoading } = useAuth();
  const { signUp, setActive } = useSignUp();
  const router = useRouter();

  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSignUpPress = async () => {
    if (!emailAddress.trim() || !password.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please enter both email and password',
      });
      return;
    }

    if (password.length < 8) {
      Toast.show({
        type: 'error',
        text1: 'Weak Password',
        text2: 'Password must be at least 8 characters long',
      });
      return;
    }

    console.log('📝 Attempting sign up for:', emailAddress.trim());
    setIsSubmitting(true);
    
    try {
      if (!signUp) {
        throw new Error('Clerk signUp not initialized');
      }

      // Create sign up with Clerk
      const result = await signUp.create({
        emailAddress: emailAddress.trim(),
        password: password.trim(),
      });

      console.log('✅ Clerk sign-up result:', result.status);

      // If email verification is required
      if (result.status === 'missing_requirements') {
        Toast.show({
          type: 'info',
          text1: 'Email Verification Required',
          text2: 'Please check your email to verify your account',
          visibilityTime: 5000,
        });
        // You might want to navigate to a verification screen
        return;
      }

      // Set the active session if sign up is complete
      if (result.status === 'complete') {
        await setActive?.({ session: result.createdSessionId });
        
        Toast.show({
          type: 'success',
          text1: 'Account Created! 🎉',
          text2: `Welcome aboard, ${emailAddress}!`,
        });

        console.log('🚀 Redirecting to dashboard...');
        
        // Small delay to ensure AuthContext updates
        setTimeout(() => {
          router.replace('/(tabs)');
        }, 100);
      } else {
        throw new Error(`Unexpected sign-up status: ${result.status}`);
      }
    } catch (error: any) {
      console.error('❌ Sign up error:', error);
      
      // Handle specific error codes
      const errorCode = error?.errors?.[0]?.code;
      const errorMessage = error?.errors?.[0]?.longMessage || error?.errors?.[0]?.message;
      
      let displayMessage = 'Failed to create account';
      
      if (errorCode === 'form_identifier_exists') {
        displayMessage = 'An account with this email already exists. Please sign in instead.';
      } else if (errorCode === 'form_password_pwned') {
        displayMessage = 'This password has been compromised in a data breach. Please use a different password.';
      } else if (errorCode === 'form_password_length_too_short') {
        displayMessage = 'Password is too short. Please use at least 8 characters.';
      } else if (errorMessage) {
        displayMessage = errorMessage;
      }
      
      Toast.show({
        type: 'error',
        text1: 'Sign Up Failed',
        text2: displayMessage,
        visibilityTime: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled">
        <View style={styles.hero}>
          <ExpoImage
            source={require('@/assets/images/WelcomeBackdrop.svg')}
            style={styles.heroBackground}
            contentFit="cover"
          />
          <LinearGradient
            colors={['rgba(30, 64, 175, 0.8)', 'rgba(59, 130, 246, 0.6)', 'rgba(6, 182, 212, 0.4)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroOverlay}
          />
          <View style={styles.heroContent}>
            <UserPlus size={48} color="#ffffff" />
            <Text style={styles.heroTitle}>Create Account</Text>
            <Text style={styles.heroSubtitle}>Sign up to get started</Text>
          </View>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <View style={styles.inputWrapper}>
                <Mail size={20} color="#64748b" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  placeholderTextColor="#94a3b8"
                  value={emailAddress}
                  onChangeText={setEmailAddress}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isSubmitting && !authIsLoading}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.inputWrapper}>
                <Lock size={20} color="#64748b" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor="#94a3b8"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  editable={!isSubmitting && !authIsLoading}
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.loginButton, (isSubmitting || authIsLoading) && styles.loginButtonDisabled]}
              onPress={onSignUpPress}
              disabled={isSubmitting || authIsLoading || !emailAddress.trim() || !password.trim()}>
              {(isSubmitting || authIsLoading) ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.loginButtonText}>Sign Up</Text>
              )}
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>Or</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.linkContainer}>
              <Text style={styles.linkText}>Already have an account? </Text>
              <Link href={"/sign-in" as any} asChild>
                <TouchableOpacity>
                  <Text style={styles.linkButton}>Sign in</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollContent: {
    flexGrow: 1,
  },
  hero: {
    height: 250,
    position: 'relative',
    overflow: 'hidden',
  },
  heroBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  heroContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    zIndex: 1,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 16,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#ffffff',
    opacity: 0.9,
  },
  formContainer: {
    flex: 1,
    padding: 24,
    paddingTop: 32,
  },
  form: {
    gap: 16,
  },
  inputGroup: {
    marginBottom: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: '#0f172a',
  },
  loginButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e2e8f0',
  },
  dividerText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  linkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  linkText: {
    fontSize: 14,
    color: '#64748b',
  },
  linkButton: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '600',
  },
});