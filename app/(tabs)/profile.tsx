import React, { useState } from 'react';
import { ScrollView, View, Text, TextInput, Pressable, StyleSheet, RefreshControl, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useToast } from '@/hooks/use-toast';

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const { user, loading, error, fetchProfile, updateProfile, isAdmin, isAssistant } = useUserProfile();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);

  const handleUpdate = async () => {
    if (!email.trim()) {
      toast({ title: 'Error', description: 'Enter a valid email', type: 'error' });
      return;
    }
    setSaving(true);
    try {
      await updateProfile({ email });
      toast({ title: 'Profile updated', description: 'Email saved' });
      setEmail('');
    } catch (err) {
      toast({ title: 'Update failed', description: err instanceof Error ? err.message : 'Unable to update', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchProfile} />}
    >
      <Text style={styles.title}>Profile</Text>

      {loading && (
        <View style={styles.rowCenter}>
          <ActivityIndicator color="#2563eb" />
          <Text style={styles.helper}> Loading profile...</Text>
        </View>
      )}
      {error && (
        <View style={styles.card}>
          <Text style={[styles.helper, styles.error]}>Failed to load profile</Text>
          <Pressable style={styles.secondaryButton} onPress={fetchProfile}>
            <Text style={styles.secondaryText}>Retry</Text>
          </Pressable>
        </View>
      )}

      {user && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Account</Text>
          <View style={styles.rowBetween}><Text style={styles.label}>Email</Text><Text style={styles.value}>{user.email}</Text></View>
          <View style={styles.rowBetween}><Text style={styles.label}>Role</Text><Text style={styles.badge}>{user.role}</Text></View>
          <View style={styles.rowBetween}><Text style={styles.label}>Member Since</Text><Text style={styles.value}>{new Date(user.createdAt).toLocaleDateString()}</Text></View>
          <View style={styles.rowBetween}><Text style={styles.label}>User ID</Text><Text style={[styles.value, styles.mono]}>{user.id}</Text></View>
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Update Email</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Enter new email"
          keyboardType="email-address"
          style={styles.input}
        />
        <Pressable style={styles.primaryButton} onPress={handleUpdate} disabled={saving}>
          <Text style={styles.primaryText}>{saving ? 'Saving...' : 'Save'}</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Shortcuts</Text>
        {isAssistant || isAdmin ? (
          <Pressable style={styles.secondaryButton} onPress={() => router.push('/assistant-dashboard' as any)}><Text style={styles.secondaryText}>Open Assistant Dashboard</Text></Pressable>
        ) : (
          <Text style={styles.helper}>Assistant dashboard available for assistants/admins.</Text>
        )}
        {isAdmin ? (
          <Pressable style={styles.secondaryButton} onPress={() => router.push('/admin-dashboard' as any)}><Text style={styles.secondaryText}>Open Admin Dashboard</Text></Pressable>
        ) : (
          <Text style={styles.helper}>Admin dashboard available for admins.</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 16 },
  title: { fontSize: 26, fontWeight: '700' },
  rowCenter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 12, gap: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 4 }, shadowRadius: 8, elevation: 2 },
  cardTitle: { fontSize: 18, fontWeight: '700' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { color: '#6b7280', fontSize: 14 },
  value: { fontSize: 14, fontWeight: '600' },
  mono: { fontFamily: 'monospace' },
  badge: { backgroundColor: '#eef2ff', color: '#4338ca', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, fontWeight: '700' },
  helper: { color: '#6b7280', fontSize: 13 },
  error: { color: '#dc2626' },
  input: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, padding: 12, backgroundColor: '#f9fafb' },
  primaryButton: { marginTop: 8, backgroundColor: '#2563eb', padding: 12, borderRadius: 10, alignItems: 'center' },
  primaryText: { color: '#fff', fontWeight: '700' },
  secondaryButton: { borderWidth: 1, borderColor: '#e5e7eb', padding: 12, borderRadius: 10, backgroundColor: '#f8fafc', marginTop: 8 },
  secondaryText: { fontWeight: '600', textAlign: 'center' },
});
