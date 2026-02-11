import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, View } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
    
      screenOptions={{
        tabBarActiveTintColor: '#1F2937', // Dark color for active label
        tabBarInactiveTintColor: '#687076',
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: Platform.select({
          ios: {
            position: 'absolute',
          },
          default: {},
        }),
      }}>
      <Tabs.Screen
        name="(home)"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => (
            <View style={{
              backgroundColor: focused ? '#1F2937' : 'transparent',
              borderRadius: 16,
              paddingVertical: 2,
              width: 40,
              alignItems: 'center'
            }}>
              <IconSymbol size={24} name="house.fill" color={focused ? '#FFF' : '#687076'} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="(learn)"
        options={{
          title: 'Learn',
          tabBarIcon: ({ focused }) => (
            <View style={{
               backgroundColor: focused ? '#1F2937' : 'transparent',
               borderRadius: 16,
               paddingVertical: 2,
               width: 40,
               alignItems: 'center'
            }}>
              <IconSymbol size={24} name="book.fill" color={focused ? '#FFF' : '#687076'} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="(practice)"
        options={{
          title: 'Practice',
          tabBarIcon: ({ focused }) => (
             <View style={{
               backgroundColor: focused ? '#1F2937' : 'transparent',
               borderRadius: 16,
               paddingVertical: 2,
               width: 40,
               alignItems: 'center'
            }}>
              <IconSymbol size={24} name="puzzlepiece.fill" color={focused ? '#FFF' : '#687076'} />
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="(live)"
        options={{
          title: 'Live',
          tabBarIcon: ({ focused }) => (
             <View style={{
               backgroundColor: focused ? '#1F2937' : 'transparent',
               borderRadius: 16,
               paddingVertical: 2,
               width: 40,
               alignItems: 'center'
            }}>
              <IconSymbol size={24} name="play.tv.fill" color={focused ? '#FFF' : '#687076'} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="(profile)"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => (
             <View style={{
               backgroundColor: focused ? '#1F2937' : 'transparent',
               borderRadius: 16,
               paddingVertical: 2,
               width: 40,
               alignItems: 'center'
            }}>
              <IconSymbol size={24} name="person.fill" color={focused ? '#FFF' : '#687076'} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}  