import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Tabs, useRouter } from 'expo-router';
import { Beaker, Home, User } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const tintColor = Colors[colorScheme ?? 'light'].tint;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#ffffff',
        tabBarInactiveTintColor: '#94a3b8',
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#1e3a8a',
          borderTopWidth: 0,
          height: 70,
          paddingBottom: 10,
          paddingTop: 10,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => <Home size={size || 24} color={color} />,
          tabBarActiveTintColor: '#ffffff',
        }}
      />
      <Tabs.Screen
        name="virtual-lab"
        options={{
          title: '',
          tabBarIcon: () => null,
          tabBarButton: (props) => (
            <View style={styles.fabContainer}>
              <TouchableOpacity
                style={styles.fab}
                onPress={() => router.push('/(tabs)/virtual-lab')}
                activeOpacity={0.8}>
                <Beaker size={32} color="#ffffff" />
              </TouchableOpacity>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <User size={size || 24} color={color} />,
          tabBarActiveTintColor: '#ffffff',
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  fabContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -30,
  },
  fab: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#06b6d4',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});
