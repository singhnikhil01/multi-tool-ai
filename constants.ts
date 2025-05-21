
import { ParaphraseMode } from './types';

export const GEMINI_MODEL_TEXT = 'gemini-2.5-flash-preview-04-17';
export const GEMINI_MODEL_CHAT = 'gemini-2.5-flash-preview-04-17';
export const GEMINI_MODEL_IMAGE_GENERATION = 'imagen-3.0-generate-002';

export const PARAPHRASE_MODES: ParaphraseMode[] = [
  { 
    value: 'standard', 
    label: 'Standard', 
    description: 'A balanced paraphrase for clarity and readability.' 
  },
  { 
    value: 'fluency', 
    label: 'Fluency', 
    description: 'Improves flow and makes text sound more natural.' 
  },
  { 
    value: 'formal', 
    label: 'Formal', 
    description: 'Rewrites text in a more professional and academic tone.' 
  },
  { 
    value: 'creative', 
    label: 'Creative', 
    description: 'Rephrases text with more vivid and imaginative language.' 
  },
  {
    value: 'shorten',
    label: 'Shorten',
    description: 'Condenses text while retaining core meaning.'
  },
  {
    value: 'expand',
    label: 'Expand',
    description: 'Elaborates on text to provide more detail or context.'
  }
];
