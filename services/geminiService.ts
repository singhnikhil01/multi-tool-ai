
import { GoogleGenAI, GenerateContentResponse, Chat, Part } from "@google/genai";
import { ParaphraseResult, ParaphraseModeValue, SummarizeResult, ImageGenerationResult, PlannerResult, ImageImprovementResult } from '../types';
import { GEMINI_MODEL_TEXT, GEMINI_MODEL_CHAT, GEMINI_MODEL_IMAGE_GENERATION, PARAPHRASE_MODES } from '../constants';

const getApiKeyFromEnv = (): string | undefined => { 
  return process.env.API_KEY;
};

const getModeDescription = (modeValue: ParaphraseModeValue): string => {
  const mode = PARAPHRASE_MODES.find(m => m.value === modeValue);
  return mode ? mode.description : 'standard rewriting';
}

export const paraphraseText = async (text: string, mode: ParaphraseModeValue): Promise<ParaphraseResult> => {
  const apiKey = getApiKeyFromEnv();
  if (!apiKey) {
    console.warn("Gemini API key not found. Paraphrasing will be skipped.");
    return {
      paraphrasedText: "",
      error: "Paraphrasing skipped due to missing API key."
    };
  }

  const ai = new GoogleGenAI({ apiKey });
  const modeDescription = getModeDescription(mode);

  const prompt = `You are an expert paraphrasing assistant. Your task is to rewrite the following text.
Apply the following style: "${mode} - ${modeDescription}".
Ensure the core meaning of the original text is preserved.
If the input text is very short or nonsensical, try your best or indicate if it cannot be meaningfully paraphrased.

Original text:
"""
${text}
"""

Respond ONLY with a JSON object in the following format: { "paraphrasedText": "Your paraphrased text here" }.
Do not include any other explanatory text, markdown formatting for the JSON block, or any content before or after the JSON object.
The "paraphrasedText" field should contain only the rewritten text.`;

  let apiResponse: GenerateContentResponse | undefined;

  try {
    apiResponse = await ai.models.generateContent({
      model: GEMINI_MODEL_TEXT,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.7, 
        topP: 0.95,
        topK: 40,
      }
    });

    let jsonStr = apiResponse.text.trim();
    const fenceRegex = /^```(?:json)?\s*\n?(.*?)\n?\s*```$/s;
    const match = jsonStr.match(fenceRegex);
    if (match && match[1]) {
      jsonStr = match[1].trim();
    }

    const parsedData = JSON.parse(jsonStr) as { paraphrasedText: string };

    if (typeof parsedData.paraphrasedText !== 'string') {
      throw new Error("Gemini response is not in the expected JSON format for paraphrasing: 'paraphrasedText' field is missing or not a string.");
    }
    
    return {
      paraphrasedText: parsedData.paraphrasedText
    };

  } catch (error: any) {
    console.error("Error calling Gemini API for paraphrasing:", error);
    let errorMessage = "Failed to paraphrase text. ";

    if (error?.message?.includes("API key not valid")) {
        errorMessage += "The API key may be invalid or not authorized.";
    } else if (error?.message?.toLowerCase()?.includes("json")) {
        errorMessage += "The response from the AI was not valid JSON, or an error occurred parsing it.";
        if (apiResponse && typeof apiResponse.text === 'string' && apiResponse.text.trim() !== "") {
            console.warn("Falling back to raw text due to JSON parsing error during paraphrasing.");
            return {
                paraphrasedText: apiResponse.text.trim(),
                error: "AI response was not clean JSON, showing raw output. Please verify."
            };
        } else {
            errorMessage += " Could not retrieve a fallback response.";
        }
    } else if (error?.message) {
        errorMessage += error.message;
    } else {
        errorMessage += "An unknown error occurred.";
    }
    
    throw new Error(errorMessage);
  }
};

