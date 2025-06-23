import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet, useColorScheme, StatusBar, ScrollView, Animated, Modal } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../utils/supabase';
import { NavigationProp } from '../../navigation';

const DAYS = [
  { id: 'Sunday', short: 'Sun' },
  { id: 'Monday', short: 'Mon' },
  { id: 'Tuesday', short: 'Tue' },
  { id: 'Wednesday', short: 'Wed' },
  { id: 'Thursday', short: 'Thu' },
  { id: 'Friday', short: 'Fri' },
  { id: 'Saturday', short: 'Sat' },
];



const WORK_WEEK_PRESETS = [
  { label: 'Western (Mon-Fri)', start: 'Monday', end: 'Friday', icon: 'business-outline' },
  { label: 'Middle East (Sun-Thu)', start: 'Sunday', end: 'Thursday', icon: 'globe-outline' },
  { label: 'Custom Schedule', start: null, end: null, icon: 'settings-outline' },
];

interface WizardStep {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  description: string;
}

const WIZARD_STEPS: WizardStep[] = [
  {
    id: 'work_week',
    title: 'Your Work Week',
    subtitle: 'When does your work week typically run?\nWe\'ll call you twice weekly.',
    icon: 'briefcase-outline',
    description: 'Select your work week structure'
  },
  {
    id: 'custom_days',
    title: 'Custom Work Week',
    subtitle: 'Select your work week start and end days.\nWe\'ll call you on these two days.',
    icon: 'calendar-outline',
    description: 'Choose your work week boundaries'
  },
  {
    id: 'call_times',
    title: 'Call Times',
    subtitle: 'When would you like Ava to call you\non your work week days?',
    icon: 'time-outline',
    description: 'Set your reflection call times'
  }
];

