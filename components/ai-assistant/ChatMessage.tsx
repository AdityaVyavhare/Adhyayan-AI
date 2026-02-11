import TypewriterEffect from '@/components/ui/TypewriterEffect';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { AVPlaybackStatus, ResizeMode, Video } from 'expo-av';
import * as Clipboard from 'expo-clipboard';
import React, { useMemo, useRef, useState } from 'react';
import {
    Image,
    Linking,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    useWindowDimensions,
} from 'react-native';
import Markdown from 'react-native-markdown-display';
import { parseBody, ParsedParagraph, Segment } from '@/utils/bodyParser';
import CodeBlock from '@/components/CodeBlock';
import FormulaBlock from '@/components/FormulaBlock';

// Updated Interface to match ChatResponse spec
export interface Message {
  id: string;
  role: 'human' | 'ai' | 'system' | 'user'; // tolerate legacy 'user', but normalize to 'human' at source
  content?: string;
  // Structured AI response fields
  title?: string;
  body?: string;
  next_related_topic?: string[];
  next_questions?: string[];
  manim_video_path?: string;
  Need_of_manim?: string;
  links?: string[];
  pages?: number[]; // Referenced pages
  youtube_links?: string[]; // YouTube resources
  timestamps?: string[]; // "MM:SS" timestamps for Video RAG
  // Scan Tool Fields
  imageUrl?: string;
  ocrText?: string;
  referenced_images?: string[]; // URLs of images referenced in the answer
  // UI flags
  animate?: boolean; // typing animation for live responses only
}

interface ChatMessageProps {
  message: Message;
  onChipPress?: (text: string) => void;
  onImagePress?: (url: string) => void;
}

