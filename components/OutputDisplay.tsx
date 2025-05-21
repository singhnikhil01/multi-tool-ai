
import React, { useState, useEffect } from 'react';
import { Copy, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface OutputDisplayProps {
  text: string;
  isLoading: boolean;
  wordCount: number;
  title: string; // New prop for dynamic title
}

export const OutputDisplay: React.FC<OutputDisplayProps> = ({ text, isLoading, wordCount, title }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch (err) {
      console.error('Failed to copy text: ', err);
      try {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        setCopied(true);
      } catch (fallbackErr) {
        console.error('Fallback copy failed: ', fallbackErr);
        alert('Failed to copy text. Please try manually.');
      }
    }
  };

  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  return (
    <div className="bg-slate-800 p-4 sm:p-6 rounded-lg shadow-xl h-full flex flex-col">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-semibold text-gray-200">{title}</h2>
        <button
          onClick={handleCopy}
          disabled={!text || isLoading}
          className={`p-2 rounded-md transition-colors text-gray-300 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${copied ? 'bg-green-600 hover:bg-green-700' : 'bg-slate-700 hover:bg-slate-600'}`}
          aria-label={copied ? "Copied!" : `Copy ${title.toLowerCase()} to clipboard`}
          title={copied ? "Copied!" : "Copy to clipboard"}
        >
          {copied ? <Check size={18} /> : <Copy size={18} />}
        </button>
      </div>
      <textarea
        id="output-text"
        rows={12}
        className="w-full p-4 bg-slate-700 border border-slate-600 rounded-md text-gray-300 flex-grow resize-none chat-markdown-content"
        placeholder={isLoading ? `Generating ${title.toLowerCase()}...` : `Your ${title.toLowerCase()} will appear here...`}
        value={text}
        readOnly
        disabled={isLoading}
        aria-label="Output text area"
      />
       <div className="text-right text-xs text-gray-400 mt-2 pr-1">
        Word count: {wordCount}
      </div>
    </div>
  );
};
