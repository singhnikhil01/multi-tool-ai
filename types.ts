export type ParaphraseModeValue = 'standard' | 'fluency' | 'formal' | 'creative' | 'shorten' | 'expand';

export interface ParaphraseMode {
  value: ParaphraseModeValue;
  label: string;
  description: string; // For tooltips or detailed view
}

export interface ParaphraseResult {
  paraphrasedText: string;
  originalWordCount?: number;
  newWordCount?: number;
  error?: string; // Optional error message if something went wrong but we still got partial data
}

export interface SummarizeResult {
  summaryText: string;
  error?: string;
}

export interface ImageGenerationResult {
  imageUrls: string[]; // Changed from imageUrl: string to string[]
  error?: string;
  promptUsed?: string;
}

export interface PlannerResult {
  planText: string;
  error?: string;
}

export interface ImageImprovementResult { // Renamed from ImageRestorationResult
  generatedImageUrls: string[]; // To store the new image(s)
  description?: string;         // Optional: The AI's description of the original image
  improvementSuggestion?: string; // Optional: The AI's suggestion for improvement
  error?: string;
}


// Chat Types
export interface TextPart {
  type: 'text';
  text: string;
}

export interface ImagePart {
  type: 'image';
  mimeType: string;
  data: string; // base64 encoded image data
  previewUrl?: string; // For displaying in UI before sending
}

export type ChatMessagePart = TextPart | ImagePart;

export interface WebSource {
  uri: string;
  title: string;
}

export interface ChatMessage {
  id: string; // Unique ID for each message
  role: 'user' | 'model';
  parts: ChatMessagePart[];
  timestamp: Date;
  isLoading?: boolean; // For model messages, to show spinner while streaming
  sources?: WebSource[]; // To store web search sources
}