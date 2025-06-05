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
  Image,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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

export default function ChatScreen() {
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

  // Removed old saveDailyLog - this is now handled by the Edge Function

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
      status: 'sending', // Or 'sent' once confirmed by API
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
          conversationHistory: updatedHistoryForAI, // Send the history
        },
      });

      if (edgeFunctionError) {
        throw edgeFunctionError;
      }

      if (edgeFunctionResponse && edgeFunctionResponse.reply) {
        const aiResponse: Message = {
          id: (Date.now() + 1).toString(),
          text: edgeFunctionResponse.reply, // Response from Edge Function
          sender: 'ai',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, aiResponse]);
        // Add AI's response to conversation history
        setConversationHistoryForAI(prevHistory => [...prevHistory, { role: 'assistant' as const, content: edgeFunctionResponse.reply.replace(/^Ava: /, '') }]);
      } else {
        console.error('Invalid response from Edge Function:', edgeFunctionResponse);
        // Handle missing reply, maybe show a default error message to user
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

  const renderMessage = ({ item }: { item: Message }) => (
    <View style={{
      flexDirection: 'row',
      marginVertical: 4,
      paddingHorizontal:20,
      justifyContent: item.sender === 'user' ? 'flex-end' : 'flex-start',
    }}>
      <View style={{
        maxWidth: '80%',
        backgroundColor: item.sender === 'user' ? '#6366F1' : '#F3F4F6',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderTopRightRadius: item.sender === 'user' ? 4 : 20,
        borderTopLeftRadius: item.sender === 'user' ? 20 : 4,
      }}>
        <Text style={{
          color: item.sender === 'user' ? 'white' : '#1F2937',
          fontSize: 16,
          lineHeight: 22,
        }}>
          {item.text}
        </Text>
        <Text style={{
          color: item.sender === 'user' ? 'rgba(255, 255, 255, 0.7)' : '#6B7280',
          fontSize: 12,
          marginTop: 4,
          alignSelf: 'flex-end',
        }}>
          {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient
        colors={['#667EEA', '#764BA2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ paddingBottom: 16, paddingHorizontal: 16, paddingTop: 60 }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {/* Avatar */}
          <View style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: '#6366F1',
            marginRight: 12,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 2,
          }}>
            <Ionicons name="sparkles" size={24} color="white" />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={{
              fontSize: 20,
              fontWeight: '600',
              color: 'white',
            }}>
              ReflectAI
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: '#34D399',
                borderWidth: 1,
                borderColor: 'white',
                marginRight: 6,
              }} />
              <Text style={{
                fontSize: 14,
                color: 'rgba(255,255,255,0.85)',
                fontWeight: '500',
              }}>
                Online
              </Text>
            </View>
          </View>
        </View>
      </LinearGradient>
      <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 20 : 0}
        >
          <LinearGradient
            colors={['#F9FAFB', '#F3F4F6']}
            style={{ flex: 1 }}
          >
            {/* Messages List */}
            <FlatList
              ref={flatListRef}
              data={messages}
              renderItem={renderMessage}
              keyExtractor={item => item.id}
              contentContainerStyle={{ paddingVertical: 16 }}
              onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
              onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
              style={{ flex: 1 }}
            />
            {/* Typing Indicator */}
            {isTyping && (
              <View style={{
                paddingHorizontal: 16,
                paddingVertical: 8,
                flexDirection: 'row',
                alignItems: 'center',
              }}>
                <View style={{
                  backgroundColor: '#F3F4F6',
                  borderRadius: 20,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}>
                  <ActivityIndicator size="small" color="#6366F1" />
                  <Text style={{
                    color: '#6B7280',
                    marginLeft: 8,
                    fontSize: 14,
                  }}>
                    AI is typing...
                  </Text>
                </View>
              </View>
            )}
            {/* Input Area */}
            <View style={{
              backgroundColor: 'white',
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderTopWidth: 1,
              borderTopColor: '#E5E7EB',
              flexDirection: 'row',
              alignItems: 'center',
              ...Platform.select({
                ios: {
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: -2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                },
                android: {
                  elevation: 4,
                },
              }),
            }}>
              <TextInput
                style={{
                  flex: 1,
                  backgroundColor: '#F3F4F6',
                  borderRadius: 20,
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  fontSize: 16,
                  color: '#1F2937',
                  maxHeight: 100,
                  marginRight: 8,
                }}
                placeholder="Share your thoughts..."
                placeholderTextColor="#9CA3AF"
                value={inputText}
                onChangeText={setInputText}
                multiline
              />
              
              <TouchableOpacity
                style={{
                  backgroundColor: '#6366F1',
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onPress={sendMessage}
                disabled={!inputText.trim()}
              >
                <Ionicons
                  name="send"
                  size={20}
                  color="white"
                  style={{ marginLeft: 2 }}
                />
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
} 