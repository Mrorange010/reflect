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

export default function LoginScreen() {
  const navigation = useNavigation<NavigationProp>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
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
      // Navigation will happen automatically based on onboarding status
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
    <View style={[styles.container, isDark && styles.containerDark]}>
      <StatusBar 
        barStyle={isDark ? "light-content" : "dark-content"} 
        backgroundColor="transparent" 
        translucent 
      />

      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView 
          style={styles.keyboardView} 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.content}>
            {/* Clean Header */}
            <View style={styles.header}>
              <View style={[styles.logoContainer, isDark && styles.logoContainerDark]}>
                <LinearGradient
                  colors={['#FF6B4D', '#FF7A59']}
                  style={styles.logoGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons name="leaf" size={32} color="#FFFFFF" />
                </LinearGradient>
              </View>
              
              <Text style={[styles.title, isDark && styles.titleDark]}>
                Welcome Back
              </Text>
              <Text style={[styles.subtitle, isDark && styles.subtitleDark]}>
                Continue your wellness journey
              </Text>
            </View>

            {/* Clean Form Card */}
            <View style={[styles.formCard, isDark && styles.formCardDark]}>
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
                style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={loading 
                    ? ['#9CA3AF', '#9CA3AF'] 
                    : ['#FF6B4D', '#FF7A59']
                  }
                  style={styles.primaryButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.primaryButtonText}>
                    {loading ? 'Signing In...' : 'Sign In'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.forgotButton}
                onPress={handleForgotPassword}
                activeOpacity={0.7}
              >
                <Text style={[styles.forgotButtonText, isDark && styles.forgotButtonTextDark]}>
                  Forgot Password?
                </Text>
              </TouchableOpacity>
            </View>

            {/* Clean Divider */}
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
              onPress={() => navigation.navigate('SignUp')}
              activeOpacity={0.8}
            >
              <Text style={[styles.secondaryButtonText, isDark && styles.secondaryButtonTextDark]}>
                Create Account
              </Text>
            </TouchableOpacity>

            <Text style={[styles.helpText, isDark && styles.helpTextDark]}>
              New to mindful reflection? Start your journey
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
    paddingVertical: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    marginBottom: 32,
    shadowColor: '#FF6B4D',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  logoContainerDark: {
    shadowColor: '#FF7A59',
  },
  logoGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  titleDark: {
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 17,
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
    borderRadius: 24,
    padding: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 12,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  formCardDark: {
    backgroundColor: '#1F2937',
    borderColor: '#374151',
    shadowColor: '#000',
  },
  primaryButton: {
    borderRadius: 16,
    marginTop: 28,
    shadowColor: '#FF6B4D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  primaryButtonDisabled: {
    shadowOpacity: 0.1,
  },
  primaryButtonGradient: {
    paddingVertical: 18,
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
  forgotButton: {
    marginTop: 20,
    paddingVertical: 12,
    alignItems: 'center',
  },
  forgotButtonText: {
    color: '#FF6B4D',
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 0.1,
  },
  forgotButtonTextDark: {
    color: '#FF7A59',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
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
    marginHorizontal: 20,
    color: '#9CA3AF',
    fontSize: 15,
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
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  secondaryButtonDark: {
    backgroundColor: '#374151',
    borderColor: '#4B5563',
  },
  secondaryButtonText: {
    color: '#374151',
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  secondaryButtonTextDark: {
    color: '#E5E7EB',
  },
  helpText: {
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 16,
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: 0.1,
  },
  helpTextDark: {
    color: '#6B7280',
  },
});