import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Dummy Course Data
const FeaturedCourses = [
  {
    id: 1,
    title: "Advanced Mathematics",
    instructor: "Dr. Sarah Johnson",
    progress: 65,
    thumbnail: "#4F46E5",
    icon: "calculator",
    lessons: 24,
    duration: "8h 30m",
    category: "Mathematics",
  },
  {
    id: 2,
    title: "Physics for JEE",
    instructor: "Prof. Rajesh Kumar",
    progress: 40,
    thumbnail: "#7C3AED",
    icon: "atom",
    lessons: 32,
    duration: "12h 15m",
    category: "Physics",
  },
  {
    id: 3,
    title: "Organic Chemistry",
    instructor: "Dr. Priya Sharma",
    progress: 80,
    thumbnail: "#059669",
    icon: "flask",
    lessons: 28,
    duration: "10h 45m",
    category: "Chemistry",
  },
];

const Categories = [
  {
    id: 1,
    name: "Mathematics",
    icon: "calculator",
    color: "#3B82F6",
    count: 45,
  },
  { id: 2, name: "Physics", icon: "planet", color: "#8B5CF6", count: 38 },
  { id: 3, name: "Chemistry", icon: "flask", color: "#10B981", count: 42 },
  { id: 4, name: "Biology", icon: "leaf", color: "#EF4444", count: 35 },
  { id: 5, name: "English", icon: "book", color: "#F59E0B", count: 28 },
  { id: 6, name: "History", icon: "globe", color: "#6366F1", count: 22 },
];

const PopularTopics = [
  { id: 1, title: "Calculus", color: "#DBEAFE" },
  { id: 2, title: "Thermodynamics", color: "#E0E7FF" },
  { id: 3, title: "Electrochemistry", color: "#D1FAE5" },
  { id: 4, title: "Cell Biology", color: "#FEE2E2" },
  { id: 5, title: "Grammar", color: "#FEF3C7" },
];

export default function LearnScreen() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Learn & Grow</Text>
            <Text style={styles.subtitle}>Explore courses and topics</Text>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <Ionicons name="notifications-outline" size={24} color="#1F2937" />
            <View style={styles.notificationBadge} />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons
            name="search"
            size={20}
            color="#9CA3AF"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search courses, topics..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Categories Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Categories</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoriesScroll}
          >
            {Categories.map((category) => (
              <TouchableOpacity key={category.id} style={styles.categoryCard}>
                <View
                  style={[
                    styles.categoryIcon,
                    { backgroundColor: category.color + "20" },
                  ]}
                >
                  <Ionicons
                    name={category.icon as any}
                    size={24}
                    color={category.color}
                  />
                </View>
                <Text style={styles.categoryName}>{category.name}</Text>
                <Text style={styles.categoryCount}>
                  {category.count} courses
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Continue Learning Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Continue Learning</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {FeaturedCourses.map((course) => (
            <TouchableOpacity key={course.id} style={styles.courseCard}>
              <View
                style={[
                  styles.courseThumbnail,
                  { backgroundColor: course.thumbnail },
                ]}
              >
                <Ionicons name={course.icon as any} size={32} color="#FFF" />
              </View>
              <View style={styles.courseInfo}>
                <View style={styles.courseHeader}>
                  <Text style={styles.courseTitle}>{course.title}</Text>
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryBadgeText}>
                      {course.category}
                    </Text>
                  </View>
                </View>
                <Text style={styles.instructor}>
                  <Ionicons name="person-outline" size={12} color="#6B7280" />{" "}
                  {course.instructor}
                </Text>
                <View style={styles.courseStats}>
                  <View style={styles.statItem}>
                    <Ionicons
                      name="play-circle-outline"
                      size={14}
                      color="#6B7280"
                    />
                    <Text style={styles.statText}>
                      {course.lessons} lessons
                    </Text>
                  </View>
                  <View style={styles.statItem}>
                    <Ionicons name="time-outline" size={14} color="#6B7280" />
                    <Text style={styles.statText}>{course.duration}</Text>
                  </View>
                </View>
                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${course.progress}%` },
                      ]}
                    />
                  </View>
                  <Text style={styles.progressText}>{course.progress}%</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Popular Topics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Popular Topics</Text>
          <View style={styles.topicsContainer}>
            {PopularTopics.map((topic) => (
              <TouchableOpacity
                key={topic.id}
                style={[styles.topicChip, { backgroundColor: topic.color }]}
              >
                <Text style={styles.topicText}>{topic.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Study Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Progress</Text>
          <View style={styles.statsCard}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>12</Text>
              <Text style={styles.statLabel}>Courses</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statValue}>45h</Text>
              <Text style={styles.statLabel}>Learning Time</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statValue}>8</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  greeting: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111827",
  },
  subtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 4,
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  notificationBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#EF4444",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    marginHorizontal: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#111827",
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  viewAllText: {
    fontSize: 14,
    color: "#2563EB",
    fontWeight: "600",
  },
  categoriesScroll: {
    paddingLeft: 20,
  },
  categoryCard: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    width: 120,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  categoryIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  categoryCount: {
    fontSize: 12,
    color: "#6B7280",
  },
  courseCard: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 20,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  courseThumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  courseInfo: {
    flex: 1,
  },
  courseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  courseTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    flex: 1,
  },
  categoryBadge: {
    backgroundColor: "#DBEAFE",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  categoryBadgeText: {
    fontSize: 10,
    color: "#1E40AF",
    fontWeight: "600",
  },
  instructor: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 8,
  },
  courseStats: {
    flexDirection: "row",
    marginBottom: 8,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  statText: {
    fontSize: 12,
    color: "#6B7280",
    marginLeft: 4,
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: "#E5E7EB",
    borderRadius: 3,
    marginRight: 8,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#2563EB",
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#2563EB",
  },
  topicsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 20,
  },
  topicChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  topicText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
  },
  statsCard: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statBox: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 28,
    fontWeight: "700",
    color: "#2563EB",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#6B7280",
  },
  statDivider: {
    width: 1,
    backgroundColor: "#E5E7EB",
    marginHorizontal: 16,
  },
});
