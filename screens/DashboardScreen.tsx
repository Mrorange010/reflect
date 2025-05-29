import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import { NavigationProp } from '../navigation';

const { width } = Dimensions.get('window');

export default function ProfessionalDashboard() {
  const [selectedInsight, setSelectedInsight] = useState(0);
  const navigation = useNavigation<NavigationProp>();

  const insights = [
    "You're most energetic on days you exercise in the morning",
    "Your mood improves significantly after social interactions",
    "Tuesday is consistently your most productive day",
    "You reflect deeper when you're feeling grateful",
  ];

  const moodData = [
    { day: 'Mon', value: 0.6, color: '#EF4444' },
    { day: 'Tue', value: 0.9, color: '#10B981' },
    { day: 'Wed', value: 0.4, color: '#EF4444' },
    { day: 'Thu', value: 0.8, color: '#10B981' },
    { day: 'Fri', value: 0.95, color: '#10B981' },
    { day: 'Sat', value: 0.7, color: '#10B981' },
    { day: 'Sun', value: 0.5, color: '#F59E0B' },
  ];

  const recentReflections = [
    { day: 'Wed', date: 'Dec 28', summary: 'Felt accomplished after presentation', mood: 'positive' },
    { day: 'Tue', date: 'Dec 27', summary: 'Productive morning, feeling focused', mood: 'positive' },
    { day: 'Mon', date: 'Dec 26', summary: 'Struggled with work-life balance', mood: 'neutral' },
  ];

  interface CircularProgressProps {
    percentage: number;
    size?: number;
  }

  const CircularProgress: React.FC<CircularProgressProps> = ({ percentage, size = 80 }) => {
    const radius = (size - 8) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size} style={{ position: 'absolute' }}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="rgba(148, 163, 184, 0.2)"
            strokeWidth="8"
            fill="none"
          />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#06B6D4"
            strokeWidth="8"
            fill="none"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </Svg>
        <View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>
            {percentage}%
          </Text>
        </View>
      </View>
    );
  };

  const MetricsCard = () => (
    <LinearGradient
      colors={['#0F172A', '#1E293B', '#0F172A']}
      style={{
        borderRadius: 24,
        padding: 24,
        marginHorizontal: 16,
        marginTop: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
        elevation: 12,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <View style={{ flex: 1, minWidth: 200 }}>
          <Text style={{ color: 'white', fontSize: 24, fontWeight: 'bold', marginBottom: 4 }}>
            Daily Progress
          </Text>
          <Text style={{ color: '#94A3B8', fontSize: 14 }}>
            Consistent growth this week
          </Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          {/* Goals Achievement */}
          <View style={{ alignItems: 'center' }}>
            <CircularProgress percentage={60} size={64} />
            <Text style={{ color: '#94A3B8', fontSize: 12, fontWeight: '600', marginTop: 8 }}>
              Goals
            </Text>
          </View>

          {/* Streak Counter */}
          <View style={{ alignItems: 'center' }}>
            <LinearGradient
              colors={['#10B981', '#059669']}
              style={{
                borderRadius: 16,
                padding: 12,
                marginBottom: 8,
                shadowColor: '#10B981',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 6,
              }}
            >
              <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold' }}>7</Text>
            </LinearGradient>
            <Text style={{ color: '#94A3B8', fontSize: 12, fontWeight: '600' }}>
              Day Streak
            </Text>
          </View>

          {/* Trending Up */}
          <View style={{ alignItems: 'center' }}>
            <LinearGradient
              colors={['#8B5CF6', '#7C3AED']}
              style={{
                width: 48,
                height: 48,
                borderRadius: 16,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 8,
                shadowColor: '#8B5CF6',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 6,
              }}
            >
              <Ionicons name="analytics" size={20} color="white" />
            </LinearGradient>
            <Text style={{ color: '#94A3B8', fontSize: 12, fontWeight: '600' }}>
              Trending Up
            </Text>
          </View>
        </View>
      </View>
    </LinearGradient>
  );

  const EnhancedMoodChart = () => (
    <View style={{
      backgroundColor: 'white',
      borderRadius: 24,
      padding: 20,
      margin: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 4,
    }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <Text style={{ color: '#0F172A', fontSize: 18, fontWeight: 'bold' }}>
          Weekly Mood Trends
        </Text>
        <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#10B981' }} />
            <Text style={{ color: '#64748B', fontSize: 12, fontWeight: '600' }}>Positive</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#F59E0B' }} />
            <Text style={{ color: '#64748B', fontSize: 12, fontWeight: '600' }}>Neutral</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#EF4444' }} />
            <Text style={{ color: '#64748B', fontSize: 12, fontWeight: '600' }}>Challenging</Text>
          </View>
        </View>
      </View>
      
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 120, marginBottom: 24 }}>
        {moodData.map((day, index) => (
          <TouchableOpacity key={day.day} style={{ alignItems: 'center', flex: 1 }}>
            <View style={{
              width: 24,
              backgroundColor: '#F1F5F9',
              borderRadius: 12,
              height: 96,
              justifyContent: 'flex-end',
              overflow: 'hidden',
            }}>
              <View style={{
                backgroundColor: day.color,
                borderRadius: 12,
                height: day.value * 96,
              }} />
            </View>
            <Text style={{ color: '#64748B', fontSize: 12, marginTop: 8, fontWeight: '700' }}>
              {day.day}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      <View style={{
        padding: 12,
        backgroundColor: '#F8FAFC',
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
      }}>
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981' }} />
        <Text style={{ color: '#475569', fontSize: 14, fontWeight: '600', flex: 1 }}>
          Strong finish to the week with 3 consecutive positive days
        </Text>
      </View>
    </View>
  );

  const SwipeableInsights = () => (
    <View style={{
      backgroundColor: 'white',
      marginHorizontal: 16,
      marginBottom: 24,
      borderRadius: 24,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 4,
    }}>
      <View style={{ padding: 24 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
          <LinearGradient
            colors={['#F59E0B', '#EA580C']}
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 12,
            }}
          >
            <Ionicons name="analytics" size={20} color="white" />
          </LinearGradient>
          <Text style={{ color: '#0F172A', fontSize: 18, fontWeight: 'bold' }}>
            Weekly Insights
          </Text>
        </View>
        
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(event) => {
            const newIndex = Math.round(event.nativeEvent.contentOffset.x / (width - 64));
            setSelectedInsight(newIndex);
          }}
        >
          {insights.map((insight, index) => (
            <View key={index} style={{ width: width - 64, paddingRight: 16 }}>
              <Text style={{ color: '#64748B', fontSize: 16, lineHeight: 24 }}>
                {insight}
              </Text>
            </View>
          ))}
        </ScrollView>
        
        <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 24, gap: 8 }}>
          {insights.map((_, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => setSelectedInsight(index)}
              style={{
                width: index === selectedInsight ? 24 : 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: index === selectedInsight ? '#F59E0B' : '#CBD5E1',
              }}
            />
          ))}
        </View>
      </View>
    </View>
  );

  const RecentReflections = () => (
    <View style={{
      backgroundColor: 'white',
      marginHorizontal: 16,
      marginBottom: 24,
      borderRadius: 24,
      padding: 24,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 4,
    }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Text style={{ color: '#0F172A', fontSize: 20, fontWeight: 'bold' }}>
          Recent Reflections
        </Text>
        <TouchableOpacity>
          <Text style={{ color: '#8B5CF6', fontSize: 14, fontWeight: '700' }}>View All</Text>
        </TouchableOpacity>
      </View>
      
      {recentReflections.map((reflection, index) => (
        <TouchableOpacity
          key={index}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            padding: 16,
            borderRadius: 16,
            backgroundColor: '#F8FAFC',
            marginBottom: index < recentReflections.length - 1 ? 16 : 0,
          }}
        >
          <LinearGradient
            colors={
              reflection.mood === 'positive' 
                ? ['#10B981', '#059669'] 
                : reflection.mood === 'neutral'
                ? ['#6B7280', '#4B5563']
                : ['#EF4444', '#DC2626']
            }
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 16,
            }}
          >
            <Text style={{ color: 'white', fontSize: 14, fontWeight: 'bold' }}>
              {reflection.day}
            </Text>
          </LinearGradient>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#64748B', fontSize: 12, fontWeight: '600', marginBottom: 2 }}>
              {reflection.date}
            </Text>
            <Text style={{ color: '#0F172A', fontSize: 14, fontWeight: '600' }}>
              {reflection.summary}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
        </TouchableOpacity>
      ))}
    </View>
  );

  const StartReflectionButton = () => (
    <View style={{ paddingHorizontal: 16, marginBottom: 32 }}>
      <TouchableOpacity onPress={() => navigation.navigate('Call')}>
        <LinearGradient
          colors={['#8B5CF6', '#6366F1']}
          style={{
            borderRadius: 16,
            paddingVertical: 20,
            paddingHorizontal: 24,
            shadowColor: '#8B5CF6',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.25,
            shadowRadius: 16,
            elevation: 8,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <Ionicons name="call-outline" size={20} color="white" />
            <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>
              Test Call Interface
            </Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Dashboard</Text>
          <TouchableOpacity
            style={styles.testButton}
            onPress={() => navigation.navigate('Call')}
          >
            <Text style={styles.testButtonText}>Test Call Interface</Text>
          </TouchableOpacity>
        </View>

        <MetricsCard />
        <EnhancedMoodChart />
        <SwipeableInsights />
        <RecentReflections />
        <StartReflectionButton />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 4,
  },
  testButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  testButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
}); 