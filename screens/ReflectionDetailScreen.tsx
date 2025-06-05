import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../utils/supabase';

const { width } = Dimensions.get('window');

interface Reflection {
  id: string;
  week_start_date: string;
  mood_score: number | null;
  energy_level: number | null;
  weekly_goals: string | null;
  achievements: string | null;
  challenges: string | null;
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

interface DailyLog {
  user_id: string;
  log_date: string;
  week_start_date: string;
  mood_score: number | null;
  mood_score_reason: string | null;
  energy_level: number | null;
  energy_level_reason: string | null;
  notable_events: string | null;
  notable_events_reason: string | null;
  thoughts: string | null;
  challenges: string | null;
  achievements: string | null;
  sentiment_summary: string | null;
  sentiment_summary_reason: string | null;
  input_type: string;
  source_agent: string;
  raw_input: string;
  created_at: string;
  updated_at: string;
}

type TabType = 'overview' | 'daily' | 'details' | 'coaching';

export default function ReflectionDetailScreen({ 
  route, 
  navigation 
}: { 
  route: { params: { reflection: Reflection } }, 
  navigation: any 
}) {
  const { reflection } = route.params;
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch daily logs for this week
  useEffect(() => {
    const fetchDailyLogs = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('daily_logs')
          .select('*')
          .eq('week_start_date', reflection.week_start_date)
          .order('log_date', { ascending: true });

        if (error) {
          console.error('Error fetching daily logs:', error);
        } else {
          setDailyLogs(data || []);
        }
      } catch (error) {
        console.error('Error fetching daily logs:', error);
      } finally {
        setLoading(false);
      }
    };

    if (reflection.week_start_date) {
      fetchDailyLogs();
    }
  }, [reflection.week_start_date]);

  // Filter daily logs for this week and sort by date
  const weeklyLogs = useMemo(() => {
    return dailyLogs
      .filter(log => log.week_start_date === reflection.week_start_date)
      .sort((a, b) => new Date(a.log_date).getTime() - new Date(b.log_date).getTime());
  }, [dailyLogs, reflection.week_start_date]);

  // Prepare mood data for chart from daily logs
  const moodData = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const startDate = new Date(reflection.week_start_date);
    
    return days.map((day, index) => {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + index);
      
      const log = weeklyLogs.find(log => {
        const logDate = new Date(log.log_date);
        return logDate.toDateString() === currentDate.toDateString();
      });
      
      const moodScore = log?.mood_score || 0;
      const value = moodScore / 10; // Convert to 0-1 range
      
      let color = '#9CA3AF'; // Default gray
      if (moodScore >= 8) color = '#10B981'; // Green
      else if (moodScore >= 6) color = '#F59E0B'; // Yellow
      else if (moodScore >= 4) color = '#EF4444'; // Red
      else if (moodScore > 0) color = '#DC2626'; // Dark red
      
      return { day, value, color, score: moodScore };
    });
  }, [weeklyLogs, reflection.week_start_date]);

  // Helper to format bullet points from semicolon/comma/newline separated text
  const formatBulletPoints = (text: string | null): string[] => {
    if (!text) return [];
    return text
      .split(/[;\n]|(?:,(?!\s*\d))/g)
      .map(item => item.trim())
      .filter(item => item.length > 0 && item !== '•')
      .map(item => item.replace(/^[•-]\s*/, ''));
  };

  // Helper to split emotional tags
  const emotionalTags = reflection.emotional_tags
    ? reflection.emotional_tags.split(/[;,]/).map(tag => tag.trim()).filter(tag => tag.length > 0)
    : [];

  // Helper to split coaching prompts
  const coachingPrompts = formatBulletPoints(reflection.coaching_prompts);

  // Format date for header
  let formattedDate = '';
  let weekRange = '';
  if (reflection.week_start_date) {
    const startDate = new Date(reflection.week_start_date);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    
    formattedDate = startDate.toLocaleDateString(undefined, { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
    
    weekRange = `${startDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
  }

  // Helper to format log date
  const formatLogDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { 
      weekday: 'long', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Helper to get primary content from daily log
  const getPrimaryLogContent = (log: DailyLog): string => {
    if (log.thoughts) return log.thoughts;
    if (log.notable_events) return log.notable_events;
    if (log.sentiment_summary) return log.sentiment_summary;
    return log.raw_input || 'Daily check-in completed';
  };

  // Helper to get mood color
  const getMoodColor = (moodScore: number | null): string => {
    if (!moodScore) return '#9CA3AF';
    if (moodScore >= 8) return '#10B981';
    if (moodScore >= 6) return '#F59E0B';
    if (moodScore >= 4) return '#EF4444';
    return '#DC2626';
  };

  // Enhanced Mood Chart Component
  const EnhancedMoodChart = () => (
    <View style={styles.moodChartContainer}>
      <View style={styles.moodChartHeader}>
        <Text style={styles.moodChartTitle}>Daily Mood Trends</Text>
        <View style={styles.moodLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
            <Text style={styles.legendText}>Great</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
            <Text style={styles.legendText}>Good</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
            <Text style={styles.legendText}>Tough</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.moodChartBars}>
        {moodData.map((day, index) => (
          <TouchableOpacity key={day.day} style={styles.moodBarContainer}>
            <View style={styles.moodBarTrack}>
              <View style={[
                styles.moodBarFill,
                { 
                  backgroundColor: day.color,
                  height: `${day.value * 100}%`
                }
              ]} />
            </View>
            <Text style={styles.moodBarLabel}>{day.day}</Text>
            {day.score > 0 && (
              <Text style={styles.moodBarScore}>{day.score}</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>
      
      <View style={styles.moodInsight}>
        <View style={styles.moodInsightDot} />
        <Text style={styles.moodInsightText}>
          {moodData.filter(d => d.value >= 0.6).length > 4 
            ? "Strong week with mostly positive days"
            : moodData.filter(d => d.value >= 0.6).length >= 3
            ? "Mixed week with good recovery"
            : "Challenging week, focus on self-care"
          }
        </Text>
      </View>
    </View>
  );

  const renderDailyLogs = () => {
    if (loading) {
      return (
        <View style={styles.section}>
          <View style={styles.contentCard}>
            <Text style={styles.emptyText}>Loading daily logs...</Text>
          </View>
        </View>
      );
    }

    if (weeklyLogs.length === 0) {
      return (
        <View style={styles.section}>
          <View style={styles.contentCard}>
            <Text style={styles.emptyText}>No daily logs found for this week</Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.section}>
        <View style={styles.dailyLogsContainer}>
          {weeklyLogs.map((log, index) => (
            <View key={`${log.log_date}-${index}`} style={styles.dailyLogCard}>
              <View style={styles.dailyLogHeader}>
                <View style={styles.dailyLogDateContainer}>
                  <Text style={styles.dailyLogDate}>{formatLogDate(log.log_date)}</Text>
                  {log.mood_score && (
                    <View style={[styles.moodIndicator, { backgroundColor: getMoodColor(log.mood_score) }]}>
                      <Text style={styles.moodScore}>{log.mood_score}</Text>
                    </View>
                  )}
                </View>
                <View style={styles.logTypeIndicator}>
                  <Ionicons name="chatbubble-outline" size={14} color="#6B7280" />
                </View>
              </View>
              
              <Text style={styles.dailyLogContent}>
                {getPrimaryLogContent(log)}
              </Text>

              {/* Additional context if available */}
              {(log.achievements || log.challenges) && (
                <View style={styles.dailyLogMetadata}>
                  {log.achievements && (
                    <View style={styles.metadataItem}>
                      <Ionicons name="checkmark-circle-outline" size={14} color="#10B981" />
                      <Text style={styles.metadataText} numberOfLines={1}>
                        {log.achievements}
                      </Text>
                    </View>
                  )}
                  {log.challenges && (
                    <View style={styles.metadataItem}>
                      <Ionicons name="alert-circle-outline" size={14} color="#F59E0B" />
                      <Text style={styles.metadataText} numberOfLines={1}>
                        {log.challenges}
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          ))}
        </View>
      </View>
    );
  };

  // Tab icon and title mapping
  const tabMeta = {
    overview: { icon: 'analytics-outline', title: 'Overview' },
    daily: { icon: 'calendar-outline', title: 'Daily' },
    details: { icon: 'document-text-outline', title: 'Details' },
    coaching: { icon: 'bulb-outline', title: 'Coaching Insights' },
  };

  // Update the tabs array to only have icon and key
  const tabs = [
    { key: 'overview', icon: 'analytics-outline' },
    { key: 'daily', icon: 'calendar-outline' },
    { key: 'details', icon: 'document-text-outline' },
    ...(coachingPrompts.length > 0 ? [{ key: 'coaching', icon: 'bulb-outline' }] : [])
  ];

  // Tab header for each tab content
  const TabHeader = ({ tabKey }: { tabKey: TabType }) => (
    <View style={styles.tabHeaderRow}>
      <Ionicons name={tabMeta[tabKey].icon as any} size={22} color="#6366F1" style={{ marginRight: 8 }} />
      <Text style={styles.tabHeaderTitle}>{tabMeta[tabKey].title}</Text>
    </View>
  );

  // Add TabHeader to each tab content
  const renderOverviewTab = () => (
    <ScrollView contentContainerStyle={styles.tabContent} showsVerticalScrollIndicator={false}>
      <TabHeader tabKey="overview" />
      {/* Metrics Section */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Weekly Metrics</Text>
        <View style={styles.metricsRow}>
          <MetricCard
            label="Mood"
            value={reflection.mood_score}
            max={10}
            color="#10B981"
            backgroundColor="#ECFDF5"
            icon="happy-outline"
          />
          <MetricCard
            label="Energy"
            value={reflection.energy_level}
            max={10}
            color="#6366F1"
            backgroundColor="#EEF2FF"
            icon="flash-outline"
          />
          <MetricCard
            label="Quality"
            value={reflection.reflection_quality}
            max={10}
            color="#F59E0B"
            backgroundColor="#FFFBEB"
            icon="star-outline"
          />
        </View>
      </View>
      {/* Mood Chart Section */}
      <View style={styles.section}>
        <EnhancedMoodChart />
      </View>
      {/* Summary Section */}
      {reflection.summary && (
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Weekly Summary</Text>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryText}>{reflection.summary}</Text>
          </View>
        </View>
      )}
      {/* Goals Section */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Goals & Objectives</Text>
        <View style={styles.contentCard}>
          {formatBulletPoints(reflection.weekly_goals).length > 0 ? (
            <View style={styles.bulletList}>
              {formatBulletPoints(reflection.weekly_goals).map((goal, idx) => (
                <View key={idx} style={styles.bulletItem}>
                  <View style={styles.bulletDot} />
                  <Text style={styles.bulletText}>{goal}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.emptyText}>No goals recorded for this week</Text>
          )}
        </View>
      </View>
      {/* Achievements Section */}
      {reflection.achievements && (
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Key Achievements</Text>
          <View style={styles.contentCard}>
            {formatBulletPoints(reflection.achievements).length > 1 ? (
              <View style={styles.bulletList}>
                {formatBulletPoints(reflection.achievements).map((achievement, idx) => (
                  <View key={idx} style={styles.bulletItem}>
                    <View style={[styles.bulletDot, { backgroundColor: '#10B981' }]} />
                    <Text style={styles.bulletText}>{achievement}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.contentText}>{reflection.achievements}</Text>
            )}
          </View>
        </View>
      )}
      {/* Emotional State Section */}
      {emotionalTags.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Emotional State</Text>
          <View style={styles.contentCard}>
            <View style={styles.tagsContainer}>
              {emotionalTags.map((tag, index) => (
                <View key={index} style={[styles.emotionalTag, { backgroundColor: getSentimentColor(reflection.sentiment) }]}> 
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
            {reflection.sentiment && (
              <View style={styles.sentimentIndicator}>
                <Text style={styles.sentimentLabel}>Overall Sentiment</Text>
                <View style={[styles.sentimentBadge, { backgroundColor: getSentimentColor(reflection.sentiment) }]}> 
                  <Text style={styles.sentimentValue}>
                    {reflection.sentiment?.charAt(0).toUpperCase() + reflection.sentiment?.slice(1)}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>
      )}
    </ScrollView>
  );

  const renderDailyTab = () => (
    <ScrollView contentContainerStyle={styles.tabContent} showsVerticalScrollIndicator={false}>
      <TabHeader tabKey="daily" />
      {/* Daily Mood Chart */}
      <View style={styles.moodChartDailySection}>
        <EnhancedMoodChart />
      </View>
      {/* Daily Logs */}
      {renderDailyLogs()}
    </ScrollView>
  );

  const renderDetailsTab = () => (
    <ScrollView contentContainerStyle={styles.tabContent} showsVerticalScrollIndicator={false}>
      <TabHeader tabKey="details" />
      {/* Challenges Section */}
      {reflection.challenges && (
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Challenges Faced</Text>
          <View style={styles.contentCard}>
            {formatBulletPoints(reflection.challenges).length > 1 ? (
              <View style={styles.bulletList}>
                {formatBulletPoints(reflection.challenges).map((challenge, idx) => (
                  <View key={idx} style={styles.bulletItem}>
                    <View style={[styles.bulletDot, { backgroundColor: '#EF4444' }]} />
                    <Text style={styles.bulletText}>{challenge}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.contentText}>{reflection.challenges}</Text>
            )}
          </View>
        </View>
      )}
      {/* Weekend Plans Section */}
      {reflection.weekend_plans && (
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Weekend Plans</Text>
          <View style={styles.contentCard}>
            <Text style={styles.contentText}>{reflection.weekend_plans}</Text>
          </View>
        </View>
      )}
      {/* Notable Events Section */}
      {reflection.notable_events && (
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Notable Events</Text>
          <View style={styles.contentCard}>
            {formatBulletPoints(reflection.notable_events).length > 1 ? (
              <View style={styles.bulletList}>
                {formatBulletPoints(reflection.notable_events).map((event, idx) => (
                  <View key={idx} style={styles.bulletItem}>
                    <View style={[styles.bulletDot, { backgroundColor: '#6366F1' }]} />
                    <Text style={styles.bulletText}>{event}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.contentText}>{reflection.notable_events}</Text>
            )}
          </View>
        </View>
      )}
      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Last updated: {new Date(reflection.updated_at).toLocaleDateString(undefined, {
            weekday: 'short',
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </Text>
      </View>
    </ScrollView>
  );

  const renderCoachingTab = () => (
    <ScrollView contentContainerStyle={styles.tabContent} showsVerticalScrollIndicator={false}>
      <TabHeader tabKey="coaching" />
      {coachingPrompts.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Insights</Text>
          <View style={styles.contentCard}>
            <View style={styles.promptsList}>
              {coachingPrompts.map((prompt, index) => (
                <View key={index} style={styles.promptItem}>
                  <View style={styles.promptIconContainer}>
                    <Ionicons name="bulb-outline" size={20} color="#6366F1" />
                  </View>
                  <Text style={styles.promptText}>{prompt}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.section}>
          <Text style={styles.emptyText}>No coaching insights for this week.</Text>
        </View>
      )}
    </ScrollView>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      {/* Header */}
      <LinearGradient
        colors={['#667EEA', '#764BA2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <SafeAreaView edges={['top']} style={{ backgroundColor: 'transparent' }}>
          <View style={styles.headerRow}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={styles.headerContent}>
              <Text style={styles.headerTitle}>Weekly Reflection</Text>
              <Text style={styles.headerSubtitle}>{weekRange}</Text>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* Icon-only Tab Navigation */}
      <View style={styles.tabNavigationContainer}>
        <View style={styles.tabNavigationInner}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.professionalTab,
                activeTab === tab.key && styles.professionalTabActive
              ]}
              onPress={() => setActiveTab(tab.key as TabType)}
            >
              <Ionicons 
                name={tab.icon as any} 
                size={22} 
                color={activeTab === tab.key ? '#667EEA' : '#64748B'} 
              />
              {/* No label, no indicator */}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Tab Content */}
      {activeTab === 'overview' && renderOverviewTab()}
      {activeTab === 'daily' && renderDailyTab()}
      {activeTab === 'details' && renderDetailsTab()}
      {activeTab === 'coaching' && renderCoachingTab()}
    </View>
  );
}

// Helper function to get color based on sentiment
function getSentimentColor(sentiment: string | null): string {
  switch (sentiment?.toLowerCase()) {
    case 'positive':
      return '#10B981';
    case 'negative':
      return '#EF4444';
    case 'neutral':
    default:
      return '#6B7280';
  }
}

function MetricCard({ 
  label, 
  value, 
  max, 
  color, 
  backgroundColor,
  icon
}: { 
  label: string; 
  value: number | null; 
  max: number; 
  color: string;
  backgroundColor: string;
  icon: string;
}) {
  const percent = value ? Math.max(0, Math.min(1, value / max)) : 0;
  
  return (
    <View style={[styles.metricCard, { backgroundColor }]}>
      <View style={styles.metricHeader}>
        <Ionicons name={icon as any} size={24} color={color} />
        <Text style={styles.metricLabel}>{label}</Text>
      </View>
      
      <View style={styles.metricValueSection}>
        <Text style={[styles.metricValue, { color }]}>{value ?? '—'}</Text>
        <Text style={styles.metricMax}>/ {max}</Text>
      </View>
      
      <View style={styles.metricBarTrack}>
        <View style={[styles.metricBarFill, { width: `${percent * 100}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Header Styles
  headerGradient: {
    paddingBottom: 0,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  backButton: {
    marginRight: 16,
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },

  // Professional Tab Navigation Styles
  tabNavigationContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tabNavigationInner: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 4,
  },
  professionalTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 0,
    borderRadius: 8,
    position: 'relative',
  },
  professionalTabActive: {
    backgroundColor: 'white',
    shadowColor: '#667EEA',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },

  // Mood Chart Styles
  moodChartContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  moodChartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    flexWrap: 'wrap',
    gap: 12,
  },
  moodChartTitle: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: 'bold',
  },
  moodLegend: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
  },
  moodChartBars: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
    marginBottom: 24,
  },
  moodBarContainer: {
    alignItems: 'center',
    flex: 1,
  },
  moodBarTrack: {
    width: 24,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    height: 96,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  moodBarFill: {
    borderRadius: 12,
    minHeight: 4,
  },
  moodBarLabel: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 8,
    fontWeight: '700',
  },
  moodBarScore: {
    color: '#374151',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  moodInsight: {
    padding: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  moodInsightDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  moodInsightText: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },

  // Content Styles
  tabContent: {
    padding: 20,
    paddingTop: 8,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },

  // Metric Card Styles
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  metricCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  metricLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  metricValueSection: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  metricMax: {
    fontSize: 14,
    color: '#9CA3AF',
    marginLeft: 2,
  },
  metricBarTrack: {
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  metricBarFill: {
    height: '100%',
    borderRadius: 2,
  },

  // Content Card Styles
  contentCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  summaryCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    borderLeftWidth: 4,
    borderLeftColor: '#667EEA',
  },
  summaryText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#374151',
    fontStyle: 'italic',
  },
  contentText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#374151',
  },
  emptyText: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    fontStyle: 'italic',
  },

  // Bullet List Styles
  bulletList: {
    gap: 12,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  bulletDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#667EEA',
    marginTop: 6,
  },
  bulletText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    color: '#374151',
  },

  // Tags Styles
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  emotionalTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    opacity: 0.2,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  sentimentIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  sentimentLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  sentimentBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  sentimentValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },

  // Daily Logs Styles
  dailyLogsContainer: {
    gap: 24,
  },
  dailyLogCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  dailyLogHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dailyLogDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dailyLogDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  moodIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 28,
    alignItems: 'center',
  },
  moodScore: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  logTypeIndicator: {
    opacity: 0.6,
  },
  dailyLogContent: {
    fontSize: 15,
    lineHeight: 22,
    color: '#374151',
    marginBottom: 12,
  },
  dailyLogMetadata: {
    gap: 8,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metadataText: {
    fontSize: 13,
    color: '#6B7280',
    flex: 1,
  },

  // Coaching Prompts Styles
  promptsList: {
    gap: 16,
  },
  promptItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  promptIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  promptText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    color: '#374151',
  },

  // Footer Styles
  footer: {
    marginTop: 32,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#9CA3AF',
  },

  // Tab Header Styles
  tabHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
    marginTop: 18,
    gap: 4,
  },
  tabHeaderTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1F2937',
    letterSpacing: 0.5,
  },
  moodChartDailySection: {
    marginBottom: 32,
  },
});