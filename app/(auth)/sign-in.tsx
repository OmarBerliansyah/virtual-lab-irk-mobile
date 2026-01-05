import { useAuth } from '@/contexts/AuthContext.clerk';
import { useSignIn, useOAuth } from '@clerk/clerk-expo';
import Toast from 'react-native-toast-message';
import * as WebBrowser from 'expo-web-browser';
import { Image as ExpoImage } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from 'expo-router';
import { Lock, LogIn, Mail } from 'lucide-react-native';
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

// Warm up web browser for OAuth
WebBrowser.maybeCompleteAuthSession();

export default function SignInScreen() {
  const { isLoading: authIsLoading } = useAuth();
  const { signIn, setActive } = useSignIn();
  const { startOAuthFlow: startGoogleOAuth } = useOAuth({ strategy: 'oauth_google' });
  const router = useRouter();

  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [show2FA, setShow2FA] = useState(false);
  const [code2FA, setCode2FA] = useState('');

  const onSignInPress = async () => {
    if (!emailAddress.trim() || !password.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please enter both email and password',
      });
      return;
    }

    console.log('🔐 Attempting login for:', emailAddress.trim());
    setIsSubmitting(true);
    
    try {
      if (!signIn) {
        throw new Error('Clerk signIn not initialized');
      }

      // Use Clerk's signIn method
      const result = await signIn.create({
        identifier: emailAddress.trim(),
        password: password.trim(),
      });

      console.log('✅ Clerk sign-in result:', result.status);

      // Handle 2FA requirement
      if (result.status === 'needs_second_factor') {
        console.log('🔐 2FA required, showing 2FA form');
        setShow2FA(true);
        Toast.show({
          type: 'info',
          text1: '2FA Required',
          text2: 'Please enter your 2FA code from your authenticator app',
        });
        return;
      }

      // Set the active session
      if (result.status === 'complete') {
        await setActive?.({ session: result.createdSessionId });
        
        Toast.show({
          type: 'success',
          text1: 'Login Successful! 🎉',
          text2: `Welcome, ${emailAddress}!`,
        });

        console.log('🚀 Redirecting to dashboard...');
        
        // Small delay to ensure AuthContext updates
        setTimeout(() => {
          router.replace('/(tabs)');
        }, 100);
      } else {
        throw new Error(`Unexpected sign-in status: ${result.status}`);
      }
    } catch (error: any) {
      console.error('❌ Login error:', error);
      
      // Handle specific error codes
      const errorCode = error?.errors?.[0]?.code;
      const errorMessage = error?.errors?.[0]?.longMessage || error?.errors?.[0]?.message;
      
      let displayMessage = 'Invalid email or password';
      
      if (errorCode === 'strategy_for_user_invalid') {
        displayMessage = 'This account uses a different sign-in method (e.g., Google, GitHub). Please use that method instead.';
      } else if (errorCode === 'form_identifier_not_found') {
        displayMessage = 'No account found with this email. Please sign up first.';
      } else if (errorCode === 'form_password_incorrect') {
        displayMessage = 'Incorrect password. Please try again.';
      } else if (errorMessage) {
        displayMessage = errorMessage;
      }
      
      Toast.show({
        type: 'error',
        text1: 'Login Failed',
        text2: displayMessage,
        visibilityTime: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    console.log('🔵 Starting Google OAuth...');
    setIsSubmitting(true);

    try {
      const { createdSessionId, setActive: setOAuthActive } = await startGoogleOAuth();

      if (createdSessionId) {
        await setOAuthActive?.({ session: createdSessionId });
        
        Toast.show({
          type: 'success',
          text1: 'Login Successful! 🎉',
          text2: 'Welcome to Virtual Lab IRK!',
        });

        console.log('🚀 OAuth successful, redirecting...');
        
        setTimeout(() => {
          router.replace('/(tabs)');
        }, 100);
      }
    } catch (error: any) {
      console.error('❌ Google OAuth error:', error);
      
      Toast.show({
        type: 'error',
        text1: 'Google Sign-In Failed',
        text2: error?.message || 'Could not complete Google sign-in',
        visibilityTime: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handle2FASubmit = async () => {
    if (!code2FA.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please enter your 2FA code',
      });
      return;
    }

    console.log('🔐 Attempting 2FA verification...');
    setIsSubmitting(true);

    try {
      if (!signIn) {
        throw new Error('Clerk signIn not initialized');
      }

      // Attempt second factor
      const result = await signIn.attemptSecondFactor({
        strategy: 'totp',
        code: code2FA.trim(),
      });

      console.log('✅ 2FA verification result:', result.status);

      if (result.status === 'complete') {
        await setActive?.({ session: result.createdSessionId });
        
        Toast.show({
          type: 'success',
          text1: 'Login Successful! 🎉',
          text2: `Welcome, ${emailAddress}!`,
        });

        console.log('🚀 Redirecting to dashboard...');
        
        setTimeout(() => {
          router.replace('/(tabs)');
        }, 100);
      } else {
        throw new Error(`Unexpected 2FA status: ${result.status}`);
      }
    } catch (error: any) {
      console.error('❌ 2FA verification error:', error);
      
      const errorMessage = error?.errors?.[0]?.longMessage || error?.errors?.[0]?.message;
      
      Toast.show({
        type: 'error',
        text1: '2FA Verification Failed',
        text2: errorMessage || 'Invalid 2FA code. Please try again.',
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
            <LogIn size={48} color="#ffffff" />
            <Text style={styles.heroTitle}>Welcome Back</Text>
            <Text style={styles.heroSubtitle}>Sign in to continue</Text>
          </View>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.form}>
            {!show2FA ? (
              <>
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
                  onPress={onSignInPress}
                  disabled={isSubmitting || authIsLoading || !emailAddress.trim() || !password.trim()}>
                  {(isSubmitting || authIsLoading) ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <Text style={styles.loginButtonText}>Sign In</Text>
                  )}
                </TouchableOpacity>

                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>Or continue with</Text>
                  <View style={styles.dividerLine} />
                </View>

                <TouchableOpacity
                  style={styles.googleButton}
                  onPress={handleGoogleSignIn}
                  disabled={isSubmitting || authIsLoading}>
                  {(isSubmitting || authIsLoading) ? (
                    <ActivityIndicator color="#0f172a" />
                  ) : (
                    <>
                      <Text style={styles.googleIcon}>G</Text>
                      <Text style={styles.googleButtonText}>Continue with Google</Text>
                    </>
                  )}
                </TouchableOpacity>

                <View style={styles.linkContainer}>
                  <Text style={styles.linkText}>Don't have an account? </Text>
                  <Link href={"/sign-up" as any} asChild>
                    <TouchableOpacity>
                      <Text style={styles.linkButton}>Sign up</Text>
                    </TouchableOpacity>
                  </Link>
                </View>
              </>
            ) : (
              <>
                <View style={styles.twoFactorHeader}>
                  <Text style={styles.twoFactorTitle}>Two-Factor Authentication</Text>
                  <Text style={styles.twoFactorSubtitle}>
                    Enter the 6-digit code from your authenticator app
                  </Text>
                </View>

                <View style={styles.inputGroup}>
                  <View style={styles.inputWrapper}>
                    <Lock size={20} color="#64748b" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="000000"
                      placeholderTextColor="#94a3b8"
                      value={code2FA}
                      onChangeText={setCode2FA}
                      keyboardType="number-pad"
                      maxLength={6}
                      autoFocus
                      editable={!isSubmitting && !authIsLoading}
                    />
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.loginButton, (isSubmitting || authIsLoading) && styles.loginButtonDisabled]}
                  onPress={handle2FASubmit}
                  disabled={isSubmitting || authIsLoading || code2FA.trim().length < 6}>
                  {(isSubmitting || authIsLoading) ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <Text style={styles.loginButtonText}>Verify Code</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => {
                    setShow2FA(false);
                    setCode2FA('');
                  }}
                  disabled={isSubmitting || authIsLoading}>
                  <Text style={styles.backButtonText}>← Back to Login</Text>
                </TouchableOpacity>
              </>
            )}
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
  twoFactorHeader: {
    marginBottom: 24,
  },
  twoFactorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 8,
    textAlign: 'center',
  },
  twoFactorSubtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
  },
  backButton: {
    marginTop: 16,
    padding: 12,
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '600',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  googleIcon: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4285f4',
  },
  googleButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
  },
});