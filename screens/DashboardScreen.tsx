import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StyleSheet,
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import { supabase } from '../utils/supabase';
import { EmotionalTagCloud } from '../components/dashboard/emotion-tags';
import { WeeklyInsights } from '../components/dashboard/weekly-insights';
import { RecentReflections } from '../components/dashboard/recent-reflections';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, useAnimatedProps } from 'react-native-reanimated';
import { Easing } from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/native';

const { width } = Dimensions.get('window');

// Helper function to get user ID safely
const getUserId = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id;
};

// Fetch user profile
const fetchUserProfile = async (userId: string) => {
  const { data: userProfile } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
  return userProfile;
};

// Fetch weekly reflections
const fetchWeeklyReflections = async (userId: string) => {
  const fourWeeksAgo = new Date();
  fourWeeksAgo.setDate(new Date().getDate() - 28);

  const { data: weeklyReflectionsRaw } = await supabase
    .from('weekly_reflections')
    .select('*')
    .eq('user_id', userId)
    .gte('week_start_date', fourWeeksAgo.toISOString().split('T')[0])
    .lte('week_start_date', new Date().toISOString().split('T')[0])
    .order('week_start_date', { ascending: false })
    .limit(4);
  return weeklyReflectionsRaw || [];
};

// Fetch daily logs
const fetchDailyLogs = async (userId: string) => {
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(new Date().getDate() - 14);

  const { data: dailyLogsRaw } = await supabase
    .from('daily_logs')
    .select('*')
    .eq('user_id', userId)
    .gte('log_date', fourteenDaysAgo.toISOString().split('T')[0])
    .lte('log_date', new Date().toISOString().split('T')[0])
    .order('log_date', { ascending: false })
    .limit(14);
  return dailyLogsRaw || [];
};

