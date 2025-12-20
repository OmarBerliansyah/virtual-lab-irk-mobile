import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View, Text, Pressable, Modal, Image } from 'react-native';
import { useAuth } from '@clerk/clerk-expo';

import { useEvents } from '@/hooks/useApi';
import { useAssistants } from '@/hooks/useAssistants';
import { useUserProfile } from '@/hooks/useUserProfile';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';

type Highlight = ReturnType<typeof useEvents>['data'] extends (infer U)[] ? U : never;

export default function HomeScreen() {
  const { isSignedIn } = useAuth();
  const { user } = useUserProfile();
  const { data: events } = useEvents();
  const { data: assistants } = useAssistants(true);
  const [selected, setSelected] = useState<Highlight | null>(null);

  const highlights = useMemo(
    () => (events || []).filter((evt) => evt.type === 'highlight'),
    [events],
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <ThemedView style={styles.hero}>
        <ThemedText type="title" style={styles.heroTitle}>
          Laboratorium Ilmu Rekayasa dan Komputasi
        </ThemedText>
        <ThemedText style={styles.heroSubtitle}>
          Portal riset, asisten, dan alat virtual — kini di mobile.
        </ThemedText>
        <View style={styles.heroBadges}>
          <Badge text="Virtual Lab" />
          <Badge text="Timeline" />
          <Badge text="Assistant" />
          {isSignedIn && <Badge text={`Role: ${user?.role ?? 'user'}`} />}
        </View>
      </ThemedView>

      <Section title="Highlights" description="Kegiatan terbaru dan konten unggulan.">
        {highlights.length === 0 ? (
          <ThemedText style={styles.muted}>Belum ada highlight.</ThemedText>
        ) : (
          highlights.map((item) => (
            <Pressable key={item._id} style={styles.card} onPress={() => setSelected(item)}>
              <View style={styles.cardHeader}>
                <ThemedText type="subtitle">{item.title}</ThemedText>
                <Text style={styles.badge}>{item.course}</Text>
              </View>
              <Text style={styles.muted}>{formatDate(item.start)}</Text>
              <Text numberOfLines={2} style={styles.body}>
                {item.description || 'Tidak ada deskripsi.'}
              </Text>
            </Pressable>
          ))
        )}
      </Section>

      <Section title="Our Team" description="Asisten laboratorium aktif.">
        {assistants && assistants.length > 0 ? (
          <View style={styles.assistantGrid}>
            {assistants.map((asst) => (
              <View key={asst._id} style={styles.assistantCard}>
                <Image
                  source={{ uri: asst.image || 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&q=80' }}
                  style={styles.avatar}
                />
                <ThemedText type="defaultSemiBold">{asst.name}</ThemedText>
                <Text style={styles.muted}>{asst.role}</Text>
                <Text style={styles.meta}>{asst.angkatan}</Text>
              </View>
            ))}
          </View>
        ) : (
          <ThemedText style={styles.muted}>Belum ada data asisten.</ThemedText>
        )}
      </Section>

      <Modal visible={!!selected} animationType="slide" transparent onRequestClose={() => setSelected(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            {selected?.photoUrl ? (
              <Image source={{ uri: selected.photoUrl }} style={styles.modalImage} />
            ) : null}
            <ThemedText type="title">{selected?.title}</ThemedText>
            <Text style={styles.muted}>{selected ? formatDate(selected.start) : ''}</Text>
            <Text style={styles.body}>{selected?.description || 'Tidak ada deskripsi.'}</Text>
            {selected?.linkAttachments?.map((link) => (
              <Text key={link.url} style={styles.link}>{link.title} — {link.url}</Text>
            ))}
            <Pressable style={styles.closeBtn} onPress={() => setSelected(null)}>
              <Text style={styles.closeText}>Tutup</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const Badge = ({ text }: { text: string }) => (
  <View style={styles.badgePill}>
    <Text style={styles.badgeText}>{text}</Text>
  </View>
);

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });

const Section = ({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) => (
  <View style={styles.section}>
    <View style={styles.sectionHeader}>
      <ThemedText type="subtitle">{title}</ThemedText>
      {description && <Text style={styles.muted}>{description}</Text>}
    </View>
    {children}
  </View>
);

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 16,
  },
  hero: {
    backgroundColor: Colors.light.tint,
    padding: 16,
    borderRadius: 16,
  },
  heroTitle: {
    color: '#fff',
    marginBottom: 6,
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.9)',
  },
  heroBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  section: {
    backgroundColor: Colors.light.background,
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  sectionHeader: {
    gap: 4,
  },
  muted: {
    color: '#666',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#eee',
    borderRadius: 12,
    fontSize: 12,
  },
  badgePill: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  badgeText: {
    color: '#fff',
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    gap: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  body: {
    color: '#111',
  },
  assistantGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  assistantCard: {
    width: '48%',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 999,
    marginBottom: 6,
  },
  meta: {
    color: '#444',
    fontSize: 12,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    gap: 10,
  },
  modalImage: {
    width: '100%',
    height: 160,
    borderRadius: 12,
  },
  link: {
    color: Colors.light.tint,
  },
  closeBtn: {
    alignSelf: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: Colors.light.tint,
    borderRadius: 10,
  },
  closeText: {
    color: '#fff',
    fontWeight: '600',
  },
});
