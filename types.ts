
export const Role = {
  USER: 'user',
  MODEL: 'model',
};

// FIX: Add types for chat objects to resolve typing errors in Chat.tsx
export interface Part {
    text?: string;
    inlineData?: {
        mimeType: string;
        data: string;
    };
}

export interface Message {
    role: string;
    parts: Part[];
    groundingMetadata?: any[];
}

export interface Chat {
    id: string;
    title: string;
    messages: Message[];
    useWebSearch: boolean;
}
