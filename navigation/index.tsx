import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { supabase } from '../utils/supabase';
import LoginScreen from '../screens/LoginScreen';
import SignUpScreen from '../screens/SignUpScreen';
import HomeScreen from '../screens/HomeScreen';
import WelcomeScreen from '../screens/Onboarding/WelcomeScreen';
import GoalsScreen from '../screens/Onboarding/GoalsScreen';
import TimePreferenceScreen from '../screens/Onboarding/TimePreferenceScreen';
import MethodPreferenceScreen from '../screens/Onboarding/MethodPreferenceScreen';
import CallScreen from '../screens/CallScreen';

export type RootStackParamList = {
  Login: undefined;
  SignUp: undefined;
  Home: undefined;
  Welcome: undefined;
  Goals: undefined;
  TimePreference: { goals: string[] };
  MethodPreference: { goals: string[]; time: string };
  Call: undefined;
};

export type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const Stack = createNativeStackNavigator<RootStackParamList>();

function AppNavigator() {
  const [loading, setLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session?.user);
      checkOnboarding(session?.user ?? null);
    });

    // Initial check
    supabase.auth.getUser().then(({ data }) => {
      setIsLoggedIn(!!data.user);
      checkOnboarding(data.user ?? null);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };

    async function checkOnboarding(user: { id: string } | null) {
      if (!user) {
        setNeedsOnboarding(false);
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from('user_settings')
        .select('onboarding_complete')
        .eq('user_id', user.id)
        .single();
      setNeedsOnboarding(!data?.onboarding_complete);
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  return (
    <Stack.Navigator
      initialRouteName={isLoggedIn ? (needsOnboarding ? 'Welcome' : 'Home') : 'Login'}
      screenOptions={{ headerShown: false }}
    >
      {!isLoggedIn && (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="SignUp" component={SignUpScreen} />
        </>
      )}
      {isLoggedIn && needsOnboarding && (
        <>
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="Goals" component={GoalsScreen} />
          <Stack.Screen name="TimePreference" component={TimePreferenceScreen} />
          <Stack.Screen name="MethodPreference" component={MethodPreferenceScreen} />
        </>
      )}
      {isLoggedIn && (
        <>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Call" component={CallScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function Navigation() {
  return (
    <NavigationContainer>
      <AppNavigator />
    </NavigationContainer>
  );
} 