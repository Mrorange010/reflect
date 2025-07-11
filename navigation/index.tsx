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
import ReflectionDetailScreen from '../screens/ReflectionDetailScreen';

export type RootStackParamList = {
  Login: undefined;
  SignUp: undefined;
  Home: undefined;
  Welcome: undefined;
  Goals: undefined;
  TimePreference: { goals: string[] };
  MethodPreference: { goals: string[]; time: string };
  Call: undefined;
  ReflectionDetail: { reflection: any };
};

export type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const Stack = createNativeStackNavigator<RootStackParamList>();

function hexToBytes(hex: string) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
}

async function verifyHMAC(body: string, signature: string, secret: string) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
  const sigBytes = hexToBytes(signature);
  const valid = await crypto.subtle.verify(
    "HMAC",
    key,
    sigBytes,
    encoder.encode(body)
  );
  return valid;
}

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
      
      try {
        const { data, error } = await supabase
          .from('user_settings')
          .select('onboarding_complete')
          .eq('user_id', user.id)
          .single();
        
        if (error) {
          console.log('Error checking onboarding:', error);
          // If no user_settings record exists, assume needs onboarding
          setNeedsOnboarding(true);
        } else {
          setNeedsOnboarding(!data?.onboarding_complete);
        }
      } catch (error) {
        console.log('Exception checking onboarding:', error);
        setNeedsOnboarding(true);
      }
      
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
          <Stack.Screen name="ReflectionDetail" component={ReflectionDetailScreen} />
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