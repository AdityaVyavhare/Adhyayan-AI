import ToolHeader from '@/components/ui/ToolHeader';
import { ChatService } from '@/services/ChatService';
import { useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function TestConfigScreen() {
  const router = useRouter();
  const { user } = useUser();
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [numQuestions, setNumQuestions] = useState('5');
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['mcq']);
  const [isGenerating, setIsGenerating] = useState(false);

  const toggleType = (type: string) => {
    setSelectedTypes(prev => {
        if (prev.includes(type)) {
            // Prevent unselecting the last one
            if (prev.length === 1) return prev;
            return prev.filter(t => t !== type);
        }
        return [...prev, type];
    });
  };

  const handleGenerate = async () => {
      if (!topic.trim()) return;
      setIsGenerating(true);
      try {
          const result = await ChatService.generateTest(
             user?.primaryEmailAddress?.emailAddress || 'test_user',
             topic,
             difficulty,
             parseInt(numQuestions) || 5,
             selectedTypes
          );
          console.log("TestConfig: Generating with types:", selectedTypes);
          
          // Pass result to session screen via params or global store/context
          // For now, let's pass loosely via params if small, or store in a temp state
          // Ideally: router.push({ pathname: '/...', params: { testData: JSON.stringify(result) } })
          router.push({
              pathname: '/(tabs)/(practice)/test-gen/session/[id]',
              params: { id: result.test_id, testData: JSON.stringify(result) }
          });
      } catch (error) {
          console.error(error);
          alert("Failed to generate test. Please try again.");
      } finally {
          setIsGenerating(false);
      }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ToolHeader 
          title="New Test" 
          onClose={() => router.back()} 
          onHistory={() => router.push('/(tabs)/(practice)')} 
          mode="tool"
      />
      
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerSection}>
            <Text style={styles.title}>Customize Your Test</Text>
            <Text style={styles.subtitle}>
                Set your preferences and let AI generate a personalized practice exam for you.
            </Text>
        </View>

        <View style={styles.formSection}>
            <Text style={styles.label}>TOPIC OR SUBJECT</Text>
            <TextInput 
                style={styles.input} 
                placeholder="e.g. Kinematics, Organic Chemistry"
                value={topic}
                onChangeText={setTopic}
            />

            <Text style={styles.label}>DIFFICULTY LEVEL</Text>
            <View style={styles.segmentControl}>
                {(['easy', 'medium', 'hard'] as const).map((level) => (
                    <TouchableOpacity 
                        key={level}
                        style={[styles.segmentBtn, difficulty === level && styles.segmentBtnActive]}
                        onPress={() => setDifficulty(level)}
                    >
                        <Text style={[styles.segmentText, difficulty === level && styles.segmentTextActive]}>
                            {level.charAt(0).toUpperCase() + level.slice(1)}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <Text style={styles.label}>NUMBER OF QUESTIONS</Text>
            <TextInput 
                style={styles.input} 
                value={numQuestions}
                onChangeText={setNumQuestions}
                keyboardType="numeric"
                maxLength={2}
            />

            <Text style={styles.label}>QUESTION TYPES</Text>
            <View style={styles.grid}>
                {[
                    { id: 'mcq', label: 'MCQ', icon: 'checkbox' },
                    { id: 'short', label: 'Short Ans', icon: 'text' },
                    { id: 'numerical', label: 'Numerical', icon: 'calculator' }
                ].map((type) => {
                    const isSelected = selectedTypes.includes(type.id);
                    return (
                        <TouchableOpacity 
                            key={type.id}
                            style={[styles.typeCard, isSelected && styles.typeCardActive]}
                            onPress={() => toggleType(type.id)}
                        >
                            <Ionicons 
                                name={isSelected ? "checkmark-circle" : "ellipse-outline"} 
                                size={20} 
                                color={isSelected ? "#4F46E5" : "#D1D5DB"} 
                                style={styles.checkIcon}
                            />
                            <Ionicons 
                                name={type.icon as any} 
                                size={24} 
                                color={isSelected ? "#4F46E5" : "#6B7280"} 
                            />
                            <Text style={[styles.typeLabel, isSelected && styles.typeLabelActive]}>
                                {type.label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>

        <TouchableOpacity 
            style={[styles.generateBtn, (!topic.trim() || isGenerating) && styles.generateBtnDisabled]}
            onPress={handleGenerate}
            disabled={!topic.trim() || isGenerating}
        >
            {isGenerating ? (
                <ActivityIndicator color="#FFF" />
            ) : (
                <>
                    <Ionicons name="sparkles" size={20} color="#FFF" style={{marginRight: 8}} />
                    <Text style={styles.generateBtnText}>Generate Test</Text>
                </>
            )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // Spec: "UI: Light Theme (White background)." -> I will follow Spec.
    backgroundColor: '#FFFFFF',
  },
  content: {
    padding: 24,
  },
  headerSection: {
      marginBottom: 32,
      alignItems: 'center',
  },
  title: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#111827',
      marginBottom: 8,
  },
  subtitle: {
      fontSize: 14,
      color: '#6B7280',
      textAlign: 'center',
      lineHeight: 20,
  },
  formSection: {
      marginBottom: 32,
  },
  label: {
      fontSize: 12,
      fontWeight: '700',
      color: '#374151',
      marginBottom: 8,
      marginTop: 20,
      letterSpacing: 0.5,
  },
  input: {
      backgroundColor: '#F3F4F6',
      borderRadius: 12,
      padding: 16,
      fontSize: 16,
      color: '#111827',
      borderWidth: 1,
      borderColor: '#E5E7EB',
  },
  segmentControl: {
      flexDirection: 'row',
      backgroundColor: '#F3F4F6',
      borderRadius: 12,
      padding: 4,
  },
  segmentBtn: {
      flex: 1,
      paddingVertical: 10,
      alignItems: 'center',
      borderRadius: 8,
  },
  segmentBtnActive: {
      backgroundColor: '#111827', // Dark for active state
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
  },
  segmentText: {
      fontSize: 14,
      fontWeight: '500',
      color: '#6B7280',
  },
  segmentTextActive: {
      color: '#FFFFFF',
  },
  grid: {
      flexDirection: 'row',
      gap: 12,
  },
  typeCard: {
      flex: 1,
      aspectRatio: 1,
      backgroundColor: '#F9FAFB',
      borderRadius: 16,
      borderWidth: 2,
      borderColor: '#F3F4F6',
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative',
  },
  typeCardActive: {
      borderColor: '#4F46E5',
      backgroundColor: '#EEF2FF',
  },
  checkIcon: {
      position: 'absolute',
      top: 8,
      right: 8,
  },
  typeLabel: {
      marginTop: 8,
      fontSize: 12,
      fontWeight: '600',
      color: '#6B7280',
  },
  typeLabelActive: {
      color: '#4F46E5',
  },
  generateBtn: {
      backgroundColor: '#4F46E5',
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 18,
      borderRadius: 16,
      shadowColor: "#4F46E5",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 4,
  },
  generateBtnDisabled: {
      backgroundColor: '#A5B4FC',
      shadowOpacity: 0,
  },
  generateBtnText: {
      color: '#FFF',
      fontSize: 16,
      fontWeight: 'bold',
  },
});
