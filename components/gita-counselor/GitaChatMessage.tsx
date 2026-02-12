import TypewriterEffect from "@/components/ui/TypewriterEffect";
import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import * as Clipboard from "expo-clipboard";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Markdown from "react-native-markdown-display";

interface Shloka {
  chapter: number;
  verse: number;
  meaning_english?: string;
  meaning_hindi?: string;
  sanskrit_text?: string;
  transliteration?: string;
  page_content?: string;
}

interface GitaMessage {
  id: string;
  role: "human" | "ai";
  content?: string;
  audio_url?: string;
  referenced_shlokas?: Shloka[];
  life_examples?: string[];
  key_teachings?: string[];
  animate?: boolean;
}

interface GitaChatMessageProps {
  message: GitaMessage;
  onChipPress?: (text: string) => void;
}

export default function GitaChatMessage({
  message,
  onChipPress,
}: GitaChatMessageProps) {
  const isUser = message.role === "human";
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [showShlokas, setShowShlokas] = useState(false);

  useEffect(() => {
    return sound
      ? () => {
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  const playAudio = async () => {
    if (!message.audio_url) return;

    try {
      if (sound) {
        const status = await sound.getStatusAsync();
        if (status.isLoaded) {
          if (isPlaying) {
            await sound.pauseAsync();
            setIsPlaying(false);
          } else {
            await sound.playAsync();
            setIsPlaying(true);
          }
          return;
        }
      }

      setIsLoadingAudio(true);
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: message.audio_url },
        { shouldPlay: true },
        (status) => {
          if (status.isLoaded) {
            if (status.durationMillis) {
              setAudioProgress(
                (status.positionMillis || 0) / status.durationMillis,
              );
            }
            if (status.didJustFinish) {
              setIsPlaying(false);
              setAudioProgress(0);
            }
          }
        },
      );

      setSound(newSound);
      setIsPlaying(true);
      setIsLoadingAudio(false);
    } catch (error) {
      console.error("Error playing audio:", error);
      setIsLoadingAudio(false);
    }
  };

  const copyToClipboard = async () => {
    await Clipboard.setStringAsync(message.content || "");
  };

  if (isUser) {
    return (
      <View style={styles.userMessageContainer}>
        <Text style={styles.userMessageText}>{message.content || ""}</Text>
      </View>
    );
  }

  // AI Message
  const shouldAnimate = message.animate;
  const markdownStyles = {
    body: { color: "#374151", fontSize: 15, lineHeight: 24 },
    heading1: {
      color: "#111827",
      fontSize: 20,
      fontWeight: "700",
      marginVertical: 8,
    },
    heading2: {
      color: "#1F2937",
      fontSize: 18,
      fontWeight: "600",
      marginVertical: 6,
    },
    paragraph: { marginVertical: 4 },
    link: { color: "#2563EB" },
    code_inline: {
      backgroundColor: "#F3F4F6",
      paddingHorizontal: 4,
      borderRadius: 4,
      fontFamily: "monospace",
    },
  };

  return (
    <View style={styles.aiMessageContainer}>
      {/* Audio Player */}
      {message.audio_url && (
        <View style={styles.audioCard}>
          <TouchableOpacity
            style={styles.playButton}
            onPress={playAudio}
            disabled={isLoadingAudio}
          >
            {isLoadingAudio ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Ionicons
                name={isPlaying ? "pause" : "play"}
                size={20}
                color="#FFF"
              />
            )}
          </TouchableOpacity>
          <View style={styles.audioInfo}>
            <Text style={styles.audioLabel}>Listen to Guidance</Text>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${audioProgress * 100}%` },
                ]}
              />
            </View>
            <Text style={styles.audioTime}>03:45 • Audio Response</Text>
          </View>
        </View>
      )}

      {/* Main Content */}
      <View style={styles.contentBox}>
        {shouldAnimate ? (
          <TypewriterEffect
            content={message.content || ""}
            style={markdownStyles}
          />
        ) : (
          <Markdown style={markdownStyles}>{message.content || ""}</Markdown>
        )}

        {/* Copy Button */}
        <TouchableOpacity onPress={copyToClipboard} style={styles.copyButton}>
          <Ionicons name="copy-outline" size={16} color="#999" />
          <Text style={styles.copyText}>Copy</Text>
        </TouchableOpacity>
      </View>

      {/* Referenced Shlokas */}
      {message.referenced_shlokas && message.referenced_shlokas.length > 0 && (
        <View style={styles.shlokasContainer}>
          <TouchableOpacity
            style={styles.shlokasHeader}
            onPress={() => setShowShlokas(!showShlokas)}
          >
            <Ionicons name="book-outline" size={18} color="#FF9933" />
            <Text style={styles.shlokasTitle}>
              Referenced Shlokas ({message.referenced_shlokas.length})
            </Text>
            <Ionicons
              name={showShlokas ? "chevron-up" : "chevron-down"}
              size={20}
              color="#6B7280"
            />
          </TouchableOpacity>

          {showShlokas && (
            <ScrollView
              style={styles.shlokasScroll}
              horizontal
              showsHorizontalScrollIndicator={false}
            >
              {message.referenced_shlokas.map((shloka, idx) => (
                <View key={idx} style={styles.shlokaCard}>
                  <View style={styles.shlokaHeader}>
                    <Ionicons name="flower-outline" size={16} color="#FF9933" />
                    <Text style={styles.shlokaChapter}>
                      Chapter {shloka.chapter}, Verse {shloka.verse}
                    </Text>
                  </View>
                  <Text style={styles.shlokaText} numberOfLines={4}>
                    {shloka.meaning_english ||
                      shloka.page_content ||
                      "Shloka reference"}
                  </Text>
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      )}

      {/* Life Examples */}
      {message.life_examples && message.life_examples.length > 0 && (
        <View style={styles.examplesContainer}>
          <View style={styles.examplesHeader}>
            <Ionicons name="bulb-outline" size={18} color="#F59E0B" />
            <Text style={styles.examplesTitle}>Life Examples</Text>
          </View>
          {message.life_examples.slice(0, 2).map((example, idx) => (
            <View key={idx} style={styles.exampleItem}>
              <View style={styles.exampleDot} />
              <Text style={styles.exampleText}>{example}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Key Teachings */}
      {message.key_teachings && message.key_teachings.length > 0 && (
        <View style={styles.teachingsContainer}>
          <View style={styles.teachingsHeader}>
            <Ionicons name="star-outline" size={18} color="#8B5CF6" />
            <Text style={styles.teachingsTitle}>Key Teachings</Text>
          </View>
          {message.key_teachings.slice(0, 3).map((teaching, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.teachingChip}
              onPress={() => onChipPress?.(teaching)}
            >
              <Text style={styles.teachingText} numberOfLines={2}>
                {teaching}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  userMessageContainer: {
    alignSelf: "flex-end",
    backgroundColor: "#3B82F6",
    borderRadius: 18,
    borderBottomRightRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxWidth: "75%",
    marginVertical: 4,
  },
  userMessageText: {
    color: "#FFFFFF",
    fontSize: 15,
    lineHeight: 20,
  },
  aiMessageContainer: {
    alignSelf: "flex-start",
    maxWidth: "95%",
    marginVertical: 8,
  },
  audioCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FF9933",
    borderRadius: 16,
    padding: 12,
    marginBottom: 8,
  },
  playButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  audioInfo: {
    flex: 1,
  },
  audioLabel: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
  },
  progressBar: {
    height: 4,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#FFF",
  },
  audioTime: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 12,
    marginTop: 4,
  },
  contentBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  copyButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  copyText: {
    marginLeft: 6,
    color: "#9CA3AF",
    fontSize: 13,
  },
  shlokasContainer: {
    marginTop: 12,
    backgroundColor: "#FFF5E6",
    borderRadius: 12,
    padding: 12,
  },
  shlokasHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  shlokasTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: "#FF9933",
  },
  shlokasScroll: {
    marginTop: 12,
  },
  shlokaCard: {
    width: 280,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#FFE4B5",
  },
  shlokaHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  shlokaChapter: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FF9933",
  },
  shlokaText: {
    fontSize: 13,
    color: "#4B5563",
    lineHeight: 18,
  },
  examplesContainer: {
    marginTop: 12,
    backgroundColor: "#FFFAEB",
    borderRadius: 12,
    padding: 12,
  },
  examplesHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  examplesTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#F59E0B",
  },
  exampleItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginVertical: 4,
  },
  exampleDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#F59E0B",
    marginTop: 6,
    marginRight: 10,
  },
  exampleText: {
    flex: 1,
    fontSize: 14,
    color: "#78350F",
    lineHeight: 20,
  },
  teachingsContainer: {
    marginTop: 12,
  },
  teachingsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  teachingsTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#8B5CF6",
  },
  teachingChip: {
    backgroundColor: "#F5F3FF",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: "#E9D5FF",
  },
  teachingText: {
    fontSize: 14,
    color: "#6B21A8",
    lineHeight: 20,
  },
});
