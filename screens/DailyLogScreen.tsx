import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

interface Reflection {
  id: string;
  date: string;
  time: string;
  summary: string;
  mood: 'positive' | 'neutral' | 'challenging';
  duration: string;
  dayOfWeek: string;
}

export default function DailyLogScreen() {
  const [reflections] = useState<Reflection[]>([
    {
      id: '1',
      date: 'Dec 28, 2023',
      time: '9:30 AM',
      summary: 'Morning reflection on career goals and personal growth',
      mood: 'positive',
      duration: '15 min',
      dayOfWeek: 'Thu',
    },
    {
      id: '2',
      date: 'Dec 27, 2023',
      time: '8:45 PM',
      summary: 'Evening reflection on work-life balance and relationships',
      mood: 'neutral',
      duration: '12 min',
      dayOfWeek: 'Wed',
    },
    {
      id: '3',
      date: 'Dec 26, 2023',
      time: '7:15 PM',
      summary: 'Reflection on challenges faced during the day',
      mood: 'challenging',
      duration: '10 min',
      dayOfWeek: 'Tue',
    },
  ]);

  const getMoodColors = (mood: Reflection['mood']): [string, string] => {
    switch (mood) {
      case 'positive':
        return ['#10B981', '#059669'];
      case 'neutral':
        return ['#6B7280', '#4B5563'];
      case 'challenging':
        return ['#EF4444', '#DC2626'];
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Daily Log</Text>
          <Text style={styles.subtitle}>Track your reflection journey</Text>
        </View>
        <TouchableOpacity style={styles.calendarButton}>
          <LinearGradient
            colors={['#8B5CF6', '#7C3AED']}
            style={styles.calendarGradient}
          >
            <Ionicons name="calendar" size={20} color="white" />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Stats Overview */}
      <View style={styles.statsContainer}>
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.statsGradient}
        >
          <View style={styles.statsContent}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>28</Text>
              <Text style={styles.statLabel}>Reflections</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>7</Text>
              <Text style={styles.statLabel}>Day Streak</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>12.5</Text>
              <Text style={styles.statLabel}>Avg. Minutes</Text>
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* Reflections List */}
      <ScrollView style={styles.listContainer} showsVerticalScrollIndicator={false}>
        {reflections.map((reflection, index) => (
          <TouchableOpacity
            key={reflection.id}
            style={[
              styles.reflectionCard,
              index === 0 && styles.firstCard
            ]}
            onPress={() => {/* TODO: Navigate to detail view */}}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={getMoodColors(reflection.mood)}
              style={styles.dayIndicator}
            >
              <Text style={styles.dayText}>{reflection.dayOfWeek}</Text>
            </LinearGradient>
            
            <View style={styles.reflectionContent}>
              <View style={styles.reflectionHeader}>
                <Text style={styles.date}>{reflection.date}</Text>
                <View style={styles.durationBadge}>
                  <Text style={styles.duration}>{reflection.duration}</Text>
                </View>
              </View>
              
              <Text style={styles.summary} numberOfLines={2}>
                {reflection.summary}
              </Text>
              
              <View style={styles.reflectionFooter}>
                <Text style={styles.time}>{reflection.time}</Text>
                <View style={styles.chevronContainer}>
                  <Ionicons name="chevron-forward" size={14} color="#8B5CF6" />
                </View>
              </View>
            </View>
          </TouchableOpacity>
        ))}
        
        {/* Add some bottom padding */}
        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
  },
  calendarButton: {
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  calendarGradient: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsContainer: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  statsGradient: {
    borderRadius: 20,
    padding: 20,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
  statsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: 16,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
    textAlign: 'center',
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 24,
  },
  reflectionCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 18,
    marginBottom: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  firstCard: {
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  dayIndicator: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  dayText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
  },
  reflectionContent: {
    flex: 1,
  },
  reflectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  date: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  durationBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  duration: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  summary: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
    marginBottom: 8,
  },
  reflectionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  time: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },
  chevronContainer: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});