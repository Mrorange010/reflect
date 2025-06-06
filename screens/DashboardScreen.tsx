import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StyleSheet,
  FlatList,
  Image,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import { supabase } from '../utils/supabase';
import { EmotionalTagCloud } from '../components/dashboard/emotion-tags';
import { WeeklyInsights } from '../components/dashboard/weekly-insights';
import { RecentReflections } from '../components/dashboard/recent-reflections';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  useAnimatedProps,
} from 'react-native-reanimated';
import { Easing } from 'react-native-reanimated';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { View as RNView } from 'react-native';

const { width } = Dimensions.get('window');
const CARD_WIDTH = 230;

// ──────────────────────────────────────────────────────────────────────────────
// 1. Define a central Color palette for light mode
// ──────────────────────────────────────────────────────────────────────────────
const Colors = {
  background: '#F9F9F9',
  cardBackground: '#FFFFFF',
  border: '#E5E7EB',

  primary: '#4F46E5',
  primaryLight: '#E0E7FF',

  secondary: '#10B981',
  secondaryLight: '#D1FAE5',

  accent: '#F59E0B',
  accentLight: '#FEF3C7',

  textPrimary: '#1F2937',
  textSecondary: '#4B5563',
  textMuted: '#64748B',
  greetingBg: '#3F51B5',
};

// ──────────────────────────────────────────────────────────────────────────────
// 2. Type for each Weekly‐Card
// ──────────────────────────────────────────────────────────────────────────────
type WeeklyCard = {
  title: string;
  content: string;
  color: string; // solid color for background
};

type MoodEnergyCard = {
  title: string;
  content: string;
  color: string;
};

// ──────────────────────────────────────────────────────────────────────────────
// 3. Supabase helpers (unchanged logic, but trimmed spacing for brevity)
// ──────────────────────────────────────────────────────────────────────────────
const getUserId = async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id;
};

const fetchUserProfile = async (userId: string) => {
  const { data: userProfile } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
  return userProfile;
};

const fetchWeeklyCards = async (userId: string) => {
  const { data: weeklyCardsRaw } = await supabase
    .from('weekly_cards')
    .select('*')
    .eq('user_id', userId)
    .order('week_start_date', { ascending: false })
    .limit(1)
    .single();

  if (!weeklyCardsRaw) return { cards: [], moodEnergy: null };

  const cards: WeeklyCard[] = [];
  if (weeklyCardsRaw.advice1_title && weeklyCardsRaw.advice1_content) {
    cards.push({
      title: weeklyCardsRaw.advice1_title,
      content: weeklyCardsRaw.advice1_content,
      color: '#36C5F0',
    });
  }
  if (weeklyCardsRaw.advice2_title && weeklyCardsRaw.advice2_content) {
    cards.push({
      title: weeklyCardsRaw.advice2_title,
      content: weeklyCardsRaw.advice2_content,
      color: '#E01E5A',
    });
  }
  if (weeklyCardsRaw.advice3_title && weeklyCardsRaw.advice3_content) {
    cards.push({
      title: weeklyCardsRaw.advice3_title,
      content: weeklyCardsRaw.advice3_content,
      color: '#ECB22E',
    });
  }
  let moodEnergy: MoodEnergyCard | null = null;
  if (weeklyCardsRaw.mood_energy_title && weeklyCardsRaw.mood_energy_content) {
    moodEnergy = {
      title: weeklyCardsRaw.mood_energy_title,
      content: weeklyCardsRaw.mood_energy_content,
      color: '#2EB67D',
    };
  }
  return { cards, moodEnergy };
};

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

