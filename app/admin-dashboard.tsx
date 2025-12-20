import React, { useState } from 'react';
import { ScrollView, View, Text, TextInput, Pressable, StyleSheet, RefreshControl, ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useGetUsers, useUpdateUser, useDeleteUser } from '@/hooks/useApi';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useToast } from '@/hooks/use-toast';
import type { User } from '@/types/api';

const RoleBadge = ({ role }: { role: User['role'] }) => {
  const style = [styles.badge];
  if (role === 'admin') style.push(styles.badgeAdmin);
  else if (role === 'assistant') style.push(styles.badgeAssistant);
  return <Text style={style}>{role}</Text>;
};

export default function AdminDashboardScreen() {
  const colorScheme = useColorScheme();
  const { isAdmin } = useUserProfile();
  const { data: users, isLoading, isFetching, error, refetch } = useGetUsers();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();
  const { toast } = useToast();
  const [editing, setEditing] = useState<Record<string, { email: string; role: User['role'] }>>({});

  if (!isAdmin) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ title: 'Admin Dashboard' }} />
        <Text style={styles.helper}>Admin dashboard is available for admins.</Text>
      </View>
    );
  }

  const handleSave = (user: User) => {
    const pending = editing[user._id] || { email: user.email, role: user.role };
    updateUser.mutate(
      { id: user._id, data: { email: pending.email, role: pending.role } },
      {
        onSuccess: () => {
          toast({ title: 'User updated' });
          setEditing(prev => ({ ...prev, [user._id]: { email: pending.email, role: pending.role } }));
        },
        onError: (err: Error) => toast({ title: 'Update failed', description: err.message, type: 'error' }),
      },
    );
  };

  const handleDelete = (id: string) => {
    deleteUser.mutate(id, {
      onSuccess: () => toast({ title: 'User deleted' }),
      onError: (err: Error) => toast({ title: 'Delete failed', description: err.message, type: 'error' }),
    });
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} />}
    >
      <Stack.Screen options={{ title: 'Admin Dashboard' }} />
      <Text style={styles.title}>User Management</Text>
      <Text style={styles.helper}>Update roles and email, or remove users.</Text>

      {isLoading ? (
        <View style={styles.rowBetween}>
          <ActivityIndicator color="#2563eb" />
          <Text style={styles.helper}>Loading users...</Text>
        </View>
      ) : null}
      {error && <Text style={[styles.helper, styles.error]}>Failed to load users. Pull to retry.</Text>}

      {(users || []).map(user => {
        const pending = editing[user._id] || { email: user.email, role: user.role };
        return (
          <View key={user._id} style={styles.card}>
            <View style={styles.rowBetween}>
              <Text style={styles.cardTitle}>{user.email}</Text>
              <RoleBadge role={pending.role} />
            </View>
            <Text style={[styles.helper, styles.mono]}>Clerk: {user.clerkId}</Text>
            <View style={styles.rowBetween}>
              <TextInput
                style={[styles.input, styles.half]}
                value={pending.email}
                onChangeText={v => setEditing(prev => ({ ...prev, [user._id]: { ...pending, email: v } }))}
                placeholder="Email"
                keyboardType="email-address"
              />
              <TextInput
                style={[styles.input, styles.half]}
                value={pending.role}
                onChangeText={v => setEditing(prev => ({ ...prev, [user._id]: { ...pending, role: v as User['role'] } }))}
                placeholder="Role (user/assistant/admin)"
              />
            </View>
            <View style={styles.rowBetween}>
              <Pressable style={styles.primaryButton} onPress={() => handleSave(user)}>
                <Text style={styles.primaryText}>Save</Text>
              </Pressable>
              <Pressable style={[styles.secondaryButton, styles.dangerButton]} onPress={() => handleDelete(user._id)}>
                <Text style={[styles.secondaryText, styles.dangerText]}>Delete</Text>
              </Pressable>
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 12 },
  title: { fontSize: 24, fontWeight: '700' },
  helper: { color: '#6b7280', fontSize: 13 },
  error: { color: '#dc2626' },
  card: { backgroundColor: '#fff', padding: 14, borderRadius: 12, gap: 10, shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 4 }, shadowRadius: 8, elevation: 2 },
  cardTitle: { fontSize: 16, fontWeight: '700' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  input: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, padding: 10, backgroundColor: '#f9fafb', fontSize: 14 },
  half: { flex: 1 },
  primaryButton: { flex: 1, backgroundColor: '#2563eb', padding: 12, borderRadius: 10, alignItems: 'center' },
  primaryText: { color: '#fff', fontWeight: '700' },
  secondaryButton: { padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#f8fafc' },
  secondaryText: { fontWeight: '600' },
  dangerButton: { borderColor: '#fecdd3', backgroundColor: '#fff1f2' },
  dangerText: { color: '#dc2626' },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, fontWeight: '700', textTransform: 'capitalize', backgroundColor: '#f3f4f6', color: '#374151' },
  badgeAdmin: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, fontWeight: '700', textTransform: 'capitalize', backgroundColor: '#fee2e2', color: '#b91c1c' },
  badgeAssistant: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, fontWeight: '700', textTransform: 'capitalize', backgroundColor: '#e0f2fe', color: '#075985' },
  mono: { fontFamily: 'monospace' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
});
