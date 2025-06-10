// screens/DashboardScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  FadeIn,
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { supabase } from '../utils/supabase';
import { useTheme } from '../contexts/ThemeContext';

// Import custom components
import QuickStatsCards from '../components/QuickStatsCards';
import AdviceCards from '../components/AdviceCards';
import WeeklyTrendsCards from '../components/WeeklyTrendsCards';
import HighlightsSection from '../components/HighlightsSection';
import LatestLogs from '../components/LatestLogs';

const { width, height } = Dimensions.get('window');

// ──────────────────────────────────────────────────────────────────────────────
// Apple Health-style gradient background (top only)
// ──────────────────────────────────────────────────────────────────────────────
const HealthGradientBackground = () => {
  const { isDark } = useTheme();
  return (
    <View style={StyleSheet.absoluteFillObject}>
      {/* Background color */}
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: isDark ? '#000000' : '#FFFFFF' }]} />
      
      {/* Top gradient overlay */}
      <LinearGradient
        colors={isDark 
          ? ['rgba(52, 199, 89, 0.3)', 'rgba(52, 199, 89, 0.1)', 'transparent'] as const
          : ['rgba(0, 122, 255, 0.2)', 'rgba(52, 199, 89, 0.1)', 'transparent'] as const
        }
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 300, // Only covers top portion
        }}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        locations={[0, 0.6, 1]}
      />
    </View>
  );
};

