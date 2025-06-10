// components/WeeklyTrendsCards.tsx
import React from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp } from 'react-native-reanimated';
import Svg, { Polyline, Circle } from 'react-native-svg';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 60) / 2; // Two cards side by side with spacing

interface WeeklyReflection {
  week_start_date: string;
  mood_score: number;
  energy_level: number;
  reflection_quality: number;
  sentiment: 'positive' | 'neutral' | 'negative';
}

interface WeeklyTrendsCardsProps {
  reflections: WeeklyReflection[];
  isDark: boolean;
}

// Mini Line Chart Component
const MiniLineChart = ({ 
  data, 
  color, 
  width: chartWidth, 
  height: chartHeight 
}: { 
  data: number[], 
  color: string, 
  width: number, 
  height: number 
}) => {
  if (data.length < 2) return null;

  const maxValue = Math.max(...data);
  const minValue = Math.min(...data);
  const range = maxValue - minValue || 1;

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * chartWidth;
    const y = chartHeight - ((value - minValue) / range) * chartHeight;
    return `${x},${y}`;
  }).join(' ');

  return (
    <View style={{ width: chartWidth, height: chartHeight }}>
      <Svg width={chartWidth} height={chartHeight} style={{ position: 'absolute' }}>
        <Polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Add dots for each point */}
        {data.map((value, index) => {
          const x = (index / (data.length - 1)) * chartWidth;
          const y = chartHeight - ((value - minValue) / range) * chartHeight;
          return (
            <Circle
              key={index}
              cx={x}
              cy={y}
              r="3"
              fill={color}
            />
          );
        })}
      </Svg>
    </View>
  );
};

// Mood Trend Card
const MoodTrendCard = ({ reflections, isDark }: { reflections: WeeklyReflection[], isDark: boolean }) => {
  const recentWeeks = reflections.slice(0, 6).reverse(); // Last 6 weeks, chronological order
  const moodData = recentWeeks.map(r => r.mood_score);
  const currentMood = reflections[0]?.mood_score || 0;
  const previousMood = reflections[1]?.mood_score || 0;
  const moodChange = currentMood - previousMood;

  const getMoodColor = (mood: number) => {
    if (mood >= 8) return '#34C759';
    if (mood >= 6) return '#007AFF';
    if (mood >= 4) return '#FF9500';
    return '#FF3B30';
  };

  return (
    <Animated.View 
      style={[styles.trendCard, isDark && styles.trendCardDark]}
      entering={FadeInUp.delay(200).duration(600)}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.iconContainer, { backgroundColor: `${getMoodColor(currentMood)}15` }]}>
          <Ionicons name="happy-outline" size={20} color={getMoodColor(currentMood)} />
        </View>
        <View style={styles.headerText}>
          <Text style={[styles.cardTitle, isDark && styles.cardTitleDark]}>Mood Trend</Text>
          <View style={styles.changeIndicator}>
            <Ionicons 
              name={moodChange >= 0 ? "trending-up" : "trending-down"} 
              size={12} 
              color={moodChange >= 0 ? "#34C759" : "#FF3B30"} 
            />
            <Text style={[
              styles.changeText,
              { color: moodChange >= 0 ? "#34C759" : "#FF3B30" }
            ]}>
              {moodChange >= 0 ? '+' : ''}{moodChange.toFixed(1)}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.metricValue}>
        <Text style={[styles.primaryValue, isDark && styles.primaryValueDark]}>
          {currentMood.toFixed(1)}
        </Text>
        <Text style={[styles.metricUnit, isDark && styles.metricUnitDark]}>/10</Text>
      </View>

      {moodData.length > 1 && (
        <View style={styles.chartContainer}>
          <MiniLineChart 
            data={moodData}
            color={getMoodColor(currentMood)}
            width={CARD_WIDTH - 32}
            height={40}
          />
        </View>
      )}

      <Text style={[styles.timeLabel, isDark && styles.timeLabelDark]}>
        Last 6 weeks
      </Text>
    </Animated.View>
  );
};

