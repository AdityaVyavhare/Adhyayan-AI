import { RootState } from '@/store/store';
import { SignedOut } from '@clerk/clerk-expo';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import React from 'react';
import {
    Dimensions,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';

// Quick Action Data
const QuickActions = [
  {
    icon: 'line-scan',
    label: 'Scan Question',
    color: '#6C5CE7',
    library: 'MaterialCommunityIcons',
    bgColor: '#EEF2FF',
  },
  {
    icon: 'file-pdf-box',
    label: 'Upload PDF',
    color: '#A29BFE',
    library: 'MaterialCommunityIcons',
    bgColor: '#F3E5F5',
  },
  {
    icon: 'youtube',
    label: 'Learn from YT',
    color: '#FF7675',
    library: 'MaterialCommunityIcons',
    bgColor: '#FFF0F0',
  },
  {
    icon: 'microphone',
    label: 'Podcast',
    color: '#00B894',
    library: 'MaterialCommunityIcons',
    bgColor: '#E6FFFA',
  },
];

// Continue Learning Data
const LearningCourses = [
  {
    id: 1,
    title: 'Physics: Motion',
    chapter: 'Chapter 4',
    timeLeft: '20 mins left',
    progress: 0.6,
    imageColor: '#000022', // Placeholder for image
    icon: 'atom',
  },
  {
    id: 2,
    title: 'Math: Geometry',
    chapter: 'Chapter 2',
    timeLeft: 'Just started',
    progress: 0.1,
    imageColor: '#2D3436', // Placeholder for image
    icon: 'shape-outline',
  },
];

export default function HomeScreen() {
  const { user } = useSelector((state: RootState) => state.profile);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {/* Header Section */}
        <View style={styles.header}>
          <Link href="/(tabs)/(profile)" asChild>
              <TouchableOpacity style={styles.headerLeft}>
                <Image
                  source={{ uri: user?.avatarUrl || 'https://i.pravatar.cc/150?u=User' }} 
                  style={styles.avatar}
                />
                <View>
                  <Text style={styles.greetingTitle}>Hi, {user?.username || user?.firstName || 'Learner'}</Text>
                  <Text style={styles.greetingSubtitle}>Ready to learn?</Text>
                </View>
              </TouchableOpacity>
          </Link>
          <View style={styles.streakBadge}>
            <MaterialCommunityIcons name="fire" size={16} color="#FF5252" />
            <Text style={styles.streakText}>12 Days</Text>
          </View>
        </View>

        {/* Input / Ask Doubt Section */}
        <Link href="/(tabs)/(home)/chat" asChild>
          <TouchableOpacity style={styles.searchContainer}>
            <MaterialCommunityIcons name="creation" size={24} color="#4895EF" />
            <Text style={styles.placeholderText}>Ask a doubt or explain a concept...</Text>
            <Ionicons name="mic-outline" size={24} color="#4B5563" />
          </TouchableOpacity>
        </Link>

        {/* Quick Actions Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            {QuickActions.map((action, index) => {
              let href = '';
              if (action.label === 'Scan Question') href = '/(tabs)/(home)/scan-question';
              else if (action.label === 'Upload PDF') href = '/(tabs)/(home)/pdf-chat';
              else if (action.label === 'Learn from YT') href = '/(tabs)/(home)/youtube-learning';
              else if (action.label === 'Podcast') href = '/(tabs)/(home)/podcast';

              return (
                  <Link key={index} href={href as any} asChild>
                      <TouchableOpacity style={styles.actionCard}>
                        <View style={[styles.actionIconContainer, { backgroundColor: action.bgColor }]}>
                          {action.library === 'MaterialCommunityIcons' ? (
                            <MaterialCommunityIcons
                              name={action.icon as any}
                              size={24}
                              color={action.color}
                            />
                          ) : (
                            <Ionicons name={action.icon as any} size={24} color={action.color} />
                          )}
                        </View>
                        <Text style={styles.actionLabel}>{action.label}</Text>
                      </TouchableOpacity>
                  </Link>
              );
            })}
          </View>
        </View>

        {/* Continue Learning Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Continue Learning</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {LearningCourses.map((course) => (
            <TouchableOpacity key={course.id} style={styles.courseCard}>
              <View style={[styles.courseThumbnail, { backgroundColor: course.imageColor }]}>
                <MaterialCommunityIcons name={course.icon as any} size={32} color="white" />
              </View>
              <View style={styles.courseInfo}>
                <Text style={styles.courseTitle}>{course.title}</Text>
                <Text style={styles.courseSubtitle}>
                  {course.chapter} • {course.timeLeft}
                </Text>
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: `${course.progress * 100}%` }]} />
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Signed Out Fallback */}
        <SignedOut>
          <View style={styles.authPrompt}>
            <Text style={styles.authPromptText}>Please sign in to access full features.</Text>
            <Link href="/(auth)/sign-in" asChild>
              <TouchableOpacity style={styles.signInButton}>
                <Text style={styles.signInButtonText}>Sign In</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </SignedOut>
      </ScrollView>
    </SafeAreaView>
  );
}

const { width } = Dimensions.get('window');
const cardWidth = (width - 48) / 2; // 2 columns with padding

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB', // Light off-white background
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100, // Extra padding for bottom tab bar
  },
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E5E7EB',
  },
  greetingTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  greetingSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF1F2', // Light pink/red bg
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  streakText: {
    color: '#E11D48',
    fontWeight: '600',
    fontSize: 13,
  },
  // Search Bar
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    marginBottom: 32,
    // Soft shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    marginHorizontal: 12,
    fontSize: 15,
    color: '#374151',
  },
  placeholderText: {
    flex: 1,
    marginHorizontal: 12,
    fontSize: 15,
    color: '#9CA3AF',
  },
  // Sections
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  viewAllText: {
    color: '#3B82F6',
    fontWeight: '600',
    fontSize: 14,
  },
  // Quick Actions
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  actionCard: {
    width: cardWidth,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    // Soft shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    textAlign: 'center',
  },
  // Course Cards
  courseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
    // Soft shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  courseThumbnail: {
    width: 56,
    height: 56,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  courseInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  courseTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  courseSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 8,
  },
  progressBarBg: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    width: '100%',
    maxWidth: 150,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#2563EB', // Primary Blue
    borderRadius: 2,
  },
  // Auth Prompt
  authPrompt: {
    alignItems: 'center',
    marginTop: 20,
    padding: 20,
  },
  authPromptText: {
    color: '#6B7280',
    marginBottom: 10,
  },
  signInButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  signInButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
