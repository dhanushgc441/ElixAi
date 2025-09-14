import { GoogleGenAI, Content, Part, GenerateContentResponse } from "@google/genai";
import { Message } from '../types';

const SYSTEM_INSTRUCTION = "You are Elix, an all-in-one AI assistant. Your goal is to provide accurate, comprehensive, and well-structured information, similar to a knowledgeable expert. When asked to generate content, write, or explain, be thorough and clear. When web search is enabled, use it to provide up-to-date, factual answers and cite your sources. You can also generate high-quality images when asked naturally (e.g., 'create an image of...'). Be helpful, user-friendly, and format your responses using markdown for optimal readability.";

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function* generateResponseStream(
  history: Message[],
  newParts: Part[],
  useWebSearch: boolean
): AsyncGenerator<GenerateContentResponse> {
  const contents: Content[] = history.map(msg => ({
    role: msg.role,
    parts: msg.parts.map(p => ({...p})) 
  }));
  contents.push({ role: 'user', parts: newParts });

  const config: any = {
    systemInstruction: SYSTEM_INSTRUCTION,
  };

  if (useWebSearch) {
    config.tools = [{googleSearch: {}}];
  }

  const responseStream = await ai.models.generateContentStream({
    model: 'gemini-2.5-flash',
    contents: contents,
    config: config,
  });

  for await (const chunk of responseStream) {
    yield chunk;
  }
};

export const generateImage = async (prompt: string): Promise<string | null> => {
    try {
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: prompt,
            config: {
                numberOfImages: 1,
                outputMimeType: 'image/png',
            },
        });

        if (response.generatedImages && response.generatedImages.length > 0) {
            return response.generatedImages[0].image.imageBytes;
        }
        return null;
    } catch (error) {
        console.error("Error generating image:", error);
        return null;
    }
};

export const generateChatTitle = async (prompt: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Generate a very short, concise title (4 words max) for this user prompt: "${prompt}"`,
        });
        return response.text.trim().replace(/["\n]/g, '');
    } catch (error) {
        console.error("Error generating title:", error);
        return "New Chat";
    }
};