export default function DashboardScreen() {
  const [selectedInsight, setSelectedInsight] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  // Dashboard state
  const [userName, setUserName] = useState('');
  const [emotionTags, setEmotionTags] = useState<string[]>([]);
  const [lastThreeWeeks, setLastThreeWeeks] = useState<
    { weekRange: string; summary: string; mood: 'positive' | 'neutral' | 'challenging' }[]
  >([]);
  const [averageMood, setAverageMood] = useState<number>(0);
  const [averageEnergy, setAverageEnergy] = useState<number>(0);
  const [reflectionQuality, setReflectionQuality] = useState<number>(0);
  const [overallSentiment, setOverallSentiment] = useState<
    'positive' | 'neutral' | 'challenging'
  >('neutral');
  const [growth, setGrowth] = useState<number>(0);
  const [moodData, setMoodData] = useState<{ day: string; value: number; color: string }[]>([]);
  const [dayStreak, setDayStreak] = useState<number>(0);
  const [avgRating, setAvgRating] = useState<number>(0);
  const [entries, setEntries] = useState<number>(0);

  // Get current date and greeting
  const getCurrentGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getCurrentDate = () => {
    const today = new Date();
    return today.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  };

  useEffect(() => {
    const loadDashboardData = async () => {
      const today = new Date();
      const userId = await getUserId();
      if (!userId) return;

      const userProfile = await fetchUserProfile(userId);
      setUserName(userProfile?.name || '');

      const weeklyReflections = await fetchWeeklyReflections(userId);
      const dailyLogs = await fetchDailyLogs(userId);

      // Process weekly reflections
      const latestWeeklyReflection = weeklyReflections[0];
      setAverageMood(latestWeeklyReflection?.mood_score ? Math.round((latestWeeklyReflection.mood_score / 10) * 100) : 0);
      setAverageEnergy(latestWeeklyReflection?.energy_level ? Math.round((latestWeeklyReflection.energy_level / 10) * 100) : 0);
      setReflectionQuality(latestWeeklyReflection?.reflection_quality ? Math.round((latestWeeklyReflection.reflection_quality / 10) * 100) : 0);
      setOverallSentiment(latestWeeklyReflection?.sentiment || 'neutral');

      if (weeklyReflections.length >= 2) {
        const weekScores = weeklyReflections.map(wr => {
          const mood = wr.mood_score || 0;
          const energy = wr.energy_level || 0;
          const quality = wr.reflection_quality || 0;
          return (mood + energy + quality) / 3;
        });
        const growthValue = weekScores[0] - weekScores[1];
        setGrowth(Math.max(0, Math.round((growthValue / 10) * 100 + 50)));
      } else {
        setGrowth(50);
      }

      setLastThreeWeeks(
        weeklyReflections.slice(0, 3).map(wr => {
          const startDate = new Date(wr.week_start_date);
          const endDate = new Date(startDate);
          endDate.setDate(startDate.getDate() + 6);
          const weekRange = `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}–${endDate.toLocaleDateString('en-US', { day: 'numeric' })}`;
          return {
            weekRange,
            summary: wr.summary || '',
            mood: (wr.sentiment || 'neutral') as 'positive' | 'neutral' | 'challenging',
          };
        })
      );

      // Process daily logs for mood data
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1));
      startOfWeek.setHours(0,0,0,0);
      
      const moodDataArr = days.map((day, i) => {
        const date = new Date(startOfWeek);
        date.setDate(startOfWeek.getDate() + i);
        const log = dailyLogs.find(l => {
          const logDate = new Date(l.log_date);
          const normalizedLogDate = new Date(logDate.getFullYear(), logDate.getMonth(), logDate.getDate());
          return normalizedLogDate.toDateString() === date.toDateString();
        });
        const moodScore = log?.mood_score || 0;
        let color = '#9CA3AF';
        if (moodScore >= 8) color = '#10B981';
        else if (moodScore >= 6) color = '#F59E0B';
        else if (moodScore >= 4) color = '#EF4444';
        else if (moodScore > 0) color = '#DC2626';
        return { day, value: moodScore / 10, color };
      });
      setMoodData(moodDataArr);

      // Process emotion tags
      if (latestWeeklyReflection?.emotional_tags) {
        setEmotionTags(latestWeeklyReflection.emotional_tags.split(/[;,]/).map((t: string) => t.trim()).filter(Boolean));
      } else if (dailyLogs.length > 0 && dailyLogs[0].emotional_tags) {
        setEmotionTags(dailyLogs[0].emotional_tags.split(/[;,]/).map((t: string) => t.trim()).filter(Boolean));
      } else {
        setEmotionTags([]);
      }

      // Process day streak
      let streak = 0;
      let prevDate: Date | null = null;
      const sortedDailyLogs = [...dailyLogs].sort((a,b) => new Date(b.log_date).getTime() - new Date(a.log_date).getTime());

      for (let i = 0; i < sortedDailyLogs.length; i++) {
        const logDate = new Date(sortedDailyLogs[i].log_date);
        if (i === 0) {
          const todayDateOnly = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
          const yesterdayDate = new Date();
          yesterdayDate.setDate(new Date().getDate() -1);
          const yesterdayDateOnly = new Date(yesterdayDate.getFullYear(), yesterdayDate.getMonth(), yesterdayDate.getDate());

          if (logDate.toDateString() === todayDateOnly.toDateString() || logDate.toDateString() === yesterdayDateOnly.toDateString()) {
            streak = 1;
          } else {
            break; 
          }
        } else {
          const diffTime = Math.abs(prevDate!.getTime() - logDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          if (diffDays === 1) {
            streak++;
          } else {
            break;
          }
        }
        prevDate = logDate;
      }
      setDayStreak(streak);
      
      // Process average rating (use only logs in the last 14 days)
      const fourteenDaysAgo = new Date();
      fourteenDaysAgo.setDate(today.getDate() - 14);
      
      const logsForAvg = dailyLogs.filter(l => {
        const logDate = new Date(l.log_date);
        // Compare only date part, local timezone
        return logDate >= fourteenDaysAgo && logDate <= today;
      });
      const moodSum = logsForAvg.reduce((sum, l) => sum + (l.mood_score || 0), 0);
      setAvgRating(logsForAvg.length > 0 ? +(moodSum / logsForAvg.length).toFixed(1) : 0);

      // Process entries (count of daily logs in the last 7 days from today, inclusive)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(today.getDate() - 7);
      sevenDaysAgo.setHours(0,0,0,0);
      const todayEndDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

      const entriesCount = dailyLogs.filter(l => {
        const logDate = new Date(l.log_date);
        // Compare only date part, local timezone
        const logDateString = logDate.toLocaleDateString();
        const startString = sevenDaysAgo.toLocaleDateString();
        const endString = todayEndDate.toLocaleDateString();
        // Debug log
        console.log('Entry check:', { logDateString, startString, endString });
        return logDateString >= startString && logDateString <= endString;
      }).length;
      setEntries(entriesCount);
    };
    loadDashboardData();
  }, []);

  // AnimatedCircle for SVG
  const AnimatedCircle = Animated.createAnimatedComponent(Circle);

  // Compact Snapshot Card
  const CompactSnapshotCard: React.FC<{
    label: string;
    percentage: number;
    color: string;
    icon: keyof typeof Ionicons.glyphMap;
  }> = ({ label, percentage, color, icon }) => (
    <View style={styles.compactCard}>
      <View style={styles.compactCardHeader}>
        <Ionicons name={icon as any} size={16} color={color} />
        <Text style={styles.compactLabel}>{label}</Text>
      </View>
      <View style={styles.compactCardContent}>
        <CircularProgress percentage={percentage} size={40} color={color} strokeWidth={4} />
        <Text style={[styles.compactPercentage, { color }]}>
          {percentage}%
        </Text>
      </View>
    </View>
  );

  // Enhanced CircularProgress component
  const CircularProgress: React.FC<{ 
    percentage: number; 
    size?: number; 
    color: string;
    strokeWidth?: number;
  }> = ({ percentage, size = 50, color, strokeWidth = 6 }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const animatedPercent = useSharedValue(0);

    useFocusEffect(
      React.useCallback(() => {
        animatedPercent.value = 0;
        animatedPercent.value = withTiming(percentage, { duration: 900 });
      }, [percentage])
    );

    const animatedProps = useAnimatedProps(() => {
      const strokeDashoffset = circumference - (animatedPercent.value / 100) * circumference;
      return { strokeDashoffset };
    });

    const animatedText = useAnimatedStyle(() => ({
      color: color,
      fontSize: 12,
      fontWeight: 'bold',
    }));

    return (
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size} style={{ position: 'absolute' }}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="rgba(148, 163, 184, 0.15)"
            strokeWidth={strokeWidth}
            fill="none"
          />
          <AnimatedCircle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            animatedProps={animatedProps}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </Svg>
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Animated.Text style={animatedText}>
            {Math.round(animatedPercent.value)}%
          </Animated.Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header with Gradient */}
      <LinearGradient
        colors={['#667EEA', '#764BA2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.headerGradient, { paddingTop: 30, minHeight: 120 }]}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greetingSmaller}>{getCurrentGreeting()}, {userName}</Text>
            <Text style={styles.dateText}>{getCurrentDate()}</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Wellness Overview - Compact Grid */}
        <View style={styles.overviewSection}>
          <Text style={styles.sectionTitle}>Wellness Overview</Text>
          <View style={styles.compactGrid}>
            <CompactSnapshotCard
              label="Mood"
              percentage={averageMood}
              color="#10B981"
              icon="happy-outline"
            />
            <CompactSnapshotCard
              label="Energy"
              percentage={averageEnergy}
              color="#6366F1"
              icon="flash-outline"
            />
            <CompactSnapshotCard
              label="Quality"
              percentage={reflectionQuality}
              color="#F59E0B"
              icon="star-outline"
            />
            <CompactSnapshotCard
              label="Growth"
              percentage={growth}
              color="#EC4899"
              icon="trending-up-outline"
            />
          </View>
        </View>

        {/* Quick Stats Banner */}
        <View style={styles.quickStatsContainer}>
          <View style={[styles.quickStatsBanner, { backgroundColor: 'white' }]}>
            <AnimatedStat value={dayStreak} label="Day Streak" decimals={0} />
            <View style={styles.statSeparator} />
            <AnimatedStat value={avgRating} label="Avg Rating" decimals={1} />
            <View style={styles.statSeparator} />
            <AnimatedStat value={entries} label="Entries" decimals={0} />
          </View>
        </View>

        {/* Enhanced Mood Chart */}
        <View style={styles.chartContainer}>
          <View style={styles.chartHeader}>
            <View>
              <Text style={styles.chartTitle}>Weekly Mood Pattern</Text>
              <Text style={styles.chartSubtitle}>Your emotional journey</Text>
            </View>
          </View>
          {/* Animated Mood Bars */}
          <AnimatedMoodBars moodData={moodData} />
          {moodData && moodData.filter(d => d.value > 0).length > 0 ? (
            <View style={styles.chartInsight}>
              <View style={styles.insightIcon}>
                <Ionicons name="bulb" size={14} color="#F59E0B" />
              </View>
              <Text style={styles.insightText}>
                {moodData.filter(d => d.value >= 0.6).length >= 3 
                  ? `You've had ${moodData.filter(d => d.value >= 0.6).length} good mood days this week!`
                  : "Keep logging to see more insights here."}
              </Text>
            </View>
          ) : (
            <View style={styles.chartInsight}>
               <View style={styles.insightIcon}>
                <Ionicons name="information-circle-outline" size={14} color="#64748B" />
              </View>
              <Text style={styles.insightText}>
                Log your mood daily to see your weekly patterns.
              </Text>
            </View>
          )}
        </View>

        {/* Weekly Insights */}
        <WeeklyInsights />

        {/* Emotional Tags - Redesigned */}
        <EmotionalTagCloud />

        {/* Recent Reflections */}
        <RecentReflections />

        {/* Bottom Padding */}
        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

// Individual Mood Bar component
const MoodBar: React.FC<{ data: { day: string; value: number; color: string }; style: any }> = ({ data, style }) => {
  const barHeight = useSharedValue(0);

  useFocusEffect(
    React.useCallback(() => {
      barHeight.value = 0; // Reset animation
      barHeight.value = withTiming(data.value * 80, { // 80 is the max height of the bar
        duration: 900,
        easing: Easing.out(Easing.exp),
      });
    }, [data.value]) // Rerun animation if value changes
  );

  const animatedStyle = useAnimatedStyle(() => {
    return {
      height: barHeight.value,
    };
  });

  return (
    <View style={style.barColumn}>
      <View style={style.barWrapper}>
        <Animated.View style={[{ width: '100%', borderRadius: 8, backgroundColor: data.color }, animatedStyle]}>
          <LinearGradient
            colors={[data.color, `${data.color}80`]} // Adjust gradient opacity if needed
            style={{
              width: '100%',
              height: '100%',
              borderRadius: 8,
              position: 'absolute',
              top: 0,
              left: 0,
            }}
          />
        </Animated.View>
      </View>
      <Text style={style.barLabel}>{data.day}</Text>
    </View>
  );
};

// Animated Mood Bars component
const AnimatedMoodBars: React.FC<{ moodData: { day: string; value: number; color: string }[] }> = ({ moodData }) => {
  if (!moodData || moodData.length === 0) {
    return <View style={styles.chartBars}><Text>No mood data available for this week.</Text></View>;
  }
  return (
    <View style={styles.chartBars}>
      {moodData.map((d) => (
        <MoodBar key={d.day} data={d} style={styles} />
      ))}
    </View>
  );
};

// AnimatedStat component for counting up numbers
const AnimatedStat: React.FC<{ value: number; label: string; decimals?: number }> = ({ value, label, decimals = 0 }) => {
  const animatedValue = useSharedValue(0);
  useFocusEffect(
    React.useCallback(() => {
      animatedValue.value = 0;
      animatedValue.value = withTiming(value, { duration: 900 });
    }, [value])
  );
  const animatedText = useAnimatedStyle(() => ({
    color: '#667EEA',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  }));
  return (
    <View style={styles.quickStat}>
      <Animated.Text style={animatedText}>
        {animatedValue.value.toFixed(decimals)}
      </Animated.Text>
      <Text style={styles.quickStatLabel}>{label}</Text>
    </View>
  );
};

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
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  greetingSmaller: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 2,
    paddingTop: 18,
  },
  dateText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },

  // Scroll Content
  scrollContent: {
    paddingTop: 20,
  },

  // Section Styles
  overviewSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 16,
  },

  // Compact Grid Styles
  compactGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  compactCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    flex: 1,
    minWidth: (width - 72) / 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  compactCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 6,
  },
  compactLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  compactCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  compactPercentage: {
    fontSize: 18,
    fontWeight: 'bold',
  },

  // Quick Stats Banner
  quickStatsContainer: {
    paddingHorizontal: 24,
    marginBottom: 2,
  },
  quickStatsBanner: {
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  quickStat: {
    alignItems: 'center',
    flex: 1,
  },
  quickStatLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  statSeparator: {
    width: 1,
    height: 40,
    backgroundColor: '#CBD5E1',
    marginHorizontal: 16,
  },

  // Enhanced Chart Container
  chartContainer: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 24,
    margin: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  chartTitle: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  chartSubtitle: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '500',
  },
  chartBars: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 100,
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 2,
  },
  barWrapper: {
    width: 24,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    height: 80,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  barLabel: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 8,
    fontWeight: '600',
  },
  chartInsight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 16,
    backgroundColor: '#FFFBEB',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FEF3C7',
  },
  insightIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightText: {
    color: '#92400E',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    lineHeight: 20,
  },
});