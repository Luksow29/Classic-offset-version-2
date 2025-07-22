// @ts-nocheck
/// <reference types="vite/client" />

import React, { useState, FormEvent, useEffect, useRef } from 'react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { useUser } from '@/context/UserContext';
import { Mic, Languages, Send, MicOff } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// --- TYPE DEFINITIONS ---
interface CustomWindow extends Window {
  SpeechRecognition: typeof SpeechRecognition;
  webkitSpeechRecognition: typeof SpeechRecognition;
}
declare const window: CustomWindow;

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;

interface ContentPart {
  text: string;
}
interface ConversationEntry {
  role: 'user' | 'model';
  parts: ContentPart[];
}

const FUNCTION_URL = "https://ytnsjmbhgwcuwmnflncl.supabase.co/functions/v1/custom-ai-agent";

const askClassicAI = async (
  history: ConversationEntry[],
  accessToken: string,
  anonKey: string
): Promise<string> => {
  try {
    const response = await fetch(FUNCTION_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': anonKey, 'Authorization': `Bearer ${accessToken}` },
      body: JSON.stringify({ history }), // agentType is no longer needed
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Request failed with status ${response.status}`);
    }
    const data = await response.json();
    return data.response;
  } catch (error) {
    console.error("Error invoking Supabase function:", error);
    throw error;
  }
};

interface GeminiChatProps {
  starterPrompt?: string;
}

const GeminiChat: React.FC<GeminiChatProps> = ({ starterPrompt = '' }) => {
  const [prompt, setPrompt] = useState<string>('');
  const [conversationHistory, setConversationHistory] = useState<ConversationEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { session } = useUser();
  const chatDisplayRef = useRef<HTMLDivElement>(null);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const placeholderText = 'வாடிக்கையாளர், ஆர்டர்களைப் பற்றி கேட்கவும்...';

  useEffect(() => {
    if (starterPrompt) setPrompt(starterPrompt);
  }, [starterPrompt]);

  useEffect(() => {
    chatDisplayRef.current?.scrollTo(0, chatDisplayRef.current.scrollHeight);
  }, [conversationHistory, isLoading]);

  useEffect(() => {
    if (!SpeechRecognitionAPI) return;
    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'ta-IN';
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (e: SpeechRecognitionErrorEvent) => console.error("Speech recognition error", e.error);
    recognition.onresult = (e: SpeechRecognitionEvent) => setPrompt(e.results[0][0].transcript);
    recognitionRef.current = recognition;
    return () => recognition.stop();
  }, []);

  const handleNewPrompt = async (currentPrompt: string) => {
    if (!currentPrompt.trim() || !session) return;
    setIsLoading(true);
    setError(null);
    const updatedHistory: ConversationEntry[] = [...conversationHistory, { role: 'user', parts: [{ text: currentPrompt }] }];
    setConversationHistory(updatedHistory);
    setPrompt('');
    try {
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      if (!anonKey) throw new Error("VITE_SUPABASE_ANON_KEY is not set.");
      const result = await askClassicAI(updatedHistory, session.access_token, anonKey);
      setConversationHistory(prev => [...prev, { role: 'model', parts: [{ text: result }] }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      setConversationHistory(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    handleNewPrompt(prompt);
  };
  
  const handleVoiceInputToggle = () => {
    if (isListening) recognitionRef.current?.stop();
    else recognitionRef.current?.start();
  };
  
  const handleTranslate = async () => {
      // Translation logic can be added here if needed in the future
  };

  const renderContent = (text: string) => (
    <div className="prose prose-sm dark:prose-invert max-w-none">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
    </div>
  );

  return (
    <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm dark:bg-gray-800 flex flex-col h-full">
      <div ref={chatDisplayRef} className="flex-grow mb-4 overflow-y-auto p-4 bg-gray-50 rounded-lg border dark:bg-zinc-700 dark:border-zinc-600">
        {conversationHistory.length === 0 && !isLoading && (
            <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                <p>கேள்வி கேட்கவும் அல்லது தொடக்கத்தைத் தேர்ந்தெடுக்கவும்.</p>
            </div>
        )}
        {conversationHistory.map((entry, index) => (
          <div key={index} className={`mb-3 p-3 rounded-lg flex flex-col ${ entry.role === 'user' ? 'bg-indigo-50 dark:bg-indigo-900/40 items-end ml-auto' : 'bg-gray-100 dark:bg-gray-700/60 items-start' }`} style={{ maxWidth: '85%' }}>
            <p className="font-bold text-sm capitalize text-gray-800 dark:text-gray-100 mb-1">{entry.role === 'model' ? `AI Classic` : 'நீங்கள்'}</p>
            {renderContent(entry.parts[0].text)}
          </div>
        ))}
        {isLoading && (
             <div className="my-2 p-3 rounded-lg bg-gray-100 dark:bg-gray-700/60 flex items-center" style={{ maxWidth: '85%' }}>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-500 mr-3"></div>
                <p className="text-gray-600 dark:text-gray-300">யோசிக்கிறேன்...</p>
             </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <Input type="text" value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder={isListening ? 'பேசுங்கள்...' : placeholderText} className="flex-grow" disabled={isLoading} aria-label="Ask the AI agent" />
        
        <Button type="button" onClick={handleVoiceInputToggle} disabled={isLoading} variant="outline" className={`px-3 ${isListening ? 'text-red-500' : ''}`}>
          {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </Button>
        <Button type="button" onClick={handleTranslate} disabled={isLoading || conversationHistory.filter(e => e.role === 'model').length === 0} variant="outline" className="px-3">
            <Languages className="w-5 h-5" />
        </Button>
        <Button type="submit" disabled={isLoading || !prompt.trim()} className="px-4 py-2">
            <Send className="w-5 h-5" />
        </Button>
      </form>

      {error && <p className="text-red-500 mt-2 text-sm text-center">{error}</p>}
    </div>
  );
};

export default GeminiChat;
