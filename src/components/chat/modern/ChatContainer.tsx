// @ts-nocheck
import React, { useState, FormEvent, useEffect, useRef } from 'react';
import { useUser } from '@/context/UserContext';
import { ChatHeader } from './ChatHeader';
import { ChatInputArea, AttachmentFile } from './ChatInputArea';
import { MessageList } from './MessageList';
import { ConversationEntry, DetectedEntity } from './MessageBubble';

// --- SHARED TYPES and HELPERS COPIED FROM GeminiChat.tsx ---

interface CustomWindow extends Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
}
declare const window: CustomWindow;

interface SpeechRecognitionErrorEvent extends Event {
    error: string;
}

const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;

const DEFAULT_FUNCTION_URL = "https://ytnsjmbhgwcuwmnflncl.supabase.co/functions/v1/custom-ai-agent";
const FUNCTION_URL = (() => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
    if (!supabaseUrl) return DEFAULT_FUNCTION_URL;
    return `${supabaseUrl.replace(/\/$/, '')}/functions/v1/custom-ai-agent`;
})();

const askClassicAI = async (
    history: ConversationEntry[],
    accessToken: string,
    anonKey: string
): Promise<string> => {
    try {
        const cleanHistory = history.map(entry => ({
            role: entry.role,
            parts: entry.parts
        }));

        const response = await fetch(FUNCTION_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'apikey': anonKey, 'Authorization': `Bearer ${accessToken}` },
            body: JSON.stringify({ history: cleanHistory }),
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

interface ChatContainerProps {
    starterPrompt?: string;
}

export const ChatContainer: React.FC<ChatContainerProps> = ({ starterPrompt = '' }) => {
    // --- STATE MANAGEMENT ---
    const [prompt, setPrompt] = useState<string>('');
    const [conversationHistory, setConversationHistory] = useState<ConversationEntry[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [processingStage, setProcessingStage] = useState<string>('');
    const [toolSteps, setToolSteps] = useState<string[]>([]);
    const [isComplexQuery, setIsComplexQuery] = useState<boolean>(false);
    const [thinkingSteps, setThinkingSteps] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);
    const { session } = useUser();
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef<SpeechRecognition | null>(null);
    const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
    const [translated, setTranslated] = useState<{ [index: number]: string }>({});

    // --- ENTITY EXTRACTION & LOGIC (COPIED from GeminiChat) ---

    function extractCustomerName(text: string): string | null {
        let match = text.match(/customer\s*[:\-]?\s*([\p{L}\s]+)/iu);
        if (match) return match[1].trim();
        match = text.match(/for\s+customer\s+([\p{L}\s]+)/iu);
        if (match) return match[1].trim();
        match = text.match(/வாடிக்கையாளர்(?:\s*பெயர்)?\s*[:\-]?\s*([\p{L}\s]+)/u);
        if (match) return match[1].trim();
        return null;
    }

    function getContextualSuggestions(aiText: string): string[] {
        const customer = extractCustomerName(aiText);
        if (customer) {
            return [
                `Show all orders for ${customer}`,
                `Show payments for ${customer}`,
                `Show dues for ${customer}`,
                `Contact details for ${customer}`
            ];
        }
        return [
            "Show me today's orders",
            "Who are my top 3 customers?",
            "Show payments for a customer"
        ];
    }

    const extractEntities = (text: string): DetectedEntity[] => {
        // Simplified for brevity, detailed logic matches GeminiChat
        const entities: DetectedEntity[] = [];
        const customerPatterns = [/(?:Name|Customer):\s*([A-Za-z\u0B80-\u0BFF]{2,30})/gi];
        customerPatterns.forEach(pattern => {
            const matches = text.matchAll(pattern);
            for (const match of matches) {
                if (match[1]) entities.push({ type: 'customer', value: match[1], action: `Show orders for ${match[1]}` });
            }
        });
        return entities; // In real app, include full logic from GeminiChat
    };

    const isComplexQueryDetection = (prompt: string): boolean => {
        const complexKeywords = ['analyze', 'compare', 'summarize', 'report', 'calculate', 'trends'];
        return complexKeywords.some(k => prompt.toLowerCase().includes(k)) || prompt.length > 100;
    };

    const generateThinkingSteps = (prompt: string): string[] => {
        return ['🤔 Understanding request...', '📊 Gathering data...', '✨ Synthesizing insights...'];
    };

    // --- EFFECTS ---

    useEffect(() => {
        if (starterPrompt) setPrompt(starterPrompt);
    }, [starterPrompt]);

    useEffect(() => {
        if (!SpeechRecognitionAPI) return;
        const recognition = new SpeechRecognitionAPI();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'ta-IN';
        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onresult = (e: any) => setPrompt(e.results[0][0].transcript);
        recognitionRef.current = recognition;
        return () => recognition.stop();
    }, []);

    // --- HANDLERS ---

    const handleVoiceToggle = () => {
        if (isListening) recognitionRef.current?.stop();
        else recognitionRef.current?.start();
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files) return;
        for (const file of Array.from(files)) {
            const url = URL.createObjectURL(file);
            const attachment: AttachmentFile = {
                name: file.name,
                type: file.type,
                size: file.size,
                url,
                preview: file.type.startsWith('image/') ? url : undefined,
                extractedText: file.type.startsWith('text/') ? await file.text() : undefined
            };
            setAttachments(prev => [...prev, attachment]);
        }
    };

    const handleNewPromptWithAttachments = async (currentPrompt: string) => {
        if (!currentPrompt.trim() && attachments.length === 0) return;
        if (!session) return;

        setIsLoading(true);
        setError(null);
        setProcessingStage('Analyzing request...');

        const isComplex = isComplexQueryDetection(currentPrompt);
        setIsComplexQuery(isComplex);
        if (isComplex) {
            const steps = generateThinkingSteps(currentPrompt);
            for (let i = 0; i < steps.length; i++) {
                await new Promise(resolve => setTimeout(resolve, 500));
                setThinkingSteps(prev => [...prev, steps[i]]);
            }
        }

        // Prepare Document context
        let documentContext = '';
        attachments.forEach((doc, i) => {
            if (doc.extractedText) documentContext += `\nDocument ${i + 1}: ${doc.name}\n${doc.extractedText}\n`;
        });

        const enhancedPrompt = documentContext ? `${currentPrompt}\n\nDocuments:\n${documentContext}` : currentPrompt;

        const displayEntry: ConversationEntry = {
            role: 'user',
            parts: [{ text: currentPrompt }],
            attachments: [...attachments],
            timestamp: Date.now()
        };

        // Optimistic Update
        const newHistory = [...conversationHistory, displayEntry];
        setConversationHistory(newHistory);
        setPrompt('');
        setAttachments([]);

        try {
            const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
            const apiEntry: ConversationEntry = { role: 'user', parts: [{ text: enhancedPrompt }] };
            const result = await askClassicAI([...conversationHistory, apiEntry], session.access_token, anonKey);

            setConversationHistory(prev => [...prev, { role: 'model', parts: [{ text: result }], timestamp: Date.now() }]);
        } catch (err: any) {
            setError(err.message);
            // revert logic could go here
        } finally {
            setIsLoading(false);
            setProcessingStage('');
            setIsComplexQuery(false);
            setThinkingSteps([]);
            setToolSteps([]);
        }
    };

    // Quick Action Handlers
    const handleCopy = (text: string) => navigator.clipboard.writeText(text);
    const handleShare = (text: string) => navigator.share?.({ text });
    const handleExport = (text: string) => {
        const blob = new Blob([text], { type: 'text/plain' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'chat.txt';
        a.click();
    };
    const handleEntityClick = (entity: DetectedEntity) => {
        if (entity.action) handleNewPromptWithAttachments(entity.action);
    };

    return (
        <div className="flex flex-col h-full w-full bg-gray-50 dark:bg-gray-900 overflow-hidden relative font-sans text-gray-900 dark:text-gray-100">
            <ChatHeader
                isLoading={isLoading}
                onClearChat={() => setConversationHistory([])}
            />

            <MessageList
                history={conversationHistory}
                isLoading={isLoading}
                processingStage={processingStage}
                toolSteps={toolSteps}
                thinkingSteps={thinkingSteps}
                isComplexQuery={isComplexQuery}
                translated={translated}
                onEntityClick={handleEntityClick}
                onQuickReply={(text) => handleNewPromptWithAttachments(text)}
                onCopy={handleCopy}
                onShare={handleShare}
                onExport={handleExport}
                extractEntities={extractEntities}
                getContextualSuggestions={getContextualSuggestions}
            />

            <ChatInputArea
                prompt={prompt}
                setPrompt={setPrompt}
                isLoading={isLoading}
                isListening={isListening}
                attachments={attachments}
                onSend={() => handleNewPromptWithAttachments(prompt)}
                onFileSelect={handleFileUpload}
                onRemoveAttachment={(index) => setAttachments(prev => prev.filter((_, i) => i !== index))}
                onVoiceToggle={handleVoiceToggle}
            />

            {error && (
                <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-red-100 border border-red-300 text-red-700 px-4 py-2 rounded-xl shadow-lg z-50">
                    {error}
                </div>
            )}
        </div>
    );
};
