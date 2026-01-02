import { mockUsers, useAuth } from '@/contexts/AuthContext';
import { Image as ExpoImage } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Lock, LogIn, Mail, User } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function LoginScreen() {
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      return;
    }
    try {
      await login(email.trim(), password);
    } catch (error) {
      // Error is handled by Toast in AuthContext
    }
  };

  const quickLogin = (userEmail: string) => {
    setEmail(userEmail);
    setPassword('password123'); // Mock password
    login(userEmail, 'password123');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled">
        {/* Background with Logo */}
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

        {/* Login Form */}
        <View style={styles.formContainer}>
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <View style={styles.inputWrapper}>
                <Mail size={20} color="#64748b" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  placeholderTextColor="#94a3b8"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
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
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={isLoading || !email.trim() || !password.trim()}>
              <Text style={styles.loginButtonText}>
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Text>
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>Or login with test accounts</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Quick Login Buttons */}
            <View style={styles.quickLoginContainer}>
              {mockUsers.map((user) => (
                <TouchableOpacity
                  key={user._id}
                  style={[
                    styles.quickLoginButton,
                    user.role === 'admin' && styles.quickLoginButtonAdmin,
                    user.role === 'assistant' && styles.quickLoginButtonAssistant,
                  ]}
                  onPress={() => quickLogin(user.email)}
                  disabled={isLoading}>
                  <User size={20} color={user.role === 'admin' ? '#ffffff' : user.role === 'assistant' ? '#ffffff' : '#3b82f6'} />
                  <View style={styles.quickLoginInfo}>
                    <Text
                      style={[
                        styles.quickLoginEmail,
                        (user.role === 'admin' || user.role === 'assistant') && styles.quickLoginEmailWhite,
                      ]}>
                      {user.email}
                    </Text>
                    <Text
                      style={[
                        styles.quickLoginRole,
                        (user.role === 'admin' || user.role === 'assistant') && styles.quickLoginRoleWhite,
                      ]}>
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                <Text style={styles.infoBold}>Note:</Text> All test accounts use password:{' '}
                <Text style={styles.infoPassword}>password123</Text>
              </Text>
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
  quickLoginContainer: {
    gap: 12,
  },
  quickLoginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    gap: 12,
  },
  quickLoginButtonAssistant: {
    borderColor: '#3b82f6',
    backgroundColor: '#3b82f6',
  },
  quickLoginButtonAdmin: {
    borderColor: '#ef4444',
    backgroundColor: '#ef4444',
  },
  quickLoginInfo: {
    flex: 1,
  },
  quickLoginEmail: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 2,
  },
  quickLoginEmailWhite: {
    color: '#ffffff',
  },
  quickLoginRole: {
    fontSize: 12,
    color: '#64748b',
  },
  quickLoginRoleWhite: {
    color: '#ffffff',
    opacity: 0.9,
  },
  infoBox: {
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  infoText: {
    fontSize: 12,
    color: '#0f172a',
    textAlign: 'center',
  },
  infoBold: {
    fontWeight: '700',
  },
  infoPassword: {
    fontFamily: 'monospace',
    fontWeight: '600',
    color: '#3b82f6',
  },
});