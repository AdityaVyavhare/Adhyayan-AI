import ChatMessage, { Message } from "@/components/ai-assistant/ChatMessage";
import ReusableHistoryDrawer from "@/components/ai-assistant/ReusableHistoryDrawer";
import ErrorModal from "@/components/ui/ErrorModal";
import FullScreenImageModal from "@/components/ui/FullScreenImageModal";
import KeyboardDock from "@/components/ui/KeyboardDock";
import LoadingComponent from "@/components/ui/LoadingComponent";
import ThinkingBubble from "@/components/ui/ThinkingBubble";
import ToolHeader from "@/components/ui/ToolHeader";
import { ChatService } from "@/services/ChatService";
import {
  addMessage,
  setActiveTool,
  setCategoryChats,
  setCurrentChat,
  setError,
  startNewChat,
} from "@/store/chatSlice";
import { RootState } from "@/store/store";
import { useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import * as Crypto from "expo-crypto";
import { Stack, useFocusEffect, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  FlatList,
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";

// Suggested prompts for new chat
const SUGGESTED_PROMPTS = [
  {
    icon: "bulb-outline" as const,
    title: "Explain a concept",
    prompt: "Explain the concept of machine learning with examples",
  },
  {
    icon: "calculator-outline" as const,
    title: "Solve a problem",
    prompt: "Help me solve this math problem step by step",
  },
  {
    icon: "book-outline" as const,
    title: "Study guide",
    prompt: "Create a study guide for calculus basics",
  },
  {
    icon: "flask-outline" as const,
    title: "Science topic",
    prompt: "Explain photosynthesis with a visual diagram",
  },
  {
    icon: "code-slash-outline" as const,
    title: "Coding help",
    prompt: "Explain how recursion works in programming",
  },
  {
    icon: "globe-outline" as const,
    title: "History lesson",
    prompt: "Tell me about the Industrial Revolution",
  },
];

export default function ChatScreen() {
  const { user } = useUser();
  const dispatch = useDispatch();
  const router = useRouter();
  const { currentChatId, messages, loadingConversation, error, chatsByTool } =
    useSelector((state: RootState) => state.chat);

  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);

  // Ensure we are in a "General" context when this screen is focused
  useFocusEffect(
    React.useCallback(() => {
      // Rule: Switching tools must reset active chat state
      // If we weren't already on general, clear everything.
      // But redux state persists. We should check if activeTool changed?
      // For safety per "Only ONE conversation active", we can clear if currentChatId is not a 'general' chat?
      console.log("ChatScreen Focused");
      dispatch(setActiveTool("general"));

      return () => {
        // Optional: Clear active chat on blur if strictly enforced?
        // Guide says "Switching tools must reset".
        // If we navigate away, we might want to keep it if we come back?
        // "Switching tools" implies going to another Tab.
      };
    }, [dispatch]),
  );

  // Initialize Chat List (Metadata Only)
  useEffect(() => {
    if (user?.primaryEmailAddress?.emailAddress) {
      // Rule: "Fetch chat list only using the tool’s history endpoint"
      // Rule: "Do NOT fetch full conversations on tool load"

      // Using setCategoryChats for strict tool isolation
      ChatService.fetchUserChats(user.primaryEmailAddress.emailAddress)
        .then((chats) => {
          dispatch(setCategoryChats({ tool: "general", chats }));
        })
        .catch((err) => console.error("Failed to load chats", err));
    }
  }, [user]);

  const handleSendMessage = async (text: string) => {
    if (!text || !user?.primaryEmailAddress?.emailAddress) return;

    const tempUserMsg: Message = {
      id: Crypto.randomUUID(),
      role: "human",
      content: text,
    };

    // Optimistic Update
    dispatch(addMessage(tempUserMsg));
    setInputText("");
    setIsLoading(true);

    // Generate ID if this is the first message in a new session
    let chatId = currentChatId;
    if (!chatId) {
      chatId = `chat_${Date.now()}`;
      // We must dispatch this to update Redux state immediately so UI reflects it
      dispatch(startNewChat(chatId));
    }

    try {
      // Find threadId
      const allChats = [
        ...chatsByTool.general,
        ...chatsByTool.pdf,
        ...chatsByTool.youtube,
      ];
      const chat = allChats.find((c) => c.id === chatId);
      const threadId = chat?.thread_id;

      const updatedMessages = await ChatService.sendMessage(
        user.primaryEmailAddress.emailAddress,
        chatId,
        text,
        threadId,
      );

      if (updatedMessages.length > 0) {
        dispatch(setCurrentChat({ id: chatId, messages: updatedMessages }));
      }
    } catch (error) {
      console.error("Chat Error:", error);
      dispatch(setError("Failed to send message. Please try again."));
      const errorMsg: Message = {
        id: Crypto.randomUUID(),
        role: "ai",
        body: "I'm sorry, I encountered an error. Please try again.",
      };
      dispatch(addMessage(errorMsg));
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = () => {
    const newId = `chat_${Date.now()}`;
    dispatch(startNewChat(newId));
  };

  const loadChat = async (chatId: string) => {
    if (!user?.primaryEmailAddress?.emailAddress) return;

    // Update redux state to reflect loading
    // We don't have a direct "setLoading" action exposed easily without a thunk or similar,
    // but we can manage local loading state if needed, or rely on `loadingConversation` if dispatch handles it.
    // For now, let's just fetch and update.

    try {
      // Dispatch set current chat immediately to switch context (even if empty initially)
      // But passing empty messages might flash empty screen.
      // Better to fetch first?
      // Guide says: "When a user switch the chat then load the past conversation".

      const history = await ChatService.fetchChatModelConversation(
        user.primaryEmailAddress.emailAddress,
        chatId,
      );

      dispatch(setCurrentChat({ id: chatId, messages: history }));
    } catch (e) {
      console.error("Failed to load chat history", e);
      dispatch(setError("Failed to load chat history"));
    }
  };

  const uniqueMessages = React.useMemo(() => {
    const seen = new Set();
    return messages.filter((msg) => {
      if (seen.has(msg.id)) return false;
      seen.add(msg.id);
      return true;
    });
  }, [messages]);

  // Render suggested prompts for empty state
  const renderSuggestedPrompts = () => {
    if (uniqueMessages.length > 0 || isLoading) return null;

    return (
      <View style={styles.suggestedPromptsContainer}>
        <Text style={styles.suggestedTitle}>Try asking me about...</Text>
        <View style={styles.promptsGrid}>
          {SUGGESTED_PROMPTS.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.promptCard}
              onPress={() => handleSendMessage(item.prompt)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={item.icon}
                size={32}
                color="#4C51BF"
                style={styles.promptIcon}
              />
              <Text style={styles.promptTitle}>{item.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <LoadingComponent
        visible={loadingConversation}
        text="Loading conversation..."
      />
      <ErrorModal
        visible={!!error}
        error={error}
        onDismiss={() => dispatch(setError(null as any))}
      />

      <FullScreenImageModal
        visible={!!fullScreenImage}
        imageUrl={fullScreenImage}
        onClose={() => setFullScreenImage(null)}
      />

      <ToolHeader
        title="AI Assistant"
        mode="chat"
        onClose={() => {
          if (router.canGoBack()) {
            router.back();
          } else {
            router.replace("/(tabs)/(home)");
          }
        }}
        onHistory={() => setDrawerOpen(true)}
      />

      <Modal
        visible={isDrawerOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setDrawerOpen(false)}
      >
        <ReusableHistoryDrawer
          isModal
          toolType="chat"
          onClose={() => setDrawerOpen(false)}
          onChatSelect={(id) => {
            setDrawerOpen(false);
            loadChat(id);
          }}
        />
      </Modal>

      <View style={styles.contentContainer}>
        <FlatList
          ref={flatListRef}
          data={uniqueMessages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ChatMessage
              message={item}
              onChipPress={(text) => handleSendMessage(text)}
              onImagePress={(uri) => setFullScreenImage(uri)}
            />
          )}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: true })
          }
          ListEmptyComponent={renderSuggestedPrompts}
          ListFooterComponent={isLoading ? <ThinkingBubble /> : null}
        />

        <KeyboardDock>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Ask a question..."
              placeholderTextColor="#9CA3AF"
              multiline
              editable={!(isLoading || loadingConversation)}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!inputText.trim() || isLoading || loadingConversation) &&
                  styles.disabledSend,
              ]}
              onPress={() => handleSendMessage(inputText)}
              disabled={!inputText.trim() || isLoading || loadingConversation}
            >
              <Ionicons name="arrow-up" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </KeyboardDock>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  contentContainer: {
    flex: 1,
    backgroundColor: "#f9fafb", // Light gray background for chat area
    position: "relative",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    height: 60,
    backgroundColor: "#fff",
    zIndex: 10,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  subtitle: {
    fontSize: 10,
    color: "#666",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  newChatButton: {
    padding: 8,
    backgroundColor: "#f3f4f6",
    borderRadius: 20,
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 220,
  },
  loadingContainer: {
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    color: "#666",
    fontSize: 12,
    fontStyle: "italic",
  },
  inputWrapper: {},
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 24, // Rounded pill shape
    paddingHorizontal: 16,
    height: 48,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: "#333",
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: "#4C51BF", // Dark Blue
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  disabledSend: {
    backgroundColor: "#a5a6d6",
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 8,
  },
  footerText: {
    fontSize: 10,
    color: "#ccc",
  },
  suggestedPromptsContainer: {
    flex: 1,
    paddingTop: 40,
    paddingHorizontal: 16,
  },
  suggestedTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
    marginBottom: 24,
  },
  promptsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  promptCard: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 120,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  promptIcon: {
    marginBottom: 8,
  },
  promptTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#4C51BF",
    textAlign: "center",
  },
});
