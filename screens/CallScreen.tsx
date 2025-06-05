import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  StatusBar,
  Platform,
  Alert,
  Linking,
  SafeAreaView,
  Vibration,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NavigationProp } from '../navigation';
import { Audio } from 'expo-av';
import ConvAiDOMComponent from '../components/convAI';
import { supabase } from '../utils/supabase';
import { updateUserStreak } from '../utils/streak';

type ConvAiRef = any;

const { width, height } = Dimensions.get('window');

export default function CallScreen() {
  const navigation = useNavigation<NavigationProp>();
  const convRef = useRef<ConvAiRef>(null);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [isConversationStarting, setIsConversationStarting] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [micPermissionGranted, setMicPermissionGranted] = useState(false);
  const [mode, setMode] = useState('');
  const [audioLevel, setAudioLevel] = useState<number[]>(Array(15).fill(0));
  const [activeAnimation, setActiveAnimation] = useState<'idle' | 'listening' | 'speaking'>('idle');
  const [currentSpokenWordIndex, setCurrentSpokenWordIndex] = useState<number>(0);
  const [words, setWords] = useState<string[]>([]);
  const currentMessageRef = useRef<string>('');
  const [userId, setUserId] = useState<string | null>(null);

  // New realistic call features
  const [callDuration, setCallDuration] = useState(0);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [isRinging, setIsRinging] = useState(true);

  let renderCount = useRef(0);
  renderCount.current += 1;
  console.log('[CallScreen] Render count:', renderCount.current);

  // Fetch User ID
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) {
          console.error('[CallScreen] Error fetching user:', userError.message);
          setError('Could not identify user for the call.');
          return;
        }
        if (user) {
          console.log('[CallScreen] User ID fetched:', user.id);
          setUserId(user.id);
        } else {
          console.warn('[CallScreen] No user logged in.');
          setError('No user session found. Please log in.');
          // Optionally navigate to login or show an alert
        }
      } catch (e: any) {
        console.error('[CallScreen] Exception fetching user:', e.message);
        setError('An unexpected error occurred while identifying you.');
      }
    };
    fetchUser();
  }, []);

  // Call timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (hasStarted) {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [hasStarted]);

  // Ringing animation
  useEffect(() => {
    if (isRinging && !hasStarted) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      
      // Vibrate for incoming call
      const vibratePattern = [0, 1000, 500, 1000, 500];
      const vibrateInterval = setInterval(() => {
        Vibration.vibrate(vibratePattern);
      }, 3000);

      return () => {
        pulse.stop();
        clearInterval(vibrateInterval);
        Vibration.cancel();
      };
    }
  }, [isRinging, hasStarted, pulseAnim]);

  // Format call duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Simplified audio session configuration
  const configureAudioSession = async () => {
    try {
      if (Platform.OS === 'ios') {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true, // Crucial for iOS recording
        });
        console.log('[CallScreen] iOS Audio session configured for recording.');
      } else {
        // Android: just ensure recording is allowed. Default output will be used.
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true, // Ensure microphone can be activated
        });
        console.log('[CallScreen] Android Audio session configured for recording.');
      }
    } catch (configError) {
      console.error('[CallScreen] Failed to configure audio session:', configError);
      setError('Failed to configure audio for the call.');
    }
  };

  useEffect(() => {
    console.log("[CallScreen] Component Mounted");
    return () => {
      console.log("[CallScreen] Component Unmounting - This might be the issue!");
    };
  }, []);

  const handleAcceptCall = async () => {
    console.log('[CallScreen] handleAcceptCall started');
    console.log('[CallScreen] Current userId state at start of handleAcceptCall:', userId);

    if (!userId) {
      console.error('[CallScreen] BLOCKING CALL: User ID is not available in handleAcceptCall.');
      Alert.alert('Error', 'Your user session could not be identified. Please try logging out and back in.');
      return;
    }

    let perm = await Audio.getPermissionsAsync();
    console.log('[CallScreen] Initial permission status:', JSON.stringify(perm));

    if (perm.status === 'denied' && !perm.canAskAgain) {
      console.log('[CallScreen] Permission denied and cannot ask again.');
      Alert.alert(
        'Microphone Permission Required',
        'This app needs microphone access. Please enable it in your phone\'s settings for this app.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ]
      );
      setMicPermissionGranted(false);
      return;
    }

    if (perm.status !== 'granted') {
      console.log('[CallScreen] Permission not granted, requesting...');
      perm = await Audio.requestPermissionsAsync();
      console.log('[CallScreen] Permission status after request:', JSON.stringify(perm));
    }

    if (perm.status === 'granted') {
      console.log('[CallScreen] Permission granted. Proceeding with call setup.');
      setMicPermissionGranted(true);
      setError('');
      setIsRinging(false);
      setHasStarted(true);
      
      console.log('[CallScreen] Configuring simplified audio session...');
      await configureAudioSession();
      
      console.log('[CallScreen] About to call startConversation. Current userId:', userId);
      if (convRef.current) {
        convRef.current.startConversation();
        console.log('[CallScreen] convRef.current.startConversation() called.');
      } else {
        console.error('[CallScreen] convRef.current is null when trying to start conversation!');
        setError('Failed to initialize conversation component.');
        setHasStarted(false);
        setMicPermissionGranted(false);
      }
      Vibration.cancel();
    } else {
      console.log('[CallScreen] Permission not granted after request (or was already not granted and not requestable).');
      setMicPermissionGranted(false);
      Alert.alert(
        'Microphone Permission Required',
        'This app needs microphone access to function. Please enable it in settings or grant permission when asked.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ]
      );
    }
  };

  const handleDeclineCall = () => {
    convRef.current?.stopConversation();
    setIsRinging(false);
    Vibration.cancel();
    navigation.goBack();
  };

  const getCallQualityIcon = () => {
    return 'cellular';
  };

  const noop = useCallback(() => {}, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <LinearGradient
        colors={['#1a1a2e', '#16213e', '#0f3460']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Header - minimal like real phone calls */}
        <View style={styles.header}>
          {hasStarted && (
            <View style={styles.callInfo}>
              <Text style={styles.durationText}>{formatDuration(callDuration)}</Text>
            </View>
          )}
        </View>

        {/* Main content - optimized spacing */}
        <View style={styles.content}>
          <Animated.View style={[
            styles.avatarContainer,
            !hasStarted && { transform: [{ scale: pulseAnim }] }
          ]}>
            <View style={styles.avatar}>
              <LinearGradient
                colors={['#667eea', '#764ba2', '#9575cd']}
                style={styles.avatarGradient}
              >
                <View style={styles.avatarInner}>
                  <Ionicons 
                    name="headset" 
                    size={hasStarted ? 48 : 64} 
                    color="white" 
                  />
                  {activeAnimation === 'speaking' && hasStarted && (
                    <View style={styles.speakingIndicator}>
                      <View style={[styles.soundWave, styles.wave1]} />
                      <View style={[styles.soundWave, styles.wave2]} />
                      <View style={[styles.soundWave, styles.wave3]} />
                    </View>
                  )}
                </View>
              </LinearGradient>
            </View>
            
            <View style={styles.contactInfo}>
              <Text style={styles.contactName}>ReflectAI Assistant</Text>
              {!hasStarted ? (
                <>
                  <Text style={styles.phoneNumber}>AI Assistant</Text>
                  <Text style={styles.incomingLabel}>incoming call...</Text>
                </>
              ) : (
                null
              )}
            </View>
          </Animated.View>
        </View>

        {/* Controls - Better organized */}
        <View style={styles.controlsContainer}>
          {!hasStarted ? (
            // Incoming call controls
            <View style={styles.incomingControls}>
              <TouchableOpacity
                style={styles.declineButton}
                onPress={handleDeclineCall}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#ef4444', '#dc2626']}
                  style={styles.callButtonGradient}
                >
                  <Ionicons name="call" size={28} color="white" style={{ transform: [{ rotate: '135deg' }] }} />
                </LinearGradient>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.acceptButton}
                onPress={handleAcceptCall}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#10b981', '#059669']}
                  style={styles.callButtonGradient}
                >
                  <Ionicons name="call" size={28} color="white" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : (
            // Active call controls - simplified
            <View style={styles.activeControls}>
              <View style={styles.simpleControlsRow}>
                <View style={[styles.controlButton]}>
                  <Ionicons 
                    name={"volume-medium"}
                    size={24} 
                    color={"rgba(255,255,255,0.5)"}
                  />
                  <Text style={[styles.controlLabel]}>
                    Speaker
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.endCallButton}
                  onPress={handleDeclineCall}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#ef4444', '#dc2626']}
                    style={styles.endCallGradient}
                  >
                    <Ionicons name="call" size={24} color="white" style={{ transform: [{ rotate: '135deg' }] }} />
                  </LinearGradient>
                </TouchableOpacity>

                <View style={styles.spacer} />
              </View>
            </View>
          )}
        </View>

        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}
        
        {(() => { 
          if (__DEV__) {
            console.log("[CallScreen] Rendering ConvAiDOMComponent. HasStarted:", hasStarted, "Status:", status);
          }
          return null; 
        })()}
        <ConvAiDOMComponent
          ref={convRef}
          platform={Platform.OS}
          onMessage={noop}
          setMessage={noop}
          setStatus={setStatus}
          setIsConversationStarting={setIsConversationStarting}
          setMode={setMode}
          setError={setError}
          setActiveAnimation={setActiveAnimation}
          activeAnimation={activeAnimation}
          setAudioLevel={setAudioLevel}
          setIsSpeaking={setIsSpeaking}
          setCurrentSpokenWordIndex={setCurrentSpokenWordIndex}
          setWords={setWords}
          currentMessageRef={currentMessageRef}
          userId={userId}
        />
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  gradient: {
    flex: 1,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 10 : 30,
    paddingBottom: 12,
    alignItems: 'center',
    minHeight: 40,
  },
  callInfo: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  durationText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },
  qualityIndicator: {
    alignItems: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    minHeight: height * 0.45,
  },
  avatarContainer: {
    alignItems: 'center',
  },
  avatar: {
    width: 140,
    height: 140,
    borderRadius: 70,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 16,
  },
  avatarGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 70,
    padding: 3,
  },
  avatarInner: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 67,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    position: 'relative',
  },

  speakingIndicator: {
    position: 'absolute',
    bottom: 8,
    flexDirection: 'row',
    gap: 2,
  },
  soundWave: {
    width: 3,
    backgroundColor: 'white',
    borderRadius: 1.5,
  },
  wave1: {
    height: 12,
    opacity: 0.6,
  },
  wave2: {
    height: 16,
    opacity: 0.8,
  },
  wave3: {
    height: 10,
    opacity: 0.6,
  },
  contactInfo: {
    alignItems: 'center',
  },
  contactName: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
    marginBottom: 8,
    textAlign: 'center',
  },
  phoneNumber: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '400',
    marginBottom: 4,
  },
  incomingLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '400',
    fontStyle: 'italic',
  },

  statusRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusBadgeText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  controlsContainer: {
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
  },
  incomingControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  declineButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  acceptButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  callButtonGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeControls: {
    gap: 20,
  },
  simpleControlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  spacer: {
    width: 60, // Same width as speaker button for balance
  },
  controlButton: {
    alignItems: 'center',
    gap: 6,
    padding: 8,
    borderRadius: 12,
    opacity: 0.5,
  },
  controlLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontWeight: '500',
  },
  endCallButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  endCallGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },

  errorContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 120 : 100,
    left: 24,
    right: 24,
    alignItems: 'center',
    zIndex: 10,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '600',
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 12,
    borderRadius: 8,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
  },
});