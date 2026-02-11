import TestGeneratorCard from '@/components/practice/TestGeneratorCard';
import { useRouter } from 'expo-router';
import React from 'react';
import { Platform, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';

export default function PracticeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Practice Hub</Text>
        <Text style={styles.headerSubtitle}>Master your subjects with AI tools</Text>
      </View>
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <TestGeneratorCard 
            onPress={() => router.push('/(tabs)/(practice)/test-gen')} 
        />
        
        {/* Placeholder for future tools */}
        <View style={styles.comingSoon}>
            <Text style={styles.comingSoonTitle}>More Coming Soon</Text>
            <Text style={styles.comingSoonDesc}>Flashcards, Quizzes, and more.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
      paddingHorizontal: 20,
      paddingBottom: 20,
      paddingTop: 20,
      backgroundColor: '#FFF',
      borderBottomWidth: 1,
      borderBottomColor: '#F3F4F6',
  },
  headerTitle: {
      fontSize: 28,
      fontWeight: 'bold',
      color: '#111827',
  },
  headerSubtitle: {
      fontSize: 16,
      color: '#6B7280',
      marginTop: 4,
  },
  scrollContent: {
    paddingVertical: 16,
  },
  comingSoon: {
      margin: 20,
      padding: 20,
      borderWidth: 1,
      borderColor: '#E5E7EB',
      borderRadius: 16,
      borderStyle: 'dashed',
      alignItems: 'center',
  },
  comingSoonTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: '#9CA3AF',
  },
  comingSoonDesc: {
      fontSize: 14,
      color: '#D1D5DB',
      marginTop: 4,
  }
});
