import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import Animated, { 
  FadeInUp, 
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { supabase } from '../utils/supabase';
import { useTheme } from '../contexts/ThemeContext';

const { width } = Dimensions.get('window');

interface Reflection {
  id: string;
  week_start_date: string;
  mood_score: number | null;
  energy_level: number | null;
  weekly_goals: string | null;
  challenges: string | null;
  achievements: string | null;
  weekend_plans: string | null;
  notable_events: string | null;
  sentiment: string | null;
  emotional_tags: string | null;
  reflection_quality: number | null;
  summary: string | null;
  coaching_prompts: string | null;
  created_at: string;
  updated_at: string;
}

// Apple Health-style subtle gradient background (matching dashboard)
const HealthGradientBackground = () => {
  const { isDark } = useTheme();
  return (
    <View style={StyleSheet.absoluteFillObject}>
      {/* Background color */}
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: isDark ? '#000000' : '#FFFFFF' }]} />
      
      {/* Top subtle gradient overlay - matching dashboard style */}
      <LinearGradient
        colors={isDark 
          ? ['rgba(0, 122, 255, 0.25)', 'rgba(52, 199, 89, 0.1)', 'transparent'] as const
          : ['rgba(0, 122, 255, 0.15)', 'rgba(52, 199, 89, 0.08)', 'transparent'] as const
        }
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 300, // Only covers top portion like dashboard
        }}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        locations={[0, 0.6, 1]}
      />
    </View>
  );
};

