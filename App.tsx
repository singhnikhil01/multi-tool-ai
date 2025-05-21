


import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { InputEditor } from './components/InputEditor';
import { OutputDisplay } from './components/OutputDisplay';
import { ModeSelector as ParaphraseModeSelector } from './components/ModeSelector';
import { LoadingSpinner } from './components/LoadingSpinner';
import { HelpModal } from './components/HelpModal';
import { ToolModeSwitcher, ToolMode } from './components/ToolModeSwitcher';
import { ChatInterface } from './components/ChatInterface';
import { 
  paraphraseText, 
  summarizeText,
  generatePlan,
  generateImageFromPrompt,
  initializeChatSession,
  sendChatMessageStream,
  generateImprovedImage, 
} from './services/geminiService';
import { 
  ParaphraseModeValue, 
  ParaphraseResult, 
  SummarizeResult,
  PlannerResult,
  ImageGenerationResult,
  ImageImprovementResult,
  ChatMessage,
  ChatMessagePart, 
  WebSource,
} from './types';
import { PARAPHRASE_MODES } from './constants';
import { Wand2, AlertTriangle, NotebookText, Image as ImageIconLucide, Palette, ClipboardList, UploadCloud, XCircle, Paintbrush } from 'lucide-react';
// Align import style for Chat type with services/geminiService.ts
import { Chat } from '@google/genai';
import { countWords } from './utils/textUtils';


