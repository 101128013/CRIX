import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { VENICE_MODELS } from '../constants';

export type ImageModel = 
  | 'recraft-v4-pro'
  | 'gpt-image-1-5'
  | 'nano-banana-pro'
  | 'nano-banana-2'
  | 'qwen-image-2-pro'
  | 'flux-2-max'
  | 'hunyuan-image-v3'
  | 'imagineart-1.5-pro'
  | 'qwen-image-2'
  | 'recraft-v4'
  | 'seedream-v4'
  | 'seedream-v5-lite'
  | 'flux-2-pro'
  | 'grok-imagine'
  | 'bria-bg-remover'
  | 'wai-Illustrious'
  | 'chroma'
  | 'hidream'
  | 'lustify-sdxl'
  | 'lustify-v7'
  | 'qwen-image'
  | 'venice-sd35'
  | 'z-image-turbo'
  | 'flux-2-max-edit'
  | 'gpt-image-1-5-edit'
  | 'grok-imagine-edit'
  | 'nano-banana-2-edit'
  | 'nano-banana-pro-edit'
  | 'qwen-edit'
  | 'qwen-image-2-edit'
  | 'qwen-image-2-pro-edit'
  | 'seedream-v4-edit'
  | 'seedream-v5-lite-edit'
  | 'qwen-image-edit'
  | 'upscaler';

export type ChatModel = 'llama-3.3-70b' | 'zai-org-glm-4.7' | 'venice-uncensored';

export type PromptEnhancementModel = 'gemini-3.1-pro-preview' | 'qwen-2.5-72b-instruct';
export type AspectRatio = '1:1' | '3:4' | '4:3' | '9:16' | '16:9' | 'match_input_image';
export type ImageSize = '512px' | '1K' | '2K' | '4K';
export type SafetySetting = 'BLOCK_NONE' | 'BLOCK_ONLY_HIGH' | 'BLOCK_MEDIUM_AND_ABOVE' | 'BLOCK_LOW_AND_ABOVE';
export type PersonGeneration = 'ALLOW_ADULT' | 'ALLOW_ALL' | 'DONT_ALLOW';

export type ImageGap = 'small' | 'medium' | 'large';
export type ImagePadding = 'none' | 'small' | 'large';
export type ProgressBarColor = 'ink' | 'grey' | 'accent';
export type CrixTextSize = 'small' | 'medium' | 'large' | 'massive';
export type CrixTextPosition = 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
export type ImageBorderRadius = 'none' | 'small' | 'medium' | 'large';
export type ImageShadow = 'none' | 'small' | 'medium' | 'large';

interface Settings {
  model: ImageModel;
  aspectRatio: AspectRatio;
  imageSize: ImageSize;
  safetySetting: SafetySetting;
  personGeneration: PersonGeneration;
  negativePrompt: string;
  seed: number | null;
  enhancePrompt: boolean;
  promptEnhancementModel: PromptEnhancementModel;
  learningRate: number;
  batchSize: number;
  epochs: number;
  dataset: string;
  showProgressBar: boolean;
  grayscaleImages: boolean;
  showImageInfo: boolean;
  showChapterTitles: boolean;
  viscousScrollIntensity: number;
  imageHoverEffect: boolean;
  showTechnicalInfo: boolean;
  showBackgroundNoise: boolean;
  showHeader: boolean;
  showStatusBar: boolean;
  chatModel: ChatModel;
  imageGap: ImageGap;
  imagePadding: ImagePadding;
  progressBarColor: ProgressBarColor;
  crixTextSize: CrixTextSize;
  crixTextPosition: CrixTextPosition;
  imageBorderRadius: ImageBorderRadius;
  imageShadow: ImageShadow;
  referenceImages: { url: string, mimeType: string }[];
  startPhoto: { url: string, mimeType: string } | null;
  output_format: 'webp' | 'jpg' | 'png';
}

interface SettingsContextType {
  settings: Settings;
  updateSettings: (newSettings: Partial<Settings>) => void;
  regenerateTrigger: number;
  triggerRegeneration: () => void;
  estimatedTotalCost: number;
  isSettingsOpen: boolean;
  setIsSettingsOpen: (isOpen: boolean) => void;
  isSettingsLoaded: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const DEFAULT_SETTINGS: Settings = {
  model: 'flux-2-pro',
  aspectRatio: '1:1',
  imageSize: '1K',
  safetySetting: 'BLOCK_ONLY_HIGH',
  personGeneration: 'ALLOW_ADULT',
  negativePrompt: '',
  seed: null,
  enhancePrompt: false,
  promptEnhancementModel: 'gemini-3.1-pro-preview',
  learningRate: 0.0001,
  batchSize: 16,
  epochs: 100,
  dataset: 'default-dataset',
  showProgressBar: false,
  grayscaleImages: true,
  showImageInfo: false,
  showChapterTitles: false,
  viscousScrollIntensity: 3,
  imageHoverEffect: true,
  showTechnicalInfo: false,
  showBackgroundNoise: true,
  showHeader: true,
  showStatusBar: true,
  chatModel: 'llama-3.3-70b',
  imageGap: 'medium',
  imagePadding: 'small',
  progressBarColor: 'ink',
  crixTextSize: 'large',
  crixTextPosition: 'top-left',
  imageBorderRadius: 'none',
  imageShadow: 'none',
  referenceImages: [],
  startPhoto: null,
  output_format: 'webp',
};

const SETTINGS_STORAGE_KEY = 'lookbook_settings_v2';

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.error("Failed to parse settings from localStorage", e);
    }
    return DEFAULT_SETTINGS;
  });

  const [regenerateTrigger, setRegenerateTrigger] = useState(0);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSettingsLoaded, setIsSettingsLoaded] = useState(true);

  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
      console.error("Failed to save settings", e);
    }
  }, [settings]);

  const updateSettings = (newSettings: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const triggerRegeneration = () => {
    setRegenerateTrigger((prev) => prev + 1);
  };

  const estimatedTotalCost = useMemo(() => {
    const modelInfo = VENICE_MODELS.find(m => m.id === settings.model);
    if (!modelInfo) return 0;
    
    // Parse price string like "$0.29" or "$0.10-$0.19"
    const priceStr = modelInfo.price.replace('$', '');
    const price = parseFloat(priceStr.split('-')[0]); // Use the lower bound for range
    return price * 40; // 40 images total
  }, [settings.model]);

  return (
    <SettingsContext.Provider value={{ 
      settings, 
      updateSettings, 
      regenerateTrigger, 
      triggerRegeneration, 
      estimatedTotalCost,
      isSettingsOpen,
      setIsSettingsOpen,
      isSettingsLoaded
    }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
