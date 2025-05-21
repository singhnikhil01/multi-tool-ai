

import React from 'react';
import { X, Info, Wand2, MessageCircle, Paperclip, Mic, Send, NotebookText, Image as ImageIconLucide, ClipboardList, Paintbrush } from 'lucide-react';
import type { ToolMode } from './ToolModeSwitcher';

interface HelpModalProps {
  onClose: () => void;
  currentTool: ToolMode;
}

export const HelpModal: React.FC<HelpModalProps> = ({ onClose, currentTool }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-slate-800 p-6 sm:p-8 rounded-xl shadow-2xl max-w-3xl w-full relative max-h-[90vh] overflow-y-auto border border-slate-700 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-2 text-gray-400 hover:text-gray-200 transition-colors rounded-full hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Close help modal"
        >
          <X size={24} />
        </button>
        <div className="flex items-center mb-6">
          <Info size={28} className="mr-3 text-blue-400"/>
          <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
            App Help
          </h2>
        </div>
        
        <div className="space-y-6 text-gray-300 text-sm sm:text-base">
          <section>
            <h3 className="font-semibold text-lg text-gray-100 mb-2">Overview</h3>
            <p>This application offers several AI-powered tools: AI Chatbot, Paraphraser, AI Planner, Text Summarizer, Image Generator, and an AI Image Improver. Use the selector at the top to switch between tools.</p>
          </section>

          <section>
            <div className="flex items-center mb-2">
                <MessageCircle size={20} className="mr-2 text-green-400"/>
                <h3 className="font-semibold text-lg text-gray-100">AI Chatbot</h3>
            </div>
            <ol className="list-decimal list-inside space-y-1 pl-4">
              <li>Select "Chat" from the tool selector.</li>
              <li>Type your message in the input box at the bottom.</li>
              <li>Optionally, click the <Paperclip size={14} className="inline-block align-text-bottom"/> icon to attach an image (PNG, JPG, WEBP supported).</li>
              <li>Optionally, click the <Mic size={14} className="inline-block align-text-bottom"/> icon to use voice input (requires microphone permission). Click again to stop.</li>
              <li>Press Enter or click the <Send size={14} className="inline-block align-text-bottom"/> icon to send your message.</li>
              <li>The AI's response will appear in the chat window. The conversation history is maintained for the current session. The Chatbot can also perform web searches.</li>
            </ol>
             <p className="text-xs ml-4 mt-1 text-yellow-400">Note: The Chatbot can understand text and images you send. Voice input is converted to text.</p>
          </section>

          <section>
            <div className="flex items-center mb-2">
                <Wand2 size={20} className="mr-2 text-blue-400"/>
                <h3 className="font-semibold text-lg text-gray-100">AI Paraphraser</h3>
            </div>
            <ol className="list-decimal list-inside space-y-1 pl-4">
              <li>Select "Paraphrase" from the tool selector.</li>
              <li>Type or paste your text into the "Text to Paraphrase" box.</li>
              <li>Choose a paraphrasing mode (e.g., Standard, Fluency, Creative).</li>
              <li>Click "Paraphrase." The rewritten text appears in the "Paraphrased Text" box.</li>
            </ol>
          </section>

          <section>
            <div className="flex items-center mb-2">
                <ClipboardList size={20} className="mr-2 text-indigo-400"/>
                <h3 className="font-semibold text-lg text-gray-100">AI Planner</h3>
            </div>
            <ol className="list-decimal list-inside space-y-1 pl-4">
              <li>Select "Planner" from the tool selector.</li>
              <li>Type or paste your goal or task into the "Your Goal / Task" box (e.g., "Plan a 3-day marketing campaign").</li>
              <li>Click "Generate Plan." A step-by-step plan or outline will appear in the "Generated Plan" box.</li>
            </ol>
            <p className="text-xs ml-4 mt-1 text-yellow-400">Note: Be specific with your goal for a more detailed and relevant plan.</p>
          </section>
          
          <section>
            <div className="flex items-center mb-2">
                <NotebookText size={20} className="mr-2 text-teal-400"/>
                <h3 className="font-semibold text-lg text-gray-100">AI Text Summarizer</h3>
            </div>
            <ol className="list-decimal list-inside space-y-1 pl-4">
              <li>Select "Summarize" from the tool selector.</li>
              <li>Type or paste the text into the "Text to Summarize" box.</li>
              <li>Click "Summarize." A concise summary appears in the "Summarized Text" box.</li>
            </ol>
          </section>

          <section>
             <div className="flex items-center mb-2">
                <ImageIconLucide size={20} className="mr-2 text-pink-400"/>
                <h3 className="font-semibold text-lg text-gray-100">AI Image Generator</h3>
            </div>
            <ol className="list-decimal list-inside space-y-1 pl-4">
              <li>Select "Image Gen" from the tool selector.</li>
              <li>Type a descriptive prompt into the "Image Prompt" box (e.g., "A cat wearing a wizard hat").</li>
              <li>Click "Generate Images." Three AI-generated images will appear below.</li>
            </ol>
            <p className="text-xs ml-4 mt-1 text-yellow-400">Note: Image generation can take a few moments. Be descriptive with your prompts for best results.</p>
          </section>

          <section>
             <div className="flex items-center mb-2">
                <Paintbrush size={20} className="mr-2 text-orange-400"/>
                <h3 className="font-semibold text-lg text-gray-100">AI Image Improver</h3>
            </div>
            <ol className="list-decimal list-inside space-y-1 pl-4">
              <li>Select "Improve Image" from the tool selector.</li>
              <li>Click "Upload a file" or drag and drop an image (PNG, JPG) you want to improve.</li>
              <li>A preview of the uploaded image will appear.</li>
              <li>Click "Improve Image."</li>
              <li>The AI will first analyze your image to understand its content and suggest an enhancement. Then, it will generate a new image based on this analysis and suggestion.</li>
              <li>The newly generated, improved image will appear in the output area.</li>
            </ol>
            <p className="text-xs ml-4 mt-1 text-yellow-400"><strong>Important:</strong> This tool generates a new image inspired by your uploaded one, with AI-driven improvements or stylistic changes. It does not directly edit your original file. Results can vary.</p>
          </section>

          <section>
            <h3 className="font-semibold text-lg text-gray-100 mb-2">Important Notes</h3>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li><strong>API Key:</strong> All AI-powered features (Chat, Paraphrase, Planner, Summarize, Image Gen, Image Improver) require a Google Gemini API key.</li>
              <li><strong>Permissions:</strong> The Chatbot's voice input feature requires microphone permission.</li>
              <li><strong>Accuracy & Content:</strong> AI tools are powerful but not infallible. Always review outputs. Generated content reflects AI training and prompt interpretation.</li>
              <li><strong>Data Privacy:</strong> Text/images for AI features are sent to Google Gemini API. Review their terms. This app doesn't store your data beyond your session.</li>
              <li><strong>Purpose:</strong> These tools are for assistance and creative exploration. Use responsibly.</li>
            </ul>
          </section>
          
          <section>
            <h3 className="font-semibold text-lg text-gray-100 mb-2">Disclaimer</h3>
            <p>
              This application is provided for illustrative and assistive purposes. The quality of AI outputs can vary. Always verify critical information.
            </p>
          </section>
        </div>

        <button
            onClick={onClose}
            className="mt-8 w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-2.5 px-4 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-70"
          >
            Got it, Close!
        </button>
      </div>
    </div>
  );
};