// Energy Trend Card
const EnergyTrendCard = ({ reflections, isDark }: { reflections: WeeklyReflection[], isDark: boolean }) => {
  const recentWeeks = reflections.slice(0, 6).reverse(); // Last 6 weeks, chronological order
  const energyData = recentWeeks.map(r => r.energy_level);
  const currentEnergy = reflections[0]?.energy_level || 0;
  const previousEnergy = reflections[1]?.energy_level || 0;
  const energyChange = currentEnergy - previousEnergy;

  return (
    <Animated.View 
      style={[styles.trendCard, isDark && styles.trendCardDark]}
      entering={FadeInUp.delay(300).duration(600)}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.iconContainer, { backgroundColor: '#34C75915' }]}>
          <Ionicons name="flash-outline" size={20} color="#34C759" />
        </View>
        <View style={styles.headerText}>
          <Text style={[styles.cardTitle, isDark && styles.cardTitleDark]}>Energy Trend</Text>
          <View style={styles.changeIndicator}>
            <Ionicons 
              name={energyChange >= 0 ? "trending-up" : "trending-down"} 
              size={12} 
              color={energyChange >= 0 ? "#34C759" : "#FF3B30"} 
            />
            <Text style={[
              styles.changeText,
              { color: energyChange >= 0 ? "#34C759" : "#FF3B30" }
            ]}>
              {energyChange >= 0 ? '+' : ''}{energyChange.toFixed(1)}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.metricValue}>
        <Text style={[styles.primaryValue, isDark && styles.primaryValueDark]}>
          {currentEnergy.toFixed(1)}
        </Text>
        <Text style={[styles.metricUnit, isDark && styles.metricUnitDark]}>/10</Text>
      </View>

      {energyData.length > 1 && (
        <View style={styles.chartContainer}>
          <MiniLineChart 
            data={energyData}
            color="#34C759"
            width={CARD_WIDTH - 32}
            height={40}
          />
        </View>
      )}

      <Text style={[styles.timeLabel, isDark && styles.timeLabelDark]}>
        Last 6 weeks
      </Text>
    </Animated.View>
  );
};

// Reflection Quality Card
const ReflectionQualityCard = ({ reflections, isDark }: { reflections: WeeklyReflection[], isDark: boolean }) => {
  const avgQuality = reflections.length > 0 
    ? reflections.reduce((sum, r) => sum + r.reflection_quality, 0) / reflections.length 
    : 0;
  
  const recentWeeks = reflections.slice(0, 6).reverse();
  const qualityData = recentWeeks.map(r => r.reflection_quality);
  
  const getQualityColor = (quality: number) => {
    if (quality >= 8) return '#34C759';
    if (quality >= 6) return '#007AFF';
    if (quality >= 4) return '#FF9500';
    return '#FF3B30';
  };

  return (
    <Animated.View 
      style={[styles.trendCard, isDark && styles.trendCardDark]}
      entering={FadeInUp.delay(400).duration(600)}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.iconContainer, { backgroundColor: `${getQualityColor(avgQuality)}15` }]}>
          <Ionicons name="star-outline" size={20} color={getQualityColor(avgQuality)} />
        </View>
        <View style={styles.headerText}>
          <Text style={[styles.cardTitle, isDark && styles.cardTitleDark]}>Reflection Quality</Text>
          <Text style={[styles.subtitle, isDark && styles.subtitleDark]}>
            {reflections.length} reflections
          </Text>
        </View>
      </View>

      <View style={styles.metricValue}>
        <Text style={[styles.primaryValue, isDark && styles.primaryValueDark]}>
          {avgQuality.toFixed(1)}
        </Text>
        <Text style={[styles.metricUnit, isDark && styles.metricUnitDark]}>/10</Text>
      </View>

      {qualityData.length > 1 && (
        <View style={styles.chartContainer}>
          <MiniLineChart 
            data={qualityData}
            color={getQualityColor(avgQuality)}
            width={CARD_WIDTH - 32}
            height={40}
          />
        </View>
      )}

      <Text style={[styles.timeLabel, isDark && styles.timeLabelDark]}>
        Average quality
      </Text>
    </Animated.View>
  );
};

