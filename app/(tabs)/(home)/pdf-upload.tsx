import ChatMessage, { Message } from '@/components/ai-assistant/ChatMessage';
import ReusableHistoryDrawer from '@/components/ai-assistant/ReusableHistoryDrawer';
import { ChatService } from '@/services/ChatService';
import { addMessage, setChatList, setCurrentChat, startNewChat } from '@/store/chatSlice';
import { RootState } from '@/store/store';
import upload from '@/utils/upload';
import { useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import * as Crypto from 'expo-crypto';
import * as DocumentPicker from 'expo-document-picker';
import { Stack } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Modal,
    Platform,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useDispatch, useSelector } from 'react-redux';

export default function PdfUploadScreen() {
    const { user } = useUser();
    const dispatch = useDispatch();
    
    // Redux State
    const { messages, currentChatId, chatIds } = useSelector((state: RootState) => state.chat);
    
    // Local State
    const [pdfUri, setPdfUri] = useState<string | null>(null);
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isIngesting, setIsIngesting] = useState(false);
    const [inputText, setInputText] = useState('');
    const [isDrawerOpen, setDrawerOpen] = useState(false); // Drawer State
    
    const flatListRef = useRef<FlatList>(null);

    // Initial Fetch of Chats on Mount
    useEffect(() => {
        if (user?.primaryEmailAddress?.emailAddress) {
            ChatService.fetchUserChats(user.primaryEmailAddress.emailAddress)
                .then(ids => dispatch(setChatList(ids)))
                .catch(err => console.error("Failed to load chats", err));
        }
    }, [user, dispatch]);

    const pickDocument = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: 'application/pdf',
                copyToCacheDirectory: true,
            });

            if (result.canceled) return;

            const asset = result.assets[0];
            setPdfUri(asset.uri);
            handleUpload(asset.uri, asset.name);
        } catch (error) {
            console.error('Error picking document:', error);
            Alert.alert('Error', 'Failed to pick document');
        }
    };

    const handleUpload = async (uri: string, name: string) => {
        if (!user?.id) return;
        setIsUploading(true);
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
            Alert.alert('Upload Failed', 'Could not upload PDF to server.');
            setPdfUri(null); 
        } finally {
            setIsUploading(false);
        }
    };

    const handleSendMessage = async () => {
        if (!user?.primaryEmailAddress?.emailAddress) return;
        const text = inputText.trim();
        if (!text) return;

        // Optimistic Update
        const tempMsg: Message = { id: Crypto.randomUUID(), role: 'human', content: text };
        dispatch(addMessage(tempMsg));
        setInputText('');
        setIsIngesting(true);

        try {
            const chatIdToUse = currentChatId || `chat_${Date.now()}`;
            
            // We use ingestPDF as the primary "User sends message" tool for this screen
            const data = await ChatService.ingestPDF(
                user.primaryEmailAddress.emailAddress,
                chatIdToUse,
                pdfUrl || "", // If empty, backend might fail, handle gracefully?
                text
            );

            // Update with real response
            if (data.messages) {
                // messages are already mapped in ChatService now
                dispatch(setCurrentChat({ id: chatIdToUse, messages: data.messages }));
            }

        } catch (error) {
            console.error('Message Error:', error);
            Alert.alert('Error', 'Failed to send message.');
        } finally {
            setIsIngesting(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <Stack.Screen 
                options={{ 
                    title: 'PDF Chat', 
                    headerRight: () => (
                        <TouchableOpacity onPress={() => setDrawerOpen(true)} style={{marginRight: 10}}>
                            <Ionicons name="time-outline" size={24} color="#007AFF" />
                        </TouchableOpacity>
                    ),
                    headerBackTitle: 'Home'
                }} 
            />

            {/* Modal Drawer */}
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
                    onChatSelect={(id) => {
                        // Logic handled inside component + redux, just close drawer
                        console.log("Selected:", id);
                    }}
                />
            </Modal>

            {/* Split View: PDF (Top) vs Chat (Bottom) */}
            <View style={styles.contentContainer}>
                
                {/* PDF Preview Section */}
                {!pdfUri ? (
                    <View style={styles.uploadSection}>
                        <Ionicons name="document-text-outline" size={64} color="#ccc" />
                        <Text style={styles.emptyText}>Upload a PDF to analyze</Text>
                        <TouchableOpacity style={styles.uploadButton} onPress={pickDocument}>
                            <Text style={styles.uploadButtonText}>Select PDF</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.pdfContainer}>
                        {pdfUrl ? (
                             <WebView
                                source={{ uri: `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(pdfUrl)}` }}
                                style={{ flex: 1 }}
                                startInLoadingState={true}
                                renderLoading={() => <ActivityIndicator style={styles.loading} color="#0000ff" />}
                             />
                        ) : (
                            <View style={styles.placeholder}>
                                <ActivityIndicator size="large" color="#2563EB" />
                                <Text style={styles.uploadingText}>Uploading PDF...</Text>
                            </View>
                        )}
                        {/* Reset/Cancel Button */}
                        <TouchableOpacity style={styles.closePdfButton} onPress={() => { setPdfUri(null); setPdfUrl(null); }}>
                            <Ionicons name="close-circle" size={24} color="#fff" />
                        </TouchableOpacity>
                    </View>
                )}

                {/* Inline Chat Section */}
                <KeyboardAvoidingView 
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
                    style={styles.chatSection}
                >
                    <View style={styles.chatHeader}>
                         <Text style={styles.chatTitle}>
                            {currentChatId ? 'Conversation' : 'Start a Chat'}
                         </Text>
                    </View>

                    <FlatList
                        ref={flatListRef}
                        data={messages}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => <ChatMessage message={item} />}
                        contentContainerStyle={styles.chatList}
                        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                        ListEmptyComponent={
                            <View style={styles.emptyChat}>
                                <Text style={styles.emptyChatText}>
                                    {pdfUrl ? "Ask a question about the PDF above." : "Upload a PDF to start."}
                                </Text>
                            </View>
                        }
                    />
                    
                    {/* Input Area */}
                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder="Ask a question..."
                            value={inputText}
                            onChangeText={setInputText}
                            editable={!isIngesting} // Allow typing even if no PDF if continuing chat?
                        />
                        <TouchableOpacity 
                            style={[styles.sendButton, isIngesting && styles.disabledSend]} 
                            onPress={handleSendMessage}
                            disabled={isIngesting}
                        >
                            {isIngesting ? (
                                <ActivityIndicator color="#fff" size="small" />
                            ) : (
                                <Ionicons name="send" size={20} color="#fff" />
                            )}
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9fafb',
    },
    contentContainer: {
        flex: 1,
    },
    uploadSection: {
        flex: 1, // Full screen if no PDF
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f2f2f2',
    },
    pdfContainer: {
        height: '40%', // Fixed height for PDF preview
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
        position: 'relative',
    },
    placeholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#eee',
    },
    chatSection: {
        flex: 1, // Takes remaining space
        backgroundColor: '#fff',
    },
    chatHeader: {
        padding: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        alignItems: 'center',
    },
    chatTitle: {
        fontSize: 12,
        fontWeight: '600',
        color: '#999',
    },
    chatList: {
        padding: 16,
    },
    inputContainer: {
        flexDirection: 'row',
        padding: 10,
        borderTopWidth: 1,
        borderTopColor: '#eee',
        alignItems: 'center',
    },
    input: {
        flex: 1,
        backgroundColor: '#f1f5f9',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 10,
        marginRight: 10,
        fontSize: 16,
    },
    sendButton: {
        backgroundColor: '#2563EB',
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    disabledSend: {
        backgroundColor: '#cbd5e1',
    },
    emptyText: {
        marginTop: 16,
        fontSize: 16,
        color: '#6b7280',
        marginBottom: 24,
    },
    uploadingText: {
        marginTop: 8,
        color: '#666',
    },
    uploadButton: {
        backgroundColor: '#2563EB',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    uploadButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
    closePdfButton: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 15,
    },
    loading: {
        position: 'absolute',
        top: '50%',
        left: '50%',
    },
    emptyChat: {
        alignItems: 'center',
        marginTop: 20,
    },
    emptyChatText: {
        color: '#aaa',
        fontStyle: 'italic',
    },
});
