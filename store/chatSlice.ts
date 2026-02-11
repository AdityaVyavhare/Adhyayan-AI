import { Message } from '@/components/ai-assistant/ChatMessage';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ChatSession {
    id: string;
    title: string;
    date?: string;
    subtitle?: string;
    thread_id?: string;
    image_count?: number;
    message_count?: number;
    // Media Context for History Restoration
    mediaContext?: {
        pdfUrl?: string;
        videoUrl?: string;
        videoTitle?: string;
        images?: string[]; // For Scan/OCR
    };
}

interface ChatState {
  chatIds: string[]; // Keep for quick lookup if needed
  chatsByTool: {
      general: ChatSession[];
      pdf: ChatSession[];
      youtube: ChatSession[];
      scan: ChatSession[];
      podcast: ChatSession[]; // Added 'podcast'
  };
  activeTool: 'general' | 'pdf' | 'youtube' | 'scan' | 'podcast' | null;
  currentChatId: string | null;
  messages: Message[];
  
  // Active Media Context (loaded for current chat)
  activeMediaContext: {
      pdfUrl?: string;
      videoUrl?: string;
      videoTitle?: string;
      images?: any[]; // For Scan/OCR with metadata
  } | null;

  loadingChats: boolean;
  loadingConversation: boolean;
  error: string | null;
  sessions?: any[]; 
}

