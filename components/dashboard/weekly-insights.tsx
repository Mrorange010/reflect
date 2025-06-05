import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
// Mock data
const insights = [
  'Your mood improved by 15% compared to last week, with highest scores on weekends.',
  'Energy levels dipped mid-week but recovered strongly by Friday.',
  'Your reflection consistency has improved, with entries on 6 out of 7 days.',
  'Morning reflections tend to have more positive sentiment than evening ones.',
];
export function WeeklyInsights() {
  const [activeIndex, setActiveIndex] = useState(0);
  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.icon}>📊</Text>
        <Text style={styles.header}>Weekly Insights</Text>
      </View>
      <View style={styles.insightBox}>
        <Text style={styles.insightText}>{insights[activeIndex]}</Text>
      </View>
      <View style={styles.pagination}>
        {insights.map((_, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => setActiveIndex(index)}
            style={[styles.dot, activeIndex === index && styles.activeDot]}
            accessibilityLabel={`Go to insight ${index + 1}`}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  icon: { fontSize: 22, marginRight: 8 },
  header: { fontSize: 18, fontWeight: 'bold', color: '#1F2937' },
  insightBox: { minHeight: 60, marginBottom: 16 },
  insightText: { color: '#64748B', fontSize: 16, lineHeight: 22 },
  pagination: { flexDirection: 'row', justifyContent: 'center', marginTop: 0, gap: 8 },
  dot: {
    height: 8,
    width: 8,
    borderRadius: 4,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 2,
  },
  activeDot: {
    width: 24,
    backgroundColor: '#F59E0B',
  },
});
