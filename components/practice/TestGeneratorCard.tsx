import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface TestGeneratorCardProps {
  onPress: () => void;
}

export default function TestGeneratorCard({ onPress }: TestGeneratorCardProps) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={styles.container}>
      <LinearGradient
        colors={['#4F46E5', '#7C3AED']} // Indigo to Violet
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <View style={styles.textContainer}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>AI Powered</Text>
            </View>
            <Text style={styles.title}>Test Generator</Text>
            <Text style={styles.description}>
              Create personalized practice exams instantly. Choose any topic, difficulty, and format.
            </Text>
            <View style={styles.button}>
                <Text style={styles.buttonText}>Start Now</Text>
                <Ionicons name="arrow-forward" size={16} color="#4F46E5" />
            </View>
          </View>
          <View style={styles.iconContainer}>
              <Ionicons name="school-outline" size={80} color="rgba(255,255,255,0.2)" />
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 24,
    shadowColor: "#4F46E5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  gradient: {
    padding: 24,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textContainer: {
    flex: 1,
    paddingRight: 16,
  },
  badge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 20,
    lineHeight: 20,
  },
  button: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FFF',
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 20,
      alignSelf: 'flex-start',
  },
  buttonText: {
      color: '#4F46E5',
      fontWeight: 'bold',
      fontSize: 14,
      marginRight: 4,
  },
  iconContainer: {
      position: 'absolute',
      right: -20,
      bottom: -20,
      transform: [{ rotate: '-15deg' }],
  },
});
