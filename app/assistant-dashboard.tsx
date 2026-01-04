import { useAuth } from '@/contexts/AuthContext';
import { useCreateTask, useDeleteTask, useGetUsers, useTasks, useUpdateTask } from '@/hooks/useApi';
import type { Task } from '@/types/api';
import { Stack, useRouter } from 'expo-router';
import { AlertCircle, ChevronDown, Edit, Plus, Trash2, User, X } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
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

export default function AssistantDashboardScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { data: tasks, isLoading, isFetching, error, refetch } = useTasks();
  const { data: users } = useGetUsers();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  const isAssistant = user?.role === 'assistant' || user?.role === 'admin';

  const [draft, setDraft] = useState<Partial<Task>>({
    title: '',
    description: '',
    priority: 'medium',
    status: 'To Do',
    dueDate: '',
    assignee: '',
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showAssigneePicker, setShowAssigneePicker] = useState(false);

  // Get list of students (users with role 'user')
  const students = users?.filter(u => u.role === 'user') || [];

  const grouped = useMemo(() => {
    const map: Record<string, Task[]> = { 'To Do': [], 'In Progress': [], Done: [] };
    (tasks || []).forEach(t => {
      if (map[t.status]) {
        map[t.status].push(t);
      }
    });
    return map;
  }, [tasks]);

  const resetDraft = () => {
    setDraft({ title: '', description: '', priority: 'medium', status: 'To Do', dueDate: '', assignee: '' });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSave = () => {
    if (!draft.title?.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Title Required',
        text2: 'Please enter a task title',
      });
      return;
    }
    if (editingId) {
      updateTask.mutate(
        { id: editingId, task: { ...draft } },
        {
          onSuccess: () => {
            Toast.show({
              type: 'success',
              text1: 'Task Updated',
              text2: 'Task has been updated successfully',
            });
            resetDraft();
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
    } else {
      createTask.mutate(
        {
          title: draft.title || '',
          description: draft.description || '',
          priority: (draft.priority as Task['priority']) || 'medium',
          status: (draft.status as Task['status']) || 'To Do',
          dueDate: draft.dueDate,
          assignee: draft.assignee,
          tags: [],
        },
        {
          onSuccess: () => {
            Toast.show({
              type: 'success',
              text1: 'Task Created',
              text2: 'New task has been created',
            });
            resetDraft();
          },
          onError: (err: Error) => {
            Toast.show({
              type: 'error',
              text1: 'Create Failed',
              text2: err.message,
            });
          },
        },
      );
    }
  };

  const handleEdit = (task: Task) => {
    setEditingId(task._id);
    setDraft({ ...task });
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    deleteTask.mutate(id, {
      onSuccess: () => {
        Toast.show({
          type: 'success',
          text1: 'Task Deleted',
          text2: 'Task has been removed',
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

  if (!isAssistant) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ title: 'Assistant Dashboard' }} />
        <AlertCircle size={48} color="#64748b" />
        <Text style={styles.helper}>Assistant dashboard is available for assistants/admins.</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} />}>
      <Stack.Screen options={{ title: 'Assistant Dashboard', headerShown: true }} />
      
      <View style={styles.header}>
      <Text style={styles.title}>Task Tracker</Text>
        <Text style={styles.subtitle}>Create, update, and manage tasks</Text>
      </View>

      {/* New Task Button */}
      {!showForm && (
        <TouchableOpacity style={styles.newTaskButton} onPress={() => setShowForm(true)}>
          <Plus size={20} color="#ffffff" />
          <Text style={styles.newTaskButtonText}>New Task</Text>
        </TouchableOpacity>
      )}

      {/* Task Form */}
      {showForm && (
      <View style={styles.card}>
          <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{editingId ? 'Edit Task' : 'New Task'}</Text>
            <TouchableOpacity onPress={resetDraft}>
              <X size={24} color="#64748b" />
            </TouchableOpacity>
          </View>
          <TextInput
            placeholder="Task Title *"
            style={styles.input}
            value={draft.title}
            onChangeText={v => setDraft({ ...draft, title: v })}
          />
        <TextInput
          placeholder="Description"
          style={[styles.input, styles.multiline]}
          multiline
            numberOfLines={4}
          value={draft.description}
          onChangeText={v => setDraft({ ...draft, description: v })}
        />
        <View style={styles.rowBetween}>
            <View style={styles.half}>
              <Text style={styles.label}>Priority</Text>
          <TextInput
                placeholder="low/medium/high"
                style={styles.input}
            value={draft.priority as string}
            onChangeText={v => setDraft({ ...draft, priority: v as Task['priority'] })}
          />
            </View>
            <View style={styles.half}>
              <Text style={styles.label}>Status</Text>
          <TextInput
                placeholder="To Do/In Progress/Done"
                style={styles.input}
            value={draft.status as string}
            onChangeText={v => setDraft({ ...draft, status: v as Task['status'] })}
          />
            </View>
        </View>
        <View style={styles.rowBetween}>
            <View style={styles.half}>
              <Text style={styles.label}>Due Date</Text>
          <TextInput
                placeholder="YYYY-MM-DD"
                style={styles.input}
            value={draft.dueDate as string}
            onChangeText={v => setDraft({ ...draft, dueDate: v })}
          />
            </View>
            <View style={styles.half}>
              <Text style={styles.label}>Assign To Student</Text>
              <TouchableOpacity
                style={styles.pickerButton}
                onPress={() => setShowAssigneePicker(!showAssigneePicker)}>
                <Text style={[styles.pickerButtonText, !draft.assignee && styles.pickerButtonPlaceholder]}>
                  {draft.assignee 
                    ? students.find(s => s.email === draft.assignee)?.email || draft.assignee
                    : 'Select student...'}
                </Text>
                <ChevronDown size={20} color="#64748b" />
              </TouchableOpacity>
              {showAssigneePicker && (
                <View style={styles.pickerDropdown}>
                  <ScrollView style={styles.pickerList} nestedScrollEnabled>
                    <TouchableOpacity
                      style={styles.pickerItem}
                      onPress={() => {
                        setDraft({ ...draft, assignee: '' });
                        setShowAssigneePicker(false);
                      }}>
                      <Text style={styles.pickerItemText}>None (Unassigned)</Text>
                    </TouchableOpacity>
                    {students.map((student) => (
                      <TouchableOpacity
                        key={student._id}
                        style={[
                          styles.pickerItem,
                          draft.assignee === student.email && styles.pickerItemSelected,
                        ]}
                        onPress={() => {
                          setDraft({ ...draft, assignee: student.email });
                          setShowAssigneePicker(false);
                        }}>
                        <User size={16} color={draft.assignee === student.email ? '#3b82f6' : '#64748b'} />
                        <Text
                          style={[
                            styles.pickerItemText,
                            draft.assignee === student.email && styles.pickerItemTextSelected,
                          ]}>
                          {student.email}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
        </View>
        <View style={styles.rowBetween}>
            <TouchableOpacity style={styles.primaryButton} onPress={handleSave}>
              <Text style={styles.primaryText}>{editingId ? 'Update Task' : 'Create Task'}</Text>
            </TouchableOpacity>
            {editingId && (
              <TouchableOpacity style={styles.secondaryButton} onPress={resetDraft}>
              <Text style={styles.secondaryText}>Cancel</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.helper}>Loading tasks...</Text>
        </View>
      ) : null}
      {error && (
        <View style={styles.errorContainer}>
          <AlertCircle size={20} color="#ef4444" />
          <Text style={styles.errorText}>Failed to load tasks. Pull to retry.</Text>
        </View>
      )}

      {/* Task Lists */}
      {(['To Do', 'In Progress', 'Done'] as Task['status'][]).map(status => (
        <View key={status} style={styles.card}>
          <View style={styles.statusHeader}>
            <Text style={styles.statusTitle}>{status}</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusBadgeText}>{(grouped[status] || []).length}</Text>
            </View>
          </View>
          {(grouped[status] || []).length === 0 ? (
            <Text style={styles.emptyText}>No tasks</Text>
          ) : (
            grouped[status].map(task => (
              <View key={task._id} style={styles.taskCard}>
                <View style={styles.taskContent}>
                  <View style={styles.taskHeader}>
                  <Text style={styles.taskTitle}>{task.title}</Text>
                    <View
                      style={[
                        styles.priorityBadge,
                        { backgroundColor: `${getPriorityColor(task.priority)}20` },
                      ]}>
                      <Text
                        style={[styles.priorityText, { color: getPriorityColor(task.priority) }]}>
                        {task.priority.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  {task.description && <Text style={styles.taskDescription}>{task.description}</Text>}
                  <View style={styles.taskMeta}>
                    {task.dueDate && (
                      <Text style={styles.taskMetaText}>Due: {new Date(task.dueDate).toLocaleDateString()}</Text>
                    )}
                    {task.assignee && <Text style={styles.taskMetaText}>Assignee: {task.assignee}</Text>}
                  </View>
                </View>
                <View style={styles.taskActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleEdit(task)}>
                    <Edit size={18} color="#3b82f6" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => handleDelete(task._id)}>
                    <Trash2 size={18} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      ))}
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
    marginBottom: 8,
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
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
  multiline: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 6,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  half: {
    flex: 1,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#3b82f6',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 16,
  },
  secondaryButton: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    minWidth: 100,
  },
  secondaryText: {
    fontWeight: '600',
    color: '#64748b',
    fontSize: 14,
  },
  newTaskButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#3b82f6',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  newTaskButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 16,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  statusBadge: {
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 16,
  },
  taskCard: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 12,
  },
  taskContent: {
    flex: 1,
    gap: 8,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    flex: 1,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '700',
  },
  taskDescription: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
  taskMeta: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  taskMetaText: {
    fontSize: 12,
    color: '#94a3b8',
  },
  taskActions: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: {
    borderColor: '#fecaca',
    backgroundColor: '#fef2f2',
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
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#f8fafc',
  },
  pickerButtonText: {
    fontSize: 14,
    color: '#0f172a',
    flex: 1,
  },
  pickerButtonPlaceholder: {
    color: '#94a3b8',
  },
  pickerDropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: 4,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 1000,
    maxHeight: 200,
  },
  pickerList: {
    maxHeight: 200,
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  pickerItemSelected: {
    backgroundColor: '#f0f9ff',
  },
  pickerItemText: {
    fontSize: 14,
    color: '#0f172a',
  },
  pickerItemTextSelected: {
    color: '#3b82f6',
    fontWeight: '600',
  },
});
