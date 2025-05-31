import { useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../utils/supabase';
import { NavigationProp } from '../../navigation';

interface Time {
  id: string;
  emoji: string;
  description: string;
}

const TIMES = [
  { id: 'Morning', emoji: '🌅', description: 'Ava will call between 9am and 11am' },
  { id: 'Afternoon', emoji: '☀️', description: 'Ava will call between 1pm and 3pm' },
  { id: 'Evening', emoji: '🌙', description: 'Ava will call between 7pm and 9pm' },
];

export default function TimePreferenceScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<any>();
  const { goals } = route.params || {};
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleFinish = async () => {
    if (!selectedTime) {
      Alert.alert('Please select a time preference.');
      return;
    }
    setSaving(true);
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('No user logged in');
      const { error } = await supabase.from('user_settings').upsert({
        user_id: user.id,
        goals: goals ? JSON.stringify(goals) : null,
        call_time: selectedTime,
        onboarding_complete: true,
      });
      if (error) throw error;
      // Navigate to main app/home screen
      navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
    } catch (e) {
      Alert.alert('Error', 'Failed to save your time preference.');
    } finally {
      setSaving(false);
    }
  };

  const renderTimeCard = (time: Time, isFullWidth = false) => (
    <TouchableOpacity
      key={time.id}
      style={{
        backgroundColor: selectedTime === time.id ? '#667eea' : 'white',
        width: isFullWidth ? '100%' : '48%',
        aspectRatio: isFullWidth ? 2.5 : 1,
        borderRadius: 20,
        padding: 16,
        shadowColor: selectedTime === time.id ? '#667eea' : '#000',
        shadowOffset: { width: 0, height: selectedTime === time.id ? 6 : 4 },
        shadowOpacity: selectedTime === time.id ? 0.4 : 0.15,
        shadowRadius: selectedTime === time.id ? 12 : 8,
        elevation: selectedTime === time.id ? 8 : 4,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: selectedTime === time.id ? 0 : 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
      }}
      onPress={() => setSelectedTime(time.id)}
      activeOpacity={0.8}
    >
      <Text style={{ fontSize: 36, marginBottom: 8 }}>{time.emoji}</Text>
      <Text style={{
        color: selectedTime === time.id ? 'white' : '#1F2937',
        fontWeight: '600',
        fontSize: 16,
        marginBottom: 6,
        textAlign: 'center',
      }}>
        {time.id}
      </Text>
      <Text style={{
        color: selectedTime === time.id ? 'rgba(255, 255, 255, 0.8)' : '#6B7280',
        fontSize: 12,
        textAlign: 'center',
        lineHeight: 16,
      }}>
        {time.description}
      </Text>
      {selectedTime === time.id && (
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
  );

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
            <Text style={{ fontSize: 32, color: 'white' }}>⏰</Text>
          </View>
          <Text style={{
            fontSize: 28,
            fontWeight: 'bold',
            color: 'white',
            marginBottom: 8,
            textAlign: 'center',
          }}>
            Perfect Timing
          </Text>
          <Text style={{
            fontSize: 16,
            color: 'rgba(255, 255, 255, 0.8)',
            textAlign: 'center',
            lineHeight: 22,
          }}>
            When do you prefer to reflect?
          </Text>
        </View>

        {/* Time Options Grid */}
        <View style={{
          marginBottom: 32,
        }}>
          {/* Top Row: Morning and Afternoon */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
            {renderTimeCard(TIMES[0])}
            {renderTimeCard(TIMES[1])}
          </View>
          {/* Bottom Row: Evening (Full Width) */}
          <View>
            {renderTimeCard(TIMES[2], true)}
          </View>
        </View>

        {/* Start Reflecting Button */}
        <TouchableOpacity
          style={{
            backgroundColor: !selectedTime || saving ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.9)',
            paddingVertical: 16,
            borderRadius: 16,
            shadowColor: !selectedTime || saving ? 'transparent' : '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: !selectedTime || saving ? 0 : 0.2,
            shadowRadius: 8,
            elevation: !selectedTime || saving ? 0 : 6,
            marginBottom: 12,
          }}
          onPress={handleFinish}
          disabled={!selectedTime || saving}
          activeOpacity={0.8}
        >
          <Text style={{
            color: !selectedTime || saving ? 'rgba(255, 255, 255, 0.6)' : '#667eea',
            textAlign: 'center',
            fontSize: 18,
            fontWeight: '600',
          }}>
            {saving ? 'Setting up your experience...' : 'Start Reflecting'}
          </Text>
        </TouchableOpacity>

        <Text style={{
          color: 'rgba(255, 255, 255, 0.7)',
          textAlign: 'center',
          fontSize: 14,
        }}>
          We'll send gentle reminders at your preferred time
        </Text>
      </View>
    </LinearGradient>
  );
}