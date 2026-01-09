export interface StoryboardFrame {
  id: string;
  imageData: string; // Base64
  order: number;
}

export interface PropItem {
  id: string;
  url: string; // Can be a remote URL or a local Blob URL
  description: string;
  isUpload: boolean;
}

export interface StyleItem {
  id: string;
  url: string;
  isUpload: boolean;
}

export enum AppStep {
  STORYBOARD = 'STORYBOARD',
  PROPS = 'PROPS',
  STYLE = 'STYLE',
  GENERATE = 'GENERATE'
}

// Augment the global AIStudio interface to ensure methods are available
// This avoids conflict with existing declaration of window.aistudio which expects type AIStudio
declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
}