import { Message } from '@/components/ai-assistant/ChatMessage';
import { Config } from '@/constants/Config';

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
      const response = await fetch(`${Config.API_BASE_URL}/feature1_get_user_chats/${userId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) return [];

      const data = await response.json();
      console.log('fetchUserChats (Chat Model) response:', JSON.stringify(data, null, 2));

      // Parse to ChatSession metadata
      if (data.chats && Array.isArray(data.chats)) {
          return data.chats.map((chat: any) => ({
              id: chat.chat_id,
              title: chat.title || `Chat ${chat.chat_id.slice(-4)}`,
              date: chat.updated_at || new Date().toISOString(),
              thread_id: chat.thread_id
          }));
      } else if (data.chat_ids && Array.isArray(data.chat_ids)) {
          // Fallback
          return data.chat_ids.map((id: string) => ({
              id: id,
              title: `Chat ${id.slice(-4)}`,
              date: new Date().toISOString()
          }));
      }
      return [];
    } catch (error) {
      console.error('ChatService.fetchUserChats error:', error);
      return [];
    }
  },

  // 2. Chat Model Conversation Fetch
  // Endpoint: POST /feature1_get_conversation as per user request
  fetchChatModelConversation: async (userId: string, chatId: string, threadId?: string): Promise<Message[]> => {
      try {
          const body: any = { user_id: userId, chat_id: chatId };
          if (threadId) body.thread_id = threadId;

          const response = await fetch(`${Config.API_BASE_URL}/feature1_get_conversation`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(body)
          });

          if (!response.ok) return [];

          const data = await response.json();
          console.log('fetchChatModelConversation response:', JSON.stringify(data, null, 2));
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
          console.error('fetchChatModelConversation error:', err);
          return [];
      }
  },

  // 3. PDF Chat Tool
  fetchPdfChats: async (userId: string): Promise<any[]> => {
      try {
          // Endpoint: POST /get_user_chats
          const response = await fetch(`${Config.API_BASE_URL}/get_user_chats`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ user_id: userId })
          });

          if (!response.ok) return [];

          const data = await response.json();
          console.log('fetchPdfChats response:', JSON.stringify(data, null, 2));
          const chats = data.chats || data.chat_ids || [];
          
          // Map to metadata
          if (Array.isArray(chats)) {
              return chats.map((c: any) => {
                  if (typeof c === 'string') return { id: c, title: `PDF Chat ${c.slice(-4)}`, date: new Date().toISOString() };
                  return {
                      id: c.chat_id || c.id,
                      title: c.title || `PDF Chat ${(c.chat_id || c.id).slice(-4)}`,
                      date: c.created_at || new Date().toISOString(),
                      pdf_url: c.pdf_url // Attempt to map if available
                  };
              });
          }
          return [];
      } catch (error) {
          console.error('ChatService.fetchPdfChats error:', error);
          return [];
      }
  },

  // 4. PDF Conversation Fetch
  fetchPdfConversation: async (userId: string, chatId: string, threadId?: string): Promise<Message[]> => {
      try {
          const body: any = { user_id: userId, chat_id: chatId };
          if (threadId) body.thread_id = threadId;

          // Endpoint: POST /get_conversation
          const response = await fetch(`${Config.API_BASE_URL}/get_conversation`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(body)
          });

          if (!response.ok) return [];
          const data = await response.json();
          console.log('fetchPdfConversation response:', JSON.stringify(data, null, 2));
          
          // PDF might return root 'messages' or nested in 'working'
          const msgs = data.messages || data.working?.messages || [];
          return ChatService.mapMessages(msgs);
      } catch (error) {
          console.error('fetchPdfConversation error:', error);
          return [];
      }
  },

  deletePdfChat: async (userId: string, chatId: string): Promise<boolean> => {
      try {
          // Endpoint: POST /delete_chat (Assuming generic delete works for PDF chats if they are in the same DB)
          // Or separate endpoint if strictly siloed.
          const response = await fetch(`${Config.API_BASE_URL}/delete_chat`, {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({ user_id: userId, chat_id: chatId })
          });
          return response.ok;
      } catch (error) {
          console.error('ChatService.deletePdfChat error:', error);
          return false;
      }
  },

  // Helper to parse the AI Teacher "Body" format
  parseRichContent: (body: string) => {
      // ... same as before
      // Split by paragraph separator "*/*"
      const paragraphs = body.split('*/,').map(p => p.trim());
      const parsedFragments: any[] = [];

      paragraphs.forEach(para => {
          // Extract code blocks
          
          // Replace markers for display
          let cleanText = para
              .replace(/\[\[CODE\]\]/g, '\n```\n')
              .replace(/\[\[\/CODE\]\]/g, '\n```\n')
              .replace(/\[\[FORMULA\]\]/g, '\n$$\n') // Latex Block
              .replace(/\[\[\/FORMULA\]\]/g, '\n$$\n');

          parsedFragments.push({ type: 'text', content: cleanText });
      });

      return parsedFragments.map(p => p.content).join('\n\n');
  },

  sendMessage: async (userId: string, chatId: string, message: string, threadId?: string): Promise<Message[]> => {
    try {
      const body: any = { user_id: userId, chat_id: chatId, message: message };
      if (threadId) body.thread_id = threadId;

      const response = await fetch(`${Config.API_BASE_URL}/chat`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text();
        
        // RESCUE ATTEMPT: "Tool choice is required" but "failed_generation" contains valid JSON
        if (response.status === 500) {
             let errorContent = errorText;
             try {
                 const parsedError = JSON.parse(errorText);
                 if (parsedError.detail) {
                     // Detail might be a string or object/array
                     errorContent = typeof parsedError.detail === 'string' 
                        ? parsedError.detail 
                        : JSON.stringify(parsedError.detail);
                 } else if (parsedError.error && parsedError.error.message) {
                     errorContent = parsedError.error.message;
                 }
             } catch (e) {
                 // Not valid JSON, process raw text
             }

             if (errorContent.includes('failed_generation')) {
                 try {
                     console.log("ChatService: Attempting to rescue failed generation from 500 error...");
                     
                     // Helper to extract the JSON string from failed_generation
                     // The format is usually: 'failed_generation': '...JSON...'
                     // But it can be nested in other structures. 
                     // Let's Find the first occurrence of "failed_generation" and then the next quoted string
                     
                     // Regex to find: 'failed_generation':\s* ('|")
                     // We need to support both single and double quotes for the value wrapper
                     const markerRegex = /['"]failed_generation['"]:\s*(['"])([\s\S]*)/;
                     const match = errorContent.match(markerRegex);
                     
                     if (match) {
                         const quoteChar = match[1];
                         let remaining = match[2];
                         
                         // Find the end of the string. Simple indexOf won't work due to escaping.
                         // We need to walk forward and find the closing quote that isn't escaped.
                         let jsonStr = "";
                         let endFound = false;
                         
                         for (let i = 0; i < remaining.length; i++) {
                             const char = remaining[i];
                             if (char === '\\') {
                                 // Escape sequence, consume next char
                                 jsonStr += char;
                                 if (i + 1 < remaining.length) {
                                     jsonStr += remaining[i+1];
                                     i++;
                                 }
                             } else if (char === quoteChar) {
                                 // Found closing quote
                                 endFound = true;
                                 break;
                             } else {
                                 jsonStr += char;
                             }
                         }

                         if (endFound) {
                             // Now we have the python-repr string. Need to unescape it to get JSON.
                             // Python repr escapes: \n -> \\n, ' -> \', " -> ", \ -> \\
                             
                             // 1. Unescape common control chars
                             let unescaped = jsonStr
                                .replace(/\\n/g, '\n')
                                .replace(/\\r/g, '\r')
                                .replace(/\\t/g, '\t');
                             
                             // 2. Unescape quotes. If wrapped in ', then \' becomes '
                             if (quoteChar === "'") {
                                 unescaped = unescaped.replace(/\\'/g, "'");
                             } else {
                                 unescaped = unescaped.replace(/\\"/g, '"');
                             }
                             
                             // 3. Unescape backslashes (must be last)
                             unescaped = unescaped.replace(/\\\\/g, "\\");

                             console.log("ChatService: Extracted candidate JSON, length:", unescaped.length);
                             
                             let parsedRescue;
                             try {
                                parsedRescue = JSON.parse(unescaped);
                             } catch (pErr) {
                                 // LaTeX content creates invalid JSON escapes like \frac, \sqrt, \*, \p etc.
                                 // Fix: re-escape lone backslashes not followed by valid JSON escape chars
                                 try {
                                     console.warn("ChatService: Strict JSON parse failed, fixing invalid escapes...");
                                     const fixed = unescaped.replace(/\\(?!["\\/bfnrtu])/g, '\\\\');
                                     parsedRescue = JSON.parse(fixed);
                                 } catch (e2) {
                                     // Last resort: try to extract just the arguments JSON object
                                     try {
                                         const argsMatch = unescaped.match(/"arguments"\s*:\s*\{/);
                                         if (argsMatch && argsMatch.index !== undefined) {
                                             let braceCount = 0;
                                             let start = argsMatch.index + argsMatch[0].length - 1;
                                             let end = start;
                                             for (let j = start; j < unescaped.length; j++) {
                                                 if (unescaped[j] === '{') braceCount++;
                                                 else if (unescaped[j] === '}') braceCount--;
                                                 if (braceCount === 0) { end = j + 1; break; }
                                             }
                                             const argsJson = unescaped.substring(start, end);
                                             const fixedArgs = argsJson.replace(/\\(?!["\\/bfnrtu])/g, '\\\\');
                                             parsedRescue = JSON.parse(fixedArgs);
                                         }
                                     } catch (e3) {
                                         console.error("ChatService: All rescue parse attempts failed");
                                     }
                                 }
                             }
                             
                            if (parsedRescue) {
                                console.log("ChatService: Successfully rescued content.");

                                // Unwrap tool-call wrapper: { name: "json", arguments: { ...actual content... } }
                                if (parsedRescue.name && parsedRescue.arguments && typeof parsedRescue.arguments === 'object') {
                                    console.log("ChatService: Unwrapping tool-call wrapper, name:", parsedRescue.name);
                                    parsedRescue = parsedRescue.arguments;
                                } else if (parsedRescue.name && typeof parsedRescue.arguments === 'string') {
                                    try {
                                        parsedRescue = JSON.parse(parsedRescue.arguments);
                                    } catch (e) {
                                        // keep parsedRescue as-is
                                    }
                                }

                                const so = parsedRescue.structured_output && typeof parsedRescue.structured_output === 'object'
                                  ? parsedRescue.structured_output
                                  : parsedRescue;

                                const rawBody = typeof so.body === 'string' ? so.body : '';
                                const cleanBody = rawBody.replace(/\*\/\*/g, '\n\n');

                                const rescueMessage: Message = {
                                    id: `rescue_${Date.now()}`,
                                    role: 'ai',
                                    content: cleanBody || "Content recovered from error.",
                                    title: so.title,
                                    body: rawBody,
                                    links: so.links,
                                    manim_video_path: so.manim_video_path,
                                    Need_of_manim: so.Need_of_manim,
                                    next_related_topic: so.next_related_topic,
                                    next_questions: so.next_questions,
                                };
                                return [rescueMessage];
                            }
                         }
                     }
                 } catch (rescueErr) {
                     console.error("Rescue attempt failed:", rescueErr);
                 }
             }
        }
        
        console.error(`sendMessage failed: ${response.status} - ${errorText}`);
        throw new Error(`Failed to send message: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('sendMessage response:', JSON.stringify(data, null, 2));

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
               role: 'ai',
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
          if (messages[i].role === 'ai') {
              messages[i].animate = true;
              break;
          }
      }

      return messages;
    } catch (error) {
      console.error('ChatService.sendMessage error:', error);
      throw error;
    }
  },

  // Generic Fallback / Old signature (Deprecate if strict per-tool methods used)
  fetchConversation: async (userId: string, chatId: string, threadId?: string): Promise<Message[]> => {
      // For backwards compatibility or default behavior
      return ChatService.fetchChatModelConversation(userId, chatId, threadId);
  },

  deleteChat: async (userId: string, chatId: string): Promise<boolean> => {
      try {
          const response = await fetch(`${Config.API_BASE_URL}/feature1_delete_chat`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ user_id: userId, chat_id: chatId })
          });
          return response.ok;
      } catch (error) {
          console.error('ChatService.deleteChat error:', error);
          return false;
      }
  },

  // Shared Mapper logic based on "Step 5: Get Conversation History"
  mapMessages: (rawMessages: any[]): Message[] => {
      return rawMessages.map((msg: any, index: number) => {
          // Normalize role from both `type` and `role` fields.
          const backendRole = (msg.type || msg.role || '').toString().toLowerCase();
          let role: 'human' | 'ai' | 'system' = 'human';
          if (backendRole === 'human' || backendRole === 'user') {
              role = 'human';
          } else if (backendRole === 'ai' || backendRole === 'assistant') {
              role = 'ai';
          } else if (backendRole === 'system') {
              role = 'system';
          }

          // Always treat structured JSON-like content as AI output (unless explicit system).
          const raw = typeof msg.content === 'string' ? msg.content : String(msg.content ?? '');
          const trimmed = raw.trim();
          if (trimmed && (trimmed.startsWith('{') || trimmed.startsWith('[')) && role !== 'system') {
              role = 'ai';
          }

          let content = msg.content;
          let extraFields: any = {};
          
          if (role === 'ai') {
              try {
                  // Detect structured JSON and extract clean body + metadata
                  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
                      let parsed = JSON.parse(trimmed);

                      // Unwrap tool-call wrapper: { name: "json", arguments: { ...actual content... } }
                      if (parsed.name && parsed.arguments && typeof parsed.arguments === 'object') {
                          parsed = parsed.arguments;
                      } else if (parsed.name && typeof parsed.arguments === 'string') {
                          try { parsed = JSON.parse(parsed.arguments); } catch (e) { /* keep as-is */ }
                      }

                      // Support both { structured_output: {...} } and flat { title, body, ... }
                      const so = parsed.structured_output && typeof parsed.structured_output === 'object'
                        ? parsed.structured_output
                        : parsed;

                      const rawBody = typeof so.body === 'string' ? so.body : '';
                      // Remove paragraph separators while preserving spacing
                      const cleanBody = rawBody.replace(/\*\/\*/g, '\n\n');

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
          } else if (role === 'human') {
              content = raw;
          }

          return {
              id: msg.id || `msg_${Date.now()}_${index}`,
              role: role,
              content: content,
              ...extraFields
          };
      }).filter(m => m.role !== 'system');
  },

  ingestPDF: async (userId: string, chatId: string, pdfUrl: string, message: string = ''): Promise<any> => {
      try {
          const response = await fetch(`${Config.API_BASE_URL}/pdf_ingest`, {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                  user_id: userId,
                  chat_id: chatId,
                  pdf_url: pdfUrl,
                  message: message
              }),
          });

          if (!response.ok) {
              const errorText = await response.text();
              console.error('ChatService.ingestPDF failed:', response.status, errorText);
              throw new Error(`Failed to ingest PDF: ${response.status} - ${errorText}`);
          }

          const data = await response.json();
          console.log('ingestPDF response:', JSON.stringify(data, null, 2));

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
                  role: 'ai',
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
          console.error('ChatService.ingestPDF error:', error);
          throw error;
      }
  },

  videoRag: async (userId: string, chatId: string, youtubeUrl: string, message: string = ''): Promise<any> => {
      try {
          const response = await fetch(`${Config.API_BASE_URL}/video_rag`, {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                  user_id: userId,
                  chat_id: chatId,
                  youtube_url: youtubeUrl,
                  message: message
              }),
          });

          if (!response.ok) {
              const errorText = await response.text();
              console.error('ChatService.videoRag failed:', response.status, errorText);
              throw new Error(`Failed to ingest YouTube video: ${response.status} - ${errorText}`);
          }

          const data = await response.json();
          console.log('videoRag response:', JSON.stringify(data, null, 2));

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
                  role: 'ai',
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
          console.error('ChatService.videoRag error:', error);
          throw error;
      }
  },

  // 5. YouTube Learning Tool
  fetchVideoChats: async (userId: string): Promise<any[]> => {
      try {
          // Endpoint: POST /feature5_get_chats
          const response = await fetch(`${Config.API_BASE_URL}/feature5_get_chats`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ user_id: userId })
          });

          if (!response.ok) return [];

          const data = await response.json();
          console.log('fetchVideoChats response:', JSON.stringify(data, null, 2));
          const chats = data.chats || [];
          
          return chats.map((c: any) => ({
              id: c.chat_id,
              title: c.title || c.youtube_url || `Video Chat ${c.chat_id.slice(-4)}`,
              date: c.last_updated || new Date().toISOString(),
              summary: c.summary || '',
              youtube_url: c.youtube_url // Critical for history restoration
          }));
      } catch (error) {
          console.error('ChatService.fetchVideoChats error:', error);
          return [];
      }
  },

  // 6. YouTube Conversation Fetch
  fetchVideoChatHistory: async (userId: string, chatId: string): Promise<Message[]> => {
      try {
          // Endpoint: POST /feature5_get_chat_history
          const response = await fetch(`${Config.API_BASE_URL}/feature5_get_chat_history`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ user_id: userId, chat_id: chatId })
          });

          if (!response.ok) return [];

          const data = await response.json();
          console.log('fetchVideoChatHistory response:', JSON.stringify(data, null, 2));
          return ChatService.mapMessages(data.messages || []);
      } catch (error) {
          console.error('ChatService.fetchVideoChatHistory error:', error);
          return [];
      }
  },

  deleteVideoChat: async (userId: string, chatId: string): Promise<boolean> => {
      try {
          const response = await fetch(`${Config.API_BASE_URL}/feature5_delete_chat`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ user_id: userId, chat_id: chatId })
          });
          return response.ok;
      } catch (error) {
          console.error('ChatService.deleteVideoChat error:', error);
          return false;
      }
  },

  // 7. Feature 2 - OCR Doubt Solver
  fetchScanChats: async (userId: string): Promise<any[]> => {
      try {
          // Endpoint: POST /feature2_get_chats
          const response = await fetch(`${Config.API_BASE_URL}/feature2_get_chats`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ user_id: userId })
          });

          if (!response.ok) return [];

          const data = await response.json();
          console.log('fetchScanChats response:', JSON.stringify(data, null, 2));
          // Response: { chats: [{ chat_id, message_count, image_count, last_updated }] }
          // We need to map this to our app's ChatSession format
          const chats = data.chats || [];
          
          return chats.map((c: any) => ({
              id: c.chat_id,
              title: `Scan ${c.chat_id.slice(-4)} (${c.image_count} imgs)`,
              date: c.last_updated || new Date().toISOString(),
              message_count: c.message_count,
              image_count: c.image_count
          }));
      } catch (error) {
          console.error('ChatService.fetchScanChats error:', error);
          return [];
      }
  },

  fetchScanConversation: async (userId: string, chatId: string): Promise<{ messages: Message[], images: any[] }> => {
      try {
          // Endpoint: POST /feature2_get_chat_history
          const response = await fetch(`${Config.API_BASE_URL}/feature2_get_chat_history`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ user_id: userId, chat_id: chatId })
          });

          if (!response.ok) return { messages: [], images: [] };
          const data = await response.json();
          console.log('fetchScanConversation response:', JSON.stringify(data, null, 2));
          
          const messages = ChatService.mapMessages(data.messages || []);
          const images = data.images || [];
          
          return { messages, images };
      } catch (error) {
          console.error('ChatService.fetchScanConversation error:', error);
          return { messages: [], images: [] };
      }
  },

  scanQuestion: async (userId: string, chatId: string, imageUrl: string | null, message: string = ''): Promise<any> => {
      try {
          // Endpoint: POST /ocr_doubt_solver
          const payload: any = {
              user_id: userId,
              chat_id: chatId,
              message: message,
              image_url: imageUrl || ""
          };

          const response = await fetch(`${Config.API_BASE_URL}/ocr_doubt_solver`, {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
              },
              body: JSON.stringify(payload),
          });

          if (!response.ok) {
              const errorText = await response.text();
              console.error('ChatService.scanQuestion failed:', response.status, errorText);
              throw new Error(`Failed to scan question: ${response.status} - ${errorText}`);
          }

          const data = await response.json();
          console.log('scanQuestion response:', JSON.stringify(data, null, 2));
          
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
                  role: 'ai',
                  content: la.answer,
                  title: "Solution",
                  referenced_images: la.referenced_images,
                  animate: true, // live response
              };
              
              ChatService.appendAIResponse(data.messages, aiMsg);
          }
          
          return data;
      } catch (error) {
          console.error('ChatService.scanQuestion error:', error);
          throw error;
      }
  },

  deleteScanChat: async (userId: string, chatId: string): Promise<boolean> => {
      try {
          // Endpoint: POST /feature2_delete_chat
          const response = await fetch(`${Config.API_BASE_URL}/feature2_delete_chat`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ user_id: userId, chat_id: chatId })
          });
          return response.ok;
      } catch (error) {
          console.error('ChatService.deleteScanChat error:', error);
          return false;
      }
  },

  // 8. Feature 7 - Podcast Generator
  generatePodcast: async (userId: string, chatId: string, topic: string): Promise<any> => {
      try {
          // Endpoint: POST /podcast_generate
          const response = await fetch(`${Config.API_BASE_URL}/podcast_generate`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ user_id: userId, chat_id: chatId, topic: topic })
          });

          if (!response.ok) throw new Error("Podcast generation failed");
          return await response.json();
      } catch (error) {
          console.error('ChatService.generatePodcast error:', error);
          throw error;
      }
  },

  fetchPodcastChats: async (userId: string): Promise<any[]> => {
      try {
          // Endpoint: POST /feature7_get_chats
          const response = await fetch(`${Config.API_BASE_URL}/feature7_get_chats`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ user_id: userId })
          });

          if (!response.ok) return [];
          const data = await response.json();
          // Map to standard format
          return (data.chats || []).map((c: any) => ({
              id: c.chat_id,
              title: `Podcast Chat ${c.chat_id.slice(-4)}`, // or we could fetch topics
              date: c.last_updated || new Date().toISOString(),
              podcast_count: c.podcast_count
          }));
      } catch (error) {
          console.error('ChatService.fetchPodcastChats error:', error);
          return [];
      }
  },

  fetchPodcastHistory: async (userId: string, chatId: string): Promise<any[]> => {
      try {
          // Endpoint: POST /feature7_get_chat_history
          const response = await fetch(`${Config.API_BASE_URL}/feature7_get_chat_history`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ user_id: userId, chat_id: chatId })
          });

          if (!response.ok) return [];
          const data = await response.json();
          return data.podcasts || [];
      } catch (error) {
          console.error('ChatService.fetchPodcastHistory error:', error);
          return [];
      }
  },

  deletePodcastChat: async (userId: string, chatId: string): Promise<boolean> => {
      try {
          // Endpoint: POST /feature7_delete_chat
          const response = await fetch(`${Config.API_BASE_URL}/feature7_delete_chat`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ user_id: userId, chat_id: chatId })
          });
          return response.ok;
      } catch (error) {
          console.error('ChatService.deletePodcastChat error:', error);
          return false;
      }
  },

  // 9. Feature 9 - Test Generator
  generateTest: async (
      userId: string, 
      topic: string, 
      difficulty: 'easy' | 'medium' | 'hard', 
      numQuestions: number, 
      types: string[]
  ): Promise<any> => {
      try {
          const response = await fetch(`https://llmquestionansweringreasoning.onrender.com/test/generate`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  topic,
                  difficulty,
                  number_of_questions: numQuestions,
                  question_types: types,
                  user_id: userId // If needed by backend for logging
              })
          });

          if (!response.ok) throw new Error("Test generation failed");
          const data = await response.json();
          console.log("ChatService: generateTest response:", JSON.stringify(data, null, 2));
          return data;
      } catch (error) {
          console.error('ChatService.generateTest error:', error);
          throw error;
      }
  },

  evaluateTest: async (testId: string, studentAnswers: any[]): Promise<any> => {
      try {
          const response = await fetch(`https://llmquestionansweringreasoning.onrender.com/test/evaluate`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  test_id: testId,
                  student_answers: studentAnswers
              })
          });

          if (!response.ok) throw new Error("Test evaluation failed");
          return await response.json();
      } catch (error) {
          console.error('ChatService.evaluateTest error:', error);
          throw error;
      }
  },

  // --- Helper for Deduplication ---
  appendAIResponse: (messages: Message[], newAiMsg: Message) => {
      // Check last few messages for duplication to avoid re-rendering same answer
      // We look at the last 3 messages to be safe (User, AI, maybe another?)
      const recentMessages = messages.slice(-3);
      
      const exists = recentMessages.some((m: Message) => {
          if (m.role !== 'ai') return false;
          // Compare content roughly
          const c1 = (m.content || m.body || '').trim();
          const c2 = (newAiMsg.content || newAiMsg.body || '').trim();
          return c1 === c2 && c1.length > 0;
      });

      if (!exists) {
           messages.push(newAiMsg);
      } else {
           console.log("ChatService: Duplicate AI response detected, skipping append.");
      }
  }
};
