import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import DashboardScreen from '../screens/DashboardScreen';
import DailyLogScreen from '../screens/DailyLogScreen';
import ChatScreen from '../screens/ChatScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { useTheme } from '../contexts/ThemeContext';

const Tab = createBottomTabNavigator();

export default function MainTabs() {
  const { isDark } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: isDark ? '#A5B4FC' : '#6366F1',
        tabBarInactiveTintColor: isDark ? '#6B7280' : '#A1A1AA',
        tabBarStyle: { backgroundColor: isDark ? '#18181B' : 'white' },
        tabBarIcon: ({ focused, size, color }) => {
          let iconName = 'ellipse-outline';
          if (route.name === 'Insights') {
            iconName = 'bulb-outline';
          } else if (route.name === 'Weekly Log') {
            iconName = 'calendar-outline';
          } else if (route.name === 'Chat') {
            iconName = 'chatbubble-ellipses-outline';
          } else if (route.name === 'Settings') {
            iconName = 'settings-outline';
          }
          return <Ionicons name={iconName as any} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Insights" component={DashboardScreen} />
      <Tab.Screen name="Weekly Log" component={DailyLogScreen} />
      <Tab.Screen name="Chat" component={ChatScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}
