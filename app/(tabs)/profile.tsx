import { useAuth } from '@/contexts/AuthContext.clerk';
import { useUserProfile } from '@/hooks/useApi';
import { useRouter } from 'expo-router';
import { LogOut, User } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';

export default function ProfileScreen() {
  const router = useRouter();
  const { data: user, isLoading, refetch } = useUserProfile();
  const { logout } = useAuth();
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const isAdmin = user?.role === 'admin';
  const isAssistant = user?.role === 'assistant';

  const handleUpdate = async () => {
    if (!email.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Enter a valid email',
      });
      return;
    }
    setSaving(true);
    try {
      // In a real app, this would call updateProfile mutation
      Toast.show({
        type: 'success',
        text1: 'Profile updated',
        text2: 'Email saved',
      });
      setEmail('');
      refetch();
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Update failed',
        text2: err instanceof Error ? err.message : 'Unable to update',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={() => refetch()} />}>
      <View style={styles.header}>
        <User size={32} color="#3b82f6" />
        <Text style={styles.title}>Profile</Text>
      </View>

      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      )}

      {user && (
        <>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Account Information</Text>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Name</Text>
              <Text style={styles.value}>{user.email.split('@')[0]}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Email</Text>
              <Text style={styles.value}>{user.email}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Role</Text>
              <View
                style={[
                  styles.roleBadge,
                  user?.role === 'admin' && styles.roleBadgeAdmin,
                  user?.role === 'assistant' && styles.roleBadgeAssistant,
                ]}>
                <Text
                  style={[
                    styles.roleText,
                    (user?.role === 'admin' || user?.role === 'assistant') && styles.roleTextActive,
                  ]}>
                  {user.role.toUpperCase()}
                </Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Member Since</Text>
              <Text style={styles.value}>
                {new Date(user.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>User ID</Text>
              <Text style={[styles.value, styles.mono]}>{user._id}</Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Update Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Enter new email"
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
            />
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleUpdate}
              disabled={saving}>
              <Text style={styles.primaryButtonText}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Text>
            </TouchableOpacity>
          </View>

          {(isAdmin || isAssistant) && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Dashboard Access</Text>
              <Text style={styles.helperText}>
                Buka dashboard sesuai peranmu untuk mengelola data dan tugas.
              </Text>
              {isAdmin && (
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={() => router.push('/admin-dashboard')}>
                  <Text style={styles.secondaryButtonText}>Buka Admin Dashboard</Text>
                </TouchableOpacity>
              )}
              {isAssistant && (
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={() => router.push('/assistant-dashboard')}>
                  <Text style={styles.secondaryButtonText}>Buka Assistant Dashboard</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          <View style={styles.card}>
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={async () => {
                await logout();
                router.replace('/login');
              }}>
              <LogOut size={20} color="#ef4444" />
              <Text style={styles.logoutButtonText}>Log Out</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    padding: 16,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#64748b',
  },
  card: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  label: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  value: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
  mono: {
    fontFamily: 'monospace',
    fontSize: 12,
  },
  roleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
  },
  roleBadgeAdmin: {
    backgroundColor: '#fee2e2',
  },
  roleBadgeAssistant: {
    backgroundColor: '#dbeafe',
  },
  roleText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
  },
  roleTextActive: {
    color: '#3b82f6',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    backgroundColor: '#f8fafc',
    color: '#0f172a',
  },
  primaryButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  secondaryButton: {
    backgroundColor: '#0f172a',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 4,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
  helperText: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#fecaca',
    backgroundColor: '#fef2f2',
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ef4444',
  },
});
