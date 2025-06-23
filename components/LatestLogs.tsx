// components/LatestLogs.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { 
  FadeInUp, 
} from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

interface LogPreview {
  id: string;
  log_date: string;
  mood_score: number;
  energy_level?: number;
  summary?: string;
  emotional_tags?: string;
  reflection_quality?: number;
}

interface LatestLogsProps {
  logs: LogPreview[];
  isDark: boolean;
}

const LogCard: React.FC<{
  log: LogPreview;
  index: number;
  isDark: boolean;
  onPress: () => void;
}> = ({ log, index, isDark, onPress }) => {
  const getMoodColor = (score: number) => {
    if (score >= 8) return '#34C759';
    if (score >= 6) return '#007AFF';
    if (score >= 4) return '#FF9500';
    return '#FF3B30';
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
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  return (
    <Animated.View entering={FadeInUp.delay(index * 100).duration(600)}>
      <TouchableOpacity
        style={[styles.logCard, isDark && styles.logCardDark]}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <Text style={[styles.dateLabel, isDark && styles.dateLabelDark]}>
              {formatDate(log.log_date)}
            </Text>
            <Text style={[styles.timeText, isDark && styles.timeTextDark]}>
              {new Date(log.log_date).toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                minute: '2-digit',
                hour12: true 
              })}
            </Text>
          </View>
          
          <View style={styles.cardHeaderRight}>
            {log.reflection_quality && (
              <View style={[styles.qualityBadge, isDark && styles.qualityBadgeDark]}>
                <Ionicons name="star" size={12} color="#FF9500" />
                <Text style={[styles.qualityText, isDark && styles.qualityTextDark]}>
                  {log.reflection_quality}
                </Text>
              </View>
            )}
            <Ionicons 
              name="chevron-forward" 
              size={16} 
              color={isDark ? '#48484A' : '#C7C7CC'} 
            />
          </View>
        </View>

        {log.summary ? (
          <Text 
            style={[styles.summaryText, isDark && styles.summaryTextDark]} 
            numberOfLines={2}
          >
            {log.summary}
          </Text>
        ) : (
          <Text 
            style={[styles.placeholderText, isDark && styles.placeholderTextDark]} 
            numberOfLines={2}
          >
            Daily reflection and mood tracking entry
          </Text>
        )}

        <View style={styles.metricsRow}>
          <View style={styles.metricItem}>
            <View style={[styles.metricBadge, { backgroundColor: getMoodColor(log.mood_score) }]}>
              <Ionicons name="happy-outline" size={14} color="#FFFFFF" />
              <Text style={styles.metricValue}>
                {log.mood_score ? log.mood_score.toFixed(1) : '—'}
              </Text>
            </View>
            <Text style={[styles.metricLabel, isDark && styles.metricLabelDark]}>Mood</Text>
          </View>

          <View style={styles.metricItem}>
            <View style={[styles.metricBadge, { backgroundColor: '#34C759' }]}>
              <Ionicons name="flash-outline" size={14} color="#FFFFFF" />
              <Text style={styles.metricValue}>
                {log.energy_level ? log.energy_level.toFixed(1) : '—'}
              </Text>
            </View>
            <Text style={[styles.metricLabel, isDark && styles.metricLabelDark]}>Energy</Text>
          </View>

          {log.emotional_tags && (
            <View style={styles.tagsContainer}>
              {log.emotional_tags.split(',').slice(0, 2).map((tag, i) => {
                const trimmedTag = tag.trim();
                if (!trimmedTag) return null;
                return (
                  <View key={i} style={[styles.tag, isDark && styles.tagDark]}>
                    <Text style={[styles.tagText, isDark && styles.tagTextDark]}>
                      {trimmedTag}
                    </Text>
                  </View>
                );
              }).filter(Boolean)}
              {log.emotional_tags.split(',').length > 2 && (
                <Text style={[styles.moreTagsText, isDark && styles.moreTagsTextDark]}>
                  +{log.emotional_tags.split(',').length - 2}
                </Text>
              )}
            </View>
          )}
        </View>

        {/* Additional insights row */}
        <View style={styles.insightsRow}>
          <View style={styles.insightItem}>
            <Ionicons name="time-outline" size={14} color={isDark ? '#8E8E93' : '#8E8E93'} />
            <Text style={[styles.insightText, isDark && styles.insightTextDark]}>
              {new Date(log.log_date).toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                minute: '2-digit',
                hour12: true 
              })}
            </Text>
          </View>
          
          <View style={styles.insightItem}>
            <Ionicons name="trending-up" size={14} color={log.mood_score >= 7 ? '#34C759' : log.mood_score >= 5 ? '#FF9500' : '#FF3B30'} />
            <Text style={[styles.insightText, isDark && styles.insightTextDark]}>
              {log.mood_score >= 7 ? 'Good day' : log.mood_score >= 5 ? 'Moderate' : 'Challenging'}
            </Text>
          </View>

          {log.reflection_quality && (
            <View style={styles.insightItem}>
              <Ionicons name="checkmark-circle" size={14} color="#34C759" />
              <Text style={[styles.insightText, isDark && styles.insightTextDark]}>
                Quality: {log.reflection_quality}/10
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const LatestLogs: React.FC<LatestLogsProps> = ({ logs, isDark }) => {
  const navigation = useNavigation();

  const handleLogPress = (logId: string) => {
    // Navigate to log detail
    (navigation as any).navigate('LogDetail', { logId });
  };

  const handleSeeAllPress = () => {
    (navigation as any).navigate('WeeklyLog');
  };

  if (!logs || logs.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>
            Latest Logs
          </Text>
        </View>
        
        <View style={[styles.emptyCard, isDark && styles.emptyCardDark]}>
          <LinearGradient
            colors={isDark ? ['#1C1C1E', '#2C2C2E'] : ['#F2F2F7', '#FFFFFF']}
            style={styles.emptyGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons 
              name="journal-outline" 
              size={48} 
              color={isDark ? '#48484A' : '#C7C7CC'} 
            />
            <Text style={[styles.emptyTitle, isDark && styles.emptyTitleDark]}>
              Start Your Journey
            </Text>
            <Text style={[styles.emptyText, isDark && styles.emptyTextDark]}>
              Your reflections will appear here
            </Text>
            <TouchableOpacity 
              style={[styles.startButton, isDark && styles.startButtonDark]}
              onPress={() => (navigation as any).navigate('Call')}
            >
              <Text style={styles.startButtonText}>Begin Reflection</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>
          Latest Logs
        </Text>
        <TouchableOpacity 
          style={styles.seeAllButton}
          onPress={handleSeeAllPress}
        >
          <Text style={styles.seeAllText}>See All</Text>
          <Ionicons name="chevron-forward" size={14} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.logsContainer}>
        {logs.map((log, index) => (
          <LogCard
            key={log.id}
            log={log}
            index={index}
            isDark={isDark}
            onPress={() => handleLogPress(log.id)}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 32,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#000000',
    letterSpacing: -0.3,
  },
  sectionTitleDark: {
    color: '#FFFFFF',
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  seeAllText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#007AFF',
  },
  logsContainer: {
    paddingHorizontal: 20,
    gap: 12,
  },
  logCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 0.5,
    borderColor: '#E5E5EA',
  },
  logCardDark: {
    backgroundColor: '#1C1C1E',
    borderColor: '#38383A',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flex: 1,
  },
  cardHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateLabel: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
    letterSpacing: -0.2,
  },
  dateLabelDark: {
    color: '#FFFFFF',
  },
  timeText: {
    fontSize: 15,
    color: '#8E8E93',
    fontWeight: '500',
    marginTop: 2,
  },
  timeTextDark: {
    color: '#8E8E93',
  },
  qualityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#FFF8DC',
    borderRadius: 8,
    gap: 4,
  },
  qualityBadgeDark: {
    backgroundColor: '#2C2C2E',
  },
  qualityText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF9500',
  },
  qualityTextDark: {
    color: '#FF9500',
  },
  summaryText: {
    fontSize: 15,
    lineHeight: 21,
    color: '#3C3C43',
    marginBottom: 12,
    fontWeight: '400',
  },
  summaryTextDark: {
    color: '#EBEBF5',
  },
  placeholderText: {
    fontSize: 15,
    lineHeight: 21,
    color: '#8E8E93',
    marginBottom: 12,
    fontWeight: '400',
    fontStyle: 'italic',
  },
  placeholderTextDark: {
    color: '#8E8E93',
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  metricItem: {
    alignItems: 'center',
    gap: 4,
  },
  metricBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  metricValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#8E8E93',
  },
  metricLabelDark: {
    color: '#8E8E93',
  },
  tagsContainer: {
    flexDirection: 'row',
    gap: 6,
    flex: 1,
    justifyContent: 'flex-end',
  },
  tag: {
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tagDark: {
    backgroundColor: '#2C2C2E',
  },
  tagText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#3C3C43',
  },
  tagTextDark: {
    color: '#EBEBF5',
  },
  moreTagsText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#8E8E93',
    fontStyle: 'italic',
  },
  moreTagsTextDark: {
    color: '#8E8E93',
  },
  insightsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 12,
    flexWrap: 'wrap',
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  insightText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#8E8E93',
  },
  insightTextDark: {
    color: '#8E8E93',
  },
  emptyCard: {
    marginHorizontal: 20,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  emptyCardDark: {
    shadowOpacity: 0.3,
  },
  emptyGradient: {
    padding: 32,
    alignItems: 'center',
    gap: 12,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    letterSpacing: -0.3,
  },
  emptyTitleDark: {
    color: '#FFFFFF',
  },
  emptyText: {
    fontSize: 15,
    color: '#8E8E93',
    textAlign: 'center',
    fontWeight: '400',
  },
  emptyTextDark: {
    color: '#8E8E93',
  },
  startButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  startButtonDark: {
    backgroundColor: '#0A84FF',
  },
  startButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default LatestLogs;