export const summarizeText = async (text: string): Promise<SummarizeResult> => {
  const apiKey = getApiKeyFromEnv();
  if (!apiKey) {
    console.warn("Gemini API key not found. Summarization will be skipped.");
    return {
      summaryText: "",
      error: "Summarization skipped due to missing API key."
    };
  }
  const ai = new GoogleGenAI({ apiKey });
  const prompt = `You are an expert text summarization assistant. Your task is to summarize the following text concisely.
Focus on extracting the key points and main ideas.
The summary should be significantly shorter than the original text but retain its core meaning.

Original text:
"""
${text}
"""

Respond ONLY with a JSON object in the following format: { "summaryText": "Your summary here" }.
Do not include any other explanatory text, markdown formatting for the JSON block, or any content before or after the JSON object.
The "summaryText" field should contain only the summarized text.`;

  let apiResponse: GenerateContentResponse | undefined;
  try {
    apiResponse = await ai.models.generateContent({
      model: GEMINI_MODEL_TEXT,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.5,
        topP: 0.9,
        topK: 40,
      }
    });
    let jsonStr = apiResponse.text.trim();
    const fenceRegex = /^```(?:json)?\s*\n?(.*?)\n?\s*```$/s;
    const match = jsonStr.match(fenceRegex);
    if (match && match[1]) {
      jsonStr = match[1].trim();
    }
    const parsedData = JSON.parse(jsonStr) as { summaryText: string };
    if (typeof parsedData.summaryText !== 'string') {
      throw new Error("Gemini response is not in the expected JSON format for summarization: 'summaryText' field is missing or not a string.");
    }
    return { summaryText: parsedData.summaryText };
  } catch (error: any) {
    console.error("Error calling Gemini API for summarization:", error);
    let errorMessage = "Failed to summarize text. ";
    if (error?.message?.includes("API key not valid")) {
      errorMessage += "The API key may be invalid or not authorized.";
    } else if (error?.message?.toLowerCase()?.includes("json")) {
      errorMessage += "The response from the AI was not valid JSON, or an error occurred parsing it.";
      if (apiResponse && typeof apiResponse.text === 'string' && apiResponse.text.trim() !== "") {
        console.warn("Falling back to raw text due to JSON parsing error during summarization.");
        return {
          summaryText: apiResponse.text.trim(),
          error: "AI response was not clean JSON, showing raw output. Please verify."
        };
      } else {
        errorMessage += " Could not retrieve a fallback response.";
      }
    } else if (error?.message) {
      errorMessage += error.message;
    } else {
      errorMessage += "An unknown error occurred.";
    }
    throw new Error(errorMessage);
  }
};

export const generatePlan = async (goal: string): Promise<PlannerResult> => {
  const apiKey = getApiKeyFromEnv();
  if (!apiKey) {
    console.warn("Gemini API key not found. Planning will be skipped.");
    return {
      planText: "",
      error: "Planning skipped due to missing API key."
    };
  }
  const ai = new GoogleGenAI({ apiKey });
  const prompt = `You are an expert AI planner. Your task is to create a structured, actionable, step-by-step plan for the following goal or task.
The plan should be clear, concise, and easy to follow. Use Markdown for formatting lists, bolding key actions, etc., if it helps improve readability.

Goal/Task:
"""
${goal}
"""

Respond ONLY with a JSON object in the following format: { "planText": "Your detailed plan here. You can use Markdown within this string for sub-steps, bullet points, etc." }.
Do not include any other explanatory text, markdown formatting for the JSON block, or any content before or after the JSON object.
The "planText" field should contain only the generated plan.`;

  let apiResponse: GenerateContentResponse | undefined;
  try {
    apiResponse = await ai.models.generateContent({
      model: GEMINI_MODEL_TEXT,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.6, 
        topP: 0.9,
        topK: 40,
      }
    });
    let jsonStr = apiResponse.text.trim();
    const fenceRegex = /^```(?:json)?\s*\n?(.*?)\n?\s*```$/s;
    const match = jsonStr.match(fenceRegex);
    if (match && match[1]) {
      jsonStr = match[1].trim();
    }
    const parsedData = JSON.parse(jsonStr) as { planText: string };
    if (typeof parsedData.planText !== 'string') {
      throw new Error("Gemini response is not in the expected JSON format for planning: 'planText' field is missing or not a string.");
    }
    return { planText: parsedData.planText };
  } catch (error: any) {
    console.error("Error calling Gemini API for planning:", error);
    let errorMessage = "Failed to generate plan. ";
    if (error?.message?.includes("API key not valid")) {
      errorMessage += "The API key may be invalid or not authorized.";
    } else if (error?.message?.toLowerCase()?.includes("json")) {
      errorMessage += "The response from the AI was not valid JSON, or an error occurred parsing it.";
      if (apiResponse && typeof apiResponse.text === 'string' && apiResponse.text.trim() !== "") {
        console.warn("Falling back to raw text due to JSON parsing error during planning.");
        return {
          planText: apiResponse.text.trim(),
          error: "AI response was not clean JSON, showing raw output. Please verify."
        };
      } else {
        errorMessage += " Could not retrieve a fallback response.";
      }
    } else if (error?.message) {
      errorMessage += error.message;
    } else {
      errorMessage += "An unknown error occurred.";
    }
    throw new Error(errorMessage);
  }
};


