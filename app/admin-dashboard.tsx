import { useAuth } from '@/contexts/AuthContext.clerk';
import { useDeleteUser, useGetUsers, useUpdateUser } from '@/hooks/useApi';
import type { User } from '@/types/api';
import { Stack, useRouter } from 'expo-router';
import { AlertCircle, Save, Shield, Trash2, User as UserIcon } from 'lucide-react-native';
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

const RoleBadge = ({ role }: { role: User['role'] }) => {
  const getRoleStyle = () => {
    switch (role) {
      case 'ADMIN':
        return { backgroundColor: '#fee2e2', color: '#dc2626' };
      case 'ASSISTANT':
        return { backgroundColor: '#dbeafe', color: '#2563eb' };
      default:
        return { backgroundColor: '#f1f5f9', color: '#64748b' };
    }
  };

  const style = getRoleStyle();

  return (
    <View style={[styles.roleBadge, { backgroundColor: style.backgroundColor }]}>
      <Text style={[styles.roleBadgeText, { color: style.color }]}>
        {role.toUpperCase()}
      </Text>
    </View>
  );
};

export default function AdminDashboardScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { data: users, isLoading, isFetching, error, refetch } = useGetUsers();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();

  const isAdmin = user?.role === 'admin';
  const [editing, setEditing] = useState<Record<string, { email: string; role: User['role'] }>>({});

  if (!isAdmin) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ title: 'Admin Dashboard' }} />
        <AlertCircle size={48} color="#64748b" />
        <Text style={styles.helper}>Admin dashboard is available for admins only.</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleSave = (user: User) => {
    const pending = editing[user._id] || { email: user.email, role: user.role };
    updateUser.mutate(
      { id: user._id, data: { email: pending.email, role: pending.role } },
      {
        onSuccess: () => {
          Toast.show({
            type: 'success',
            text1: 'User Updated',
            text2: 'User information has been updated',
          });
          setEditing(prev => {
            const newState = { ...prev };
            delete newState[user._id];
            return newState;
          });
        },
        onError: (err: Error) => {
          Toast.show({
            type: 'error',
            text1: 'Update Failed',
            text2: err.message,
          });
        },
      },
    );
  };

  const handleDelete = (id: string, email: string) => {
    if (id === user?._id) {
      Toast.show({
        type: 'error',
        text1: 'Cannot Delete',
        text2: 'You cannot delete your own account',
      });
      return;
    }

    deleteUser.mutate(id, {
      onSuccess: () => {
        Toast.show({
          type: 'success',
          text1: 'User Deleted',
          text2: `${email} has been removed`,
        });
      },
      onError: (err: Error) => {
        Toast.show({
          type: 'error',
          text1: 'Delete Failed',
          text2: err.message,
        });
      },
    });
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} />}>
      <Stack.Screen options={{ title: 'Admin Dashboard', headerShown: true }} />

      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Shield size={32} color="#3b82f6" />
        </View>
        <Text style={styles.title}>User Management</Text>
        <Text style={styles.subtitle}>Manage user roles and accounts</Text>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.helper}>Loading users...</Text>
        </View>
      ) : null}
      {error && (
        <View style={styles.errorContainer}>
          <AlertCircle size={20} color="#ef4444" />
          <Text style={styles.errorText}>Failed to load users. Pull to retry.</Text>
        </View>
      )}

      {users && users.length === 0 && (
        <View style={styles.emptyContainer}>
          <UserIcon size={48} color="#94a3b8" />
          <Text style={styles.emptyText}>No users found</Text>
        </View>
      )}

      {(users || []).map(userItem => {
        const pending = editing[userItem._id] || { email: userItem.email, role: userItem.role };
        const isEditing = !!editing[userItem._id];
        const isCurrentUser = userItem._id === user?._id;

        return (
          <View key={userItem._id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.userInfo}>
                <View style={styles.userHeader}>
                  <Text style={styles.userEmail}>{userItem.email}</Text>
                  <RoleBadge role={pending.role} />
                </View>
                <Text style={styles.userId}>ID: {userItem._id}</Text>
                <Text style={styles.userClerkId}>Clerk: {userItem.clerkId}</Text>
              </View>
            </View>

            <View style={styles.formSection}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  value={pending.email}
                  onChangeText={v =>
                    setEditing(prev => ({
                      ...prev,
                      [userItem._id]: { ...pending, email: v },
                    }))
                  }
                  placeholder="Email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!isCurrentUser}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Role</Text>
                <TextInput
                  style={styles.input}
                  value={pending.role}
                  onChangeText={v =>
                    setEditing(prev => ({
                      ...prev,
                      [userItem._id]: { ...pending, role: v as User['role'] },
                    }))
                  }
                  placeholder="user/assistant/admin"
                  autoCapitalize="none"
                  editable={!isCurrentUser}
                />
              </View>
            </View>

            <View style={styles.actions}>
              <TouchableOpacity
                style={[
                  styles.saveButton,
                  !isEditing && styles.saveButtonDisabled,
                  isCurrentUser && styles.saveButtonDisabled,
                ]}
                onPress={() => handleSave(userItem)}
                disabled={!isEditing || isCurrentUser || updateUser.isPending}>
                <Save size={18} color="#ffffff" />
                <Text style={styles.saveButtonText}>
                  {updateUser.isPending ? 'Saving...' : 'Save Changes'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.deleteButton,
                  isCurrentUser && styles.deleteButtonDisabled,
                ]}
                onPress={() => handleDelete(userItem._id, userItem.email)}
                disabled={isCurrentUser || deleteUser.isPending}>
                <Trash2 size={18} color={isCurrentUser ? '#94a3b8' : '#ef4444'} />
                <Text
                  style={[
                    styles.deleteButtonText,
                    isCurrentUser && styles.deleteButtonTextDisabled,
                  ]}>
                  {deleteUser.isPending ? 'Deleting...' : 'Delete'}
                </Text>
              </TouchableOpacity>
            </View>

            {isCurrentUser && (
              <View style={styles.currentUserBadge}>
                <Text style={styles.currentUserText}>This is your account</Text>
              </View>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    padding: 16,
    gap: 16,
    paddingBottom: 32,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 8,
    paddingVertical: 16,
  },
  headerIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
  },
  helper: {
    color: '#64748b',
    fontSize: 14,
    textAlign: 'center',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#fee2e2',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 24,
    gap: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 32,
    gap: 12,
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 16,
    gap: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardHeader: {
    marginBottom: 8,
  },
  userInfo: {
    gap: 8,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  userEmail: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    flex: 1,
  },
  userId: {
    fontSize: 12,
    color: '#94a3b8',
    fontFamily: 'monospace',
  },
  userClerkId: {
    fontSize: 12,
    color: '#94a3b8',
    fontFamily: 'monospace',
  },
  roleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  formSection: {
    gap: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#f8fafc',
    fontSize: 14,
    color: '#0f172a',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#3b82f6',
    padding: 14,
    borderRadius: 12,
  },
  saveButtonDisabled: {
    backgroundColor: '#cbd5e1',
  },
  saveButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
    backgroundColor: '#fef2f2',
    minWidth: 100,
  },
  deleteButtonDisabled: {
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  deleteButtonText: {
    color: '#ef4444',
    fontWeight: '700',
    fontSize: 14,
  },
  deleteButtonTextDisabled: {
    color: '#94a3b8',
  },
  currentUserBadge: {
    padding: 8,
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  currentUserText: {
    fontSize: 12,
    color: '#92400e',
    textAlign: 'center',
    fontWeight: '600',
  },
  backButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#3b82f6',
  },
  backButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
});
