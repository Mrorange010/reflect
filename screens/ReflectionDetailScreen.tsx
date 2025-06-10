import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Dimensions, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';
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
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
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
      
      let color = isDark ? '#4B5563' : '#9CA3AF'; // Default gray
      if (moodScore >= 8) color = isDark ? '#10B981' : '#059669'; // Green
      else if (moodScore >= 6) color = isDark ? '#F59E0B' : '#D97706'; // Orange
      else if (moodScore >= 4) color = isDark ? '#EF4444' : '#DC2626'; // Red
      else if (moodScore > 0) color = isDark ? '#DC2626' : '#B91C1C'; // Dark red
      
      return { day, value, color, score: moodScore };
    });
  }, [weeklyLogs, reflection.week_start_date, isDark]);

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
    if (!moodScore) return isDark ? '#4B5563' : '#9CA3AF';
    if (moodScore >= 8) return isDark ? '#10B981' : '#059669';
    if (moodScore >= 6) return isDark ? '#F59E0B' : '#D97706';
    if (moodScore >= 4) return isDark ? '#EF4444' : '#DC2626';
    return isDark ? '#DC2626' : '#B91C1C';
  };

  // Enhanced Mood Chart Component (Dashboard Style)
  const EnhancedMoodChart = () => {
    const maxMood = Math.max(...moodData.map(d => d.score), 1);
    
    return (
      <View style={[styles.moodChartContainer, isDark && styles.moodChartContainerDark]}>
        <View style={styles.moodChartHeader}>
          <Text style={[styles.moodChartTitle, isDark && styles.moodChartTitleDark]}>Daily Mood Trends</Text>
        </View>
        
        <View style={styles.dashboardChartContainer}>
          {moodData.map((day, index) => {
            const height = Math.max((day.score / 10) * 100, 4);
            
            return (
              <View key={day.day} style={styles.dashboardBarContainer}>
                <View style={styles.dashboardBarWrapper}>
                  <View style={[styles.dashboardBarTrack, isDark && styles.dashboardBarTrackDark]}>
                    <View 
                      style={[
                        styles.dashboardBarFill,
                        { 
                          height: `${height}%`,
                          backgroundColor: day.score >= 7 
                            ? (isDark ? '#34C759' : '#34C759')
                            : day.score >= 5 
                            ? (isDark ? '#FF9F0A' : '#FF9F0A')
                            : (isDark ? '#FF453A' : '#FF453A')
                        }
                      ]} 
                    />
                  </View>
                </View>
                <Text style={[styles.dashboardBarLabel, isDark && styles.dashboardBarLabelDark]}>
                  {day.day}
                </Text>
              </View>
            );
          })}
        </View>
        
        <View style={[styles.moodInsight, isDark && styles.moodInsightDark]}>
          <View style={styles.moodInsightDot} />
          <Text style={[styles.moodInsightText, isDark && styles.moodInsightTextDark]}>
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
  };

  const renderDailyLogs = () => {
    if (loading) {
      return (
        <View style={styles.section}>
          <View style={[styles.contentCard, isDark && styles.contentCardDark]}>
            <Text style={[styles.emptyText, isDark && styles.emptyTextDark]}>Loading daily logs...</Text>
          </View>
        </View>
      );
    }

    if (weeklyLogs.length === 0) {
      return (
        <View style={styles.section}>
          <View style={[styles.contentCard, isDark && styles.contentCardDark]}>
            <Text style={[styles.emptyText, isDark && styles.emptyTextDark]}>No daily logs found for this week</Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.section}>
        <View style={styles.dailyLogsContainer}>
          {weeklyLogs.map((log, index) => (
            <View key={`${log.log_date}-${index}`} style={[styles.dailyLogCard, isDark && styles.dailyLogCardDark]}>
              <View style={styles.dailyLogHeader}>
                <View style={styles.dailyLogDateContainer}>
                  <Text style={[styles.dailyLogDate, isDark && styles.dailyLogDateDark]}>{formatLogDate(log.log_date)}</Text>
                  {log.mood_score && (
                    <View style={[styles.moodIndicator, { backgroundColor: getMoodColor(log.mood_score) }]}>
                      <Text style={styles.moodScore}>{log.mood_score}</Text>
                    </View>
                  )}
                </View>
                <View style={styles.logTypeIndicator}>
                  <Ionicons name="chatbubble-outline" size={14} color={isDark ? '#9CA3AF' : '#6B7280'} />
                </View>
              </View>
              
              <Text style={[styles.dailyLogContent, isDark && styles.dailyLogContentDark]}>
                {getPrimaryLogContent(log)}
              </Text>

              {/* Additional context if available */}
              {(log.achievements || log.challenges) && (
                <View style={styles.dailyLogMetadata}>
                  {log.achievements && (
                    <View style={styles.metadataItem}>
                      <Ionicons name="checkmark-circle-outline" size={14} color={isDark ? '#10B981' : '#059669'} />
                      <Text style={[styles.metadataText, isDark && styles.metadataTextDark]} numberOfLines={1}>
                        {log.achievements}
                      </Text>
                    </View>
                  )}
                  {log.challenges && (
                    <View style={styles.metadataItem}>
                      <Ionicons name="alert-circle-outline" size={14} color={isDark ? '#F59E0B' : '#D97706'} />
                      <Text style={[styles.metadataText, isDark && styles.metadataTextDark]} numberOfLines={1}>
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
      <Ionicons 
        name={tabMeta[tabKey].icon as any} 
        size={22} 
        color={isDark ? '#FF6B4D' : '#FF7A59'} 
        style={{ marginRight: 8 }} 
      />
      <Text style={[styles.tabHeaderTitle, isDark && styles.tabHeaderTitleDark]}>{tabMeta[tabKey].title}</Text>
    </View>
  );

  // Add TabHeader to each tab content
  const renderOverviewTab = () => (
    <ScrollView contentContainerStyle={styles.tabContent} showsVerticalScrollIndicator={false}>
      <TabHeader tabKey="overview" />
      {/* Quick Stats - Dashboard Style */}
      <View style={styles.section}>
        <Text style={[styles.sectionHeader, isDark && styles.sectionHeaderDark]}>Weekly Overview</Text>
        <DashboardQuickStats 
          moodScore={reflection.mood_score || 0} 
          energyLevel={reflection.energy_level || 0}
          isDark={isDark}
        />
      </View>
      {/* Mood Chart Section */}
      <View style={styles.section}>
        <EnhancedMoodChart />
      </View>
      {/* Summary Section */}
      {reflection.summary && (
        <View style={styles.section}>
          <Text style={[styles.sectionHeader, isDark && styles.sectionHeaderDark]}>Weekly Summary</Text>
          <View style={[styles.summaryCard, isDark && styles.summaryCardDark]}>
            <Text style={[styles.summaryText, isDark && styles.summaryTextDark]}>{reflection.summary}</Text>
          </View>
        </View>
      )}
      {/* Goals Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionHeader, isDark && styles.sectionHeaderDark]}>Goals & Objectives</Text>
        <View style={[styles.contentCard, isDark && styles.contentCardDark]}>
          {formatBulletPoints(reflection.weekly_goals).length > 0 ? (
            <View style={styles.bulletList}>
              {formatBulletPoints(reflection.weekly_goals).map((goal, idx) => (
                <View key={idx} style={styles.bulletItem}>
                  <View style={[styles.bulletDot, { backgroundColor: isDark ? '#FF6B4D' : '#FF7A59' }]} />
                  <Text style={[styles.bulletText, isDark && styles.bulletTextDark]}>{goal}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={[styles.emptyText, isDark && styles.emptyTextDark]}>No goals recorded for this week</Text>
          )}
        </View>
      </View>
      {/* Achievements Section */}
      {reflection.achievements && (
        <View style={styles.section}>
          <Text style={[styles.sectionHeader, isDark && styles.sectionHeaderDark]}>Key Achievements</Text>
          <View style={[styles.contentCard, isDark && styles.contentCardDark]}>
            {formatBulletPoints(reflection.achievements).length > 1 ? (
              <View style={styles.bulletList}>
                {formatBulletPoints(reflection.achievements).map((achievement, idx) => (
                  <View key={idx} style={styles.bulletItem}>
                    <View style={[styles.bulletDot, { backgroundColor: isDark ? '#10B981' : '#059669' }]} />
                    <Text style={[styles.bulletText, isDark && styles.bulletTextDark]}>{achievement}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={[styles.contentText, isDark && styles.contentTextDark]}>{reflection.achievements}</Text>
            )}
          </View>
        </View>
      )}
      {/* Emotional State Section */}
      {emotionalTags.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionHeader, isDark && styles.sectionHeaderDark]}>Emotional State</Text>
          <View style={[styles.contentCard, isDark && styles.contentCardDark]}>
            <View style={styles.emotionalTagsContainer}>
              {emotionalTags.map((tag, index) => (
                <View key={index} style={[styles.modernEmotionalTag, isDark && styles.modernEmotionalTagDark]}> 
                  <Text style={[styles.modernTagText, isDark && styles.modernTagTextDark]}>{tag}</Text>
                </View>
              ))}
            </View>
            {reflection.sentiment && (
              <View style={[styles.sentimentSection, isDark && styles.sentimentSectionDark]}>
                <View style={styles.sentimentHeader}>
                  <Ionicons 
                    name="analytics-outline" 
                    size={16} 
                    color={isDark ? '#8E8E93' : '#8E8E93'} 
                  />
                  <Text style={[styles.sentimentLabel, isDark && styles.sentimentLabelDark]}>
                    Overall Sentiment
                  </Text>
                </View>
                <View style={[styles.modernSentimentBadge, { backgroundColor: getSentimentColor(reflection.sentiment, isDark) }]}> 
                  <Text style={styles.modernSentimentValue}>
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
          <Text style={[styles.sectionHeader, isDark && styles.sectionHeaderDark]}>Challenges Faced</Text>
          <View style={[styles.contentCard, isDark && styles.contentCardDark]}>
            {formatBulletPoints(reflection.challenges).length > 1 ? (
              <View style={styles.bulletList}>
                {formatBulletPoints(reflection.challenges).map((challenge, idx) => (
                  <View key={idx} style={styles.bulletItem}>
                    <View style={[styles.bulletDot, { backgroundColor: isDark ? '#EF4444' : '#DC2626' }]} />
                    <Text style={[styles.bulletText, isDark && styles.bulletTextDark]}>{challenge}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={[styles.contentText, isDark && styles.contentTextDark]}>{reflection.challenges}</Text>
            )}
          </View>
        </View>
      )}
      {/* Weekend Plans Section */}
      {reflection.weekend_plans && (
        <View style={styles.section}>
          <Text style={[styles.sectionHeader, isDark && styles.sectionHeaderDark]}>Weekend Plans</Text>
          <View style={[styles.contentCard, isDark && styles.contentCardDark]}>
            <Text style={[styles.contentText, isDark && styles.contentTextDark]}>{reflection.weekend_plans}</Text>
          </View>
        </View>
      )}
      {/* Notable Events Section */}
      {reflection.notable_events && (
        <View style={styles.section}>
          <Text style={[styles.sectionHeader, isDark && styles.sectionHeaderDark]}>Notable Events</Text>
          <View style={[styles.contentCard, isDark && styles.contentCardDark]}>
            {formatBulletPoints(reflection.notable_events).length > 1 ? (
              <View style={styles.bulletList}>
                {formatBulletPoints(reflection.notable_events).map((event, idx) => (
                  <View key={idx} style={styles.bulletItem}>
                    <View style={[styles.bulletDot, { backgroundColor: isDark ? '#FF6B4D' : '#FF7A59' }]} />
                    <Text style={[styles.bulletText, isDark && styles.bulletTextDark]}>{event}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={[styles.contentText, isDark && styles.contentTextDark]}>{reflection.notable_events}</Text>
            )}
          </View>
        </View>
      )}
      {/* Footer */}
      <View style={styles.footer}>
        <Text style={[styles.footerText, isDark && styles.footerTextDark]}>
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

  const renderCoachingTab = () => {
    // Mock advice cards data (in real app, fetch from weekly_cards table)
    const adviceCards = [
      {
        id: '1',
        title: 'Mindful Moments',
        content: 'Take 5 minutes each morning for deep breathing. This simple practice can significantly improve your mood throughout the day.',
        icon: 'leaf-outline',
        color: '#34C759'
      },
      {
        id: '2',
        title: 'Stay Active',
        content: 'A 10-minute walk can boost your energy levels. Consider taking walking meetings or short breaks every hour.',
        icon: 'walk-outline',
        color: '#007AFF'
      },
      {
        id: '3',
        title: 'Quality Sleep',
        content: 'Establish a consistent bedtime routine. Good sleep is the foundation for better mood and energy levels.',
        icon: 'bed-outline',
        color: '#AF52DE'
      }
    ];

    return (
      <ScrollView contentContainerStyle={styles.tabContent} showsVerticalScrollIndicator={false}>
        <TabHeader tabKey="coaching" />

        {/* Advice Cards */}
        <View style={styles.section}>
          <Text style={[styles.sectionHeader, isDark && styles.sectionHeaderDark]}>Personalized Advice</Text>
          <View style={styles.adviceCardsContainer}>
            {adviceCards.map((card, index) => (
              <View key={card.id} style={[styles.adviceCard, isDark && styles.adviceCardDark]}>
                <View style={styles.adviceCardContent}>
                  <View style={[styles.adviceIconContainer, { backgroundColor: `${card.color}15` }]}>
                    <Ionicons name={card.icon as any} size={24} color={card.color} />
                  </View>
                  <View style={styles.adviceTextContainer}>
                    <Text style={[styles.adviceTitle, isDark && styles.adviceTitleDark]}>
                      {card.title}
                    </Text>
                    <Text style={[styles.adviceContent, isDark && styles.adviceContentDark]}>
                      {card.content}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Empty state only if no coaching prompts AND no advice cards */}
        {coachingPrompts.length === 0 && adviceCards.length === 0 && (
          <View style={styles.section}>
            <View style={[styles.contentCard, isDark && styles.contentCardDark]}>
              <View style={styles.emptyStateContainer}>
                <Ionicons 
                  name="bulb-outline" 
                  size={48} 
                  color={isDark ? '#8E8E93' : '#C7C7CC'} 
                />
                <Text style={[styles.emptyText, isDark && styles.emptyTextDark]}>
                  Weekly insights and advice will appear here based on your reflection patterns
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    );
  };

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      {/* Subtle Background Gradient */}
      <View style={StyleSheet.absoluteFillObject}>
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: isDark ? '#111827' : '#FFFFFF' }]} />
        <LinearGradient
          colors={isDark 
            ? ['rgba(255, 107, 77, 0.1)', 'rgba(255, 122, 89, 0.05)', 'transparent'] as const
            : ['rgba(255, 154, 0, 0.08)', 'rgba(255, 107, 77, 0.05)', 'transparent'] as const
          }
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 300,
          }}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          locations={[0, 0.6, 1]}
        />
      </View>

      {/* Header */}
      <LinearGradient
        colors={isDark 
          ? ['#FF6B4D', '#FF7A59'] as const
          : ['#FF9A00', '#FF6B4D'] as const
        }
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
      <View style={[styles.tabNavigationContainer, isDark && styles.tabNavigationContainerDark]}>
        <View style={[styles.tabNavigationInner, isDark && styles.tabNavigationInnerDark]}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.professionalTab,
                activeTab === tab.key && [styles.professionalTabActive, isDark && styles.professionalTabActiveDark]
              ]}
              onPress={() => setActiveTab(tab.key as TabType)}
            >
              <Ionicons 
                name={tab.icon as any} 
                size={22} 
                color={activeTab === tab.key 
                  ? (isDark ? '#FF6B4D' : '#FF7A59') 
                  : (isDark ? '#9CA3AF' : '#64748B')
                } 
              />
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
function getSentimentColor(sentiment: string | null, isDark: boolean): string {
  switch (sentiment?.toLowerCase()) {
    case 'positive':
      return isDark ? '#10B981' : '#059669';
    case 'negative':
      return isDark ? '#EF4444' : '#DC2626';
    case 'neutral':
    default:
      return isDark ? '#6B7280' : '#9CA3AF';
  }
}

// Working Circular Progress Component using react-native-svg
const CircularProgress: React.FC<{
  value: number;
  maxValue: number;
  size: number;
  strokeWidth: number;
  color: string;
  isDark: boolean;
}> = ({ value, maxValue, size, strokeWidth, color, isDark }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (value / maxValue) * circumference;
  const strokeDashoffset = circumference - progress;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        {/* Background circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={isDark ? '#2C2C2E' : '#E5E5EA'}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
    </View>
  );
};

// Dashboard-style Quick Stats Component
const DashboardQuickStats: React.FC<{
  moodScore: number;
  energyLevel: number;
  isDark: boolean;
}> = ({ moodScore, energyLevel, isDark }) => {
  return (
    <View style={styles.quickStatsContainer}>
      <View style={[styles.quickStatCard, isDark && styles.quickStatCardDark]}>
        <View style={styles.quickStatHeader}>
          <View style={[styles.quickStatIconContainer, { backgroundColor: '#007AFF15' }]}>
            <Ionicons name="happy-outline" size={20} color="#007AFF" />
          </View>
          <Text style={[styles.quickStatTitle, isDark && styles.quickStatTitleDark]}>
            Mood
          </Text>
        </View>
        
        <View style={styles.quickStatGaugeContainer}>
          <View style={styles.quickStatCircularProgress}>
            <CircularProgress
              value={moodScore}
              maxValue={10}
              size={80}
              strokeWidth={8}
              color="#007AFF"
              isDark={isDark}
            />
            <View style={styles.quickStatValueContainer}>
              <Text style={[styles.quickStatMainValue, isDark && styles.quickStatMainValueDark]}>
                {moodScore.toFixed(1)}
              </Text>
              <Text style={[styles.quickStatUnit, isDark && styles.quickStatUnitDark]}>
                /10
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.quickStatProgressInfo}>
          <Text style={[styles.quickStatProgressText, isDark && styles.quickStatProgressTextDark]}>
            {Math.round((moodScore / 10) * 100)}% of goal
          </Text>
          <View style={[styles.quickStatProgressBar, isDark && styles.quickStatProgressBarDark]}>
            <View 
              style={[
                styles.quickStatProgressFill, 
                { backgroundColor: '#007AFF', width: `${(moodScore / 10) * 100}%` }
              ]} 
            />
          </View>
        </View>
      </View>

      <View style={[styles.quickStatCard, isDark && styles.quickStatCardDark]}>
        <View style={styles.quickStatHeader}>
          <View style={[styles.quickStatIconContainer, { backgroundColor: '#34C75915' }]}>
            <Ionicons name="flash-outline" size={20} color="#34C759" />
          </View>
          <Text style={[styles.quickStatTitle, isDark && styles.quickStatTitleDark]}>
            Energy
          </Text>
        </View>
        
        <View style={styles.quickStatGaugeContainer}>
          <View style={styles.quickStatCircularProgress}>
            <CircularProgress
              value={energyLevel}
              maxValue={10}
              size={80}
              strokeWidth={8}
              color="#34C759"
              isDark={isDark}
            />
            <View style={styles.quickStatValueContainer}>
              <Text style={[styles.quickStatMainValue, isDark && styles.quickStatMainValueDark]}>
                {energyLevel.toFixed(1)}
              </Text>
              <Text style={[styles.quickStatUnit, isDark && styles.quickStatUnitDark]}>
                /10
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.quickStatProgressInfo}>
          <Text style={[styles.quickStatProgressText, isDark && styles.quickStatProgressTextDark]}>
            {Math.round((energyLevel / 10) * 100)}% of goal
          </Text>
          <View style={[styles.quickStatProgressBar, isDark && styles.quickStatProgressBarDark]}>
            <View 
              style={[
                styles.quickStatProgressFill, 
                { backgroundColor: '#34C759', width: `${(energyLevel / 10) * 100}%` }
              ]} 
            />
          </View>
        </View>
      </View>
    </View>
  );
};
function DashboardMetricCard({ 
  label, 
  value, 
  max, 
  color,
  icon,
  isDark
}: { 
  label: string; 
  value: number | null; 
  max: number; 
  color: string;
  icon: string;
  isDark: boolean;
}) {
  const displayValue = value ?? 0;
  const percentage = Math.round((displayValue / max) * 100);
  
  return (
    <View style={[styles.dashboardMetricCard, isDark && styles.dashboardMetricCardDark]}>
      <View style={styles.dashboardMetricHeader}>
        <Ionicons name={icon as any} size={20} color={color} />
        <Text style={[styles.dashboardMetricLabel, isDark && styles.dashboardMetricLabelDark]}>
          {label}
        </Text>
      </View>
      
      <View style={styles.dashboardMetricValueContainer}>
        <Text style={[styles.dashboardMetricValue, { color }, isDark && { color }]}>
          {displayValue.toFixed(1)}
        </Text>
        <Text style={[styles.dashboardMetricPercentage, isDark && styles.dashboardMetricPercentageDark]}>
          {percentage}%
        </Text>
      </View>
      
      <View style={[styles.dashboardMetricBar, isDark && styles.dashboardMetricBarDark]}>
        <View 
          style={[
            styles.dashboardMetricBarFill, 
            { backgroundColor: color, width: `${percentage}%` }
          ]} 
        />
      </View>
    </View>
  );
}

function MetricCard({ 
  label, 
  value, 
  max, 
  color,
  backgroundColor,
  icon,
  isDark
}: { 
  label: string; 
  value: number | null; 
  max: number; 
  color: string;
  backgroundColor: string;
  icon: string;
  isDark: boolean;
}) {
  const percent = value ? Math.max(0, Math.min(1, value / max)) : 0;
  
  return (
    <View style={[styles.metricCard, { backgroundColor }, isDark && styles.metricCardDark]}>
      <View style={styles.metricHeader}>
        <Ionicons name={icon as any} size={24} color={color} />
        <Text style={[styles.metricLabel, isDark && styles.metricLabelDark]}>{label}</Text>
      </View>
      
      <View style={styles.metricValueSection}>
        <Text style={[styles.metricValue, { color }]}>{value ?? '—'}</Text>
        <Text style={[styles.metricMax, isDark && styles.metricMaxDark]}>/ {max}</Text>
      </View>
      
      <View style={[styles.metricBarTrack, isDark && styles.metricBarTrackDark]}>
        <View style={[styles.metricBarFill, { width: `${percent * 100}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Container Styles
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  containerDark: {
    backgroundColor: '#111827',
  },

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
  tabNavigationContainerDark: {
    backgroundColor: '#1F2937',
    shadowColor: '#000',
  },
  tabNavigationInner: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 4,
  },
  tabNavigationInnerDark: {
    backgroundColor: '#374151',
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
    shadowColor: '#FF7A59',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  professionalTabActiveDark: {
    backgroundColor: '#1F2937',
    shadowColor: '#FF6B4D',
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
  moodChartContainerDark: {
    backgroundColor: '#1F2937',
    borderColor: '#374151',
    shadowColor: '#000',
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
  moodChartTitleDark: {
    color: '#FFFFFF',
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
  legendTextDark: {
    color: '#9CA3AF',
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
  moodBarTrackDark: {
    backgroundColor: '#374151',
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
  moodBarLabelDark: {
    color: '#9CA3AF',
  },
  moodBarScore: {
    color: '#374151',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  moodBarScoreDark: {
    color: '#D1D5DB',
  },
  moodInsight: {
    padding: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  moodInsightDark: {
    backgroundColor: '#374151',
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
  moodInsightTextDark: {
    color: '#D1D5DB',
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
  sectionHeaderDark: {
    color: '#FFFFFF',
  },

  // Quick Stats Styles (matching dashboard exactly)
  quickStatsContainer: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 8,
  },
  quickStatCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 0.5,
    borderColor: '#E5E5EA',
  },
  quickStatCardDark: {
    backgroundColor: '#1C1C1E',
    borderColor: '#38383A',
    shadowColor: '#000000',
    shadowOpacity: 0.3,
  },
  quickStatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  quickStatIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  quickStatTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
    letterSpacing: -0.2,
  },
  quickStatTitleDark: {
    color: '#FFFFFF',
  },
  quickStatGaugeContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  quickStatCircularProgress: {
    position: 'relative',
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickStatValueContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickStatMainValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000000',
    letterSpacing: -0.5,
  },
  quickStatMainValueDark: {
    color: '#FFFFFF',
  },
  quickStatUnit: {
    fontSize: 13,
    fontWeight: '500',
    color: '#8E8E93',
    marginTop: -2,
  },
  quickStatUnitDark: {
    color: '#8E8E93',
  },
  quickStatProgressInfo: {
    alignItems: 'center',
  },
  quickStatProgressText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#8E8E93',
    marginBottom: 8,
  },
  quickStatProgressTextDark: {
    color: '#8E8E93',
  },
  quickStatProgressBar: {
    width: '100%',
    height: 4,
    backgroundColor: '#E5E5EA',
    borderRadius: 2,
    overflow: 'hidden',
  },
  quickStatProgressBarDark: {
    backgroundColor: '#2C2C2E',
  },
  quickStatProgressFill: {
    height: '100%',
    borderRadius: 2,
  },

  // Modern Emotional Tags Styles
  emotionalTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  modernEmotionalTag: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F2F2F7',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  modernEmotionalTagDark: {
    backgroundColor: '#2C2C2E',
    borderColor: '#38383A',
  },
  modernTagText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3C3C43',
  },
  modernTagTextDark: {
    color: '#AEAEB2',
  },
  sentimentSection: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  sentimentSectionDark: {
    borderTopColor: '#38383A',
  },
  sentimentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  sentimentLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
  },
  sentimentLabelDark: {
    color: '#9CA3AF',
  },
  modernSentimentBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  modernSentimentValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    textTransform: 'capitalize',
  },
  dashboardChartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 100,
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  dashboardBarContainer: {
    alignItems: 'center',
    flex: 1,
  },
  dashboardBarWrapper: {
    height: 80,
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  dashboardBarTrack: {
    width: 8,
    backgroundColor: '#F2F2F7',
    borderRadius: 4,
    height: 80,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  dashboardBarTrackDark: {
    backgroundColor: '#2C2C2E',
  },
  dashboardBarFill: {
    width: '100%',
    borderRadius: 4,
    minHeight: 4,
  },
  dashboardBarLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
    textAlign: 'center',
  },
  dashboardBarLabelDark: {
    color: '#8E8E93',
  },

  // Dashboard Metrics Styles
  dashboardMetricsContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  dashboardMetricCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 0.5,
    borderColor: '#E5E5EA',
  },
  dashboardMetricCardDark: {
    backgroundColor: '#1C1C1E',
    borderColor: '#38383A',
  },
  dashboardMetricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  dashboardMetricLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
  },
  dashboardMetricLabelDark: {
    color: '#FFFFFF',
  },
  dashboardMetricValueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
    gap: 4,
  },
  dashboardMetricValue: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  dashboardMetricPercentage: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
  },
  dashboardMetricPercentageDark: {
    color: '#8E8E93',
  },
  dashboardMetricBar: {
    height: 4,
    backgroundColor: '#F2F2F7',
    borderRadius: 2,
    overflow: 'hidden',
  },
  dashboardMetricBarDark: {
    backgroundColor: '#2C2C2E',
  },
  dashboardMetricBarFill: {
    height: '100%',
    borderRadius: 2,
  },

  // Advice Cards Styles
  adviceCardsContainer: {
    gap: 16,
  },
  adviceCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    borderWidth: 0.5,
    borderColor: '#E5E5EA',
  },
  adviceCardDark: {
    backgroundColor: '#1C1C1E',
    borderColor: '#38383A',
  },
  adviceCardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  adviceIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  adviceTextContainer: {
    flex: 1,
  },
  adviceTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  adviceTitleDark: {
    color: '#FFFFFF',
  },
  adviceContent: {
    fontSize: 15,
    lineHeight: 20,
    color: '#3C3C43',
    fontWeight: '400',
    letterSpacing: -0.1,
  },
  adviceContentDark: {
    color: '#AEAEB2',
  },
  emptyStateContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  metricCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  metricCardDark: {
    borderColor: '#374151',
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
  metricLabelDark: {
    color: '#9CA3AF',
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
  metricMaxDark: {
    color: '#6B7280',
  },
  metricBarTrack: {
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  metricBarTrackDark: {
    backgroundColor: '#374151',
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
  contentCardDark: {
    backgroundColor: '#1F2937',
    borderColor: '#374151',
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
    borderLeftColor: '#FF7A59',
  },
  summaryCardDark: {
    backgroundColor: '#1F2937',
    borderColor: '#374151',
    borderLeftColor: '#FF6B4D',
  },
  summaryText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#374151',
    fontStyle: 'italic',
  },
  summaryTextDark: {
    color: '#D1D5DB',
  },
  contentText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#374151',
  },
  contentTextDark: {
    color: '#D1D5DB',
  },
  emptyText: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  emptyTextDark: {
    color: '#6B7280',
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
    backgroundColor: '#FF7A59',
    marginTop: 6,
  },
  bulletText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    color: '#374151',
  },
  bulletTextDark: {
    color: '#D1D5DB',
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
  sentimentLabelDark: {
    color: '#9CA3AF',
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
  dailyLogCardDark: {
    backgroundColor: '#1F2937',
    borderColor: '#374151',
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
  dailyLogDateDark: {
    color: '#D1D5DB',
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
  dailyLogContentDark: {
    color: '#D1D5DB',
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
  metadataTextDark: {
    color: '#9CA3AF',
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
    backgroundColor: '#FFF5F4',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  promptIconContainerDark: {
    backgroundColor: 'rgba(255, 107, 77, 0.1)',
  },
  promptText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    color: '#374151',
  },
  promptTextDark: {
    color: '#D1D5DB',
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
  footerTextDark: {
    color: '#6B7280',
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
  tabHeaderTitleDark: {
    color: '#FFFFFF',
  },
  moodChartDailySection: {
    marginBottom: 32,
  },
});