export const generateImageFromPrompt = async (prompt: string, numberOfImages: number = 3): Promise<ImageGenerationResult> => {
  const apiKey = getApiKeyFromEnv();
  if (!apiKey) {
    console.warn("Gemini API key not found. Image generation will be skipped.");
    return {
      imageUrls: [], 
      error: "Image generation skipped due to missing API key."
    };
  }
  const ai = new GoogleGenAI({ apiKey });
  try {
    const response = await ai.models.generateImages({
      model: GEMINI_MODEL_IMAGE_GENERATION,
      prompt: prompt,
      config: { numberOfImages: numberOfImages, outputMimeType: 'image/jpeg' }, 
    });

    if (response.generatedImages && response.generatedImages.length > 0) {
      const imageUrls = response.generatedImages.map(img => {
        if (img.image?.imageBytes) {
          return `data:image/jpeg;base64,${img.image.imageBytes}`;
        }
        console.error("Image data missing in one of the generated images object:", img);
        throw new Error("Image data missing in one of the generated images.");
      }).filter(url => url !== undefined) as string[]; 
      
      if (imageUrls.length === 0 && response.generatedImages.length > 0) {
        throw new Error("All generated image objects lacked image data.");
      }
      return { imageUrls, promptUsed: prompt };
    } else {
      throw new Error("No image data received from API or generatedImages array is empty.");
    }
  } catch (error: any) {
    console.error("Error calling Gemini API for image generation:", error);
    let errorMessage = `Failed to generate images for prompt "${prompt}". `;
    if (error?.message?.includes("API key not valid")) {
      errorMessage += "The API key may be invalid or not authorized.";
    } else if (error?.message) {
      errorMessage += error.message;
    } else {
      errorMessage += "An unknown error occurred.";
    }
    return { imageUrls: [], error: errorMessage, promptUsed: prompt };
  }
};