const initialState: ChatState = {
  chatIds: [],
  chatsByTool: {
      general: [],
      pdf: [],
      youtube: [],
      scan: [],
      podcast: [] // Added 'podcast'
  },
  activeTool: null,
  currentChatId: null,
  activeMediaContext: null,
  loadingChats: false,
  loadingConversation: false,
  error: null,
  sessions: [],
  messages: [], // Fixed missing property
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setActiveTool: (state, action: PayloadAction<'general' | 'pdf' | 'youtube' | 'scan' | 'podcast'>) => { // Updated type
        const newTool = action.payload;
        if (state.activeTool !== newTool) {
            state.activeTool = newTool;
            // Strict Isolation: Clear active session when switching tools
            state.currentChatId = null;
            state.messages = [];
            state.activeMediaContext = null;
            state.error = null;
        }
    },
    setChatList: (state, action: PayloadAction<any[]>) => {
      // Lazy Load Rule: This only updates metadata. Messages are NOT fetched here.
      const chats = action.payload;
      
      // Update Master List (merge avoiding duplicates)
      chats.forEach(chat => {
          const id = chat.id || chat;
          if (!state.chatIds.includes(id)) {
              state.chatIds.push(id);
          }
      });
      state.chatIds.sort().reverse(); 

      // Categorize with full metadata based on active tool or general heuristics
      // However, the new pattern suggests we might want explicit 'setCategoryChats' to be the primary way.
      // But for backward compat with initial fetchUserChats (Chat Model), we assume 'general'.
      
      // If we are strictly tool-based, we should use setCategoryChats. 
      // But existing code calls setChatList. Let's make it smart or default to general if generic.

      // We will assume this is for 'general' chat model if not specified, 
      // but filtering by ID prefix helps keep sanity if mixed.
      
      const generalChats = chats.filter(c => {
              const id = typeof c === 'string' ? c : c.id;
              return !id.startsWith('pdf_') && !id.startsWith('youtube_') && !id.startsWith('scan_');
          }).map(c => typeof c === 'string' ? { id: c, title: 'Chat' } : c);
      
      if (generalChats.length > 0) state.chatsByTool.general = generalChats;

      state.loadingChats = false;
      state.error = null;
    },
    setCategoryChats: (state, action: PayloadAction<{ tool: 'general' | 'pdf' | 'youtube' | 'scan' | 'podcast', chats: any[] }>) => {
        const { tool, chats } = action.payload;
        // Lazy Load Rule: Metadata only.
        const formattedChats = chats.map(c => {
            if (typeof c === 'string') return { id: c, title: 'Chat', date: new Date().toISOString() };
            // Ensure media context is preserved if returned by API
            return {
                ...c,
                mediaContext: {
                    videoUrl: c.youtube_url, // For YouTube
                    pdfUrl: c.pdf_url,       // For PDF
                    // Add others if backend provides them in list
                }
            };
        });
        
        state.chatsByTool[tool] = formattedChats;
        
        // Also update master list for simple ID lookup if needed, but tools should rely on chatsByTool[tool]
        formattedChats.forEach((chat: ChatSession) => {
             if (!state.chatIds.includes(chat.id)) {
                 state.chatIds.push(chat.id);
             }
        });
        state.chatIds.sort().reverse();
    },
    setCurrentChat: (state, action: PayloadAction<{ id: string; messages: Message[]; mediaContext?: any }>) => {
      // On Chat Click Rule: Set active ID and render messages.
      state.currentChatId = action.payload.id;
      // Strict Single-Render Rule: Deduplicate by message.id while preserving order
      const seen = new Set<string>();
      state.messages = (action.payload.messages || []).filter((m) => {
        if (!m?.id) return false;
        if (seen.has(m.id)) return false;
        seen.add(m.id);
        return true;
      });
      if (action.payload.mediaContext) {
          state.activeMediaContext = action.payload.mediaContext;
      }
      state.error = null;
      state.loadingConversation = false;
    },
    clearActiveChat: (state) => {
        state.currentChatId = null;
        state.messages = [];
        state.activeMediaContext = null;
        state.error = null;
    },
    startNewChat: (state, action: PayloadAction<string>) => {
        const newId = action.payload;
        // Rule: Switching tools/new chat must reset active chat state
        state.currentChatId = newId;
        state.messages = []; // Clear messages
        state.error = null;

        const newSession = { id: newId, title: 'New Chat', date: new Date().toISOString() };

        // Determine tool from ID prefix and add to specific list locally
        if (newId.startsWith('pdf_')) {
             if (!state.chatsByTool.pdf.some(c => c.id === newId)) {
                 state.chatsByTool.pdf.unshift(newSession);
             }
             state.activeTool = 'pdf';
        } else if (newId.startsWith('youtube_')) {
             if (!state.chatsByTool.youtube.some(c => c.id === newId)) {
                 state.chatsByTool.youtube.unshift(newSession);
             }
             state.activeTool = 'youtube';
        } else if (newId.startsWith('scan_')) {
             if (!state.chatsByTool.scan.some(c => c.id === newId)) {
                 state.chatsByTool.scan.unshift(newSession);
             }
             state.activeTool = 'scan';
        } else if (newId.startsWith('podcast_')) {
             if (!state.chatsByTool.podcast.some(c => c.id === newId)) {
                 state.chatsByTool.podcast.unshift(newSession);
             }
             state.activeTool = 'podcast';
        } else {
             if (!state.chatsByTool.general.some(c => c.id === newId)) {
                 state.chatsByTool.general.unshift(newSession);
             }
             state.activeTool = 'general'; 
        }
        
        state.activeMediaContext = null; // Reset media context for new chat
        
        // Also update master list
        if (!state.chatIds.includes(newId)) {
             state.chatIds.unshift(newId);
        }
    },
    addMessage: (state, action: PayloadAction<Message>) => {
      // Strict Single-Render Rule: Prevent duplicate messages
      const exists = state.messages.some(m => m.id === action.payload.id);
      if (!exists) {
        state.messages.push(action.payload);
      }
    },
    setLoadingChats: (state, action: PayloadAction<boolean>) => {
      state.loadingChats = action.payload;
    },
    setLoadingConversation: (state, action: PayloadAction<boolean>) => {
      state.loadingConversation = action.payload;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.loadingChats = false;
      state.loadingConversation = false;
    },
    // Legacy support
    createNewSession: (state, action) => {
        const id = action.payload.id;
        state.currentChatId = id;
        state.messages = action.payload.initialMessage ? [action.payload.initialMessage] : [];
    },
    selectSession: (state, action) => {
        state.currentChatId = action.payload;
        state.messages = [];
    },
    addMessageToCurrentSession: (state, action) => {
        state.messages.push(action.payload);
    },
     setSessions: (state, action) => {
         // rough mapping
         // state.chatIds = action.payload.map((s: any) => s.id);
     }
  },
});

export const { 
    setChatList, 
    setCurrentChat, 
    startNewChat, 
    addMessage, 
    setLoadingChats, 
    setLoadingConversation, 
    setError,
    setActiveTool, // Export new action
    createNewSession,
    selectSession,
    addMessageToCurrentSession,
    setSessions,
    setCategoryChats,
    clearActiveChat
} = chatSlice.actions;

export default chatSlice.reducer;