export default function ChatMessage({ message, onChipPress, onImagePress }: ChatMessageProps) {
  const isUser = message.role === 'human' || message.role === 'user';
  const { width } = useWindowDimensions();
  const videoRef = useRef(null);
  const [status, setStatus] = useState<AVPlaybackStatus | {}>({});

  const copyToClipboard = async () => {
    await Clipboard.setStringAsync(message.content || message.body || '');
  };

  if (isUser) {
    return (
        <View style={styles.userMessageContainer}>
            <Text style={styles.userMessageText}>{message.content || ''}</Text>
            {/* Show User Uploaded Image if available */}
            {message.imageUrl && (
                <TouchableOpacity 
                    style={styles.userImageContainer}
                    onPress={() => onImagePress?.(message.imageUrl!)}
                    activeOpacity={0.9}
                >
                   <Image source={{ uri: message.imageUrl }} style={styles.userImage} resizeMode="cover" />
                </TouchableOpacity>
            )}
        </View>
    );
  }

  // AI Message - Rich Rendering
  const rawContent = message.body || message.content || '';
  const paragraphs: ParsedParagraph[] = useMemo(
    () => parseBody(rawContent),
    [rawContent],
  );
  const shouldAnimate = message.role === 'ai' && message.animate;

  const renderSegment = (segment: Segment, index: number) => {
    switch (segment.type) {
      case 'code':
        return <CodeBlock key={index} code={segment.content} />;
      case 'formula':
        return <FormulaBlock key={index} formula={segment.content} />;
      case 'text':
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
                   <MaterialCommunityIcons name="cube-outline" size={20} color="#0d9488" style={styles.titleIcon} />
                   <Text style={styles.titleText}>{message.title}</Text>
               </View>
            )}

            {/* Body with rich text + code + formulas */}
            {paragraphs.length > 0 ? (
              paragraphs.map((p, pIndex) => (
                <View key={pIndex} style={styles.paragraph}>
                  {p.segments.map((segment, sIndex) => renderSegment(segment, sIndex))}
                </View>
              ))
            ) : (
              // Fallback: simple markdown rendering if parser produced nothing
              <Markdown style={markdownStyles}>
                {rawContent}
              </Markdown>
            )}
            
            {/* REFERENCED IMAGES (Feature 2) */}
            {message.referenced_images && message.referenced_images.length > 0 && (
                <View style={styles.referencedImagesContainer}>
                    <Text style={styles.sectionTitle}>REFERENCED IMAGES</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {message.referenced_images.map((imgUrl, idx) => (
                            <TouchableOpacity key={idx} onPress={() => onImagePress?.(imgUrl)}>
                                <Image source={{ uri: imgUrl }} style={styles.referencedImage} />
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            )}

            {/* Copy Button */}
            <TouchableOpacity onPress={copyToClipboard} style={styles.copyButton}>
                <Ionicons name="copy-outline" size={16} color="#999" />
                <Text style={styles.copyText}>Copy</Text>
            </TouchableOpacity>
        </View>

        {/* REFERENCES */}
        {message.pages && message.pages.length > 0 && (
            <View>
                <Text style={styles.sectionTitle}>REFERENCES</Text>
                <View style={styles.refContainer}>
                    {message.pages.map((page, idx) => (
                        <View key={idx} style={styles.pageChip}>
                            <Ionicons name="document-text-outline" size={14} color="#0284c7" />
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
                     <TouchableOpacity key={idx} onPress={() => Linking.openURL(link)} style={styles.videoCard}>
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

        {/* Manim Video (Specific to AI Teacher) */}
        {message.Need_of_manim === 'YES' && message.manim_video_path && message.manim_video_path.startsWith('http') && (
            <View style={styles.cardContainer}>
                 <View style={styles.cardHeader}>
                     <Ionicons name="videocam-outline" size={18} color="#333" />
                     <Text style={styles.cardTitle}>Video Explanation</Text>
                 </View>
                 <View style={styles.videoWrapper}>
                     <Video
                         ref={videoRef}
                         style={styles.video}
                         source={{ uri: message.manim_video_path }}
                         useNativeControls
                         resizeMode={ResizeMode.CONTAIN}
                         isLooping
                         onPlaybackStatusUpdate={status => setStatus(status)}
                     />
                 </View>
            </View>
        )}

        {/* Suggestions Chips */}
        {message.next_questions && message.next_questions.length > 0 && (
            <View style={styles.suggestionsContainer}>
                {message.next_questions.map((q, idx) => (
                    <TouchableOpacity key={idx} style={styles.suggestionChip} onPress={() => onChipPress?.(q)}>
                        <Text style={styles.suggestionText}>{q}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        )}
    </View>
  );
}

const styles = StyleSheet.create({
    userMessageContainer: {
        alignSelf: 'flex-end',
        backgroundColor: '#000000', // Strict Rule: Black Card
        padding: 12,
        borderRadius: 16,
        borderBottomRightRadius: 4,
        marginVertical: 8,
        maxWidth: '75%', // Strict Rule: ~75% width
        marginBottom: 12,
        marginLeft: 'auto', // Strict Rule: Push to right
    },
    userMessageText: {
        color: '#FFFFFF', // Strict Rule: White text
        fontSize: 15,
        lineHeight: 22,
    },
    aiMessageContainer: {
        alignSelf: 'flex-start',
        width: '100%',
        maxWidth: '85%', // Allow slightly more for AI content, but alignment is key
        marginVertical: 12,
        paddingRight: 16,
        marginRight: 'auto', // Strict Rule: Push to left
    },
    contentBox: {
        backgroundColor: '#FFFFFF', // Strict Rule: White Card
        borderRadius: 16,
        borderTopLeftRadius: 4,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB', // Subtle border for white card
        marginBottom: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    titleBox: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        paddingBottom: 8,
    },
    titleIcon: {
        marginBottom: 2,
    },
    titleText: {
        color: '#111827', // Dark Gray (was Light Gray)
        fontWeight: '700',
        fontSize: 16,
        marginLeft: 8,
    },
    copyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-end',
        marginTop: 8,
    },
    copyText: {
        fontSize: 12,
        color: '#6B7280', // Medium Gray
        marginLeft: 4,
    },
    sectionTitle: {
        fontSize: 11,
        color: '#6B7280', // Medium Gray
        fontWeight: '700',
        letterSpacing: 1,
        marginTop: 24,
        marginBottom: 8,
        textTransform: 'uppercase',
    },
    refContainer: {
       flexDirection: 'row',
       flexWrap: 'wrap',
       gap: 8,
    },
    pageChip: {
        backgroundColor: '#F3F4F6', // Light Gray
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    pageChipText: {
        fontSize: 13,
        color: '#374151', // Dark Gray
        fontWeight: '600',
        marginLeft: 6,
    },
    videoCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB', // Very Light Gray
        borderWidth: 1,
        borderColor: '#E5E7EB', 
        borderRadius: 12,
        padding: 12,
        marginTop: 8,
    },
    playIcon: {
        width: 40,
        height: 40,
        borderRadius: 6,
        backgroundColor: '#FEE2E2', // Light Red
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    videoTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1F2937', // Dark Gray
        flex: 1,
    },
    suggestionsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 16,
    },
    suggestionChip: {
        backgroundColor: '#FFFFFF', // White
        borderWidth: 1,
        borderColor: '#E5E7EB', 
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 1,
        elevation: 1,
    },
    suggestionText: {
        fontSize: 13,
        color: '#374151', // Dark Gray
        fontWeight: '500',
    },
    // Manim Video Card
    cardContainer: {
        borderRadius: 12,
        backgroundColor: '#000',
        marginVertical: 12,
        overflow: 'hidden',
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        backgroundColor: '#F3F4F6', 
    },
    cardTitle: {
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 8,
        color: '#1F2937', 
    },
    videoWrapper: {
        width: '100%',
        height: 200,
        backgroundColor: '#000',
    },
    video: {
        width: '100%',
        height: '100%',
    },
    userImageContainer: {
        marginTop: 8,
        borderRadius: 8,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#333',
    },
    userImage: {
        width: 150,
        height: 150,
        borderRadius: 8,
    },
    referencedImagesContainer: {
        marginTop: 12,
        marginBottom: 8,
    },
    referencedImage: {
        width: 120,
        height: 80,
        borderRadius: 6,
        marginRight: 8,
        backgroundColor: '#E5E7EB',
        borderWidth: 1,
        borderColor: '#D1D5DB',
    },
});

const markdownStyles = {
    body: {
        fontSize: 15,
        color: '#1F2937', // Strict Rule: Dark Text
        lineHeight: 24,
    },
    code_block: {
        backgroundColor: '#111827', // Keep Code Dark for contrast
        borderRadius: 8,
        padding: 16,
        marginVertical: 12,
        fontSize: 13,
        fontFamily: 'monospace',
        color: '#F9FAFB',
    },
    fence: {
        backgroundColor: '#111827',
        borderRadius: 8,
        padding: 16,
        marginVertical: 12,
        fontSize: 13,
        fontFamily: 'monospace',
        color: '#F9FAFB',
    },
    blockquote: {
        backgroundColor: '#EFF6FF', // Light Blue
        borderColor: '#BFDBFE',
        borderWidth: 1,
        borderRadius: 8,
        padding: 16,
        marginVertical: 12,
    },
    link: {
        color: '#2563EB',
        textDecorationLine: 'underline',
    },
} as any;