// Reflection Card Component
const ReflectionCard = ({ reflection, index, isDark, onPress }: { 
  reflection: Reflection, 
  index: number, 
  isDark: boolean,
  onPress: () => void 
}) => {
  const getMoodColor = (moodScore: number | null): string => {
    if (!moodScore || moodScore === 0) return '#8E8E93';
    if (moodScore >= 8) return '#34C759';
    if (moodScore >= 6) return '#007AFF';
    if (moodScore >= 4) return '#FF9500';
    return '#FF3B30';
  };

  const formatWeekRange = (weekStartDate: string): string => {
    try {
      const startDate = new Date(weekStartDate);
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      
      return `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  const getWeekNumber = (weekStartDate: string): string => {
    try {
      const startDate = new Date(weekStartDate);
      const startOfYear = new Date(startDate.getFullYear(), 0, 1);
      const days = Math.floor((startDate.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
      const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
      return `Week ${weekNumber}`;
    } catch (error) {
      console.error('Error calculating week number:', error);
      return 'Week --';
    }
  };

  return (
    <Animated.View entering={FadeInUp.delay(index * 100).duration(600)}>
      <TouchableOpacity
        style={[styles.reflectionCard, isDark && styles.reflectionCardDark]}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <Text style={[styles.weekLabel, isDark && styles.weekLabelDark]}>
              {getWeekNumber(reflection.week_start_date)}
            </Text>
            <Text style={[styles.dateRange, isDark && styles.dateRangeDark]}>
              {formatWeekRange(reflection.week_start_date)}
            </Text>
          </View>
          
          <View style={styles.cardHeaderRight}>
            {reflection.reflection_quality && (
              <View style={[styles.qualityBadge, isDark && styles.qualityBadgeDark]}>
                <Ionicons name="star" size={12} color="#FF9500" />
                <Text style={[styles.qualityText, isDark && styles.qualityTextDark]}>
                  {reflection.reflection_quality}
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

        {reflection.summary && (
          <Text 
            style={[styles.summaryText, isDark && styles.summaryTextDark]} 
            numberOfLines={2}
          >
            {reflection.summary}
          </Text>
        )}

        <View style={styles.metricsRow}>
          <View style={styles.metricItem}>
            <View style={[styles.metricBadge, { backgroundColor: getMoodColor(reflection.mood_score) }]}>
              <Ionicons name="happy-outline" size={14} color="#FFFFFF" />
              <Text style={styles.metricValue}>
                {reflection.mood_score ? reflection.mood_score.toFixed(1) : '—'}
              </Text>
            </View>
            <Text style={[styles.metricLabel, isDark && styles.metricLabelDark]}>Mood</Text>
          </View>

          <View style={styles.metricItem}>
            <View style={[styles.metricBadge, { backgroundColor: '#34C759' }]}>
              <Ionicons name="flash-outline" size={14} color="#FFFFFF" />
              <Text style={styles.metricValue}>
                {reflection.energy_level ? reflection.energy_level.toFixed(1) : '—'}
              </Text>
            </View>
            <Text style={[styles.metricLabel, isDark && styles.metricLabelDark]}>Energy</Text>
          </View>

          {reflection.emotional_tags && (
            <View style={styles.tagsContainer}>
              {reflection.emotional_tags.split(',').slice(0, 2).map((tag, i) => {
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
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function WeeklyReflectionsScreen() {
  const navigation = useNavigation<any>();
  const { isDark } = useTheme();
  
  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReflections = async () => {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.error('No authenticated user');
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('weekly_reflections')
          .select('*')
          .eq('user_id', user.id)
          .order('week_start_date', { ascending: false });
          
        if (error) {
          console.error('Error fetching reflections:', error.message);
        } else {
          console.log('Fetched reflections:', data); // Debug log
          setReflections(data || []);
        }
      } catch (error) {
        console.error('Error in fetchReflections:', error);
      }
      setLoading(false);
    };
    fetchReflections();
  }, []);

  if (loading) {
    return (
      <View style={[styles.container, isDark && styles.containerDark]}>
        <HealthGradientBackground />
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <View style={styles.loadingContainer}>
            <Ionicons 
              name="sync-outline" 
              size={48} 
              color={isDark ? '#8E8E93' : '#C7C7CC'} 
            />
            <Text style={[styles.loadingText, isDark && styles.loadingTextDark]}>
              Loading reflections...
            </Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      <HealthGradientBackground />
      
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Header */}
          <Animated.View style={styles.header} entering={FadeInDown.delay(100).duration(600)}>
            <View>
              <Text style={[styles.title, isDark && styles.titleDark]}>
                Weekly Reflections
              </Text>
            </View>
          </Animated.View>

          {/* Reflections List */}
          <View style={styles.reflectionsSection}>
            {reflections.length === 0 ? (
              <Animated.View 
                style={[styles.emptyCard, isDark && styles.emptyCardDark]}
                entering={FadeInUp.delay(400).duration(600)}
              >
                <Ionicons 
                  name="journal-outline" 
                  size={48} 
                  color={isDark ? '#48484A' : '#C7C7CC'} 
                />
                <Text style={[styles.emptyTitle, isDark && styles.emptyTitleDark]}>
                  No Reflections Yet
                </Text>
                <Text style={[styles.emptyText, isDark && styles.emptyTextDark]}>
                  Start your journey by creating your first weekly reflection
                </Text>
                <TouchableOpacity 
                  style={[styles.startButton, isDark && styles.startButtonDark]}
                  onPress={() => navigation.navigate('Call')}
                >
                  <Text style={styles.startButtonText}>Begin Reflection</Text>
                </TouchableOpacity>
              </Animated.View>
            ) : (
              <View style={styles.reflectionsList}>
                {reflections.map((reflection, index) => (
                  <ReflectionCard
                    key={reflection.id}
                    reflection={reflection}
                    index={index}
                    isDark={isDark}
                    onPress={() => navigation.navigate('ReflectionDetail', { reflection })}
                  />
                ))}
              </View>
            )}
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  containerDark: {
    backgroundColor: '#000000',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    color: '#000000',
    letterSpacing: -0.5,
  },
  titleDark: {
    color: '#FFFFFF',
  },
  scrollContent: {
    paddingBottom: 20,
  },

  // Reflections Section
  reflectionsSection: {
    marginBottom: 32,
  },
  reflectionsList: {
    paddingHorizontal: 20,
    gap: 12,
  },
  reflectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 0.5,
    borderColor: '#E5E5EA',
  },
  reflectionCardDark: {
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
  weekLabel: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
    letterSpacing: -0.2,
  },
  weekLabelDark: {
    color: '#FFFFFF',
  },
  dateRange: {
    fontSize: 15,
    color: '#8E8E93',
    fontWeight: '500',
    marginTop: 2,
  },
  dateRangeDark: {
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

  // Empty State
  emptyCard: {
    marginHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: '#E5E5EA',
    gap: 12,
  },
  emptyCardDark: {
    backgroundColor: '#1C1C1E',
    borderColor: '#38383A',
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
    lineHeight: 21,
  },
  emptyTextDark: {
    color: '#8E8E93',
  },
  startButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
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

  // Loading State
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 17,
    color: '#8E8E93',
    fontWeight: '500',
  },
  loadingTextDark: {
    color: '#8E8E93',
  },
});