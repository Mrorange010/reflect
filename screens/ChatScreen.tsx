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

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      sender: 'user',
      timestamp: new Date(),
      status: 'sending',
    };

    setMessages(prev => [...prev, newMessage]);
    setInputText('');
    
    // Simulate AI typing
    setIsTyping(true);
    
    // TODO: Implement actual AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: "I'm here to help you reflect on your day. How are you feeling?",
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View style={{
      flexDirection: 'row',
      marginVertical: 4,
      paddingHorizontal: 16,
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
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <LinearGradient
          colors={['#F9FAFB', '#F3F4F6']}
          style={{ flex: 1 }}
        >
          {/* Header */}
          <View style={{
            backgroundColor: 'white',
            paddingBottom: 16,
            paddingHorizontal: 16,
            borderBottomWidth: 1,
            borderBottomColor: '#E5E7EB',
            flexDirection: 'row',
            alignItems: 'center',
          }}>
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
                color: '#1F2937',
              }}>
                ReflectAI
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: '#10B981',
                  borderWidth: 1,
                  borderColor: 'white',
                  marginRight: 6,
                }} />
                <Text style={{
                  fontSize: 14,
                  color: '#6B7280',
                  fontWeight: '500',
                }}>
                  Online
                </Text>
              </View>
            </View>
          </View>

          {/* Messages List */}
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={item => item.id}
            contentContainerStyle={{ paddingVertical: 16 }}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
            onLayout={() => flatListRef.current?.scrollToEnd()}
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
  );
} 