import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import Svg, { Circle, Path, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  withTiming,
  withDelay,
  Easing,
  FadeInUp,
  interpolate,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const CHART_SIZE = 200;
const RADIUS = 80;
const INNER_RADIUS = 45;
const STROKE_WIDTH = 35;

interface EmotionData {
  emotion: string;
  value: number;
  color: string;
  icon: string;
}

interface EmotionsProps {
  isDark: boolean;
}

type TimeRange = '7d' | '14d' | '30d';

const AnimatedPath = Animated.createAnimatedComponent(Path);

const Emotions: React.FC<EmotionsProps> = ({ isDark }) => {
  const [selectedRange, setSelectedRange] = useState<TimeRange>('14d');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  const scaleValue = useSharedValue(0.8);
  const rotationValue = useSharedValue(0);
  
  // Sample emotion data - this would be dynamic from your database
  const emotionData: EmotionData[] = [
    { emotion: 'Joy', value: 35, color: '#30D158', icon: 'happy-outline' },
    { emotion: 'Calm', value: 25, color: '#007AFF', icon: 'leaf-outline' },
    { emotion: 'Anxiety', value: 20, color: '#FF9F0A', icon: 'flash-outline' },
    { emotion: 'Sadness', value: 10, color: '#5E5CE6', icon: 'rainy-outline' },
    { emotion: 'Anger', value: 7, color: '#FF453A', icon: 'flame-outline' },
    { emotion: 'Excited', value: 3, color: '#FF2D92', icon: 'rocket-outline' },
  ];

  const timeRangeOptions = [
    { value: '7d', label: '7 Days' },
    { value: '14d', label: '14 Days' },
    { value: '30d', label: '30 Days' },
  ];

  const total = emotionData.reduce((sum, item) => sum + item.value, 0);

  useEffect(() => {
    // Reset and restart animations when time range changes
    scaleValue.value = 0.8;
    
    scaleValue.value = withDelay(
      200,
      withTiming(1, {
        duration: 600,
        easing: Easing.out(Easing.back(1.1)),
      })
    );

    rotationValue.value = withDelay(
      400,
      withTiming(1, {
        duration: 1000,
        easing: Easing.out(Easing.cubic),
      })
    );
  }, [selectedRange]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleValue.value }],
  }));

  // Generate pie chart paths with gaps between segments
  const generatePieSlices = () => {
    let currentAngle = -90; // Start from top
    const GAP_ANGLE = 2; // Small gap between segments
    
    return emotionData.map((emotion, index) => {
      const percentage = (emotion.value / total) * 100;
      const angle = (emotion.value / total) * 360 - GAP_ANGLE;
      
      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;
      
      // Outer arc points
      const x1 = CHART_SIZE / 2 + RADIUS * Math.cos((startAngle * Math.PI) / 180);
      const y1 = CHART_SIZE / 2 + RADIUS * Math.sin((startAngle * Math.PI) / 180);
      const x2 = CHART_SIZE / 2 + RADIUS * Math.cos((endAngle * Math.PI) / 180);
      const y2 = CHART_SIZE / 2 + RADIUS * Math.sin((endAngle * Math.PI) / 180);
      
      // Inner arc points
      const ix1 = CHART_SIZE / 2 + INNER_RADIUS * Math.cos((startAngle * Math.PI) / 180);
      const iy1 = CHART_SIZE / 2 + INNER_RADIUS * Math.sin((startAngle * Math.PI) / 180);
      const ix2 = CHART_SIZE / 2 + INNER_RADIUS * Math.cos((endAngle * Math.PI) / 180);
      const iy2 = CHART_SIZE / 2 + INNER_RADIUS * Math.sin((endAngle * Math.PI) / 180);
      
      const largeArcFlag = angle > 180 ? 1 : 0;
      
      // Create donut segment path
      const pathData = [
        `M ${x1} ${y1}`,
        `A ${RADIUS} ${RADIUS} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
        `L ${ix2} ${iy2}`,
        `A ${INNER_RADIUS} ${INNER_RADIUS} 0 ${largeArcFlag} 0 ${ix1} ${iy1}`,
        'Z'
      ].join(' ');
      
      currentAngle += angle + GAP_ANGLE;
      
      return { ...emotion, path: pathData, percentage, index };
    });
  };

  const pieSlices = generatePieSlices();

  const AnimatedPieSlice = ({ slice, index }: { slice: any; index: number }) => {
    const pathProgress = useSharedValue(0);
    
    useEffect(() => {
      pathProgress.value = withDelay(
        600 + index * 100,
        withTiming(1, {
          duration: 600,
          easing: Easing.out(Easing.cubic),
        })
      );
    }, []);

    const animatedProps = useAnimatedProps(() => {
      const opacity = interpolate(pathProgress.value, [0, 1], [0, 1]);
      return { opacity };
    });

    return (
      <AnimatedPath
        d={slice.path}
        fill={slice.color}
        animatedProps={animatedProps}
      />
    );
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>
        Emotions
      </Text>
      
      <Animated.View 
        style={[
          styles.emotionsCard,
          isDark && styles.emotionsCardDark,
        ]}
        entering={FadeInUp.delay(500).duration(600)}
      >
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, isDark && styles.cardTitleDark]}>
            Overview of past {selectedRange === '7d' ? '7 days' : selectedRange === '14d' ? '2 weeks' : '30 days'}
          </Text>
          
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

        {/* Pie Chart */}
        <Animated.View style={[styles.chartContainer, animatedStyle]}>
          <View style={styles.chartShadow}>
            <Svg width={CHART_SIZE} height={CHART_SIZE}>
              <Defs>
                {pieSlices.map((slice, index) => (
                  <SvgGradient 
                    key={index} 
                    id={`gradient${index}`} 
                    x1="0%" 
                    y1="0%" 
                    x2="100%" 
                    y2="100%"
                  >
                    <Stop offset="0%" stopColor={slice.color} stopOpacity="1" />
                    <Stop offset="100%" stopColor={slice.color} stopOpacity="0.9" />
                  </SvgGradient>
                ))}
              </Defs>
              
              {/* Background ring */}
              <Circle
                cx={CHART_SIZE / 2}
                cy={CHART_SIZE / 2}
                r={RADIUS}
                fill="none"
                stroke={isDark ? '#2C2C2E' : '#F2F2F7'}
                strokeWidth={STROKE_WIDTH}
              />
              
              {/* Pie slices */}
              {pieSlices.map((slice, index) => (
                <AnimatedPieSlice key={index} slice={slice} index={index} />
              ))}
              
              {/* Center highlight */}
              <Circle
                cx={CHART_SIZE / 2}
                cy={CHART_SIZE / 2}
                r={INNER_RADIUS - 2}
                fill={isDark ? '#1C1C1E' : '#FFFFFF'}
                stroke={isDark ? '#2C2C2E' : '#F2F2F7'}
                strokeWidth="1"
              />
            </Svg>
          </View>
        </Animated.View>

        {/* Legend */}
        <View style={styles.legendContainer}>
          {pieSlices.map((slice, index) => (
            <Animated.View 
              key={slice.emotion}
              style={styles.legendItem}
              entering={FadeInUp.delay(800 + index * 50).duration(400)}
            >
              <View style={styles.legendRow}>
                <View style={[styles.colorIndicator, { backgroundColor: slice.color }]} />
                <View style={styles.legendContent}>
                  <Text style={[styles.emotionName, isDark && styles.emotionNameDark]}>
                    {slice.emotion}
                  </Text>
                  <Text style={[styles.emotionPercentage, isDark && styles.emotionPercentageDark]}>
                    {slice.percentage.toFixed(0)}%
                  </Text>
                </View>
              </View>
            </Animated.View>
          ))}
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
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
  emotionsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  emotionsCardDark: {
    backgroundColor: '#1C1C1E',
    shadowColor: '#000000',
    shadowOpacity: 0.3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8E8E93',
    flex: 1,
  },
  cardTitleDark: {
    color: '#8E8E93',
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    minWidth: 80,
  },
  dropdownDark: {
    backgroundColor: '#2C2C2E',
  },
  dropdownText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#000000',
    marginRight: 4,
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
  chartContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  chartShadow: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  legendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  legendItem: {
    width: '48%',
    marginBottom: 12,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  colorIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  legendContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  emotionName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
  },
  emotionNameDark: {
    color: '#FFFFFF',
  },
  emotionPercentage: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
  },
  emotionPercentageDark: {
    color: '#8E8E93',
  },
});

export default Emotions; 