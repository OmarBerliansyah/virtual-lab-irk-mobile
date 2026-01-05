import { useAuth } from '@/contexts/AuthContext.clerk';
import {
  useCreateEvent,
  useCreateTask,
  useDeleteEvent,
  useDeleteTask,
  useDeleteUser,
  useEvents,
  useGetUsers,
  useTasks,
  useUpdateEvent,
  useUpdateTask,
  useUpdateUser,
  useUserProfile,
} from '@/hooks/useApi';
import type { Event, Task, User } from '@/types/api';
import { Image as ExpoImage } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  ArrowRight,
  Award,
  Bell,
  Calendar,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Clock,
  Edit,
  Plus,
  Save,
  Trash2,
  X
} from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { Calendar as RNCalendar } from 'react-native-calendars';
import Toast from 'react-native-toast-message';

const { width } = Dimensions.get('window');

export default function DashboardScreen() {
  const router = useRouter();
  const { user: authUser } = useAuth();
  const { data: events, isLoading, refetch: refetchEvents } = useEvents();
  const { data: user } = useUserProfile();
  const { data: tasks, isLoading: tasksLoading, refetch: refetchTasks } = useTasks(user?.email);
  const { data: allTasks } = useTasks(); // For assistants/admins - all tasks
  const { data: users } = useGetUsers();
  
  // Assistant/Admin hooks
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();
  const deleteEvent = useDeleteEvent();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();

  // Task form state (for student tasks)
  const [taskDraft, setTaskDraft] = useState<Partial<Task>>({
    title: '',
    description: '',
    priority: 'medium',
    status: 'To Do',
    dueDate: '',
  });
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showPriorityPicker, setShowPriorityPicker] = useState(false);
  const [showStatusPicker, setShowStatusPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // Assistant task form state (for Task Tracker)
  const [assistantTaskDraft, setAssistantTaskDraft] = useState<Partial<Task>>({
    title: '',
    description: '',
    priority: 'medium',
    status: 'To Do',
    dueDate: '',
    isAssistantTask: true,
  });
  const [editingAssistantTaskId, setEditingAssistantTaskId] = useState<string | null>(null);
  const [showAssistantTaskForm, setShowAssistantTaskForm] = useState(false);
  const [showAssistantPriorityPicker, setShowAssistantPriorityPicker] = useState(false);
  const [showAssistantStatusPicker, setShowAssistantStatusPicker] = useState(false);
  const [showAssistantDatePicker, setShowAssistantDatePicker] = useState(false);

  // Highlight form state (Admin)
  const [highlightDraft, setHighlightDraft] = useState<Partial<Event>>({
    title: '',
    description: '',
    course: '',
    photoUrl: '',
    start: new Date().toISOString(),
    type: 'highlight',
  });
  const [editingHighlightId, setEditingHighlightId] = useState<string | null>(null);
  const [showHighlightForm, setShowHighlightForm] = useState(false);

  // User management state (Admin)
  const [editingUser, setEditingUser] = useState<Record<string, { email: string; role: User['role'] }>>({});

  const highlights = events?.filter(e => e.type === 'highlight') || [];

  // Group assistant tasks by status (for Task Tracker)
  const groupedAssistantTasks = useMemo(() => {
    const map: Record<string, Task[]> = { 'To Do': [], 'In Progress': [], Done: [] };
    (allTasks || []).filter(t => t.isAssistantTask).forEach(t => {
      if (map[t.status]) {
        map[t.status].push(t);
      }
    });
    return map;
  }, [allTasks]);
  
  // Student tasks (for Task Management - no grouping needed)
  const studentTaskList = useMemo(() => {
    return (allTasks || []).filter(t => !t.isAssistantTask);
  }, [allTasks]);

  // Task handlers
  const handleSaveTask = () => {
    if (!taskDraft.title?.trim()) {
      Toast.show({ type: 'error', text1: 'Title Required', text2: 'Please enter a task title' });
      return;
    }
    if (editingTaskId) {
      updateTask.mutate(
        { id: editingTaskId, task: { ...taskDraft } },
        {
          onSuccess: () => {
            Toast.show({ type: 'success', text1: 'Task Updated', text2: 'Task has been updated' });
            resetTaskForm();
            refetchTasks();
          },
        },
      );
    } else {
      createTask.mutate(
        {
          title: taskDraft.title || '',
          description: taskDraft.description || '',
          priority: (taskDraft.priority as Task['priority']) || 'medium',
          status: (taskDraft.status as Task['status']) || 'To Do',
          dueDate: taskDraft.dueDate,
          tags: [],
          isAssistantTask: false,
        } as any,
        {
          onSuccess: () => {
            Toast.show({ type: 'success', text1: 'Task Created', text2: 'Task assigned to all students' });
            resetTaskForm();
            refetchTasks();
          },
        },
      );
    }
  };

  const resetTaskForm = () => {
    setTaskDraft({ title: '', description: '', priority: 'medium', status: 'To Do', dueDate: '' });
    setEditingTaskId(null);
    setShowTaskForm(false);
  };
  
  const handleSaveAssistantTask = () => {
    if (!assistantTaskDraft.title?.trim()) {
      Toast.show({ type: 'error', text1: 'Title Required', text2: 'Please enter a task title' });
      return;
    }
    if (editingAssistantTaskId) {
      updateTask.mutate(
        { id: editingAssistantTaskId, task: { ...assistantTaskDraft } },
        {
          onSuccess: () => {
            Toast.show({ type: 'success', text1: 'Task Updated', text2: 'Task has been updated' });
            resetAssistantTaskForm();
            refetchTasks();
          },
        },
      );
    } else {
      createTask.mutate(
        {
          title: assistantTaskDraft.title || '',
          description: assistantTaskDraft.description || '',
          priority: (assistantTaskDraft.priority as Task['priority']) || 'medium',
          status: (assistantTaskDraft.status as Task['status']) || 'To Do',
          dueDate: assistantTaskDraft.dueDate,
          tags: [],
          isAssistantTask: true,
        } as any,
        {
          onSuccess: () => {
            Toast.show({ type: 'success', text1: 'Task Created', text2: 'Personal task has been created' });
            resetAssistantTaskForm();
            refetchTasks();
          },
        },
      );
    }
  };

  const resetAssistantTaskForm = () => {
    setAssistantTaskDraft({ title: '', description: '', priority: 'medium', status: 'To Do', dueDate: '', isAssistantTask: true });
    setEditingAssistantTaskId(null);
    setShowAssistantTaskForm(false);
  };

  const handleEditTask = (task: Task) => {
    setEditingTaskId(task._id);
    setTaskDraft({ ...task });
    setShowTaskForm(true);
  };

  const handleDeleteTask = (id: string) => {
    deleteTask.mutate(id, {
      onSuccess: () => {
        Toast.show({ type: 'success', text1: 'Task Deleted', text2: 'Task has been removed' });
        refetchTasks();
      },
    });
  };

  // Highlight handlers (Admin)
  const handleSaveHighlight = () => {
    if (!highlightDraft.title?.trim()) {
      Toast.show({ type: 'error', text1: 'Title Required', text2: 'Please enter a highlight title' });
      return;
    }
    if (editingHighlightId) {
      updateEvent.mutate(
        { id: editingHighlightId, event: { ...highlightDraft } },
        {
          onSuccess: () => {
            Toast.show({ type: 'success', text1: 'Highlight Updated', text2: 'Highlight has been updated' });
            resetHighlightForm();
            refetchEvents();
          },
        },
      );
    } else {
      createEvent.mutate(
        {
          title: highlightDraft.title || '',
          description: highlightDraft.description || '',
          course: highlightDraft.course || '',
          photoUrl: highlightDraft.photoUrl,
          start: highlightDraft.start || new Date().toISOString(),
          type: 'highlight',
        },
        {
          onSuccess: () => {
            Toast.show({ type: 'success', text1: 'Highlight Created', text2: 'New highlight has been added' });
            resetHighlightForm();
            refetchEvents();
          },
        },
      );
    }
  };

  const resetHighlightForm = () => {
    setHighlightDraft({ title: '', description: '', course: '', photoUrl: '', start: new Date().toISOString(), type: 'highlight' });
    setEditingHighlightId(null);
    setShowHighlightForm(false);
  };

  const handleEditHighlight = (event: Event) => {
    setEditingHighlightId(event._id);
    setHighlightDraft({ ...event });
    setShowHighlightForm(true);
  };

  const handleDeleteHighlight = (id: string) => {
    deleteEvent.mutate(id, {
      onSuccess: () => {
        Toast.show({ type: 'success', text1: 'Highlight Deleted', text2: 'Highlight has been removed' });
        refetchEvents();
      },
    });
  };

  // User management handlers (Admin)
  const handleSaveUser = (targetUser: User) => {
    const pending = editingUser[targetUser._id] || { email: targetUser.email, role: targetUser.role };
    updateUser.mutate(
      { id: targetUser._id, data: { email: pending.email, role: pending.role } },
      {
        onSuccess: () => {
          Toast.show({ type: 'success', text1: 'User Updated', text2: 'User information has been updated' });
          setEditingUser(prev => {
            const newState = { ...prev };
            delete newState[targetUser._id];
            return newState;
          });
        },
      },
    );
  };

  const handleDeleteUser = (id: string) => {
    if (id === authUser?._id) {
      Toast.show({ type: 'error', text1: 'Cannot Delete', text2: 'You cannot delete your own account' });
      return;
    }
    deleteUser.mutate(id, {
      onSuccess: () => {
        Toast.show({ type: 'success', text1: 'User Deleted', text2: 'User has been removed' });
      },
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#64748b';
    }
  };

  // Get assigned tasks for the current user
  const assignedTasks = tasks
    ?.filter(t => t.assignee === user?.email && t.status !== 'Done')
    .sort((a, b) => {
      // Sort by due date, then by priority
      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      if (a.dueDate) return -1;
      if (b.dueDate) return 1;
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    })
    .slice(0, 5) || [];

  // Extract user name from email for display
  const userName = user?.email?.split('@')[0] || 'User';
  const userDisplayName = userName
    .split('.')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
  const userSurname = userName.split('.')[userName.split('.').length - 1] || userName;

  const renderHighlight = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.highlightCard}
      onPress={() => router.push(`/highlight-detail/${item._id}`)}>
      {item.photoUrl ? (
        <Image source={{ uri: item.photoUrl }} style={styles.highlightImage} />
      ) : (
        <View style={[styles.highlightImage, styles.highlightPlaceholder]}>
          <Award size={48} color="#3b82f6" />
              </View>
      )}
      <View style={styles.highlightBadge}>
        <Award size={12} color="#ffffff" />
        <Text style={styles.highlightBadgeText}>HIGHLIGHT</Text>
      </View>
      <View style={styles.highlightContent}>
        <Text style={styles.highlightDate}>
          {new Date(item.start).toLocaleDateString('id-ID', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })}
        </Text>
        <Text style={styles.highlightTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.highlightCourse}>{item.course}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Hero Section with Backdrop Image */}
      <View style={styles.hero}>
        {/* SVG Background Image */}
        <ExpoImage
          source={require('@/assets/images/WelcomeBackdrop.svg')}
          style={styles.heroBackground}
          contentFit="cover"
        />
        {/* Gradient Overlay for better text readability */}
        <LinearGradient
          colors={['rgba(30, 64, 175, 0.6)', 'rgba(59, 130, 246, 0.4)', 'rgba(6, 182, 212, 0.2)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroOverlay}
        />
        {/* Header with Bell Icon */}
        <View style={styles.heroHeader}>
          <View style={styles.heroHeaderLeft}>
            <Text style={styles.heroSubtitle}>Selamat Datang!</Text>
            <Text style={styles.heroTitle}>{userSurname}</Text>
          </View>
          <TouchableOpacity style={styles.bellButton}>
            <Bell size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>
              </View>

      {/* User Profile Card - Overlapping Hero */}
      <View style={styles.profileCardContainer}>
        <TouchableOpacity
          style={styles.profileCard}
          onPress={() => router.push('/(tabs)/profile')}>
                <Image
            source={{
              uri: 'https://media.istockphoto.com/id/1477583639/vector/user-profile-icon-vector-avatar-or-person-icon-profile-picture-portrait-symbol-vector.jpg?s=612x612&w=0&k=20&c=OWGIPPkZIWLPvnQS14ZSyHMoGtVTn1zS8cAgLy1Uh24=',
            }}
            style={styles.profileImage}
          />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{userDisplayName}</Text>
            <Text style={styles.profileRole}>
              {user?.role === 'admin'
                ? 'Administrator'
                : user?.role === 'assistant'
                  ? 'Assistant'
                  : 'Student'}
            </Text>
              </View>
          <ChevronRight size={24} color="#64748b" />
        </TouchableOpacity>
      </View>

      {/* Latest Highlights */}
      {highlights.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Latest Highlights</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={highlights}
            renderItem={renderHighlight}
            keyExtractor={(item) => item._id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.highlightsList}
          />
        </View>
      )}

      {/* My Tasks - Only for Students */}
      {user?.role === 'user' && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Tasks</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          {tasksLoading ? (
            <Text style={styles.loadingText}>Loading tasks...</Text>
          ) : assignedTasks.length > 0 ? (
            <View style={styles.tasksList}>
              {assignedTasks.map((task) => (
                <TouchableOpacity
                  key={task._id}
                  style={styles.taskCard}
                  onPress={() => router.push(`/task-detail/${task._id}`)}>
                  <View style={styles.taskHeader}>
                    <View style={[
                      styles.taskPriorityBadge,
                      task.priority === 'high' && styles.taskPriorityHigh,
                      task.priority === 'medium' && styles.taskPriorityMedium,
                      task.priority === 'low' && styles.taskPriorityLow,
                    ]}>
                      <ClipboardList size={16} color="#ffffff" />
                    </View>
                    <View style={styles.taskContent}>
                      <Text style={styles.taskTitle}>{task.title}</Text>
                      <Text style={styles.taskDescription} numberOfLines={1}>
                        {task.description || 'No description'}
                      </Text>
                      <View style={styles.taskMeta}>
                        {task.dueDate && (
                          <View style={styles.taskMetaItem}>
                            <Clock size={12} color="#ef4444" />
                            <Text style={styles.taskDueDate}>
                              {new Date(task.dueDate).toLocaleDateString('id-ID', {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </Text>
                          </View>
                        )}
                        <View style={[
                          styles.taskStatusBadge,
                          task.status === 'To Do' && styles.taskStatusToDo,
                          task.status === 'In Progress' && styles.taskStatusInProgress,
                          task.status === 'Done' && styles.taskStatusDone,
                        ]}>
                          <Text style={styles.taskStatusText}>{task.status}</Text>
                        </View>
                      </View>
                    </View>
                    <ArrowRight size={20} color="#64748b" />
                  </View>
                </TouchableOpacity>
            ))}
          </View>
        ) : (
            <Text style={styles.emptyText}>No assigned tasks</Text>
          )}
              </View>
      )}

      {/* Task Management for Students - For Assistants and Admins */}
      {(user?.role === 'assistant' || user?.role === 'admin') && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Task Management for Students</Text>
            {!showTaskForm && (
              <TouchableOpacity style={styles.addButton} onPress={() => setShowTaskForm(true)}>
                <Plus size={18} color="#ffffff" />
                <Text style={styles.addButtonText}>New Task</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Task Form */}
          {showTaskForm && (
            <View style={styles.formCard}>
              <View style={styles.formHeader}>
                <Text style={styles.formTitle}>{editingTaskId ? 'Edit Task' : 'Create Task'}</Text>
                <TouchableOpacity onPress={resetTaskForm}>
                  <X size={24} color="#64748b" />
                </TouchableOpacity>
              </View>
              <TextInput
                placeholder="Task Title *"
                style={styles.input}
                value={taskDraft.title}
                onChangeText={v => setTaskDraft({ ...taskDraft, title: v })}
              />
              <TextInput
                placeholder="Description"
                style={[styles.input, styles.textArea]}
                multiline
                numberOfLines={4}
                value={taskDraft.description}
                onChangeText={v => setTaskDraft({ ...taskDraft, description: v })}
              />
              <View style={styles.row}>
                <View style={styles.half}>
                  <Text style={styles.label}>Priority</Text>
                  <TouchableOpacity
                    style={styles.pickerButton}
                    onPress={() => setShowPriorityPicker(!showPriorityPicker)}>
                    <Text style={styles.pickerButtonText}>
                      {taskDraft.priority ? taskDraft.priority.charAt(0).toUpperCase() + taskDraft.priority.slice(1) : 'Select'}
                    </Text>
                    <ChevronDown size={20} color="#64748b" />
                  </TouchableOpacity>
                  {showPriorityPicker && (
                    <View style={styles.pickerDropdown}>
                      {(['low', 'medium', 'high'] as Task['priority'][]).map(priority => (
                        <TouchableOpacity
                          key={priority}
                          style={styles.pickerItem}
                          onPress={() => {
                            setTaskDraft({ ...taskDraft, priority });
                            setShowPriorityPicker(false);
                          }}>
                          <Text style={styles.pickerItemText}>
                            {priority.charAt(0).toUpperCase() + priority.slice(1)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
                <View style={styles.half}>
                  <Text style={styles.label}>Status</Text>
                  <TouchableOpacity
                    style={styles.pickerButton}
                    onPress={() => setShowStatusPicker(!showStatusPicker)}>
                    <Text style={styles.pickerButtonText}>{taskDraft.status || 'Select'}</Text>
                    <ChevronDown size={20} color="#64748b" />
                  </TouchableOpacity>
                  {showStatusPicker && (
                    <View style={styles.pickerDropdown}>
                      {(['To Do', 'In Progress', 'Done'] as Task['status'][]).map(status => (
                        <TouchableOpacity
                          key={status}
                          style={styles.pickerItem}
                          onPress={() => {
                            setTaskDraft({ ...taskDraft, status });
                            setShowStatusPicker(false);
                          }}>
                          <Text style={styles.pickerItemText}>{status}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              </View>
              <View style={styles.row}>
                <View style={styles.full}>
                  <Text style={styles.label}>Due Date</Text>
                  <TouchableOpacity
                    style={styles.pickerButton}
                    onPress={() => setShowDatePicker(!showDatePicker)}>
                    <Text style={styles.pickerButtonText}>
                      {taskDraft.dueDate ? new Date(taskDraft.dueDate).toLocaleDateString() : 'Select Date'}
                    </Text>
                    <Calendar size={18} color="#64748b" />
                  </TouchableOpacity>
                  {showDatePicker && (
                    <Modal visible={showDatePicker} transparent animationType="slide">
                      <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                          <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Select Due Date</Text>
                            <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                              <X size={24} color="#64748b" />
                            </TouchableOpacity>
                          </View>
                          <RNCalendar
                            onDayPress={(day) => {
                              setTaskDraft({ ...taskDraft, dueDate: day.dateString });
                              setShowDatePicker(false);
                            }}
                            markedDates={taskDraft.dueDate ? { [taskDraft.dueDate]: { selected: true } } : {}}
                            theme={{
                              todayTextColor: '#3b82f6',
                              selectedDayBackgroundColor: '#3b82f6',
                              arrowColor: '#3b82f6',
                            }}
                          />
          </View>
        </View>
      </Modal>
                  )}
                </View>
              </View>
              <View style={styles.row}>
                <TouchableOpacity style={styles.primaryButton} onPress={handleSaveTask}>
                  <Text style={styles.primaryButtonText}>{editingTaskId ? 'Update Task' : 'Create Task'}</Text>
                </TouchableOpacity>
                {editingTaskId && (
                  <TouchableOpacity style={styles.secondaryButton} onPress={resetTaskForm}>
                    <Text style={styles.secondaryButtonText}>Cancel</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {/* Student Tasks - Card Layout (No Kanban) */}
          {studentTaskList.length === 0 ? (
            <Text style={styles.emptyText}>No student tasks</Text>
          ) : (
            <View style={styles.taskCardsContainer}>
              {studentTaskList.map(task => {
                const assignedCount = task.assignedTo?.length || 0;
                const completedCount = task.completedBy?.length || 0;
                const completionPercentage = assignedCount > 0 ? Math.round((completedCount / assignedCount) * 100) : 0;
                
                return (
                  <TouchableOpacity
                    key={task._id}
                    style={styles.studentTaskCard}
                    onPress={() => router.push(`/task-management-detail/${task._id}`)}>
                    <View style={styles.studentTaskHeader}>
                      <Text style={styles.studentTaskTitle}>{task.title}</Text>
                      <View style={[styles.priorityBadge, { backgroundColor: `${getPriorityColor(task.priority)}20` }]}>
                        <Text style={[styles.priorityText, { color: getPriorityColor(task.priority) }]}>
                          {task.priority.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                    {task.description && (
                      <Text style={styles.studentTaskDescription} numberOfLines={2}>
                        {task.description}
                      </Text>
                    )}
                    <View style={styles.completionBar}>
                      <View style={styles.completionBarBackground}>
                        <View style={[styles.completionBarFill, { width: `${completionPercentage}%`, backgroundColor: getPriorityColor(task.priority) }]} />
                      </View>
                      <Text style={styles.completionText}>
                        {completionPercentage}% ({completedCount}/{assignedCount})
                      </Text>
                    </View>
                    <View style={styles.studentTaskMeta}>
                      {task.dueDate && (
                        <Text style={styles.studentTaskMetaText}>
                          Due: {new Date(task.dueDate).toLocaleDateString()}
                        </Text>
                      )}
                      <View style={styles.studentTaskActions}>
                        <TouchableOpacity style={styles.actionButton} onPress={(e) => { e.stopPropagation(); handleEditTask(task); }}>
                          <Edit size={16} color="#3b82f6" />
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.actionButton, styles.deleteButton]} onPress={(e) => { e.stopPropagation(); handleDeleteTask(task._id); }}>
                          <Trash2 size={16} color="#ef4444" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      )}

      {/* Task Tracker (Assistant's Personal Tasks) - For Assistants and Admins */}
      {(user?.role === 'assistant' || user?.role === 'admin') && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Task Tracker</Text>
            {!showAssistantTaskForm && (
              <TouchableOpacity style={styles.addButton} onPress={() => setShowAssistantTaskForm(true)}>
                <Plus size={18} color="#ffffff" />
                <Text style={styles.addButtonText}>New Task</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Assistant Task Form */}
          {showAssistantTaskForm && (
            <View style={styles.formCard}>
              <View style={styles.formHeader}>
                <Text style={styles.formTitle}>{editingAssistantTaskId ? 'Edit Task' : 'Create Task'}</Text>
                <TouchableOpacity onPress={resetAssistantTaskForm}>
                  <X size={24} color="#64748b" />
                </TouchableOpacity>
              </View>
              <TextInput
                placeholder="Task Title *"
                style={styles.input}
                value={assistantTaskDraft.title}
                onChangeText={v => setAssistantTaskDraft({ ...assistantTaskDraft, title: v })}
              />
              <TextInput
                placeholder="Description"
                style={[styles.input, styles.textArea]}
                multiline
                numberOfLines={4}
                value={assistantTaskDraft.description}
                onChangeText={v => setAssistantTaskDraft({ ...assistantTaskDraft, description: v })}
              />
              <View style={styles.row}>
                <View style={styles.half}>
                  <Text style={styles.label}>Priority</Text>
                  <TouchableOpacity
                    style={styles.pickerButton}
                    onPress={() => setShowAssistantPriorityPicker(!showAssistantPriorityPicker)}>
                    <Text style={styles.pickerButtonText}>
                      {assistantTaskDraft.priority ? assistantTaskDraft.priority.charAt(0).toUpperCase() + assistantTaskDraft.priority.slice(1) : 'Select'}
                    </Text>
                    <ChevronDown size={20} color="#64748b" />
                  </TouchableOpacity>
                  {showAssistantPriorityPicker && (
                    <View style={styles.pickerDropdown}>
                      {(['low', 'medium', 'high'] as Task['priority'][]).map(priority => (
                        <TouchableOpacity
                          key={priority}
                          style={styles.pickerItem}
                          onPress={() => {
                            setAssistantTaskDraft({ ...assistantTaskDraft, priority });
                            setShowAssistantPriorityPicker(false);
                          }}>
                          <Text style={styles.pickerItemText}>
                            {priority.charAt(0).toUpperCase() + priority.slice(1)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
                <View style={styles.half}>
                  <Text style={styles.label}>Status</Text>
                  <TouchableOpacity
                    style={styles.pickerButton}
                    onPress={() => setShowAssistantStatusPicker(!showAssistantStatusPicker)}>
                    <Text style={styles.pickerButtonText}>{assistantTaskDraft.status || 'Select'}</Text>
                    <ChevronDown size={20} color="#64748b" />
                  </TouchableOpacity>
                  {showAssistantStatusPicker && (
                    <View style={styles.pickerDropdown}>
                      {(['To Do', 'In Progress', 'Done'] as Task['status'][]).map(status => (
                        <TouchableOpacity
                          key={status}
                          style={styles.pickerItem}
                          onPress={() => {
                            setAssistantTaskDraft({ ...assistantTaskDraft, status });
                            setShowAssistantStatusPicker(false);
                          }}>
                          <Text style={styles.pickerItemText}>{status}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              </View>
              <View style={styles.row}>
                <View style={styles.full}>
                  <Text style={styles.label}>Due Date</Text>
                  <TouchableOpacity
                    style={styles.pickerButton}
                    onPress={() => setShowAssistantDatePicker(!showAssistantDatePicker)}>
                    <Text style={styles.pickerButtonText}>
                      {assistantTaskDraft.dueDate ? new Date(assistantTaskDraft.dueDate).toLocaleDateString() : 'Select Date'}
                    </Text>
                    <Calendar size={18} color="#64748b" />
                  </TouchableOpacity>
                  {showAssistantDatePicker && (
                    <Modal visible={showAssistantDatePicker} transparent animationType="slide">
                      <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                          <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Select Due Date</Text>
                            <TouchableOpacity onPress={() => setShowAssistantDatePicker(false)}>
                              <X size={24} color="#64748b" />
                            </TouchableOpacity>
                          </View>
                          <RNCalendar
                            onDayPress={(day) => {
                              setAssistantTaskDraft({ ...assistantTaskDraft, dueDate: day.dateString });
                              setShowAssistantDatePicker(false);
                            }}
                            markedDates={assistantTaskDraft.dueDate ? { [assistantTaskDraft.dueDate]: { selected: true } } : {}}
                            theme={{
                              todayTextColor: '#3b82f6',
                              selectedDayBackgroundColor: '#3b82f6',
                              arrowColor: '#3b82f6',
                            }}
                          />
                        </View>
                      </View>
                    </Modal>
                  )}
                </View>
              </View>
              <View style={styles.row}>
                <TouchableOpacity style={styles.primaryButton} onPress={handleSaveAssistantTask}>
                  <Text style={styles.primaryButtonText}>{editingAssistantTaskId ? 'Update Task' : 'Create Task'}</Text>
                </TouchableOpacity>
                {editingAssistantTaskId && (
                  <TouchableOpacity style={styles.secondaryButton} onPress={resetAssistantTaskForm}>
                    <Text style={styles.secondaryButtonText}>Cancel</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {/* Assistant Tasks - Kanban Board Layout */}
          {(['To Do', 'In Progress', 'Done'] as Task['status'][]).map(status => (
            <View key={status} style={styles.statusCard}>
              <View style={styles.statusHeader}>
                <Text style={styles.statusTitle}>{status}</Text>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusBadgeText}>{(groupedAssistantTasks[status] || []).length}</Text>
                </View>
              </View>
              {(groupedAssistantTasks[status] || []).length === 0 ? (
                <Text style={styles.emptyText}>No tasks</Text>
              ) : (
                groupedAssistantTasks[status].map(task => (
                  <View key={task._id} style={styles.manageTaskCard}>
                    <View style={styles.manageTaskContent}>
                      <Text style={styles.manageTaskTitle}>{task.title}</Text>
                      {task.description && <Text style={styles.manageTaskDescription} numberOfLines={2}>{task.description}</Text>}
                      <View style={styles.manageTaskMeta}>
                        <View style={[styles.priorityBadge, { backgroundColor: `${getPriorityColor(task.priority)}20` }]}>
                          <Text style={[styles.priorityText, { color: getPriorityColor(task.priority) }]}>
                            {task.priority.toUpperCase()}
                          </Text>
                        </View>
                        {task.dueDate && (
                          <Text style={styles.manageTaskMetaText}>
                            Due: {new Date(task.dueDate).toLocaleDateString()}
                          </Text>
                        )}
                      </View>
                    </View>
                    <View style={styles.manageTaskActions}>
                      <TouchableOpacity style={styles.actionButton} onPress={() => {
                        setEditingAssistantTaskId(task._id);
                        setAssistantTaskDraft({ ...task });
                        setShowAssistantTaskForm(true);
                      }}>
                        <Edit size={18} color="#3b82f6" />
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.actionButton, styles.deleteButton]} onPress={() => handleDeleteTask(task._id)}>
                        <Trash2 size={18} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </View>
          ))}
        </View>
      )}

      {/* Admin User Management */}
      {user?.role === 'admin' && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>User Management</Text>
          </View>
          {(users || []).map(targetUser => {
            const pending = editingUser[targetUser._id] || { email: targetUser.email, role: targetUser.role };
            const isCurrentUser = authUser?._id === targetUser._id;
            return (
              <View key={targetUser._id} style={styles.userCard}>
                <View style={styles.userHeader}>
                  <Text style={styles.userEmail}>{targetUser.email}</Text>
                  <View style={[styles.roleBadge, targetUser.role === 'admin' && styles.roleBadgeAdmin, targetUser.role === 'assistant' && styles.roleBadgeAssistant]}>
                    <Text style={styles.roleBadgeText}>{targetUser.role.toUpperCase()}</Text>
                  </View>
                </View>
                <View style={styles.row}>
                  <View style={styles.half}>
                    <Text style={styles.label}>Email</Text>
                    <TextInput
                      style={styles.input}
                      value={pending.email}
                      onChangeText={v => setEditingUser(prev => ({ ...prev, [targetUser._id]: { ...pending, email: v } }))}
                      editable={!isCurrentUser}
                    />
                  </View>
                  <View style={styles.half}>
                    <Text style={styles.label}>Role</Text>
                    <TextInput
                      style={styles.input}
                      value={pending.role}
                      onChangeText={v => setEditingUser(prev => ({ ...prev, [targetUser._id]: { ...pending, role: v as User['role'] } }))}
                      editable={!isCurrentUser}
                    />
                  </View>
                </View>
                <View style={styles.row}>
                  <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={() => handleSaveUser(targetUser)}
                    disabled={isCurrentUser || (pending.email === targetUser.email && pending.role === targetUser.role)}>
                    <Save size={18} color="#ffffff" />
                    <Text style={styles.primaryButtonText}>Save</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.secondaryButton, styles.deleteButton]}
                    onPress={() => handleDeleteUser(targetUser._id)}
                    disabled={isCurrentUser}>
                    <Trash2 size={18} color="#ef4444" />
                    <Text style={[styles.secondaryButtonText, styles.deleteButtonText]}>Delete</Text>
                  </TouchableOpacity>
                </View>
  </View>
);
          })}
        </View>
      )}

      {/* Admin Highlights Manager */}
      {user?.role === 'admin' && (
  <View style={styles.section}>
    <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Highlights Manager</Text>
            {!showHighlightForm && (
              <TouchableOpacity style={styles.addButton} onPress={() => setShowHighlightForm(true)}>
                <Plus size={18} color="#ffffff" />
                <Text style={styles.addButtonText}>New Highlight</Text>
              </TouchableOpacity>
            )}
    </View>

          {/* Highlight Form */}
          {showHighlightForm && (
            <View style={styles.formCard}>
              <View style={styles.formHeader}>
                <Text style={styles.formTitle}>{editingHighlightId ? 'Edit Highlight' : 'Create Highlight'}</Text>
                <TouchableOpacity onPress={resetHighlightForm}>
                  <X size={24} color="#64748b" />
                </TouchableOpacity>
  </View>
              <TextInput
                placeholder="Title *"
                style={styles.input}
                value={highlightDraft.title}
                onChangeText={v => setHighlightDraft({ ...highlightDraft, title: v })}
              />
              <TextInput
                placeholder="Description"
                style={[styles.input, styles.textArea]}
                multiline
                numberOfLines={4}
                value={highlightDraft.description}
                onChangeText={v => setHighlightDraft({ ...highlightDraft, description: v })}
              />
              <TextInput
                placeholder="Course Code (e.g., IF2211)"
                style={styles.input}
                value={highlightDraft.course}
                onChangeText={v => setHighlightDraft({ ...highlightDraft, course: v })}
              />
              <TextInput
                placeholder="Photo URL (optional)"
                style={styles.input}
                value={highlightDraft.photoUrl}
                onChangeText={v => setHighlightDraft({ ...highlightDraft, photoUrl: v })}
              />
              <View style={styles.row}>
                <TouchableOpacity style={styles.primaryButton} onPress={handleSaveHighlight}>
                  <Text style={styles.primaryButtonText}>{editingHighlightId ? 'Update Highlight' : 'Create Highlight'}</Text>
                </TouchableOpacity>
                {editingHighlightId && (
                  <TouchableOpacity style={styles.secondaryButton} onPress={resetHighlightForm}>
                    <Text style={styles.secondaryButtonText}>Cancel</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {/* Highlights List */}
          <View style={styles.highlightsManageList}>
            {highlights.map(highlight => (
              <View key={highlight._id} style={styles.highlightManageCard}>
                {highlight.photoUrl ? (
                  <Image source={{ uri: highlight.photoUrl }} style={styles.highlightManageImage} />
                ) : (
                  <View style={[styles.highlightManageImage, styles.highlightPlaceholder]}>
                    <Award size={32} color="#3b82f6" />
                  </View>
                )}
                <View style={styles.highlightManageContent}>
                  <Text style={styles.highlightManageTitle}>{highlight.title}</Text>
                  <Text style={styles.highlightManageCourse}>{highlight.course}</Text>
                  {highlight.description && (
                    <Text style={styles.highlightManageDescription} numberOfLines={2}>
                      {highlight.description}
                    </Text>
                  )}
                </View>
                <View style={styles.highlightManageActions}>
                  <TouchableOpacity style={styles.actionButton} onPress={() => handleEditHighlight(highlight)}>
                    <Edit size={18} color="#3b82f6" />
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.actionButton, styles.deleteButton]} onPress={() => handleDeleteHighlight(highlight._id)}>
                    <Trash2 size={18} color="#ef4444" />
                  </TouchableOpacity>
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
    backgroundColor: '#ffffff',
  },
  hero: {
    padding: 24,
    paddingTop: 60,
    paddingBottom: 100,
    position: 'relative',
    overflow: 'hidden',
    minHeight: 200,
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
    width: '100%',
    height: '100%',
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    zIndex: 1,
  },
  heroHeaderLeft: {
    flex: 1,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#ffffff',
    opacity: 0.9,
    marginBottom: 4,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    lineHeight: 36,
  },
  bellButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileCardContainer: {
    marginTop: -60,
    paddingHorizontal: 24,
    zIndex: 10,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    gap: 12,
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f1f5f9',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 4,
  },
  profileRole: {
    fontSize: 14,
    color: '#64748b',
  },
  heroButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  heroPrimaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 8,
  },
  heroPrimaryButtonText: {
    color: '#3b82f6',
    fontSize: 16,
    fontWeight: '600',
  },
  heroSecondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#ffffff',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 8,
  },
  heroSecondaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    padding: 24,
    paddingTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 16,
  },
  seeAllText: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '600',
  },
  coursesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  courseCard: {
    width: (width - 60) / 3,
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  courseCode: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0f172a',
    marginTop: 8,
    marginBottom: 4,
  },
  courseName: {
    fontSize: 10,
    color: '#64748b',
    textAlign: 'center',
  },
  highlightsList: {
    paddingRight: 24,
  },
  highlightCard: {
    width: width * 0.85,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginRight: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  highlightImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#f1f5f9',
  },
  highlightPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  highlightBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#22c55e',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  highlightBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
  highlightContent: {
    padding: 16,
  },
  highlightDate: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 8,
  },
  highlightTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 4,
  },
  highlightCourse: {
    fontSize: 12,
    color: '#64748b',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  deadlinesList: {
    gap: 12,
  },
  deadlineCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  deadlineIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fee2e2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deadlineContent: {
    flex: 1,
  },
  deadlineTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 4,
  },
  deadlineCourse: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 2,
  },
  deadlineDate: {
    fontSize: 12,
    color: '#ef4444',
    fontWeight: '500',
  },
  loadingText: {
    textAlign: 'center',
    color: '#64748b',
    padding: 24,
  },
  emptyText: {
    textAlign: 'center',
    color: '#64748b',
    padding: 24,
  },
  tasksList: {
    gap: 12,
  },
  taskCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  taskPriorityBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskPriorityHigh: {
    backgroundColor: '#ef4444',
  },
  taskPriorityMedium: {
    backgroundColor: '#f59e0b',
  },
  taskPriorityLow: {
    backgroundColor: '#10b981',
  },
  taskContent: {
    flex: 1,
    gap: 4,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  taskDescription: {
    fontSize: 12,
    color: '#64748b',
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },
  taskMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  taskDueDate: {
    fontSize: 12,
    color: '#ef4444',
    fontWeight: '500',
  },
  taskStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  taskStatusToDo: {
    backgroundColor: '#e2e8f0',
  },
  taskStatusInProgress: {
    backgroundColor: '#dbeafe',
  },
  taskStatusDone: {
    backgroundColor: '#d1fae5',
  },
  taskStatusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#0f172a',
  },
  // Assistant/Admin Task Management Styles
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  formCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
    gap: 12,
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: '#f8fafc',
    color: '#0f172a',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  half: {
    flex: 1,
  },
  full: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 6,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#f8fafc',
    minHeight: 44,
  },
  pickerButtonText: {
    fontSize: 14,
    color: '#0f172a',
  },
  pickerDropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    zIndex: 10,
    marginTop: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  pickerItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  pickerItemText: {
    fontSize: 14,
    color: '#0f172a',
  },
  deleteButtonText: {
    color: '#ef4444',
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    gap: 8,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#64748b',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  statusCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
    gap: 12,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    backgroundColor: '#e2e8f0',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  manageTaskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 8,
  },
  manageTaskContent: {
    flex: 1,
    gap: 4,
  },
  manageTaskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  manageTaskDescription: {
    fontSize: 12,
    color: '#64748b',
  },
  manageTaskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
    flexWrap: 'wrap',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '700',
  },
  manageTaskMetaText: {
    fontSize: 12,
    color: '#64748b',
  },
  manageTaskActions: {
    flexDirection: 'row',
    gap: 8,
    marginLeft: 12,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: {
    backgroundColor: '#fef2f2',
  },
  // User Management Styles
  userCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 12,
    gap: 12,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  userEmail: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    flex: 1,
  },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
  },
  roleBadgeAdmin: {
    backgroundColor: '#fee2e2',
  },
  roleBadgeAssistant: {
    backgroundColor: '#dbeafe',
  },
  roleBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  // Highlights Manager Styles
  highlightsManageList: {
    gap: 12,
  },
  highlightManageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 12,
  },
  highlightManageImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  highlightManageContent: {
    flex: 1,
    gap: 4,
  },
  highlightManageTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  highlightManageCourse: {
    fontSize: 12,
    color: '#64748b',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  highlightManageDescription: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  highlightManageActions: {
    flexDirection: 'row',
    gap: 8,
  },
  // Student Task Management Styles
  taskCardsContainer: {
    gap: 12,
  },
  studentTaskCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
    gap: 12,
  },
  studentTaskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  studentTaskTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
    flex: 1,
  },
  studentTaskDescription: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
  completionBar: {
    gap: 8,
  },
  completionBarBackground: {
    height: 20,
    backgroundColor: '#e2e8f0',
    borderRadius: 10,
    overflow: 'hidden',
  },
  completionBarFill: {
    height: '100%',
    borderRadius: 10,
  },
  completionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
    textAlign: 'center',
  },
  studentTaskMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  studentTaskMetaText: {
    fontSize: 12,
    color: '#64748b',
  },
  studentTaskActions: {
    flexDirection: 'row',
    gap: 8,
  },
});
