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
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';
import { supabase } from '../utils/supabase';
import { useFocusEffect } from '@react-navigation/native';
import { updateUserStreak } from '../utils/streak';

const { width } = Dimensions.get('window');

type Message = {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  status?: 'sending' | 'sent' | 'delivered' | 'read';
};

// Enhanced Apple Health-style gradient background
const HealthGradientBackground = ({ isDark }: { isDark: boolean }) => {
  return (
    <View style={StyleSheet.absoluteFillObject}>
      {/* Base background */}
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: isDark ? '#000000' : '#FFFFFF' }]} />
      
      {/* Sophisticated gradient overlay */}
      <LinearGradient
        colors={isDark 
          ? ['rgba(0, 122, 255, 0.15)', 'rgba(52, 199, 89, 0.08)', 'transparent'] as const
          : ['rgba(0, 122, 255, 0.08)', 'rgba(52, 199, 89, 0.04)', 'transparent'] as const
        }
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 250,
        }}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        locations={[0, 0.7, 1]}
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
          <LinearGradient
            colors={['#FF6B4D', '#FF7A59']}
            style={styles.avatarGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.avatarText}>A</Text>
          </LinearGradient>
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
        {/* Enhanced Header */}
        <Animated.View 
          style={styles.header}
          entering={FadeInDown.delay(100).duration(600)}
        >
          <View style={styles.headerContent}>
            <View style={[styles.headerAvatarContainer, isDark && styles.headerAvatarContainerDark]}>
              <LinearGradient
                colors={['#FF6B4D', '#FF7A59']}
                style={styles.headerAvatarGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.headerAvatarText}>A</Text>
              </LinearGradient>
            </View>
            <View style={styles.headerTextContainer}>
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

          {/* Enhanced Typing Indicator */}
          {isTyping && (
            <Animated.View 
              style={styles.typingContainer}
              entering={FadeInUp.duration(300)}
            >
              <View style={[styles.avatarContainer, isDark && styles.avatarContainerDark]}>
                <LinearGradient
                  colors={['#FF6B4D', '#FF7A59']}
                  style={styles.avatarGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.avatarText}>A</Text>
                </LinearGradient>
              </View>
              <View style={[styles.typingBubble, isDark && styles.typingBubbleDark]}>
                <ActivityIndicator size="small" color="#FF6B4D" />
                <Text style={[styles.typingText, isDark && styles.typingTextDark]}>
                  Ava is thinking...
                </Text>
              </View>
            </Animated.View>
          )}

          {/* Enhanced Input Area */}
          <View style={[styles.inputContainer, isDark && styles.inputContainerDark]}>
            <View style={styles.inputRow}>
              <View style={[styles.textInputContainer, isDark && styles.textInputContainerDark]}>
                <TextInput
                  style={[styles.textInput, isDark && styles.textInputDark]}
                  placeholder="Share your thoughts..."
                  placeholderTextColor={isDark ? '#8E8E93' : '#9CA3AF'}
                  value={inputText}
                  onChangeText={setInputText}
                  multiline
                  maxLength={1000}
                />
              </View>
              
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
                    : ['#FF6B4D', '#FF7A59']
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
    paddingTop: 24,
    paddingBottom: 24,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAvatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 16,
    shadowColor: '#FF6B4D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  headerAvatarContainerDark: {
    shadowColor: '#FF7A59',
  },
  headerAvatarGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: -0.5,
    marginBottom: 2,
  },
  headerTitleDark: {
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 6,
    letterSpacing: 0.1,
  },
  headerSubtitleDark: {
    color: '#9CA3AF',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  statusText: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  statusTextDark: {
    color: '#10B981',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  messagesList: {
    flex: 1,
  },
  messagesContainer: {
    paddingVertical: 12,
    paddingBottom: 24,
  },
  messageContainer: {
    flexDirection: 'row',
    marginVertical: 4,
    paddingHorizontal: 20,
  },
  userMessageContainer: {
    justifyContent: 'flex-end',
  },
  aiMessageContainer: {
    justifyContent: 'flex-start',
  },
  avatarContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
    marginTop: 4,
    shadowColor: '#FF6B4D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarContainerDark: {
    shadowColor: '#FF7A59',
  },
  avatarGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  messageBubble: {
    maxWidth: width * 0.75,
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  userBubble: {
    backgroundColor: '#007AFF',
    borderBottomRightRadius: 6,
  },
  userBubbleDark: {
    backgroundColor: '#0A84FF',
  },
  aiBubble: {
    backgroundColor: '#F8FAFC',
    borderBottomLeftRadius: 6,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  aiBubbleDark: {
    backgroundColor: '#1F2937',
    borderColor: '#374151',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
    letterSpacing: 0.1,
  },
  userMessageText: {
    color: '#FFFFFF',
  },
  aiMessageText: {
    color: '#374151',
  },
  aiMessageTextDark: {
    color: '#E5E7EB',
  },
  timestamp: {
    fontSize: 11,
    marginTop: 6,
    alignSelf: 'flex-end',
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  userTimestamp: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  aiTimestamp: {
    color: '#9CA3AF',
  },
  aiTimestampDark: {
    color: '#6B7280',
  },
  typingContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  typingBubble: {
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    borderBottomLeftRadius: 6,
    paddingHorizontal: 18,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  typingBubbleDark: {
    backgroundColor: '#1F2937',
    borderColor: '#374151',
  },
  typingText: {
    color: '#6B7280',
    marginLeft: 10,
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: 0.1,
  },
  typingTextDark: {
    color: '#9CA3AF',
  },
  inputContainer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  inputContainerDark: {
    backgroundColor: '#000000',
    borderTopColor: '#374151',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  textInputContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  textInputContainerDark: {
    backgroundColor: '#1F2937',
    borderColor: '#374151',
  },
  textInput: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    fontSize: 16,
    color: '#374151',
    maxHeight: 120,
    fontWeight: '400',
    letterSpacing: 0.1,
    lineHeight: 22,
  },
  textInputDark: {
    color: '#E5E7EB',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    shadowColor: '#FF6B4D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  sendButtonDisabled: {
    opacity: 0.6,
    shadowOpacity: 0.1,
  },
  sendButtonGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
});