// Sentiment Overview Card
const SentimentOverviewCard = ({ reflections, isDark }: { reflections: WeeklyReflection[], isDark: boolean }) => {
  const sentimentCounts = reflections.reduce((acc, r) => {
    acc[r.sentiment] = (acc[r.sentiment] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const total = reflections.length;
  const positivePercent = Math.round((sentimentCounts.positive || 0) / total * 100);
  const neutralPercent = Math.round((sentimentCounts.neutral || 0) / total * 100);
  const negativePercent = Math.round((sentimentCounts.negative || 0) / total * 100);

  const dominantSentiment = Object.entries(sentimentCounts).reduce((a, b) => 
    sentimentCounts[a[0]] > sentimentCounts[b[0]] ? a : b
  )[0];

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return '#34C759';
      case 'neutral': return '#007AFF';
      case 'negative': return '#FF3B30';
      default: return '#8E8E93';
    }
  };

  return (
    <Animated.View 
      style={[styles.trendCard, isDark && styles.trendCardDark]}
      entering={FadeInUp.delay(500).duration(600)}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.iconContainer, { backgroundColor: `${getSentimentColor(dominantSentiment)}15` }]}>
          <Ionicons name="analytics-outline" size={20} color={getSentimentColor(dominantSentiment)} />
        </View>
        <View style={styles.headerText}>
          <Text style={[styles.cardTitle, isDark && styles.cardTitleDark]}>Sentiment</Text>
          <Text style={[styles.subtitle, isDark && styles.subtitleDark]}>
            Mostly {dominantSentiment}
          </Text>
        </View>
      </View>

      <View style={styles.sentimentBars}>
        <View style={styles.sentimentRow}>
          <View style={styles.sentimentInfo}>
            <View style={[styles.sentimentDot, { backgroundColor: '#34C759' }]} />
            <Text style={[styles.sentimentLabel, isDark && styles.sentimentLabelDark]}>Positive</Text>
          </View>
          <Text style={[styles.sentimentPercent, isDark && styles.sentimentPercentDark]}>
            {positivePercent}%
          </Text>
        </View>
        
        <View style={styles.sentimentRow}>
          <View style={styles.sentimentInfo}>
            <View style={[styles.sentimentDot, { backgroundColor: '#007AFF' }]} />
            <Text style={[styles.sentimentLabel, isDark && styles.sentimentLabelDark]}>Neutral</Text>
          </View>
          <Text style={[styles.sentimentPercent, isDark && styles.sentimentPercentDark]}>
            {neutralPercent}%
          </Text>
        </View>
        
        <View style={styles.sentimentRow}>
          <View style={styles.sentimentInfo}>
            <View style={[styles.sentimentDot, { backgroundColor: '#FF3B30' }]} />
            <Text style={[styles.sentimentLabel, isDark && styles.sentimentLabelDark]}>Negative</Text>
          </View>
          <Text style={[styles.sentimentPercent, isDark && styles.sentimentPercentDark]}>
            {negativePercent}%
          </Text>
        </View>
      </View>
    </Animated.View>
  );
};

const WeeklyTrendsCards: React.FC<WeeklyTrendsCardsProps> = ({ reflections, isDark }) => {
  if (!reflections || reflections.length === 0) {
    return null; // Don't show if no data
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>
        Weekly Trends
      </Text>
      
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.cardsContainer}
      >
        <View style={styles.cardRow}>
          <MoodTrendCard reflections={reflections} isDark={isDark} />
          <EnergyTrendCard reflections={reflections} isDark={isDark} />
        </View>
        
        <View style={styles.cardRow}>
          <ReflectionQualityCard reflections={reflections} isDark={isDark} />
          <SentimentOverviewCard reflections={reflections} isDark={isDark} />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
    paddingHorizontal: 20,
    letterSpacing: -0.3,
  },
  sectionTitleDark: {
    color: '#FFFFFF',
  },
  cardsContainer: {
    paddingHorizontal: 15, // Reduced from 20
    gap: 12,
  },
  cardRow: {
    flexDirection: 'row',
    gap: 10, // Reduced from 12
  },
  trendCard: {
    width: CARD_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18, // Increased padding from 16
    borderWidth: 0.5,
    borderColor: '#E5E5EA',
  },
  trendCardDark: {
    backgroundColor: '#1C1C1E',
    borderColor: '#38383A',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
    letterSpacing: -0.1,
  },
  cardTitleDark: {
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 12, // Reduced from 13 to fit better
    color: '#8E8E93',
    fontWeight: '500',
    marginTop: 1,
  },
  subtitleDark: {
    color: '#8E8E93',
  },
  changeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 1,
  },
  changeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  metricValue: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  primaryValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000000',
    letterSpacing: -0.5,
  },
  primaryValueDark: {
    color: '#FFFFFF',
  },
  metricUnit: {
    fontSize: 16,
    fontWeight: '500',
    color: '#8E8E93',
    marginLeft: 2,
  },
  metricUnitDark: {
    color: '#8E8E93',
  },
  chartContainer: {
    marginBottom: 8,
    height: 40,
  },
  timeLabel: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '500',
  },
  timeLabelDark: {
    color: '#8E8E93',
  },
  sentimentBars: {
    gap: 8,
  },
  sentimentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sentimentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sentimentDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  sentimentLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#3C3C43',
  },
  sentimentLabelDark: {
    color: '#AEAEB2',
  },
  sentimentPercent: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  sentimentPercentDark: {
    color: '#FFFFFF',
  },
});

export default WeeklyTrendsCards;