import PathfindingSimulation from '@/components/lab/PathfindingSimulation';
import RegexTester from '@/components/lab/RegexTester';
import SLESolver from '@/components/lab/SLESolver';
import { Beaker } from 'lucide-react-native';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type TabType = 'regex' | 'sle' | 'pathfinding';

export default function VirtualLabScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('regex');

  const tabs = [
    { id: 'regex' as TabType, label: 'Regex Tester' },
    { id: 'sle' as TabType, label: 'SLE Solver' },
    { id: 'pathfinding' as TabType, label: 'Pathfinding' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Beaker size={32} color="#3b82f6" />
        <Text style={styles.title}>Virtual Laboratory</Text>
        <Text style={styles.subtitle}>
          Explore powerful computational tools
        </Text>
      </View>

      <View style={styles.tabContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && styles.activeTab]}
            onPress={() => setActiveTab(tab.id)}>
            <Text
              style={[
                styles.tabText,
                activeTab === tab.id && styles.activeTabText,
              ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'regex' && <RegexTester />}
        {activeTab === 'sle' && <SLESolver />}
        {activeTab === 'pathfinding' && <PathfindingSimulation />}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    padding: 24,
    paddingTop: 60,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0f172a',
    marginTop: 12,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#3b82f6',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
  },
  activeTabText: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
});
