// components/AdviceCards.tsx
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  FadeInUp,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 40;
const CARD_SPACING = 20;

interface AdviceCard {
  id: string;
  title: string;
  content: string;
  icon: string;
}

interface AdviceCardsProps {
  cards: AdviceCard[];
  isDark: boolean;
}

const AdviceCards: React.FC<AdviceCardsProps> = ({ cards, isDark }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (cards.length === 0) return;
    
    // Auto-advance cards every 6 seconds
    const interval = setInterval(() => {
      setCurrentIndex((prev) => {
        const nextIndex = (prev + 1) % cards.length;
        // Scroll to the next card
        scrollViewRef.current?.scrollTo({
          x: nextIndex * (CARD_WIDTH + CARD_SPACING),
          animated: true,
        });
        return nextIndex;
      });
    }, 6000);

    return () => clearInterval(interval);
  }, [cards.length]);

  const getIconColor = (icon: string) => {
    switch (icon) {
      case 'leaf-outline':
        return '#34C759';
      case 'walk-outline':
        return '#007AFF';
      case 'bed-outline':
        return '#AF52DE';
      default:
        return '#007AFF';
    }
  };

  if (!cards || cards.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>
          Advice
        </Text>
        <View style={[styles.emptyCard, isDark && styles.emptyCardDark]}>
          <Ionicons 
            name="bulb-outline" 
            size={48} 
            color={isDark ? '#8E8E93' : '#C7C7CC'} 
          />
          <Text style={[styles.emptyText, isDark && styles.emptyTextDark]}>
            Personalized advice will appear here
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>
        Advice
      </Text>
      
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={CARD_WIDTH + CARD_SPACING}
        decelerationRate="fast"
        contentContainerStyle={styles.scrollContainer}
        onMomentumScrollEnd={(event) => {
          const newIndex = Math.round(event.nativeEvent.contentOffset.x / (CARD_WIDTH + CARD_SPACING));
          setCurrentIndex(newIndex);
        }}
        onScrollBeginDrag={() => {
          // Optional: pause auto-advance when user manually scrolls
        }}
      >
        {cards.map((card, index) => (
          <Animated.View
            key={card.id}
            style={[styles.adviceCard, isDark && styles.adviceCardDark]}
            entering={FadeInUp.delay(index * 100).duration(600)}
          >
            <View style={styles.cardContent}>
              <View style={styles.iconSection}>
                <View style={[styles.iconContainer, { backgroundColor: `${getIconColor(card.icon)}15` }]}>
                  <Ionicons name={card.icon as any} size={24} color={getIconColor(card.icon)} />
                </View>
              </View>
              
              <View style={styles.textSection}>
                <Text style={[styles.adviceTitle, isDark && styles.adviceTitleDark]}>
                  {card.title}
                </Text>
                <Text style={[styles.adviceContent, isDark && styles.adviceContentDark]}>
                  {card.content}
                </Text>
              </View>
            </View>
          </Animated.View>
        ))}
      </ScrollView>

      {/* Page indicators */}
      {cards.length > 1 && (
        <View style={styles.pageIndicators}>
          {cards.map((_, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.pageIndicator,
                index === currentIndex && styles.pageIndicatorActive,
                isDark && styles.pageIndicatorDark,
                index === currentIndex && isDark && styles.pageIndicatorActiveDark,
              ]}
              onPress={() => {
                setCurrentIndex(index);
                scrollViewRef.current?.scrollTo({
                  x: index * (CARD_WIDTH + CARD_SPACING),
                  animated: true,
                });
              }}
              activeOpacity={0.7}
            />
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
    paddingHorizontal: 20,
    letterSpacing: -0.3,
  },
  sectionTitleDark: {
    color: '#FFFFFF',
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingRight: 40,
  },
  adviceCard: {
    width: CARD_WIDTH,
    height: 140,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginRight: CARD_SPACING,
    borderWidth: 0.5,
    borderColor: '#E5E5EA',
  },
  adviceCardDark: {
    backgroundColor: '#1C1C1E',
    borderColor: '#38383A',
  },
  cardContent: {
    flex: 1,
    flexDirection: 'row',
    padding: 20,
    alignItems: 'center',
  },
  iconSection: {
    marginRight: 16,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textSection: {
    flex: 1,
  },
  adviceTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 6,
    letterSpacing: -0.2,
    lineHeight: 22,
  },
  adviceTitleDark: {
    color: '#FFFFFF',
  },
  adviceContent: {
    fontSize: 15,
    lineHeight: 21,
    color: '#3C3C43',
    fontWeight: '400',
    letterSpacing: -0.1,
  },
  adviceContentDark: {
    color: '#AEAEB2',
  },
  pageIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    gap: 8,
  },
  pageIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#C7C7CC',
  },
  pageIndicatorDark: {
    backgroundColor: '#48484A',
  },
  pageIndicatorActive: {
    width: 20,
    backgroundColor: '#007AFF',
  },
  pageIndicatorActiveDark: {
    backgroundColor: '#007AFF',
  },
  emptyCard: {
    marginHorizontal: 20,
    height: 140,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 0.5,
    borderColor: '#E5E5EA',
  },
  emptyCardDark: {
    backgroundColor: '#1C1C1E',
    borderColor: '#38383A',
  },
  emptyText: {
    fontSize: 15,
    color: '#8E8E93',
    fontWeight: '500',
  },
  emptyTextDark: {
    color: '#8E8E93',
  },
});

export default AdviceCards;