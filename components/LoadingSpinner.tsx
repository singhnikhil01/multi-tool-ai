import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  message?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ message = "Loading, please wait..." }) => {
  return (
    <div className="flex flex-col items-center justify-center my-10 p-8 bg-slate-800/70 rounded-lg shadow-xl">
      <Loader2 size={48} className="text-blue-500 animate-spin mb-4" />
      <p className="text-xl font-semibold text-gray-300">{message}</p>
      <p className="text-sm text-gray-400 mt-2">This might take a few moments.</p>
    </div>
  );
};