import type React from 'react';
import { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useAuth } from '@clerk/clerk-expo';

import {
  useEvents,
  useTasks,
  useCreateEvent,
  useUpdateEvent,
  useDeleteEvent,
  useCreateTask,
  useUpdateTask,
  useDeleteTask,
} from '@/hooks/useApi';
import { useUserProfile } from '@/hooks/useUserProfile';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import type { Event, Task } from '@/types/api';
import { useToast } from '@/hooks/use-toast';

export default function TimelineScreen() {
  const { isSignedIn } = useAuth();
  const { isAssistant, isAdmin } = useUserProfile();
  const canManage = isSignedIn && (isAssistant || isAdmin);
  const { data: events, isLoading: eventsLoading } = useEvents();
  const { data: tasks, isLoading: tasksLoading } = useTasks();
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();
  const deleteEvent = useDeleteEvent();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const { toast } = useToast();

  const [modalType, setModalType] = useState<'event' | 'task' | null>(null);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [form, setForm] = useState({
    title: '',
    date: new Date().toISOString().slice(0, 10),
    course: 'IF2120',
    type: 'deadline' as Event['type'],
    description: '',
    photoUrl: '',
  });
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    priority: 'medium' as Task['priority'],
    status: 'To Do' as Task['status'],
    dueDate: new Date().toISOString().slice(0, 10),
  });

  const grouped = useMemo(() => {
    const all: Array<{ kind: 'event' | 'task'; data: Event | Task; date: string }> = [];
    (events || []).forEach((evt) => all.push({ kind: 'event', data: evt, date: evt.start }));
    (tasks || []).forEach((task) => task.dueDate && all.push({ kind: 'task', data: task, date: task.dueDate }));
    return all.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [events, tasks]);

  const submitEvent = async () => {
    try {
      if (editingEvent) {
        await updateEvent.mutateAsync({ id: editingEvent._id, event: { ...editingEvent, ...form, start: form.date } });
        toast({ title: 'Event updated' });
      } else {
        await createEvent.mutateAsync({
          title: form.title,
          start: form.date,
          course: form.course,
          type: form.type,
          description: form.description,
          photoUrl: form.photoUrl,
        } as Event);
        toast({ title: 'Event created' });
      }
      setModalType(null);
      setEditingEvent(null);
    } catch (error) {
      toast({ title: 'Error', description: (error as Error).message, type: 'error' });
    }
  };

  const submitTask = async () => {
    try {
      if (editingTask) {
        await updateTask.mutateAsync({ id: editingTask._id, task: { ...editingTask, ...taskForm, dueDate: taskForm.dueDate } });
        toast({ title: 'Task updated' });
      } else {
        await createTask.mutateAsync({
          title: taskForm.title,
          description: taskForm.description,
          priority: taskForm.priority,
          status: taskForm.status,
          dueDate: taskForm.dueDate,
        } as Task);
        toast({ title: 'Task created' });
      }
      setModalType(null);
      setEditingTask(null);
    } catch (error) {
      toast({ title: 'Error', description: (error as Error).message, type: 'error' });
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Timeline</ThemedText>
      <Text style={styles.muted}>Kalender event dan tugas.</Text>

      {canManage && (
        <View style={styles.actionRow}>
          <Pressable style={styles.primaryBtn} onPress={() => { setModalType('event'); setEditingEvent(null); }}>
            <Text style={styles.btnText}>Tambah Event</Text>
          </Pressable>
          <Pressable style={styles.secondaryBtn} onPress={() => { setModalType('task'); setEditingTask(null); }}>
            <Text style={styles.secondaryText}>Tambah Task</Text>
          </Pressable>
        </View>
      )}

      {(eventsLoading || tasksLoading) && <Text style={styles.muted}>Memuat data...</Text>}

      <FlatList
        data={grouped}
        keyExtractor={(item) => `${item.kind}-${'data' in item ? (item as any).data._id || Math.random() : Math.random()}`}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <ThemedText type="subtitle">{item.data.title}</ThemedText>
              <Text style={styles.badge}>{item.kind === 'event' ? (item.data as Event).course : 'Task'}</Text>
            </View>
            <Text style={styles.meta}>{new Date(item.date).toLocaleDateString('id-ID')}</Text>
            {'description' in item.data && item.data.description ? (
              <Text style={styles.body}>{(item.data as any).description}</Text>
            ) : null}
            {canManage && (
              <View style={styles.row}>
                <Pressable
                  onPress={() => {
                    if (item.kind === 'event') {
                      setEditingEvent(item.data as Event);
                      setForm({
                        title: (item.data as Event).title,
                        date: (item.data as Event).start,
                        course: (item.data as Event).course,
                        type: (item.data as Event).type,
                        description: (item.data as Event).description || '',
                        photoUrl: (item.data as Event).photoUrl || '',
                      });
                      setModalType('event');
                    } else {
                      setEditingTask(item.data as Task);
                      setTaskForm({
                        title: (item.data as Task).title,
                        description: (item.data as Task).description || '',
                        priority: (item.data as Task).priority,
                        status: (item.data as Task).status,
                        dueDate: (item.data as Task).dueDate || new Date().toISOString().slice(0, 10),
                      });
                      setModalType('task');
                    }
                  }}
                  style={styles.linkBtn}>
                  <Text style={styles.linkText}>Edit</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    if (item.kind === 'event') deleteEvent.mutate(item.data._id);
                    else deleteTask.mutate((item.data as Task)._id);
                  }}
                  style={styles.linkBtn}>
                  <Text style={[styles.linkText, { color: Colors.light.destructive }]}>Delete</Text>
                </Pressable>
              </View>
            )}
          </View>
        )}
      />

      <Modal visible={modalType === 'event'} animationType="slide" onRequestClose={() => setModalType(null)}>
        <ScrollView contentContainerStyle={styles.modal}>
          <ThemedText type="title">{editingEvent ? 'Edit Event' : 'Tambah Event'}</ThemedText>
          <LabeledInput label="Judul" value={form.title} onChangeText={(title) => setForm((p) => ({ ...p, title }))} />
          <LabeledInput label="Tanggal" value={form.date} onChangeText={(date) => setForm((p) => ({ ...p, date }))} />
          <LabeledInput label="Course" value={form.course} onChangeText={(course) => setForm((p) => ({ ...p, course }))} />
          <LabeledInput label="Type" value={form.type} onChangeText={(type) => setForm((p) => ({ ...p, type: type as Event['type'] }))} />
          <LabeledInput label="Deskripsi" value={form.description} onChangeText={(description) => setForm((p) => ({ ...p, description }))} multiline />
          <LabeledInput label="Photo URL" value={form.photoUrl} onChangeText={(photoUrl) => setForm((p) => ({ ...p, photoUrl }))} />
          <View style={styles.actionRow}>
            <Pressable style={styles.secondaryBtn} onPress={() => setModalType(null)}>
              <Text style={styles.secondaryText}>Batal</Text>
            </Pressable>
            <Pressable style={styles.primaryBtn} onPress={submitEvent}>
              <Text style={styles.btnText}>{editingEvent ? 'Update' : 'Simpan'}</Text>
            </Pressable>
          </View>
        </ScrollView>
      </Modal>

      <Modal visible={modalType === 'task'} animationType="slide" onRequestClose={() => setModalType(null)}>
        <ScrollView contentContainerStyle={styles.modal}>
          <ThemedText type="title">{editingTask ? 'Edit Task' : 'Tambah Task'}</ThemedText>
          <LabeledInput label="Judul" value={taskForm.title} onChangeText={(title) => setTaskForm((p) => ({ ...p, title }))} />
          <LabeledInput label="Deskripsi" value={taskForm.description} onChangeText={(description) => setTaskForm((p) => ({ ...p, description }))} multiline />
          <LabeledInput label="Prioritas" value={taskForm.priority} onChangeText={(priority) => setTaskForm((p) => ({ ...p, priority: priority as Task['priority'] }))} />
          <LabeledInput label="Status" value={taskForm.status} onChangeText={(status) => setTaskForm((p) => ({ ...p, status: status as Task['status'] }))} />
          <LabeledInput label="Due Date" value={taskForm.dueDate || ''} onChangeText={(dueDate) => setTaskForm((p) => ({ ...p, dueDate }))} />
          <View style={styles.actionRow}>
            <Pressable style={styles.secondaryBtn} onPress={() => setModalType(null)}>
              <Text style={styles.secondaryText}>Batal</Text>
            </Pressable>
            <Pressable style={styles.primaryBtn} onPress={submitTask}>
              <Text style={styles.btnText}>{editingTask ? 'Update' : 'Simpan'}</Text>
            </Pressable>
          </View>
        </ScrollView>
      </Modal>
    </ThemedView>
  );
}

const LabeledInput = ({ label, ...props }: { label: string } & React.ComponentProps<typeof TextInput>) => (
  <View style={{ gap: 6 }}>
    <Text style={{ fontWeight: '600', color: '#111' }}>{label}</Text>
    <TextInput
      {...props}
      style={[
        styles.input,
        props.multiline && { height: 96, textAlignVertical: 'top' },
      ]}
      placeholderTextColor="#888"
    />
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 12,
  },
  muted: {
    color: '#666',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  primaryBtn: {
    backgroundColor: Colors.light.tint,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  btnText: {
    color: '#fff',
    fontWeight: '700',
  },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: '#ccc',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  secondaryText: {
    color: '#111',
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    gap: 6,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#eee',
    borderRadius: 12,
    fontSize: 12,
  },
  meta: {
    color: '#555',
    fontSize: 12,
  },
  body: {
    color: '#111',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
  },
  linkBtn: {
    paddingVertical: 4,
  },
  linkText: {
    color: Colors.light.tint,
    fontWeight: '600',
  },
  modal: {
    padding: 16,
    gap: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#111',
  },
});
