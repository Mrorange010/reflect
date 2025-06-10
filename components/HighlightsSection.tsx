// components/HighlightsSection.tsx
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import Svg, { Path, Circle, Defs, LinearGradient as SvgGradient, Stop, G } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  withTiming,
  withDelay,
  Easing,
  FadeInUp,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const CHART_WIDTH = width - 80;
const CHART_HEIGHT = 80;
const CARD_WIDTH = (width - 60) / 2;

interface MoodData {
  day: string;
  value: number;
  date: Date;
}

interface WeeklyComparison {
  moodChange: number;
  energyChange: number;
}

interface HighlightsSectionProps {
  moodData: MoodData[];
  weeklyComparison: WeeklyComparison;
  isDark: boolean;
}

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// Mini mood chart component
const MiniMoodChart: React.FC<{
  data: MoodData[];
  isDark: boolean;
}> = ({ data, isDark }) => {
  const pathAnimation = useSharedValue(0);

  useEffect(() => {
    pathAnimation.value = withDelay(
      300,
      withTiming(1, {
        duration: 1200,
        easing: Easing.out(Easing.cubic),
      })
    );
  }, [data]);

  const path = React.useMemo(() => {
    if (data.length === 0) return '';
    
    const points = data.map((item, index) => ({
      x: (index / Math.max(data.length - 1, 1)) * CHART_WIDTH,
      y: CHART_HEIGHT - (item.value / 10) * CHART_HEIGHT,
    }));

    if (points.length === 1) {
      return `M ${points[0].x} ${points[0].y} L ${points[0].x} ${points[0].y}`;
    }

    let d = `M ${points[0].x} ${points[0].y}`;
    
    for (let i = 1; i < points.length; i++) {
      const xMid = (points[i].x + points[i - 1].x) / 2;
      const yMid = (points[i].y + points[i - 1].y) / 2;
      const cp1x = (xMid + points[i - 1].x) / 2;
      const cp2x = (xMid + points[i].x) / 2;
      
      d += ` Q ${cp1x} ${points[i - 1].y} ${xMid} ${yMid}`;
      d += ` Q ${cp2x} ${points[i].y} ${points[i].x} ${points[i].y}`;
    }
    
    return d;
  }, [data]);

  const animatedProps = useAnimatedProps(() => {
    const pathLength = 300; // Approximate path length
    return {
      strokeDasharray: pathLength,
      strokeDashoffset: pathLength * (1 - pathAnimation.value),
    };
  });

  return (
    <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
      <Defs>
        <SvgGradient id="chartGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <Stop offset="0%" stopColor="#FF6B6B" />
          <Stop offset="100%" stopColor="#34C759" />
        </SvgGradient>
      </Defs>
      
      {data.length > 0 && (
        <AnimatedPath
          d={path}
          stroke="url(#chartGradient)"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          animatedProps={animatedProps}
        />
      )}
      
      {data.map((item, index) => {
        const x = (index / Math.max(data.length - 1, 1)) * CHART_WIDTH;
        const y = CHART_HEIGHT - (item.value / 10) * CHART_HEIGHT;
        
        return (
          <AnimatedCircle
            key={index}
            cx={x}
            cy={y}
            r="3"
            fill={item.value >= 7 ? '#34C759' : item.value >= 4 ? '#007AFF' : '#FF6B6B'}
          />
        );
      })}
    </Svg>
  );
};

// Comparison card component
const ComparisonCard: React.FC<{
  title: string;
  value: number;
  icon: string;
  color: string;
  isDark: boolean;
  delay?: number;
}> = ({ title, value, icon, color, isDark, delay = 0 }) => {
  const scaleValue = useSharedValue(0.8);
  const progressValue = useSharedValue(0);

  useEffect(() => {
    scaleValue.value = withDelay(
      delay,
      withTiming(1, {
        duration: 600,
        easing: Easing.out(Easing.back(1.1)),
      })
    );
    
    progressValue.value = withDelay(
      delay + 200,
      withTiming(1, {
        duration: 800,
        easing: Easing.out(Easing.cubic),
      })
    );
  }, [delay]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleValue.value }],
  }));

  const progressStyle = useAnimatedStyle(() => {
    const progress = interpolate(
      progressValue.value,
      [0, 1],
      [0, Math.abs(value) * 10],
      Extrapolate.CLAMP
    );
    
    return {
      width: `${Math.min(progress, 100)}%`,
    };
  });

  const isPositive = value > 0;
  const isNeutral = Math.abs(value) < 0.1;

  return (
    <Animated.View 
      style={[
        styles.comparisonCard, 
        isDark && styles.comparisonCardDark,
        animatedStyle
      ]}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.iconContainer, { backgroundColor: `${color}15` }]}>
          <Ionicons name={icon as any} size={20} color={color} />
        </View>
        <Text style={[styles.cardTitle, isDark && styles.cardTitleDark]}>
          {title}
        </Text>
      </View>

      <View style={styles.comparisonContent}>
        <View style={styles.changeIndicator}>
          <Ionicons
            name={
              isNeutral 
                ? "remove-outline" 
                : isPositive 
                  ? "trending-up-outline" 
                  : "trending-down-outline"
            }
            size={16}
            color={
              isNeutral 
                ? '#8E8E93' 
                : isPositive 
                  ? '#34C759' 
                  : '#FF3B30'
            }
          />
          <Text 
            style={[
              styles.changeText,
              { color: isNeutral ? '#8E8E93' : isPositive ? '#34C759' : '#FF3B30' }
            ]}
          >
            {isNeutral ? 'Same' : `${isPositive ? '+' : ''}${value.toFixed(1)}`}
          </Text>
        </View>
        
        <Text style={[styles.comparisonLabel, isDark && styles.comparisonLabelDark]}>
          vs last week
        </Text>
      </View>

      {!isNeutral && (
        <View style={styles.progressContainer}>
          <View style={[styles.progressTrack, isDark && styles.progressTrackDark]}>
            <Animated.View 
              style={[
                styles.progressBar,
                progressStyle,
                { backgroundColor: isPositive ? '#34C759' : '#FF3B30' }
              ]} 
            />
          </View>
        </View>
      )}
    </Animated.View>
  );
};