export default function TimePreferenceScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<any>();
  const { goals } = route.params || {};
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const [currentStep, setCurrentStep] = useState(0);
  const [workWeekStart, setWorkWeekStart] = useState<string>('Monday');
  const [workWeekEnd, setWorkWeekEnd] = useState<string>('Friday');
  const [selectedPreset, setSelectedPreset] = useState<string>('Western (Mon-Fri)');
  const [startHour, setStartHour] = useState(9);
  const [startMinute, setStartMinute] = useState(0);
  const [startPeriod, setStartPeriod] = useState<'AM' | 'PM'>('AM');
  const [endHour, setEndHour] = useState(5);
  const [endMinute, setEndMinute] = useState(0);
  const [endPeriod, setEndPeriod] = useState<'AM' | 'PM'>('PM');
  
  // Modal states for dropdowns
  const [showHourModal, setShowHourModal] = useState<'start' | 'end' | null>(null);
  const [showMinuteModal, setShowMinuteModal] = useState<'start' | 'end' | null>(null);
  
  // Refs for auto-scrolling modals
  const hourScrollViewRef = React.useRef<ScrollView>(null);
  const minuteScrollViewRef = React.useRef<ScrollView>(null);
  const [saving, setSaving] = useState(false);
  const [slideAnim] = useState(new Animated.Value(0));

  const currentStepData = WIZARD_STEPS[currentStep];
  const isLastStep = currentStep === WIZARD_STEPS.length - 1;
  const isFirstStep = currentStep === 0;

  // Helper function to format time for display
  const formatTime = (hour: number, minute: number, period: 'AM' | 'PM') => {
    const displayHour = hour === 0 ? 12 : hour;
    const displayMinute = minute.toString().padStart(2, '0');
    return `${displayHour}:${displayMinute} ${period}`;
  };

  // Helper function to format time for storage (24-hour format)
  const formatTimeForStorage = (hour: number, minute: number, period: 'AM' | 'PM') => {
    let hour24 = hour;
    if (period === 'AM' && hour === 12) hour24 = 0;
    if (period === 'PM' && hour !== 12) hour24 = hour + 12;
    return `${hour24.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  };

  // Generate hour options (1-12)
  const hourOptions = Array.from({ length: 12 }, (_, i) => i + 1);
  
  // Generate minute options (0, 15, 30, 45)
  const minuteOptions = [0, 15, 30, 45];

  // Auto-scroll effects for modals
  React.useEffect(() => {
    if (showHourModal && hourScrollViewRef.current) {
      const selectedValue = showHourModal === 'start' ? startHour : endHour;
      const selectedIndex = hourOptions.findIndex(option => option === selectedValue);
      if (selectedIndex > -1) {
        setTimeout(() => {
          hourScrollViewRef.current?.scrollTo({
            y: selectedIndex * 56,
            animated: true
          });
        }, 100);
      }
    }
  }, [showHourModal, startHour, endHour]);

  React.useEffect(() => {
    if (showMinuteModal && minuteScrollViewRef.current) {
      const selectedValue = showMinuteModal === 'start' ? startMinute : endMinute;
      const selectedIndex = minuteOptions.findIndex(option => option === selectedValue);
      if (selectedIndex > -1) {
        setTimeout(() => {
          minuteScrollViewRef.current?.scrollTo({
            y: selectedIndex * 56,
            animated: true
          });
        }, 100);
      }
    }
  }, [showMinuteModal, startMinute, endMinute]);

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

  const handlePresetSelect = (preset: any) => {
    setSelectedPreset(preset.label);
    if (preset.start && preset.end) {
      setWorkWeekStart(preset.start);
      setWorkWeekEnd(preset.end);
    }
  };

  const handleCustomDaySelect = (day: string, isStart: boolean) => {
    if (isStart) {
      setWorkWeekStart(day);
    } else {
      setWorkWeekEnd(day);
    }
  };

  const handleNext = async () => {
    if (isLastStep || currentStepData.id === 'call_times') {
      await handleFinish();
    } else {
      // Skip custom days step if not using custom preset
      if (currentStepData.id === 'work_week' && selectedPreset !== 'Custom Schedule') {
        animateToNextStep();
        setCurrentStep(prev => prev + 2); // Skip custom_days step
      } else {
        animateToNextStep();
        setCurrentStep(prev => prev + 1);
      }
    }
  };

  const handleBack = () => {
    if (!isFirstStep) {
      // Skip custom days step if going back and not using custom preset
      if (currentStepData.id === 'call_times' && selectedPreset !== 'Custom Schedule') {
        animateToNextStep();
        setCurrentStep(prev => prev - 2); // Skip back over custom_days step
      } else {
        animateToNextStep();
        setCurrentStep(prev => prev - 1);
      }
    }
  };

  const handleFinish = async () => {
    setSaving(true);
    try {
      // For now, skip database save and go directly to dashboard
      console.log('Onboarding completed with settings:', {
        workWeekStart,
        workWeekEnd,
        startDayCallTime: formatTimeForStorage(startHour, startMinute, startPeriod),
        endDayCallTime: formatTimeForStorage(endHour, endMinute, endPeriod),
        selectedPreset,
        goals
      });
      
      // Navigate to dashboard (the navigation system will handle this automatically
      // since we're not updating the database, but we can simulate completion)
      await new Promise(resolve => setTimeout(resolve, 1000)); // Small delay for UX
      
      // You can add any local storage or other logic here if needed
      
    } catch (e) {
      console.error('Error:', e);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setSaving(false);
      // Force navigation to dashboard by reloading or other method if needed
      // For now, the app should handle this automatically
    }
  };

  const renderWorkWeekStep = () => (
    <View style={styles.stepContent}>
      <Text style={[styles.stepDescription, isDark && styles.stepDescriptionDark]}>
        Choose your work week structure:
      </Text>
      
      <View style={styles.presetsContainer}>
        {WORK_WEEK_PRESETS.map((preset) => {
          const isSelected = selectedPreset === preset.label;
          
          return (
            <TouchableOpacity
              key={preset.label}
              style={[
                styles.presetCard,
                isDark && styles.presetCardDark,
                isSelected && styles.presetCardSelected,
                isSelected && isDark && styles.presetCardSelectedDark
              ]}
              onPress={() => handlePresetSelect(preset)}
              activeOpacity={0.8}
            >
              <View style={styles.presetHeader}>
                <Ionicons 
                  name={preset.icon as any} 
                  size={24} 
                  color={isSelected ? '#FFFFFF' : (isDark ? '#9CA3AF' : '#6B7280')}
                />
                <Text style={[
                  styles.presetTitle,
                  isSelected && styles.presetTitleSelected,
                  isDark && !isSelected && styles.presetTitleDark
                ]}>
                  {preset.label}
                </Text>
              </View>
              
              {preset.start && (
                <Text style={[
                  styles.presetDescription,
                  isSelected && styles.presetDescriptionSelected,
                  isDark && !isSelected && styles.presetDescriptionDark
                ]}>
                  Calls on {preset.start} and {preset.end}
                </Text>
              )}
              
              {preset.label === 'Custom Schedule' && (
                <Text style={[
                  styles.presetDescription,
                  isSelected && styles.presetDescriptionSelected,
                  isDark && !isSelected && styles.presetDescriptionDark
                ]}>
                  Choose your own start and end days
                </Text>
              )}
              
              {isSelected && (
                <View style={styles.checkmarkContainer}>
                  <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  const renderCustomDaysStep = () => (
    <View style={styles.stepContent}>
      <Text style={[styles.stepDescription, isDark && styles.stepDescriptionDark]}>
        Choose your work week start and end days:
      </Text>
      
      <View style={styles.customWorkWeekContainer}>
        {/* Start Day Selection */}
        <View style={styles.daySelectionSection}>
          <Text style={[styles.daySelectionTitle, isDark && styles.daySelectionTitleDark]}>
            Work Week Starts On:
          </Text>
          <View style={styles.dayButtonsContainer}>
            {DAYS.map((day) => (
              <TouchableOpacity
                key={`start-${day.id}`}
                style={[
                  styles.dayButton,
                  isDark && styles.dayButtonDark,
                  workWeekStart === day.id && styles.dayButtonSelected
                ]}
                onPress={() => handleCustomDaySelect(day.id, true)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.dayButtonText,
                  workWeekStart === day.id && styles.dayButtonTextSelected,
                  isDark && workWeekStart !== day.id && styles.dayButtonTextDark
                ]}>
                  {day.short}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* End Day Selection */}
        <View style={styles.daySelectionSection}>
          <Text style={[styles.daySelectionTitle, isDark && styles.daySelectionTitleDark]}>
            Work Week Ends On:
          </Text>
          <View style={styles.dayButtonsContainer}>
            {DAYS.map((day) => (
              <TouchableOpacity
                key={`end-${day.id}`}
                style={[
                  styles.dayButton,
                  isDark && styles.dayButtonDark,
                  workWeekEnd === day.id && styles.dayButtonSelected
                ]}
                onPress={() => handleCustomDaySelect(day.id, false)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.dayButtonText,
                  workWeekEnd === day.id && styles.dayButtonTextSelected,
                  isDark && workWeekEnd !== day.id && styles.dayButtonTextDark
                ]}>
                  {day.short}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      <View style={[styles.customDaySummary, isDark && styles.customDaySummaryDark]}>
        <Ionicons 
          name="information-circle-outline" 
          size={16} 
          color={isDark ? '#9CA3AF' : '#6B7280'} 
        />
        <Text style={[styles.customDaySummaryText, isDark && styles.customDaySummaryTextDark]}>
          You'll get reflection calls on {workWeekStart} and {workWeekEnd}
        </Text>
      </View>
    </View>
  );

  const renderDropdownModal = (
    visible: boolean,
    onClose: () => void,
    options: number[],
    selectedValue: number,
    onSelect: (value: number) => void,
    title: string,
    formatValue: (value: number) => string = (v) => v.toString().padStart(2, '0'),
    isHourModal: boolean = false
  ) => (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.modalOverlay} 
        activeOpacity={1} 
        onPress={onClose}
      >
        <TouchableOpacity 
          style={[styles.dropdownModal, isDark && styles.dropdownModalDark]}
          activeOpacity={1}
          onPress={() => {}} // Prevent background close when tapping modal
        >
          <Text style={[styles.modalTitle, isDark && styles.modalTitleDark]}>
            {title}
          </Text>
          <ScrollView 
            ref={isHourModal ? hourScrollViewRef : minuteScrollViewRef}
            style={styles.optionsList} 
            showsVerticalScrollIndicator={false}
          >
            {options.map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.optionItem,
                  option === selectedValue && styles.optionItemSelected,
                  isDark && styles.optionItemDark,
                  option === selectedValue && isDark && styles.optionItemSelectedDark
                ]}
                onPress={() => {
                  console.log('Selected:', option);
                  onSelect(option);
                  onClose();
                }}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.optionText,
                  option === selectedValue && styles.optionTextSelected,
                  isDark && styles.optionTextDark,
                  option === selectedValue && isDark && styles.optionTextSelectedDark
                ]}>
                  {formatValue(option)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );

  const renderTimeDropdowns = (
    hour: number, 
    minute: number, 
    period: 'AM' | 'PM',
    onHourChange: (hour: number) => void,
    onMinuteChange: (minute: number) => void,
    onPeriodChange: (period: 'AM' | 'PM') => void,
    isStart: boolean
  ) => (
    <View style={styles.timeDropdownsContainer}>
      {/* Hour Dropdown */}
      <TouchableOpacity 
        style={[styles.timeDropdown, isDark && styles.timeDropdownDark]}
        onPress={() => setShowHourModal(isStart ? 'start' : 'end')}
      >
        <Text style={[styles.timeDropdownText, isDark && styles.timeDropdownTextDark]}>
          {hour.toString().padStart(2, '0')}
        </Text>
        <Ionicons name="chevron-down-outline" size={16} color="#007AFF" />
      </TouchableOpacity>

      <Text style={[styles.timeSeparator, isDark && styles.timeSeparatorDark]}>:</Text>

      {/* Minute Dropdown */}
      <TouchableOpacity 
        style={[styles.timeDropdown, isDark && styles.timeDropdownDark]}
        onPress={() => setShowMinuteModal(isStart ? 'start' : 'end')}
      >
        <Text style={[styles.timeDropdownText, isDark && styles.timeDropdownTextDark]}>
          {minute.toString().padStart(2, '0')}
        </Text>
        <Ionicons name="chevron-down-outline" size={16} color="#007AFF" />
      </TouchableOpacity>

      {/* AM/PM Toggle Buttons */}
      <View style={styles.periodToggleContainer}>
        <TouchableOpacity 
          style={[
            styles.periodButton, 
            period === 'AM' && styles.periodButtonActive,
            isDark && styles.periodButtonDark,
            period === 'AM' && isDark && styles.periodButtonActiveDark
          ]}
          onPress={() => onPeriodChange('AM')}
        >
          <Text style={[
            styles.periodButtonText,
            period === 'AM' && styles.periodButtonTextActive,
            isDark && styles.periodButtonTextDark,
            period === 'AM' && isDark && styles.periodButtonTextActiveDark
          ]}>
            AM
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.periodButton, 
            period === 'PM' && styles.periodButtonActive,
            isDark && styles.periodButtonDark,
            period === 'PM' && isDark && styles.periodButtonActiveDark
          ]}
          onPress={() => onPeriodChange('PM')}
        >
          <Text style={[
            styles.periodButtonText,
            period === 'PM' && styles.periodButtonTextActive,
            isDark && styles.periodButtonTextDark,
            period === 'PM' && isDark && styles.periodButtonTextActiveDark
          ]}>
            PM
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderCallTimesStep = () => (
    <View style={styles.stepContent}>
      <Text style={[styles.stepDescription, isDark && styles.stepDescriptionDark]}>
        Choose your preferred call times:
      </Text>
      
      <View style={styles.callTimesContainer}>
        {/* Start Day Call Time */}
        <View style={styles.callTimeSection}>
          <Text style={[styles.callTimeTitle, isDark && styles.callTimeTitleDark]}>
            {workWeekStart} (Week Start) Call Time:
          </Text>
          
          {renderTimeDropdowns(
            startHour,
            startMinute,
            startPeriod,
            setStartHour,
            setStartMinute,
            setStartPeriod,
            true
          )}
        </View>

        {/* End Day Call Time */}
        <View style={styles.callTimeSection}>
          <Text style={[styles.callTimeTitle, isDark && styles.callTimeTitleDark]}>
            {workWeekEnd} (Week End) Call Time:
          </Text>
          
          {renderTimeDropdowns(
            endHour,
            endMinute,
            endPeriod,
            setEndHour,
            setEndMinute,
            setEndPeriod,
            false
          )}
        </View>
      </View>

      {/* Hour Dropdown Modals */}
      {renderDropdownModal(
        showHourModal === 'start',
        () => setShowHourModal(null),
        hourOptions,
        startHour,
        setStartHour,
        'Select Hour',
        (v) => v.toString().padStart(2, '0'),
        true
      )}
      
      {renderDropdownModal(
        showHourModal === 'end',
        () => setShowHourModal(null),
        hourOptions,
        endHour,
        setEndHour,
        'Select Hour',
        (v) => v.toString().padStart(2, '0'),
        true
      )}

      {/* Minute Dropdown Modals */}
      {renderDropdownModal(
        showMinuteModal === 'start',
        () => setShowMinuteModal(null),
        minuteOptions,
        startMinute,
        setStartMinute,
        'Select Minutes',
        (v) => v.toString().padStart(2, '0'),
        false
      )}
      
      {renderDropdownModal(
        showMinuteModal === 'end',
        () => setShowMinuteModal(null),
        minuteOptions,
        endMinute,
        setEndMinute,
        'Select Minutes',
        (v) => v.toString().padStart(2, '0'),
        false
      )}
    </View>
  );



  const renderStepContent = () => {
    switch (currentStepData.id) {
      case 'work_week':
        return renderWorkWeekStep();
      case 'custom_days':
        return renderCustomDaysStep();
      case 'call_times':
        return renderCallTimesStep();
      default:
        return null;
    }
  };

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      <StatusBar 
        barStyle={isDark ? "light-content" : "dark-content"} 
        backgroundColor="transparent" 
        translucent 
      />
      
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

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View 
            style={[
              styles.content,
              { transform: [{ translateY: slideAnim }] }
            ]}
          >
            {/* Header */}
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

            {/* Step Content */}
            {renderStepContent()}

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
                    {saving ? 'Completing Setup...' : 
                     (isLastStep || currentStepData.id === 'call_times') ? 'Get Started' : 'Continue'}
                  </Text>
                  <Ionicons 
                    name={(isLastStep || currentStepData.id === 'call_times') ? "checkmark" : "arrow-forward"} 
                    size={20} 
                    color="#FFFFFF" 
                    style={styles.buttonIcon}
                  />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
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
  stepContent: {
    marginBottom: 32,
  },
  stepDescription: {
    fontSize: 15,
    color: '#6B7280',
    marginBottom: 24,
    lineHeight: 22,
    fontWeight: '500',
    textAlign: 'center',
  },
  stepDescriptionDark: {
    color: '#9CA3AF',
  },
  presetsContainer: {
    gap: 12,
  },
  presetCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    position: 'relative',
  },
  presetCardDark: {
    backgroundColor: '#1F2937',
    borderColor: '#374151',
  },
  presetCardSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
    shadowColor: '#007AFF',
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  presetCardSelectedDark: {
    shadowColor: '#007AFF',
  },
  presetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  presetTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 12,
    letterSpacing: 0.1,
  },
  presetTitleSelected: {
    color: '#FFFFFF',
  },
  presetTitleDark: {
    color: '#FFFFFF',
  },
  presetDescription: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
    marginLeft: 36,
  },
  presetDescriptionSelected: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  presetDescriptionDark: {
    color: '#9CA3AF',
  },
  checkmarkContainer: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customWorkWeekContainer: {
    gap: 24,
  },
  daySelectionSection: {
    marginBottom: 16,
  },
  daySelectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
    letterSpacing: 0.1,
  },
  daySelectionTitleDark: {
    color: '#FFFFFF',
  },
  dayButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dayButton: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minWidth: 50,
    alignItems: 'center',
  },
  dayButtonDark: {
    backgroundColor: '#374151',
    borderColor: '#4B5563',
  },
  dayButtonSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  dayButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    letterSpacing: 0.1,
  },
  dayButtonTextSelected: {
    color: '#FFFFFF',
  },
  dayButtonTextDark: {
    color: '#9CA3AF',
  },
  callTimesContainer: {
    gap: 24,
  },
  callTimeSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  callTimeSectionDark: {
    backgroundColor: '#1F2937',
    borderColor: '#374151',
  },
  callTimeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
    letterSpacing: 0.1,
  },
  callTimeTitleDark: {
    color: '#FFFFFF',
  },
  timeSlotContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  timeSlot: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  timeSlotDark: {
    backgroundColor: '#374151',
    borderColor: '#4B5563',
  },
  timeSlotSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  timeSlotText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 4,
    letterSpacing: 0.1,
  },
  timeSlotTextSelected: {
    color: '#FFFFFF',
  },
  timeSlotTextDark: {
    color: '#9CA3AF',
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 16,
  },
  summaryCardDark: {
    backgroundColor: '#1F2937',
    borderColor: '#374151',
  },
  summarySection: {
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
    letterSpacing: 0.1,
  },
  summaryTitleDark: {
    color: '#FFFFFF',
  },
  summaryValue: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
    marginBottom: 4,
  },
  summaryValueDark: {
    color: '#60A5FA',
  },
  summarySubValue: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  summarySubValueDark: {
    color: '#9CA3AF',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 16,
  },
  scheduleOverview: {
    flexDirection: 'row',
    gap: 24,
  },
  scheduleItem: {
    alignItems: 'center',
    flex: 1,
  },
  scheduleDay: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
    letterSpacing: 0.1,
  },
  scheduleDayDark: {
    color: '#FFFFFF',
  },
  scheduleTime: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
    marginBottom: 2,
  },
  scheduleTimeDark: {
    color: '#60A5FA',
  },
  scheduleLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  scheduleLabelDark: {
    color: '#6B7280',
  },
  reminderCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  reminderCardDark: {
    backgroundColor: '#374151',
    borderColor: '#4B5563',
  },
  reminderText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 12,
    flex: 1,
    fontWeight: '500',
    lineHeight: 20,
  },
  reminderTextDark: {
    color: '#9CA3AF',
  },
  customDaySummary: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  customDaySummaryDark: {
    backgroundColor: '#374151',
    borderColor: '#4B5563',
  },
  customDaySummaryText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
    marginLeft: 8,
    letterSpacing: 0.1,
  },
  customDaySummaryTextDark: {
    color: '#60A5FA',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
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

  timeDropdownsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 12,
    justifyContent: 'center',
  },
  timeDropdown: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minWidth: 60,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  timeDropdownDark: {
    backgroundColor: '#374151',
    borderColor: '#4B5563',
  },
  timeDropdownText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginRight: 8,
  },
  timeDropdownTextDark: {
    color: '#FFFFFF',
  },
  timeSeparator: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginHorizontal: 4,
  },
  timeSeparatorDark: {
    color: '#9CA3AF',
  },
  periodToggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    padding: 2,
    marginLeft: 8,
  },
  periodButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    minWidth: 36,
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: '#007AFF',
  },
  periodButtonDark: {
    backgroundColor: 'transparent',
  },
  periodButtonActiveDark: {
    backgroundColor: '#007AFF',
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  periodButtonTextActive: {
    color: '#FFFFFF',
  },
  periodButtonTextDark: {
    color: '#9CA3AF',
  },
  periodButtonTextActiveDark: {
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  dropdownModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingTop: 20,
    paddingHorizontal: 24,
    paddingBottom: 10,
    width: 280,
    maxHeight: 320,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  dropdownModalDark: {
    backgroundColor: '#1F2937',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: 0.1,
  },
  modalTitleDark: {
    color: '#FFFFFF',
  },
  optionsList: {
    maxHeight: 200,
  },
  optionItem: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 6,
    backgroundColor: 'transparent',
    minHeight: 56,
    justifyContent: 'center',
  },
  optionItemSelected: {
    backgroundColor: '#007AFF',
  },
  optionItemDark: {
    backgroundColor: 'transparent',
  },
  optionItemSelectedDark: {
    backgroundColor: '#007AFF',
  },
  optionText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#1F2937',
    textAlign: 'center',
  },
  optionTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  optionTextDark: {
    color: '#FFFFFF',
  },
  optionTextSelectedDark: {
    color: '#FFFFFF',
  },
});