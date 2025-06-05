import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
// Mock data
const reflections = [
  {
    date: '25',
    summary:
      'High energy today. Completed all tasks and had a great workout session.',
    sentiment: 'positive',
  },
  {
    date: '24',
    summary: 'Average day. Some focus issues but managed to stay on track.',
    sentiment: 'neutral',
  },
  {
    date: '23',
    summary: 'Felt tired and overwhelmed. Taking extra rest to recover.',
    sentiment: 'challenging',
  },
];
export function RecentReflections() {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Recent Logs</Text>
      <View style={styles.list}>
        {reflections.map((reflection, index) => (
          <View
            key={index}
            style={[styles.row, styles.card]}
          >
            <View
              style={[
                styles.dateBadge,
                reflection.sentiment === 'positive'
                  ? styles.positive
                  : reflection.sentiment === 'neutral'
                  ? styles.neutral
                  : styles.challenging,
              ]}
            >
              <Text style={styles.dateText}>{reflection.date}</Text>
            </View>
            <Text style={styles.summary} numberOfLines={1}>
              {reflection.summary}
            </Text>
            <Text style={styles.arrow}>{'>'}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
    paddingHorizontal: 24,
  },
  header: { fontSize: 18, fontWeight: 'bold', color: '#1F2937', marginBottom: 8 },
  list: { gap: 16 },
  row: { flexDirection: 'row', alignItems: 'center' },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  dateBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    fontWeight: 'bold',
  },
  dateText: { fontWeight: 'bold', fontSize: 16 },
  positive: { backgroundColor: '#D1FAE5' },
  neutral: { backgroundColor: '#F3F4F6' },
  challenging: { backgroundColor: '#FECACA' },
  summary: { flex: 1, color: '#4B5563', fontSize: 14, marginRight: 8 },
  arrow: { color: '#9CA3AF', fontSize: 18, marginLeft: 4 },
});