const App: React.FC = () => {
  const [currentToolMode, setCurrentToolMode] = useState<ToolMode>('chat');
  const [inputText, setInputText] = useState<string>(''); // For paraphraser, summarizer
  const [outputText, setOutputText] = useState<string>(''); // For paraphraser
  const [summaryText, setSummaryText] = useState<string>(''); // For summarizer
  
  const [plannerGoal, setPlannerGoal] = useState<string>('');
  const [plannerOutputText, setPlannerOutputText] = useState<string>('');
  const [plannerGoalWordCount, setPlannerGoalWordCount] = useState<number>(0);
  const [plannerOutputWordCount, setPlannerOutputWordCount] = useState<number>(0);

  const [selectedParaphraseMode, setSelectedParaphraseMode] = useState<ParaphraseModeValue>(PARAPHRASE_MODES[0].value);
  
  const [imagePrompt, setImagePrompt] = useState<string>('');
  const [generatedImageUrls, setGeneratedImageUrls] = useState<string[]>([]);
  const [isImageLoading, setIsImageLoading] = useState<boolean>(false);

  // AI Image Improver State
  const [improvementImageFile, setImprovementImageFile] = useState<File | null>(null);
  const [improvementImagePreviewUrl, setImprovementImagePreviewUrl] = useState<string | null>(null);
  const [improvedImageResult, setImprovedImageResult] = useState<ImageImprovementResult | null>(null);
  const [isImprovingImage, setIsImprovingImage] = useState<boolean>(false);


  const [isLoading, setIsLoading] = useState<boolean>(false); 
  const [error, setError] = useState<string | null>(null);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState<boolean>(false);
  const [apiKeyStatus, setApiKeyStatus] = useState<string>('');
  const [inputWordCount, setInputWordCount] = useState<number>(0);
  const [outputWordCount, setOutputWordCount] = useState<number>(0);
  const [summaryWordCount, setSummaryWordCount] = useState<number>(0);

  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);
  const chatSessionRef = useRef<Chat | null>(null);
  const previousToolModeRef = useRef<ToolMode | undefined>(undefined);

  const apiKeyExists = !!process.env.API_KEY;

  useEffect(() => {
    if (!apiKeyExists) {
        const msg = 'API_KEY environment variable is not set. AI-powered features will not be available.';
        setApiKeyStatus(msg);
        if (['paraphraser', 'chat', 'summarizer', 'imageGenerator', 'planner', 'imageImprover'].includes(currentToolMode)) {
            setError(msg + ' Please configure it and refresh.');
        }
    } else {
        setApiKeyStatus('API_KEY detected. AI features should be operational.');
        if (error && error.includes('API_KEY')) { 
            setError(null);
        }
    }

    if (apiKeyExists && currentToolMode === 'chat') {
        if (!chatSessionRef.current) {
            try {
                // FIX: initializeChatSession expects an API key argument.
                chatSessionRef.current = initializeChatSession(process.env.API_KEY as string);
                if (error && error.startsWith('Failed to initialize chat')) {
                    setError(null);
                }
            } catch (e: any) {
                const chatInitError = `Failed to initialize chat: ${e.message}`;
                setError(chatInitError);
                console.error("Chat initialization error:", e);
            }
        }
    }

    const toolModeActuallyChanged = previousToolModeRef.current !== undefined && previousToolModeRef.current !== currentToolMode;
    
    if (toolModeActuallyChanged) {
        setError(null); 
        setInputText('');
        setOutputText('');
        setSummaryText('');
        setPlannerGoal('');
        setPlannerOutputText('');
        setImagePrompt('');
        setGeneratedImageUrls([]);
        
        setImprovementImageFile(null);
        if (improvementImagePreviewUrl) URL.revokeObjectURL(improvementImagePreviewUrl);
        setImprovementImagePreviewUrl(null);
        setImprovedImageResult(null);
        
        setInputWordCount(0);
        setOutputWordCount(0);
        setSummaryWordCount(0);
        setPlannerGoalWordCount(0);
        setPlannerOutputWordCount(0);

        setIsLoading(false);
        setIsImageLoading(false);
        setIsImprovingImage(false);
    }
    
    previousToolModeRef.current = currentToolMode;

  }, [currentToolMode, apiKeyExists, error, improvementImagePreviewUrl]); 


  useEffect(() => {
    if (currentToolMode === 'paraphraser' || currentToolMode === 'summarizer') {
      setInputWordCount(countWords(inputText));
    }
    if (currentToolMode === 'planner') {
      setPlannerGoalWordCount(countWords(plannerGoal));
    }
  }, [inputText, plannerGoal, currentToolMode]);

  useEffect(() => { setOutputWordCount(countWords(outputText)); }, [outputText]);
  useEffect(() => { setSummaryWordCount(countWords(summaryText)); }, [summaryText]);
  useEffect(() => { setPlannerOutputWordCount(countWords(plannerOutputText)); }, [plannerOutputText]);


  // Cleanup object URLs
  useEffect(() => {
    const urlToRevoke = improvementImagePreviewUrl;
    return () => {
      if (urlToRevoke) {
        URL.revokeObjectURL(urlToRevoke);
      }
    };
  }, [improvementImagePreviewUrl]);


  const handleParaphrase = useCallback(async () => {
    if (currentToolMode !== 'paraphraser') return;
    if (!inputText.trim()) { setError('Please enter some text to paraphrase.'); return; }
    if (!apiKeyExists) { setError('Gemini API Key is missing. Cannot perform paraphrasing.'); return; }
    setIsLoading(true); setError(null); setOutputText('');
    try {
      const result: ParaphraseResult = await paraphraseText(inputText, selectedParaphraseMode);
      setOutputText(result.paraphrasedText);
      if (result.error) setError(`Paraphrasing partially succeeded: ${result.error}`);
    } catch (e: any) {
      console.error("Paraphrasing error:", e);
      setError(e.message || 'An unknown error during paraphrasing.');
      setOutputText('');
    } finally { setIsLoading(false); }
  }, [inputText, selectedParaphraseMode, apiKeyExists, currentToolMode]);

  const handleSummarize = useCallback(async () => {
    if (currentToolMode !== 'summarizer') return;
    if (!inputText.trim()) { setError('Please enter some text to summarize.'); return; }
    if (!apiKeyExists) { setError('Gemini API Key is missing. Cannot perform summarization.'); return; }
    setIsLoading(true); setError(null); setSummaryText('');
    try {
      const result: SummarizeResult = await summarizeText(inputText);
      setSummaryText(result.summaryText);
      if (result.error) setError(`Summarization partially succeeded: ${result.error}`);
    } catch (e: any) {
      console.error("Summarization error:", e);
      setError(e.message || 'An unknown error during summarization.');
      setSummaryText('');
    } finally { setIsLoading(false); }
  }, [inputText, apiKeyExists, currentToolMode]);
  
  const handleGeneratePlan = useCallback(async () => {
    if (currentToolMode !== 'planner') return;
    if (!plannerGoal.trim()) { setError('Please enter a goal or task to plan.'); return; }
    if (!apiKeyExists) { setError('Gemini API Key is missing. Cannot generate a plan.'); return; }
    setIsLoading(true); setError(null); setPlannerOutputText('');
    try {
      const result: PlannerResult = await generatePlan(plannerGoal);
      setPlannerOutputText(result.planText);
      if (result.error) setError(`Plan generation partially succeeded: ${result.error}`);
    } catch (e: any) {
      console.error("Planning error:", e);
      setError(e.message || 'An unknown error during plan generation.');
      setPlannerOutputText('');
    } finally { setIsLoading(false); }
  }, [plannerGoal, apiKeyExists, currentToolMode]);

  const handleGenerateImage = useCallback(async () => {
    if (currentToolMode !== 'imageGenerator') return;
    if (!imagePrompt.trim()) { setError('Please enter a prompt to generate an image.'); return; }
    if (!apiKeyExists) { setError('Gemini API Key is missing. Cannot perform image generation.'); return; }
    setIsImageLoading(true); setError(null); setGeneratedImageUrls([]); 
    try {
      const result: ImageGenerationResult = await generateImageFromPrompt(imagePrompt);
      if (result.imageUrls && result.imageUrls.length > 0) {
        setGeneratedImageUrls(result.imageUrls);
        console.log(result, result.imageUrls);
      } else { throw new Error("Image generation succeeded but returned no images."); }
      if (result.error) setError(`Image generation issue: ${result.error}`);
    } catch (e: any) {
      console.error("Image generation error in App.tsx:", e);
      setError(e.message || 'An unknown error during image generation.');
      setGeneratedImageUrls([]); 
    } finally { setIsImageLoading(false); }
  }, [imagePrompt, apiKeyExists, currentToolMode]);

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = error => reject(error);
    });
  };

  const handleImprovementImageFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      if (!['image/png', 'image/jpeg'].includes(file.type)) {
        setError("Invalid file type. Please select a PNG or JPG image.");
        return;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError("Image size should not exceed 5MB.");
        return;
      }
      setImprovementImageFile(file);
      if (improvementImagePreviewUrl) {
        URL.revokeObjectURL(improvementImagePreviewUrl);
      }
      setImprovementImagePreviewUrl(URL.createObjectURL(file));
      setImprovedImageResult(null); // Clear previous results
      setError(null);
    }
  };

  const handleGenerateImprovedImage = useCallback(async () => {
    if (currentToolMode !== 'imageImprover' || !improvementImageFile) {
      setError("Please upload an image to improve.");
      return;
    }
    if (!apiKeyExists) {
      setError('Gemini API Key is missing. Cannot improve image.');
      return;
    }
    setIsImprovingImage(true);
    setError(null);
    setImprovedImageResult(null);

    try {
      const base64Data = await convertFileToBase64(improvementImageFile);
      const result: ImageImprovementResult = await generateImprovedImage(base64Data, improvementImageFile.type);
      setImprovedImageResult(result);
      if (result.error) setError(`Image improvement process issue: ${result.error}`);
      if (!result.generatedImageUrls || result.generatedImageUrls.length === 0 && !result.error) {
        setError("Image improvement process completed but no image was generated.");
      }
    } catch (e: any) {
      console.error("Image improvement error:", e);
      setError(e.message || 'An unknown error occurred while improving the image.');
      setImprovedImageResult(null);
    } finally {
      setIsImprovingImage(false);
    }
  }, [improvementImageFile, apiKeyExists, currentToolMode]);


  const handleSendChatMessage = useCallback(async (messageParts: ChatMessagePart[]) => {
    if (!apiKeyExists || !chatSessionRef.current) {
      setError('Chat not available. API key or session missing.');
      return;
    }
    if (messageParts.every(part => part.type === 'text' && !part.text.trim()) && messageParts.filter(part => part.type === 'image').length === 0) {
      return;
    }
    const userMessageId = `user-${Date.now()}`;
    const userMessage: ChatMessage = { id: userMessageId, role: 'user', parts: messageParts, timestamp: new Date() };
    setChatHistory(prev => [...prev, userMessage]);
    setIsChatLoading(true); setError(null);
    const modelMessageId = `model-${Date.now()}`;
    const modelMessagePlaceholder: ChatMessage = { id: modelMessageId, role: 'model', parts: [{ type: 'text', text: '' }], timestamp: new Date(), isLoading: true, sources: [] };
    setChatHistory(prev => [...prev, modelMessagePlaceholder]);
    const apiParts = messageParts.map(part => {
      if (part.type === 'text') return part.text;
      if (part.type === 'image') return { inlineData: { mimeType: part.mimeType, data: part.data } };
      return null; 
    }).filter(Boolean) as (string | {inlineData: {mimeType: string; data: string}} )[];
    try {
      if (!chatSessionRef.current) { throw new Error("Chat session became unavailable."); }
      const stream = await sendChatMessageStream(chatSessionRef.current, apiParts);
      let currentText = ''; let allSources: WebSource[] = [];
      for await (const chunk of stream) {
        currentText += chunk.text;
        const groundingMeta = chunk.candidates?.[0]?.groundingMetadata;
        if (groundingMeta?.groundingChunks?.length) {
          groundingMeta.groundingChunks.forEach(gc => {
            if (gc.web?.uri && gc.web?.title && !allSources.some(s => s.uri === gc.web.uri)) {
              allSources.push({ title: gc.web.title, uri: gc.web.uri });
            }
          });
        }
        setChatHistory(prev => prev.map(msg => msg.id === modelMessageId ? { ...msg, parts: [{ type: 'text', text: currentText }], sources: allSources.length > 0 ? [...allSources] : undefined, isLoading: true } : msg));
      }
      setChatHistory(prev => prev.map(msg => msg.id === modelMessageId ? { ...msg, parts: [{ type: 'text', text: currentText }], sources: allSources.length > 0 ? [...allSources] : undefined, isLoading: false, timestamp: new Date() } : msg));
    } catch (e: any) {
      console.error("Chat error:", e);
      const chatErrorMessage = e.message || 'Unknown chat error.';
      setError(chatErrorMessage);
      setChatHistory(prev => prev.map(msg => msg.id === modelMessageId ? { ...msg, parts: [{ type: 'text', text: `Error: ${chatErrorMessage}` }], isLoading: false, sources: undefined } : msg));
    } finally { setIsChatLoading(false); }
  }, [apiKeyExists]); 

  const handleInputChange = (value: string) => { setInputText(value); if (error?.startsWith('Please enter some text')) setError(null); };
  const handlePlannerGoalChange = (value: string) => { setPlannerGoal(value); if (error?.startsWith('Please enter a goal')) setError(null); };
  const handleImagePromptChange = (value: string) => { setImagePrompt(value); if (error?.startsWith('Please enter a prompt')) setError(null); }

  const isParaphraseDisabled = isLoading || !inputText.trim() || !apiKeyExists;
  const isSummarizeDisabled = isLoading || !inputText.trim() || !apiKeyExists;
  const isPlannerDisabled = isLoading || !plannerGoal.trim() || !apiKeyExists;
  const isImageGenerateDisabled = isImageLoading || !imagePrompt.trim() || !apiKeyExists;
  const isGenerateImprovedImageDisabled = isImprovingImage || !improvementImageFile || !apiKeyExists;
  
  const getInputLabel = () => {
    switch(currentToolMode) {
      case 'paraphraser': return 'Text to Paraphrase';
      case 'summarizer': return 'Text to Summarize';
      default: return 'Your Text';
    }
  };
  
  const commonButtonClasses = "mt-2 w-full flex items-center justify-center text-white font-semibold py-3 px-6 rounded-md transition-all duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-opacity-75 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none";
  const paraphraseButtonClasses = `${commonButtonClasses} bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 focus:ring-purple-500`;
  const summarizeButtonClasses = `${commonButtonClasses} bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 focus:ring-teal-500`;
  const plannerButtonClasses = `${commonButtonClasses} bg-gradient-to-r from-indigo-500 to-sky-600 hover:from-indigo-600 hover:to-sky-700 focus:ring-sky-500`;
  const imageGenerateButtonClasses = `${commonButtonClasses} bg-gradient-to-r from-pink-500 to-red-600 hover:from-pink-600 hover:to-red-700 focus:ring-red-500`;
  const imageImproveButtonClasses = `${commonButtonClasses} bg-gradient-to-r from-orange-500 to-yellow-600 hover:from-orange-600 hover:to-yellow-700 focus:ring-yellow-500`; // New style
  
  const renderLoadingIcon = (text = "Loading...") => (
    <>
      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      {text}
    </>
  );

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-900 to-slate-700 text-gray-100 font-sans">
      <Header onHelpClick={() => setIsHelpModalOpen(true)} title={
          currentToolMode === 'chat' ? "AI Chatbot" :
          currentToolMode === 'paraphraser' ? "AI Paraphraser" :
          currentToolMode === 'summarizer' ? "AI Text Summarizer" :
          currentToolMode === 'planner' ? "AI Planner" :
          currentToolMode === 'imageGenerator' ? "AI Image Generator" :
          currentToolMode === 'imageImprover' ? "AI Image Improver" :
          "Multi-Tool AI Assistant"
        } />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <ToolModeSwitcher currentMode={currentToolMode} onModeChange={setCurrentToolMode} disabled={isLoading || isChatLoading || isImageLoading || isImprovingImage} />

        {apiKeyStatus && (!error || (error && !error.includes("API_KEY") && !error.startsWith('Failed to initialize chat'))) && (
          <p className={`text-xs text-center mb-3 ${apiKeyExists ? 'text-green-400' : 'text-red-400'}`}>
            {apiKeyStatus}
          </p>
        )}

        {error && (
          <div className="bg-red-500 bg-opacity-80 border border-red-700 text-white p-3 rounded-md mb-6 shadow-lg flex items-center">
            <AlertTriangle size={20} className="mr-2 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        
        {currentToolMode !== 'chat' && (
          <div className="bg-slate-800 p-4 sm:p-6 rounded-lg shadow-xl mb-8">
            {currentToolMode === 'paraphraser' && (
              <>
                <ParaphraseModeSelector modes={PARAPHRASE_MODES} selectedMode={selectedParaphraseMode} onSelectMode={(mode) => setSelectedParaphraseMode(mode as ParaphraseModeValue)} disabled={isLoading} />
                <button onClick={handleParaphrase} disabled={isParaphraseDisabled} className={paraphraseButtonClasses} aria-label="Paraphrase text">
                  {isLoading ? renderLoadingIcon("Paraphrasing...") : <><Wand2 size={20} className="mr-2" /> Paraphrase</>}
                </button>
                {(isParaphraseDisabled && !isLoading && !apiKeyExists) && (<p className="text-xs text-yellow-400 mt-2 text-center">Paraphrase button disabled. API key required.</p>)}
              </>
            )}
            {currentToolMode === 'summarizer' && (
              <>
                <button onClick={handleSummarize} disabled={isSummarizeDisabled} className={summarizeButtonClasses} aria-label="Summarize text">
                  {isLoading ? renderLoadingIcon("Summarizing...") : <><NotebookText size={20} className="mr-2" /> Summarize</>}
                </button>
                {(isSummarizeDisabled && !isLoading && !apiKeyExists) && (<p className="text-xs text-yellow-400 mt-2 text-center">Summarize button disabled. API key required.</p>)}
              </>
            )}
             {currentToolMode === 'planner' && (
              <>
                <button onClick={handleGeneratePlan} disabled={isPlannerDisabled} className={plannerButtonClasses} aria-label="Generate plan">
                  {isLoading ? renderLoadingIcon("Generating Plan...") : <><ClipboardList size={20} className="mr-2" /> Generate Plan</>}
                </button>
                {(isPlannerDisabled && !isLoading && !apiKeyExists) && (<p className="text-xs text-yellow-400 mt-2 text-center">Planner button disabled. API key required.</p>)}
              </>
            )}
            {currentToolMode === 'imageGenerator' && (
              <>
                <button onClick={handleGenerateImage} disabled={isImageGenerateDisabled} className={imageGenerateButtonClasses} aria-label="Generate image">
                  {isImageLoading ? renderLoadingIcon("Generating Images...") : <><Palette size={20} className="mr-2" /> Generate Images</>}
                </button>
                {(isImageGenerateDisabled && !isImageLoading && !apiKeyExists) && (<p className="text-xs text-yellow-400 mt-2 text-center">Image Generation button disabled. API key required.</p>)}
              </>
            )}
            {currentToolMode === 'imageImprover' && (
              <>
                <button onClick={handleGenerateImprovedImage} disabled={isGenerateImprovedImageDisabled} className={imageImproveButtonClasses} aria-label="Generate improved image">
                  {isImprovingImage ? renderLoadingIcon("Improving Image...") : <><Paintbrush size={20} className="mr-2" /> Improve Image</>}
                </button>
                {(!improvementImageFile && !isImprovingImage) && (<p className="text-xs text-gray-400 mt-2 text-center">Upload an image below to improve.</p>)}
                {(isGenerateImprovedImageDisabled && !isImprovingImage && !apiKeyExists) && (<p className="text-xs text-yellow-400 mt-2 text-center">Image Improver disabled. API key required.</p>)}
              </>
            )}
          </div>
        )}
        
        {currentToolMode === 'paraphraser' || currentToolMode === 'summarizer' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputEditor label={getInputLabel()} value={inputText} onChange={handleInputChange} isLoading={isLoading} wordCount={inputWordCount} />
              {currentToolMode === 'paraphraser' && (<OutputDisplay text={outputText} isLoading={isLoading} wordCount={outputWordCount} title="Paraphrased Text" />)}
              {currentToolMode === 'summarizer' && (<OutputDisplay text={summaryText} isLoading={isLoading} wordCount={summaryWordCount} title="Summarized Text" />)}
            </div>
        ) : currentToolMode === 'planner' ? (
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-800 p-4 sm:p-6 rounded-lg shadow-xl h-full flex flex-col">
                <label htmlFor="planner-goal-input" className="block text-lg font-semibold mb-3 text-gray-200">Your Goal / Task</label>
                <textarea id="planner-goal-input" rows={12} className="w-full p-4 bg-slate-700 border border-slate-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-200 placeholder-gray-400 flex-grow resize-none" placeholder="e.g., 'Plan a week-long trip to Tokyo'..." value={plannerGoal} onChange={(e) => handlePlannerGoalChange(e.target.value)} disabled={isLoading} aria-label="Planner goal input" />
                <div className="text-right text-xs text-gray-400 mt-2 pr-1">Word count: {plannerGoalWordCount}</div>
              </div>
              <OutputDisplay text={plannerOutputText} isLoading={isLoading} wordCount={plannerOutputWordCount} title="Generated Plan" />
           </div>
        ) : currentToolMode === 'imageGenerator' ? (
           <div className="flex flex-col items-center gap-6">
              <div className="w-full max-w-xl bg-slate-800 p-4 sm:p-6 rounded-lg shadow-xl">
                <label htmlFor="image-prompt-input" className="block text-lg font-semibold mb-3 text-gray-200">Image Prompt</label>
                <textarea id="image-prompt-input" rows={3} className="w-full p-4 bg-slate-700 border border-slate-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-200 placeholder-gray-400 resize-y" placeholder="Describe the image..." value={imagePrompt} onChange={(e) => handleImagePromptChange(e.target.value)} disabled={isImageLoading} aria-label="Image generation prompt" />
              </div>
              {isImageLoading && (<LoadingSpinner message="Generating your images..." />)}
              {generatedImageUrls.length > 0 && !isImageLoading && (
                <div className="mt-6 p-4 bg-slate-800 rounded-lg shadow-xl w-full">
                    <h3 className="text-xl font-semibold text-gray-100 mb-4 text-center">Generated Images</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {generatedImageUrls.map((url, index) => ( <div key={index} className="bg-slate-700 p-2 rounded-md shadow-md"><img src={url} alt={`Generated by AI ${index + 1}`} className="rounded-md w-full h-auto object-contain aspect-square" /></div> ))}
                    </div>
                    <p className="text-xs text-gray-400 mt-4 italic text-center">Prompt: "{imagePrompt}"</p>
                </div>
              )}
           </div>
        ) : currentToolMode === 'imageImprover' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Input Column */}
            <div className="bg-slate-800 p-4 sm:p-6 rounded-lg shadow-xl h-full flex flex-col items-center">
              <label htmlFor="improvement-image-upload" className="block text-lg font-semibold mb-3 text-gray-200 self-start">Upload Image to Improve (PNG, JPG)</label>
              <div className="w-full mt-2 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-600 border-dashed rounded-md bg-slate-700 hover:border-blue-500 transition-colors">
                <div className="space-y-1 text-center">
                  <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-400">
                    <label htmlFor="improvement-image-upload-input" className="relative cursor-pointer bg-slate-700 rounded-md font-medium text-blue-400 hover:text-blue-300 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-offset-slate-800 focus-within:ring-blue-500">
                      <span>Upload a file</span>
                      <input id="improvement-image-upload-input" name="improvement-image-upload-input" type="file" className="sr-only" accept="image/png, image/jpeg" onChange={handleImprovementImageFileChange} disabled={isImprovingImage} />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">PNG, JPG up to 5MB.</p>
                </div>
              </div>
              {improvementImagePreviewUrl && (
                <div className="mt-4 p-2 border border-slate-600 rounded-md bg-slate-700 relative max-w-xs w-full">
                  <h4 className="text-sm font-medium text-gray-300 mb-1 text-center">Original Image:</h4>
                  <img src={improvementImagePreviewUrl} alt="Image to improve" className="max-h-48 w-auto rounded mx-auto shadow" />
                  <button 
                      onClick={() => {
                        setImprovementImageFile(null);
                        if(improvementImagePreviewUrl) URL.revokeObjectURL(improvementImagePreviewUrl);
                        setImprovementImagePreviewUrl(null);
                        setImprovedImageResult(null);
                        const inputEl = document.getElementById('improvement-image-upload-input') as HTMLInputElement;
                        if(inputEl) inputEl.value = "";
                      }}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 focus:outline-none"
                      aria-label="Remove image"
                      title="Remove image"
                      disabled={isImprovingImage}
                  >
                      <XCircle size={16} />
                  </button>
                </div>
              )}
            </div>
            {/* Output Column */}
            <div className="bg-slate-800 p-4 sm:p-6 rounded-lg shadow-xl h-full flex flex-col items-center justify-center">
              {isImprovingImage && <LoadingSpinner message="Generating improved image..." />}
              {!isImprovingImage && improvedImageResult?.generatedImageUrls?.[0] && (
                <div className="w-full">
                  <h3 className="text-xl font-semibold text-gray-100 mb-4 text-center">Improved Image</h3>
                  <div className="bg-slate-700 p-2 rounded-md shadow-md">
                    <img src={improvedImageResult.generatedImageUrls[0]} alt="AI Improved Image" className="rounded-md w-full h-auto object-contain aspect-square" />
                  </div>
                  {improvedImageResult.description && improvedImageResult.improvementSuggestion && (
                    <p className="text-xs text-gray-400 mt-3 italic text-center">
                      Based on: "{improvedImageResult.description}" with suggestion: "{improvedImageResult.improvementSuggestion}".
                    </p>
                  )}
                </div>
              )}
              {!isImprovingImage && improvedImageResult && (!improvedImageResult.generatedImageUrls || improvedImageResult.generatedImageUrls.length === 0) && !improvedImageResult.error && (
                 <p className="text-gray-300">Could not generate an improved image. Try a different image or adjust prompt if applicable.</p>
              )}
               {!isImprovingImage && !improvedImageResult && !improvementImageFile && (
                <div className="text-center text-gray-400">
                  <Paintbrush size={48} className="mx-auto mb-2" />
                  <p>Upload an image and click "Improve Image" to see the magic!</p>
                </div>
              )}
            </div>
          </div>
        ) : null}
        
        {currentToolMode === 'chat' && (
          <ChatInterface chatHistory={chatHistory} onSendMessage={handleSendChatMessage} isLoading={isChatLoading} disabled={!apiKeyExists || !chatSessionRef.current || !!(error && error.startsWith('Failed to initialize chat'))} />
        )}
        {currentToolMode === 'chat' && !apiKeyExists && !error?.includes("API_KEY") && (
             <p className="text-xs text-yellow-400 mt-4 text-center">Chat requires API key. Configure it.</p>
        )}

      </main>
      <Footer toolName={
          currentToolMode === 'chat' ? "AI Chatbot" :
          currentToolMode === 'paraphraser' ? "AI Paraphraser" :
          currentToolMode === 'summarizer' ? "AI Text Summarizer" :
          currentToolMode === 'planner' ? "AI Planner" :
          currentToolMode === 'imageGenerator' ? "AI Image Generator" :
          currentToolMode === 'imageImprover' ? "AI Image Improver" :
          "Multi-Tool AI Assistant"
        } />
      {isHelpModalOpen && <HelpModal onClose={() => setIsHelpModalOpen(false)} currentTool={currentToolMode}/>}
    </div>
  );
};

export default App;