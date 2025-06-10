import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StyleSheet,
  useColorScheme,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';
import { supabase } from '../utils/supabase';
import { useFocusEffect } from '@react-navigation/native';
import { updateUserStreak } from '../utils/streak';

type Message = {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  status?: 'sending' | 'sent' | 'delivered' | 'read';
};

// Apple Health-style gradient background (matching dashboard)
const HealthGradientBackground = ({ isDark }: { isDark: boolean }) => {
  return (
    <View style={StyleSheet.absoluteFillObject}>
      {/* Background color */}
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: isDark ? '#000000' : '#FFFFFF' }]} />
      
      {/* Top gradient overlay - matching dashboard style */}
      <LinearGradient
        colors={isDark 
          ? ['rgba(0, 122, 255, 0.25)', 'rgba(52, 199, 89, 0.1)', 'transparent'] as const
          : ['rgba(0, 122, 255, 0.15)', 'rgba(52, 199, 89, 0.08)', 'transparent'] as const
        }
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 200, // Smaller than dashboard since we have header
        }}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        locations={[0, 0.6, 1]}
      />
    </View>
  );
};

export default function ChatScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // To store conversation history for OpenAI
  const [conversationHistoryForAI, setConversationHistoryForAI] = useState<Array<{role: 'user' | 'assistant', content: string}>>([]);

  useFocusEffect(
    React.useCallback(() => {
      let isActive = true;
      const fetchAndSetInitialMessage = async () => {
        setMessages([]);
        setConversationHistoryForAI([]); // Reset history on focus
        const { data: { user } } = await supabase.auth.getUser();
        let name = 'there';
        if (user && user.id) {
          setUserId(user.id); // Set userId here
          const { data, error } = await supabase
            .from('users')
            .select('name')
            .eq('id', user.id)
            .single();
          if (data && data.name) {
            name = data.name;
          }
        }
        setIsTyping(true);
        setTimeout(() => {
          if (!isActive) return;
          const initialMessageText = `Hey ${name}, feel free to share any updates, challenges or noteworthy events with me and I'll add them to your current week to reflect on.`;
          const initialAiMessage: Message = {
              id: Date.now().toString(),
            text: initialMessageText,
              sender: 'ai',
              timestamp: new Date(),
          };
          setMessages([initialAiMessage]);
          // Add AI's initial message to conversation history for OpenAI
          setConversationHistoryForAI([{ role: 'assistant', content: initialMessageText.replace(/^Ava: /, '') }]);
          setIsTyping(false);
        }, 1500);
      };
      fetchAndSetInitialMessage();
      return () => {
        isActive = false;
      };
    }, [])
  );

  useEffect(() => {
    // Fetch user ID on mount if not already set by useFocusEffect (e.g. if screen was already mounted)
    const fetchUser = async () => {
      if (!userId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserId(user.id);
      }
    };
    fetchUser();
  }, [userId]);

  const sendMessage = async () => {
    if (!inputText.trim() || !userId) {
        if(!userId) console.warn("User ID not available, cannot send message.");
        return;
    }

    const userMessageText = inputText.trim();
    const newMessage: Message = {
      id: Date.now().toString(),
      text: userMessageText,
      sender: 'user',
      timestamp: new Date(),
      status: 'sending',
    };

    setMessages(prev => [...prev, newMessage]);
    setInputText('');
    
    // Add user's message to conversation history for OpenAI
    const updatedHistoryForAI = [...conversationHistoryForAI, { role: 'user' as const, content: userMessageText }];
    setConversationHistoryForAI(updatedHistoryForAI);

    setIsTyping(true);
    
    try {
      console.log("Calling dailyLogChat with history:", updatedHistoryForAI);
      const { data: edgeFunctionResponse, error: edgeFunctionError } = await supabase.functions.invoke('dailyLogChat', {
        body: {
          message: userMessageText,
          userId: userId,
          conversationHistory: updatedHistoryForAI,
        },
      });

      if (edgeFunctionError) {
        throw edgeFunctionError;
      }

      if (edgeFunctionResponse && edgeFunctionResponse.reply) {
      const aiResponse: Message = {
          id: (Date.now() + 1).toString(),
          text: edgeFunctionResponse.reply,
          sender: 'ai',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, aiResponse]);
        setConversationHistoryForAI(prevHistory => [...prevHistory, { role: 'assistant' as const, content: edgeFunctionResponse.reply.replace(/^Ava: /, '') }]);
      } else {
        console.error('Invalid response from Edge Function:', edgeFunctionResponse);
        const errorResponse: Message = {
            id: (Date.now() + 1).toString(),
            text: "Sorry, I couldn't get a response. Please try again.",
            sender: 'ai',
            timestamp: new Date(),
          };
        setMessages(prev => [...prev, errorResponse]);
      }
    } catch (error) {
      console.error('Error calling Edge Function:', error);
      let errorMessage = "Sorry, something went wrong. Please try again.";
      if (error instanceof Error) {
          errorMessage = `Error: ${error.message}. Check Edge Function logs for details.`;
      }
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: errorMessage,
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsTyping(false);
    }
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => (
    <Animated.View 
      entering={FadeInUp.delay(index * 50).duration(400)}
      style={[
        styles.messageContainer,
        item.sender === 'user' ? styles.userMessageContainer : styles.aiMessageContainer
      ]}
    >
      {item.sender === 'ai' && (
        <View style={[styles.avatarContainer, isDark && styles.avatarContainerDark]}>
          <Ionicons name="sparkles" size={16} color="#007AFF" />
        </View>
      )}
      
      <View style={[
        styles.messageBubble,
        item.sender === 'user' 
          ? [styles.userBubble, isDark && styles.userBubbleDark]
          : [styles.aiBubble, isDark && styles.aiBubbleDark]
      ]}>
        <Text style={[
          styles.messageText,
          item.sender === 'user' 
            ? styles.userMessageText
            : [styles.aiMessageText, isDark && styles.aiMessageTextDark]
        ]}>
          {item.text}
        </Text>
        <Text style={[
          styles.timestamp,
          item.sender === 'user' 
            ? styles.userTimestamp
            : [styles.aiTimestamp, isDark && styles.aiTimestampDark]
        ]}>
          {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    </Animated.View>
  );

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      <HealthGradientBackground isDark={isDark} />
      <StatusBar 
        barStyle={isDark ? "light-content" : "dark-content"} 
        backgroundColor="transparent" 
        translucent 
      />
      
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <Animated.View 
          style={styles.header}
          entering={FadeInDown.delay(100).duration(600)}
        >
          <View style={styles.headerContent}>
            <View style={[styles.headerAvatar, isDark && styles.headerAvatarDark]}>
              <Ionicons name="sparkles" size={24} color="#007AFF" />
            </View>
            <View style={styles.headerText}>
              <Text style={[styles.headerTitle, isDark && styles.headerTitleDark]}>
                Ava
              </Text>
              <View style={styles.statusRow}>
                <View style={styles.statusDot} />
                <Text style={[styles.statusText, isDark && styles.statusTextDark]}>
                  Online
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>

        <KeyboardAvoidingView
          style={styles.keyboardAvoidingView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          {/* Messages */}
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.messagesContainer}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
            style={styles.messagesList}
            showsVerticalScrollIndicator={false}
          />

          {/* Typing Indicator */}
          {isTyping && (
            <Animated.View 
              style={styles.typingContainer}
              entering={FadeInUp.duration(300)}
            >
              <View style={[styles.avatarContainer, isDark && styles.avatarContainerDark]}>
                <Ionicons name="sparkles" size={16} color="#007AFF" />
              </View>
              <View style={[styles.typingBubble, isDark && styles.typingBubbleDark]}>
                <ActivityIndicator size="small" color="#007AFF" />
                <Text style={[styles.typingText, isDark && styles.typingTextDark]}>
                  Ava is writing...
                </Text>
              </View>
            </Animated.View>
          )}

          {/* Input Area */}
          <View style={[styles.inputContainer, isDark && styles.inputContainerDark]}>
            <View style={styles.inputRow}>
              <TextInput
                style={[styles.textInput, isDark && styles.textInputDark]}
                placeholder="Share your thoughts..."
                placeholderTextColor={isDark ? '#8E8E93' : '#9CA3AF'}
                value={inputText}
                onChangeText={setInputText}
                multiline
                maxLength={1000}
              />
              
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  (!inputText.trim() || isTyping) && styles.sendButtonDisabled
                ]}
                onPress={sendMessage}
                disabled={!inputText.trim() || isTyping}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={(!inputText.trim() || isTyping) 
                    ? ['#C7C7CC', '#C7C7CC'] 
                    : ['#007AFF', '#34C759']
                  }
                  style={styles.sendButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons
                    name="arrow-up"
                    size={20}
                    color="white"
                  />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  containerDark: {
    backgroundColor: '#000000',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  headerAvatarDark: {
    backgroundColor: '#1C1C1E',
    borderColor: '#38383A',
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
    letterSpacing: -0.3,
  },
  headerTitleDark: {
    color: '#FFFFFF',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#34C759',
    marginRight: 6,
  },
  statusText: {
    fontSize: 15,
    color: '#8E8E93',
    fontWeight: '500',
  },
  statusTextDark: {
    color: '#8E8E93',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  messagesList: {
    flex: 1,
  },
  messagesContainer: {
    paddingVertical: 8,
    paddingBottom: 20,
  },
  messageContainer: {
    flexDirection: 'row',
    marginVertical: 3,
    paddingHorizontal: 20,
  },
  userMessageContainer: {
    justifyContent: 'flex-end',
  },
  aiMessageContainer: {
    justifyContent: 'flex-start',
  },
  avatarContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginTop: 2,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  avatarContainerDark: {
    backgroundColor: '#1C1C1E',
    borderColor: '#38383A',
  },
  messageBubble: {
    maxWidth: '75%',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  userBubble: {
    backgroundColor: '#007AFF',
    borderBottomRightRadius: 4,
  },
  userBubbleDark: {
    backgroundColor: '#0A84FF',
  },
  aiBubble: {
    backgroundColor: '#F2F2F7',
    borderBottomLeftRadius: 4,
  },
  aiBubbleDark: {
    backgroundColor: '#1C1C1E',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '400',
  },
  userMessageText: {
    color: '#FFFFFF',
  },
  aiMessageText: {
    color: '#000000',
  },
  aiMessageTextDark: {
    color: '#FFFFFF',
  },
  timestamp: {
    fontSize: 12,
    marginTop: 4,
    alignSelf: 'flex-end',
    fontWeight: '500',
  },
  userTimestamp: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  aiTimestamp: {
    color: '#8E8E93',
  },
  aiTimestampDark: {
    color: '#8E8E93',
  },
  typingContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  typingBubble: {
    backgroundColor: '#F2F2F7',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomLeftRadius: 4,
  },
  typingBubbleDark: {
    backgroundColor: '#1C1C1E',
  },
  typingText: {
    color: '#8E8E93',
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  typingTextDark: {
    color: '#8E8E93',
  },
  inputContainer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 0.5,
    borderTopColor: '#E5E5EA',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputContainerDark: {
    backgroundColor: '#000000',
    borderTopColor: '#38383A',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    color: '#000000',
    maxHeight: 100,
    fontWeight: '400',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  textInputDark: {
    backgroundColor: '#1C1C1E',
    color: '#FFFFFF',
    borderColor: '#38383A',
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
});