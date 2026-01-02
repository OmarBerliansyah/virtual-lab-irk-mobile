import { useEvents } from '@/hooks/useMockApi';
import { Image as ExpoImage } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Award, Calendar, ExternalLink } from 'lucide-react-native';
import React from 'react';
import {
    ActivityIndicator,
    Linking,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function HighlightDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: events, isLoading } = useEvents();

  const highlight = events?.find(e => e._id === id && e.type === 'highlight');

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading highlight...</Text>
      </View>
    );
  }

  if (!highlight) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color="#3b82f6" />
          </TouchableOpacity>
          <Text style={styles.title}>Highlight Details</Text>
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Highlight not found</Text>
        </View>
      </View>
    );
  }

  const handleLinkPress = async (url: string) => {
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      }
    } catch (error) {
      console.error('Error opening link:', error);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#3b82f6" />
        </TouchableOpacity>
        <Text style={styles.title}>Highlight Details</Text>
      </View>

      {/* Image */}
      {highlight.photoUrl ? (
        <ExpoImage
          source={{ uri: highlight.photoUrl }}
          style={styles.image}
          contentFit="cover"
        />
      ) : (
        <View style={[styles.image, styles.imagePlaceholder]}>
          <Award size={64} color="#3b82f6" />
        </View>
      )}

      {/* Content */}
      <View style={styles.card}>
        <View style={styles.badgeContainer}>
          <View style={styles.badge}>
            <Award size={16} color="#ffffff" />
            <Text style={styles.badgeText}>HIGHLIGHT</Text>
          </View>
          <View style={styles.courseBadge}>
            <Text style={styles.courseText}>{highlight.course}</Text>
          </View>
        </View>

        <Text style={styles.highlightTitle}>{highlight.title}</Text>

        <View style={styles.dateContainer}>
          <Calendar size={18} color="#64748b" />
          <Text style={styles.dateText}>
            {new Date(highlight.start).toLocaleDateString('id-ID', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        </View>

        {highlight.description && (
          <View style={styles.descriptionContainer}>
            <Text style={styles.description}>{highlight.description}</Text>
          </View>
        )}

        {highlight.linkAttachments && highlight.linkAttachments.length > 0 && (
          <View style={styles.linksContainer}>
            <Text style={styles.linksTitle}>Related Links:</Text>
            {highlight.linkAttachments.map((link, index) => (
              <TouchableOpacity
                key={index}
                style={styles.linkButton}
                onPress={() => handleLinkPress(link.url)}>
                <ExternalLink size={18} color="#3b82f6" />
                <Text style={styles.linkText}>{link.title}</Text>
              </TouchableOpacity>
            ))}
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
  content: {
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
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
    backgroundColor: '#ffffff',
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
  image: {
    width: '100%',
    height: 300,
    backgroundColor: '#f1f5f9',
  },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    padding: 24,
    gap: 16,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#22c55e',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  courseBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  courseText: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '600',
  },
  highlightTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0f172a',
    lineHeight: 36,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  dateText: {
    fontSize: 16,
    color: '#64748b',
  },
  descriptionContainer: {
    marginTop: 8,
  },
  description: {
    fontSize: 16,
    color: '#334155',
    lineHeight: 24,
  },
  linksContainer: {
    marginTop: 16,
    gap: 12,
  },
  linksTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 8,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  linkText: {
    fontSize: 16,
    color: '#3b82f6',
    fontWeight: '600',
  },
});

