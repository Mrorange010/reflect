import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useColorScheme, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NavigationProp } from '../../navigation';

const GOALS = [
  { id: 'Reflection', icon: 'bulb-outline', description: 'Deep thinking and self-awareness' },
  { id: 'Gratitude', icon: 'heart-outline', description: 'Appreciation and mindfulness' },
  { id: 'Productivity', icon: 'trending-up-outline', description: 'Focus and achievement' },
  { id: 'Therapy-lite', icon: 'chatbubble-outline', description: 'Emotional processing and support' },
];

export default function GoalsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);

  const toggleGoal = (goalId: string) => {
    setSelectedGoals((prev) =>
      prev.includes(goalId) ? prev.filter((g) => g !== goalId) : [...prev, goalId]
    );
  };

  const renderGoalCard = (goal: any) => {
    const isSelected = selectedGoals.includes(goal.id);
    
    return (
      <TouchableOpacity
        key={goal.id}
        style={[
          styles.goalCard,
          isDark && styles.goalCardDark,
          isSelected && styles.goalCardSelected,
          isSelected && isDark && styles.goalCardSelectedDark
        ]}
        onPress={() => toggleGoal(goal.id)}
        activeOpacity={0.8}
      >
        {/* Clean icon container */}
        <View style={[
          styles.goalIconContainer,
          isSelected && styles.goalIconContainerSelected
        ]}>
          <Ionicons 
            name={goal.icon as any} 
            size={28} 
            color={isSelected ? '#FFFFFF' : (isDark ? '#9CA3AF' : '#6B7280')}
          />
        </View>
        
        <Text style={[
          styles.goalTitle,
          isSelected && styles.goalTitleSelected,
          isDark && !isSelected && styles.goalTitleDark
        ]}>
          {goal.id}
        </Text>
        <Text style={[
          styles.goalDescription,
          isSelected && styles.goalDescriptionSelected,
          isDark && !isSelected && styles.goalDescriptionDark
        ]}>
          {goal.description}
        </Text>
        
        {isSelected && (
          <View style={styles.checkmarkContainer}>
            <Ionicons name="checkmark" size={16} color="#FFFFFF" />
          </View>
        )}
      </TouchableOpacity>
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
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.iconContainer, isDark && styles.iconContainerDark]}>
              <LinearGradient
                colors={['#007AFF', '#34C759']}
                style={styles.iconGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="clipboard-outline" size={32} color="#FFFFFF" />
              </LinearGradient>
            </View>
            
            <Text style={[styles.title, isDark && styles.titleDark]}>
              Your Reflection Goals
            </Text>
            
            <Text style={[styles.subtitle, isDark && styles.subtitleDark]}>
              Choose what matters most to you
            </Text>
          </View>

          {/* Goals Grid */}
          <View style={styles.goalsContainer}>
            <View style={styles.goalsGrid}>
              {GOALS.map((goal) => renderGoalCard(goal))}
            </View>
          </View>

          {/* Continue Button */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[
                styles.primaryButton, 
                selectedGoals.length === 0 && styles.primaryButtonDisabled
              ]}
              onPress={() => navigation.navigate('TimePreference', { goals: selectedGoals })}
              disabled={selectedGoals.length === 0}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={selectedGoals.length === 0 
                  ? ['#9CA3AF', '#9CA3AF'] 
                  : ['#007AFF', '#34C759']
                }
                style={styles.primaryButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.primaryButtonText}>
                  {selectedGoals.length === 0 
                    ? 'Select goals to continue' 
                    : `Continue (${selectedGoals.length} selected)`
                  }
                </Text>
                {selectedGoals.length > 0 && (
                  <Ionicons 
                    name="arrow-forward" 
                    size={20} 
                    color="#FFFFFF" 
                    style={styles.buttonIcon}
                  />
                )}
              </LinearGradient>
            </TouchableOpacity>

            <Text style={[styles.helpText, isDark && styles.helpTextDark]}>
              You can change these preferences later
            </Text>
          </View>
        </View>
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
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    paddingVertical: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 32,
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
    fontSize: 32,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  titleDark: {
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 18,
    color: '#6B7280',
    textAlign: 'center',
    fontWeight: '500',
    letterSpacing: 0.1,
    lineHeight: 24,
  },
  subtitleDark: {
    color: '#9CA3AF',
  },
  goalsContainer: {
    marginBottom: 40,
  },
  goalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  goalCard: {
    backgroundColor: '#FFFFFF',
    width: '48%',
    aspectRatio: 1,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    position: 'relative',
  },
  goalCardDark: {
    backgroundColor: '#1F2937',
    borderColor: '#374151',
  },
  goalCardSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
    shadowColor: '#007AFF',
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  goalCardSelectedDark: {
    shadowColor: '#007AFF',
  },
  goalIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(107, 114, 128, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  goalIconContainerSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: 0.1,
  },
  goalTitleSelected: {
    color: '#FFFFFF',
  },
  goalTitleDark: {
    color: '#FFFFFF',
  },
  goalDescription: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 16,
    fontWeight: '500',
    letterSpacing: 0.1,
  },
  goalDescriptionSelected: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  goalDescriptionDark: {
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
  buttonContainer: {
    alignItems: 'center',
  },
  primaryButton: {
    borderRadius: 16,
    marginBottom: 16,
    width: '100%',
    shadowColor: '#007AFF',
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
    flexDirection: 'row',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  buttonIcon: {
    marginLeft: 8,
  },
  helpText: {
    color: '#9CA3AF',
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: 0.1,
  },
  helpTextDark: {
    color: '#6B7280',
  },
});