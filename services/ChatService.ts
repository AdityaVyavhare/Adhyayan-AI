import { Message } from "@/components/ai-assistant/ChatMessage";
import { Config } from "@/constants/Config";

interface FetchChatsResponse {
  user_id: string;
  chat_ids: string[];
  total_chats: number;
}

interface FetchConversationResponse {
  user_id: string;
  chat_id: string;
  messages: Array<{ role: string; content: string }>;
  total_messages: number;
}

export const ChatService = {
  // 1. Chat Model Tool
  fetchUserChats: async (userId: string): Promise<any[]> => {
    try {
      // Endpoint: GET /feature1_get_user_chats/{user_id}
      const response = await fetch(
        `${Config.API_BASE_URL}/feature1_get_user_chats/${userId}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        },
      );

      if (!response.ok) return [];

      const data = await response.json();
      console.log(
        "fetchUserChats (Chat Model) response:",
        JSON.stringify(data, null, 2),
      );

      // Parse to ChatSession metadata
      if (data.chats && Array.isArray(data.chats)) {
        return data.chats.map((chat: any) => ({
          id: chat.chat_id,
          title: chat.title || `Chat ${chat.chat_id.slice(-4)}`,
          date: chat.updated_at || new Date().toISOString(),
          thread_id: chat.thread_id,
        }));
      } else if (data.chat_ids && Array.isArray(data.chat_ids)) {
        // Fallback
        return data.chat_ids.map((id: string) => ({
          id: id,
          title: `Chat ${id.slice(-4)}`,
          date: new Date().toISOString(),
        }));
      }
      return [];
    } catch (error) {
      console.error("ChatService.fetchUserChats error:", error);
      return [];
    }
  },

  // 2. Chat Model Conversation Fetch
  // Endpoint: POST /feature1_get_conversation as per user request
  fetchChatModelConversation: async (
    userId: string,
    chatId: string,
    threadId?: string,
  ): Promise<Message[]> => {
    try {
      const body: any = { user_id: userId, chat_id: chatId };
      if (threadId) body.thread_id = threadId;

      const response = await fetch(
        `${Config.API_BASE_URL}/feature1_get_conversation`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );

      if (!response.ok) return [];

      const data = await response.json();
      console.log(
        "fetchChatModelConversation response:",
        JSON.stringify(data, null, 2),
      );
      // The response structure should be similar to others (working.messages or directly messages)
      // Adjust if needed based on testing or documentation.
      // Assuming standard format: { working: { messages: [...] } } or { messages: [...] }
      const chatState = data.working;
      if (chatState && chatState.messages) {
        return ChatService.mapMessages(chatState.messages);
      } else if (data.messages) {
        // Direct messages array
        return ChatService.mapMessages(data.messages);
      }

      return [];
    } catch (err) {
      console.error("fetchChatModelConversation error:", err);
      return [];
    }
  },

  // 3. PDF Chat Tool
  fetchPdfChats: async (userId: string): Promise<any[]> => {
    try {
      // Endpoint: POST /get_user_chats
      const response = await fetch(`${Config.API_BASE_URL}/get_user_chats`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId }),
      });

      if (!response.ok) return [];

      const data = await response.json();
      console.log("fetchPdfChats response:", JSON.stringify(data, null, 2));
      const chats = data.chats || data.chat_ids || [];

      // Map to metadata
      if (Array.isArray(chats)) {
        return chats.map((c: any) => {
          if (typeof c === "string")
            return {
              id: c,
              title: `PDF Chat ${c.slice(-4)}`,
              date: new Date().toISOString(),
            };
          return {
            id: c.chat_id || c.id,
            title: c.title || `PDF Chat ${(c.chat_id || c.id).slice(-4)}`,
            date: c.created_at || new Date().toISOString(),
            pdf_url: c.pdf_url, // Attempt to map if available
          };
        });
      }
      return [];
    } catch (error) {
      console.error("ChatService.fetchPdfChats error:", error);
      return [];
    }
  },

  // 4. PDF Conversation Fetch
  fetchPdfConversation: async (
    userId: string,
    chatId: string,
    threadId?: string,
  ): Promise<Message[]> => {
    try {
      const body: any = { user_id: userId, chat_id: chatId };
      if (threadId) body.thread_id = threadId;

      // Endpoint: POST /get_conversation
      const response = await fetch(`${Config.API_BASE_URL}/get_conversation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) return [];
      const data = await response.json();
      console.log(
        "fetchPdfConversation response:",
        JSON.stringify(data, null, 2),
      );

      // PDF might return root 'messages' or nested in 'working'
      const msgs = data.messages || data.working?.messages || [];
      return ChatService.mapMessages(msgs);
    } catch (error) {
      console.error("fetchPdfConversation error:", error);
      return [];
    }
  },

  deletePdfChat: async (userId: string, chatId: string): Promise<boolean> => {
    try {
      // Endpoint: POST /delete_chat (Assuming generic delete works for PDF chats if they are in the same DB)
      // Or separate endpoint if strictly siloed.
      const response = await fetch(`${Config.API_BASE_URL}/delete_chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, chat_id: chatId }),
      });
      return response.ok;
    } catch (error) {
      console.error("ChatService.deletePdfChat error:", error);
      return false;
    }
  },

  // Helper to parse the AI Teacher "Body" format
  parseRichContent: (body: string) => {
    // ... same as before
    // Split by paragraph separator "*/*"
    const paragraphs = body.split("*/,").map((p) => p.trim());
    const parsedFragments: any[] = [];

    paragraphs.forEach((para) => {
      // Extract code blocks

      // Replace markers for display
      let cleanText = para
        .replace(/\[\[CODE\]\]/g, "\n```\n")
        .replace(/\[\[\/CODE\]\]/g, "\n```\n")
        .replace(/\[\[FORMULA\]\]/g, "\n$$\n") // Latex Block
        .replace(/\[\[\/FORMULA\]\]/g, "\n$$\n");

      parsedFragments.push({ type: "text", content: cleanText });
    });

    return parsedFragments.map((p) => p.content).join("\n\n");
  },

  sendMessage: async (
    userId: string,
    chatId: string,
    message: string,
    threadId?: string,
  ): Promise<Message[]> => {
    try {
      const body: any = { user_id: userId, chat_id: chatId, message: message };
      if (threadId) body.thread_id = threadId;

      const response = await fetch(`${Config.API_BASE_URL}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text();

        // ─── RESCUE: Extract content from backend tool_use_failed errors ───
        if (response.status === 500 || response.status === 400) {
          const rescued = ChatService._rescueFromError(errorText);
          if (rescued) return [rescued];
        }

        console.error(`sendMessage failed: ${response.status} - ${errorText}`);
        throw new Error(
          `Failed to send message: ${response.status} - ${errorText}`,
        );
      }

      const data = await response.json();
      console.log("sendMessage response:", JSON.stringify(data, null, 2));

      // Guide: const chatState = data.working;
      const chatState = data.working;

      let messages: Message[] = [];
      if (chatState && chatState.messages) {
        messages = ChatService.mapMessages(chatState.messages);
      }

      // Robustness: If latest_answer is provided but not in messages (rare but possible)
      if (data.latest_answer) {
        const la = data.latest_answer;
        const aiMsg: Message = {
          id: `ai_response_${Date.now()}`,
          role: "ai",
          content: la.body || la.answer || la.content || "Response received.",
          title: la.title,
          body: la.body,
          links: la.links,
          manim_video_path: la.manim_video_path,
          next_questions: la.next_questions,
          animate: true, // live response: enable typing animation
        };
        ChatService.appendAIResponse(messages, aiMsg);
      }

      // Mark the last AI message for typing animation (fresh response)
      for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i].role === "ai") {
          messages[i].animate = true;
          break;
        }
      }

      return messages;
    } catch (error) {
      console.error("ChatService.sendMessage error:", error);
      throw error;
    }
  },

  // Generic Fallback / Old signature (Deprecate if strict per-tool methods used)
  fetchConversation: async (
    userId: string,
    chatId: string,
    threadId?: string,
  ): Promise<Message[]> => {
    // For backwards compatibility or default behavior
    return ChatService.fetchChatModelConversation(userId, chatId, threadId);
  },

  deleteChat: async (userId: string, chatId: string): Promise<boolean> => {
    try {
      const response = await fetch(
        `${Config.API_BASE_URL}/feature1_delete_chat`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: userId, chat_id: chatId }),
        },
      );
      return response.ok;
    } catch (error) {
      console.error("ChatService.deleteChat error:", error);
      return false;
    }
  },

  // Shared Mapper logic based on "Step 5: Get Conversation History"
  mapMessages: (rawMessages: any[]): Message[] => {
    return rawMessages
      .map((msg: any, index: number) => {
        // Normalize role from both `type` and `role` fields.
        const backendRole = (msg.type || msg.role || "")
          .toString()
          .toLowerCase();
        let role: "human" | "ai" | "system" = "human";
        if (backendRole === "human" || backendRole === "user") {
          role = "human";
        } else if (backendRole === "ai" || backendRole === "assistant") {
          role = "ai";
        } else if (backendRole === "system") {
          role = "system";
        }

        // Always treat structured JSON-like content as AI output (unless explicit system).
        const raw =
          typeof msg.content === "string"
            ? msg.content
            : String(msg.content ?? "");
        const trimmed = raw.trim();
        if (
          trimmed &&
          (trimmed.startsWith("{") || trimmed.startsWith("[")) &&
          role !== "system"
        ) {
          role = "ai";
        }

        let content = msg.content;
        let extraFields: any = {};

        if (role === "ai") {
          try {
            // Detect structured JSON and extract clean body + metadata
            if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
              let parsed = JSON.parse(trimmed);

              // Unwrap tool-call wrapper: { name: "json", arguments: { ...actual content... } }
              if (
                parsed.name &&
                parsed.arguments &&
                typeof parsed.arguments === "object"
              ) {
                parsed = parsed.arguments;
              } else if (parsed.name && typeof parsed.arguments === "string") {
                try {
                  parsed = JSON.parse(parsed.arguments);
                } catch (e) {
                  /* keep as-is */
                }
              }

              // Support both { structured_output: {...} } and flat { title, body, ... }
              const so =
                parsed.structured_output &&
                typeof parsed.structured_output === "object"
                  ? parsed.structured_output
                  : parsed;

              const rawBody = typeof so.body === "string" ? so.body : "";
              // Remove paragraph separators while preserving spacing
              const cleanBody = rawBody.replace(/\*\/\*/g, "\n\n");

              content = cleanBody;
              extraFields = {
                title: so.title,
                body: rawBody,
                links: so.links,
                manim_video_path: so.manim_video_path,
                Need_of_manim: so.Need_of_manim,
                next_related_topic: so.next_related_topic,
                next_questions: so.next_questions,
              };
            } else {
              // Plain text or already pre-parsed content
              content = raw;
            }
          } catch {
            content = msg.content;
          }
        } else if (role === "human") {
          content = raw;
        }

        return {
          id: msg.id || `msg_${Date.now()}_${index}`,
          role: role,
          content: content,
          ...extraFields,
        };
      })
      .filter((m) => m.role !== "system");
  },

  ingestPDF: async (
    userId: string,
    chatId: string,
    pdfUrl: string,
    message: string = "",
  ): Promise<any> => {
    try {
      const response = await fetch(`${Config.API_BASE_URL}/pdf_ingest`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: userId,
          chat_id: chatId,
          pdf_url: pdfUrl,
          message: message,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          "ChatService.ingestPDF failed:",
          response.status,
          errorText,
        );
        throw new Error(
          `Failed to ingest PDF: ${response.status} - ${errorText}`,
        );
      }

      const data = await response.json();
      console.log("ingestPDF response:", JSON.stringify(data, null, 2));

      // Ensure messages array exists
      if (!data.messages) {
        data.messages = [];
      } else {
        data.messages = ChatService.mapMessages(data.messages);
      }

      // Spec Check: "Always rely on latest_answer for rendering the AI output"
      // If latest_answer exists, we append it as the AI's response to the history
      if (data.latest_answer) {
        const la = data.latest_answer;
        const aiMsg: Message = {
          id: `ai_response_${Date.now()}`,
          role: "ai",
          content: la.body || "Here is the analysis of the PDF.",
          title: la.title,
          body: la.body,
          pages: la.pages, // number[]
          youtube_links: la.youtube_links, // string[]
          next_related_topic: la.next_related_topic,
          next_questions: la.next_questions,
          links: la.links, // if any
          animate: true, // live response
        };

        ChatService.appendAIResponse(data.messages, aiMsg);
      }

      return data;
    } catch (error) {
      console.error("ChatService.ingestPDF error:", error);
      throw error;
    }
  },

  videoRag: async (
    userId: string,
    chatId: string,
    youtubeUrl: string,
    message: string = "",
  ): Promise<any> => {
    try {
      const response = await fetch(`${Config.API_BASE_URL}/video_rag`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: userId,
          chat_id: chatId,
          youtube_url: youtubeUrl,
          message: message,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          "ChatService.videoRag failed:",
          response.status,
          errorText,
        );
        throw new Error(
          `Failed to ingest YouTube video: ${response.status} - ${errorText}`,
        );
      }

      const data = await response.json();
      console.log("videoRag response:", JSON.stringify(data, null, 2));

      // Ensure messages array exists
      if (!data.messages) {
        data.messages = [];
      } else {
        data.messages = ChatService.mapMessages(data.messages);
      }

      // Handle latest_answer for AI response
      if (data.latest_answer) {
        const la = data.latest_answer;
        const aiMsg: Message = {
          id: `ai_response_${Date.now()}`,
          role: "ai",
          content: la.answer || la.body || "Here is the analysis of the video.",
          // Store timestamps for UI
          timestamps: la.timestamps, // string[] ("MM:SS")

          // Backwards compatibility/other fields
          title: la.title,
          body: la.body || la.answer,
          youtube_links: la.youtube_links,
          next_related_topic: la.next_related_topic,
          next_questions: la.next_questions,
          links: la.links,
          animate: true, // live response
        };

        ChatService.appendAIResponse(data.messages, aiMsg);
      }

      return data;
    } catch (error) {
      console.error("ChatService.videoRag error:", error);
      throw error;
    }
  },

  // 5. YouTube Learning Tool
  fetchVideoChats: async (userId: string): Promise<any[]> => {
    try {
      // Endpoint: POST /feature5_get_chats
      const response = await fetch(
        `${Config.API_BASE_URL}/feature5_get_chats`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: userId }),
        },
      );

      if (!response.ok) return [];

      const data = await response.json();
      console.log("fetchVideoChats response:", JSON.stringify(data, null, 2));
      const chats = data.chats || [];

      return chats.map((c: any) => ({
        id: c.chat_id,
        title: c.title || c.youtube_url || `Video Chat ${c.chat_id.slice(-4)}`,
        date: c.last_updated || new Date().toISOString(),
        summary: c.summary || "",
        youtube_url: c.youtube_url, // Critical for history restoration
      }));
    } catch (error) {
      console.error("ChatService.fetchVideoChats error:", error);
      return [];
    }
  },

  // 6. YouTube Conversation Fetch
  fetchVideoChatHistory: async (
    userId: string,
    chatId: string,
  ): Promise<Message[]> => {
    try {
      // Endpoint: POST /feature5_get_chat_history
      const response = await fetch(
        `${Config.API_BASE_URL}/feature5_get_chat_history`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: userId, chat_id: chatId }),
        },
      );

      if (!response.ok) return [];

      const data = await response.json();
      console.log(
        "fetchVideoChatHistory response:",
        JSON.stringify(data, null, 2),
      );
      return ChatService.mapMessages(data.messages || []);
    } catch (error) {
      console.error("ChatService.fetchVideoChatHistory error:", error);
      return [];
    }
  },

  deleteVideoChat: async (userId: string, chatId: string): Promise<boolean> => {
    try {
      const response = await fetch(
        `${Config.API_BASE_URL}/feature5_delete_chat`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: userId, chat_id: chatId }),
        },
      );
      return response.ok;
    } catch (error) {
      console.error("ChatService.deleteVideoChat error:", error);
      return false;
    }
  },
  // 8. Feature 8 - Gita Counselor (Sarthi)
  gitaCounseling: async (
    userId: string,
    chatId: string,
    doubt: string,
    preferredLanguage: string = "english",
  ): Promise<any> => {
    try {
      const response = await fetch(`${Config.API_BASE_URL}/gita_counseling`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          chat_id: chatId,
          doubt: doubt,
          preferred_language: preferredLanguage,
        }),
      });

      if (!response.ok) throw new Error("Gita counseling failed");
      const data = await response.json();
      console.log("gitaCounseling response:", JSON.stringify(data, null, 2));
      return data;
    } catch (error) {
      console.error("ChatService.gitaCounseling error:", error);
      throw error;
    }
  },

  fetchGitaChats: async (userId: string): Promise<any[]> => {
    try {
      const response = await fetch(
        `${Config.API_BASE_URL}/feature8_get_chats`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: userId }),
        },
      );

      if (!response.ok) return [];
      const data = await response.json();
      console.log("fetchGitaChats response:", JSON.stringify(data, null, 2));

      return (data.chats || []).map((c: any) => ({
        id: c.chat_id,
        title: `Session ${c.chat_id}`,
        date: c.last_updated || new Date().toISOString(),
        counseling_count: c.counseling_count || 0,
        subtitle: `${c.counseling_count || 0} Insight${c.counseling_count === 1 ? "" : "s"}`,
      }));
    } catch (error) {
      console.error("ChatService.fetchGitaChats error:", error);
      return [];
    }
  },

  fetchGitaHistory: async (userId: string, chatId: string): Promise<any[]> => {
    try {
      const response = await fetch(
        `${Config.API_BASE_URL}/feature8_get_chat_history`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: userId, chat_id: chatId }),
        },
      );

      if (!response.ok) return [];
      const data = await response.json();
      console.log("fetchGitaHistory response:", JSON.stringify(data, null, 2));

      // Convert to message format
      const counselings = data.counselings || [];
      const messages: Message[] = [];

      counselings.forEach((c: any) => {
        // User message
        messages.push({
          id: `user_${c.created_at}`,
          role: "human",
          content: c.doubt,
        });

        // AI response with Gita counseling data
        messages.push({
          id: `ai_${c.created_at}`,
          role: "ai",
          content: c.guidance,
          audio_url: "", // Not in history
          referenced_shlokas: c.referenced_shlokas,
          life_examples: [], // Parse from guidance if needed
          key_teachings: [], // Parse from guidance if needed
        });
      });

      return messages;
    } catch (error) {
      console.error("ChatService.fetchGitaHistory error:", error);
      return [];
    }
  },

  deleteGitaChat: async (userId: string, chatId: string): Promise<boolean> => {
    try {
      const response = await fetch(
        `${Config.API_BASE_URL}/feature8_delete_chat`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: userId, chat_id: chatId }),
        },
      );
      return response.ok;
    } catch (error) {
      console.error("ChatService.deleteGitaChat error:", error);
      return false;
    }
  },
  // 7. Feature 2 - OCR Doubt Solver
  fetchScanChats: async (userId: string): Promise<any[]> => {
    try {
      // Endpoint: POST /feature2_get_chats
      const response = await fetch(
        `${Config.API_BASE_URL}/feature2_get_chats`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: userId }),
        },
      );

      if (!response.ok) return [];

      const data = await response.json();
      console.log("fetchScanChats response:", JSON.stringify(data, null, 2));
      // Response: { chats: [{ chat_id, message_count, image_count, last_updated }] }
      // We need to map this to our app's ChatSession format
      const chats = data.chats || [];

      return chats.map((c: any) => ({
        id: c.chat_id,
        title: `Scan ${c.chat_id.slice(-4)} (${c.image_count} imgs)`,
        date: c.last_updated || new Date().toISOString(),
        message_count: c.message_count,
        image_count: c.image_count,
      }));
    } catch (error) {
      console.error("ChatService.fetchScanChats error:", error);
      return [];
    }
  },

  fetchScanConversation: async (
    userId: string,
    chatId: string,
  ): Promise<{ messages: Message[]; images: any[] }> => {
    try {
      // Endpoint: POST /feature2_get_chat_history
      const response = await fetch(
        `${Config.API_BASE_URL}/feature2_get_chat_history`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: userId, chat_id: chatId }),
        },
      );

      if (!response.ok) return { messages: [], images: [] };
      const data = await response.json();
      console.log(
        "fetchScanConversation response:",
        JSON.stringify(data, null, 2),
      );

      const messages = ChatService.mapMessages(data.messages || []);
      const images = data.images || [];

      return { messages, images };
    } catch (error) {
      console.error("ChatService.fetchScanConversation error:", error);
      return { messages: [], images: [] };
    }
  },

  scanQuestion: async (
    userId: string,
    chatId: string,
    imageUrl: string | null,
    message: string = "",
  ): Promise<any> => {
    try {
      // Endpoint: POST /ocr_doubt_solver
      const payload: any = {
        user_id: userId,
        chat_id: chatId,
        message: message,
        image_url: imageUrl || "",
      };

      const response = await fetch(`${Config.API_BASE_URL}/ocr_doubt_solver`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          "ChatService.scanQuestion failed:",
          response.status,
          errorText,
        );
        throw new Error(
          `Failed to scan question: ${response.status} - ${errorText}`,
        );
      }

      const data = await response.json();
      console.log("scanQuestion response:", JSON.stringify(data, null, 2));

      if (!data.messages) {
        data.messages = [];
      } else {
        data.messages = ChatService.mapMessages(data.messages);
      }

      // Force formatting of `latest_answer` into a message if not already present
      if (data.latest_answer) {
        const la = data.latest_answer;
        const aiMsg: Message = {
          id: `ai_response_${Date.now()}`,
          role: "ai",
          content: la.answer,
          title: "Solution",
          referenced_images: la.referenced_images,
          animate: true, // live response
        };

        ChatService.appendAIResponse(data.messages, aiMsg);
      }

      return data;
    } catch (error) {
      console.error("ChatService.scanQuestion error:", error);
      throw error;
    }
  },

  deleteScanChat: async (userId: string, chatId: string): Promise<boolean> => {
    try {
      // Endpoint: POST /feature2_delete_chat
      const response = await fetch(
        `${Config.API_BASE_URL}/feature2_delete_chat`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: userId, chat_id: chatId }),
        },
      );
      return response.ok;
    } catch (error) {
      console.error("ChatService.deleteScanChat error:", error);
      return false;
    }
  },

  // 8. Feature 7 - Podcast Generator
  generatePodcast: async (
    userId: string,
    chatId: string,
    topic: string,
  ): Promise<any> => {
    try {
      // Endpoint: POST /podcast_generate
      const response = await fetch(`${Config.API_BASE_URL}/podcast_generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          chat_id: chatId,
          topic: topic,
        }),
      });

      if (!response.ok) throw new Error("Podcast generation failed");
      return await response.json();
    } catch (error) {
      console.error("ChatService.generatePodcast error:", error);
      throw error;
    }
  },

  fetchPodcastChats: async (userId: string): Promise<any[]> => {
    try {
      // Endpoint: POST /feature7_get_chats
      const response = await fetch(
        `${Config.API_BASE_URL}/feature7_get_chats`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: userId }),
        },
      );

      if (!response.ok) return [];
      const data = await response.json();
      // Map to standard format
      return (data.chats || []).map((c: any) => ({
        id: c.chat_id,
        title: `Podcast Chat ${c.chat_id.slice(-4)}`, // or we could fetch topics
        date: c.last_updated || new Date().toISOString(),
        podcast_count: c.podcast_count,
      }));
    } catch (error) {
      console.error("ChatService.fetchPodcastChats error:", error);
      return [];
    }
  },

  fetchPodcastHistory: async (
    userId: string,
    chatId: string,
  ): Promise<any[]> => {
    try {
      // Endpoint: POST /feature7_get_chat_history
      const response = await fetch(
        `${Config.API_BASE_URL}/feature7_get_chat_history`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: userId, chat_id: chatId }),
        },
      );

      if (!response.ok) return [];
      const data = await response.json();
      return data.podcasts || [];
    } catch (error) {
      console.error("ChatService.fetchPodcastHistory error:", error);
      return [];
    }
  },

  deletePodcastChat: async (
    userId: string,
    chatId: string,
  ): Promise<boolean> => {
    try {
      // Endpoint: POST /feature7_delete_chat
      const response = await fetch(
        `${Config.API_BASE_URL}/feature7_delete_chat`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: userId, chat_id: chatId }),
        },
      );
      return response.ok;
    } catch (error) {
      console.error("ChatService.deletePodcastChat error:", error);
      return false;
    }
  },

  // 9. Feature 9 - Test Generator
  generateTest: async (
    userId: string,
    topic: string,
    difficulty: "easy" | "medium" | "hard",
    numQuestions: number,
    types: string[],
  ): Promise<any> => {
    try {
      const response = await fetch(
        `https://llmquestionansweringreasoning.onrender.com/test/generate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            topic,
            difficulty,
            number_of_questions: numQuestions,
            question_types: types,
            user_id: userId, // If needed by backend for logging
          }),
        },
      );

      if (!response.ok) throw new Error("Test generation failed");
      const data = await response.json();
      console.log(
        "ChatService: generateTest response:",
        JSON.stringify(data, null, 2),
      );
      return data;
    } catch (error) {
      console.error("ChatService.generateTest error:", error);
      throw error;
    }
  },

  evaluateTest: async (testId: string, studentAnswers: any[]): Promise<any> => {
    try {
      const response = await fetch(
        `https://llmquestionansweringreasoning.onrender.com/test/evaluate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            test_id: testId,
            student_answers: studentAnswers,
          }),
        },
      );

      if (!response.ok) throw new Error("Test evaluation failed");
      return await response.json();
    } catch (error) {
      console.error("ChatService.evaluateTest error:", error);
      throw error;
    }
  },

  // ═══════════════════════════════════════════════════════════
  // RESCUE & SANITIZE HELPERS
  // ═══════════════════════════════════════════════════════════

  /**
   * Sanitize a raw JSON string fixing invalid escapes from LaTeX,
   * Python repr artifacts, and over-escaping.
   */
  _sanitizeJsonString: (raw: string): string => {
    let s = raw;
    // 1. Collapse over-escaped backslashes: \\\\\\\\ → \\
    while (s.includes("\\\\\\\\")) s = s.replace(/\\\\\\\\/g, "\\\\");
    // 2. Fix invalid JSON escape sequences (LaTeX: \frac, \sqrt, \text, etc.)
    //    Valid JSON escapes are: \" \\ \/ \b \f \n \r \t \uXXXX
    s = s.replace(/\\(?!["\\/bfnrtu\\])/g, "\\\\");
    // 3. Remove control characters (except \n \r \t)
    s = s.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "");
    return s;
  },

  /**
   * Clean body content: normalize paragraph separators, fix over-escaped LaTeX.
   */
  _sanitizeBody: (body: string): string => {
    if (!body) return "";
    let clean = body;
    // Normalize all paragraph separator variants: */* */\* */\\*
    clean = clean.replace(/\*\/\\{0,4}\*/g, "\n\n");
    // Collapse over-escaped LaTeX: \\\\frac → \\frac
    clean = clean.replace(/\\{3,}(?=[a-zA-Z{])/g, "\\");
    // Trim excess blank lines
    clean = clean.replace(/\n{3,}/g, "\n\n");
    return clean.trim();
  },

  /**
   * Attempt to rescue usable content from a failed_generation error.
   * Returns a Message if successful, null otherwise.
   */
  _rescueFromError: (errorText: string): Message | null => {
    try {
      console.log("ChatService._rescueFromError: Attempting rescue...");

      // ── Step 1: Get the error content string ──
      let errorContent = errorText;
      try {
        const parsed = JSON.parse(errorText);
        if (parsed.detail) {
          errorContent =
            typeof parsed.detail === "string"
              ? parsed.detail
              : JSON.stringify(parsed.detail);
        } else if (parsed.error?.message) {
          errorContent = parsed.error.message;
        }
      } catch (_) {
        /* raw text */
      }

      if (!errorContent.includes("failed_generation")) return null;

      // ── Step 2: Extract JSON via brace-matching ──
      const fgIndex = errorContent.indexOf("failed_generation");
      if (fgIndex === -1) return null;

      const afterFg = errorContent.substring(fgIndex);
      const firstBrace = afterFg.indexOf("{");
      if (firstBrace === -1) return null;

      const startPos = fgIndex + firstBrace;
      let braceCount = 0;
      let endPos = startPos;

      for (let i = startPos; i < errorContent.length; i++) {
        const ch = errorContent[i];
        if (ch === "\\" && i + 1 < errorContent.length) {
          i++;
          continue;
        }
        if (ch === "{") braceCount++;
        else if (ch === "}") braceCount--;
        if (braceCount === 0) {
          endPos = i + 1;
          break;
        }
      }

      if (braceCount !== 0) {
        console.warn("ChatService._rescueFromError: Brace matching failed");
        return null;
      }

      const candidateJson = errorContent.substring(startPos, endPos);

      // ── Step 3: Sanitize and parse with fallbacks ──
      let obj: any = null;

      // Attempt 1: Sanitize then parse
      try {
        obj = JSON.parse(ChatService._sanitizeJsonString(candidateJson));
      } catch (_) {
        // Attempt 2: More aggressive — collapse ALL multi-backslashes first
        try {
          let fixed = candidateJson.replace(/\\{2,}/g, "\\\\");
          fixed = fixed.replace(/\\(?!["\\/bfnrtu\\])/g, "\\\\");
          fixed = fixed.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "");
          obj = JSON.parse(fixed);
        } catch (_) {
          // Attempt 3: Extract just the "arguments" sub-object
          try {
            const am = candidateJson.match(/"arguments"\s*:\s*\{/);
            if (am && am.index !== undefined) {
              const s = am.index + am[0].length - 1;
              let bc2 = 0,
                e = s;
              for (let j = s; j < candidateJson.length; j++) {
                if (candidateJson[j] === "\\" && j + 1 < candidateJson.length) {
                  j++;
                  continue;
                }
                if (candidateJson[j] === "{") bc2++;
                else if (candidateJson[j] === "}") bc2--;
                if (bc2 === 0) {
                  e = j + 1;
                  break;
                }
              }
              obj = JSON.parse(
                ChatService._sanitizeJsonString(candidateJson.substring(s, e)),
              );
            }
          } catch (_) {
            console.error(
              "ChatService._rescueFromError: All parse strategies failed",
            );
            return null;
          }
        }
      }

      if (!obj) return null;

      // ── Step 4: Unwrap tool-call wrapper ──
      if (obj.name && obj.arguments) {
        obj =
          typeof obj.arguments === "object"
            ? obj.arguments
            : (() => {
                try {
                  return JSON.parse(
                    ChatService._sanitizeJsonString(obj.arguments),
                  );
                } catch (_) {
                  return obj;
                }
              })();
      }

      // Unwrap structured_output
      if (obj.structured_output && typeof obj.structured_output === "object") {
        obj = obj.structured_output;
      }

      // ── Step 5: Build rescued message ──
      const rawBody = typeof obj.body === "string" ? obj.body : "";
      const cleanBody = ChatService._sanitizeBody(rawBody);

      console.log("ChatService._rescueFromError: SUCCESS! Title:", obj.title);

      return {
        id: `rescue_${Date.now()}`,
        role: "ai",
        content: cleanBody || "Content recovered.",
        title: obj.title,
        body: rawBody,
        links: obj.links,
        manim_video_path: obj.manim_video_path,
        Need_of_manim: obj.Need_of_manim,
        next_related_topic: obj.next_related_topic,
        next_questions: obj.next_questions,
        animate: true,
      };
    } catch (err) {
      console.error("ChatService._rescueFromError: Unexpected error:", err);
      return null;
    }
  },

  // --- Helper for Deduplication ---
  appendAIResponse: (messages: Message[], newAiMsg: Message) => {
    const recentMessages = messages.slice(-3);
    const exists = recentMessages.some((m: Message) => {
      if (m.role !== "ai") return false;
      const c1 = (m.content || m.body || "").trim();
      const c2 = (newAiMsg.content || newAiMsg.body || "").trim();
      return c1 === c2 && c1.length > 0;
    });

    if (!exists) {
      messages.push(newAiMsg);
    } else {
      console.log(
        "ChatService: Duplicate AI response detected, skipping append.",
      );
    }
  },
};
