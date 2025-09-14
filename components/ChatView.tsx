import React, { useState, useEffect, useRef } from 'react';
import { marked } from 'marked';
import { Message, Role, Chat, Part } from '../types';
import MenuIcon from './icons/MenuIcon';
import NewChatIcon from './icons/NewChatIcon';
import MoreOptionsIcon from './icons/MoreOptionsIcon';
import ImageIcon from './icons/ImageIcon';
import MicIcon from './icons/MicIcon';
import SendIcon from './icons/SendIcon';
import DownloadIcon from './icons/DownloadIcon';
import ThumbsUpIcon from './icons/ThumbsUpIcon';
import ThumbsDownIcon from './icons/ThumbsDownIcon';
import ElixIcon from './icons/ElixIcon';

const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
let recognition: any | null = null;
if (SpeechRecognition) {
  recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.lang = 'en-US';
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
}

const LoadingIndicator = () => (
    <div className="flex items-center gap-2">
        <span className="sr-only">Elix is thinking...</span>
        <div className="w-2 h-2 rounded-full bg-pink-500 animate-pulse" style={{ animationDelay: '0s' }}></div>
        <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
        <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" style={{ animationDelay: '0.4s' }}></div>
    </div>
);

interface ChatViewProps {
  chat: Chat | null;
  isGenerating: boolean;
  onSendMessage: (text: string, image?: { mimeType: string; data: string; }) => void;
  onNewChat: () => void;
  onToggleSidebar: () => void;
}

