
export enum Role {
  USER = 'user',
  MODEL = 'model',
}

export interface Part {
  text?: string;
  inlineData?: {
    mimeType: string;
    data: string;
  };
}

// FIX: Made web property optional to match the GroundingChunk type from @google/genai.
export interface GroundingChunk {
  web?: {
    uri?: string;
    title?: string;
  };
}

export interface Message {
  role: Role;
  parts: Part[];
  groundingMetadata?: GroundingChunk[];
}

export interface Chat {
  id: string;
  title: string;
  messages: Message[];
  useWebSearch: boolean;
}

export type AllChats = {
  [key: string]: Chat;
};