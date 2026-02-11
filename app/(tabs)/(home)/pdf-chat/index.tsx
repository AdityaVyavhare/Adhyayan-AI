import { Message } from '@/components/ai-assistant/ChatMessage';
import ReusableHistoryDrawer from '@/components/ai-assistant/ReusableHistoryDrawer';
import PdfChatView from '@/components/pdf-chat/PdfChatView';
import PdfUploadView from '@/components/pdf-chat/PdfUploadView';
import { ChatService } from '@/services/ChatService';
import { addMessage, setActiveTool, setCategoryChats, setCurrentChat, setError, startNewChat } from '@/store/chatSlice';
import { RootState } from '@/store/store';
import upload from '@/utils/upload';
import { useUser } from '@clerk/clerk-expo';
import * as Crypto from 'expo-crypto';
import * as DocumentPicker from 'expo-document-picker';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Modal, SafeAreaView, StyleSheet } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

export default function PdfChatScreen() {
    const { user } = useUser();
    const dispatch = useDispatch();
    const router = useRouter();
    
    // Redux State
    const { messages, currentChatId, loadingConversation, error, chatsByTool } = useSelector((state: RootState) => state.chat);
    
    // Local State
    const [pdfUri, setPdfUri] = useState<string | null>(null);
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [pdfName, setPdfName] = useState<string>('');
    
    const [isLoading, setIsLoading] = useState(false);
    const [inputText, setInputText] = useState('');
    const [isDrawerOpen, setDrawerOpen] = useState(false);

    // Context Switching Logic
    useFocusEffect(
        React.useCallback(() => {
             dispatch(setActiveTool('pdf'));
             // No auto-creation of chat on open, per "Do NOT fetch full conversations on tool load"
        }, [dispatch])
    );

    // Initialize Chat List (Metadata Only)
    useEffect(() => {
        if (user?.primaryEmailAddress?.emailAddress) {
            ChatService.fetchPdfChats(user.primaryEmailAddress.emailAddress)
                .then(chats => {
                    dispatch(setCategoryChats({ tool: 'pdf', chats }));
                })
                .catch(err => console.error("Failed to load PDF chats", err));
        }
    }, [user, dispatch]);

    const loadPdfSession = async (chatId: string, url?: string, title?: string) => {
        if (!user?.primaryEmailAddress?.emailAddress) return;
        setIsLoading(true);
        try {
            const history = await ChatService.fetchPdfConversation(user.primaryEmailAddress.emailAddress, chatId);
            
            // Dispatch with Media Context
            dispatch(setCurrentChat({ 
                id: chatId, 
                messages: history,
                mediaContext: {
                    pdfUrl: url // Critical: Restore the PDF context
                }
            }));
            
            // Set Local State to show Chat View
            setPdfUrl(url || null);
            setPdfUri(url || "https://example.com/placeholder.pdf"); // Fallback if URL is missing but we want to show chat
            setPdfName(title || "Restored Session");
            
        } catch (e) {
            console.error("Failed to load session", e);
            dispatch(setError("Could not load session"));
        } finally {
            setIsLoading(false);
        }
    };

    const pickDocument = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: 'application/pdf',
                copyToCacheDirectory: true,
            });

            if (result.canceled) return;

            const asset = result.assets[0];
            setPdfUri(asset.uri);
            setPdfName(asset.name);
            handleUpload(asset.uri, asset.name);
        } catch (error) {
            console.error('Error picking document:', error);
            dispatch(setError("Failed to pick document"));
        }
    };

    const handleUpload = async (uri: string, name: string) => {
        if (!user?.id) return;
        setIsLoading(true); 
        try {
            const publicUrl = await upload(user.id, uri, name);
            if (publicUrl) {
                setPdfUrl(publicUrl);
                
                // Start a new chat session immediately for this PDF
                const newChatId = `pdf_chat_${Date.now()}`;
                dispatch(startNewChat(newChatId));
            } else {
                throw new Error('Upload failed - No URL returned');
            }
        } catch (error) {
            console.error('Upload Error:', error);
            dispatch(setError("Could not upload PDF to server."));
            setPdfUri(null); 
            setPdfName('');
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
            const chatIdToUse = currentChatId || `pdf_chat_${Date.now()}`;
            if (!currentChatId) dispatch(startNewChat(chatIdToUse));
            
            // Use ingestPDF
            const data = await ChatService.ingestPDF(
                user.primaryEmailAddress.emailAddress,
                chatIdToUse,
                pdfUrl || "", 
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
        const newId = `pdf_chat_${Date.now()}`;
        dispatch(startNewChat(newId));
        setPdfUri(null);
        setPdfUrl(null);
        setPdfName('');
    };

    // ... render methods ... 

    return (
        <SafeAreaView style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />

            <Modal
                visible={isDrawerOpen}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setDrawerOpen(false)}
            >
                <ReusableHistoryDrawer 
                    isModal
                    toolType="pdf"
                    onClose={() => setDrawerOpen(false)}
                    onNewChat={handleNewChat}
                    onChatSelect={(id) => {
                        const chat = chatsByTool.pdf.find(c => c.id === id);
                        // @ts-ignore: Backend might return pdf_url directly 
                        loadPdfSession(id, chat?.mediaContext?.pdfUrl || chat?.pdf_url, chat?.title); // Handle both locations
                        setDrawerOpen(false);
                    }}
                />
            </Modal>

            {/* Orchestrator Logic */}
            {!pdfUri ? (
                <PdfUploadView 
                    onPickDocument={pickDocument}
                    onUrlSubmit={(url) => {
                        setPdfUri(url); // Should validate
                        setPdfUrl(url);
                        setPdfName("Document from URL");
                         // Start chat
                        const newId = `pdf_chat_${Date.now()}`;
                        dispatch(startNewChat(newId));
                    }}
                    onClose={() => router.back()}
                    onOpenHistory={() => setDrawerOpen(true)}
                />
            ) : (
                <PdfChatView 
                    messages={messages}
                    onSendMessage={handleSendMessage}
                    onBack={() => setPdfUri(null)}
                    onOpenDrawer={() => setDrawerOpen(true)}
                    onNewChat={handleNewChat}
                    pdfName={pdfName}
                    pdfUrl={pdfUrl}
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
