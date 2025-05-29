'use dom';

import React from 'react';
import { useConversation } from '@elevenlabs/react';
import { Mic } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { View, Pressable, StyleSheet, Text } from 'react-native';

type AgentType = 'weekStart' | 'weekEnd';

async function requestMicrophonePermission() {
  try {
    await navigator.mediaDevices.getUserMedia({ audio: true });
    return true;
  } catch (error) {
    console.error('Microphone permission denied:', error);
    return false;
  }
}

export default function ConvAiDOMComponent({
  platform,
  agentType,
}: {
  platform: string;
  agentType: AgentType;
}) {
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const conversation = useConversation({
    onConnect: () => setIsRecording(true),
    onDisconnect: () => setIsRecording(false),
    onMessage: (message) => {
      console.log('Message received:', message);
    },
    onError: (error) => {
      setError('Connection error. Please try again.');
      setIsRecording(false);
    },
  });

  const getAgentConfig = (type: AgentType) => ({
    weekStart: {
      agentId: process.env.ELEVENLABS_WEEK_START_AGENT_ID,
      greeting: "Good morning! How was your weekend? Let's plan for the week ahead.",
    },
    weekEnd: {
      agentId: process.env.ELEVENLABS_WEEK_END_AGENT_ID,
      greeting: "It's Friday! How was your week? Let's reflect on your achievements.",
    },
  }[type]);

  const startConversation = useCallback(async () => {
    setError(null);
    const hasPermission = await requestMicrophonePermission();
    if (!hasPermission) {
      setError('Microphone permission is required for voice reflections');
      return;
    }
    const config = getAgentConfig(agentType);
    if (!config.agentId) {
      setError('Agent ID is not set. Please check your environment variables.');
      return;
    }
    try {
      await conversation.startSession({
        agentId: config.agentId,
        dynamicVariables: {
          platform,
          greeting: config.greeting,
        },
      });
    } catch (error) {
      setError('Failed to start conversation. Please try again.');
    }
  }, [conversation, platform, agentType]);

  return (
    <View style={styles.container}>
      {error && <Text style={styles.errorText}>{error}</Text>}
      <Pressable
        onPress={startConversation}
        style={({ pressed }) => [
          styles.button,
          pressed && styles.buttonPressed,
          isRecording && styles.buttonRecording,
        ]}
      >
        <Mic size={24} color="#fff" />
      </Pressable>
      {isRecording && (
        <Text style={styles.recordingText}>
          {agentType === 'weekStart' ? 'Planning your week...' : 'Reflecting on your week...'}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  button: {
    width: 60, height: 60, borderRadius: 30, backgroundColor: '#007AFF',
    justifyContent: 'center', alignItems: 'center', shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5,
  },
  buttonPressed: { backgroundColor: '#0056b3', transform: [{ scale: 0.95 }] },
  buttonRecording: { backgroundColor: '#FF3B30' },
  recordingText: { marginTop: 12, color: '#666', fontSize: 14 },
  errorText: { color: '#FF3B30', marginBottom: 12, textAlign: 'center' },
});