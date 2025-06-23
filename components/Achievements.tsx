import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  FadeInUp,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface AchievementsProps {
  isDark: boolean;
}

const Achievements: React.FC<AchievementsProps> = ({ isDark }) => {
  // For now, using a sample achievement - this could be dynamic later
  const currentAchievement = {
    text: "7-day tracking streak! You've been consistently logging your mood and energy.",
    icon: "trophy-outline",
    color: "#FF9500",
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>
        Achievements
      </Text>
      
      <Animated.View 
        style={[
          styles.achievementCard,
          isDark && styles.achievementCardDark,
        ]}
        entering={FadeInUp.delay(400).duration(600)}
      >
        <View style={styles.cardContent}>
          <View style={[styles.iconContainer, { backgroundColor: `${currentAchievement.color}15` }]}>
            <Ionicons 
              name={currentAchievement.icon as any} 
              size={24} 
              color={currentAchievement.color} 
            />
          </View>
          
          <View style={styles.textContainer}>
            <Text style={[styles.achievementText, isDark && styles.achievementTextDark]}>
              {currentAchievement.text}
            </Text>
          </View>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  sectionTitleDark: {
    color: '#FFFFFF',
  },
  achievementCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  achievementCardDark: {
    backgroundColor: '#1C1C1E',
    shadowColor: '#000000',
    shadowOpacity: 0.3,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  achievementText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    lineHeight: 22,
  },
  achievementTextDark: {
    color: '#FFFFFF',
  },
});

export default Achievements; 