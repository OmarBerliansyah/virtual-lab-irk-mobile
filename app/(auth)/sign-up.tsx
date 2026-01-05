import { useAuth } from '@/contexts/AuthContext.clerk';
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
  const { signUp, isLoading: authIsLoading } = useAuth();
  const router = useRouter();

  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSignUpPress = async () => {
    if (!emailAddress.trim() || !password.trim()) return;

    setIsSubmitting(true);
    try {
      await signUp(emailAddress.trim(), password.trim());
      // Navigation will happen automatically via AuthContext
    } catch (error) {
      // Error is handled by Toast in AuthContext
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