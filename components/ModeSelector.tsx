import React from 'react';
import { ParaphraseMode, ParaphraseModeValue } from '../types';

interface ModeSelectorProps {
  modes: ParaphraseMode[];
  selectedMode: ParaphraseModeValue;
  onSelectMode: (mode: ParaphraseModeValue) => void;
  disabled?: boolean;
}

export const ModeSelector: React.FC<ModeSelectorProps> = ({ modes, selectedMode, onSelectMode, disabled }) => {
  return (
    <div className="mb-6">
      <label htmlFor="mode-select" className="block text-sm font-medium text-gray-300 mb-2">
        Select Paraphrasing Mode:
      </label>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-labelledby="mode-select-label">
        {modes.map((mode) => (
          <button
            key={mode.value}
            type="button"
            role="radio"
            aria-checked={selectedMode === mode.value}
            onClick={() => onSelectMode(mode.value)}
            disabled={disabled}
            title={mode.description}
            className={`
              px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ease-in-out
              focus:outline-none focus:ring-2 focus:ring-opacity-75
              ${selectedMode === mode.value
                ? 'bg-blue-600 text-white shadow-md ring-blue-500'
                : 'bg-slate-700 text-gray-300 hover:bg-slate-600 hover:text-gray-100 ring-slate-500'}
              ${disabled ? 'opacity-60 cursor-not-allowed' : ''}
            `}
          >
            {mode.label}
          </button>
        ))}
      </div>
    </div>
  );
};