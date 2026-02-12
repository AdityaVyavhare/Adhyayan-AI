import { ChatService } from "@/services/ChatService";
import {
  setCategoryChats,
  setCurrentChat,
  setLoadingConversation,
  startNewChat,
} from "@/store/chatSlice";
import { RootState } from "@/store/store";
import { useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";

interface ReusableHistoryDrawerProps {
  onChatSelect?: (chatId: string) => void;
  onNewChat?: () => void;
  onClose?: () => void;
  isModal?: boolean;
  toolType?: "pdf" | "chat" | "youtube" | "scan" | "all" | "podcast" | "gita"; // Added 'gita'
}

export default function ReusableHistoryDrawer({
  onChatSelect,
  onNewChat,
  onClose,
  isModal = false,
  toolType = "all",
}: ReusableHistoryDrawerProps) {
  const dispatch = useDispatch();
  const { user } = useUser();
  const { chatsByTool, chatIds, currentChatId, loadingConversation } =
    useSelector((state: RootState) => state.chat);

  const handleNewChat = () => {
    // Generate new ID based on toolType
    let prefix = "chat_";
    if (toolType === "pdf") prefix = "pdf_chat_";
    else if (toolType === "youtube") prefix = "youtube_chat_";
    else if (toolType === "scan") prefix = "scan_chat_";
    else if (toolType === "gita") prefix = "gita_";

    const newId = `${prefix}${Date.now()}`;
    dispatch(startNewChat(newId));
    if (onNewChat) onNewChat();
    if (onClose) onClose();
  };

  // Filter chats based on toolType using the categorized state
  const filteredChatIds = React.useMemo(() => {
    if (toolType === "pdf") return chatsByTool.pdf;
    if (toolType === "youtube") return chatsByTool.youtube;
    if (toolType === "scan") return chatsByTool.scan;
    if (toolType === "chat") return chatsByTool.general;
    if (toolType === "gita") return (chatsByTool as any).gita || [];
    if (toolType === "podcast") return chatsByTool.podcast;

    // Fallback to all if 'all' - Map IDs to rich objects
    const allSessions = [
      ...chatsByTool.general,
      ...chatsByTool.pdf,
      ...chatsByTool.youtube,
      ...chatsByTool.scan,
    ];
    return chatIds.map((id) => {
      const session = allSessions.find((s) => s.id === id);
      if (session) return session;
      return { id, title: "Chat", date: new Date().toISOString() };
    });
  }, [chatsByTool, chatIds, toolType]);

  const handleSelectChat = async (id: string) => {
    if (!user?.primaryEmailAddress?.emailAddress) return;

    // Set loading state
    dispatch(setLoadingConversation(true));
    try {
      console.log(`Loading chat: ${id} for tool: ${toolType}`);
      let messages: any[] = [];

      const chatObj = filteredChatIds.find((c: any) => c.id === id);
      const threadId = chatObj?.thread_id;

      if (toolType === "youtube") {
        messages = await ChatService.fetchVideoChatHistory(
          user.primaryEmailAddress.emailAddress,
          id,
        );
      } else if (toolType === "pdf") {
        messages = await ChatService.fetchPdfConversation(
          user.primaryEmailAddress.emailAddress,
          id,
          threadId,
        );
      } else if (toolType === "scan") {
        const result = await ChatService.fetchScanConversation(
          user.primaryEmailAddress.emailAddress,
          id,
        );
        messages = result.messages; // Fix: Destructure to get messages array
      } else if (toolType === "podcast") {
        // For podcast, the screen handles loading via onChatSelect.
        // We just update the ID in global state if needed, or do nothing here.
        dispatch(setCurrentChat({ id, messages: [] }));
      } else if (toolType === "gita") {
        messages = await ChatService.fetchGitaHistory(
          user.primaryEmailAddress.emailAddress,
          id,
        );
      } else {
        messages = await ChatService.fetchChatModelConversation(
          user.primaryEmailAddress.emailAddress,
          id,
          threadId,
        );
      }

      if (toolType !== "podcast" && toolType !== "gita") {
        dispatch(setCurrentChat({ id, messages }));
      }

      if (onChatSelect) onChatSelect(id);
      if (onClose) onClose();
    } catch (error) {
      console.error("Failed to load conversation", error);
    } finally {
      dispatch(setLoadingConversation(false));
    }
  };

  const handleDeleteChat = async (chatId: string) => {
    if (!user?.primaryEmailAddress?.emailAddress) return;

    // UX Confirmation
    // We can use Alert.alert but inside a modal it might be tricky on some platforms? React Native Alert works over modals usually.

    const performDelete = async () => {
      let success = false;
      if (toolType === "youtube") {
        success = await ChatService.deleteVideoChat(
          user.primaryEmailAddress!.emailAddress,
          chatId,
        );
      } else if (toolType === "scan") {
        success = await ChatService.deleteScanChat(
          user.primaryEmailAddress!.emailAddress,
          chatId,
        );
      } else if (toolType === "pdf") {
        success = await ChatService.deletePdfChat(
          user.primaryEmailAddress!.emailAddress,
          chatId,
        );
      } else if (toolType === "gita") {
        success = await ChatService.deleteGitaChat(
          user.primaryEmailAddress!.emailAddress,
          chatId,
        );
      } else if (toolType === "podcast") {
        success = await ChatService.deletePodcastChat(
          user.primaryEmailAddress!.emailAddress,
          chatId,
        );
      } else {
        success = await ChatService.deleteChat(
          user.primaryEmailAddress!.emailAddress,
          chatId,
        );
      }

      if (success) {
        // Remove from Redux state locally so UI updates immediately
        // We need to find which category this chat belongs to and update it.
        // Since we know `toolType` (or it's 'all'), we can try to find and remove.

        // Helper to filter
        const remove = (list: any[]) => list.filter((c) => c.id !== chatId);

        if (toolType === "all" || toolType === "chat") {
          const updated = remove(chatsByTool.general);
          if (updated.length !== chatsByTool.general.length)
            dispatch(setCategoryChats({ tool: "general", chats: updated }));
        }
        if (toolType === "all" || toolType === "pdf") {
          const updated = remove(chatsByTool.pdf);
          if (updated.length !== chatsByTool.pdf.length)
            dispatch(setCategoryChats({ tool: "pdf", chats: updated }));
        }
        if (toolType === "all" || toolType === "youtube") {
          const updated = remove(chatsByTool.youtube);
          if (updated.length !== chatsByTool.youtube.length)
            dispatch(setCategoryChats({ tool: "youtube", chats: updated }));
        }
        if (toolType === "all" || toolType === "scan") {
          const updated = remove(chatsByTool.scan);
          if (updated.length !== chatsByTool.scan.length)
            dispatch(setCategoryChats({ tool: "scan", chats: updated }));
        }
        if (toolType === "all" || toolType === "podcast") {
          const list = (chatsByTool as any).podcast || [];
          const updated = remove(list);
          dispatch(setCategoryChats({ tool: "podcast", chats: updated }));
        }
        if (toolType === "all" || toolType === "gita") {
          const list = (chatsByTool as any).gita || [];
          const updated = remove(list);
          dispatch(setCategoryChats({ tool: "gita", chats: updated }));
        }

        // If current chat was deleted, clear it?
        if (currentChatId === chatId) {
          // Close drawer? Maybe not. Just clear current chat?
          // But we are mainly navigating history.
        }
      }
    };

    Alert.alert("Delete Chat", "Are you sure you want to delete this chat?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: performDelete },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your chats</Text>

        {/* Close Button if Modal */}
        {isModal && onClose && (
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {loadingConversation ? (
          <ActivityIndicator style={{ margin: 20 }} />
        ) : null}

        {/* Chats List */}
        <Text style={styles.sectionHeader}>RECENT</Text>
        {filteredChatIds.length === 0 ? (
          <Text style={{ padding: 16, color: "#666", fontStyle: "italic" }}>
            No recent chats found.
          </Text>
        ) : (
          filteredChatIds.map((chat: any) => (
            <DrawerItem
              key={chat.id}
              chatId={chat.id}
              title={chat.title || "Untitled Chat"}
              subtitle={
                chat.date ? new Date(chat.date).toLocaleDateString() : ""
              }
              isActive={currentChatId === chat.id}
              onPress={() => handleSelectChat(chat.id)}
              onDelete={() => handleDeleteChat(chat.id)}
            />
          ))
        )}
      </ScrollView>

      {/* Footer Actions */}
      <View style={styles.footerContainer}>
        <TouchableOpacity
          style={styles.startNewChatButton}
          onPress={handleNewChat}
        >
          <Ionicons
            name="add"
            size={20}
            color="#fff"
            style={{ marginRight: 8 }}
          />
          <Text style={styles.startNewChatText}>Start New Chat</Text>
        </TouchableOpacity>
        <UserProfileFooter />
      </View>
    </View>
  );
}

function DrawerItem({
  chatId,
  title,
  subtitle,
  onPress,
  onDelete,
  isActive,
}: any) {
  return (
    <TouchableOpacity
      style={[styles.drawerItemCard, isActive && styles.activeDrawerItem]}
      onPress={onPress}
    >
      <View style={styles.cardHeader}>
        <Text
          style={[styles.cardTitle, isActive && styles.activeText]}
          numberOfLines={1}
        >
          {title}
        </Text>
      </View>
      <Text
        style={[styles.cardSubtitle, isActive && styles.activeSubtitle]}
        numberOfLines={1}
      >
        {subtitle}
      </Text>
      <View style={styles.cardFooter}>
        <Text style={[styles.cardDate, isActive && styles.activeSubtitle]}>
          10:42 AM
        </Text>
        {onDelete && (
          <TouchableOpacity style={styles.deleteButton} onPress={onDelete}>
            <Ionicons
              name="trash-outline"
              size={16}
              color={isActive ? "#ef4444" : "#ff6b6b"}
            />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

function UserProfileFooter() {
  const { user } = useSelector((state: RootState) => state.profile) || {};
  const clerkUser = useUser().user;

  const displayUser = user || {
    username: clerkUser?.fullName || "Aditi Sharma",
    email:
      clerkUser?.primaryEmailAddress?.emailAddress || "student@example.com",
    avatarUrl: clerkUser?.imageUrl,
  };

  return (
    <View style={styles.userFooter}>
      {displayUser.avatarUrl ? (
        <Image
          source={{ uri: displayUser.avatarUrl }}
          style={styles.userAvatar}
        />
      ) : (
        <View
          style={[
            styles.userAvatar,
            { justifyContent: "center", alignItems: "center" },
          ]}
        >
          <Ionicons name="person" size={20} color="#666" />
        </View>
      )}
      <View style={{ marginLeft: 12, flex: 1 }}>
        <Text style={styles.userName}>{displayUser.username}</Text>
        <Text style={styles.userEmail} numberOfLines={1}>
          {displayUser.email}
        </Text>
      </View>
      <Ionicons name="settings-outline" size={20} color="#999" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9f9f9",
  },
  header: {
    padding: 20,
    paddingTop: 60,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  closeButton: {
    padding: 4,
  },
  scrollContent: {
    padding: 16,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: "600",
    color: "#999",
    marginBottom: 12,
    marginTop: 8,
    letterSpacing: 1,
  },
  drawerItemCard: {
    backgroundColor: "#eefcfc", // Light cyan tinge from screenshot
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  cardHeader: {
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1f2937",
  },
  cardSubtitle: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 8,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  cardDate: {
    fontSize: 10,
    color: "#9ca3af",
  },
  footerContainer: {
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#eee",
    padding: 16,
    paddingBottom: 40,
  },
  startNewChatButton: {
    backgroundColor: "#4C51BF",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  startNewChatText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  userFooter: {
    flexDirection: "row",
    alignItems: "center",
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#eee",
  },
  userName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  userEmail: {
    fontSize: 12,
    color: "#666",
  },
  activeDrawerItem: {
    backgroundColor: "#1F2937", // Dark background for active
  },
  activeText: {
    color: "#FFFFFF",
  },
  activeSubtitle: {
    color: "#D1D5DB", // Light Gray
  },
  deleteButton: {
    padding: 8,
    marginLeft: 4,
  },
});
