import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import Svg, { Path, Circle, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
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
const CHART_HEIGHT = 120;

interface MoodEnergyData {
  date: Date;
  mood: number;
  energy: number;
}

interface MoodvsEnergyProps {
  data: MoodEnergyData[];
  isDark: boolean;
}

type TimeRange = '7d' | '14d' | '30d';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const MoodvsEnergy: React.FC<MoodvsEnergyProps> = ({ data, isDark }) => {
  const [selectedRange, setSelectedRange] = useState<TimeRange>('7d');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  const pathAnimationMood = useSharedValue(0);
  const pathAnimationEnergy = useSharedValue(0);
  const scaleValue = useSharedValue(0.95);

  useEffect(() => {
    // Reset and start animations when data changes
    pathAnimationMood.value = 0;
    pathAnimationEnergy.value = 0;
    
    scaleValue.value = withTiming(1, {
      duration: 400,
      easing: Easing.out(Easing.cubic),
    });

    pathAnimationMood.value = withDelay(
      200,
      withTiming(1, {
        duration: 1000,
        easing: Easing.out(Easing.cubic),
      })
    );

    pathAnimationEnergy.value = withDelay(
      400,
      withTiming(1, {
        duration: 1000,
        easing: Easing.out(Easing.cubic),
      })
    );
  }, [data, selectedRange]);

  // Filter data based on selected range
  const filteredData = React.useMemo(() => {
    const days = selectedRange === '7d' ? 7 : selectedRange === '14d' ? 14 : 30;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return data
      .filter(item => item.date >= cutoffDate)
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(-days);
  }, [data, selectedRange]);

  // Generate SVG paths for mood and energy
  const generatePath = (values: number[]) => {
    if (values.length === 0) return '';
    
    const points = values.map((value, index) => ({
      x: (index / Math.max(values.length - 1, 1)) * CHART_WIDTH,
      y: CHART_HEIGHT - (value / 10) * CHART_HEIGHT,
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
  };

  const moodPath = generatePath(filteredData.map(d => d.mood));
  const energyPath = generatePath(filteredData.map(d => d.energy));

  const animatedMoodProps = useAnimatedProps(() => {
    const pathLength = 400;
    return {
      strokeDasharray: pathLength,
      strokeDashoffset: pathLength * (1 - pathAnimationMood.value),
    };
  });

  const animatedEnergyProps = useAnimatedProps(() => {
    const pathLength = 400;
    return {
      strokeDasharray: pathLength,
      strokeDashoffset: pathLength * (1 - pathAnimationEnergy.value),
    };
  });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleValue.value }],
  }));

  const currentMood = filteredData[filteredData.length - 1]?.mood || 0;
  const currentEnergy = filteredData[filteredData.length - 1]?.energy || 0;

  const timeRangeOptions = [
    { value: '7d', label: '7 Days' },
    { value: '14d', label: '14 Days' },
    { value: '30d', label: '30 Days' },
  ];

  // Generate insights based on the data
  const generateInsight = () => {
    if (filteredData.length < 3) {
      return "Not enough data to generate insights. Keep logging your mood and energy!";
    }

    const moodValues = filteredData.map(d => d.mood);
    const energyValues = filteredData.map(d => d.energy);
    
    const moodTrend = calculateTrend(moodValues);
    const energyTrend = calculateTrend(energyValues);
    const moodStability = calculateStability(moodValues);
    const energyStability = calculateStability(energyValues);
    
    const periodText = selectedRange === '7d' ? 'week' : selectedRange === '14d' ? '2 weeks' : 'month';
    
    // Determine the most significant insight
    if (moodStability < 0.3 && energyStability < 0.3) {
      return `Both your mood and energy have been very stable this ${periodText}.`;
    }
    
    if (moodTrend > 0.5) {
      return `Your mood has been improving steadily over the ${periodText}. Keep it up!`;
    }
    
    if (energyTrend > 0.5) {
      return `Your energy levels have been rising this ${periodText}. Great progress!`;
    }
    
    if (moodTrend < -0.5) {
      return `Your mood has been declining this ${periodText}. Consider what might help boost it.`;
    }
    
    if (energyTrend < -0.5) {
      return `Your energy has been lower this ${periodText}. Focus on rest and self-care.`;
    }
    
    if (energyStability < 0.4) {
      return `Your energy has been stable this ${periodText}, providing a good foundation.`;
    }
    
    if (moodStability < 0.4) {
      return `Your mood has been consistent this ${periodText}, showing good emotional balance.`;
    }
    
    const avgMood = moodValues.reduce((a, b) => a + b, 0) / moodValues.length;
    const avgEnergy = energyValues.reduce((a, b) => a + b, 0) / energyValues.length;
    
    if (avgMood > 7 && avgEnergy > 7) {
      return `You've been feeling great this ${periodText} - both mood and energy are high!`;
    }
    
    if (avgMood > avgEnergy + 1) {
      return `Your mood is outpacing your energy this ${periodText}. Consider activities that boost energy.`;
    }
    
    if (avgEnergy > avgMood + 1) {
      return `Your energy is higher than your mood this ${periodText}. Great foundation for improvement!`;
    }
    
    return `Your mood and energy are moving together this ${periodText}. Keep tracking to spot patterns.`;
  };

  const calculateTrend = (values: number[]) => {
    if (values.length < 2) return 0;
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    return (secondAvg - firstAvg) / 10; // Normalize to -1 to 1 range
  };

  const calculateStability = (values: number[]) => {
    if (values.length < 2) return 0;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
    return Math.sqrt(variance) / 10; // Normalize
  };

  return (
    <Animated.View 
      style={[
        styles.container,
        isDark && styles.containerDark,
        animatedStyle
      ]}
      entering={FadeInUp.delay(300).duration(600)}
    >
      {/* Header with Dropdown */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <View style={styles.iconContainer}>
            <Ionicons name="pulse-outline" size={20} color="#007AFF" />
          </View>
          <Text style={[styles.title, isDark && styles.titleDark]}>
            Mood vs Energy
          </Text>
        </View>
        
        <TouchableOpacity
          style={[styles.dropdown, isDark && styles.dropdownDark]}
          onPress={() => setIsDropdownOpen(!isDropdownOpen)}
        >
          <Text style={[styles.dropdownText, isDark && styles.dropdownTextDark]}>
            {timeRangeOptions.find(opt => opt.value === selectedRange)?.label}
          </Text>
          <Ionicons 
            name={isDropdownOpen ? "chevron-up" : "chevron-down"} 
            size={16} 
            color={isDark ? "#8E8E93" : "#8E8E93"} 
          />
        </TouchableOpacity>
      </View>

      {/* Dropdown Options */}
      {isDropdownOpen && (
        <Animated.View 
          style={[styles.dropdownMenu, isDark && styles.dropdownMenuDark]}
          entering={FadeInUp.duration(200)}
        >
          {timeRangeOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.dropdownOption,
                selectedRange === option.value && styles.dropdownOptionSelected,
                selectedRange === option.value && isDark && styles.dropdownOptionSelectedDark,
              ]}
              onPress={() => {
                setSelectedRange(option.value as TimeRange);
                setIsDropdownOpen(false);
              }}
            >
              <Text style={[
                styles.dropdownOptionText,
                isDark && styles.dropdownOptionTextDark,
                selectedRange === option.value && styles.dropdownOptionTextSelected,
              ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </Animated.View>
      )}

      {/* Current Values */}
      <View style={styles.currentValues}>
        <View style={styles.valueItem}>
          <View style={[styles.valueIndicator, { backgroundColor: '#007AFF' }]} />
          <Text style={[styles.valueLabel, isDark && styles.valueLabelDark]}>Mood</Text>
          <Text style={[styles.valueNumber, isDark && styles.valueNumberDark]}>
            {currentMood.toFixed(1)}
          </Text>
        </View>
        <View style={styles.valueItem}>
          <View style={[styles.valueIndicator, { backgroundColor: '#34C759' }]} />
          <Text style={[styles.valueLabel, isDark && styles.valueLabelDark]}>Energy</Text>
          <Text style={[styles.valueNumber, isDark && styles.valueNumberDark]}>
            {currentEnergy.toFixed(1)}
          </Text>
        </View>
      </View>

      {/* Chart */}
      <View style={styles.chartContainer}>
        <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
          <Defs>
            <SvgGradient id="moodGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor="#007AFF" stopOpacity="1" />
              <Stop offset="100%" stopColor="#007AFF" stopOpacity="0.8" />
            </SvgGradient>
            <SvgGradient id="energyGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor="#34C759" stopOpacity="1" />
              <Stop offset="100%" stopColor="#34C759" stopOpacity="0.8" />
            </SvgGradient>
          </Defs>
          
          {/* Energy line (behind mood) */}
          {filteredData.length > 0 && (
            <AnimatedPath
              d={energyPath}
              stroke="url(#energyGradient)"
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              animatedProps={animatedEnergyProps}
            />
          )}
          
          {/* Mood line */}
          {filteredData.length > 0 && (
            <AnimatedPath
              d={moodPath}
              stroke="url(#moodGradient)"
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              animatedProps={animatedMoodProps}
            />
          )}
          
          {/* Data points */}
          {filteredData.map((item, index) => {
            const x = (index / Math.max(filteredData.length - 1, 1)) * CHART_WIDTH;
            const moodY = CHART_HEIGHT - (item.mood / 10) * CHART_HEIGHT;
            const energyY = CHART_HEIGHT - (item.energy / 10) * CHART_HEIGHT;
            
            return (
              <React.Fragment key={index}>
                <Circle
                  cx={x}
                  cy={energyY}
                  r="3"
                  fill="#34C759"
                  fillOpacity="0.8"
                />
                <Circle
                  cx={x}
                  cy={moodY}
                  r="3"
                  fill="#007AFF"
                  fillOpacity="0.8"
                />
              </React.Fragment>
            );
          })}
        </Svg>
      </View>

      {/* Time period label */}
      <Text style={[styles.timeLabel, isDark && styles.timeLabelDark]}>
        {selectedRange === '7d' ? 'Last 7 days' : 
         selectedRange === '14d' ? 'Last 14 days' : 'Last 30 days'}
      </Text>

      {/* Insight Card */}
      <Animated.View 
        style={[styles.insightCard, isDark && styles.insightCardDark]}
        entering={FadeInUp.delay(100).duration(400)}
      >
        <View style={styles.insightHeader}>
          <View style={styles.insightIcon}>
            <Ionicons name="bulb-outline" size={16} color="#FF9500" />
          </View>
          <Text style={[styles.insightTitle, isDark && styles.insightTitleDark]}>
            Insight
          </Text>
        </View>
        <Text style={[styles.insightText, isDark && styles.insightTextDark]}>
          {generateInsight()}
        </Text>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  containerDark: {
    backgroundColor: '#1C1C1E',
    shadowColor: '#000000',
    shadowOpacity: 0.3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#007AFF15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  titleDark: {
    color: '#FFFFFF',
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  dropdownDark: {
    backgroundColor: '#2C2C2E',
  },
  dropdownText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
    marginRight: 6,
  },
  dropdownTextDark: {
    color: '#FFFFFF',
  },
  dropdownMenu: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  dropdownMenuDark: {
    backgroundColor: '#2C2C2E',
  },
  dropdownOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  dropdownOptionSelected: {
    backgroundColor: '#007AFF10',
  },
  dropdownOptionSelectedDark: {
    backgroundColor: '#007AFF20',
  },
  dropdownOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
  },
  dropdownOptionTextDark: {
    color: '#FFFFFF',
  },
  dropdownOptionTextSelected: {
    color: '#007AFF',
    fontWeight: '600',
  },
  currentValues: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  valueItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  valueIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  valueLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
    marginRight: 8,
  },
  valueLabelDark: {
    color: '#8E8E93',
  },
  valueNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  valueNumberDark: {
    color: '#FFFFFF',
  },
  chartContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  timeLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 8,
  },
  timeLabelDark: {
    color: '#8E8E93',
  },
  insightCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  insightCardDark: {
    backgroundColor: '#2C2C2E',
    borderColor: '#3A3A3C',
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  insightIcon: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: '#FF950015',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  insightTitleDark: {
    color: '#FFFFFF',
  },
  insightText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#666666',
    lineHeight: 20,
  },
  insightTextDark: {
    color: '#AEAEB2',
  },
});

export default MoodvsEnergy; 