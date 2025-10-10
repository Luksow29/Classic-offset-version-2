// @ts-nocheck
/// <reference types="vite/client" />

import React, { useState, FormEvent, useEffect, useRef } from 'react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { useUser } from '@/context/UserContext';
import { Mic, Languages, Send, MicOff, Bot, MessageSquare, Copy, Share2, Download, Paperclip, X, FileText, Image, User, Calendar, DollarSign, Package } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Bar, Line, Pie } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

// PDF.js will be loaded dynamically to avoid import issues

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
  attachments?: AttachmentFile[];
}

interface AttachmentFile {
  name: string;
  type: string;
  size: number;
  url: string;
  preview?: string;
  extractedText?: string;
}

interface DetectedEntity {
  type: 'customer' | 'date' | 'amount' | 'product' | 'order';
  value: string;
  action?: string;
}

const FUNCTION_URL = "https://ytnsjmbhgwcuwmnflncl.supabase.co/functions/v1/custom-ai-agent";

const askClassicAI = async (
  history: ConversationEntry[],
  accessToken: string,
  anonKey: string
): Promise<string> => {
  try {
    // Clean history to remove attachments field before sending to API
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

interface GeminiChatProps {
  starterPrompt?: string;
}


// Helper: Extract customer/entity name from AI response (simple regex for demo)
function extractCustomerName(text: string): string | null {
  // English: "Customer: John Doe" or "Details for customer Lakshmi"
  let match = text.match(/customer\s*[:\-]?\s*([\p{L}\s]+)/iu);
  if (match) return match[1].trim();
  match = text.match(/for\s+customer\s+([\p{L}\s]+)/iu);
  if (match) return match[1].trim();
  // Tamil: "வாடிக்கையாளர்: ஹக்கீம்" or "வாடிக்கையாளர் பெயர்: ஹக்கீம்"
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
  // Fallback generic suggestions
  return [
    "Show me today's orders",
    "Who are my top 3 customers?",
    "Show payments for a customer"
  ];
}

const GeminiChat: React.FC<GeminiChatProps> = ({ starterPrompt = '' }) => {
  const [prompt, setPrompt] = useState<string>('');
  const [conversationHistory, setConversationHistory] = useState<ConversationEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [processingStage, setProcessingStage] = useState<string>('');
  const [toolSteps, setToolSteps] = useState<string[]>([]);
  const [isComplexQuery, setIsComplexQuery] = useState<boolean>(false);
  const [thinkingSteps, setThinkingSteps] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { session } = useUser();
  const chatDisplayRef = useRef<HTMLDivElement>(null);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showContextBar, setShowContextBar] = useState<boolean>(true);

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
    
    // Detect if this is a complex query
    const isComplex = isComplexQueryDetection(currentPrompt);
    setIsComplexQuery(isComplex);
    
    if (isComplex) {
      setProcessingStage('Initiating deep analysis...');
      const thinkingStepsArray = generateThinkingSteps(currentPrompt);
      setThinkingSteps([]);
      
      // Gradually reveal thinking steps
      for (let i = 0; i < thinkingStepsArray.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 300));
        setThinkingSteps(prev => [...prev, thinkingStepsArray[i]]);
      }
    } else {
      setProcessingStage('Processing your query...');
      setThinkingSteps([]);
    }
    
    setToolSteps([]);
    
    const updatedHistory: ConversationEntry[] = [...conversationHistory, { role: 'user', parts: [{ text: currentPrompt }] }];
    setConversationHistory(updatedHistory);
    setPrompt('');
    
    try {
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      if (!anonKey) throw new Error("VITE_SUPABASE_ANON_KEY is not set.");
      
      setProcessingStage('Connecting to Classic AI...');
      setToolSteps(['🌐 Establishing connection']);
      
      await new Promise(resolve => setTimeout(resolve, 400));
      
      setProcessingStage('AI is thinking...');
      setToolSteps(prev => [...prev, '🧠 Analyzing your question']);
      
      const result = await askClassicAI(updatedHistory, session.access_token, anonKey);
      
      setProcessingStage('Preparing response...');
      setToolSteps(prev => [...prev, '✨ Crafting detailed answer']);
      
      await new Promise(resolve => setTimeout(resolve, 200));
      
      setConversationHistory(prev => [...prev, { role: 'model', parts: [{ text: result }] }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      setConversationHistory(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
      setProcessingStage('');
      setToolSteps([]);
      setIsComplexQuery(false);
      setThinkingSteps([]);
    }
  };
  
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    handleNewPromptWithAttachments(prompt);
  };
  
  const handleVoiceInputToggle = () => {
    if (isListening) recognitionRef.current?.stop();
    else recognitionRef.current?.start();
  };
  
  // Translation state: store translated text for each AI message by index
  const [translated, setTranslated] = useState<{ [index: number]: string }>({});

  // Dummy translation function (replace with real API call for production)
  async function translateToTamil(text: string): Promise<string> {
    // For demo, just prepend '[தமிழ் மொழிபெயர்ப்பு]'
    // Replace with real translation API call
    return '[தமிழ் மொழிபெயர்ப்பு] ' + text;
  }

  // Translate the latest AI response to Tamil and show below original
  const handleTranslate = async () => {
    // Find the latest AI message index
    const lastAIIndex = conversationHistory.map(e => e.role).lastIndexOf('model');
    if (lastAIIndex === -1) return;
    const text = conversationHistory[lastAIIndex].parts[0].text;
    const tamil = await translateToTamil(text);
    setTranslated(prev => ({ ...prev, [lastAIIndex]: tamil }));
  };

  // Simple PDF text extraction fallback - for now, return placeholder
  const extractPDFText = async (file: File): Promise<string> => {
    console.log('PDF uploaded:', file.name);
    // For now, return a message indicating PDF was uploaded but extraction is pending
    return `[PDF File Uploaded: ${file.name} - ${(file.size / 1024).toFixed(1)}KB. 

Please describe what you'd like to know about this PDF, and I'll help based on the filename and context. 

For full PDF text extraction, we're working on server-side implementation for better reliability.]`;
  };

  // Extract text from TXT file
  const extractTextFromFile = async (file: File): Promise<string> => {
    try {
      return await file.text();
    } catch (error) {
      console.error('Error reading text file:', error);
      return '';
    }
  };

  // Handle file upload with text extraction
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      const url = URL.createObjectURL(file);
      let extractedText = '';

      // Extract text based on file type
      if (file.type === 'application/pdf') {
        extractedText = await extractPDFText(file);
      } else if (file.type === 'text/plain') {
        extractedText = await extractTextFromFile(file);
      } else if (file.type.startsWith('text/')) {
        // Handle other text file types
        extractedText = await extractTextFromFile(file);
      }

      const attachment: AttachmentFile = {
        name: file.name,
        type: file.type,
        size: file.size,
        url,
        preview: file.type.startsWith('image/') ? url : undefined,
        extractedText: extractedText || undefined
      };
      
      setAttachments(prev => [...prev, attachment]);
    }
  };

  // Remove attachment
  const removeAttachment = (index: number) => {
    setAttachments(prev => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].url);
      updated.splice(index, 1);
      return updated;
    });
  };

  // Modified handleNewPrompt to include attachments and document context
  const handleNewPromptWithAttachments = async (currentPrompt: string) => {
    if (!currentPrompt.trim() || !session) return;
    setIsLoading(true);
    setError(null);
    
    // Detect if this is a complex query
    const isComplex = isComplexQueryDetection(currentPrompt);
    setIsComplexQuery(isComplex);
    
    if (isComplex) {
      setProcessingStage('Initiating deep analysis...');
      const thinkingStepsArray = generateThinkingSteps(currentPrompt);
      setThinkingSteps([]);
      
      // Gradually reveal thinking steps
      for (let i = 0; i < thinkingStepsArray.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 600 + Math.random() * 400));
        setThinkingSteps(prev => [...prev, thinkingStepsArray[i]]);
      }
    } else {
      setProcessingStage('Analyzing your request...');
      setThinkingSteps([]);
    }
    
    setToolSteps([]);

    // Build document context from attachments
    let documentContext = '';
    if (attachments.length > 0) {
      setProcessingStage('Processing uploaded documents...');
      setToolSteps(['📄 Extracting text from documents']);
      
      // Add a small delay to show the processing step
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const documentsWithText = attachments.filter(att => att.extractedText);
      console.log('Attachments with text:', documentsWithText.length);
      if (documentsWithText.length > 0) {
        setToolSteps(prev => [...prev, `✅ Processed ${documentsWithText.length} document(s)`]);
        documentContext = '\n\n--- UPLOADED DOCUMENTS ---\n';
        documentsWithText.forEach((doc, index) => {
          console.log(`Adding document ${index + 1}: ${doc.name}, text length: ${doc.extractedText?.length}`);
          documentContext += `\nDocument ${index + 1}: ${doc.name}\nContent:\n${doc.extractedText}\n`;
        });
        documentContext += '\n--- END DOCUMENTS ---\n\n';
        console.log('Final document context length:', documentContext.length);
      }
    }

    // Enhance the prompt with document context
    setProcessingStage('Preparing enhanced query...');
    setToolSteps(prev => [...prev, '🔧 Building context from conversation history']);
    
    // Add delay to show processing
    await new Promise(resolve => setTimeout(resolve, 600));
    
    const enhancedPrompt = documentContext 
      ? `${currentPrompt}${documentContext}Please answer based on the uploaded documents if relevant.`
      : currentPrompt;
    
    console.log('Enhanced prompt:', enhancedPrompt.substring(0, 300) + '...');

    // Create two versions: one for display (with attachments) and one for API (clean)
    const displayEntry: ConversationEntry = { 
      role: 'user', 
      parts: [{ text: currentPrompt }], // Show original prompt to user
      attachments: attachments.length > 0 ? [...attachments] : undefined
    };
    
    const apiEntry: ConversationEntry = { 
      role: 'user', 
      parts: [{ text: enhancedPrompt }] // Send enhanced prompt to API
    };

    const updatedHistory: ConversationEntry[] = [...conversationHistory, displayEntry];
    
    setConversationHistory(updatedHistory);
    setPrompt('');
    setAttachments([]); // Clear attachments after sending
    
    setToolSteps(prev => [...prev, '✅ Query prepared successfully']);
    
    try {
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      if (!anonKey) throw new Error("VITE_SUPABASE_ANON_KEY is not set.");
      
      setProcessingStage('Connecting to Classic AI...');
      setToolSteps(prev => [...prev, '🌐 Establishing secure connection']);
      
      // Add delay to show connection step
      await new Promise(resolve => setTimeout(resolve, 400));
      
      setProcessingStage('AI is analyzing your request...');
      setToolSteps(prev => [...prev, '🤖 Processing with advanced AI model']);
      
      // Create API history with enhanced prompt but without attachments
      const apiHistory = [...conversationHistory, apiEntry];
      const result = await askClassicAI(apiHistory, session.access_token, anonKey);
      
      setProcessingStage('Finalizing response...');
      setToolSteps(prev => [...prev, '✨ Generating comprehensive answer']);
      
      // Add delay before showing final result
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setConversationHistory(prev => [...prev, { role: 'model', parts: [{ text: result }] }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      setConversationHistory(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
      setProcessingStage('');
      setToolSteps([]);
      setIsComplexQuery(false);
      setThinkingSteps([]);
    }
  };

  const handleQuickReply = (suggestion: string) => {
    setPrompt(suggestion);
    handleNewPromptWithAttachments(suggestion);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleShare = async (text: string) => {
    if (navigator.share) {
      await navigator.share({ text });
    } else {
      alert('Share not supported on this device.');
    }
  };

  const handleExport = (text: string) => {
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'classic-ai-response.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Generate conversation summary for context bar
  const getConversationSummary = () => {
    const totalMessages = conversationHistory.length;
    const userMessages = conversationHistory.filter(entry => entry.role === 'user').length;
    const aiMessages = conversationHistory.filter(entry => entry.role === 'model').length;
    const documentsUploaded = conversationHistory.reduce((total, entry) => 
      total + (entry.attachments?.length || 0), 0
    );
    
    return {
      totalMessages,
      userMessages,
      aiMessages,
      documentsUploaded,
      sessionStarted: new Date().toLocaleTimeString(),
    };
  };

  // Extract entities from AI response text
  const extractEntities = (text: string): DetectedEntity[] => {
    console.log('🔍 Extracting entities from text:', text.substring(0, 200) + '...');
    
    const entities: DetectedEntity[] = [];
    
    // Customer name patterns - more flexible and comprehensive
    const customerPatterns = [
      // Match "Name: Lukman" or "பெயர்: லுக்மான்"
      /(?:Name|பெயர்):\s*([A-Za-z\u0B80-\u0BFF]{2,30})/gi,
      // Match "Here are the details for Lukman:" - extract the name
      /Here are the details for\s+([A-Za-z\u0B80-\u0BFF]{2,30}):/gi,
      // Match "Customer: Lukman" 
      /Customer:\s*([A-Za-z\u0B80-\u0BFF]{2,30})/gi,
      // Match "details for customer Lukman" or "about customer Lukman"
      /(?:details for|about customer)\s+([A-Za-z\u0B80-\u0BFF]{2,30})/gi,
      // Match quoted names like "Lukman"
      /"([A-Za-z\u0B80-\u0BFF]{2,20})"/gi
    ];
    
    customerPatterns.forEach((pattern, index) => {
      console.log(`🔍 Trying customer pattern ${index + 1}:`, pattern.source);
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        const value = match[1]?.trim();
        console.log(`✅ Found potential customer:`, value);
        
        // Filter out common false positives but be less restrictive
        const excludeWords = ['details', 'customer', 'here', 'are', 'the', 'for', 'about', 'show', 'all', 'and', 'or', 'in', 'on', 'at', 'to', 'from', 'with', 'by'];
        
        if (value && 
            value.length >= 2 && 
            value.length <= 30 && 
            !excludeWords.includes(value.toLowerCase()) &&
            /^[A-Za-z\u0B80-\u0BFF]+$/.test(value)) { // Only letters, no spaces or special chars
          
          console.log(`✅ Adding customer entity:`, value);
          entities.push({
            type: 'customer',
            value,
            action: `Show orders for ${value}`
          });
        } else {
          console.log(`❌ Rejected customer:`, value, 'Reason: validation failed or excluded word');
        }
      }
    });
    
    // Customer ID patterns - look for IDs in structured format
    const idPatterns = [
      /(?:Customer ID|ID):\s*([A-Za-z0-9\-]{8,})/gi
    ];
    
    idPatterns.forEach(pattern => {
      console.log(`🔍 Trying ID pattern:`, pattern.source);
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        const value = match[1]?.trim();
        if (value && value.length >= 8) {
          console.log(`✅ Adding ID entity:`, value);
          entities.push({
            type: 'customer',
            value: value.substring(0, 8) + '...', // Shorten for display
            action: `Show customer ${value}`
          });
        }
      }
    });
    
    // Phone number patterns
    const phonePatterns = [
      /(?:Phone|Mobile|Contact):\s*(\+\d{10,15})/gi
    ];
    
    phonePatterns.forEach(pattern => {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        const value = match[1]?.trim();
        if (value) {
          entities.push({
            type: 'customer',
            value,
            action: `Call ${value}`
          });
        }
      }
    });
    
    // Email patterns
    const emailPatterns = [
      /(?:Email|Mail):\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi
    ];
    
    emailPatterns.forEach(pattern => {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        const value = match[1]?.trim();
        if (value) {
          entities.push({
            type: 'customer',
            value,
            action: `Email ${value}`
          });
        }
      }
    });
    
    // Date patterns
    const datePatterns = [
      /(?:Date|Created|Updated|Order Date):\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/gi,
      /(?:Date|Created|Updated|Order Date):\s*(\d{4}-\d{2}-\d{2})/gi
    ];
    
    datePatterns.forEach(pattern => {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        const value = match[1]?.trim();
        if (value) {
          entities.push({
            type: 'date',
            value,
            action: `Show orders for ${value}`
          });
        }
      }
    });
    
    console.log(`🎯 Final entities extracted:`, entities);
    
    // Remove duplicates
    return entities.filter((entity, index, self) => 
      index === self.findIndex(e => e.type === entity.type && e.value === entity.value)
    );
  };

  // Handle entity chip click
  const handleEntityClick = (entity: DetectedEntity) => {
    if (entity.action) {
      setPrompt(entity.action);
      handleNewPromptWithAttachments(entity.action);
    }
  };

  // Detect if a query requires complex multi-step thinking
  const isComplexQueryDetection = (prompt: string): boolean => {
    const complexKeywords = [
      'analyze', 'compare', 'summarize', 'report', 'calculate', 'trends', 
      'insights', 'breakdown', 'overview', 'analysis', 'statistics', 
      'performance', 'metrics', 'dashboard', 'forecast', 'predict',
      'multiple', 'several', 'various', 'different', 'all', 'everything',
      'top customers', 'best selling', 'monthly report', 'yearly summary',
      'sales analysis', 'customer analysis', 'product analysis'
    ];
    
    const hasComplexKeywords = complexKeywords.some(keyword => 
      prompt.toLowerCase().includes(keyword.toLowerCase())
    );
    
    const hasMultipleQuestions = (prompt.match(/\?/g) || []).length > 1;
    const hasAndOr = /\b(and|or|\+|&)\b/i.test(prompt);
    const isLongQuery = prompt.length > 100;
    
    return hasComplexKeywords || hasMultipleQuestions || hasAndOr || isLongQuery;
  };

  // Generate thinking steps for complex queries
  const generateThinkingSteps = (prompt: string): string[] => {
    const steps = ['🤔 Understanding your request...'];
    
    if (prompt.toLowerCase().includes('analyze') || prompt.toLowerCase().includes('analysis')) {
      steps.push('📊 Gathering relevant data points...');
      steps.push('🔍 Identifying key patterns and trends...');
      steps.push('📈 Performing statistical analysis...');
    }
    
    if (prompt.toLowerCase().includes('compare') || prompt.toLowerCase().includes('comparison')) {
      steps.push('⚖️ Setting up comparison framework...');
      steps.push('📋 Collecting comparable metrics...');
      steps.push('🔄 Cross-referencing data points...');
    }
    
    if (prompt.toLowerCase().includes('report') || prompt.toLowerCase().includes('summary')) {
      steps.push('📝 Structuring comprehensive report...');
      steps.push('🎯 Highlighting key findings...');
      steps.push('📊 Creating visual representations...');
    }
    
    if (prompt.toLowerCase().includes('customer') || prompt.toLowerCase().includes('customers')) {
      steps.push('👥 Accessing customer database...');
      steps.push('🔍 Filtering customer records...');
    }
    
    if (prompt.toLowerCase().includes('order') || prompt.toLowerCase().includes('sales')) {
      steps.push('🛒 Retrieving order history...');
      steps.push('💰 Calculating sales metrics...');
    }
    
    steps.push('✨ Synthesizing insights...');
    steps.push('📋 Preparing detailed response...');
    
    return steps;
  };


  // ChartRenderer helper remains here
  const ChartRenderer = ({ chartType, data, options }: any) => {
    if (chartType === 'bar') return <Bar data={data} options={options} />;
    if (chartType === 'line') return <Line data={data} options={options} />;
    if (chartType === 'pie') return <Pie data={data} options={options} />;
    return <div>Unsupported chart type</div>;
  };

  const renderContent = (text: string) => {
    // Detect chart code block: ```chartjs\n{...}\n```
    const chartMatch = text.match(/```chartjs\n([\s\S]*?)```/);
    if (chartMatch) {
      try {
        const chartSpec = JSON.parse(chartMatch[1]);
        return (
          <div className="my-4">
            <ChartRenderer chartType={chartSpec.type} data={chartSpec.data} options={chartSpec.options} />
          </div>
        );
      } catch (e) {
        // Fallback to markdown if JSON parse fails
      }
    }
    return (
      <div className="prose prose-sm dark:prose-invert max-w-none">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            table: ({node, ...props}) => (
              <div className="overflow-x-auto my-2">
                <table className="min-w-full border border-gray-300 dark:border-gray-700 text-sm" {...props} />
              </div>
            ),
            th: ({node, ...props}) => (
              <th className="bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 px-2 py-1 font-semibold" {...props} />
            ),
            td: ({node, ...props}) => (
              <td className="border border-gray-300 dark:border-gray-700 px-2 py-1" {...props} />
            ),
            ul: ({node, ...props}) => (
              <ul className="list-disc ml-6 my-2" {...props} />
            ),
            ol: ({node, ...props}) => (
              <ol className="list-decimal ml-6 my-2" {...props} />
            ),
          }}
        >{text}</ReactMarkdown>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-transparent">
      {/* Chat Header */}
      <div className="flex-shrink-0 p-4 border-b border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-gray-800/50 dark:to-gray-900/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Classic AI</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {isLoading ? 'யோசிக்கிறேன்...' : 'Ready to help'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-xs text-gray-500 dark:text-gray-400">Online</span>
          </div>
        </div>
      </div>

      {/* Conversation Context Bar */}
      {showContextBar && conversationHistory.length > 0 && (
        <div className="flex-shrink-0 px-4 py-2 bg-blue-50/50 dark:bg-blue-900/20 border-b border-blue-200/30 dark:border-blue-800/30">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <span className="text-blue-700 dark:text-blue-300">
                💬 {getConversationSummary().totalMessages} messages
              </span>
              {getConversationSummary().documentsUploaded > 0 && (
                <span className="text-green-700 dark:text-green-300">
                  📄 {getConversationSummary().documentsUploaded} documents
                </span>
              )}
              <span className="text-gray-600 dark:text-gray-400">
                🕒 Started: {getConversationSummary().sessionStarted}
              </span>
            </div>
            <button
              onClick={() => setShowContextBar(false)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              title="Hide context bar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Chat Messages */}
      <div ref={chatDisplayRef} className="flex-grow overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-transparent to-gray-50/30 dark:to-gray-900/30">
        {conversationHistory.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <MessageSquare className="w-8 h-8 text-gray-400" />
            </div>
            <div>
              <p className="text-lg font-medium text-gray-600 dark:text-gray-300 mb-2">
                Welcome to Classic AI
              </p>
              <p className="text-gray-500 dark:text-gray-400 max-w-md">
                கேள்வி கேட்கவும் அல்லது மேலே உள்ள தொடக்கங்களைத் தேர்ந்தெடுக்கவும்
              </p>
            </div>
          </div>
        )}
        
        {conversationHistory.map((entry, index) => (
          <div key={index} className={`flex ${entry.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl p-4 shadow-sm ${
              entry.role === 'user' 
                ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white ml-12' 
                : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 mr-12'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                {entry.role === 'model' && (
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                    <Bot className="w-3 h-3 text-white" />
                  </div>
                )}
                <p className={`font-semibold text-sm ${
                  entry.role === 'user' ? 'text-blue-100' : 'text-gray-900 dark:text-white'
                }`}>
                  {entry.role === 'model' ? 'Classic AI' : 'நீங்கள்'}
                </p>
              </div>
              <div className={`${entry.role === 'user' ? 'text-white' : ''}`}>
                {renderContent(entry.parts[0].text)}
                
                {/* Show detected entities as chips for AI responses */}
                {entry.role === 'model' && (
                  (() => {
                    const entities = extractEntities(entry.parts[0].text);
                    return entities.length > 0 ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {entities.map((entity, entityIndex) => (
                          <button
                            key={entityIndex}
                            onClick={() => handleEntityClick(entity)}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full text-xs font-medium hover:bg-blue-200 dark:hover:bg-blue-800 transition-all border border-blue-200 dark:border-blue-700"
                            title={entity.action}
                          >
                            {entity.type === 'customer' && <User className="w-3 h-3" />}
                            {entity.type === 'date' && <Calendar className="w-3 h-3" />}
                            {entity.type === 'amount' && <DollarSign className="w-3 h-3" />}
                            {entity.type === 'order' && <Package className="w-3 h-3" />}
                            {entity.type === 'product' && <Package className="w-3 h-3" />}
                            <span>{entity.value}</span>
                          </button>
                        ))}
                      </div>
                    ) : null;
                  })()
                )}
                
                {/* Show attachments for user messages */}
                {entry.role === 'user' && entry.attachments && entry.attachments.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {entry.attachments.map((attachment, attachIndex) => (
                      <div key={attachIndex} className="flex items-center gap-2 p-2 bg-white/10 rounded-lg">
                        {attachment.preview ? (
                          <img src={attachment.preview} alt={attachment.name} className="w-12 h-12 object-cover rounded" />
                        ) : (
                          <FileText className="w-6 h-6 text-white/70" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{attachment.name}</p>
                          <p className="text-xs opacity-70">
                            {(attachment.size / 1024).toFixed(1)} KB
                            {attachment.extractedText && (
                              <span className="ml-2 text-green-300">✓ Text extracted</span>
                            )}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {/* If this is the latest AI message and translated, show Tamil below */}
                {entry.role === 'model' && translated[index] && (
                  <div className="mt-2 p-2 rounded bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-yellow-900 dark:text-yellow-100 text-sm">
                    {renderContent(translated[index])}
                  </div>
                )}
              </div>
              {/* Quick Replies: Only show for the latest AI message, context-aware */}
              {entry.role === 'model' && index === conversationHistory.length - 1 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {getContextualSuggestions(entry.parts[0].text).map((suggestion, i) => (
                    <button
                      key={i}
                      onClick={() => handleQuickReply(suggestion)}
                      className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-200 rounded-full text-xs font-medium hover:bg-blue-100 dark:hover:bg-blue-800 transition-all border border-blue-200 dark:border-blue-800"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
              {/* Copy/Share/Export for all AI responses */}
              {entry.role === 'model' && (
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => handleCopy(entry.parts[0].text)}
                    className="flex items-center gap-1 px-2 py-1 text-xs rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200"
                    title="Copy to clipboard"
                  >
                    <Copy className="w-3 h-3" /> Copy
                  </button>
                  <button
                    onClick={() => handleShare(entry.parts[0].text)}
                    className="flex items-center gap-1 px-2 py-1 text-xs rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200"
                    title="Share"
                  >
                    <Share2 className="w-3 h-3" /> Share
                  </button>
                  <button
                    onClick={() => handleExport(entry.parts[0].text)}
                    className="flex items-center gap-1 px-2 py-1 text-xs rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200"
                    title="Download as .txt"
                  >
                    <Download className="w-3 h-3" /> Export
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="max-w-[85%] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 shadow-sm mr-12">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-6 h-6 rounded-full bg-gradient-to-br flex items-center justify-center ${
                  isComplexQuery 
                    ? 'from-purple-500 to-pink-600 animate-pulse' 
                    : 'from-blue-500 to-indigo-600'
                }`}>
                  <Bot className={`w-3 h-3 text-white ${isComplexQuery ? 'animate-spin' : 'animate-pulse'}`} />
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex space-x-1">
                    <div className={`w-2 h-2 rounded-full animate-bounce [animation-delay:-0.3s] ${
                      isComplexQuery ? 'bg-purple-500' : 'bg-blue-500'
                    }`}></div>
                    <div className={`w-2 h-2 rounded-full animate-bounce [animation-delay:-0.15s] ${
                      isComplexQuery ? 'bg-purple-500' : 'bg-blue-500'
                    }`}></div>
                    <div className={`w-2 h-2 rounded-full animate-bounce ${
                      isComplexQuery ? 'bg-purple-500' : 'bg-blue-500'
                    }`}></div>
                  </div>
                  <span className={`text-sm ${
                    isComplexQuery 
                      ? 'text-purple-600 dark:text-purple-300 font-medium' 
                      : 'text-gray-600 dark:text-gray-300'
                  }`}>
                    {isComplexQuery && thinkingSteps.length > 0 
                      ? 'Deep thinking in progress...' 
                      : (processingStage || 'AI is thinking...')
                    }
                  </span>
                </div>
              </div>
              
              {/* Complex Query Thinking Steps */}
              {isComplexQuery && thinkingSteps.length > 0 && (
                <div className="mb-4 p-3 bg-purple-50/50 dark:bg-purple-900/20 rounded-lg border border-purple-200/30 dark:border-purple-800/30">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-4 h-4 bg-purple-500 rounded-full animate-pulse"></div>
                    <span className="text-xs font-semibold text-purple-700 dark:text-purple-300">
                      Complex Analysis Mode
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {thinkingSteps.map((step, index) => (
                      <div key={index} className="flex items-center gap-2 text-xs">
                        <div className="w-3 h-3 rounded-full bg-purple-100 dark:bg-purple-900/40 border border-purple-400 flex items-center justify-center">
                          <div className="w-1 h-1 bg-purple-500 rounded-full animate-pulse"></div>
                        </div>
                        <span className="text-purple-600 dark:text-purple-200 animate-pulse">
                          {step}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Regular Tool Steps Animation */}
              {toolSteps.length > 0 && (
                <div className="space-y-2">
                  {toolSteps.map((step, index) => (
                    <div key={index} className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-green-100 dark:bg-green-900/30 border-2 border-green-500 flex items-center justify-center">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                        </div>
                        <span className="animate-pulse">{step}</span>
                      </div>
                    </div>
                  ))}
                  
                  {/* Current processing step indicator */}
                  <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-blue-100 dark:bg-blue-900/30 border-2 border-blue-500 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-spin"></div>
                      </div>
                      <span className="animate-pulse font-medium">
                        {processingStage || 'Processing your request...'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Chat Input */}
      <div className="flex-shrink-0 p-4 border-t border-gray-200/50 dark:border-gray-700/50 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
        {/* Attachments Preview */}
        {attachments.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {attachments.map((attachment, index) => (
              <div key={index} className="relative group bg-gray-100 dark:bg-gray-700 rounded-lg p-2 flex items-center gap-2 max-w-xs">
                {attachment.preview ? (
                  <img src={attachment.preview} alt={attachment.name} className="w-8 h-8 object-cover rounded" />
                ) : (
                  <FileText className="w-5 h-5 text-gray-500" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{attachment.name}</p>
                  <p className="text-xs text-gray-500">
                    {(attachment.size / 1024).toFixed(1)} KB
                    {attachment.extractedText && (
                      <span className="ml-2 text-green-600">✓ Ready for Q&A</span>
                    )}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeAttachment(index)}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="flex items-end gap-3">
          <div className="flex-grow relative">
            <Input 
              type="text" 
              value={prompt} 
              onChange={(e) => setPrompt(e.target.value)} 
              placeholder={isListening ? 'பேசுங்கள்...' : placeholderText} 
              className="pr-12 py-3 rounded-xl border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400" 
              disabled={isLoading} 
              aria-label="Ask the AI agent" 
            />
            {prompt.trim() && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              </div>
            )}
          </div>
          
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.pdf,.txt,.md,.csv,.json"
              onChange={handleFileUpload}
              className="hidden"
            />
            
            <Button 
              type="button" 
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading} 
              variant="outline" 
              className="px-3 py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
              title="Attach files"
            >
              <Paperclip className="w-5 h-5" />
            </Button>
            
            <Button 
              type="button" 
              onClick={handleVoiceInputToggle} 
              disabled={isLoading} 
              variant="outline" 
              className={`px-3 py-3 rounded-xl transition-all duration-200 ${
                isListening 
                  ? 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100' 
                  : 'hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </Button>
            
            <Button 
              type="button" 
              onClick={handleTranslate} 
              disabled={isLoading || conversationHistory.filter(e => e.role === 'model').length === 0} 
              variant="outline" 
              className="px-3 py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
            >
              <Languages className="w-5 h-5" />
            </Button>
            
            <Button 
              type="submit" 
              disabled={isLoading || !prompt.trim()} 
              className="px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
        </form>

        {error && (
          <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
            <p className="text-red-600 dark:text-red-400 text-sm text-center">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GeminiChat;