// ──────────────────────────────────────────────────────────────────────────────
// Main Dashboard Screen
// ──────────────────────────────────────────────────────────────────────────────
export default function DashboardScreen() {
  const navigation = useNavigation();
  const { isDark } = useTheme();
  
  const [currentMood, setCurrentMood] = useState(7.5);
  const [currentEnergy, setCurrentEnergy] = useState(6.8);
  const [weekMoodData, setWeekMoodData] = useState<
    { day: string; value: number; date: Date }[]
  >([]);
  const [adviceCards, setAdviceCards] = useState<{
    id: string;
    title: string;
    content: string;
    icon: string;
  }[]>([]);
  const [weeklyReflections, setWeeklyReflections] = useState<{
    week_start_date: string;
    mood_score: number;
    energy_level: number;
    reflection_quality: number;
    sentiment: 'positive' | 'neutral' | 'negative';
  }[]>([]);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [weeklyComparison, setWeeklyComparison] = useState({
    moodChange: 0,
    energyChange: 0,
  });

  const scrollY = useSharedValue(0);

  const loadDashboardData = async () => {
    try {
      const userId = await getUserId();
      if (!userId) return;

      // Fetch latest mood and energy
      const { data: latestLog } = await supabase
        .from('daily_logs')
        .select('*')
        .eq('user_id', userId)
        .order('log_date', { ascending: false })
        .limit(1)
        .single();

      if (latestLog) {
        setCurrentMood(latestLog.mood_score ?? 7.5);
        setCurrentEnergy(latestLog.energy_level ?? 6.8);
      }

      // Fetch weekly advice cards
      const { data: weeklyCards } = await supabase
        .from('weekly_cards')
        .select('*')
        .eq('user_id', userId)
        .order('week_start_date', { ascending: false })
        .limit(1)
        .single();

      if (weeklyCards) {
        const cards = [];
        if (weeklyCards.advice1_title && weeklyCards.advice1_content) {
          cards.push({
            id: '1',
            title: weeklyCards.advice1_title,
            content: weeklyCards.advice1_content,
            icon: 'leaf-outline',
          });
        }
        if (weeklyCards.advice2_title && weeklyCards.advice2_content) {
          cards.push({
            id: '2',
            title: weeklyCards.advice2_title,
            content: weeklyCards.advice2_content,
            icon: 'walk-outline',
          });
        }
        if (weeklyCards.advice3_title && weeklyCards.advice3_content) {
          cards.push({
            id: '3',
            title: weeklyCards.advice3_title,
            content: weeklyCards.advice3_content,
            icon: 'bed-outline',
          });
        }
        setAdviceCards(cards);
      } else {
        setAdviceCards([]);
      }

      // Fetch weekly reflections for trends
      const { data: reflections } = await supabase
        .from('weekly_reflections')
        .select('week_start_date, mood_score, energy_level, reflection_quality, sentiment')
        .eq('user_id', userId)
        .order('week_start_date', { ascending: false })
        .limit(10); // Get last 10 weeks for trends

      if (reflections) {
        setWeeklyReflections(reflections);
      }

      // Fetch mood data for the week
      const { data: dailyLogs } = await supabase
        .from('daily_logs')
        .select('*')
        .eq('user_id', userId)
        .order('log_date', { ascending: false })
        .limit(14); // Get 2 weeks for comparison

      if (dailyLogs && dailyLogs.length > 0) {
        const thisWeek = dailyLogs.slice(0, 7);
        const lastWeek = dailyLogs.slice(7, 14);
        
        const moodData = thisWeek.map((log) => ({
          day: new Date(log.log_date).toLocaleDateString('en-US', { weekday: 'short' }),
          value: log.mood_score ?? 0,
          date: new Date(log.log_date),
        })).reverse();
        
        setWeekMoodData(moodData);

        // Calculate weekly comparison
        const thisWeekAvgMood = thisWeek.reduce((acc, log) => acc + (log.mood_score ?? 0), 0) / (thisWeek.length || 1);
        const lastWeekAvgMood = lastWeek.reduce((acc, log) => acc + (log.mood_score ?? 0), 0) / (lastWeek.length || 1);
        const thisWeekAvgEnergy = thisWeek.reduce((acc, log) => acc + (log.energy_level ?? 0), 0) / (thisWeek.length || 1);
        const lastWeekAvgEnergy = lastWeek.reduce((acc, log) => acc + (log.energy_level ?? 0), 0) / (lastWeek.length || 1);

        setWeeklyComparison({
          moodChange: thisWeekAvgMood - lastWeekAvgMood,
          energyChange: thisWeekAvgEnergy - lastWeekAvgEnergy,
        });
      } else {
        setWeekMoodData([]);
        setWeeklyComparison({ moodChange: 0, energyChange: 0 });
      }

      // Fetch recent logs
      const { data: recentReflections } = await supabase
        .from('daily_logs')
        .select('*')
        .eq('user_id', userId)
        .order('log_date', { ascending: false })
        .limit(3);

      setRecentLogs(recentReflections ?? []);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  const getUserId = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user?.id;
  };

  // Load data every time the screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadDashboardData();
    }, [])
  );

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      <HealthGradientBackground />
      <StatusBar 
        barStyle={isDark ? "light-content" : "dark-content"} 
        backgroundColor="transparent" 
        translucent 
      />
      
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        
        {/* Main Content with Header Inside ScrollView */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          onScroll={(event) => {
            scrollY.value = event.nativeEvent.contentOffset.y;
          }}
          scrollEventThrottle={16}
        >
          {/* Header */}
          <Animated.View style={styles.header} entering={FadeInDown.delay(100).duration(600)}>
            <View>
              <Text style={[styles.title, isDark && styles.titleDark]}>
                Overview
              </Text>
              <Text style={[styles.dateText, isDark && styles.dateTextDark]}>
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>
            </View>
            
            <TouchableOpacity style={styles.profileButton}>
              <Ionicons 
                name="person-circle-outline" 
                size={32} 
                color={isDark ? '#FFFFFF' : '#333333'} 
              />
            </TouchableOpacity>
          </Animated.View>

          {/* Quick Stats */}
          <Animated.View entering={FadeIn.delay(200).duration(800)}>
            <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>
              Quick Stats
            </Text>
            <QuickStatsCards 
              moodScore={currentMood} 
              energyLevel={currentEnergy}
              isDark={isDark}
            />
          </Animated.View>

          {/* Advice */}
          <Animated.View entering={FadeInUp.delay(400).duration(600)}>
            <AdviceCards cards={adviceCards} isDark={isDark} />
          </Animated.View>

          {/* Weekly Trends - NEW SECTION */}
          {weeklyReflections.length > 0 && (
            <Animated.View entering={FadeInUp.delay(500).duration(600)}>
              <WeeklyTrendsCards reflections={weeklyReflections} isDark={isDark} />
            </Animated.View>
          )}

          {/* Highlights */}
          <Animated.View entering={FadeInUp.delay(600).duration(600)}>
            <HighlightsSection 
              moodData={weekMoodData}
              weeklyComparison={weeklyComparison}
              isDark={isDark}
            />
          </Animated.View>

          {/* Latest Logs */}
          <Animated.View entering={FadeInUp.delay(800).duration(600)}>
            <LatestLogs logs={recentLogs} isDark={isDark} />
          </Animated.View>

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Floating Action Button */}
        <TouchableOpacity
          style={[styles.floatingButton, isDark && styles.floatingButtonDark]}
          onPress={() => (navigation as any).navigate('Call')}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={['#007AFF', '#34C759'] as const}
            style={styles.floatingButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="chatbubble-ellipses" size={24} color="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>
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
    backgroundColor: '#111827',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  dateText: {
    fontSize: 17,
    color: '#8E8E93',
    fontWeight: '400',
    marginTop: 2,
  },
  dateTextDark: {
    color: '#8E8E93',
  },
  profileButton: {
    padding: 4,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  sectionTitleDark: {
    color: '#FFFFFF',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  floatingButton: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    borderRadius: 30,
    elevation: 8,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  floatingButtonDark: {
    shadowColor: '#007AFF',
  },
  floatingButtonGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
});