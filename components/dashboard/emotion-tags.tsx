import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Enhanced mock data with frequencies and sentiment
const emotionalTags = [
  { name: 'Grateful', frequency: 8, sentiment: 'positive', color: '#10B981' },
  { name: 'Focused', frequency: 6, sentiment: 'positive', color: '#3B82F6' },
  { name: 'Tired', frequency: 4, sentiment: 'neutral', color: '#6B7280' },
  { name: 'Motivated', frequency: 7, sentiment: 'positive', color: '#8B5A2B' },
  { name: 'Stressed', frequency: 3, sentiment: 'negative', color: '#EF4444' },
  { name: 'Calm', frequency: 5, sentiment: 'positive', color: '#06B6D4' },
  { name: 'Productive', frequency: 6, sentiment: 'positive', color: '#84CC16' },
  { name: 'Anxious', frequency: 2, sentiment: 'negative', color: '#F59E0B' },
];

export function EmotionalTagCloud() {
  const getTagSize = (frequency: number) => {
    if (frequency >= 7) return 'large';
    if (frequency >= 5) return 'medium';
    return 'small';
  };

  const getTagStyle = (tag: any) => {
    const size = getTagSize(tag.frequency);
    return {
      ...styles.tagChip,
      backgroundColor: `${tag.color}15`,
      borderColor: `${tag.color}30`,
      ...(size === 'large' && styles.largeTag),
      ...(size === 'medium' && styles.mediumTag),
      ...(size === 'small' && styles.smallTag),
    };
  };

  const getTextStyle = (tag: any) => {
    const size = getTagSize(tag.frequency);
    return {
      ...styles.tagText,
      color: tag.color,
      ...(size === 'large' && styles.largeText),
      ...(size === 'medium' && styles.mediumText),
      ...(size === 'small' && styles.smallText),
    };
  };

  // Sort tags by frequency for better visual layout
  const sortedTags = [...emotionalTags].sort((a, b) => b.frequency - a.frequency);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.iconContainer}>
            <Ionicons name="heart" size={18} color="#EC4899" />
          </View>
          <View>
            <Text style={styles.title}>Emotional Journey</Text>
            <Text style={styles.subtitle}>Your most frequent feelings</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.viewAllButton}>
          <Text style={styles.viewAllText}>View All</Text>
          <Ionicons name="chevron-forward" size={14} color="#64748B" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tagsScrollContainer}
      >
        <View style={styles.tagsGrid}>
          {sortedTags.map((tag, index) => (
            <TouchableOpacity
              key={index}
              style={getTagStyle(tag)}
              activeOpacity={0.7}
            >
              <Text style={getTextStyle(tag)}>{tag.name}</Text>
              <View style={[styles.frequencyDot, { backgroundColor: tag.color }]}>
                <Text style={styles.frequencyText}>{tag.frequency}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Sentiment Summary */}
      <View style={styles.sentimentSummary}>
        <View style={styles.sentimentItem}>
          <View style={[styles.sentimentDot, { backgroundColor: '#10B981' }]} />
          <Text style={styles.sentimentLabel}>Positive: </Text>
          <Text style={styles.sentimentValue}>67%</Text>
        </View>
        <View style={styles.sentimentItem}>
          <View style={[styles.sentimentDot, { backgroundColor: '#6B7280' }]} />
          <Text style={styles.sentimentLabel}>Neutral: </Text>
          <Text style={styles.sentimentValue}>20%</Text>
        </View>
        <View style={styles.sentimentItem}>
          <View style={[styles.sentimentDot, { backgroundColor: '#EF4444' }]} />
          <Text style={styles.sentimentLabel}>Challenging: </Text>
          <Text style={styles.sentimentValue}>13%</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 20,
    marginHorizontal: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FCE7F3',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    gap: 4,
  },
  viewAllText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  tagsScrollContainer: {
    paddingRight: 20,
  },
  tagsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
    gap: 6,
  },
  
  // Tag sizes
  largeTag: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  mediumTag: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 18,
  },
  smallTag: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },

  // Text styles
  tagText: {
    fontWeight: '600',
  },
  largeText: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  mediumText: {
    fontSize: 14,
    fontWeight: '600',
  },
  smallText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Frequency indicator
  frequencyDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  frequencyText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },

  // Sentiment summary
  sentimentSummary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 12,
  },
  sentimentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  sentimentDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  sentimentLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  sentimentValue: {
    fontSize: 11,
    color: '#0F172A',
    fontWeight: 'bold',
  },
});