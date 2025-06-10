// components/QuickStatsCards.tsx
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  withTiming,
  withDelay,
  withSequence,
  withSpring,
  Easing,
  FadeInUp,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 60) / 2; // Two cards side by side with margins
const CIRCLE_SIZE = 80;
const STROKE_WIDTH = 8;
const RADIUS = (CIRCLE_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

interface QuickStatsCardsProps {
  moodScore: number;
  energyLevel: number;
  isDark: boolean;
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// Animated Number Counter Component
const AnimatedCounter: React.FC<{
  value: number;
  delay?: number;
  isDark: boolean;
}> = ({ value, delay = 0, isDark }) => {
  const animatedValue = useSharedValue(0);
  const [displayValue, setDisplayValue] = React.useState(0);

  useEffect(() => {
    animatedValue.value = withDelay(
      delay,
      withTiming(value, {
        duration: 1500,
        easing: Easing.out(Easing.cubic),
      })
    );
  }, [value, delay]);

  const animatedStyle = useAnimatedStyle(() => {
    runOnJS(setDisplayValue)(animatedValue.value);
    return {};
  });

  return (
    <>
      <Animated.View style={animatedStyle} />
      <Text style={[styles.mainValue, isDark && styles.mainValueDark]}>
        {displayValue.toFixed(1)}
      </Text>
    </>
  );
};

const CircularGauge: React.FC<{
  value: number;
  maxValue: number;
  color: string;
  gradientId: string;
  delay?: number;
}> = ({ value, maxValue, color, gradientId, delay = 0 }) => {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withTiming(value / maxValue, {
        duration: 1500,
        easing: Easing.out(Easing.cubic),
      })
    );
  }, [value, maxValue, delay]);

  const animatedProps = useAnimatedProps(() => {
    const strokeDashoffset = CIRCUMFERENCE * (1 - progress.value);
    return {
      strokeDashoffset,
    };
  });

  return (
    <Svg width={CIRCLE_SIZE} height={CIRCLE_SIZE} style={styles.gauge}>
      <Defs>
        <SvgGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor={color} stopOpacity="1" />
          <Stop offset="100%" stopColor={color} stopOpacity="0.6" />
        </SvgGradient>
      </Defs>
      
      {/* Background circle */}
      <Circle
        cx={CIRCLE_SIZE / 2}
        cy={CIRCLE_SIZE / 2}
        r={RADIUS}
        stroke="#E5E5EA"
        strokeWidth={STROKE_WIDTH}
        fill="none"
        strokeLinecap="round"
      />
      
      {/* Progress circle */}
      <AnimatedCircle
        cx={CIRCLE_SIZE / 2}
        cy={CIRCLE_SIZE / 2}
        r={RADIUS}
        stroke={`url(#${gradientId})`}
        strokeWidth={STROKE_WIDTH}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={CIRCUMFERENCE}
        animatedProps={animatedProps}
        rotation="-90"
        origin={`${CIRCLE_SIZE / 2}, ${CIRCLE_SIZE / 2}`}
      />
    </Svg>
  );
};

// Animated Progress Bar Component
const AnimatedProgressBar: React.FC<{
  value: number;
  maxValue: number;
  color: string;
  delay?: number;
}> = ({ value, maxValue, color, delay = 0 }) => {
  const progressWidth = useSharedValue(0);
  const progressOpacity = useSharedValue(0);

  useEffect(() => {
    // Animate width with spring effect
    progressWidth.value = withDelay(
      delay + 500, // Start after gauge animation
      withSpring((value / maxValue) * 100, {
        damping: 15,
        stiffness: 150,
        mass: 1,
      })
    );
    
    // Fade in the progress bar
    progressOpacity.value = withDelay(
      delay + 300,
      withTiming(1, { duration: 400 })
    );
  }, [value, maxValue, delay]);

  const animatedProgressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
    opacity: progressOpacity.value,
  }));

  return (
    <View style={styles.progressBar}>
      <Animated.View 
        style={[
          styles.progressFill, 
          { backgroundColor: color },
          animatedProgressStyle
        ]} 
      />
    </View>
  );
};

// Animated Percentage Text Component
const AnimatedPercentage: React.FC<{
  value: number;
  maxValue: number;
  delay?: number;
  isDark: boolean;
}> = ({ value, maxValue, delay = 0, isDark }) => {
  const animatedPercentage = useSharedValue(0);
  const [displayPercentage, setDisplayPercentage] = React.useState(0);

  useEffect(() => {
    animatedPercentage.value = withDelay(
      delay + 600, // Start after progress bar
      withTiming(Math.round((value / maxValue) * 100), {
        duration: 800,
        easing: Easing.out(Easing.cubic),
      })
    );
  }, [value, maxValue, delay]);

  const animatedStyle = useAnimatedStyle(() => {
    runOnJS(setDisplayPercentage)(Math.round(animatedPercentage.value));
    return {};
  });

  return (
    <>
      <Animated.View style={animatedStyle} />
      <Text style={[styles.progressText, isDark && styles.progressTextDark]}>
        {displayPercentage}% of goal
      </Text>
    </>
  );
};

