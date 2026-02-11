import { Stack } from 'expo-router';
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function ChatLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
       <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" options={{ headerShown: false }} />
       </Stack>
    </GestureHandlerRootView>
  );
}
