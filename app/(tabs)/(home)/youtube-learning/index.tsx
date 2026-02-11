import { Message } from '@/components/ai-assistant/ChatMessage';
import ReusableHistoryDrawer from '@/components/ai-assistant/ReusableHistoryDrawer';
import ErrorModal from '@/components/ui/ErrorModal';
import LoadingComponent from '@/components/ui/LoadingComponent';
import YoutubeChatView from '@/components/youtube-learning/YoutubeChatView';
import YoutubeInputView from '@/components/youtube-learning/YoutubeInputView';
import { ChatService } from '@/services/ChatService';
import { addMessage, setActiveTool, setCategoryChats, setCurrentChat, setError, startNewChat } from '@/store/chatSlice';
import { RootState } from '@/store/store';
import { useUser } from '@clerk/clerk-expo';
import * as Crypto from 'expo-crypto';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Modal, SafeAreaView, StyleSheet } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

export default function YoutubeLearningScreen() {
    const { user } = useUser();
    const dispatch = useDispatch();
    const router = useRouter();
    
    // Redux State
    const { messages, currentChatId, error } = useSelector((state: RootState) => state.chat);
    
    // Local State
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [videoTitle, setVideoTitle] = useState<string>('');
    
    const [isLoading, setIsLoading] = useState(false); // For message sending
    const [isSessionLoading, setSessionLoading] = useState(false); // For full screen loading
    const [inputText, setInputText] = useState('');
    const [isDrawerOpen, setDrawerOpen] = useState(false);

    // Recent Videos State
    const [recentVideos, setRecentVideos] = useState<Array<{ id: string; title: string; duration: string; date: string; url: string }>>([]);

    // Context Switching Logic
    useFocusEffect(
        React.useCallback(() => {
            dispatch(setActiveTool('youtube'));
            // No auto-creation of chat on open
        }, [dispatch])
    );

    // Initialize Chat List (Metadata Only)
    useEffect(() => {
        if (user?.primaryEmailAddress?.emailAddress) {
            ChatService.fetchVideoChats(user.primaryEmailAddress.emailAddress)
                .then(chats => {
                    dispatch(setCategoryChats({ tool: 'youtube', chats }));
                    // Map backend response to UI format (Keep local state for now if needed for specific mappings, or rely on Redux)
                    // The UI uses 'recentVideos' state currently for the Orchestrator InputView. 
                    // We can keep it to minimal changes.
                    const mapped = chats.map((c: any) => ({
                        id: c.id,
                        title: c.title, 
                        duration: `${c.summary ? 'Summary available' : 'Active'}`, 
                        date: c.date ? new Date(c.date).toLocaleDateString() : 'Recently',
                        url: c.youtube_url || (c.title.includes('http') ? c.title : `https://youtube.com/watch?v=${c.id.split('_').pop()}`)
                    }));
                    setRecentVideos(mapped);
                })
                .catch(err => console.error("Failed to load video chats", err));
        }
    }, [user, dispatch]);

    const handleUrlSubmit = async (url: string) => {
        if (!user?.id) return;
        setVideoUrl(url);
        
        // Start a new chat session immediately for this video
        const newChatId = `youtube_chat_${Date.now()}`;
        dispatch(startNewChat(newChatId));
        
        // Optionally fetch video title here or let backend do it on first message
        setVideoTitle("YouTube Video"); 
    };

    const loadVideoSession = async (chatId: string, url: string) => {
        if (!user?.primaryEmailAddress?.emailAddress) return;
        setSessionLoading(true);
        try {
            const history = await ChatService.fetchVideoChatHistory(user.primaryEmailAddress.emailAddress, chatId);
            
            dispatch(setCurrentChat({ 
                id: chatId, 
                messages: history,
                mediaContext: {
                    videoUrl: url,
                    videoTitle: "Resumed Session" // ideally from metadata
                }
            }));
            
            setVideoUrl(url);
            setVideoTitle("Resumed Session"); // ideally from metadata
        } catch (e) {
            console.error("Failed to load session", e);
            dispatch(setError("Could not load session"));
        } finally {
            setSessionLoading(false);
        }
    };

        const handleSendMessage = async (text: string) => {
        if (!user?.primaryEmailAddress?.emailAddress) return;
        if (!text.trim()) return;

        // Optimistic Update
        const tempMsg: Message = { id: Crypto.randomUUID(), role: 'human', content: text };
        dispatch(addMessage(tempMsg));
        setInputText('');
        setIsLoading(true);

        try {
            const chatIdToUse = currentChatId || `youtube_chat_${Date.now()}`;
            // Ensure redux knows we are in this chat session
            if (!currentChatId) dispatch(startNewChat(chatIdToUse));
            
            // Use videoRag (Feature 5)
            const data = await ChatService.videoRag(
                user.primaryEmailAddress.emailAddress,
                chatIdToUse,
                videoUrl || "",
                text
            );

            if (data.messages) {
                dispatch(setCurrentChat({ id: chatIdToUse, messages: data.messages }));
                
                // If backend provides title in latest answer or metadata, update it
                if (data.latest_answer?.title) {
                    setVideoTitle(data.latest_answer.title);
                }
            }
        } catch (error) {
            console.error('Message Error:', error);
            dispatch(setError("Failed to send message."));
        } finally {
            setIsLoading(false);
        }
    };

    const handleNewChat = () => {
        const newId = `youtube_chat_${Date.now()}`;
        dispatch(startNewChat(newId));
        setVideoUrl(null);
        setVideoTitle('');
    };

    const handleDeleteVideo = (video: { id: string; title: string }) => {
        Alert.alert(
            "Delete Chat",
            `Are you sure you want to delete the chat history for "${video.title}"?`,
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "Delete", 
                    style: "destructive",
                    onPress: async () => {
                        if (user?.primaryEmailAddress?.emailAddress) {
                            const success = await ChatService.deleteVideoChat(user.primaryEmailAddress.emailAddress, video.id);
                            if (success) {
                                setRecentVideos(prev => prev.filter(v => v.id !== video.id));
                            } else {
                                dispatch(setError("Failed to delete chat."));
                            }
                        }
                    }
                }
            ]
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />

            <LoadingComponent visible={isSessionLoading} text="Loading video session..." />
            <ErrorModal 
                visible={!!error} 
                error={error} 
                onDismiss={() => dispatch(setError(null as any))} 
            />

            <Modal
                visible={isDrawerOpen}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setDrawerOpen(false)}
            >
                <ReusableHistoryDrawer 
                    isModal
                    toolType="youtube"
                    onClose={() => setDrawerOpen(false)}
                    onNewChat={handleNewChat}
                    onChatSelect={(id) => {
                        // Find URL from recent videos if possible
                        const match = recentVideos.find(v => v.id === id);
                        loadVideoSession(id, match?.url || "https://youtube.com/placeholder");
                        setDrawerOpen(false);
                    }}
                />
            </Modal>

            {/* Orchestrator Logic */}
            {!videoUrl ? (
                <YoutubeInputView 
                    onUrlSubmit={handleUrlSubmit}
                    recentVideos={recentVideos}
                    onClose={() => router.back()}
                    onOpenHistory={() => setDrawerOpen(true)}
                    onVideoSelect={(video: any) => loadVideoSession(video.id, video.url)}
                    onVideoDelete={handleDeleteVideo}
                />
            ) : (
                <YoutubeChatView 
                    messages={messages}
                    onSendMessage={handleSendMessage}
                    onBack={() => setVideoUrl(null)}
                    onOpenDrawer={() => setDrawerOpen(true)}
                    onNewChat={handleNewChat}
                    videoTitle={videoTitle}
                    videoUrl={videoUrl}
                    isLoading={isLoading}
                    inputText={inputText}
                    setInputText={setInputText}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
});
