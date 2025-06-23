import { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet, useColorScheme, StatusBar, Animated } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AuthInput from '../../components/auth/AuthInput';
import { supabase } from '../../utils/supabase';
import { NavigationProp } from '../../navigation';

interface WizardStep {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  inputType: 'text' | 'age' | 'location' | 'gender';
  placeholder: string;
  field: string;
}

const WIZARD_STEPS: WizardStep[] = [
  {
    id: 'name',
    title: 'Welcome to Heyu',
    subtitle: "Hi! I'm Ava, your wellness companion.\nWhat should I call you?",
    icon: 'person-outline',
    inputType: 'text',
    placeholder: 'Enter your first name',
    field: 'name'
  },
  {
    id: 'age',
    title: 'Nice to meet you!',
    subtitle: 'How old are you? This helps me\npersonalize your experience.',
    icon: 'calendar-outline',
    inputType: 'age',
    placeholder: 'Enter your age',
    field: 'age'
  },
  {
    id: 'location',
    title: 'Almost there!',
    subtitle: 'Where are you located?\nThis helps with time zones and local context.',
    icon: 'location-outline',
    inputType: 'location',
    placeholder: 'City, Country',
    field: 'location'
  },
  {
    id: 'gender',
    title: 'Last question!',
    subtitle: 'How would you like me to address you?\n(Optional - helps with personalization)',
    icon: 'people-outline',
    inputType: 'gender',
    placeholder: 'e.g., she/her, he/him, they/them',
    field: 'pronouns'
  }
];

const GENDER_OPTIONS = [
  { label: 'She/Her', value: 'she/her', icon: 'female-outline' },
  { label: 'He/Him', value: 'he/him', icon: 'male-outline' },
  { label: 'They/Them', value: 'they/them', icon: 'people-outline' },
  { label: 'Prefer not to say', value: 'unspecified', icon: 'help-outline' },
];

