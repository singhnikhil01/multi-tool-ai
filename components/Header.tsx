
import React from 'react';
import { HelpCircle, SlidersHorizontal } from 'lucide-react'; // Changed icon

interface HeaderProps {
  onHelpClick: () => void;
  title: string;
}

export const Header: React.FC<HeaderProps> = ({ onHelpClick, title }) => {
  return (
    <header className="bg-slate-800 shadow-md py-4 px-6 sticky top-0 z-20"> {/* Increased z-index */}
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center">
          <SlidersHorizontal size={32} className="mr-3 text-blue-400" />
          <h1 className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
            {title}
          </h1>
        </div>
        <button
          onClick={onHelpClick}
          className="p-2 rounded-full hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Help"
          title="Help"
        >
          <HelpCircle size={24} className="text-gray-300" />
        </button>
      </div>
    </header>
  );
};
