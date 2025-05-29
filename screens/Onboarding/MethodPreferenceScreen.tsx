import { useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../utils/supabase';
import { NavigationProp } from '../../navigation';

interface Method {
  id: string;
  emoji: string;
  description: string;
}

const METHODS = [
  { id: 'Call', emoji: '📞', description: 'Voice conversations with AI' },
  { id: 'Text', emoji: '💬', description: 'Written reflection prompts' },
  { id: 'Both', emoji: '🔄', description: 'Mix of voice and text options' },
];

export default function MethodPreferenceScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<any>();
  const { goals, time } = route.params || {};
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleFinish = async () => {
    setSaving(true);
    try {
      // Save onboarding data to Supabase (assumes user is logged in)
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('No user logged in');
      const { error } = await supabase.from('user_settings').upsert({
        user_id: user.id,
        goals,
        call_time: time,
        method: selectedMethod,
        onboarding_complete: true,
      });
      if (error) throw error;
    } catch (e) {
      Alert.alert('Error', 'Failed to save onboarding preferences.');
    } finally {
      setSaving(false);
    }
  };

  const renderMethodCard = (method: Method, isFullWidth = false) => (
    <TouchableOpacity
      key={method.id}
      style={{
        backgroundColor: selectedMethod === method.id ? '#667eea' : 'white',
        width: isFullWidth ? '100%' : '48%',
        aspectRatio: isFullWidth ? 2.5 : 1,
        borderRadius: 20,
        padding: 16,
        shadowColor: selectedMethod === method.id ? '#667eea' : '#000',
        shadowOffset: { width: 0, height: selectedMethod === method.id ? 6 : 4 },
        shadowOpacity: selectedMethod === method.id ? 0.4 : 0.15,
        shadowRadius: selectedMethod === method.id ? 12 : 8,
        elevation: selectedMethod === method.id ? 8 : 4,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: selectedMethod === method.id ? 0 : 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
      }}
      onPress={() => setSelectedMethod(method.id)}
      activeOpacity={0.8}
    >
      <Text style={{ fontSize: 36, marginBottom: 8 }}>{method.emoji}</Text>
      <Text style={{
        color: selectedMethod === method.id ? 'white' : '#1F2937',
        fontWeight: '600',
        fontSize: 16,
        marginBottom: 6,
        textAlign: 'center',
      }}>
        {method.id}
      </Text>
      <Text style={{
        color: selectedMethod === method.id ? 'rgba(255, 255, 255, 0.8)' : '#6B7280',
        fontSize: 12,
        textAlign: 'center',
        lineHeight: 16,
      }}>
        {method.description}
      </Text>
      {selectedMethod === method.id && (
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
            <Text style={{ fontSize: 32, color: 'white' }}>💭</Text>
          </View>
          <Text style={{
            fontSize: 28,
            fontWeight: 'bold',
            color: 'white',
            marginBottom: 8,
            textAlign: 'center',
          }}>
            Your Style
          </Text>
          <Text style={{
            fontSize: 16,
            color: 'rgba(255, 255, 255, 0.8)',
            textAlign: 'center',
            lineHeight: 22,
          }}>
            How do you want to reflect?
          </Text>
        </View>

        {/* Method Options Grid */}
        <View style={{
          marginBottom: 32,
        }}>
          {/* Top Row: Call and Text */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
            {renderMethodCard(METHODS[0])}
            {renderMethodCard(METHODS[1])}
          </View>
          
          {/* Bottom Row: Both (Full Width) */}
          <View>
            {renderMethodCard(METHODS[2], true)}
          </View>
        </View>

        {/* Finish Button */}
        <TouchableOpacity
          style={{
            backgroundColor: (!selectedMethod || saving) ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.9)',
            paddingVertical: 16,
            borderRadius: 16,
            shadowColor: (!selectedMethod || saving) ? 'transparent' : '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: (!selectedMethod || saving) ? 0 : 0.2,
            shadowRadius: 8,
            elevation: (!selectedMethod || saving) ? 0 : 6,
            marginBottom: 12,
          }}
          onPress={handleFinish}
          disabled={!selectedMethod || saving}
          activeOpacity={0.8}
        >
          <Text style={{
            color: (!selectedMethod || saving) ? 'rgba(255, 255, 255, 0.6)' : '#667eea',
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
          You're all set! Let's begin your journey
        </Text>
      </View>
    </LinearGradient>
  );
}