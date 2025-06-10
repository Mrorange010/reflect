// components/RecentLogsPreview.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ColorValue } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../constants/colors';

const { width } = Dimensions.get('window');

interface LogPreview {
  id: string;
  log_date: string;
  mood_score: number;
  summary?: string;
  emotional_tags?: string;
}

interface RecentLogsPreviewProps {
  logs: LogPreview[];
}

const RecentLogsPreview: React.FC<RecentLogsPreviewProps> = ({ logs }) => {
  const navigation = useNavigation();

  const getMoodColor = (score: number) => {
    if (score >= 8) return Colors.mint;
    if (score >= 5) return Colors.skyBlue;
    return Colors.electricCoral;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>Recent Reflections 📝</Text>
        <TouchableOpacity 
          style={styles.seeAllButton}
          onPress={() => (navigation as any).navigate('WeeklyLog')}
        >
          <Text style={styles.seeAllText}>See all</Text>
          <Ionicons name="arrow-forward" size={16} color={Colors.electricCoral} />
        </TouchableOpacity>
      </View>

      {logs.length === 0 ? (
        <View style={styles.emptyCard}>
          <LinearGradient
            colors={Colors.gradientAurora as unknown as [ColorValue, ColorValue, ...ColorValue[]]}
            style={styles.emptyGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="book-outline" size={48} color={Colors.white} />
            <Text style={styles.emptyTitle}>Start Your Journey</Text>
            <Text style={styles.emptyText}>Your reflections will appear here</Text>
          </LinearGradient>
        </View>
      ) : (
        logs.map((log, index) => (
          <Animated.View
            key={log.id}
            entering={FadeInUp.delay(index * 100).duration(600)}
          >
            <TouchableOpacity
              style={styles.logCard}
              onPress={() => (navigation as any).navigate('LogDetail', { logId: log.id })}
              activeOpacity={0.8}
            >
              <View style={styles.logHeader}>
                <View style={styles.dateContainer}>
                  <Text style={styles.logDate}>{formatDate(log.log_date)}</Text>
                  <View style={[styles.moodBadge, { backgroundColor: getMoodColor(log.mood_score) }]}>
                    <Text style={styles.moodScore}>{log.mood_score}</Text>
                  </View>
                </View>
              </View>
              
              {log.summary && (
                <Text style={styles.logSummary} numberOfLines={2}>
                  {log.summary}
                </Text>
              )}
              
              {log.emotional_tags && (
                <View style={styles.tagsContainer}>
                  {log.emotional_tags.split(',').slice(0, 3).map((tag, i) => (
                    <View key={i} style={styles.tag}>
                      <Text style={styles.tagText}>{tag.trim()}</Text>
                    </View>
                  ))}
                </View>
              )}
            </TouchableOpacity>
          </Animated.View>
        ))
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textDark,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  seeAllText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.electricCoral,
  },
  logCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 20,
    marginBottom: 12,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  logHeader: {
    marginBottom: 12,
  },
  dateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logDate: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textDark,
  },
  moodBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  moodScore: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.white,
  },
  logSummary: {
    fontSize: 15,
    lineHeight: 22,
    color: Colors.textMuted,
    marginBottom: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: `${Colors.neonLavender}20`,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.neonLavender,
  },
  emptyCard: {
    borderRadius: 24,
    overflow: 'hidden',
    marginTop: 8,
  },
  emptyGradient: {
    padding: 40,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.white,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.white,
    opacity: 0.9,
  },
});

export default RecentLogsPreview;