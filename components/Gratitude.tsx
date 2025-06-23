import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  FadeInUp,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 80; // Full width minus margins
const GRATITUDE_CARD_WIDTH = CARD_WIDTH * 0.85; // Individual gratitude card width

interface GratitudeEntry {
  id: string;
  text: string;
  date: Date;
}

interface GratitudeProps {
  isDark: boolean;
}

const Gratitude: React.FC<GratitudeProps> = ({ isDark }) => {
  // Sample gratitude data - this would be dynamic from your database
  const gratitudeEntries: GratitudeEntry[] = [
    {
      id: '1',
      text: 'Spending quality time with family during dinner',
      date: new Date('2024-06-20'),
    },
    {
      id: '2', 
      text: 'Beautiful sunrise this morning that brightened my day',
      date: new Date('2024-06-19'),
    },
    {
      id: '3',
      text: 'My friend\'s support during a challenging time',
      date: new Date('2024-06-18'),
    },
  ];

  const formatDate = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const GratitudeItem = ({ entry, index }: { entry: GratitudeEntry; index: number }) => (
    <Animated.View
      style={[styles.gratitudeItem, isDark && styles.gratitudeItemDark]}
      entering={FadeInUp.delay(600 + index * 50).duration(400)}
    >
      <View style={styles.itemContent}>
        <View style={[styles.dateIcon, isDark && styles.dateIconDark]}>
          <Ionicons name="heart" size={14} color="#FF2D92" />
        </View>
        <View style={styles.textContent}>
          <Text style={[styles.gratitudeText, isDark && styles.gratitudeTextDark]}>
            {entry.text}
          </Text>
          <Text style={[styles.gratitudeDate, isDark && styles.gratitudeDateDark]}>
            {formatDate(entry.date)}
          </Text>
        </View>
      </View>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>
        Gratitude
      </Text>
      
      <Animated.View 
        style={[
          styles.mainCard,
          isDark && styles.mainCardDark,
        ]}
        entering={FadeInUp.delay(550).duration(600)}
      >
        <View style={styles.cardHeader}>
          <View style={styles.iconContainer}>
            <Ionicons name="heart-outline" size={20} color="#FF2D92" />
          </View>
          <Text style={[styles.cardTitle, isDark && styles.cardTitleDark]}>
            Recent reflections
          </Text>
        </View>

        <View style={styles.gratitudeList}>
          {gratitudeEntries.map((entry, index) => (
            <GratitudeItem key={entry.id} entry={entry} index={index} />
          ))}
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
  mainCard: {
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
  mainCardDark: {
    backgroundColor: '#1C1C1E',
    shadowColor: '#000000',
    shadowOpacity: 0.3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FF2D9215',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8E8E93',
  },
  cardTitleDark: {
    color: '#8E8E93',
  },
  gratitudeList: {
    gap: 12,
  },
  gratitudeItem: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    borderWidth: 0.5,
    borderColor: '#E5E5EA',
  },
  gratitudeItemDark: {
    backgroundColor: '#2C2C2E',
    borderColor: '#3A3A3C',
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  dateIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FF2D9215',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  dateIconDark: {
    backgroundColor: '#FF2D9220',
  },
  textContent: {
    flex: 1,
  },
  gratitudeText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#000000',
    lineHeight: 22,
    marginBottom: 4,
  },
  gratitudeTextDark: {
    color: '#FFFFFF',
  },
  gratitudeDate: {
    fontSize: 13,
    fontWeight: '500',
    color: '#8E8E93',
  },
  gratitudeDateDark: {
    color: '#8E8E93',
  },
});

export default Gratitude; 