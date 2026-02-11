
import ChatMessage, { Message } from '@/components/ai-assistant/ChatMessage';
import FullScreenImageModal from '@/components/ui/FullScreenImageModal';
import ThinkingBubble from '@/components/ui/ThinkingBubble';
import ToolHeader from '@/components/ui/ToolHeader';
import { Ionicons } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import { Dimensions, FlatList, Platform, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import KeyboardDock from '@/components/ui/KeyboardDock';
import OcrContextPanel from './OcrContextPanel';

interface ScanChatViewProps {
  messages: Message[];
  onSendMessage: (text: string) => void;
  onBack: () => void;
  onOpenDrawer: () => void;
  onNewChat: () => void;
  onAddImage: () => void;
  isSessionLoading?: boolean;
  inputText: string;
  setInputText: (text: string) => void;
  storedImages?: any[]; // From history
}

export default function ScanChatView({
  messages,
  onSendMessage,
  onBack,
  onOpenDrawer,
  onNewChat,
  onAddImage,
  inputText,
  setInputText,
  isSessionLoading,
  storedImages = []
}: ScanChatViewProps) {
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);

  const handleSend = () => {
    if (inputText.trim()) {
      onSendMessage(inputText);
    }
  };

  const renderItem = ({ item }: { item: Message }) => {
    return (
        <ChatMessage 
            message={item} 
            onChipPress={onSendMessage} 
            onImagePress={(uri) => setFullScreenImage(uri)}
        />
    );
  };

  // Paranoid Deduplication
  const uniqueMessages = React.useMemo(() => {
      const seen = new Set();
      return messages.filter(msg => {
          if (seen.has(msg.id)) return false;
          seen.add(msg.id);
          return true;
      });
  }, [messages]);

  // Extract images from messages (ongoing session)
  const messageImages = uniqueMessages
      .filter(m => m.imageUrl)
      .map(m => ({
          image_url: m.imageUrl!,
          extracted_text: m.ocrText,
          extraction_timestamp: new Date().toISOString()
      }));
  
  const normalizedStoredImages = (storedImages || []).map((img: any) => {
      // Handle if img is a stringURL
      if (typeof img === 'string') return { image_url: img };
      // Handle if img is object but missing property or different key
      if (img && typeof img === 'object') {
          return {
              image_url: img.image_url || img.url || img.uri || "", // Fallback
              extracted_text: img.extracted_text || img.text || "",
              extraction_timestamp: img.extraction_timestamp || img.created_at
          };
      }
      return null;
  }).filter((img: any) => img && img.image_url) as any[]; // Type cast to avoid null inference issues

  const combinedImages = [...normalizedStoredImages, ...messageImages].filter((v,i,a)=> {
      if (!v || !v.image_url) return false;
      return a.findIndex(t => t && t.image_url === v.image_url) === i;
  });

  return (
    <View style={styles.container}>
      <ToolHeader 
        title="OCR Doubt Solver" 
        mode="tool" 
        onClose={onBack} 
        onHistory={onOpenDrawer}
        rightChildren={
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
                {/* Delete button moved to History Drawer as per requirements */}
                <TouchableOpacity onPress={onNewChat} style={{ padding: 4 }}>
                    <Ionicons name="add-circle-outline" size={24} color="#333" />
                </TouchableOpacity>
            </View>
        }
      />

      {/* Full Screen Image Modal */}
      {/* Full Screen Image Modal */}
      <FullScreenImageModal 
          visible={!!fullScreenImage} 
          imageUrl={fullScreenImage} 
          onClose={() => setFullScreenImage(null)} 
      />

      {/* Feature 2: OCR Context Panel */}
      <OcrContextPanel images={combinedImages} />

      <FlatList
        ref={flatListRef}
        data={uniqueMessages}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={[styles.listContent, { paddingBottom: 220 + insets.bottom }]}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        onLayout={() => flatListRef.current?.scrollToEnd()}
        ListFooterComponent={isSessionLoading ? <ThinkingBubble text="Analyzing image..." /> : null}
      />

      <KeyboardDock>
        <View style={[styles.inputContainer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <TouchableOpacity style={styles.attachButton} onPress={onAddImage}>
            <Ionicons name="images-outline" size={24} color="#4C51BF" />
          </TouchableOpacity>

          <TextInput
            style={styles.input}
            placeholder="Ask a question about your images..."
            placeholderTextColor="#9ca3af"
            value={inputText}
            onChangeText={setInputText}
            multiline
            scrollEnabled
            textAlignVertical="top"
            editable={!isSessionLoading}
          />

          <TouchableOpacity
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!inputText.trim() || !!isSessionLoading}
          >
            <Ionicons name="send" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardDock>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    position: 'relative',
  },
  modalContainer: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.9)',
      justifyContent: 'center',
      alignItems: 'center',
  },
  modalCloseButton: {
      position: 'absolute',
      top: 50,
      right: 20,
      zIndex: 10,
  },
  fullImage: {
      width: Dimensions.get('window').width,
      height: Dimensions.get('window').height * 0.8,
  },
  listContent: {
    padding: 16,
  },
  inputWrapper: {},
  inputContainer: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      padding: 12,
      paddingTop: 12,
  },
  attachButton: {
      padding: 10,
      marginRight: 8,
  },
  input: {
      flex: 1,
      minHeight: 40,
      maxHeight: 120,
      backgroundColor: '#f9fafb',
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingTop: 10,
      paddingBottom: 10,
      fontSize: 15,
      color: '#1f2937',
      marginRight: 8,
  },
  sendButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: '#4C51BF',
      justifyContent: 'center',
      alignItems: 'center',
  },
  sendButtonDisabled: {
      backgroundColor: '#cbd5e1',
  },
});
