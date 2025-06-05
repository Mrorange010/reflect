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
import { NavigationProp } from '../navigation';
import { supabase } from '../utils/supabase';

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

type ViewMode = 'grid' | 'list';

export default function WeeklyReflectionsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  useEffect(() => {
    const fetchReflections = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('weekly_reflections')
        .select('*')
        .order('week_start_date', { ascending: false });
      if (error) {
        console.error('Error fetching reflections:', error.message);
      } else {
        setReflections(data || []);
      }
      setLoading(false);
    };
    fetchReflections();
  }, []);

  // Helper function to get mood color
  const getMoodColor = (moodScore: number | null): string => {
    if (!moodScore) return '#9CA3AF';
    if (moodScore >= 8) return '#10B981';
    if (moodScore >= 6) return '#F59E0B';
    if (moodScore >= 4) return '#EF4444';
    return '#DC2626';
  };

  // Helper function to get sentiment color
  const getSentimentColor = (sentiment: string | null): string => {
    switch (sentiment?.toLowerCase()) {
      case 'positive':
        return '#10B981';
      case 'negative':
        return '#EF4444';
      case 'neutral':
      default:
        return '#6B7280';
    }
  };

  // Helper function to format week range
  const formatWeekRange = (weekStartDate: string): string => {
    const startDate = new Date(weekStartDate);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    
    return `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  };

  // Helper function to get week number
  const getWeekNumber = (weekStartDate: string): string => {
    const startDate = new Date(weekStartDate);
    const startOfYear = new Date(startDate.getFullYear(), 0, 1);
    const days = Math.floor((startDate.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
    const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
    return `Week ${weekNumber}`;
  };

  // Calculate stats
  const totalReflections = reflections.length;
  const avgMoodScore = reflections
    .filter(r => r.mood_score)
    .reduce((sum, r) => sum + (r.mood_score || 0), 0) / reflections.filter(r => r.mood_score).length || 0;
  const recentWeeks = reflections.slice(0, 4).length;

  const renderGridView = () => {
    const pairs = [];
    for (let i = 0; i < reflections.length; i += 2) {
      pairs.push(reflections.slice(i, i + 2));
    }

    return (
      <View style={styles.gridContainer}>
        {pairs.map((pair, pairIndex) => (
          <View key={pairIndex} style={styles.gridRow}>
            {pair.map((reflection, index) => (
              <TouchableOpacity
                key={reflection.id}
                style={[
                  styles.gridCard,
                  pairIndex === 0 && index === 0 && styles.featuredCard
                ]}
                onPress={() => navigation.navigate('ReflectionDetail', { reflection })}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={
                    pairIndex === 0 && index === 0 
                      ? ['#667EEA', '#764BA2']
                      : ['#FFFFFF', '#F8FAFC']
                  }
                  style={styles.gridCardGradient}
                >
                  {/* Header */}
                  <View style={styles.gridCardHeader}>
                    <Text style={[
                      styles.weekLabel,
                      pairIndex === 0 && index === 0 && styles.featuredWeekLabel
                    ]}>
                      {getWeekNumber(reflection.week_start_date)}
                    </Text>
                    <View style={styles.qualityBadge}>
                      <Ionicons 
                        name="star" 
                        size={12} 
                        color={pairIndex === 0 && index === 0 ? '#FFFFFF' : '#F59E0B'} 
                      />
                      <Text style={[
                        styles.qualityScore,
                        pairIndex === 0 && index === 0 && styles.featuredQualityScore
                      ]}>
                        {reflection.reflection_quality || '—'}
                      </Text>
                    </View>
                  </View>

                  {/* Date Range */}
                  <Text style={[
                    styles.dateRange,
                    pairIndex === 0 && index === 0 && styles.featuredDateRange
                  ]}>
                    {formatWeekRange(reflection.week_start_date)}
                  </Text>

                  {/* Metrics */}
                  <View style={styles.gridMetrics}>
                    <View style={styles.metricItem}>
                      <Ionicons 
                        name="happy-outline" 
                        size={16} 
                        color={getMoodColor(reflection.mood_score)} 
                      />
                      <Text style={[
                        styles.metricValue,
                        pairIndex === 0 && index === 0 && styles.featuredMetricValue
                      ]}>
                        {reflection.mood_score || '—'}
                      </Text>
                      <Text style={[
                        styles.metricLabel,
                        pairIndex === 0 && index === 0 && styles.featuredMetricLabel
                      ]}>
                        Mood
                      </Text>
                    </View>
                    <View style={styles.metricItem}>
                      <Ionicons 
                        name="flash-outline" 
                        size={16} 
                        color={pairIndex === 0 && index === 0 ? '#FFFFFF' : '#6366F1'} 
                      />
                      <Text style={[
                        styles.metricValue,
                        pairIndex === 0 && index === 0 && styles.featuredMetricValue
                      ]}>
                        {reflection.energy_level || '—'}
                      </Text>
                      <Text style={[
                        styles.metricLabel,
                        pairIndex === 0 && index === 0 && styles.featuredMetricLabel
                      ]}>
                        Energy
                      </Text>
                    </View>
                  </View>

                  {/* Summary */}
                  {reflection.summary && (
                    <Text style={[
                      styles.gridSummary,
                      pairIndex === 0 && index === 0 && styles.featuredSummary
                    ]} numberOfLines={2}>
                      {reflection.summary}
                    </Text>
                  )}

                  {/* Sentiment Badge */}
                  {reflection.sentiment && (
                    <View style={[
                      styles.sentimentBadge,
                      { backgroundColor: getSentimentColor(reflection.sentiment) }
                    ]}>
                      <Text style={styles.sentimentText}>
                        {reflection.sentiment.charAt(0).toUpperCase() + reflection.sentiment.slice(1)}
                      </Text>
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            ))}
            {pair.length === 1 && <View style={styles.gridCard} />}
          </View>
        ))}
      </View>
    );
  };

  const renderListView = () => (
    <View style={styles.listContainer}>
      {reflections.map((reflection, index) => (
        <TouchableOpacity
          key={reflection.id}
          style={[
            styles.listCard,
            index === 0 && styles.featuredListCard
          ]}
          onPress={() => navigation.navigate('ReflectionDetail', { reflection })}
          activeOpacity={0.8}
        >
          <View style={styles.listCardContent}>
            {/* Left Section */}
            <View style={styles.listCardLeft}>
              <View style={[
                styles.weekIndicator,
                index === 0 && styles.featuredWeekIndicator
              ]}>
                <Text style={[
                  styles.weekNumber,
                  index === 0 && styles.featuredWeekNumber
                ]}>
                  {getWeekNumber(reflection.week_start_date).split(' ')[1]}
                </Text>
              </View>
            </View>

            {/* Center Section */}
            <View style={styles.listCardCenter}>
              <Text style={styles.listDateRange}>
                {formatWeekRange(reflection.week_start_date)}
              </Text>
              {reflection.summary ? (
                <Text style={styles.listSummary} numberOfLines={2}>
                  {reflection.summary}
                </Text>
              ) : (
                <Text style={styles.listGoals} numberOfLines={1}>
                  {reflection.weekly_goals || 'No summary available'}
                </Text>
              )}
              <View style={styles.listMetrics}>
                <View style={styles.listMetricItem}>
                  <Ionicons 
                    name="happy-outline" 
                    size={14} 
                    color={getMoodColor(reflection.mood_score)} 
                  />
                  <Text style={styles.listMetricText}>
                    Mood {reflection.mood_score || '—'}
                  </Text>
                </View>
                <View style={styles.listMetricItem}>
                  <Ionicons 
                    name="flash-outline" 
                    size={14} 
                    color="#6366F1" 
                  />
                  <Text style={styles.listMetricText}>
                    Energy {reflection.energy_level || '—'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Right Section */}
            <View style={styles.listCardRight}>
              {reflection.reflection_quality && (
                <View style={styles.listQualityBadge}>
                  <Ionicons name="star" size={12} color="#F59E0B" />
                  <Text style={styles.listQualityText}>
                    {reflection.reflection_quality}
                  </Text>
                </View>
              )}
              <Ionicons 
                name="chevron-forward" 
                size={16} 
                color="#94A3B8" 
                style={{ marginTop: 8 }}
              />
            </View>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#667EEA', '#764BA2']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <SafeAreaView edges={['top']} style={{ backgroundColor: 'transparent' }}>
            <View style={styles.headerContent}>
              <Text style={styles.headerTitle}>Weekly Reflections</Text>
              <Text style={styles.headerSubtitle}>Your journey of growth</Text>
            </View>
          </SafeAreaView>
        </LinearGradient>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading reflections...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#667EEA', '#764BA2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <SafeAreaView edges={['top']} style={{ backgroundColor: 'transparent' }}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.headerTitle}>Weekly Reflections</Text>
              <Text style={styles.headerSubtitle}>Your journey of growth</Text>
            </View>
            <TouchableOpacity
              style={styles.viewToggle}
              onPress={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            >
              <Ionicons 
                name={viewMode === 'grid' ? 'list' : 'grid'} 
                size={20} 
                color="#FFFFFF" 
              />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* Stats Card */}
      <View style={styles.statsSection}>
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{totalReflections}</Text>
            <Text style={styles.statLabel}>Total Weeks</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{avgMoodScore.toFixed(1)}</Text>
            <Text style={styles.statLabel}>Avg Mood</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{recentWeeks}</Text>
            <Text style={styles.statLabel}>Recent</Text>
          </View>
        </View>
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {reflections.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={64} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No Reflections Yet</Text>
            <Text style={styles.emptySubtitle}>
              Start your journey by creating your first weekly reflection
            </Text>
          </View>
        ) : (
          <>
            {viewMode === 'grid' ? renderGridView() : renderListView()}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  // Header Styles
  headerGradient: {
    paddingBottom: 0,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },
  viewToggle: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },

  // Stats Section
  statsSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  statsCard: {
    backgroundColor: 'white',
    flexDirection: 'row',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#F1F5F9',
    marginHorizontal: 16,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#667EEA',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },

  // Scroll View
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },

  // Grid View Styles
  gridContainer: {
    paddingHorizontal: 20,
  },
  gridRow: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 16,
  },
  gridCard: {
    flex: 1,
    height: 180,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  featuredCard: {
    height: 200,
    shadowColor: '#667EEA',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  gridCardGradient: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  gridCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  weekLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#374151',
  },
  featuredWeekLabel: {
    color: '#FFFFFF',
  },
  qualityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  qualityScore: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#374151',
  },
  featuredQualityScore: {
    color: '#FFFFFF',
  },
  dateRange: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
    marginTop: 4,
  },
  featuredDateRange: {
    color: 'rgba(255,255,255,0.9)',
  },
  gridMetrics: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 12,
  },
  metricItem: {
    alignItems: 'center',
    gap: 4,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#374151',
  },
  featuredMetricValue: {
    color: '#FFFFFF',
  },
  metricLabel: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '600',
  },
  featuredMetricLabel: {
    color: 'rgba(255,255,255,0.8)',
  },
  gridSummary: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
    marginTop: 8,
  },
  featuredSummary: {
    color: 'rgba(255,255,255,0.9)',
  },
  sentimentBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  sentimentText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },

  // List View Styles
  listContainer: {
    paddingHorizontal: 20,
    gap: 12,
  },
  listCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
  },
  featuredListCard: {
    borderWidth: 2,
    borderColor: '#667EEA',
    shadowColor: '#667EEA',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  listCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  listCardLeft: {
    marginRight: 16,
  },
  weekIndicator: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featuredWeekIndicator: {
    backgroundColor: '#667EEA',
  },
  weekNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#374151',
  },
  featuredWeekNumber: {
    color: '#FFFFFF',
  },
  listCardCenter: {
    flex: 1,
  },
  listDateRange: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 4,
  },
  listSummary: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
    marginBottom: 8,
  },
  listGoals: {
    fontSize: 13,
    color: '#9CA3AF',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  listMetrics: {
    flexDirection: 'row',
    gap: 16,
  },
  listMetricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  listMetricText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  listCardRight: {
    alignItems: 'center',
    marginLeft: 16,
  },
  listQualityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    gap: 4,
  },
  listQualityText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#F59E0B',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },

  // Loading State
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#64748B',
  },
});