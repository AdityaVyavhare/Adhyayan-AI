import { Message } from '@/components/ai-assistant/ChatMessage';
import ThinkingBubble from '@/components/ui/ThinkingBubble';
import ToolHeader from '@/components/ui/ToolHeader';

import KeyboardDock from '@/components/ui/KeyboardDock';
import AnswerCard from '@/components/youtube-learning/AnswerCard';
import KeyMoments from '@/components/youtube-learning/KeyMoments';
import YoutubeChatMessage from '@/components/youtube-learning/YoutubeChatMessage';
import YoutubePlayer, { YoutubePlayerRef } from '@/components/youtube-learning/YoutubePlayer';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import {
    FlatList,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    useWindowDimensions
} from 'react-native';

interface YoutubeChatViewProps {
    messages: Message[];
    onSendMessage: (text: string) => void;
    onBack: () => void;
    onOpenDrawer: () => void;
    onNewChat: () => void;
    videoTitle?: string;
    videoUrl: string | null;
    isLoading: boolean;
    inputText: string;
    setInputText: (text: string) => void;
}

export default function YoutubeChatView({ 
    messages, 
    onSendMessage, 
    onBack, 
    onOpenDrawer, 
    onNewChat,
    videoTitle, 
    videoUrl,
    isLoading,
    inputText,
    setInputText
}: YoutubeChatViewProps) {
    const flatListRef = useRef<FlatList>(null);
    const playerController = useRef<YoutubePlayerRef>(null);
    const { height } = useWindowDimensions();
    const [showVideo, setShowVideo] = useState(true);
    const [currentTime, setCurrentTime] = useState(0);

    // Paranoid Deduplication Layer: Filter messages by ID
    const uniqueMessages = React.useMemo(() => {
        const seen = new Set();
        return messages.filter(msg => {
            if (seen.has(msg.id)) return false;
            seen.add(msg.id);
            return true;
        });
    }, [messages]);

    // Latest AI Answer State (Derived from uniqueMessages)
    const latestAiMessage = React.useMemo(() => {
        for (let i = uniqueMessages.length - 1; i >= 0; i--) {
            if (uniqueMessages[i].role === 'ai') return uniqueMessages[i];
        }
        return null;
    }, [uniqueMessages]);

    // Filter messages for history (exclude the latest one if we show it in AnswerCard?? 
    // Actually, UX requirement says: "Exclude latest_answer.answer from chat to avoid duplication")
    // So we show all messages EXCEPT the very last AI message IF it matches the AnswerCard content.
    const historyMessages = React.useMemo(() => {
        if (!latestAiMessage) return uniqueMessages;
        return uniqueMessages.filter(m => m.id !== latestAiMessage.id);
    }, [uniqueMessages, latestAiMessage]);


    const getVideoId = (url: string) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : '';
    };

    const timeToSeconds = (timeStr: string) => {
        const parts = timeStr.split(':').map(Number);
        if (parts.length === 2) return parts[0] * 60 + parts[1];
        if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
        return 0;
    };

    const handleTimestampPress = (timestamp: string) => {
        const seconds = timeToSeconds(timestamp);
        if (playerController.current) {
            playerController.current.seekTo(seconds);
            setShowVideo(true); 
        }
    };

    const renderHeader = () => (
        <View style={styles.listHeader}>
             {/* Answer Section */}
             {(latestAiMessage || isLoading) && (
                <View style={styles.answerSection}>
                    <AnswerCard 
                        answer={latestAiMessage?.content || latestAiMessage?.body || ''} 
                        isLoading={isLoading && !latestAiMessage}
                    />
                    {latestAiMessage?.timestamps && (
                        <KeyMoments 
                            timestamps={latestAiMessage.timestamps} 
                            onTimestampPress={handleTimestampPress} 
                            currentTime={currentTime}
                        />
                    )}
                </View>
             )}

             {/* Divider */}
             {historyMessages.length > 0 && (
                <View style={styles.historyDivider}>
                    <View style={styles.line} />
                    <Text style={styles.historyLabel}>Previous Messages</Text>
                    <View style={styles.line} />
                </View>
             )}
        </View>
    );

    return (
        <View style={styles.container}>
            {/* Header */}
            <ToolHeader 
                title="Video Tutor" 
                onClose={onBack} 
                onHistory={onOpenDrawer}
                rightChildren={
                    <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
                         {videoUrl && (
                            <TouchableOpacity 
                                onPress={() => setShowVideo(!showVideo)} 
                                style={[styles.toggleButton, showVideo && styles.toggleButtonActive]}
                            >
                                <Ionicons
                                name = {showVideo ? 'eye-off' : 'eye'} 
                                    size={18} 
                                    color={showVideo ? "#fff" : "#6B7280"} 
                                />
                                {/* <Text style={[styles.toggleButtonText, showVideo && {color:'#fff'}]}>
                                    {showVideo ? 'Hide' : 'View'}
                                </Text> */}
                            </TouchableOpacity>
                         )}
                         
                         <TouchableOpacity onPress={onNewChat} style={styles.newChatButton}>
                             <MaterialCommunityIcons name="plus" size={18} color="#4C51BF" />
                         </TouchableOpacity>
                    </View>
                }
            />

            {/* Content Area */}
            <View style={styles.contentContainer}>
                
                {/* Video Player */}
                {showVideo && videoUrl ? (
                    <View style={styles.videoContainer}>
                        <YoutubePlayer
                            ref={playerController}
                            videoId={getVideoId(videoUrl)}
                            onProgress={(e) => setCurrentTime(e.currentTime)}
                        />
                    </View>
                ) : null}

                {/* Chat Interface */}
                <View style={[styles.chatContainer, showVideo && styles.chatContainerBorder, { position: 'relative' }]}>
                    <FlatList
                        ref={flatListRef}
                        data={historyMessages}
                        keyExtractor={(item) => item.id}
                        ListHeaderComponent={renderHeader}
                        renderItem={({ item }) => (
                            <YoutubeChatMessage 
                                message={item} 
                                onTimestampPress={handleTimestampPress}
                                onChipPress={(text) => onSendMessage(text)}
                            />
                        )}
                        contentContainerStyle={styles.listContent}
                        onContentSizeChange={() => {
                            // Only scroll to end if answer is not huge? 
                            // Actually with AnswerCard at top, maybe we want to scroll to top?
                            // Let's scroll to top of AnswerCard (offset 0) or end of history?
                            // Standard chat behavior is scroll to bottom. 
                            flatListRef.current?.scrollToOffset({ offset: 0, animated: true }); 
                        }}
                        ListFooterComponent={isLoading && latestAiMessage ? <ThinkingBubble text="Watching video..." /> : null}
                    />

                    <KeyboardDock>
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.input}
                                value={inputText}
                                onChangeText={setInputText}
                                placeholder="Ask a follow-up question..."
                                placeholderTextColor="#9CA3AF"
                                multiline
                                editable={!isLoading}
                            />
                            <TouchableOpacity
                                style={[styles.sendButton, (!inputText.trim() || isLoading) && styles.disabledSend]}
                                onPress={() => { onSendMessage(inputText); }}
                                disabled={!inputText.trim() || isLoading}
                            >
                                <Ionicons name="arrow-up" size={18} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    </KeyboardDock>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        height: 60,
        backgroundColor: '#fff',
        zIndex: 10,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    iconButton: {
        padding: 8,
        marginRight: 8,
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    subtitle: {
        fontSize: 10,
        color: '#666',
        maxWidth: 150,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    toggleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB', // Light gray border for inactive
        backgroundColor: '#F9FAFB', // Very light gray bg for inactive
        padding: 6,
        borderRadius: 20,
    },
    toggleButtonActive: {
        backgroundColor: '#1F2937', // Dark background for active
        borderColor: '#1F2937',
    },
    newChatButton: {
        padding: 8,
        backgroundColor: '#f3f4f6',
        borderRadius: 20,
    },
    contentContainer: {
        flex: 1,
    },
    videoContainer: {
        height: '35%', 
        backgroundColor: '#000',
    },
    chatContainer: {
        flex: 1,
        backgroundColor: '#f9f9f9',
    },
    chatContainerBorder: {
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb'
    },
    listContent: {
        padding: 16,
        paddingBottom: 220,
    },
    listHeader: {
        marginBottom: 16,
    },
    answerSection: {
        marginBottom: 24,
    },
    historyDivider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 16,
    },
    line: {
        flex: 1,
        height: 1,
        backgroundColor: '#e5e7eb',
    },
    historyLabel: {
        marginHorizontal: 16,
        color: '#9ca3af',
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    loadingContainerDark: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000'
    },
    inputWrapper: {},
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 24,
        paddingHorizontal: 16,
        minHeight: 48,
        maxHeight: 100,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    input: {
        flex: 1,
        fontSize: 15,
        color: '#333',
        paddingVertical: 10,
    },
    sendButton: {
        backgroundColor: '#111827', // Darker black/gray for premium feel
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
    disabledSend: {
        backgroundColor: '#e5e7eb',
    },
});