const ChatView: React.FC<ChatViewProps> = ({ chat, isGenerating, onSendMessage, onNewChat, onToggleSidebar }) => {
    const [input, setInput] = useState('');
    const [image, setImage] = useState<{ mimeType: string; data: string; file: File } | null>(null);
    const [isListening, setIsListening] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chat?.messages, isGenerating]);

    const handleSend = () => {
        if ((!input.trim() && !image) || isGenerating) return;
        onSendMessage(input, image ? { mimeType: image.mimeType, data: image.data } : undefined);
        setInput('');
        setImage(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
    };
    
    const handleMicClick = () => {
      if (!recognition) return;
      if (isListening) {
          recognition.stop();
          setIsListening(false);
          return;
      }
      recognition.start();
      setIsListening(true);
      recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setInput(prev => prev ? `${prev} ${transcript}`: transcript);
      };
      recognition.onerror = (event: any) => {
          console.error("Speech recognition error", event.error);
          setIsListening(false);
      };
      recognition.onend = () => {
        setIsListening(false);
      }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = (reader.result as string).split(',')[1];
            setImage({
                mimeType: file.type,
                data: base64String,
                file: file,
            });
        };
        reader.readAsDataURL(file);
    };

    const handleDownload = (inlineData: { mimeType: string; data: string; }) => {
      const link = document.createElement('a');
      link.href = `data:${inlineData.mimeType};base64,${inlineData.data}`;
      const extension = inlineData.mimeType.split('/')[1] || 'png';
      link.download = `elix-generated-image-${Date.now()}.${extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    return (
        <div className="h-screen w-full flex flex-col bg-black text-white relative">
            <header className="flex-shrink-0 flex justify-between items-center p-4 border-b border-white/10">
                <div className="flex items-center gap-2">
                    <button onClick={onToggleSidebar} className="p-2 -m-2 text-white/80 hover:text-white"><MenuIcon className="w-6 h-6" /></button>
                     <h1 className="text-lg font-semibold h-8 flex items-center">
                        {(chat && chat.title && chat.title !== "New Chat") ? (
                            chat.title
                        ) : (
                            <span className="font-bold text-2xl tracking-tighter bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600 text-transparent bg-clip-text">
                              Elix
                            </span>
                        )}
                    </h1>
                </div>
                <div className="flex items-center gap-2">
                     <button onClick={onNewChat} className="p-2 -m-2 text-white/80 hover:text-white"><NewChatIcon className="w-6 h-6" /></button>
                     <button className="p-2 -m-2 text-white/80 hover:text-white"><MoreOptionsIcon className="w-6 h-6" /></button>
                </div>
            </header>
            
            <main className="flex-1 overflow-y-auto p-6 flex flex-col">
                 {(!chat || chat.messages.length === 0) ? (
                    <div className="flex-1 flex flex-col justify-center items-center text-center gap-4">
                        <h1 className="text-5xl font-bold bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600 text-transparent bg-clip-text">Elix</h1>
                        <p className="text-2xl font-medium text-white/60">How can I help you today?</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {chat.messages.map((msg, index) => {
                            const isLastMessage = index === chat.messages.length - 1;
                            const isModelMessage = msg.role === Role.MODEL;
                            const isModelAndEmpty = isModelMessage && (!msg.parts[0]?.text || msg.parts[0].text.trim() === '');
                            
                            return (
                                <div key={index} className={`flex gap-3 ${msg.role === Role.USER ? 'flex-row-reverse' : 'flex-row'}`}>
                                    {isModelMessage && <ElixIcon className="w-8 h-8 flex-shrink-0" />}
                                    <div className={`max-w-2xl w-fit rounded-2xl p-3 ${msg.role === Role.USER ? 'bg-[#333]' : 'bg-[#1e1e1e]'}`}>
                                        {isGenerating && isLastMessage && isModelAndEmpty ? (
                                            <LoadingIndicator />
                                        ) : (
                                            <div className="prose prose-invert prose-p:my-0 flex flex-col gap-4">
                                                {msg.parts.map((part, partIndex) => {
                                                    if (part.inlineData) {
                                                        const isModelImage = msg.role === Role.MODEL;
                                                        return (
                                                            <div key={partIndex} className="relative group max-w-xs">
                                                                <img src={`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`} className="rounded-lg" alt={isModelImage ? "Generated by Elix" : "User upload"} />
                                                                {isModelImage && (
                                                                    <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/60 backdrop-blur-sm rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                        <button onClick={() => handleDownload(part.inlineData!)} className="p-1.5 text-white/80 hover:text-white" title="Download Image"><DownloadIcon className="w-5 h-5" /></button>
                                                                        <button className="p-1.5 text-white/80 hover:text-white" title="Good response"><ThumbsUpIcon className="w-5 h-5" /></button>
                                                                        <button className="p-1.5 text-white/80 hover:text-white" title="Bad response"><ThumbsDownIcon className="w-5 h-5" /></button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    }
                                                    if (part.text || part.text === '') {
                                                        return <div key={partIndex} dangerouslySetInnerHTML={{ __html: marked.parse(part.text) as string }} />;
                                                    }
                                                    return null;
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </div>
                )}
            </main>
            
            <footer className="flex-shrink-0 p-4">
                {image && <div className="mb-2 pl-4 text-left text-sm text-gray-400">Image attached: {image.file.name}</div>}
                <div className="relative flex items-center bg-[#2c2c2e] rounded-full px-2 py-1">
                    <button onClick={() => fileInputRef.current?.click()} className="p-2 text-gray-400 hover:text-white">
                        <ImageIcon className="w-6 h-6" />
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />
                    <input
                        type="text"
                        value={input}
                        disabled={isGenerating}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Ask anything"
                        className="flex-1 w-full bg-transparent text-white placeholder-gray-500 focus:outline-none text-base px-2 disabled:opacity-50"
                    />
                    <button onClick={handleMicClick} className="p-2 text-gray-400 hover:text-white">
                        <MicIcon className="w-6 h-6" />
                    </button>
                    {(input.trim() || image) && !isGenerating && (
                        <button onClick={handleSend} disabled={isGenerating} className="p-1 disabled:opacity-50">
                            <SendIcon className="w-8 h-8" />
                        </button>
                    )}
                </div>
            </footer>
        </div>
    );
};

export default ChatView;