const HighlightsSection: React.FC<HighlightsSectionProps> = ({ 
  moodData, 
  weeklyComparison, 
  isDark 
}) => {
  const currentWeekAvg = moodData.length > 0 
    ? moodData.reduce((acc, d) => acc + d.value, 0) / moodData.length 
    : 0;

  const getWeeklyInsight = () => {
    if (moodData.length === 0) return "Start logging to see insights";
    
    if (currentWeekAvg >= 8) return "Excellent week overall! 🌟";
    if (currentWeekAvg >= 6) return "A positive week on average ✨";
    if (currentWeekAvg >= 4) return "Mixed emotions this week 🌤️";
    return "A challenging week - you've got this 💪";
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>
        Highlights
      </Text>

      {/* Weekly mood chart card */}
      <Animated.View 
        style={[styles.chartCard, isDark && styles.chartCardDark]}
        entering={FadeInUp.delay(200).duration(600)}
      >
        <View style={styles.chartHeader}>
          <View style={styles.chartTitleContainer}>
            <View style={[styles.iconContainer, { backgroundColor: '#FF6B6B15' }]}>
              <Ionicons name="analytics-outline" size={20} color="#FF6B6B" />
            </View>
            <View>
              <Text style={[styles.chartTitle, isDark && styles.chartTitleDark]}>
                This Week's Mood
              </Text>
              <Text style={[styles.chartSubtitle, isDark && styles.chartSubtitleDark]}>
                {currentWeekAvg.toFixed(1)}/10 average
              </Text>
            </View>
          </View>
          <TouchableOpacity style={styles.detailButton}>
            <Ionicons 
              name="chevron-forward" 
              size={16} 
              color={isDark ? '#8E8E93' : '#C7C7CC'} 
            />
          </TouchableOpacity>
        </View>

        <View style={styles.chartContainer}>
          <MiniMoodChart data={moodData} isDark={isDark} />
        </View>

        <Text style={[styles.insightText, isDark && styles.insightTextDark]}>
          {getWeeklyInsight()}
        </Text>
      </Animated.View>

      {/* Comparison cards */}
      <View style={styles.comparisonContainer}>
        <ComparisonCard
          title="Mood"
          value={weeklyComparison.moodChange}
          icon="happy-outline"
          color="#FF6B6B"
          isDark={isDark}
          delay={400}
        />
        
        <ComparisonCard
          title="Energy"
          value={weeklyComparison.energyChange}
          icon="flash-outline"
          color="#34C759"
          isDark={isDark}
          delay={600}
        />
      </View>
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
  chartCard: {
    marginHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 0.5,
    borderColor: '#E5E5EA',
  },
  chartCardDark: {
    backgroundColor: '#1C1C1E',
    borderColor: '#38383A',
    shadowOpacity: 0.3,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  chartTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  chartTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
    letterSpacing: -0.2,
  },
  chartTitleDark: {
    color: '#FFFFFF',
  },
  chartSubtitle: {
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '500',
    marginTop: 2,
  },
  chartSubtitleDark: {
    color: '#8E8E93',
  },
  detailButton: {
    padding: 8,
  },
  chartContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  insightText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#8E8E93',
    textAlign: 'center',
  },
  insightTextDark: {
    color: '#8E8E93',
  },
  comparisonContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 16,
  },
  comparisonCard: {
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
  comparisonCardDark: {
    backgroundColor: '#1C1C1E',
    borderColor: '#38383A',
    shadowOpacity: 0.3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
    letterSpacing: -0.2,
  },
  cardTitleDark: {
    color: '#FFFFFF',
  },
  comparisonContent: {
    alignItems: 'center',
    marginBottom: 8,
  },
  changeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  changeText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  comparisonLabel: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '500',
  },
  comparisonLabelDark: {
    color: '#8E8E93',
  },
  progressContainer: {
    marginTop: 8,
  },
  progressTrack: {
    height: 3,
    backgroundColor: '#E5E5EA',
    borderRadius: 1.5,
    overflow: 'hidden',
  },
  progressTrackDark: {
    backgroundColor: '#48484A',
  },
  progressBar: {
    height: '100%',
    borderRadius: 1.5,
  },
});

export default HighlightsSection;