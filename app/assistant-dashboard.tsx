import React, { useMemo, useState } from 'react';
import { ScrollView, View, Text, TextInput, Pressable, StyleSheet, RefreshControl, ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask } from '@/hooks/useApi';
import type { Task } from '@/types/api';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useToast } from '@/hooks/use-toast';

export default function AssistantDashboardScreen() {
  const colorScheme = useColorScheme();
  const { isAssistant, isAdmin } = useUserProfile();
  const { data: tasks, isLoading, isFetching, error, refetch } = useTasks();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const { toast } = useToast();

  const [draft, setDraft] = useState<Partial<Task>>({
    title: '',
    description: '',
    priority: 'medium',
    status: 'To Do',
    dueDate: '',
    assignee: '',
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const map: Record<string, Task[]> = { 'To Do': [], 'In Progress': [], Done: [] };
    (tasks || []).forEach(t => map[t.status]?.push(t));
    return map;
  }, [tasks]);

  const resetDraft = () => {
    setDraft({ title: '', description: '', priority: 'medium', status: 'To Do', dueDate: '', assignee: '' });
    setEditingId(null);
  };

  const handleSave = () => {
    if (!draft.title?.trim()) {
      toast({ title: 'Title required', description: 'Please enter a task title', type: 'error' });
      return;
    }
    if (editingId) {
      updateTask.mutate(
        { id: editingId, task: { ...draft } },
        {
          onSuccess: () => {
            toast({ title: 'Task updated' });
            resetDraft();
          },
          onError: (err: Error) => toast({ title: 'Update failed', description: err.message, type: 'error' }),
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
            toast({ title: 'Task created' });
            resetDraft();
          },
          onError: (err: Error) => toast({ title: 'Create failed', description: err.message, type: 'error' }),
        },
      );
    }
  };

  const handleEdit = (task: Task) => {
    setEditingId(task._id);
    setDraft({ ...task });
  };

  const handleDelete = (id: string) => {
    deleteTask.mutate(id, {
      onSuccess: () => toast({ title: 'Task deleted' }),
      onError: (err: Error) => toast({ title: 'Delete failed', description: err.message, type: 'error' }),
    });
  };

  if (!isAssistant && !isAdmin) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ title: 'Assistant Dashboard' }} />
        <Text style={styles.helper}>Assistant dashboard is available for assistants/admins.</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} />}
    >
      <Stack.Screen options={{ title: 'Assistant Dashboard' }} />
      <Text style={styles.title}>Task Tracker</Text>
      <Text style={styles.helper}>Create, update, and move tasks between stages.</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{editingId ? 'Edit Task' : 'New Task'}</Text>
        <TextInput placeholder="Title" style={styles.input} value={draft.title} onChangeText={v => setDraft({ ...draft, title: v })} />
        <TextInput
          placeholder="Description"
          style={[styles.input, styles.multiline]}
          multiline
          value={draft.description}
          onChangeText={v => setDraft({ ...draft, description: v })}
        />
        <View style={styles.rowBetween}>
          <TextInput
            placeholder="Priority (low/medium/high)"
            style={[styles.input, styles.half]}
            value={draft.priority as string}
            onChangeText={v => setDraft({ ...draft, priority: v as Task['priority'] })}
          />
          <TextInput
            placeholder="Status (To Do/In Progress/Done)"
            style={[styles.input, styles.half]}
            value={draft.status as string}
            onChangeText={v => setDraft({ ...draft, status: v as Task['status'] })}
          />
        </View>
        <View style={styles.rowBetween}>
          <TextInput
            placeholder="Due date (YYYY-MM-DD)"
            style={[styles.input, styles.half]}
            value={draft.dueDate as string}
            onChangeText={v => setDraft({ ...draft, dueDate: v })}
          />
          <TextInput
            placeholder="Assignee"
            style={[styles.input, styles.half]}
            value={draft.assignee as string}
            onChangeText={v => setDraft({ ...draft, assignee: v })}
          />
        </View>
        <View style={styles.rowBetween}>
          <Pressable style={styles.primaryButton} onPress={handleSave}>
            <Text style={styles.primaryText}>{editingId ? 'Update Task' : 'Add Task'}</Text>
          </Pressable>
          {editingId ? (
            <Pressable style={styles.secondaryButton} onPress={resetDraft}>
              <Text style={styles.secondaryText}>Cancel</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      {isLoading ? (
        <View style={styles.rowCenter}>
          <ActivityIndicator color="#2563eb" />
          <Text style={styles.helper}> Loading tasks...</Text>
        </View>
      ) : null}
      {error && <Text style={[styles.helper, styles.error]}>Failed to load tasks. Pull to retry.</Text>}

      {(['To Do', 'In Progress', 'Done'] as Task['status'][]).map(status => (
        <View key={status} style={styles.card}>
          <Text style={styles.cardTitle}>{status}</Text>
          {(grouped[status] || []).length === 0 ? (
            <Text style={styles.helper}>No tasks</Text>
          ) : (
            grouped[status].map(task => (
              <View key={task._id} style={styles.taskRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.taskTitle}>{task.title}</Text>
                  <Text style={styles.helper}>{task.description}</Text>
                  <Text style={styles.helper}>Priority: {task.priority} · Due: {task.dueDate || '—'}</Text>
                </View>
                <View style={styles.row}>
                  <Pressable style={styles.smallButton} onPress={() => handleEdit(task)}>
                    <Text style={styles.secondaryText}>Edit</Text>
                  </Pressable>
                  <Pressable style={[styles.smallButton, styles.dangerButton]} onPress={() => handleDelete(task._id)}>
                    <Text style={[styles.secondaryText, styles.dangerText]}>Delete</Text>
                  </Pressable>
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
  container: { flex: 1 },
  content: { padding: 16, gap: 16 },
  title: { fontSize: 24, fontWeight: '700' },
  helper: { color: '#6b7280', fontSize: 13 },
  error: { color: '#dc2626' },
  card: { backgroundColor: '#fff', padding: 14, borderRadius: 12, gap: 10, shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 4 }, shadowRadius: 8, elevation: 2 },
  cardTitle: { fontSize: 18, fontWeight: '700' },
  input: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, padding: 10, backgroundColor: '#f9fafb', fontSize: 14 },
  multiline: { minHeight: 80, textAlignVertical: 'top' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  row: { flexDirection: 'row', gap: 8 },
  half: { flex: 1 },
  primaryButton: { flex: 1, backgroundColor: '#2563eb', padding: 12, borderRadius: 10, alignItems: 'center' },
  primaryText: { color: '#fff', fontWeight: '700' },
  secondaryButton: { padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#f8fafc' },
  secondaryText: { fontWeight: '600' },
  smallButton: { paddingVertical: 6, paddingHorizontal: 10, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, backgroundColor: '#f8fafc' },
  dangerButton: { borderColor: '#fecdd3', backgroundColor: '#fff1f2' },
  dangerText: { color: '#dc2626' },
  taskRow: { flexDirection: 'row', gap: 10, alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderColor: '#f1f5f9' },
  taskTitle: { fontSize: 15, fontWeight: '700' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  rowCenter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
