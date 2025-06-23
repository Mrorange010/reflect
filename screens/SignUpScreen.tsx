import { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, StyleSheet, useColorScheme, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AuthInput from '../components/auth/AuthInput';
import { supabase } from '../utils/supabase';
import { NavigationProp } from '../navigation';
import { AuthError } from '@supabase/supabase-js';

export default function SignUpScreen() {
  const navigation = useNavigation<NavigationProp>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
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
      const { data: { user }, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (user) {
        // Create user record with proper defaults
        await supabase
          .from('users')
          .insert([
            { 
              id: user.id, 
              email,
              name: null,
              avatar_url: null,
              first_name: null,
              goals: null,
              call_time_preference: null,
              streak: 0,
              longest_streak: 0,
              last_logged_date: null
            }
          ]);
        
        // Create user_settings record to track onboarding
        await supabase
          .from('user_settings')
          .insert([
            { 
              user_id: user.id, 
              goals: null,
              call_time: null,
              onboarding_complete: false 
            }
          ]);
      }

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
    <View style={[styles.container, isDark && styles.containerDark]}>
      <StatusBar 
        barStyle={isDark ? "light-content" : "dark-content"} 
        backgroundColor="transparent" 
        translucent 
      />
      
      {/* Subtle Apple Health-style background gradient - Green theme */}
      <LinearGradient
        colors={isDark 
          ? ['rgba(52, 199, 89, 0.12)', 'rgba(0, 122, 255, 0.06)', 'transparent'] as const
          : ['rgba(52, 199, 89, 0.08)', 'rgba(0, 122, 255, 0.04)', 'transparent'] as const
        }
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        locations={[0, 0.6, 1]}
      />

      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView 
          style={styles.keyboardView} 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.content}>
            {/* Compact Header */}
            <View style={styles.header}>
              <View style={[styles.logoContainer, isDark && styles.logoContainerDark]}>
                <LinearGradient
                  colors={['#34C759', '#007AFF']}
                  style={styles.logoGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons name="leaf" size={28} color="#FFFFFF" />
                </LinearGradient>
              </View>
              
              <Text style={[styles.title, isDark && styles.titleDark]}>
                Begin Your Journey
              </Text>
              <Text style={[styles.subtitle, isDark && styles.subtitleDark]}>
                Start building mindful habits
              </Text>
            </View>

            {/* Compact Form Card */}
            <View style={[styles.formCard, isDark && styles.formCardDark]}>
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

              {/* Compact Password Strength Indicator */}
              {passwordStrength && (
                <View style={styles.passwordStrengthContainer}>
                  <View style={styles.passwordStrengthHeader}>
                    <Text style={[styles.passwordStrengthLabel, isDark && styles.passwordStrengthLabelDark]}>
                      Password Strength
                    </Text>
                    <Text style={[
                      styles.passwordStrengthText,
                      { color: passwordStrength.strength <= 2 ? '#EF4444' : 
                               passwordStrength.strength <= 3 ? '#EAB308' : '#22C55E' }
                    ]}>
                      {passwordStrength.label}
                    </Text>
                  </View>
                  <View style={styles.passwordStrengthBars}>
                    {[1, 2, 3, 4, 5].map((level) => (
                      <View 
                        key={level}
                        style={[
                          styles.passwordStrengthBar,
                          {
                            backgroundColor: level <= passwordStrength.strength 
                              ? passwordStrength.color 
                              : isDark ? '#374151' : '#E5E7EB'
                          }
                        ]}
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
                style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
                onPress={handleSignUp}
                disabled={loading}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={loading 
                    ? ['#9CA3AF', '#9CA3AF'] 
                    : ['#34C759', '#007AFF']
                  }
                  style={styles.primaryButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.primaryButtonText}>
                    {loading ? 'Creating Account...' : 'Create Account'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              <Text style={[styles.termsText, isDark && styles.termsTextDark]}>
                By creating an account, you agree to our Terms of Service and Privacy Policy
              </Text>
            </View>

            {/* Compact Divider */}
            <View style={styles.dividerContainer}>
              <View style={[styles.dividerLine, isDark && styles.dividerLineDark]} />
              <Text style={[styles.dividerText, isDark && styles.dividerTextDark]}>
                or
              </Text>
              <View style={[styles.dividerLine, isDark && styles.dividerLineDark]} />
            </View>

            {/* Secondary Button */}
            <TouchableOpacity
              style={[styles.secondaryButton, isDark && styles.secondaryButtonDark]}
              onPress={() => navigation.navigate('Login')}
              activeOpacity={0.8}
            >
              <Text style={[styles.secondaryButtonText, isDark && styles.secondaryButtonTextDark]}>
                Sign In
              </Text>
            </TouchableOpacity>

            <Text style={[styles.helpText, isDark && styles.helpTextDark]}>
              Already reflecting daily? Continue your journey
            </Text>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  containerDark: {
    backgroundColor: '#000000',
  },
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    paddingVertical: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginBottom: 24,
    shadowColor: '#34C759',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  logoContainerDark: {
    shadowColor: '#007AFF',
  },
  logoGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  titleDark: {
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    fontWeight: '500',
    letterSpacing: 0.1,
  },
  subtitleDark: {
    color: '#9CA3AF',
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  formCardDark: {
    backgroundColor: '#1F2937',
    borderColor: '#374151',
    shadowColor: '#000',
  },
  passwordStrengthContainer: {
    marginBottom: 16,
  },
  passwordStrengthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  passwordStrengthLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  passwordStrengthLabelDark: {
    color: '#9CA3AF',
  },
  passwordStrengthText: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  passwordStrengthBars: {
    flexDirection: 'row',
    gap: 4,
  },
  passwordStrengthBar: {
    flex: 1,
    height: 6,
    borderRadius: 3,
  },
  primaryButton: {
    borderRadius: 16,
    marginTop: 20,
    shadowColor: '#34C759',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  primaryButtonDisabled: {
    shadowOpacity: 0.1,
  },
  primaryButtonGradient: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  termsText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 14,
    lineHeight: 16,
    fontWeight: '500',
  },
  termsTextDark: {
    color: '#6B7280',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerLineDark: {
    backgroundColor: '#374151',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  dividerTextDark: {
    color: '#6B7280',
  },
  secondaryButton: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  secondaryButtonDark: {
    backgroundColor: '#374151',
    borderColor: '#4B5563',
  },
  secondaryButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  secondaryButtonTextDark: {
    color: '#E5E7EB',
  },
  helpText: {
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 12,
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.1,
  },
  helpTextDark: {
    color: '#6B7280',
  },
});