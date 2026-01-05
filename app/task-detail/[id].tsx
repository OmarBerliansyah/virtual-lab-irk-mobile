import { useAuth } from '@/contexts/AuthContext.clerk';
import { useTasks, useUpdateTask } from '@/hooks/useApi';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Calendar, CheckCircle, ClipboardList, Clock, User } from 'lucide-react-native';
import React, { useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Toast from 'react-native-toast-message';

export default function TaskDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  // Get all tasks (not filtered) to find the specific task
  const { data: allTasks } = useTasks();
  const updateTask = useUpdateTask();

  const task = allTasks?.find(t => t._id === id);
  const isAssistant = user?.role === 'assistant' || user?.role === 'admin';
  const canViewTask = task && (isAssistant || task.assignee === user?.email);

  const [updatingStatus, setUpdatingStatus] = useState(false);

  if (!task || !canViewTask) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color="#0f172a" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Task Not Found</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Task not found or you don't have access to it.</Text>
          <TouchableOpacity style={styles.backToDashboardButton} onPress={() => router.push('/(tabs)')}>
            <Text style={styles.backToDashboardText}>Go to Dashboard</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return '#ef4444';
      case 'medium':
        return '#f59e0b';
      case 'low':
        return '#10b981';
      default:
        return '#64748b';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'To Do':
        return '#64748b';
      case 'In Progress':
        return '#3b82f6';
      case 'Done':
        return '#22c55e';
      default:
        return '#64748b';
    }
  };

  const handleStatusChange = (newStatus: 'To Do' | 'In Progress' | 'Done') => {
    if (task.status === newStatus) return;

    setUpdatingStatus(true);
    updateTask.mutate(
      { id: task._id, task: { status: newStatus } },
      {
        onSuccess: () => {
          Toast.show({
            type: 'success',
            text1: 'Status Updated',
            text2: `Task status changed to ${newStatus}`,
          });
          setUpdatingStatus(false);
        },
        onError: (err: Error) => {
          Toast.show({
            type: 'error',
            text1: 'Update Failed',
            text2: err.message,
          });
          setUpdatingStatus(false);
        },
      },
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Task Details</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>
        {/* Task Header */}
        <View style={styles.taskHeader}>
          <View style={[styles.priorityBadge, { backgroundColor: `${getPriorityColor(task.priority)}20` }]}>
            <ClipboardList size={24} color={getPriorityColor(task.priority)} />
          </View>
          <View style={styles.taskHeaderContent}>
            <Text style={styles.taskTitle}>{task.title}</Text>
            <View style={styles.badgeRow}>
              <View style={[styles.badge, { backgroundColor: `${getPriorityColor(task.priority)}20` }]}>
                <Text style={[styles.badgeText, { color: getPriorityColor(task.priority) }]}>
                  {task.priority.toUpperCase()}
                </Text>
              </View>
              <View style={[styles.badge, { backgroundColor: `${getStatusColor(task.status)}20` }]}>
                <Text style={[styles.badgeText, { color: getStatusColor(task.status) }]}>
                  {task.status}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.descriptionText}>
            {task.description || 'No description provided.'}
          </Text>
        </View>

        {/* Task Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Task Information</Text>
          <View style={styles.infoList}>
            {task.dueDate && (
              <View style={styles.infoItem}>
                <View style={styles.infoIcon}>
                  <Calendar size={20} color="#3b82f6" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Due Date</Text>
                  <Text style={styles.infoValue}>
                    {new Date(task.dueDate).toLocaleDateString('id-ID', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </Text>
                  <Text style={styles.infoSubtext}>
                    {new Date(task.dueDate).getTime() > Date.now()
                      ? `${Math.ceil((new Date(task.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days remaining`
                      : 'Overdue'}
                  </Text>
                </View>
              </View>
            )}
            {task.assignee && (
              <View style={styles.infoItem}>
                <View style={styles.infoIcon}>
                  <User size={20} color="#3b82f6" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Assigned To</Text>
                  <Text style={styles.infoValue}>{task.assignee}</Text>
                </View>
              </View>
            )}
            <View style={styles.infoItem}>
              <View style={styles.infoIcon}>
                <Clock size={20} color="#3b82f6" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Created</Text>
                <Text style={styles.infoValue}>
                  {new Date(task.createdAt).toLocaleDateString('id-ID', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Tags */}
        {task.tags && task.tags.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tags</Text>
            <View style={styles.tagsContainer}>
              {task.tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Status Update (for students) */}
        {user?.role === 'user' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Update Status</Text>
            <View style={styles.statusButtons}>
              {(['To Do', 'In Progress', 'Done'] as const).map((status) => (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.statusButton,
                    task.status === status && styles.statusButtonActive,
                    updatingStatus && styles.statusButtonDisabled,
                  ]}
                  onPress={() => handleStatusChange(status)}
                  disabled={updatingStatus || task.status === status}>
                  {task.status === status && <CheckCircle size={16} color="#ffffff" />}
                  <Text
                    style={[
                      styles.statusButtonText,
                      task.status === status && styles.statusButtonTextActive,
                    ]}>
                    {status}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
    flex: 1,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    padding: 16,
    gap: 24,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
  },
  backToDashboardButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#3b82f6',
  },
  backToDashboardText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  priorityBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskHeaderContent: {
    flex: 1,
    gap: 8,
  },
  taskTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  descriptionText: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 22,
  },
  infoList: {
    gap: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f9ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContent: {
    flex: 1,
    gap: 4,
  },
  infoLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#0f172a',
    fontWeight: '600',
  },
  infoSubtext: {
    fontSize: 12,
    color: '#ef4444',
    fontWeight: '500',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
  },
  tagText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  statusButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  statusButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  statusButtonActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  statusButtonDisabled: {
    opacity: 0.5,
  },
  statusButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  statusButtonTextActive: {
    color: '#ffffff',
  },
});

