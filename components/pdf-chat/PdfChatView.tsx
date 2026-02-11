import { Message } from '@/components/ai-assistant/ChatMessage';
import ThinkingBubble from '@/components/ui/ThinkingBubble';
import ToolHeader from '@/components/ui/ToolHeader';

import KeyboardDock from '@/components/ui/KeyboardDock';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    useWindowDimensions
} from 'react-native';
import { WebView } from 'react-native-webview';
import PdfChatMessage from './PdfChatMessage';

interface PdfChatViewProps {
    messages: Message[];
    onSendMessage: (text: string) => void;
    onBack: () => void;
    onOpenDrawer: () => void;
    onNewChat: () => void;
    pdfName: string;
    pdfUrl: string | null;
    isLoading: boolean;
    inputText: string;
    setInputText: (text: string) => void;
}

export default function PdfChatView({ 
    messages, 
    onSendMessage, 
    onBack, 
    onOpenDrawer, 
    onNewChat,
    pdfName, 
    pdfUrl,
    isLoading,
    inputText,
    setInputText
}: PdfChatViewProps) {
    const flatListRef = useRef<FlatList>(null);
    const { height } = useWindowDimensions();
    const [showPdf, setShowPdf] = useState(true); // Default to true as per user request

    // Key fix: Filter out duplicate messages by ID to ensure "single instance" rendering
    const uniqueMessages = React.useMemo(() => {
        const seen = new Set();
        return messages.filter(msg => {
            if (seen.has(msg.id)) return false;
            seen.add(msg.id);
            return true;
        });
    }, [messages]);

    // Google Docs Viewer for Android/Web as fallback, direct valid PDF URL for iOS
    const getViewerUrl = (url: string) => {
        if (Platform.OS === 'android') {
            return `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(url)}`;
        }
        return url; 
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <ToolHeader 
                title="PDF Tutor" 
                onClose={onBack} 
                onHistory={onOpenDrawer}
                rightChildren={
                    <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
                         {pdfUrl && (
                            <TouchableOpacity 
                                onPress={() => setShowPdf(!showPdf)} 
                                style={[styles.pdfToggle, showPdf && styles.pdfToggleActive]}
                            >
                                <Ionicons 
                                    name={showPdf ? "document" : "document-outline"} 
                                    size={15} 
                                    color={showPdf ? "#fff" : "#6B7280"} 
                                    // paddingHorizontal={8}
                                />
                                {/* <Text style={[styles.pdfToggleText, showPdf && {color:'#fff'}]}>
                                    {showPdf ? 'Hide' : 'View'}
                                </Text> */}
                            </TouchableOpacity>
                         )}
                         
                         <TouchableOpacity onPress={onNewChat} style={styles.newChatButton}>
                             <MaterialCommunityIcons name="plus" size={18} color="#4C51BF" />
                         </TouchableOpacity>
                    </View>
                }
            />

            {/* Content Area - Split View */}
            <View style={styles.contentContainer}>
                
                {/* Top Half: PDF Preview */}
                {showPdf && pdfUrl ? (
                    <View style={styles.pdfContainer}>
                        <WebView
                            source={{ uri: getViewerUrl(pdfUrl) }}
                            style={{ flex: 1 }}
                            startInLoadingState
                            renderLoading={() => (
                                <View style={styles.pdfLoading}>
                                    <ActivityIndicator size="large" color="#4C51BF" />
                                    <Text style={{marginTop: 8, color: '#666'}}>Loading PDF...</Text>
                                </View>
                            )}
                        />
                    </View>
                ) : null}

                {/* Bottom Half: Chat Interface */}
                <View style={[styles.chatContainer, showPdf && { borderTopWidth: 1, borderTopColor: '#e5e7eb' }, { position: 'relative' }]}>
                    <FlatList
                        ref={flatListRef}
                        data={uniqueMessages}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => (
                            <PdfChatMessage 
                                message={item} 
                                onChipPress={(text) => onSendMessage(text)}
                            />
                        )}
                        contentContainerStyle={styles.listContent}
                        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                        ListFooterComponent={isLoading ? <ThinkingBubble text="Analyzing document..." /> : null}
                    />

                    <KeyboardDock>
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.input}
                                value={inputText}
                                onChangeText={setInputText}
                                placeholder="Ask about the PDF..."
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
    pdfName: {
        fontSize: 10,
        color: '#666',
        maxWidth: 150,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    pdfToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: .5,
        borderColor: '#E5E7EB', // Light gray border for inactive
        backgroundColor: '#F9FAFB', // Very light gray bg for inactive
        paddingVertical: 6,
        paddingHorizontal: 7,
        borderRadius: 20,
    },
    pdfToggleActive: {
        backgroundColor: '#1F2937', // Dark background for active
        borderColor: '#1F2937',
    },
    pdfToggleText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#6B7280', // Gray text for inactive
        marginLeft: 4,
    },
    newChatButton: {
        padding: 8,
        backgroundColor: '#f3f4f6',
        borderRadius: 20,
    },
    contentContainer: {
        flex: 1,
    },
    // Split View Styling
    pdfContainer: {
        height: '40%', // Take up top 40%
        backgroundColor: '#f3f4f6',
    },
    pdfLoading: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    chatContainer: {
        flex: 1, // Take remaining space
        backgroundColor: '#f9f9f9',
    },
    listContent: {
        padding: 16,
        paddingBottom: 220,
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
    },
    loadingText: {
        marginLeft: 8,
        color: '#666',
        fontSize: 12,
        fontStyle: 'italic',
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
        minHeight: 44,
        maxHeight: 100,
    },
    input: {
        flex: 1,
        fontSize: 14,
        color: '#333',
        paddingVertical: 8,
    },
    sendButton: {
        backgroundColor: '#4C51BF',
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
    disabledSend: {
        backgroundColor: '#a5a6d6',
    },
});
