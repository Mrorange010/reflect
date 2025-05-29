import { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import AuthInput from '../components/auth/AuthInput';
import { supabase } from '../utils/supabase';
import { NavigationProp } from '../navigation';
import { AuthError } from '@supabase/supabase-js';

export default function SignUpScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ 
    email?: string; 
    password?: string; 
    confirmPassword?: string;
  }>({});

  const validateForm = () => {
    const newErrors: { 
      email?: string; 
      password?: string; 
      confirmPassword?: string;
    } = {};
    
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      newErrors.password = 'Password must contain uppercase, lowercase, and number';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignUp = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      Alert.alert(
        'Welcome to Your Journey! 🌟',
        'We\'ve sent a confirmation link to your email. Please verify your account to begin your daily reflection practice.',
        [{ 
          text: 'Got it!', 
          onPress: () => navigation.navigate('Login') 
        }]
      );
    } catch (error) {
      const authError = error as AuthError;
      Alert.alert('Sign Up Failed', authError.message);
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = () => {
    if (password.length === 0) return null;
    
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z\d]/.test(password)) strength++;

    const colors = ['#EF4444', '#F97316', '#EAB308', '#22C55E', '#16A34A'];
    const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
    
    return { strength, color: colors[strength - 1], label: labels[strength - 1] };
  };

  const passwordStrength = getPasswordStrength();

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient
        colors={['#9333ea', '#ec4899']}
        style={{ flex: 1 }}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={{ flex: 1, paddingHorizontal: 24, justifyContent: 'center', paddingVertical: 20 }}>
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
              <Text style={{ fontSize: 32, color: 'white' }}>🌱</Text>
            </View>
            <Text style={{
              fontSize: 28,
              fontWeight: 'bold',
              color: 'white',
              marginBottom: 8,
              textAlign: 'center',
            }}>
              Begin Your Journey
            </Text>
            <Text style={{
              fontSize: 15,
              color: 'rgba(255, 255, 255, 0.8)',
              textAlign: 'center',
              lineHeight: 22,
            }}>
              Start building mindful reflection habits
            </Text>
          </View>

          {/* Form Card */}
          <View style={{
            backgroundColor: 'white',
            borderRadius: 24,
            padding: 20,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.15,
            shadowRadius: 16,
            elevation: 12,
            marginBottom: 20,
          }}>
            <AuthInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="your@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
            />

            <AuthInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Create a secure password"
              secureTextEntry
              error={errors.password}
            />

            {/* Password Strength Indicator */}
            {passwordStrength && (
              <View style={{ marginBottom: 16 }}>
                <View style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 8,
                }}>
                  <Text style={{ fontSize: 12, color: '#6B7280' }}>Password Strength</Text>
                  <Text style={{
                    fontSize: 12,
                    fontWeight: '500',
                    color: passwordStrength.strength <= 2 ? '#EF4444' : 
                           passwordStrength.strength <= 3 ? '#EAB308' : '#22C55E'
                  }}>
                    {passwordStrength.label}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 4 }}>
                  {[1, 2, 3, 4, 5].map((level) => (
                    <View 
                      key={level}
                      style={{
                        flex: 1,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: level <= passwordStrength.strength 
                          ? passwordStrength.color 
                          : '#E5E7EB'
                      }}
                    />
                  ))}
                </View>
              </View>
            )}

            <AuthInput
              label="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirm your password"
              secureTextEntry
              error={errors.confirmPassword}
            />

            <TouchableOpacity
              style={{
                backgroundColor: loading ? '#9CA3AF' : '#9333ea',
                paddingVertical: 16,
                borderRadius: 16,
                marginTop: 20,
                shadowColor: loading ? '#9CA3AF' : '#9333ea',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 6,
              }}
              onPress={handleSignUp}
              disabled={loading}
              activeOpacity={0.8}
            >
              <Text style={{
                color: 'white',
                textAlign: 'center',
                fontSize: 18,
                fontWeight: '600',
              }}>
                {loading ? 'Creating your account...' : 'Start My Journey'}
              </Text>
            </TouchableOpacity>

            <Text style={{
              fontSize: 11,
              color: '#6B7280',
              textAlign: 'center',
              marginTop: 12,
              lineHeight: 16,
            }}>
              By creating an account, you agree to our Terms of Service and Privacy Policy
            </Text>
          </View>

          {/* Divider */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 20,
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

          {/* Login Button */}
          <TouchableOpacity
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              borderWidth: 1,
              borderColor: 'rgba(255, 255, 255, 0.3)',
              paddingVertical: 16,
              borderRadius: 16,
            }}
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.8}
          >
            <Text style={{
              color: 'white',
              textAlign: 'center',
              fontSize: 18,
              fontWeight: '600',
            }}>
              Continue Existing Journey
            </Text>
          </TouchableOpacity>

          <Text style={{
            color: 'rgba(255, 255, 255, 0.7)',
            textAlign: 'center',
            marginTop: 12,
            fontSize: 14,
          }}>
            Already reflecting daily? Sign in
          </Text>
        </View>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}