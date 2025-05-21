
import React from 'react';

interface InputEditorProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  isLoading: boolean;
  wordCount: number;
}

export const InputEditor: React.FC<InputEditorProps> = ({ label, value, onChange, isLoading, wordCount }) => {
  return (
    <div className="bg-slate-800 p-4 sm:p-6 rounded-lg shadow-xl h-full flex flex-col">
      <label htmlFor="input-text" className="block text-lg font-semibold mb-3 text-gray-200">
        {label}
      </label>
      <textarea
        id="input-text"
        rows={12}
        className="w-full p-4 bg-slate-700 border border-slate-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-200 placeholder-gray-400 flex-grow resize-none"
        placeholder="Paste or type your text here..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={isLoading}
        aria-label={label || "Input text area"}
      />
      <div className="text-right text-xs text-gray-400 mt-2 pr-1">
        Word count: {wordCount}
      </div>
    </div>
  );
};