// ──────────────────────────────────────────────────────────────────────────────
// 4. Mental Status Bar (uses our new Colors)
// ──────────────────────────────────────────────────────────────────────────────
const MentalStatusBar: React.FC<{ score: number; delta: number }> = ({
  score,
  delta,
}) => {
  const percent = Math.max(0, Math.min(100, score));
  const barColor = Colors.secondary; // teal for positive/energizing
  let deltaText = '';
  let deltaColor = Colors.textMuted;
  if (delta > 0) {
    deltaText = `Up ${delta}% from last week`;
    deltaColor = Colors.secondary;
  } else if (delta < 0) {
    deltaText = `Down ${Math.abs(delta)}% from last week`;
    deltaColor = Colors.accent;
  } else {
    deltaText = 'No change from last week';
  }
  return (
    <View style={styles.mentalStatusCard}>
      <Text style={styles.mentalStatusLabel}>Mental Status</Text>
      <Text style={styles.mentalStatusSubtitle}>
        Avg. energy and mood levels for this week
      </Text>
      <View style={styles.growthBarRow}>
        <View style={styles.growthBarTrack}>
          <View
            style={[
              styles.growthBarFill,
              { width: `${percent}%`, backgroundColor: barColor },
            ]}
          />
        </View>
        <Text style={[styles.growthBarPercent, { color: barColor }]}>
          {percent}%
        </Text>
      </View>
      <Text style={[styles.mentalStatusDelta, { color: deltaColor }]}>
        {deltaText}
      </Text>
    </View>
  );
};

// ──────────────────────────────────────────────────────────────────────────────
// 5. "Enhanced" Styles (for AI Cards, etc.) using the Color palette
// ──────────────────────────────────────────────────────────────────────────────
const enhancedCardStyles = StyleSheet.create({
  cardsContainer: {
    paddingVertical: 20,
    paddingLeft: 24,
    paddingRight: 0,
  },
  cardsScrollView: {
    paddingRight: 24,
    flexDirection: 'row',
    gap: 1,
  },
  aiCard: {
    width: CARD_WIDTH,
    minHeight: 180,
    borderRadius: 20,
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 16,
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    marginHorizontal: 8,
    marginTop: 0,
    marginBottom: 10,
    backgroundColor: '#36C5F0', // will be overridden by card.color

    elevation: 4,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.7)',
  },
  aiCardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  aiCardSmallCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    borderWidth: 2,
    borderColor: '#fff',
  },
  aiCardHeaderText: {
    fontSize: 13,
    color: '#fff',
    opacity: 0.85,
    fontWeight: '500',
  },
  aiCardTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'left',
    marginTop: 0,
  },
  aiCardContent: {
    color: '#fff',
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '500',
    textAlign: 'left',
  },
});

