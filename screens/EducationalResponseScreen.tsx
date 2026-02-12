import { Ionicons } from "@expo/vector-icons";
import { ResizeMode, Video } from "expo-av";
import React, { useMemo } from "react";
import {
  FlatList,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import CodeBlock from "@/components/CodeBlock";
import FormulaBlock from "@/components/FormulaBlock";
import { parseBody, ParsedParagraph, Segment } from "@/utils/parseBody";

export type StructuredOutput = {
  title: string;
  body: string;
  links: string[];
  Need_of_manim: "YES" | "NO";
  manim_video_path: string;
  next_related_topic: string[];
  next_questions: string[];
};

export interface EducationalResponseScreenProps {
  structuredOutput: StructuredOutput;
  onFollowUpQuestionPress?: (question: string) => void;
  onRelatedTopicPress?: (topic: string) => void;
}

export default function EducationalResponseScreen({
  structuredOutput,
  onFollowUpQuestionPress,
  onRelatedTopicPress,
}: EducationalResponseScreenProps) {
  const paragraphs = useMemo<ParsedParagraph[]>(
    () => parseBody(structuredOutput.body),
    [structuredOutput.body],
  );

  const hasVideo =
    structuredOutput.Need_of_manim === "YES" &&
    typeof structuredOutput.manim_video_path === "string" &&
    structuredOutput.manim_video_path.startsWith("http");

  const renderSegment = (segment: Segment, index: number) => {
    switch (segment.type) {
      case "code":
        return <CodeBlock key={index} code={segment.content} />;
      case "formula":
        return <FormulaBlock key={index} formula={segment.content} />;
      case "text":
      default:
        if (!segment.content.trim()) return null;
        return (
          <Text key={index} style={styles.text}>
            {segment.content}
          </Text>
        );
    }
  };

  const renderParagraph = ({
    item,
    index,
  }: {
    item: ParsedParagraph;
    index: number;
  }) => {
    if (!item.segments.length) return null;
    return (
      <View key={index} style={styles.paragraph}>
        {item.segments.map((segment, i) => renderSegment(segment, i))}
      </View>
    );
  };

  const Header = () => (
    <View style={styles.headerContainer}>
      <Text style={styles.title}>{structuredOutput.title}</Text>
      {hasVideo && (
        <View style={styles.videoContainer}>
          <Video
            source={{ uri: structuredOutput.manim_video_path }}
            style={styles.video}
            useNativeControls
            resizeMode={ResizeMode.CONTAIN}
          />
        </View>
      )}
    </View>
  );

  const Footer = () => (
    <View style={styles.footerContainer}>
      {structuredOutput.links && structuredOutput.links.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resources</Text>
          {structuredOutput.links.map((link) => (
            <TouchableOpacity
              key={link}
              style={styles.linkButton}
              onPress={async () => {
                try {
                  await Linking.openURL(link);
                } catch {
                  // best-effort only
                }
              }}
            >
              <Text style={styles.linkText}>{link}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {structuredOutput.next_related_topic &&
        structuredOutput.next_related_topic.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Related Topics</Text>
            <View style={styles.chipRow}>
              {structuredOutput.next_related_topic.map((topic) => (
                <TouchableOpacity
                  key={topic}
                  style={styles.topicChip}
                  onPress={() => onRelatedTopicPress?.(topic)}
                >
                  <Ionicons
                    name="school-outline"
                    size={14}
                    color="#4338CA"
                    style={{ marginRight: 6 }}
                  />
                  <Text style={styles.topicChipText}>{topic}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

      {structuredOutput.next_questions &&
        structuredOutput.next_questions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Next Questions</Text>
            <View style={styles.chipRow}>
              {structuredOutput.next_questions.map((q) => (
                <TouchableOpacity
                  key={q}
                  style={styles.questionChip}
                  onPress={() => onFollowUpQuestionPress?.(q)}
                >
                  <Ionicons
                    name="help-circle-outline"
                    size={14}
                    color="#0F766E"
                    style={{ marginRight: 6 }}
                  />
                  <Text style={styles.questionChipText}>{q}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
    </View>
  );

  if (paragraphs.length > 20) {
    return (
      <FlatList
        data={paragraphs}
        keyExtractor={(_, index) => String(index)}
        renderItem={renderParagraph}
        ListHeaderComponent={<Header />}
        ListFooterComponent={<Footer />}
        contentContainerStyle={styles.contentContainer}
      />
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.contentContainer}>
      <Header />
      {paragraphs.map((p, index) => renderParagraph({ item: p, index }))}
      <Footer />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    padding: 16,
    paddingBottom: 24,
  },
  headerContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
  },
  videoContainer: {
    width: "100%",
    aspectRatio: 16 / 9,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#000",
  },
  video: {
    width: "100%",
    height: "100%",
  },
  paragraph: {
    marginBottom: 12,
  },
  text: {
    fontSize: 15,
    lineHeight: 22,
    color: "#1F2937",
  },
  footerContainer: {
    marginTop: 16,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4B5563",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  linkButton: {
    paddingVertical: 8,
  },
  linkText: {
    fontSize: 14,
    color: "#2563EB",
    textDecorationLine: "underline",
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -4,
  },
  topicChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#EEF2FF",
    borderWidth: 1,
    borderColor: "#C7D2FE",
    marginHorizontal: 4,
    marginVertical: 4,
    flexDirection: "row",
    alignItems: "center",
  },
  topicChipText: {
    fontSize: 13,
    color: "#4338CA",
    fontWeight: "500",
  },
  questionChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#ECFEFF",
    borderWidth: 1,
    borderColor: "#A5F3FC",
    marginHorizontal: 4,
    marginVertical: 4,
    flexDirection: "row",
    alignItems: "center",
  },
  questionChipText: {
    fontSize: 13,
    color: "#0F766E",
    fontWeight: "500",
  },
});
