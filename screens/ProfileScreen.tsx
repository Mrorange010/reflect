import React from 'react';
import { View, Text } from 'react-native';

export default function ProfileScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'white' }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold' }}>Profile</Text>
      <Text style={{ color: '#6366F1', marginTop: 8 }}>Manage your preferences and account here.</Text>
    </View>
  );
} 