// ──────────────────────────────────────────────────────────────────────────────
// 6. Main DashboardScreen Component
// ──────────────────────────────────────────────────────────────────────────────
export default function DashboardScreen() {
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
  const [mentalStatusScore, setMentalStatusScore] = useState<number>(0);
  const [mentalStatusDelta, setMentalStatusDelta] = useState<number>(0);
  const [weeklyCards, setWeeklyCards] = useState<WeeklyCard[]>([]);
  const [moodEnergyCard, setMoodEnergyCard] = useState<MoodEnergyCard | null>(null);
  const [latestWeeklyReflection, setLatestWeeklyReflection] = useState<any>(null);

  const scrollRef = useRef<ScrollView>(null);
  const navigation = useNavigation();

  // Greeting based on local time (Europe/Rome assumed)
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

      const weeklyCardsData = await fetchWeeklyCards(userId);
      setWeeklyCards(weeklyCardsData.cards);
      setMoodEnergyCard(weeklyCardsData.moodEnergy);

      const weeklyReflections = await fetchWeeklyReflections(userId);
      const dailyLogs = await fetchDailyLogs(userId);

      // Process latest reflection
      const latestWeeklyReflection = weeklyReflections[0];
      setLatestWeeklyReflection(latestWeeklyReflection);
      setAverageMood(
        latestWeeklyReflection?.mood_score
          ? Math.round((latestWeeklyReflection.mood_score / 10) * 100)
          : 0
      );
      setAverageEnergy(
        latestWeeklyReflection?.energy_level
          ? Math.round((latestWeeklyReflection.energy_level / 10) * 100)
          : 0
      );
      setReflectionQuality(
        latestWeeklyReflection?.reflection_quality
          ? Math.round((latestWeeklyReflection.reflection_quality / 10) * 100)
          : 0
      );
      setOverallSentiment(latestWeeklyReflection?.sentiment || 'neutral');

      if (weeklyReflections.length >= 2) {
        const weekScores = weeklyReflections.map((wr) => {
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
        weeklyReflections.slice(0, 3).map((wr) => {
          const startDate = new Date(wr.week_start_date);
          const endDate = new Date(startDate);
          endDate.setDate(startDate.getDate() + 6);
          const weekRange = `${startDate.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          })}–${endDate.toLocaleDateString('en-US', { day: 'numeric' })}`;
          return {
            weekRange,
            summary: wr.summary || '',
            mood: (wr.sentiment || 'neutral') as 'positive' | 'neutral' | 'challenging',
          };
        })
      );

      // Build moodData from dailyLogs
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1));
      startOfWeek.setHours(0, 0, 0, 0);

      const moodDataArr = days.map((day, i) => {
        const date = new Date(startOfWeek);
        date.setDate(startOfWeek.getDate() + i);
        const log = dailyLogs.find((l) => {
          const logDate = new Date(l.log_date);
          const normalizedLogDate = new Date(
            logDate.getFullYear(),
            logDate.getMonth(),
            logDate.getDate()
          );
          return normalizedLogDate.toDateString() === date.toDateString();
        });
        const moodScore = log?.mood_score || 0;
        let color = Colors.textMuted;
        if (moodScore >= 8) color = Colors.secondaryLight;
        else if (moodScore >= 6) color = Colors.accentLight;
        else if (moodScore > 0) color = '#FFE5E5'; // very pale red
        return { day, value: moodScore / 10, color };
      });
      setMoodData(moodDataArr);

      // Emotion tags fallback
      if (latestWeeklyReflection?.emotional_tags) {
        setEmotionTags(
          latestWeeklyReflection.emotional_tags
            .split(/[;,]/)
            .map((t: string) => t.trim())
            .filter(Boolean)
        );
      } else if (dailyLogs.length > 0 && dailyLogs[0].emotional_tags) {
        setEmotionTags(
          dailyLogs[0].emotional_tags
            .split(/[;,]/)
            .map((t: string) => t.trim())
            .filter(Boolean)
        );
      } else {
        setEmotionTags([]);
      }

      // Day Streak logic
      let streak = 0;
      let prevDate: Date | null = null;
      const sortedDailyLogs = [...dailyLogs].sort(
        (a, b) => new Date(b.log_date).getTime() - new Date(a.log_date).getTime()
      );
      for (let i = 0; i < sortedDailyLogs.length; i++) {
        const logDate = new Date(sortedDailyLogs[i].log_date);
        if (i === 0) {
          const todayOnly = new Date(
            new Date().getFullYear(),
            new Date().getMonth(),
            new Date().getDate()
          );
          const yesterdayOnly = new Date();
          yesterdayOnly.setDate(new Date().getDate() - 1);
          const yesterdayDateOnly = new Date(
            yesterdayOnly.getFullYear(),
            yesterdayOnly.getMonth(),
            yesterdayOnly.getDate()
          );

          if (
            logDate.toDateString() === todayOnly.toDateString() ||
            logDate.toDateString() === yesterdayDateOnly.toDateString()
          ) {
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

      // Average rating over last 14 days
      const fourteenDaysAgo = new Date();
      fourteenDaysAgo.setDate(today.getDate() - 14);
      const logsForAvg = dailyLogs.filter((l) => {
        const logDate = new Date(l.log_date);
        return logDate >= fourteenDaysAgo && logDate <= today;
      });
      const moodSum = logsForAvg.reduce((sum, l) => sum + (l.mood_score || 0), 0);
      setAvgRating(logsForAvg.length > 0 ? +(moodSum / logsForAvg.length).toFixed(1) : 0);

      // Entries in last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(today.getDate() - 7);
      sevenDaysAgo.setHours(0, 0, 0, 0);
      const todayEnd = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        23,
        59,
        59,
        999
      );
      const entriesCount = dailyLogs.filter((l) => {
        const logDate = new Date(l.log_date);
        const logDateStr = logDate.toLocaleDateString();
        const startStr = sevenDaysAgo.toLocaleDateString();
        const endStr = todayEnd.toLocaleDateString();
        return logDateStr >= startStr && logDateStr <= endStr;
      }).length;
      setEntries(entriesCount);

      // Mental Status Score & Delta
      let msScore = 0;
      let msDelta = 0;
      if (weeklyReflections.length >= 1) {
        const mood = weeklyReflections[0]?.mood_score || 0;
        const energy = weeklyReflections[0]?.energy_level || 0;
        msScore = Math.round(((mood + energy) / 2) * 10);
      }
      if (weeklyReflections.length >= 2) {
        const prevMood = weeklyReflections[1]?.mood_score || 0;
        const prevEnergy = weeklyReflections[1]?.energy_level || 0;
        const prevScore = Math.round(((prevMood + prevEnergy) / 2) * 10);
        msDelta = msScore - prevScore;
      }
      setMentalStatusScore(msScore);
      setMentalStatusDelta(msDelta);
    };

    loadDashboardData();
  }, []);

  // ────────────────────────────────────────────────────────────────────────────
  // 7. AnimatedCircle for SVG progress
  // ────────────────────────────────────────────────────────────────────────────
  const AnimatedCircle = Animated.createAnimatedComponent(Circle);

  // ────────────────────────────────────────────────────────────────────────────
  // 8. Compact Snapshot Card
  // ────────────────────────────────────────────────────────────────────────────
  const CompactSnapshotCard: React.FC<{
    label: string;
    valueOutOf10: number;
    percentage: number;
    color: string;
    icon: string;
    style?: any;
  }> = ({ label, valueOutOf10, percentage, color, icon, style }) => {
    return (
      <View style={[styles.compactCard, style]}>
        <View style={styles.compactCardHeader}>
          <Text style={[styles.compactLabel, { color: Colors.textMuted }]}>{label}</Text>
        </View>
        <View style={styles.compactCardContent}>
          <CircularProgress percentage={percentage} size={48} color={color} strokeWidth={4} />
          <Text style={[styles.compactPercentage, { color, marginLeft: 12 }]}>{valueOutOf10}/10</Text>
        </View>
      </View>
    );
  };

  // ────────────────────────────────────────────────────────────────────────────
  // 9. Enhanced CircularProgress
  // ────────────────────────────────────────────────────────────────────────────
  const CircularProgress: React.FC<{
    percentage: number;
    size?: number;
    color: string;
    strokeWidth?: number;
  }> = ({ percentage, size = 48, color, strokeWidth = 6 }) => {
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
      const strokeDashoffset =
        circumference - (animatedPercent.value / 100) * circumference;
      return { strokeDashoffset };
    });

    // Use React state for the displayed number inside the gauge
    const [displayedPercent, setDisplayedPercent] = React.useState(0);
    useEffect(() => {
      setDisplayedPercent(percentage);
    }, [percentage]);

    return (
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size} style={{ position: 'absolute' }}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={Colors.border}
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
          <Text style={{ color, fontSize: 10, fontWeight: 'bold', textAlign: 'center' }}>
            {displayedPercent}%
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.greetingBg }}>
      <StatusBar backgroundColor={Colors.greetingBg} barStyle="light-content" />
      <View style={[styles.headerGradient, { backgroundColor: Colors.greetingBg }]}> 
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greetingSmall}>{getCurrentGreeting()}, {userName}</Text>
            <Text style={styles.dateText}>{getCurrentDate()}</Text>
          </View>
        </View>
      </View>
      <View style={{ flex: 1, backgroundColor: Colors.background }}>
        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* ┌────────────────────────────────────────────────────────────────────┐
               │  WEEKLY AI CARDS                                                │
               └────────────────────────────────────────────────────────────────────┘ */}
          {weeklyCards.length > 0 && (
            <View style={enhancedCardStyles.cardsContainer}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={enhancedCardStyles.cardsScrollView}
                decelerationRate="fast"
                snapToInterval={CARD_WIDTH + 16}
                snapToAlignment="start"
              >
                {weeklyCards.map((card, index) => (
                  <View
                    key={index}
                    style={[enhancedCardStyles.aiCard, { backgroundColor: card.color }]}
                  >
                    <View style={enhancedCardStyles.aiCardHeaderRow}>
                      <View style={enhancedCardStyles.aiCardSmallCircle}>
                        <Image source={require('../assets/icons/ai.png')} style={{ width: 16, height: 16 }} />
                      </View>
                      <Text style={enhancedCardStyles.aiCardHeaderText}>Ava suggests</Text>
                    </View>
                    <Text style={enhancedCardStyles.aiCardTitle}>{card.title}</Text>
                    <Text style={enhancedCardStyles.aiCardContent}>{card.content}</Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          {/* ┌────────────────────────────────────────────────────────────────────┐
               │  QUICK STATS (Streak | Avg Rating | Entries)                    │
               └────────────────────────────────────────────────────────────────────┘ */}
          <View style={styles.overviewSection}>
            <Text style={styles.sectionTitle}>Quick Stats</Text>
            <View style={styles.quickStatsContainer}>
              <View style={styles.quickStatsBanner}>
                <AnimatedStat value={dayStreak} label="Day Streak" decimals={0} />
                <View style={styles.statSeparator} />
                <AnimatedStat value={avgRating} label="Avg Rating" decimals={1} />
                <View style={styles.statSeparator} />
                <AnimatedStat value={entries} label="Entries" decimals={0} />
              </View>
            </View>
            <View style={styles.compactGrid}>
              <CompactSnapshotCard
                label="Mood"
                valueOutOf10={
                  typeof latestWeeklyReflection?.mood_score === 'number'
                    ? Number(Number(latestWeeklyReflection.mood_score).toFixed(1))
                    : Number((averageMood / 10).toFixed(1))
                }
                percentage={
                  typeof latestWeeklyReflection?.mood_score === 'number'
                    ? Math.round(Number(latestWeeklyReflection.mood_score) * 10)
                    : Math.round(averageMood)
                }
                color="#2EB67D"
                icon="happy-outline"
                style={{ marginHorizontal: 8, flex: 1 }}
              />
              <CompactSnapshotCard
                label="Energy"
                valueOutOf10={
                  typeof latestWeeklyReflection?.energy_level === 'number'
                    ? Number(Number(latestWeeklyReflection.energy_level).toFixed(1))
                    : Number((averageEnergy / 10).toFixed(1))
                }
                percentage={
                  typeof latestWeeklyReflection?.energy_level === 'number'
                    ? Math.round(Number(latestWeeklyReflection.energy_level) * 10)
                    : Math.round(averageEnergy)
                }
                color="#ECB22E"
                icon="flash-outline"
                style={{ marginHorizontal: 8, flex: 1 }}
              />
            </View>
            {moodEnergyCard && (
              <View style={[enhancedCardStyles.aiCard, { backgroundColor: moodEnergyCard.color, width: '100%', marginTop: 10, marginBottom: 10, marginHorizontal: 8 }]}> 
                <View style={enhancedCardStyles.aiCardHeaderRow}>
                  <View style={enhancedCardStyles.aiCardSmallCircle}>
                    <Image source={require('../assets/icons/ai.png')} style={{ width: 16, height: 16 }} />
                  </View>
                  <Text style={enhancedCardStyles.aiCardHeaderText}>Advice from Ava</Text>
                </View>
                <Text style={enhancedCardStyles.aiCardTitle}>{moodEnergyCard.title}</Text>
                <Text style={enhancedCardStyles.aiCardContent}>{moodEnergyCard.content}</Text>
              </View>
            )}
          </View>

          {/* ┌────────────────────────────────────────────────────────────────────┐
               │  THIS WEEK'S MOOD (Bar Chart)                                    │
               └────────────────────────────────────────────────────────────────────┘ */}
          <Text
            style={{
              fontSize: 20,
              fontWeight: '700',
              color: Colors.textPrimary,
              marginLeft: 24,
              marginBottom: 8,
            }}
          >
            This week's mood
          </Text>
          <View style={styles.chartContainer}>
            <AnimatedMoodBars moodData={moodData} />
            {moodData && moodData.filter((d) => d.value > 0).length > 0 ? (
              <View style={styles.chartInsight}>
                <View
                  style={[
                    styles.insightIcon,
                    { backgroundColor: Colors.accentLight },
                  ]}
                >
                  <Ionicons name="bulb" size={14} color={Colors.accent} />
                </View>
                <Text style={styles.insightText}>
                  {moodData.filter((d) => d.value >= 0.6).length >= 3
                    ? `You've had ${
                        moodData.filter((d) => d.value >= 0.6).length
                      } good mood days this week!`
                    : 'Chat with Ava to get more insights on your mood.'}
                </Text>
              </View>
            ) : (
              <View style={styles.chartInsight}>
                <View
                  style={[
                    styles.insightIcon,
                    { backgroundColor: Colors.border },
                  ]}
                >
                  <Ionicons
                    name="information-circle-outline"
                    size={14}
                    color={Colors.textMuted}
                  />
                </View>
                <Text style={styles.insightText}>
                  Log your mood daily to see your weekly patterns.
                </Text>
              </View>
            )}
          </View>

          {/* ┌────────────────────────────────────────────────────────────────────┐
               │  RECENT REFLECTIONS                                                │
               └────────────────────────────────────────────────────────────────────┘ */}
          <RecentReflections />

          {/* Bottom Padding */}
          <View style={{ height: 32 }} />

          {/* ┌────────────────────────────────────────────────────────────────────┐
               │  TEST CALL BUTTON                                                 │
               └────────────────────────────────────────────────────────────────────┘ */}
          <TouchableOpacity
            style={styles.testCallButton}
            onPress={() => (navigation as any).navigate('Call')}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={[Colors.secondary, Colors.primary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.testCallButtonGradient}
            >
              <Ionicons
                name="call"
                size={22}
                color={Colors.cardBackground}
                style={{ marginRight: 8 }}
              />
              <Text style={styles.testCallButtonText}>Test Call</Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// 10. Mood Bar and Animated Bars (unchanged logic; just using Colors if needed)
// ──────────────────────────────────────────────────────────────────────────────
const MoodBar: React.FC<{
  data: { day: string; value: number; color: string };
  style: any;
}> = ({ data, style }) => {
  const barHeight = useSharedValue(0);
  useFocusEffect(
    React.useCallback(() => {
      barHeight.value = 0;
      barHeight.value = withTiming(data.value * 80, {
        duration: 900,
        easing: Easing.out(Easing.exp),
      });
    }, [data.value])
  );
  const animatedStyle = useAnimatedStyle(() => ({
    height: barHeight.value,
  }));
  return (
    <View style={style.barColumn}>
      <View style={style.barWrapper}>
        <Animated.View
          style={[
            { width: '100%', borderRadius: 8, backgroundColor: data.color },
            animatedStyle,
          ]}
        >
          <LinearGradient
            colors={[data.color, `${data.color}80`]}
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

const AnimatedMoodBars: React.FC<{
  moodData: { day: string; value: number; color: string }[];
}> = ({ moodData }) => {
  if (!moodData || moodData.length === 0) {
    return (
      <View style={styles.chartBars}>
        <Text style={{ color: Colors.textMuted }}>
          No mood data available for this week.
        </Text>
      </View>
    );
  }
  return (
    <View style={styles.chartBars}>
      {moodData.map((d) => (
        <MoodBar key={d.day} data={d} style={styles} />
      ))}
    </View>
  );
};

// ──────────────────────────────────────────────────────────────────────────────
// 11. AnimatedStat (same as before, just text color unified)
// ──────────────────────────────────────────────────────────────────────────────
const AnimatedStat: React.FC<{ value: number; label: string; decimals?: number }> = ({
  value,
  label,
  decimals = 0,
}) => {
  const animatedValue = useSharedValue(0);
  useFocusEffect(
    React.useCallback(() => {
      animatedValue.value = 0;
      animatedValue.value = withTiming(value, { duration: 900 });
    }, [value])
  );
  const animatedText = useAnimatedStyle(() => ({
    color: Colors.textPrimary,
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

// ──────────────────────────────────────────────────────────────────────────────
// 12. Core Styles (updated to use Colors)
// ──────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingTop: 20,
  },

  // ───── HEADER ────────────────────────────────────────────────────────────────
  headerGradient: {
    paddingBottom: 0,
    paddingTop: 0,
    backgroundColor: Colors.greetingBg,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 0,
    paddingBottom: 24,
  },
  greetingSmall: {
    fontSize: 27,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2,
    paddingTop: 10,
  },
  dateText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },

  // ───── OVERVIEW SECTION ─────────────────────────────────────────────────────
  overviewSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: 16,
  },

  // ───── COMPACT GRID ─────────────────────────────────────────────────────────
  compactGrid: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    gap: 0,
    marginHorizontal: 0,
  },
  compactCard: {
    backgroundColor: Colors.cardBackground,
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
    borderColor: Colors.border,
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
    color: Colors.textMuted,
  },
  compactCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  compactPercentage: {
    fontSize: 16,
    fontWeight: 'bold',
  },

  // ───── QUICK STATS BANNER ────────────────────────────────────────────────────
  quickStatsContainer: {
    marginBottom: 18,
    marginTop: 0,
    paddingHorizontal: 0,
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
    backgroundColor: Colors.cardBackground,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quickStat: {
    alignItems: 'center',
    flex: 1,
  },
  quickStatLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  statSeparator: {
    width: 1,
    height: 40,
    backgroundColor: Colors.border,
    marginHorizontal: 16,
  },

  // ───── CHART CONTAINER ──────────────────────────────────────────────────────
  chartContainer: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 24,
    padding: 24,
    marginHorizontal: 20,
    marginTop: 4,
    elevation: 4,
    borderWidth: 1,
    borderColor: Colors.border,
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
    backgroundColor: Colors.background,
    borderRadius: 8,
    height: 80,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  barLabel: {
    color: Colors.textMuted,
    fontSize: 11,
    marginTop: 8,
    fontWeight: '600',
  },
  chartInsight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 16,
    backgroundColor: Colors.secondaryLight,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#B2DFDB',
    marginTop: 8,
  },
  insightIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightText: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    lineHeight: 20,
  },

  // ───── TEST CALL BUTTON ─────────────────────────────────────────────────────
  testCallButton: {
    marginHorizontal: 24,
    marginBottom: 24,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  testCallButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
  },
  testCallButtonText: {
    color: Colors.cardBackground,
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },

  // ───── MENTAL STATUS CARD ───────────────────────────────────────────────────
  mentalStatusCard: {
    marginTop: 16,
    marginHorizontal: 0,
    padding: 20,
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'flex-start',
  },
  mentalStatusLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 2,
  },
  mentalStatusSubtitle: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 0,
    marginBottom: 12,
    fontWeight: '500',
  },
  mentalStatusDelta: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  growthBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 6,
  },
  growthBarTrack: {
    flex: 1,
    height: 14,
    backgroundColor: '#F3F4F6',
    borderRadius: 7,
    overflow: 'hidden',
    marginRight: 12,
  },
  growthBarFill: {
    height: 14,
    borderRadius: 7,
  },
  growthBarPercent: {
    fontSize: 16,
    fontWeight: 'bold',
    minWidth: 48,
    textAlign: 'right',
  },
});
