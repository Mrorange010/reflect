import { View, Text, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { NavigationProp } from '../../navigation';

export default function WelcomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  
  return (
    <LinearGradient
      colors={['#667eea', '#764ba2']}
      style={{ flex: 1 }}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View style={{ flex: 1, paddingHorizontal: 24, justifyContent: 'center' }}>
        {/* Header */}
        <View style={{ alignItems: 'center', marginBottom: 48 }}>
          <View style={{
            width: 100,
            height: 100,
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            borderRadius: 50,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 32,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
          }}>
            <Text style={{ fontSize: 40, color: 'white' }}>✨</Text>
          </View>
          <Text style={{
            fontSize: 36,
            fontWeight: 'bold',
            color: 'white',
            marginBottom: 12,
            textAlign: 'center',
          }}>
            Welcome to ReflectAI
          </Text>
          <Text style={{
            fontSize: 18,
            color: 'rgba(255, 255, 255, 0.8)',
            textAlign: 'center',
            lineHeight: 26,
            paddingHorizontal: 16,
          }}>
            Your daily AI-powered reflection companion.{'\n'}Let's set up your experience!
          </Text>
        </View>

        {/* Content Card */}
        <View style={{
          backgroundColor: 'white',
          borderRadius: 24,
          padding: 32,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.15,
          shadowRadius: 16,
          elevation: 12,
          marginBottom: 32,
          alignItems: 'center',
        }}>
          <Text style={{
            fontSize: 20,
            fontWeight: '600',
            color: '#1F2937',
            marginBottom: 16,
            textAlign: 'center',
          }}>
            Ready to Begin?
          </Text>
          <Text style={{
            fontSize: 16,
            color: '#6B7280',
            textAlign: 'center',
            lineHeight: 24,
            marginBottom: 32,
          }}>
            We'll guide you through a quick setup to personalize your reflection journey
          </Text>

          <TouchableOpacity
            style={{
              backgroundColor: '#667eea',
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
            onPress={() => navigation.navigate('Goals')}
            activeOpacity={0.8}
          >
            <Text style={{
              color: 'white',
              textAlign: 'center',
              fontSize: 18,
              fontWeight: '600',
            }}>
              Start Your Journey
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