export const generateImprovedImage = async (imageBase64: string, mimeType: string): Promise<ImageImprovementResult> => {
  const apiKey = getApiKeyFromEnv();
  if (!apiKey) {
    console.warn("Gemini API key not found. Image improvement will be skipped.");
    return {
      generatedImageUrls: [],
      error: "Image improvement skipped due to missing API key."
    };
  }
  const ai = new GoogleGenAI({ apiKey });

  const imagePart: Part = {
    inlineData: {
      mimeType: mimeType,
      data: imageBase64,
    },
  };

  const analysisPromptTextPart: Part = {
    text: `You are an image analysis and creative prompting assistant. Analyze the following uploaded image. 
First, provide a concise but descriptive caption of the main subject and style of the image. 
Second, suggest a specific, brief textual phrase that describes an artistic improvement or enhancement for this image (e.g., 'with vibrant colors and sharper details', 'in a fantasy oil painting style', 'with a cinematic, dramatic lighting effect', 'as a retro pixel art'). 
Respond ONLY with a JSON object in the format: {"description": "concise image description", "improvement_suggestion": "suggested enhancement phrase"}. 
Do not include any other text or markdown.`
  };

  let analysisResponse: GenerateContentResponse | undefined;
  let description = "Image"; // Default description
  let improvementSuggestion = "enhanced"; // Default suggestion

  try {
    analysisResponse = await ai.models.generateContent({
      model: GEMINI_MODEL_TEXT, 
      contents: { parts: [imagePart, analysisPromptTextPart] },
      config: {
        responseMimeType: "application/json",
        temperature: 0.6,
      }
    });

    let jsonStr = analysisResponse.text.trim();
    const fenceRegex = /^```(?:json)?\s*\n?(.*?)\n?\s*```$/s;
    const match = jsonStr.match(fenceRegex);
    if (match && match[1]) {
      jsonStr = match[1].trim();
    }
    
    const parsedAnalysis = JSON.parse(jsonStr) as { description?: string; improvement_suggestion?: string };
    if (parsedAnalysis.description) description = parsedAnalysis.description;
    if (parsedAnalysis.improvement_suggestion) improvementSuggestion = parsedAnalysis.improvement_suggestion;

  } catch (error: any) {
    console.error("Error calling Gemini API for image analysis (step 1 of improvement):", error);
    // Proceed with default description and suggestion if analysis fails, but log it.
    // Or, could return an error here if strict analysis is required. For now, let's try to proceed.
    // return { generatedImageUrls: [], description, improvementSuggestion, error: "Failed to analyze original image for improvement." };
  }

  // Step 2: Generate a new image using the description and suggestion
  const combinedPrompt = `${description}, ${improvementSuggestion}`;
  
  try {
    const imageGenResult = await generateImageFromPrompt(combinedPrompt, 1); // Request 1 improved image

    if (imageGenResult.imageUrls.length > 0) {
      return {
        generatedImageUrls: imageGenResult.imageUrls,
        description: description,
        improvementSuggestion: improvementSuggestion,
      };
    } else {
      throw new Error(imageGenResult.error || "Image generation step returned no images.");
    }
  } catch (error: any) {
    console.error("Error calling Gemini API for image generation (step 2 of improvement):", error);
    let errorMessage = "Failed to generate improved image. ";
    if (error?.message?.includes("API key not valid")) {
      errorMessage += "The API key may be invalid or not authorized.";
    } else if (error?.message) {
      errorMessage += error.message;
    } else {
      errorMessage += "An unknown error occurred during the image generation step.";
    }
    return { generatedImageUrls: [], description, improvementSuggestion, error: errorMessage };
  }
};


export const initializeChatSession = (apiKey: string): Chat => {
  if (!apiKey) {
    console.error("API_KEY was not provided to initializeChatSession. Cannot initialize chat session.");
    throw new Error("API_KEY was not provided. Cannot initialize chat session.");
  }
  const ai = new GoogleGenAI({ apiKey: apiKey });
  const newChatSession = ai.chats.create({
    model: GEMINI_MODEL_CHAT,
    config: {
      systemInstruction: `You are a helpful and versatile AI assistant.
- You can perform web searches using Google Search to find current information, news, weather, or answer general knowledge questions.
- When you use web search, you MUST ALWAYS cite your sources by listing the websites you used.
- You can discuss calendar events if the user provides you with information about their schedule. You do not have direct access to their calendar but can reason about the information they give you.
- Maintain context from previous messages in this conversation to provide relevant and coherent responses.
- Respond in Markdown when appropriate for formatting (e.g., lists, bolding).`,
      tools: [{googleSearch: {}}],
    },
  });
  console.log("geminiService: New chat session created using provided API key and tools: ", newChatSession);
  return newChatSession;
};


export const sendChatMessageStream = async (
  activeChat: Chat, 
  messageParts: (string | { inlineData: { mimeType: string; data: string } })[]
): Promise<AsyncIterableIterator<GenerateContentResponse>> => {
  if (!activeChat) {
    throw new Error("Chat session is not initialized or provided.");
  }
  
  const formattedParts: Part[] = messageParts.map(part => {
    if (typeof part === 'string') {
      return { text: part };
    }
    // Ensure it matches the Part structure for inlineData
    return { inlineData: part.inlineData }; 
  });

  try {
    // Pass the array of Part objects directly to the message property
    const result = await activeChat.sendMessageStream({ message: formattedParts });
    return result; 
  } catch (error: any) {
    console.error("Error sending chat message:", error);
    let errorMessage = "Failed to send chat message. ";
     if (error?.message?.includes("API key not valid")) {
        errorMessage += "The API key may be invalid or not authorized.";
    } else if (error.message) {
        errorMessage += error.message;
    } else {
        errorMessage += "An unknown error occurred."
    }
    throw new Error(errorMessage);
  }
};