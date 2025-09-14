import React, { useState, useEffect, useCallback } from 'react';
import { AllChats, Chat, Message, Part, Role, GroundingChunk } from '../types';
import { generateResponseStream, generateChatTitle, generateImage } from '../services/geminiService';
import Sidebar from './Sidebar';
import ChatView from './ChatView';

const CHAT_STORAGE_KEY = 'elix_allChats';

const ChatContainer: React.FC = () => {
  const [allChats, setAllChats] = useState<AllChats>({});
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const storedChats = localStorage.getItem(CHAT_STORAGE_KEY);
    if (storedChats) {
      setAllChats(JSON.parse(storedChats));
    }
  }, []);

  useEffect(() => {
    if (Object.keys(allChats).length > 0) {
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(allChats));
    }
  }, [allChats]);
  
  const createNewChat = useCallback(() => {
    const newChatId = `chat_${Date.now()}`;
    const newChat: Chat = {
      id: newChatId,
      title: "New Chat",
      messages: [],
      useWebSearch: true, // Always use web search for new chats
    };
    setAllChats(prev => ({ ...prev, [newChatId]: newChat }));
    setActiveChatId(newChatId);
    setIsSidebarOpen(false);
  }, []);

  const selectChat = (id: string) => {
    setActiveChatId(id);
    setIsSidebarOpen(false);
  };

  const handleGenerateImage = async (prompt: string, currentChatId: string) => {
    setIsGenerating(true);
    // Add a placeholder message for the model response
    setAllChats(prev => ({
        ...prev,
        [currentChatId]: {
            ...prev[currentChatId],
            messages: [...prev[currentChatId].messages, { role: Role.MODEL, parts: [{ text: '' }] }]
        }
    }));
    try {
        const imageBase64 = await generateImage(prompt);
        if (imageBase64) {
            const imagePart: Part = { inlineData: { mimeType: 'image/png', data: imageBase64 } };
            setAllChats(prev => {
                const chats = { ...prev };
                const chat = chats[currentChatId];
                const lastMessageIndex = chat.messages.length - 1;
                chat.messages[lastMessageIndex] = { role: Role.MODEL, parts: [imagePart] };
                return chats;
            });
        } else {
            throw new Error("Failed to generate image.");
        }
    } catch (error) {
        console.error("Image generation error:", error);
        setAllChats(prev => {
           const chats = { ...prev };
           const chat = chats[currentChatId];
           const lastMessageIndex = chat.messages.length - 1;
           chat.messages[lastMessageIndex] = { role: Role.MODEL, parts: [{ text: "Sorry, I couldn't create that image." }] };
           return chats;
        });
    } finally {
        setIsGenerating(false);
    }
  }

  const handleSendMessage = async (text: string, image?: { mimeType: string; data: string; }) => {
    const userParts: Part[] = [];
    if (image) userParts.push({ inlineData: image });
    if (text) userParts.push({ text });
    if (userParts.length === 0) return;

    let chatToUpdate: Chat;
    let currentChatId: string;
    const isNewChat = !activeChatId;

    if (isNewChat) {
        currentChatId = `chat_${Date.now()}`;
        chatToUpdate = { id: currentChatId, title: "New Chat", messages: [], useWebSearch: true };
        setActiveChatId(currentChatId);
    } else {
        currentChatId = activeChatId!;
        chatToUpdate = allChats[currentChatId];
    }
    
    const userMessage: Message = { role: Role.USER, parts: userParts };
    const historyForAPI = chatToUpdate.messages; // History before adding the new user message.
    
    // Immediately update state with the user message.
    const updatedChatWithUserMsg = { ...chatToUpdate, messages: [...chatToUpdate.messages, userMessage] };
    setAllChats(prev => ({ ...prev, [currentChatId]: updatedChatWithUserMsg }));

    // Generate title for new chats
    if (isNewChat && text) {
        generateChatTitle(text).then(title => {
            setAllChats(prev => ({
                ...prev,
                [currentChatId]: { ...prev[currentChatId], title }
            }));
        });
    }

    // Handle image generation
    const imageGenRegex = /^(create|generate|make|draw)\s+(an?|some)?\s*(image|picture|photo|drawing|painting)\s+(of|about)\s+(.+)/i;
    const imageGenMatch = text.trim().match(imageGenRegex);

    if (imageGenMatch && imageGenMatch[5]) {
        const prompt = imageGenMatch[5].trim();
        handleGenerateImage(prompt, currentChatId);
        return;
    }

    setIsGenerating(true);
    // Add placeholder for model response right after setting user message
    setAllChats(prev => {
        const chats = { ...prev };
        const chat = chats[currentChatId];
        if (chat) { // Ensure chat exists before trying to update it.
            chats[currentChatId] = { ...chat, messages: [...chat.messages, { role: Role.MODEL, parts: [{ text: '' }] }] };
        }
        return chats;
    });

    try {
        const stream = generateResponseStream(historyForAPI, userParts, chatToUpdate.useWebSearch);
        
        let fullResponse = "";
        let groundingMetadata: GroundingChunk[] = [];
        
        for await (const chunk of stream) {
            fullResponse += chunk.text;
            if (chunk.candidates?.[0]?.groundingMetadata?.groundingChunks) {
                chunk.candidates[0].groundingMetadata.groundingChunks.forEach(newChunk => {
                    if (newChunk.web?.uri && !groundingMetadata.some(existing => existing.web?.uri === newChunk.web.uri)) {
                        groundingMetadata.push(newChunk);
                    }
                });
            }

            // Update the last message (the placeholder) with the streaming content
            setAllChats(prev => {
                const chats = { ...prev };
                const chat = chats[currentChatId];
                if(chat && chat.messages.length > 0) {
                    const lastMessageIndex = chat.messages.length - 1;
                    if (chat.messages[lastMessageIndex].role === Role.MODEL) { // Make sure we are updating the model's message
                        chat.messages[lastMessageIndex].parts = [{ text: fullResponse }];
                    }
                }
                return { ...chats };
            });
        }
        
        // Final update with grounding metadata
        setAllChats(prev => {
            const chats = { ...prev };
            const chat = chats[currentChatId];
            if (chat && chat.messages.length > 0) {
                const lastMessageIndex = chat.messages.length - 1;
                 if (chat.messages[lastMessageIndex].role === Role.MODEL) {
                    chat.messages[lastMessageIndex].groundingMetadata = groundingMetadata.length > 0 ? groundingMetadata : undefined;
                 }
            }
            return { ...chats };
        });

    } catch (error) {
      console.error("Error sending message:", error);
      // Update the last message (the placeholder) with an error message
      setAllChats(prev => {
         const chats = { ...prev };
         const chat = chats[currentChatId];
         if (chat && chat.messages.length > 0) {
            const lastMessageIndex = chat.messages.length - 1;
            if (chat.messages[lastMessageIndex].role === Role.MODEL) {
                chat.messages[lastMessageIndex].parts = [{ text: "Sorry, I encountered an error." }];
            }
         }
         return chats;
      });
    } finally {
      setIsGenerating(false);
    }
  };


  const activeChat = activeChatId ? allChats[activeChatId] : null;
  const chatList = Object.values(allChats).sort((a,b) => parseInt(b.id.split('_')[1]) - parseInt(a.id.split('_')[1]));

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
        <Sidebar 
            chats={chatList} 
            activeChatId={activeChatId}
            onSelectChat={selectChat}
            onNewChat={createNewChat}
            isOpen={isSidebarOpen}
        />
        <div className={`h-full transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-64' : 'translate-x-0'}`}>
            <ChatView
                chat={activeChat}
                isGenerating={isGenerating}
                onSendMessage={handleSendMessage}
                onNewChat={createNewChat}
                onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
            />
        </div>
    </div>
  );
};

export default ChatContainer;