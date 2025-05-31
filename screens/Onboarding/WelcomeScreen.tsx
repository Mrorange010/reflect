import { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../utils/supabase';
import { NavigationProp } from '../../navigation';

export default function WelcomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  const handleNext = async () => {
    if (!name.trim()) {
      Alert.alert('Please enter your first name.');
      return;
    }
    setSaving(true);
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('No user logged in');
      // Save to users table
      await supabase.from('users').upsert({
        id: user.id,
        name: name.trim(),
        email: user.email, // optional, for upsert
      });
      navigation.navigate('Goals');
    } catch (e) {
      Alert.alert('Error', 'Failed to save your name.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <LinearGradient
      colors={['#667eea', '#764ba2']}
      style={{ flex: 1 }}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View style={{ flex: 1, paddingHorizontal: 24, justifyContent: 'center' }}>
        {/* Ava Introduction and Name Prompt */}
        <View style={{ alignItems: 'center', marginBottom: 48 }}>
          <Text style={{
            fontSize: 28,
            fontWeight: 'bold',
            color: 'white',
            marginBottom: 18,
            textAlign: 'center',
          }}>
            Hi! I'm Ava 👋
          </Text>
          <Text style={{
            fontSize: 18,
            color: 'rgba(255, 255, 255, 0.9)',
            textAlign: 'center',
            lineHeight: 26,
            paddingHorizontal: 8,
            marginBottom: 24,
          }}>
            I'm here to help you reflect on life's journey. Before we get started, what shall I call you?
          </Text>
          <TextInput
            placeholder="first name"
            placeholderTextColor="#bdbdbd"
            value={name}
            onChangeText={setName}
            style={{
              backgroundColor: 'white',
              borderRadius: 14,
              padding: 16,
              fontSize: 18,
              width: '100%',
              marginBottom: 24,
              color: '#222',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08,
              shadowRadius: 4,
              elevation: 2,
            }}
            autoCapitalize="words"
            autoFocus
            returnKeyType="done"
            onSubmitEditing={handleNext}
          />
          <TouchableOpacity
            style={{
              backgroundColor: saving ? '#ccc' : '#667eea',
              paddingVertical: 16,
              paddingHorizontal: 48,
              borderRadius: 16,
              shadowColor: '#667eea',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 6,
              width: '100%',
            }}
            onPress={handleNext}
            disabled={saving}
            activeOpacity={0.8}
          >
            <Text style={{
              color: 'white',
              textAlign: 'center',
              fontSize: 18,
              fontWeight: '600',
            }}>
              {saving ? 'Saving...' : 'Continue'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Bottom inspirational text */}
        <View style={{ alignItems: 'center' }}>
          <Text style={{
            color: 'rgba(255, 255, 255, 0.7)',
            textAlign: 'center',
            fontSize: 14,
            lineHeight: 20,
            paddingHorizontal: 32,
          }}>
            "The unexamined life is not worth living" - Socrates
          </Text>
        </View>
      </View>
    </LinearGradient>
  );
}