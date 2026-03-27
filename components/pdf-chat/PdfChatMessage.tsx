import { Message } from "@/components/ai-assistant/ChatMessage";
import CodeBlock from "@/components/CodeBlock";
import FormulaBlock from "@/components/FormulaBlock";
import TypewriterEffect from "@/components/ui/TypewriterEffect";
import { parseBody, ParsedParagraph, Segment } from "@/utils/bodyParser";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import React, { useMemo } from "react";
import {
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Markdown from "react-native-markdown-display";

interface PdfChatMessageProps {
  message: Message;
  onChipPress?: (text: string) => void;
}

export default function PdfChatMessage({
  message,
  onChipPress,
}: PdfChatMessageProps) {
  // Unified role check
  const isUser = message.role === "human" || message.role === "user";

  const copyToClipboard = async () => {
    await Clipboard.setStringAsync(message.content || message.body || "");
  };

  if (isUser) {
    return (
      <View style={styles.userMessageContainer}>
        <Text style={styles.userMessageText}>{message.content || ""}</Text>
      </View>
    );
  }

  // AI Message - Rich Rendering
  const rawContent = message.body || message.content || "";
  const paragraphs: ParsedParagraph[] = useMemo(
    () => parseBody(rawContent),
    [rawContent],
  );
  const shouldAnimate = message.role === "ai" && message.animate;

  const renderSegment = (segment: Segment, index: number) => {
    switch (segment.type) {
      case "code":
        return <CodeBlock key={index} code={segment.content} />;
      case "formula":
        return <FormulaBlock key={index} formula={segment.content} />;
      case "text":
      default:
        if (!segment.content.trim()) return null;
        if (shouldAnimate) {
          return (
            <TypewriterEffect
              key={index}
              content={segment.content}
              style={markdownStyles}
            />
          );
        }
        return (
          <Markdown key={index} style={markdownStyles}>
            {segment.content}
          </Markdown>
        );
    }
  };

  return (
    <View style={styles.aiMessageContainer}>
      {/* Main Content Box */}
      <View style={styles.contentBox}>
        {/* Intro/Title (Optional) */}
        {message.title && (
          <View style={styles.titleBox}>
            <MaterialCommunityIcons
              name="cube-outline"
              size={20}
              color="#0d9488"
              style={styles.titleIcon}
            />
            <Text style={styles.titleText}>{message.title}</Text>
          </View>
        )}

        {/* Body with rich text + code + formulas */}
        {paragraphs.length > 0 ? (
          paragraphs.map((p, pIndex) => (
            <View key={pIndex} style={styles.paragraph}>
              {p.segments.map((segment, sIndex) =>
                renderSegment(segment, sIndex),
              )}
            </View>
          ))
        ) : (
          <Markdown style={markdownStyles}>{rawContent}</Markdown>
        )}

        {/* Copy Button */}
        <TouchableOpacity onPress={copyToClipboard} style={styles.copyButton}>
          <Ionicons name="copy-outline" size={16} color="#999" />
          <Text style={styles.copyText}>Copy</Text>
        </TouchableOpacity>

        {/* REFERENCES */}
        {message.pages && message.pages.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>REFERENCES</Text>
            <View style={styles.refContainer}>
              {message.pages.map((page, idx) => (
                <View key={idx} style={styles.pageChip}>
                  <Ionicons
                    name="document-text-outline"
                    size={14}
                    color="#555"
                  />
                  <Text style={styles.pageChipText}>Page {page}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* RELATED VIDEO */}
        {message.youtube_links && message.youtube_links.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>RELATED VIDEO</Text>
            {message.youtube_links.map((link, idx) => (
              <TouchableOpacity
                key={idx}
                onPress={() => Linking.openURL(link)}
                style={styles.videoCard}
              >
                <View style={styles.playIcon}>
                  <Ionicons name="play" size={20} color="#ef4444" />
                </View>
                <Text style={styles.videoTitle} numberOfLines={2}>
                  Related Video Resource
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Suggestions Chips */}
        {message.next_questions && message.next_questions.length > 0 && (
          <View style={styles.suggestionsContainer}>
            {message.next_questions.map((q, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.suggestionChip}
                onPress={() => onChipPress?.(q)}
              >
                <Ionicons
                  name="help-circle-outline"
                  size={16}
                  color="#6B7280"
                  style={{ marginRight: 6 }}
                />
                <Text style={styles.suggestionText}>{q}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  userMessageContainer: {
    alignSelf: "flex-end",
    backgroundColor: "#000000", // Strict Rule: Black Card
    padding: 12,
    borderRadius: 16,
    borderBottomRightRadius: 4,
    marginVertical: 8,
    maxWidth: "75%", // Strict Rule: 75%
    marginLeft: "auto",
  },
  userMessageText: {
    color: "#FFFFFF", // Strict Rule: White text
    fontSize: 15,
    lineHeight: 22,
  },
  aiMessageContainer: {
    alignSelf: "flex-start",
    width: "100%",
    marginVertical: 12,
    paddingRight: 16,
    marginRight: "auto",
  },
  contentBox: {
    backgroundColor: "#FFFFFF", // Strict Rule: White Card
    borderRadius: 16,
    borderTopLeftRadius: 4,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  titleBox: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    paddingBottom: 8,
  },
  titleIcon: {
    marginBottom: 2,
  },
  titleText: {
    color: "#0F766E", // Teal (Darker)
    fontWeight: "700",
    fontSize: 16,
    marginLeft: 8,
  },
  copyButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-end",
    marginTop: 8,
  },
  copyText: {
    fontSize: 12,
    color: "#6B7280",
    marginLeft: 4,
  },
  sectionTitle: {
    fontSize: 11,
    color: "#6B7280",
    fontWeight: "700",
    letterSpacing: 1,
    marginTop: 24,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  refContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  pageChip: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  pageChipText: {
    fontSize: 13,
    color: "#374151",
    fontWeight: "600",
    marginLeft: 6,
  },
  videoCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
  },
  playIcon: {
    width: 40,
    height: 40,
    borderRadius: 6,
    backgroundColor: "#FEE2E2",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  videoTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
    flex: 1,
  },
  suggestionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingTop: 12,
  },
  suggestionChip: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  suggestionText: {
    fontSize: 13,
    color: "#374151",
    fontWeight: "500",
  },
});

const markdownStyles = {
  body: {
    fontSize: 15,
    color: "#1F2937", // Dark Text
    lineHeight: 24,
  },
  code_block: {
    backgroundColor: "#111827",
    borderRadius: 8,
    padding: 16,
    marginVertical: 12,
    fontSize: 13,
    fontFamily: "monospace",
    color: "#F9FAFB",
  },
  fence: {
    backgroundColor: "#111827",
    borderRadius: 8,
    padding: 16,
    marginVertical: 12,
    fontSize: 13,
    fontFamily: "monospace",
    color: "#F9FAFB",
  },
  blockquote: {
    backgroundColor: "#EFF6FF",
    borderColor: "#BFDBFE",
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    marginVertical: 12,
  },
  link: {
    color: "#2563EB",
    textDecorationLine: "underline",
  },
};
