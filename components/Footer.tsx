
import React from 'react';

interface FooterProps {
  toolName: string;
}

export const Footer: React.FC<FooterProps> = ({ toolName }) => {
  return (
    <footer className="bg-slate-800 text-center py-6 mt-auto shadow-inner border-t border-slate-700">
      <p className="text-sm text-gray-400">
        &copy; {new Date().getFullYear()} {toolName}. All rights reserved.
      </p>
      <p className="text-xs text-gray-500 mt-1">
        AI-powered features by Google Gemini. Use responsibly.
      </p>
    </footer>
  );
};
