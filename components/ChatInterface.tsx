
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChatMessage, ChatMessagePart, TextPart, ImagePart as AppImagePart, WebSource } from '../types';
import { Send, Paperclip, Mic, StopCircle, Image as ImageIcon, Loader2, User, Bot, Link as LinkIcon } from 'lucide-react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

interface ChatInterfaceProps {
  chatHistory: ChatMessage[];
  onSendMessage: (parts: ChatMessagePart[]) => void;
  isLoading: boolean;
  disabled?: boolean;
}

// FIX: Added Web Speech API type definitions
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}
interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult;
  length: number;
}
interface SpeechRecognitionResult {
  isFinal: boolean;
  [index: number]: SpeechRecognitionAlternative;
  length: number;
}
interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechGrammar {
  src: string;
  weight: number;
}

interface SpeechGrammarList {
  length: number;
  item(index: number): SpeechGrammar;
  addFromString(string: string, weight?: number): void;
  addFromURI(src: string, weight?: number): void;
}

type SpeechRecognitionErrorCode =
  | "no-speech"
  | "aborted"
  | "audio-capture"
  | "network"
  | "not-allowed"
  | "service-not-allowed"
  | "bad-grammar"
  | "language-not-supported";

interface SpeechRecognitionErrorEvent extends Event {
  error: SpeechRecognitionErrorCode;
  message: string;
}

interface SpeechRecognition extends EventTarget {
  grammars: SpeechGrammarList;
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  serviceURI: string; // Not standard, but often implemented

  onaudiostart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onaudioend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
  onnomatch: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onsoundstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onsoundend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onspeechstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onspeechend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;

  abort(): void;
  start(): void;
  stop(): void;
}

interface SpeechRecognitionStatic {
  new (): SpeechRecognition;
}

declare global {
  interface Window {
    SpeechRecognition: SpeechRecognitionStatic;
    webkitSpeechRecognition: SpeechRecognitionStatic;
  }
}


