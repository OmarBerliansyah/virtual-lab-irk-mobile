import { useGetUsers, useTasks } from '@/hooks/useApi';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, CheckCircle, ClipboardList, Clock, User } from 'lucide-react-native';
import React from 'react';
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function TaskManagementDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: allTasks, isLoading } = useTasks(undefined, false); // Get student tasks
  const { data: users } = useGetUsers();

  const task = allTasks?.find(t => t._id === id && !t.isAssistantTask);
  const students = users?.filter(u => u.role === 'user') || [];

  const assignedCount = task?.assignedTo?.length || 0;
  const completedCount = task?.completedBy?.length || 0;
  const completionPercentage = assignedCount > 0 ? Math.round((completedCount / assignedCount) * 100) : 0;

  const completedStudents = students.filter(s => task?.completedBy?.includes(s.email));
  const pendingStudents = students.filter(s => 
    task?.assignedTo?.includes(s.email) && !task?.completedBy?.includes(s.email)
  );

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#64748b';
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading task details...</Text>
      </View>
    );
  }

  if (!task) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color="#3b82f6" />
          </TouchableOpacity>
          <Text style={styles.title}>Task Details</Text>
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Task not found</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#3b82f6" />
        </TouchableOpacity>
        <Text style={styles.title}>Task Management</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.taskHeader}>
          <View style={[styles.priorityBadge, { backgroundColor: `${getPriorityColor(task.priority)}20` }]}>
            <Text style={[styles.priorityText, { color: getPriorityColor(task.priority) }]}>
              {task.priority.toUpperCase()}
            </Text>
          </View>
          <Text style={styles.taskTitle}>{task.title}</Text>
        </View>

        {task.description && (
          <Text style={styles.taskDescription}>{task.description}</Text>
        )}

        {task.dueDate && (
          <View style={styles.infoRow}>
            <Clock size={18} color="#64748b" />
            <Text style={styles.infoLabel}>Due Date:</Text>
            <Text style={styles.infoValue}>
              {new Date(task.dueDate).toLocaleDateString('id-ID', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
          </View>
        )}

        <View style={styles.infoRow}>
          <ClipboardList size={18} color="#64748b" />
          <Text style={styles.infoLabel}>Assigned To:</Text>
          <Text style={styles.infoValue}>{assignedCount} students</Text>
        </View>
      </View>

      {/* Completion Percentage */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Completion Status</Text>
        <View style={styles.completionContainer}>
          <View style={styles.completionBar}>
            <View style={styles.completionBarBackground}>
              <View style={[styles.completionBarFill, { width: `${completionPercentage}%`, backgroundColor: getPriorityColor(task.priority) }]} />
            </View>
            <Text style={styles.completionPercentage}>{completionPercentage}%</Text>
          </View>
          <Text style={styles.completionText}>
            {completedCount} of {assignedCount} students completed
          </Text>
        </View>
      </View>

      {/* Completed Students */}
      {completedStudents.length > 0 && (
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <CheckCircle size={20} color="#22c55e" />
            <Text style={styles.cardTitle}>Completed ({completedStudents.length})</Text>
          </View>
          <View style={styles.studentsList}>
            {completedStudents.map(student => (
              <View key={student._id} style={styles.studentItem}>
                <View style={styles.studentAvatar}>
                  <User size={16} color="#22c55e" />
                </View>
                <Text style={styles.studentEmail}>{student.email}</Text>
                <View style={styles.completedBadge}>
                  <CheckCircle size={14} color="#22c55e" />
                  <Text style={styles.completedBadgeText}>Done</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Pending Students */}
      {pendingStudents.length > 0 && (
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Clock size={20} color="#f59e0b" />
            <Text style={styles.cardTitle}>Pending ({pendingStudents.length})</Text>
          </View>
          <View style={styles.studentsList}>
            {pendingStudents.map(student => (
              <View key={student._id} style={styles.studentItem}>
                <View style={[styles.studentAvatar, styles.studentAvatarPending]}>
                  <User size={16} color="#f59e0b" />
                </View>
                <Text style={styles.studentEmail}>{student.email}</Text>
                <View style={styles.pendingBadge}>
                  <Text style={styles.pendingBadgeText}>In Progress</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
    paddingTop: 60,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748b',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 16,
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
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  priorityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '700',
  },
  taskTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0f172a',
    flex: 1,
  },
  taskDescription: {
    fontSize: 16,
    color: '#334155',
    lineHeight: 24,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  infoValue: {
    fontSize: 14,
    color: '#0f172a',
    flex: 1,
    textAlign: 'right',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  completionContainer: {
    gap: 12,
  },
  completionBar: {
    gap: 8,
  },
  completionBarBackground: {
    height: 24,
    backgroundColor: '#e2e8f0',
    borderRadius: 12,
    overflow: 'hidden',
  },
  completionBarFill: {
    height: '100%',
    borderRadius: 12,
  },
  completionPercentage: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
    textAlign: 'center',
  },
  completionText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
  studentsList: {
    gap: 12,
  },
  studentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  studentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  studentAvatarPending: {
    backgroundColor: '#fef3c7',
  },
  studentEmail: {
    flex: 1,
    fontSize: 14,
    color: '#0f172a',
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#dcfce7',
  },
  completedBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#16a34a',
  },
  pendingBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#fef3c7',
  },
  pendingBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#d97706',
  },
});

