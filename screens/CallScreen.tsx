import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  StatusBar,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NavigationProp } from '../navigation';
import ConvAiDOMComponent from '../components/convAI';

const { width, height } = Dimensions.get('window');

export default function CallScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [isRecording, setIsRecording] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [showAI, setShowAI] = useState(false);
  
  // Animation values
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    // Slide up animation
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 600,
      useNativeDriver: true,
    }).start();

    // Pulsing avatar animation
    const createPulseAnimation = () => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1200,
            useNativeDriver: true,
          }),
        ])
      );
    };

    const pulseAnimation = createPulseAnimation();
    pulseAnimation.start();

    return () => {
      pulseAnimation.stop();
    };
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAcceptCall = () => {
    setIsRecording(true);
    setShowAI(true);
    // Add haptic feedback here if needed
  };

  const handleDeclineCall = () => {
    navigation.goBack();
  };

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <LinearGradient
        colors={['#1a1a2e', '#16213e', '#0f3460']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >


        {/* Header */}
        <Animated.View 
          style={[
            styles.header,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <View style={styles.headerContent}>
            <Text style={styles.headerLabel}>
              {isRecording ? 'Connected' : 'Incoming Call'}
            </Text>
            {isRecording && (
              <View style={styles.durationContainer}>
                <View style={styles.recordingDot} />
                <Text style={styles.durationText}>{formatDuration(callDuration)}</Text>
              </View>
            )}
          </View>
        </Animated.View>

        {/* Main Content */}
        <Animated.View 
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          {/* AI Avatar with Pulse Effect */}
          <View style={styles.avatarContainer}>
            {/* Main Avatar */}
            <Animated.View
              style={[
                styles.avatar,
                {
                  transform: [{ scale: pulseAnim }]
                }
              ]}
            >
              <LinearGradient
                colors={['#667eea', '#764ba2', '#9575cd']}
                style={styles.avatarGradient}
              >
                <View style={styles.avatarInner}>
                  <Ionicons name="headset" size={64} color="white" />
                </View>
              </LinearGradient>
            </Animated.View>

            {/* AI Info */}
            <View style={styles.aiInfo}>
              <Text style={styles.aiName}>ReflectAI Assistant</Text>
              {isRecording && (
                <View style={styles.statusIndicator}>
                  <View style={styles.onlineIndicator} />
                  <Text style={styles.statusText}>Recording...</Text>
                </View>
              )}
            </View>
          </View>
        </Animated.View>

        {/* Call Controls */}
        <Animated.View 
          style={[
            styles.controlsContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          {!isRecording ? (
            <>
              {/* Primary Actions */}
              <View style={styles.primaryActions}>
                <TouchableOpacity
                  style={[styles.primaryButton, styles.declineButton]}
                  onPress={handleDeclineCall}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#ef4444', '#dc2626']}
                    style={styles.buttonGradient}
                  >
                    <Ionicons name="call" size={32} color="white" style={{ transform: [{ rotate: '135deg' }] }} />
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.primaryButton, styles.acceptButton]}
                  onPress={handleAcceptCall}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#10b981', '#059669']}
                    style={styles.buttonGradient}
                  >
                    <Ionicons name="call" size={32} color="white" />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <View style={styles.activeCallControls}>
              <TouchableOpacity style={styles.callControlButton}>
                <Ionicons name="mic-off" size={24} color="white" />
                <Text style={styles.controlLabel}>Mute</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.callControlButton, styles.endCallButton]}
                onPress={handleDeclineCall}
              >
                <LinearGradient
                  colors={['#ef4444', '#dc2626']}
                  style={styles.endCallGradient}
                >
                  <Ionicons name="call" size={28} color="white" style={{ transform: [{ rotate: '135deg' }] }} />
                </LinearGradient>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.callControlButton}>
                <Ionicons name="volume-high" size={24} color="white" />
                <Text style={styles.controlLabel}>Speaker</Text>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>

        {/* Bottom Safe Area */}
        <View style={styles.bottomSafeArea} />

        {/* Render the ElevenLabs AI agent when showAI is true */}
        {showAI && (
          <View style={{ position: 'absolute', top: 100, left: 0, right: 0, alignItems: 'center', zIndex: 10 }}>
            <ConvAiDOMComponent
              platform={Platform.OS}
              agentType="weekStart"
            />
          </View>
        )}
      </LinearGradient>
    </>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },

  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  headerContent: {
    alignItems: 'center',
  },
  headerLabel: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
    marginBottom: 8,
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
    marginRight: 8,
  },
  durationText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  avatarContainer: {
    alignItems: 'center',
    position: 'relative',
  },
  avatar: {
    width: 180,
    height: 180,
    borderRadius: 90,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 20,
  },
  avatarGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 90,
    padding: 4,
  },
  avatarInner: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 86,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  aiInfo: {
    alignItems: 'center',
  },
  aiName: {
    fontSize: 28,
    fontWeight: '700',
    color: 'white',
    marginBottom: 4,
    textAlign: 'center',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    marginTop: 8,
  },
  onlineIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
    marginRight: 6,
  },
  statusText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    fontWeight: '500',
  },
  controlsContainer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  primaryActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 80,
  },
  primaryButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
  },
  declineButton: {
    backgroundColor: '#ef4444',
  },
  acceptButton: {
    backgroundColor: '#10b981',
  },
  buttonGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeCallControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  callControlButton: {
    alignItems: 'center',
    gap: 8,
  },
  endCallButton: {
    marginTop: -10,
  },
  endCallGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    fontWeight: '500',
  },
  bottomSafeArea: {
    height: 20,
  },
});