import ReusableHistoryDrawer from '@/components/ai-assistant/ReusableHistoryDrawer';
import PodcastItem from '@/components/podcast/PodcastItem';
import ToolHeader from '@/components/ui/ToolHeader';
import KeyboardDock from '@/components/ui/KeyboardDock';
import { ChatService } from '@/services/ChatService';
import { setCategoryChats } from '@/store/chatSlice';
import { useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Modal, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch } from 'react-redux';

export default function PodcastScreen() {
    const { user } = useUser();
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const dispatch = useDispatch();
    
    // State
    const [topic, setTopic] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [podcasts, setPodcasts] = useState<any[]>([]);
    const [currentChatId, setCurrentChatId] = useState<string | null>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [loadingHistory, setLoadingHistory] = useState(false);

    // Initial Load
    React.useEffect(() => {
        if (user?.primaryEmailAddress?.emailAddress) {
            loadChats();
        }
    }, [user]);

    const loadChats = async () => {
        if (!user?.primaryEmailAddress?.emailAddress) return;
        try {
            const chats = await ChatService.fetchPodcastChats(user.primaryEmailAddress.emailAddress);
            dispatch(setCategoryChats({ tool: 'podcast', chats }));
        } catch (e) {
            console.error(e);
        }
    };

    const handleGenerate = async () => {
        if (!topic.trim() || !user?.primaryEmailAddress?.emailAddress) return;
        
        // Ensure we have a valid Chat ID
        let chatId = currentChatId;
        if (!chatId) {
            chatId = `podcast_${Date.now()}`;
            setCurrentChatId(chatId);
            // created a local new chat, might need to sync with drawer list eventually
        }

        setIsGenerating(true);
        try {
            const result = await ChatService.generatePodcast(
                user.primaryEmailAddress.emailAddress, 
                chatId, 
                topic
            );
            
            // Add to local list optimistically
            const newPodcast = {
                topic: result.topic || topic,
                audio_url: result.audio_url,
                duration_seconds: result.duration_seconds,
                created_at: result.created_at || new Date().toISOString(),
                id: `local_${Date.now()}` // Strict Rule: Always have an ID
            };
            
            setPodcasts(prev => [newPodcast, ...prev]);
            setTopic('');
            
            // Refresh chat list silently to ensure new chat appears in drawer if it was new
            loadChats();
        } catch (error) {
            Alert.alert("Error", "Failed to generate podcast");
        } finally {
            setIsGenerating(false);
        }
    };

    const loadPodcastSession = async (chatId: string) => {
        if (!user?.primaryEmailAddress?.emailAddress) return;
        
        setLoadingHistory(true);
        setCurrentChatId(chatId);
        try {
            const history = await ChatService.fetchPodcastHistory(user.primaryEmailAddress.emailAddress, chatId);
            setPodcasts(history.reverse()); // Newest first
        } catch (error) {
            console.error(error);
        } finally {
            setLoadingHistory(false);
        }
    };
    
    const handleNewChat = () => {
        setCurrentChatId(null);
        setPodcasts([]);
        setIsDrawerOpen(false);
    };

    // Paranoid Deduplication: Filter out any duplicates from state or API
    const uniquePodcasts = React.useMemo(() => {
        return podcasts.filter((p, index, self) => 
            index === self.findIndex((t) => (
                // Match by ID if possible, or fallback to exact topic + created_at
                (t.id && p.id && t.id === p.id) || 
                (t.topic === p.topic && t.created_at === p.created_at)
            ))
        );
    }, [podcasts]);

    return (
        <View style={[styles.container, { position: 'relative' }]}>
            <ToolHeader 
                title="Podcast Generator" 
                onClose={() => router.back()} 
                onHistory={() => setIsDrawerOpen(true)}
            />

            <View style={styles.content}>
                 {loadingHistory ? (
                     <ActivityIndicator size="large" color="#4f46e5" style={{marginTop: 40}} />
                 ) : (
                     <FlatList
                         data={uniquePodcasts.flatMap((p, index) => {
                            // Stable Identity Rule: Use backend ID or fallback to stable index if absolutely necessary (but prefer ID)
                            // We assume 'p' might have 'id' from history, or we inject it safely.
                            // If p.id is missing, we risks re-render issues.
                            const baseId = p.id || `gen_${index}_${p.created_at || Date.now()}`;
                                return [
                                    { type: 'user', id: `u_${baseId}`, content: p.topic },
                                    { type: 'ai', id: `a_${baseId}`, data: p }
                                ];
                            })}
                        keyExtractor={(item) => item.id}
                         renderItem={({ item }) => {
                             if (item.type === 'user') {
                                 // Use the verified ChatMessage style for User
                                 return (
                                     <View style={styles.userMessageContainer}>
                                         <Text style={styles.userMessageText}>{item.content}</Text>
                                     </View>
                                 );
                             } else {
                                 // AI Message (Podcast Item is already styled as AI bubble)
                                 return (
                                    <View style={styles.aiMessageContainer}>
                                        <PodcastItem podcast={item.data} />
                                    </View>
                                 );
                             }
                         }}
                         contentContainerStyle={{ padding: 16, paddingBottom: 220 }}
                         ListEmptyComponent={
                             <View style={styles.emptyState}>
                                 <Ionicons name="headset-outline" size={64} color="#E5E7EB" />
                                 <Text style={styles.emptyText}>Enter a topic to generate an AI podcast.</Text>
                             </View>
                         }
                     />
                 )}
            </View>

            <KeyboardDock>
                <View style={[styles.inputContainer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter a topic (e.g. 'History of Rome')..."
                        placeholderTextColor="#9CA3AF"
                        value={topic}
                        onChangeText={setTopic}
                        editable={!isGenerating}
                    />
                    <TouchableOpacity 
                        style={[styles.sendButton, (!topic.trim() || isGenerating) && styles.disabledButton]} 
                        onPress={handleGenerate}
                        disabled={!topic.trim() || isGenerating}
                    >
                        {isGenerating ? (
                            <ActivityIndicator color="#FFF" size="small" />
                        ) : (
                            <Ionicons name="sparkles" size={20} color="#FFF" />
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardDock>

             <Modal
                visible={isDrawerOpen}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setIsDrawerOpen(false)}
            >
                <ReusableHistoryDrawer 
                    isModal
                    toolType="podcast"
                    onClose={() => setIsDrawerOpen(false)}
                    onNewChat={handleNewChat}
                    onChatSelect={(id) => {
                        loadPodcastSession(id);
                        setIsDrawerOpen(false);
                    }}
                />
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB', // White/Light Gray background
    },
    content: {
        flex: 1,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 60,
    },
    emptyText: {
        marginTop: 16,
        color: '#6B7280',
        fontSize: 16,
    },
    inputWrapper: {
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    inputContainer: {
        flexDirection: 'row',
        padding: 12,
        alignItems: 'center',
    },
    input: {
        flex: 1,
        backgroundColor: '#F3F4F6',
        borderRadius: 24,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        color: '#1F2937',
        marginRight: 12,
    },
    sendButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#4F46E5', // Indigo
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: "#4F46E5",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
    },
    disabledButton: {
        backgroundColor: '#A5B4FC',
        shadowOpacity: 0,
    },
    // Chat Bubble Styles Helper (Matching ChatMessage.tsx)
    userMessageContainer: {
        alignSelf: 'flex-end',
        backgroundColor: '#000000', // Strict Rule: Black Card
        padding: 12,
        borderRadius: 16,
        borderBottomRightRadius: 4,
        marginVertical: 8,
        maxWidth: '75%',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
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
    },
});
