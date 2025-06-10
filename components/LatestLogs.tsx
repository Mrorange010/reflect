// components/LatestLogs.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { 
  FadeInUp, 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  useAnimatedGestureHandler,
  runOnJS,
} from 'react-native-reanimated';
import { PanGestureHandler } from 'react-native-gesture-handler';
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
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);

  const gestureHandler = useAnimatedGestureHandler({
    onStart: () => {
      scale.value = withSpring(0.98);
    },
    onActive: (event) => {
      translateX.value = event.translationX * 0.1;
    },
    onEnd: () => {
      scale.value = withSpring(1);
      translateX.value = withSpring(0);
      runOnJS(onPress)();
    },
  });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateX: translateX.value },
    ],
  }));

  const getMoodColor = (score: number) => {
    if (score >= 8) return '#34C759';
    if (score >= 6) return '#007AFF';
    if (score >= 4) return '#FF9500';
    return '#FF3B30';
  };

  const getMoodEmoji = (score: number) => {
    if (score >= 8) return '😊';
    if (score >= 6) return '🙂';
    if (score >= 4) return '😐';
    return '😔';
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
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const getQualityIndicator = (quality?: number) => {
    if (!quality) return null;
    
    if (quality >= 8) return { icon: 'star', color: '#34C759' };
    if (quality >= 6) return { icon: 'star-half', color: '#FF9500' };
    return { icon: 'star-outline', color: '#8E8E93' };
  };

  const qualityIndicator = getQualityIndicator(log.reflection_quality);

  return (
    <PanGestureHandler onGestureEvent={gestureHandler}>
      <Animated.View
        style={[
          styles.logCard,
          isDark && styles.logCardDark,
          animatedStyle,
        ]}
        entering={FadeInUp.delay(index * 100).duration(600)}
      >
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <View style={styles.dateSection}>
              <Text style={[styles.dateText, isDark && styles.dateTextDark]}>
                {formatDate(log.log_date)}
              </Text>
              <View style={styles.timeIndicator}>
                <View style={[styles.timeDot, { backgroundColor: getMoodColor(log.mood_score) }]} />
                <Text style={[styles.timeText, isDark && styles.timeTextDark]}>
                  {new Date(log.log_date).toLocaleTimeString('en-US', { 
                    hour: 'numeric', 
                    minute: '2-digit',
                    hour12: false 
                  })}
                </Text>
              </View>
            </View>
            
            <View style={styles.moodSection}>
              <View style={[styles.moodBadge, { backgroundColor: getMoodColor(log.mood_score) }]}>
                <Text style={styles.moodEmoji}>{getMoodEmoji(log.mood_score)}</Text>
                <Text style={styles.moodScore}>
                  {log.mood_score != null ? log.mood_score.toFixed(1) : '--'}
                </Text>
              </View>
              {qualityIndicator && (
                <View style={styles.qualityBadge}>
                  <Ionicons 
                    name={qualityIndicator.icon as any} 
                    size={12} 
                    color={qualityIndicator.color} 
                  />
                </View>
              )}
            </View>
          </View>

          {log.summary && (
            <Text 
              style={[styles.summaryText, isDark && styles.summaryTextDark]} 
              numberOfLines={2}
            >
              {log.summary}
            </Text>
          )}

          {log.emotional_tags && (
            <View style={styles.tagsContainer}>
              {log.emotional_tags.split(',').slice(0, 3).map((tag, i) => (
                <View key={i} style={[styles.tag, isDark && styles.tagDark]}>
                  <Text style={[styles.tagText, isDark && styles.tagTextDark]}>
                    {tag.trim()}
                  </Text>
                </View>
              ))}
              {log.emotional_tags.split(',').length > 3 && (
                <Text style={[styles.moreTagsText, isDark && styles.moreTagsTextDark]}>
                  +{log.emotional_tags.split(',').length - 3} more
                </Text>
              )}
            </View>
          )}

          {log.energy_level && (
            <View style={styles.energySection}>
              <Ionicons name="flash-outline" size={14} color="#FF9500" />
              <Text style={[styles.energyText, isDark && styles.energyTextDark]}>
                Energy: {log.energy_level.toFixed(1)}/10
              </Text>
            </View>
          )}
        </View>

        <View style={styles.cardActions}>
          <Ionicons 
            name="chevron-forward" 
            size={16} 
            color={isDark ? '#48484A' : '#C7C7CC'} 
          />
        </View>
      </Animated.View>
    </PanGestureHandler>
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
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 0.5,
    borderColor: '#E5E5EA',
    alignItems: 'center',
  },
  logCardDark: {
    backgroundColor: '#1C1C1E',
    borderColor: '#38383A',
    shadowOpacity: 0.2,
  },
  cardContent: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  dateSection: {
    flex: 1,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 2,
    letterSpacing: -0.2,
  },
  dateTextDark: {
    color: '#FFFFFF',
  },
  timeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  timeText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#8E8E93',
  },
  timeTextDark: {
    color: '#8E8E93',
  },
  moodSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  moodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  moodEmoji: {
    fontSize: 14,
  },
  moodScore: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  qualityBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryText: {
    fontSize: 15,
    lineHeight: 21,
    color: '#3C3C43',
    marginBottom: 8,
    fontWeight: '400',
  },
  summaryTextDark: {
    color: '#EBEBF5',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
    alignItems: 'center',
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
    fontSize: 12,
    fontWeight: '500',
    color: '#3C3C43',
  },
  tagTextDark: {
    color: '#EBEBF5',
  },
  moreTagsText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#8E8E93',
    fontStyle: 'italic',
  },
  moreTagsTextDark: {
    color: '#8E8E93',
  },
  energySection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  energyText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#8E8E93',
  },
  energyTextDark: {
    color: '#8E8E93',
  },
  cardActions: {
    marginLeft: 12,
    padding: 4,
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