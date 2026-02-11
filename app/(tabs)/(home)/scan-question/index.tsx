import { Message } from '@/components/ai-assistant/ChatMessage';
import ReusableHistoryDrawer from '@/components/ai-assistant/ReusableHistoryDrawer';
import ScanChatView from '@/components/scan-question/ScanChatView';
import ScanLandingView from '@/components/scan-question/ScanLandingView';
import ScanPreviewView from '@/components/scan-question/ScanPreviewView';
import ErrorModal from '@/components/ui/ErrorModal';
import LoadingComponent from '@/components/ui/LoadingComponent';
import ToolHeader from '@/components/ui/ToolHeader';
import { ChatService } from '@/services/ChatService';
import { addMessage, clearActiveChat, setActiveTool, setCategoryChats, setCurrentChat, setError, startNewChat } from '@/store/chatSlice';
import { RootState } from '@/store/store';
import upload from '@/utils/upload';
import { useUser } from '@clerk/clerk-expo';
import * as Crypto from 'expo-crypto';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Modal, SafeAreaView, StyleSheet } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

export default function ScanQuestionScreen() {
    const { user } = useUser();
    const dispatch = useDispatch();
    const router = useRouter();
    
    // Redux State
    const { messages, currentChatId, error, activeMediaContext } = useSelector((state: RootState) => state.chat);
    
    // Local State
    const [imageUri, setImageUri] = useState<string | null>(null);
    const [previewUri, setPreviewUri] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSessionLoading, setSessionLoading] = useState(false);
    const [inputText, setInputText] = useState('');
    const [isDrawerOpen, setDrawerOpen] = useState(false);

    // Context Switching Logic
    useFocusEffect(
        React.useCallback(() => {
             dispatch(setActiveTool('scan'));
             // No auto-create
        }, [dispatch])
    );

    // Initial Fetch (Lazy loaded on mount)
    useEffect(() => {
        if (user?.primaryEmailAddress?.emailAddress) {
            ChatService.fetchScanChats(user.primaryEmailAddress.emailAddress)
                .then(chats => {
                    dispatch(setCategoryChats({ tool: 'scan', chats }));
                })
                .catch(err => console.error("Failed to load Scan chats", err));
        }
    }, [user, dispatch]);

    const handleImageSelection = async (source: 'camera' | 'gallery') => {
        try {
            let result;
            if (source === 'camera') {
                const permission = await ImagePicker.requestCameraPermissionsAsync();
                if (!permission.granted) {
                    dispatch(setError("Camera permission required"));
                    return;
                }
                result = await ImagePicker.launchCameraAsync({
                    // @ts-ignore: Deprecation warning fix
                    mediaTypes: ImagePicker.MediaTypeOptions.Images,
                    quality: 0.8,
                });
            } else {
                result = await ImagePicker.launchImageLibraryAsync({
                    // @ts-ignore: Deprecation warning fix
                    mediaTypes: ImagePicker.MediaTypeOptions.Images,
                    quality: 0.8,
                });
            }

            if (!result.canceled && result.assets[0]) {
                const asset = result.assets[0];
                // handleImageProcess(asset.uri); // Old auto-process
                setPreviewUri(asset.uri); // New preview flow
            }
        } catch (err) {
            console.error("Image Picker Error:", err);
            dispatch(setError("Failed to select image"));
        }
    };

    const handlePreviewSend = async (text: string) => {
        if (previewUri) {
            await handleImageProcess(previewUri, text);
            setPreviewUri(null);
        }
    };

    const handleImageProcess = async (uri: string, initialMessage: string = "") => {
        if (!user?.id) return;
        
        setImageUri(uri);
        setIsLoading(true);

        try {
            // 1. Upload Image
            // We assume upload util works for images too or needs adjustment? 
            // utils/upload usually takes uri and name.
            const filename = uri.split('/').pop() || 'image.jpg';
            const publicUrl = await upload(user.id, uri, filename);
            
            if (!publicUrl) throw new Error("Upload failed");

            // 2. Start Chat if needed
            let chatIdToUse = currentChatId;
            if (!chatIdToUse || !chatIdToUse.startsWith('scan_')) {
                chatIdToUse = `scan_chat_${Date.now()}`;
                dispatch(startNewChat(chatIdToUse));
            }

            // 3. Add User Message with Image (Locally)
            const userMsg: Message = {
                id: Crypto.randomUUID(),
                role: 'human',
                content: initialMessage,
                imageUrl: uri, // Use local URI for display
                ocrText: "Processing image..." 
            };
            dispatch(addMessage(userMsg));

            // 4. Call API
            const data = await ChatService.scanQuestion(
                user.primaryEmailAddress!.emailAddress,
                chatIdToUse,
                publicUrl,
                initialMessage 
            );

            // 5. Update Chat with Response
            if (data.messages) {
                // Update conversation. 
                // BE CAREFUL: standard setCurrentChat replaces messages.
                // We want to APPEND or replace intelligently.
                // For now, let's respect the backend's "full state" return if that's what it is.
                // If it returns full history, setCurrentChat is fine.
                dispatch(setCurrentChat({ id: chatIdToUse, messages: data.messages }));
            }

        } catch (e) {
            console.error("Scan Process Error:", e);
            dispatch(setError("Failed to process image"));
        } finally {
            setIsLoading(false);
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
            const chatIdToUse = currentChatId || `scan_chat_${Date.now()}`;
            
            // Re-use scanQuestion endpoint? Or generic chat?
            // If we are in a scan chat, we might want to continue context.
            // Let's assume scanQuestion handles text-only follow-ups if image_url is empty/old.
            // Or use sendMessage?
            // "Ask a follow-up based on this step" -> generic chat usually.
            // But let's stick to Tool specific if possible.
            // `scanQuestion` takes image_url. 
            // If we have previous image context in backend, maybe we don't send it again?
            // Let's send empty string for image if just text.
            
            const data = await ChatService.scanQuestion(
                user.primaryEmailAddress.emailAddress,
                chatIdToUse,
                "", // No new image
                text
            );

            if (data.messages) {
                dispatch(setCurrentChat({ id: chatIdToUse, messages: data.messages }));
            }
        } catch (error) {
            console.error('Message Error:', error);
            dispatch(setError("Failed to send message."));
        } finally {
            setIsLoading(false);
        }
    };

    const handleNewChat = () => {
        const newId = `scan_chat_${Date.now()}`;
        dispatch(startNewChat(newId));
        setImageUri(null);
    };

    const loadScanSession = async (chatId: string) => {
        if (!user?.primaryEmailAddress?.emailAddress) return;
        setSessionLoading(true);
        try {
            const { messages, images } = await ChatService.fetchScanConversation(user.primaryEmailAddress.emailAddress, chatId);
            
            dispatch(setCurrentChat({ 
                id: chatId, 
                messages: messages,
                mediaContext: {
                    images: images // extracted_text, image_url, etc.
                }
            }));
            
            // If history has images, we might want to set imageUri to the latest one?
            // For now, just show chat view.
            setImageUri("session_restored"); // Hack to show chat view
        } catch (e) {
            console.error("Failed to load session", e);
            dispatch(setError("Could not load session"));
        } finally {
            setSessionLoading(false);
        }
    };

    // handleDeleteChat removed as deletion is now handled by ReusableHistoryDrawer

    return (
        <SafeAreaView style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />

            <LoadingComponent visible={isSessionLoading} text="Loading scan session..." />
            <LoadingComponent visible={isLoading} text="Processing..." />
            
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
                    toolType="scan"
                    onClose={() => setDrawerOpen(false)}
                    onNewChat={handleNewChat}
                    onChatSelect={(id) => {
                        loadScanSession(id);
                        setDrawerOpen(false);
                    }}
                />
            </Modal>

            {/* View Logic */}
            {imageUri && (
                <ScanChatView 
                    messages={messages}
                    onSendMessage={handleSendMessage}
                    onBack={() => {
                        setImageUri(null);
                        dispatch(clearActiveChat()); 
                    }}
                    onOpenDrawer={() => setDrawerOpen(true)}
                    onNewChat={handleNewChat}
                    onAddImage={() => handleImageSelection('gallery')} 
                    isSessionLoading={isLoading || isSessionLoading}
                    inputText={inputText}
                    setInputText={setInputText}
                    storedImages={activeMediaContext?.images}
                />
            )}

            {!imageUri && previewUri ? (
                <ScanPreviewView 
                    imageUri={previewUri}
                    onRetake={() => setPreviewUri(null)}
                    onSend={handlePreviewSend}
                    isLoading={isLoading}
                />
            ) : !imageUri && (
                <>
                    <ToolHeader 
                        title="Scan Question"
                        onClose={() => router.back()}
                        onHistory={() => setDrawerOpen(true)}
                    />
                    <ScanLandingView 
                        onCameraPress={() => handleImageSelection('camera')}
                        onGalleryPress={() => handleImageSelection('gallery')}
                    />
                </>
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
