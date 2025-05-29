import { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { NavigationProp } from '../../navigation';

const GOALS = [
  { id: 'Reflection', emoji: '🤔', description: 'Deep thinking and self-awareness' },
  { id: 'Gratitude', emoji: '🙏', description: 'Appreciation and mindfulness' },
  { id: 'Productivity', emoji: '⚡', description: 'Focus and achievement' },
  { id: 'Therapy-lite', emoji: '💭', description: 'Emotional processing and support' },
];

export default function GoalsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);

  const toggleGoal = (goalId: string) => {
    setSelectedGoals((prev) =>
      prev.includes(goalId) ? prev.filter((g) => g !== goalId) : [...prev, goalId]
    );
  };

  return (
    <LinearGradient
      colors={['#667eea', '#764ba2']}
      style={{ flex: 1 }}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View style={{ flex: 1, paddingHorizontal: 24, justifyContent: 'center' }}>
        {/* Header */}
        <View style={{ alignItems: 'center', marginBottom: 32 }}>
          <View style={{
            width: 80,
            height: 80,
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            borderRadius: 40,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 20,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
          }}>
            <Text style={{ fontSize: 32, color: 'white' }}>🎯</Text>
          </View>
          <Text style={{
            fontSize: 28,
            fontWeight: 'bold',
            color: 'white',
            marginBottom: 8,
            textAlign: 'center',
          }}>
            Your Reflection Goals
          </Text>
          <Text style={{
            fontSize: 16,
            color: 'rgba(255, 255, 255, 0.8)',
            textAlign: 'center',
            lineHeight: 22,
          }}>
            Choose what matters most to you
          </Text>
        </View>

        {/* Goals Grid */}
        <View style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          marginBottom: 32,
        }}>
          {GOALS.map((goal, index) => (
            <TouchableOpacity
              key={goal.id}
              style={{
                backgroundColor: selectedGoals.includes(goal.id) ? '#667eea' : 'white',
                width: '48%',
                aspectRatio: 1,
                borderRadius: 20,
                padding: 16,
                marginBottom: 12,
                shadowColor: selectedGoals.includes(goal.id) ? '#667eea' : '#000',
                shadowOffset: { width: 0, height: selectedGoals.includes(goal.id) ? 6 : 4 },
                shadowOpacity: selectedGoals.includes(goal.id) ? 0.4 : 0.15,
                shadowRadius: selectedGoals.includes(goal.id) ? 12 : 8,
                elevation: selectedGoals.includes(goal.id) ? 8 : 4,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: selectedGoals.includes(goal.id) ? 0 : 1,
                borderColor: 'rgba(255, 255, 255, 0.3)',
              }}
              onPress={() => toggleGoal(goal.id)}
              activeOpacity={0.8}
            >
              <Text style={{ fontSize: 36, marginBottom: 8 }}>{goal.emoji}</Text>
              <Text style={{
                color: selectedGoals.includes(goal.id) ? 'white' : '#1F2937',
                fontWeight: '600',
                fontSize: 16,
                marginBottom: 6,
                textAlign: 'center',
              }}>
                {goal.id}
              </Text>
              <Text style={{
                color: selectedGoals.includes(goal.id) ? 'rgba(255, 255, 255, 0.8)' : '#6B7280',
                fontSize: 12,
                textAlign: 'center',
                lineHeight: 16,
              }}>
                {goal.description}
              </Text>
              {selectedGoals.includes(goal.id) && (
                <View style={{
                  position: 'absolute',
                  top: 12,
                  right: 12,
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  borderRadius: 12,
                  width: 24,
                  height: 24,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Text style={{ fontSize: 14, color: 'white' }}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Next Button */}
        <TouchableOpacity
          style={{
            backgroundColor: selectedGoals.length === 0 ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.9)',
            paddingVertical: 16,
            borderRadius: 16,
            shadowColor: selectedGoals.length === 0 ? 'transparent' : '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: selectedGoals.length === 0 ? 0 : 0.2,
            shadowRadius: 8,
            elevation: selectedGoals.length === 0 ? 0 : 6,
            marginBottom: 12,
          }}
          onPress={() => navigation.navigate('TimePreference', { goals: selectedGoals })}
          disabled={selectedGoals.length === 0}
          activeOpacity={0.8}
        >
          <Text style={{
            color: selectedGoals.length === 0 ? 'rgba(255, 255, 255, 0.6)' : '#667eea',
            textAlign: 'center',
            fontSize: 18,
            fontWeight: '600',
          }}>
            {selectedGoals.length === 0 ? 'Select goals to continue' : `Continue (${selectedGoals.length} selected)`}
          </Text>
        </TouchableOpacity>

        <Text style={{
          color: 'rgba(255, 255, 255, 0.7)',
          textAlign: 'center',
          fontSize: 14,
        }}>
          You can change these preferences later
        </Text>
      </View>
    </LinearGradient>
  );
}