export const ChatInterface: React.FC<ChatInterfaceProps> = ({ chatHistory, onSendMessage, isLoading, disabled }) => {
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const speechRecognitionRef = useRef<SpeechRecognition | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [chatHistory]);

  useEffect(() => {
    // Initialize SpeechRecognition
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognitionAPI) {
      speechRecognitionRef.current = new SpeechRecognitionAPI();
      speechRecognitionRef.current.continuous = false;
      speechRecognitionRef.current.interimResults = true;
      speechRecognitionRef.current.lang = 'en-US';

      speechRecognitionRef.current.onresult = (event: Event) => {
        const speechEvent = event as SpeechRecognitionEvent;
        let interimTranscript = '';
        let finalTranscript = '';
        for (let i = speechEvent.resultIndex; i < speechEvent.results.length; ++i) {
          if (speechEvent.results[i].isFinal) {
            finalTranscript += speechEvent.results[i][0].transcript;
          } else {
            interimTranscript += speechEvent.results[i][0].transcript;
          }
        }
        setInputText(prev => finalTranscript ? prev + finalTranscript : prev + interimTranscript);
        if (finalTranscript) { 
            stopListening();
        }
      };

      speechRecognitionRef.current.onerror = (event: Event) => {
        const errorEvent = event as SpeechRecognitionErrorEvent;
        console.error('Speech recognition error:', errorEvent.error);
        setIsListening(false);
      };

      speechRecognitionRef.current.onend = () => {
        if(speechRecognitionRef.current && speechRecognitionRef.current.continuous === false && !isListening) {
        } else {
            setIsListening(false);
        }
      };
    } else {
      console.warn('SpeechRecognition API not supported in this browser.');
    }

    return () => {
      if (speechRecognitionRef.current) {
        speechRecognitionRef.current.abort();
      }
    };
  }, []);


  const startListening = () => {
    if (speechRecognitionRef.current && !isListening) {
      try {
        speechRecognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        console.error("Error starting speech recognition:", e);
        setIsListening(false);
      }
    }
  };

  const stopListening = () => {
    if (speechRecognitionRef.current && isListening) {
      speechRecognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const handleMicClick = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };
  
  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      if (file.size > 4 * 1024 * 1024) { 
        alert("Image size should not exceed 4MB.");
        return;
      }
      setSelectedImage(file);
      setImagePreviewUrl(URL.createObjectURL(file));
    }
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve((reader.result as string).split(',')[1]); 
      reader.onerror = error => reject(error);
    });
  };

  const handleSend = async () => {
    const textPart: TextPart | null = inputText.trim() ? { type: 'text', text: inputText.trim() } : null;
    let imagePart: AppImagePart | null = null;

    if (selectedImage) {
      try {
        const base64Data = await convertFileToBase64(selectedImage);
        imagePart = {
          type: 'image',
          mimeType: selectedImage.type,
          data: base64Data,
          previewUrl: imagePreviewUrl || undefined
        };
      } catch (error) {
        console.error("Error converting image to base64:", error);
        alert("Failed to process image.");
        return;
      }
    }

    const parts: ChatMessagePart[] = [];
    if (imagePart) parts.push(imagePart);
    if (textPart) parts.push(textPart);


    if (parts.length > 0) {
      onSendMessage(parts);
      setInputText('');
      setSelectedImage(null);
      setImagePreviewUrl(null);
      if (fileInputRef.current) fileInputRef.current.value = ""; 
    }
  };
  
  const handleKeyPress = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreviewUrl(null);
    if(fileInputRef.current) fileInputRef.current.value = "";
  }

  const renderSources = (sources: WebSource[]) => {
    if (!sources || sources.length === 0) return null;
    return (
      <div className="mt-2 pt-2 border-t border-slate-600">
        <h4 className="text-xs font-semibold text-gray-400 mb-1">Sources:</h4>
        <ul className="space-y-1">
          {sources.map((source, idx) => (
            <li key={idx} className="text-xs">
              <a
                href={source.uri}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center text-blue-400 hover:text-blue-300 hover:underline break-all"
                title={source.uri}
              >
                <LinkIcon size={12} className="mr-1.5 flex-shrink-0" />
                <span className="truncate">{source.title || source.uri}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] max-h-[700px] bg-slate-800 shadow-xl rounded-lg">
      {/* Message Display Area */}
      <div className="flex-grow p-4 sm:p-6 space-y-4 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-700">
        {chatHistory.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs md:max-w-md lg:max-w-lg p-3 rounded-xl shadow ${
                msg.role === 'user' 
                ? 'bg-blue-600 text-white rounded-br-none' 
                : 'bg-slate-700 text-gray-200 rounded-bl-none'
            }`}>
              <div className="flex items-start mb-1">
                {msg.role === 'model' && <Bot size={18} className="mr-2 text-purple-400 flex-shrink-0" />}
                {msg.role === 'user' && <User size={18} className="mr-2 text-blue-300 flex-shrink-0" />}
                <span className="text-xs font-medium opacity-80">
                    {msg.role === 'model' ? 'AI Assistant' : 'You'}
                </span>
              </div>
              {msg.parts.map((part, index) => {
                if (part.type === 'text') {
                  if (msg.role === 'model') {
                    const rawHtml = marked.parse(part.text, { breaks: true, gfm: true });
                    const cleanHtml = DOMPurify.sanitize(rawHtml as string); 
                    return (
                      <div
                        key={index}
                        className="text-sm chat-markdown-content text-gray-200" 
                        dangerouslySetInnerHTML={{ __html: cleanHtml }}
                      />
                    );
                  } else {
                    return (
                      <p key={index} className="whitespace-pre-wrap break-words text-sm">
                        {part.text}
                      </p>
                    );
                  }
                }
                if (part.type === 'image' && part.previewUrl) {
                  return <img key={index} src={part.previewUrl} alt="User upload" className="max-w-full h-auto rounded-lg my-2 max-h-60" />;
                }
                return null;
              })}
              {msg.isLoading && msg.role === 'model' && (
                 <div className="flex items-center text-xs mt-1 text-gray-400">
                    <Loader2 size={14} className="animate-spin mr-1.5" /> Thinking...
                 </div>
              )}
              {msg.role === 'model' && msg.sources && renderSources(msg.sources)}
              <p className="text-xs opacity-60 mt-1.5 text-right">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-slate-700 p-3 sm:p-4 bg-slate-800 rounded-b-lg">
        {imagePreviewUrl && (
          <div className="mb-2 p-2 border border-slate-600 rounded-md relative bg-slate-700 max-w-xs">
            <img src={imagePreviewUrl} alt="Preview" className="max-h-24 w-auto rounded" />
            <button 
                onClick={removeImage}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 focus:outline-none"
                aria-label="Remove image"
            >
                <StopCircle size={16} />
            </button>
          </div>
        )}
        <div className="flex items-center space-x-2">
          <button 
            title="Attach image"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-gray-400 hover:text-blue-400 transition-colors rounded-full hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            disabled={isLoading || disabled}
            aria-label="Attach image"
          >
            <Paperclip size={20} />
          </button>
          <input 
            type="file" 
            ref={fileInputRef}
            accept="image/png, image/jpeg, image/webp, image/gif" 
            onChange={handleImageChange} 
            className="hidden" 
            aria-label="Image upload"
          />
          <button 
            title={isListening ? "Stop listening" : "Use microphone"}
            onClick={handleMicClick}
            className={`p-2 text-gray-400 transition-colors rounded-full hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 ${isListening ? 'text-red-500 animate-pulse' : 'hover:text-green-400'}`}
            disabled={isLoading || disabled || !speechRecognitionRef.current}
            aria-label={isListening ? "Stop voice input" : "Start voice input"}
          >
            {isListening ? <StopCircle size={20} /> : <Mic size={20} />}
          </button>
          <textarea
            rows={1}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={isListening ? "Listening..." : "Type a message or upload an image..."}
            className="flex-grow p-2.5 bg-slate-700 border border-slate-600 rounded-lg text-gray-200 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none scrollbar-thin scrollbar-thumb-slate-500 scrollbar-track-slate-700"
            disabled={isLoading || disabled}
            aria-label="Chat message input"
          />
          <button 
            onClick={handleSend} 
            disabled={isLoading || disabled || (inputText.trim() === '' && !selectedImage)}
            className="p-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            aria-label="Send message"
          >
            {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
          </button>
        </div>
      </div>
    </div>
  );
};