import { useEvents, useUserProfile } from '@/hooks/useMockApi';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ArrowRight, Award, Bell, Calendar, ChevronRight } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const { width } = Dimensions.get('window');

export default function DashboardScreen() {
  const router = useRouter();
  const { data: events, isLoading } = useEvents();
  const { data: user } = useUserProfile();
  const [selectedHighlight, setSelectedHighlight] = useState<number | null>(null);

  const highlights = events?.filter(e => e.type === 'highlight') || [];
  const upcomingDeadlines = events
    ?.filter(e => e.type === 'deadline')
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
    .slice(0, 5) || [];

  // Extract user name from email for display
  const userName = user?.email?.split('@')[0] || 'User';
  const userDisplayName = userName
    .split('.')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
  const userSurname = userName.split('.')[userName.split('.').length - 1] || userName;

  const renderHighlight = ({ item, index }: { item: any; index: number }) => (
    <TouchableOpacity
      style={styles.highlightCard}
      onPress={() => setSelectedHighlight(index)}>
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
      {/* Hero Section with Gradient */}
      <LinearGradient
        colors={['#1e40af', '#3b82f6', '#06b6d4']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}>
        {/* Background Logo */}
        <View style={styles.logoBackground}>
          <Text style={styles.logoText}>iK</Text>
        </View>

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
      </LinearGradient>

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

      {/* Upcoming Deadlines */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Upcoming Deadlines</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        {isLoading ? (
          <Text style={styles.loadingText}>Loading...</Text>
        ) : upcomingDeadlines.length > 0 ? (
          <View style={styles.deadlinesList}>
            {upcomingDeadlines.map((deadline) => (
              <TouchableOpacity key={deadline._id} style={styles.deadlineCard}>
                <View style={styles.deadlineIcon}>
                  <Calendar size={20} color="#ef4444" />
                </View>
                <View style={styles.deadlineContent}>
                  <Text style={styles.deadlineTitle}>{deadline.title}</Text>
                  <Text style={styles.deadlineCourse}>{deadline.course}</Text>
                  <Text style={styles.deadlineDate}>
                    {new Date(deadline.start).toLocaleDateString('id-ID', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </Text>
                </View>
                <ArrowRight size={20} color="#64748b" />
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <Text style={styles.emptyText}>No upcoming deadlines</Text>
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
  hero: {
    padding: 24,
    paddingTop: 60,
    paddingBottom: 100,
    position: 'relative',
    overflow: 'hidden',
  },
  logoBackground: {
    position: 'absolute',
    right: -40,
    top: 20,
    opacity: 0.15,
  },
  logoText: {
    fontSize: 120,
    fontWeight: 'bold',
    color: '#ffffff',
    fontStyle: 'italic',
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
  primaryButton: {
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
  primaryButtonText: {
    color: '#3b82f6',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
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
  secondaryButtonText: {
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
});
