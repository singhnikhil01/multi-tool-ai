import React from 'react';
import { Wand2, MessageCircle, NotebookText, Image as ImageIconLucide, ClipboardList, Sparkles, Paintbrush } from 'lucide-react'; 

export type ToolMode = 'paraphraser' | 'chat' | 'summarizer' | 'imageGenerator' | 'planner' | 'imageImprover'; // Changed 'imageRestoration' to 'imageImprover'

interface ToolModeSwitcherProps {
  currentMode: ToolMode;
  onModeChange: (mode: ToolMode) => void;
  disabled?: boolean;
}

const toolOptions: { value: ToolMode; label: string; icon: React.ElementType }[] = [
  { value: 'chat', label: 'Chat', icon: MessageCircle },
  { value: 'paraphraser', label: 'Paraphrase', icon: Wand2 },
  { value: 'planner', label: 'Planner', icon: ClipboardList }, 
  { value: 'summarizer', label: 'Summarize', icon: NotebookText },
  { value: 'imageGenerator', label: 'Image Gen', icon: ImageIconLucide },
  { value: 'imageImprover', label: 'Improve Image', icon: Paintbrush }, // Changed from Image Restore / Sparkles
];

export const ToolModeSwitcher: React.FC<ToolModeSwitcherProps> = ({ currentMode, onModeChange, disabled }) => {
  return (
    <div className="mb-8 p-2 bg-slate-700 rounded-lg shadow-md flex flex-wrap justify-center items-center gap-1 sm:gap-2">
      {toolOptions.map((tool) => (
        <button
          key={tool.value}
          type="button"
          onClick={() => onModeChange(tool.value)}
          disabled={disabled}
          title={`Switch to ${tool.label}`}
          className={`
            flex-1 sm:flex-initial flex items-center justify-center px-3 py-2.5 sm:px-4 text-xs sm:text-sm font-medium rounded-md transition-all duration-200 ease-in-out
            focus:outline-none focus:ring-2 focus:ring-opacity-75
            ${currentMode === tool.value
              ? 'bg-blue-600 text-white shadow-lg ring-blue-500 transform scale-105'
              : 'bg-slate-600 text-gray-300 hover:bg-slate-500 hover:text-gray-100 ring-slate-500'}
            ${disabled ? 'opacity-60 cursor-not-allowed' : ''}
          `}
        >
          <tool.icon size={18} className="mr-1.5 sm:mr-2" />
          <span className="hidden sm:inline">{tool.label}</span>
          <span className="sm:hidden">{tool.label.split(' ')[0]}</span> 
        </button>
      ))}
    </div>
  );
};