const StatCard: React.FC<{
  title: string;
  value: number;
  maxValue: number;
  unit: string;
  icon: string;
  color: string;
  gradientId: string;
  isDark: boolean;
  delay?: number;
}> = ({ title, value, maxValue, unit, icon, color, gradientId, isDark, delay = 0 }) => {
  const scaleValue = useSharedValue(0.9);
  const iconScale = useSharedValue(0);
  const cardOpacity = useSharedValue(0);

  useEffect(() => {
    // Card entrance animation
    cardOpacity.value = withTiming(1, { duration: 400 });
    
    scaleValue.value = withDelay(
      delay,
      withSequence(
        withSpring(1.05, { damping: 12, stiffness: 200 }),
        withSpring(1, { damping: 15, stiffness: 150 })
      )
    );

    // Icon bounce animation
    iconScale.value = withDelay(
      delay + 200,
      withSequence(
        withSpring(1.2, { damping: 8, stiffness: 300 }),
        withSpring(1, { damping: 12, stiffness: 200 })
      )
    );
  }, [delay]);

  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleValue.value }],
    opacity: cardOpacity.value,
  }));

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  return (
    <Animated.View 
      style={[
        styles.statCard, 
        isDark && styles.statCardDark,
        animatedCardStyle
      ]}
      entering={FadeInUp.delay(delay).duration(600)}
    >
      <View style={styles.cardHeader}>
        <Animated.View 
          style={[
            styles.iconContainer, 
            { backgroundColor: `${color}15` },
            animatedIconStyle
          ]}
        >
          <Ionicons name={icon as any} size={20} color={color} />
        </Animated.View>
        <Text style={[styles.cardTitle, isDark && styles.cardTitleDark]}>
          {title}
        </Text>
      </View>

      <View style={styles.gaugeContainer}>
        <CircularGauge
          value={value}
          maxValue={maxValue}
          color={color}
          gradientId={gradientId}
          delay={delay + 200}
        />
        <View style={styles.valueContainer}>
          <AnimatedCounter 
            value={value} 
            delay={delay + 400} 
            isDark={isDark}
          />
          <Text style={[styles.unitText, isDark && styles.unitTextDark]}>
            {unit}
          </Text>
        </View>
      </View>

      <View style={styles.progressInfo}>
        <AnimatedPercentage
          value={value}
          maxValue={maxValue}
          delay={delay}
          isDark={isDark}
        />
        <AnimatedProgressBar
          value={value}
          maxValue={maxValue}
          color={color}
          delay={delay}
        />
      </View>
    </Animated.View>
  );
};

const QuickStatsCards: React.FC<QuickStatsCardsProps> = ({ 
  moodScore, 
  energyLevel, 
  isDark 
}) => {
  return (
    <View style={styles.container}>
      <StatCard
        title="Mood"
        value={moodScore}
        maxValue={10}
        unit="/10"
        icon="happy-outline"
        color="#007AFF"
        gradientId="moodGradient"
        isDark={isDark}
        delay={0}
      />
      
      <StatCard
        title="Energy"
        value={energyLevel}
        maxValue={10}
        unit="/10"
        icon="flash-outline"
        color="#34C759"
        gradientId="energyGradient"
        isDark={isDark}
        delay={200}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 20,
    marginBottom: 32,
  },
  statCard: {
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
  statCardDark: {
    backgroundColor: '#1C1C1E',
    borderColor: '#38383A',
    shadowColor: '#000000',
    shadowOpacity: 0.3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
    letterSpacing: -0.2,
  },
  cardTitleDark: {
    color: '#FFFFFF',
  },
  gaugeContainer: {
    alignItems: 'center',
    position: 'relative',
    marginBottom: 16,
  },
  gauge: {
    // The SVG styles are handled internally
  },
  valueContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000000',
    letterSpacing: -0.5,
  },
  mainValueDark: {
    color: '#FFFFFF',
  },
  unitText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#8E8E93',
    marginTop: -2,
  },
  unitTextDark: {
    color: '#8E8E93',
  },
  progressInfo: {
    alignItems: 'center',
  },
  progressText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#8E8E93',
    marginBottom: 8,
  },
  progressTextDark: {
    color: '#8E8E93',
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: '#E5E5EA',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
});

export default QuickStatsCards;