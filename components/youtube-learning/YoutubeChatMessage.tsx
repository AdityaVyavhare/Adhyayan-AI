import { Message } from '@/components/ai-assistant/ChatMessage';
import TypewriterEffect from '@/components/ui/TypewriterEffect';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { parseBody, ParsedParagraph, Segment } from '@/utils/bodyParser';
import CodeBlock from '@/components/CodeBlock';
import FormulaBlock from '@/components/FormulaBlock';

interface YoutubeChatMessageProps {
    message: Message;
    onTimestampPress?: (timestamp: string) => void;
    onChipPress?: (text: string) => void;
}

export default function YoutubeChatMessage({ message, onTimestampPress, onChipPress }: YoutubeChatMessageProps) {
    const isUser = message.role === 'human' || message.role === 'user';

    const copyToClipboard = async () => {
        await Clipboard.setStringAsync(message.content || message.body || '');
    };

    if (isUser) {
        return (
            <View style={styles.userMessageContainer}>
                <Text style={styles.userMessageText}>{message.content || ''}</Text>
            </View>
        );
    }

    // AI Message
    const rawContent = message.content || message.body || '';
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
            <View style={styles.contentBox}>
                {/* Header/Title */}
                {message.title && (
                   <View style={styles.titleBox}>
                       <MaterialCommunityIcons name="youtube-tv" size={20} color="#EF4444" style={styles.titleIcon} />
                       <Text style={styles.titleText}>{message.title}</Text>
                       {/* Source Trust Badge - Refinement Feature */}
                       <View style={styles.trustBadge}>
                           <MaterialCommunityIcons name="check-decagram" size={14} color="#059669" />
                           <Text style={styles.trustText}>Verified Source</Text>
                       </View>
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
                  <Markdown style={markdownStyles}>
                    {rawContent}
                  </Markdown>
                )}
                
                {/* KEY MOMENTS (Timestamps) */}
                {message.timestamps && message.timestamps.length > 0 && (
                    <View style={styles.timestampsContainer}>
                        <Text style={styles.sectionTitle}>KEY MOMENTS</Text>
                        <View style={styles.timestampGrid}>
                            {message.timestamps.map((ts, idx) => (
                                <TouchableOpacity 
                                    key={idx} 
                                    style={styles.timestampChip}
                                    onPress={() => onTimestampPress?.(ts)}
                                >
                                    <Ionicons name="play" size={12} color="#4C51BF" />
                                    <Text style={styles.timestampText}>{ts}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                )}

                {/* Copy Button */}
                <TouchableOpacity onPress={copyToClipboard} style={styles.copyButton}>
                    <Ionicons name="copy-outline" size={16} color="#999" />
                    <Text style={styles.copyText}>Copy</Text>
                </TouchableOpacity>

                {/* Suggestions Chips */}
                {message.next_questions && message.next_questions.length > 0 && (
                    <View style={styles.suggestionsContainer}>
                        {message.next_questions.map((q, idx) => (
                            <TouchableOpacity 
                                key={idx} 
                                style={styles.suggestionChip} 
                                onPress={() => onChipPress?.(q)}
                            >
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
        alignSelf: 'flex-end',
        backgroundColor: '#000000', // Strict Rule: Black Card
        padding: 12,
        borderRadius: 16,
        borderBottomRightRadius: 4,
        marginVertical: 8,
        maxWidth: '75%', // Strict Rule: 75%
        marginLeft: 'auto',
    },
    userMessageText: {
        color: '#FFFFFF', // White text
        fontSize: 15,
        lineHeight: 22,
    },
    aiMessageContainer: {
        alignSelf: 'flex-start',
        width: '100%',
        marginVertical: 12,
        paddingRight: 16,
        marginRight: 'auto',
    },
    contentBox: {
        backgroundColor: '#FFFFFF', // Strict Rule: White Card
        borderRadius: 16,
        borderTopLeftRadius: 4,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
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
        color: '#B91C1C', // Dark Red
        fontWeight: '700',
        fontSize: 16,
        marginLeft: 8,
        flex: 1,
    },
    trustBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ECFDF5', 
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        marginLeft: 8,
        borderWidth: 1,
        borderColor: '#059669',
    },
    trustText: {
        fontSize: 10,
        color: '#059669',
        fontWeight: '600',
        marginLeft: 4,
    },
    copyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-end',
        marginTop: 8,
    },
    copyText: {
        fontSize: 12,
        color: '#6B7280',
        marginLeft: 4,
    },
    timestampsContainer: {
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB', 
    },
    sectionTitle: {
        fontSize: 11,
        color: '#6B7280',
        fontWeight: '700',
        letterSpacing: 1,
        marginBottom: 12,
        textTransform: 'uppercase',
    },
    timestampGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    timestampChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EEF2FF', // Very Light Indigo
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#C7D2FE',
    },
    timestampText: {
        fontSize: 13,
        color: '#4338CA', // Dark Indigo
        fontWeight: '600',
        marginLeft: 6,
    },
    suggestionsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        paddingTop: 12,
    },
    suggestionChip: {
        backgroundColor: '#FFFFFF', 
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1,
        elevation: 1,
    },
    suggestionText: {
        fontSize: 13,
        color: '#374151',
        fontWeight: '500',
    },
});

const markdownStyles = {
    body: {
        fontSize: 15,
        color: '#1F2937', // Dark Text
        lineHeight: 24,
    },
    code_block: {
        backgroundColor: '#111827',
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
        backgroundColor: '#EFF6FF',
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
};
