import { Message } from "@/components/ai-assistant/ChatMessage";
import ReusableHistoryDrawer from "@/components/ai-assistant/ReusableHistoryDrawer";
import GitaChatMessage from "@/components/gita-counselor/GitaChatMessage";
import GitaLanguageSelector from "@/components/gita-counselor/GitaLanguageSelector";
import ErrorModal from "@/components/ui/ErrorModal";
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

export default function GitaCounselorScreen() {
  const { user } = useUser();
  const dispatch = useDispatch();
  const router = useRouter();
  const { currentChatId, messages, loadingConversation, error, chatsByTool } =
    useSelector((state: RootState) => state.chat);

  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<"english" | "hindi">(
    "english",
  );
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // Focus effect - set active tool
  useFocusEffect(
    React.useCallback(() => {
      dispatch(setActiveTool("gita"));
      return () => {};
    }, [dispatch]),
  );

  // Initialize Chat List (Metadata Only)
  useEffect(() => {
    if (user?.primaryEmailAddress?.emailAddress) {
      ChatService.fetchGitaChats(user.primaryEmailAddress.emailAddress)
        .then((chats) => {
          dispatch(setCategoryChats({ tool: "gita", chats }));
        })
        .catch((err) => console.error("Failed to load Gita chats", err));
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
      chatId = `gita_${Date.now()}`;
      dispatch(startNewChat(chatId));
    }

    try {
      const data = await ChatService.gitaCounseling(
        user.primaryEmailAddress.emailAddress,
        chatId,
        text,
        selectedLanguage,
      );

      // Create AI message with full counseling data
      const aiMsg: Message = {
        id: `ai_${Date.now()}`,
        role: "ai",
        content: data.guidance,
        audio_url: data.audio_url,
        referenced_shlokas: data.referenced_shlokas || [],
        life_examples: data.life_examples || [],
        key_teachings: data.key_teachings || [],
        animate: true,
      };

      dispatch(addMessage(aiMsg));
    } catch (error) {
      console.error("Counseling Error:", error);
      dispatch(setError("Failed to get guidance. Please try again."));
      const errorMsg: Message = {
        id: Crypto.randomUUID(),
        role: "ai",
        content: "I'm sorry, I encountered an error. Please try again.",
      };
      dispatch(addMessage(errorMsg));
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = () => {
    const newId = `gita_${Date.now()}`;
    dispatch(startNewChat(newId));
  };

  const loadChat = async (chatId: string) => {
    if (!user?.primaryEmailAddress?.emailAddress) return;

    try {
      const history = await ChatService.fetchGitaHistory(
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

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <LoadingComponent
        visible={loadingConversation}
        text="Loading session..."
      />
      <ErrorModal
        visible={!!error}
        error={error}
        onDismiss={() => dispatch(setError(null as any))}
      />

      <ToolHeader
        title="Gita Counselor"
        mode="chat"
        onClose={() => {
          if (router.canGoBack()) {
            router.back();
          } else {
            router.replace("/(tabs)/(home)");
          }
        }}
        onHistory={() => setDrawerOpen(true)}
        rightChildren={
          <TouchableOpacity
            onPress={() => setShowLanguageSelector(true)}
            style={styles.languageButton}
          >
            <Ionicons name="language" size={20} color="#333" />
          </TouchableOpacity>
        }
      />

      <Modal
        visible={isDrawerOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setDrawerOpen(false)}
      >
        <ReusableHistoryDrawer
          isModal
          toolType="gita"
          onClose={() => setDrawerOpen(false)}
          onNewChat={handleNewChat}
          onChatSelect={(id) => {
            loadChat(id);
            setDrawerOpen(false);
          }}
        />
      </Modal>

      <GitaLanguageSelector
        visible={showLanguageSelector}
        currentLanguage={selectedLanguage}
        onSelect={(lang) => {
          setSelectedLanguage(lang);
          setShowLanguageSelector(false);
        }}
        onClose={() => setShowLanguageSelector(false)}
      />

      {/* Welcome Message if no chat started */}
      {uniqueMessages.length === 0 && (
        <View style={styles.welcomeContainer}>
          <View style={styles.welcomeIcon}>
            <Ionicons name="book" size={48} color="#FF9933" />
          </View>
          <Text style={styles.welcomeTitle}>
            Radhe Radhe! I am your Gita Guide.
          </Text>
          <Text style={styles.welcomeSubtitle}>
            Share your troubles, doubts, or dilemmas, and I shall seek wisdom
            from the Bhagavad Gita to guide you.
          </Text>
          <Text style={styles.welcomeHint}>Just now</Text>
        </View>
      )}

      {/* Messages List */}
      <FlatList
        ref={flatListRef}
        data={uniqueMessages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <GitaChatMessage message={item} onChipPress={handleSendMessage} />
        )}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({ animated: true })
        }
        ListFooterComponent={isLoading ? <ThinkingBubble /> : null}
      />

      {/* Input Area */}
      <KeyboardDock>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Share your doubt..."
            placeholderTextColor="#9CA3AF"
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              !inputText.trim() && styles.sendButtonDisabled,
            ]}
            onPress={() => handleSendMessage(inputText)}
            disabled={!inputText.trim() || isLoading}
          >
            <Ionicons name="send" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>
      </KeyboardDock>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  messagesList: {
    padding: 16,
    paddingBottom: 100,
  },
  welcomeContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  welcomeIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#FFF5E6",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
    marginBottom: 12,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 8,
  },
  welcomeHint: {
    fontSize: 13,
    color: "#9CA3AF",
    fontStyle: "italic",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: "#FFF",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: "#111827",
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#4F46E5",
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: {
    backgroundColor: "#D1D5DB",
  },
  languageButton: {
    padding: 4,
    marginRight: 8,
  },
});
