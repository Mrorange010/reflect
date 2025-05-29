import { View, Text } from 'react-native';

export default function TestComponent() {
  return (
    <View className="flex-1 items-center justify-center bg-background p-4">
      <Text className="text-2xl font-bold text-primary mb-4">
        Welcome to ReflectAI
      </Text>
      <Text className="text-base text-gray-600">
        Your AI-powered reflection companion
      </Text>
    </View>
  );
} 