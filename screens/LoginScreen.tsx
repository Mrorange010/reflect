import { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import AuthInput from '../components/auth/AuthInput';
import { supabase } from '../utils/supabase';
import { NavigationProp } from '../navigation';
import { AuthError } from '@supabase/supabase-js';

export default function LoginScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};
    
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    if (!password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      navigation.navigate('Home');
    } catch (error) {
      const authError = error as AuthError;
      Alert.alert('Login Failed', authError.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    Alert.alert(
      'Reset Password',
      'Please enter your email address and we\'ll send you a reset link.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send Reset Email',
          onPress: async () => {
            if (!email) {
              Alert.alert('Error', 'Please enter your email first');
              return;
            }
            try {
              const { error } = await supabase.auth.resetPasswordForEmail(email);
              if (error) throw error;
              Alert.alert('Success', 'Password reset email sent!');
            } catch (error) {
              Alert.alert('Error', 'Failed to send reset email');
            }
          }
        }
      ]
    );
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
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
              width: 80,
              height: 80,
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              borderRadius: 40,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 24,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 8,
            }}>
              <Text style={{ fontSize: 32, color: 'white' }}>✨</Text>
            </View>
            <Text style={{
              fontSize: 32,
              fontWeight: 'bold',
              color: 'white',
              marginBottom: 8,
              textAlign: 'center',
            }}>
              Welcome Back
            </Text>
            <Text style={{
              fontSize: 16,
              color: 'rgba(255, 255, 255, 0.8)',
              textAlign: 'center',
              lineHeight: 24,
            }}>
              Continue your journey of self-discovery
            </Text>
          </View>

          {/* Form Card */}
          <View style={{
            backgroundColor: 'white',
            borderRadius: 24,
            padding: 24,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.15,
            shadowRadius: 16,
            elevation: 12,
            marginBottom: 24,
          }}>
            <AuthInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
            />

            <AuthInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              secureTextEntry
              error={errors.password}
            />

            <TouchableOpacity
              style={{
                backgroundColor: loading ? '#9CA3AF' : '#667eea',
                paddingVertical: 16,
                borderRadius: 16,
                marginTop: 24,
                shadowColor: loading ? '#9CA3AF' : '#667eea',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 6,
              }}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              <Text style={{
                color: 'white',
                textAlign: 'center',
                fontSize: 18,
                fontWeight: '600',
              }}>
                {loading ? 'Signing you in...' : 'Continue Your Journey'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{ marginTop: 16, paddingVertical: 8 }}
              onPress={handleForgotPassword}
              activeOpacity={0.7}
            >
              <Text style={{
                color: '#667eea',
                textAlign: 'center',
                fontSize: 16,
                fontWeight: '500',
              }}>
                Forgot your password?
              </Text>
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 24,
          }}>
            <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(255, 255, 255, 0.3)' }} />
            <Text style={{
              marginHorizontal: 16,
              color: 'rgba(255, 255, 255, 0.8)',
              fontSize: 16,
              fontWeight: '500',
            }}>
              or
            </Text>
            <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(255, 255, 255, 0.3)' }} />
          </View>

          {/* Sign Up Button */}
          <TouchableOpacity
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              borderWidth: 1,
              borderColor: 'rgba(255, 255, 255, 0.3)',
              paddingVertical: 16,
              borderRadius: 16,
            }}
            onPress={() => navigation.navigate('SignUp')}
            activeOpacity={0.8}
          >
            <Text style={{
              color: 'white',
              textAlign: 'center',
              fontSize: 18,
              fontWeight: '600',
            }}>
              Start Your Reflection Journey
            </Text>
          </TouchableOpacity>

          <Text style={{
            color: 'rgba(255, 255, 255, 0.7)',
            textAlign: 'center',
            marginTop: 12,
            fontSize: 14,
          }}>
            New to mindful reflection? Create your account
          </Text>
        </View>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}