export default function WelcomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    location: '',
    pronouns: ''
  });
  const [saving, setSaving] = useState(false);
  const [slideAnim] = useState(new Animated.Value(0));

  const currentStepData = WIZARD_STEPS[currentStep];
  const isLastStep = currentStep === WIZARD_STEPS.length - 1;
  const isFirstStep = currentStep === 0;

  const animateToNextStep = () => {
    Animated.sequence([
      Animated.timing(slideAnim, {
        toValue: -50,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleNext = async () => {
    const currentValue = formData[currentStepData.field as keyof typeof formData];
    
    // Validation
    if (currentStepData.id !== 'gender' && !currentValue.trim()) {
      Alert.alert('Required', `Please enter your ${currentStepData.field}`);
      return;
    }

    if (currentStepData.inputType === 'age') {
      const age = parseInt(currentValue);
      if (isNaN(age) || age < 13 || age > 120) {
        Alert.alert('Invalid Age', 'Please enter a valid age between 13 and 120');
        return;
      }
    }

    if (isLastStep) {
      await handleFinish();
    } else {
      animateToNextStep();
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (!isFirstStep) {
      animateToNextStep();
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleFinish = async () => {
    setSaving(true);
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('No user logged in');
      
      // Save to users table with all collected data
      await supabase.from('users').upsert({
        id: user.id,
        name: formData.name.trim(),
        email: user.email,
        age: formData.age ? parseInt(formData.age) : null,
        location: formData.location.trim() || null,
        pronouns: formData.pronouns.trim() || null,
      });
      
      navigation.navigate('Goals');
    } catch (e) {
      Alert.alert('Error', 'Failed to save your information. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleGenderSelect = (value: string) => {
    updateFormData('pronouns', value);
  };

  const renderInput = () => {
    const currentValue = formData[currentStepData.field as keyof typeof formData];

    if (currentStepData.inputType === 'gender') {
      return (
        <View style={styles.genderContainer}>
          {GENDER_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.genderOption,
                isDark && styles.genderOptionDark,
                currentValue === option.value && styles.genderOptionSelected
              ]}
              onPress={() => handleGenderSelect(option.value)}
              activeOpacity={0.7}
            >
              <Ionicons 
                name={option.icon as any} 
                size={20} 
                color={currentValue === option.value ? '#FFFFFF' : (isDark ? '#9CA3AF' : '#6B7280')}
              />
              <Text style={[
                styles.genderOptionText,
                currentValue === option.value && styles.genderOptionTextSelected,
                isDark && !currentValue && styles.genderOptionTextDark
              ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      );
    }

    return (
      <AuthInput
        label={currentStepData.title.includes('Welcome') ? 'Your Name' : 
               currentStepData.inputType === 'age' ? 'Age' :
               currentStepData.inputType === 'location' ? 'Location' : 'Pronouns'}
        value={currentValue}
        onChangeText={(value) => updateFormData(currentStepData.field, value)}
        placeholder={currentStepData.placeholder}
        autoCapitalize={currentStepData.inputType === 'text' || currentStepData.inputType === 'location' ? 'words' : 'none'}
        keyboardType={currentStepData.inputType === 'age' ? 'numeric' : 'default'}
        autoFocus
        returnKeyType={isLastStep ? 'done' : 'next'}
        onSubmitEditing={handleNext}
      />
    );
  };

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      <StatusBar 
        barStyle={isDark ? "light-content" : "dark-content"} 
        backgroundColor="transparent" 
        translucent 
      />
      
      {/* Clean Apple Health-style background gradient - Blue theme */}
      <LinearGradient
        colors={isDark 
          ? ['rgba(0, 122, 255, 0.15)', 'rgba(52, 199, 89, 0.08)', 'transparent'] as const
          : ['rgba(0, 122, 255, 0.12)', 'rgba(52, 199, 89, 0.06)', 'transparent'] as const
        }
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        locations={[0, 0.6, 1]}
      />

      <SafeAreaView style={styles.safeArea}>
        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, isDark && styles.progressBarDark]}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${((currentStep + 1) / WIZARD_STEPS.length) * 100}%` }
              ]} 
            />
          </View>
          <Text style={[styles.progressText, isDark && styles.progressTextDark]}>
            {currentStep + 1} of {WIZARD_STEPS.length}
          </Text>
        </View>

        <Animated.View 
          style={[
            styles.content,
            { transform: [{ translateY: slideAnim }] }
          ]}
        >
          {/* Header with Dynamic Icon */}
          <View style={styles.header}>
            <View style={[styles.iconContainer, isDark && styles.iconContainerDark]}>
              <LinearGradient
                colors={['#007AFF', '#34C759']}
                style={styles.iconGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name={currentStepData.icon as any} size={32} color="#FFFFFF" />
              </LinearGradient>
            </View>
            
            <Text style={[styles.title, isDark && styles.titleDark]}>
              {currentStepData.title}
            </Text>
            
            <Text style={[styles.subtitle, isDark && styles.subtitleDark]}>
              {currentStepData.subtitle}
            </Text>
          </View>

          {/* Form Card */}
          <View style={[styles.formCard, isDark && styles.formCardDark]}>
            {renderInput()}

            {/* Navigation Buttons */}
            <View style={styles.buttonContainer}>
              {!isFirstStep && (
                <TouchableOpacity
                  style={[styles.secondaryButton, isDark && styles.secondaryButtonDark]}
                  onPress={handleBack}
                  activeOpacity={0.7}
                >
                  <Ionicons name="arrow-back" size={20} color={isDark ? '#9CA3AF' : '#6B7280'} />
                  <Text style={[styles.secondaryButtonText, isDark && styles.secondaryButtonTextDark]}>
                    Back
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[
                  styles.primaryButton, 
                  saving && styles.primaryButtonDisabled,
                  isFirstStep && styles.primaryButtonFullWidth
                ]}
                onPress={handleNext}
                disabled={saving}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={saving 
                    ? ['#9CA3AF', '#9CA3AF'] 
                    : ['#007AFF', '#34C759']
                  }
                  style={styles.primaryButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.primaryButtonText}>
                    {saving ? 'Saving...' : isLastStep ? 'Get Started' : 'Continue'}
                  </Text>
                  <Ionicons 
                    name={isLastStep ? "checkmark" : "arrow-forward"} 
                    size={20} 
                    color="#FFFFFF" 
                    style={styles.buttonIcon}
                  />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>

          {/* Motivational Footer */}
          {isLastStep && (
            <View style={styles.footerContainer}>
              <Text style={[styles.footerText, isDark && styles.footerTextDark]}>
                "The unexamined life is not worth living" - Socrates
              </Text>
            </View>
          )}
        </Animated.View>
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
  progressContainer: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 10,
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressBarDark: {
    backgroundColor: '#374151',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  progressTextDark: {
    color: '#6B7280',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    paddingVertical: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 24,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  iconContainerDark: {
    shadowColor: '#34C759',
  },
  iconGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
    letterSpacing: -0.3,
    textAlign: 'center',
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
    lineHeight: 24,
    paddingHorizontal: 8,
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
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 10,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  formCardDark: {
    backgroundColor: '#1F2937',
    borderColor: '#374151',
  },
  genderContainer: {
    gap: 12,
    marginBottom: 20,
  },
  genderOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  genderOptionDark: {
    backgroundColor: '#374151',
    borderColor: '#4B5563',
  },
  genderOptionSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  genderOptionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginLeft: 12,
    letterSpacing: 0.1,
  },
  genderOptionTextSelected: {
    color: '#FFFFFF',
  },
  genderOptionTextDark: {
    color: '#FFFFFF',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  secondaryButtonDark: {
    backgroundColor: '#374151',
    borderColor: '#4B5563',
  },
  secondaryButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    letterSpacing: 0.1,
  },
  secondaryButtonTextDark: {
    color: '#9CA3AF',
  },
  primaryButton: {
    flex: 2,
    borderRadius: 14,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  primaryButtonFullWidth: {
    flex: 1,
  },
  primaryButtonDisabled: {
    shadowOpacity: 0.1,
  },
  primaryButtonGradient: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  buttonIcon: {
    marginLeft: 8,
  },
  footerContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  footerText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    fontWeight: '500',
    fontStyle: 'italic',
    letterSpacing: 0.1,
    lineHeight: 20,
  },
  footerTextDark: {
    color: '#6B7280',
  },
});