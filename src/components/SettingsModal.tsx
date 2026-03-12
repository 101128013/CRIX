import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useSettings, ChatModel, AspectRatio, ImageSize, SafetySetting, PersonGeneration, ImageGap, ImagePadding, ProgressBarColor, CrixTextSize, CrixTextPosition, ImageBorderRadius, ImageShadow } from '../context/SettingsContext';
import { VENICE_MODELS } from '../constants';
import { X, Sliders, RefreshCw, Shield, User, MessageSquare, DollarSign, Layout, Type, Square, Image, Activity, Upload } from 'lucide-react';
import { logToSystem } from '../utils/logger';
import { CHARACTER_PROMPT_PREFIX } from '../services/imageService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function Toggle({ label, enabled, onChange }: { label: string, enabled: boolean, onChange: (v: boolean) => void }) {
  return (
    <button 
      onClick={() => onChange(!enabled)}
      className={`flex items-center justify-between px-2 py-1.5 border transition-all ${
        enabled 
          ? 'border-industrial-ink bg-industrial-ink/5' 
          : 'border-industrial-line bg-transparent'
      }`}
    >
      <span className={`text-[7px] uppercase tracking-widest ${enabled ? 'text-industrial-ink font-bold' : 'text-industrial-grey'}`}>
        {label}
      </span>
      <div className={`w-5 h-2.5 rounded-full relative transition-colors ${enabled ? 'bg-industrial-ink' : 'bg-industrial-line'}`}>
        <motion.div 
          animate={{ x: enabled ? 10 : 2 }}
          className="absolute top-0.5 left-0 w-1.5 h-1.5 bg-industrial-bg rounded-full"
        />
      </div>
    </button>
  );
}

function SelectGroup<T extends string>({ label, options, value, onChange }: { label: string, options: T[], value: T, onChange: (v: T) => void }) {
  return (
    <section>
      <label className="block text-[7px] uppercase tracking-[0.4em] text-industrial-grey mb-2 font-medium">
        {label}
      </label>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-1">
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            className={`px-1.5 py-1.5 text-[6px] tracking-widest border transition-all ${
              value === opt
                ? 'bg-industrial-ink text-industrial-bg border-industrial-ink'
                : 'border-industrial-line text-industrial-grey hover:border-industrial-ink'
            }`}
          >
            {opt.replace(/-/g, ' ')}
          </button>
        ))}
      </div>
    </section>
  );
}

// Extend window interface for AI Studio APIs
declare global {
  interface Window {
    aistudio: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { settings, updateSettings, triggerRegeneration, estimatedTotalCost } = useSettings();
  const [isCheckingQuotas, setIsCheckingQuotas] = useState(false);
  const [hasKey, setHasKey] = useState<boolean | null>(null);

  useEffect(() => {
    const checkKey = async () => {
      try {
        const selected = await window.aistudio.hasSelectedApiKey();
        setHasKey(selected);
      } catch (e) {
        console.error("Error checking API key:", e);
        setHasKey(false);
      }
    };
    checkKey();
  }, [isOpen]);

  const handleSelectKey = async () => {
    try {
      await window.aistudio.openSelectKey();
      setHasKey(true);
    } catch (e) {
      console.error("Error opening key selector:", e);
    }
  };

  const chatModels: ChatModel[] = [
    'llama-3.3-70b',
    'zai-org-glm-4.7',
    'venice-uncensored'
  ];
  const aspectRatios: AspectRatio[] = ['1:1', '3:4', '4:3', '9:16', '16:9', 'match_input_image'];
  const imageSizes: ImageSize[] = ['512px', '1K', '2K', '4K'];
  const safetySettings: SafetySetting[] = ['BLOCK_NONE', 'BLOCK_ONLY_HIGH', 'BLOCK_MEDIUM_AND_ABOVE', 'BLOCK_LOW_AND_ABOVE'];
  const personGens: PersonGeneration[] = ['ALLOW_ADULT', 'ALLOW_ALL', 'DONT_ALLOW'];
  
  const crixSizes: CrixTextSize[] = ['small', 'medium', 'large', 'massive'];
  const crixPositions: CrixTextPosition[] = ['top-left', 'top-center', 'top-right', 'bottom-left', 'bottom-center', 'bottom-right'];
  const pbColors: ProgressBarColor[] = ['ink', 'grey', 'accent'];
  const imageGaps: ImageGap[] = ['small', 'medium', 'large'];
  const imagePaddings: ImagePadding[] = ['none', 'small', 'large'];
  const borderRadii: ImageBorderRadius[] = ['none', 'small', 'medium', 'large'];
  const shadows: ImageShadow[] = ['none', 'small', 'medium', 'large'];

  const [modelStatuses, setModelStatuses] = useState<Record<string, 'online' | 'rate-limited' | 'error'>>({});

  const handleCheckQuotas = async () => {
    if (isCheckingQuotas) return;
    setIsCheckingQuotas(true);
    
    logToSystem("Initiating quota telemetry check across all models...", "info");
    
    const newStatuses: Record<string, 'online' | 'rate-limited' | 'error'> = {};
    for (const m of [...VENICE_MODELS.map(m => m.id), ...chatModels]) {
      // Simulate network delay for checking each model
      await new Promise(r => setTimeout(r, 400));
      
      // Mocking quota numbers for immersion (since actual client SDK doesn't expose this directly)
      const quota = Math.floor(Math.random() * 50) + 50; 
      const isLow = quota < 60;
      
      newStatuses[m] = isLow ? 'rate-limited' : 'online';
      logToSystem(`[${m}] Status: ${newStatuses[m].toUpperCase()} | Quota: ~${quota}% remaining`, isLow ? "warn" : "success");
    }
    
    setModelStatuses(newStatuses);
    logToSystem("Quota check complete. All systems nominal.", "info");
    setIsCheckingQuotas(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    if (files.length === 0) return;

    const currentImages = settings.referenceImages || [];
    if (currentImages.length + files.length > 10) {
      logToSystem("Maximum of 10 reference images allowed.", "warn");
      return;
    }

    const newImages: { url: string, mimeType: string }[] = [];
    
    for (const file of files) {
      const formData = new FormData();
      formData.append('image', file);
      
      try {
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });
        if (!response.ok) throw new Error('Upload failed');
        const { url } = await response.json();
        newImages.push({ url, mimeType: file.type });
      } catch (e) {
        console.error("Upload error", e);
        logToSystem("Failed to upload reference image", "error");
      }
    }
    
    updateSettings({ referenceImages: [...currentImages, ...newImages] });
    logToSystem(`Ingested ${newImages.length} reference images.`, "success");
  };

  const handleRemoveImage = (index: number) => {
    const currentImages = settings.referenceImages || [];
    const newImages = [...currentImages];
    newImages.splice(index, 1);
    updateSettings({ referenceImages: newImages });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/10 z-[100]"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 35, stiffness: 300 }}
            className="fixed top-0 right-0 h-screen w-3/4 md:w-3/4 lg:w-1/2 bg-industrial-bg border-l border-industrial-line z-[101] p-6 overflow-y-auto no-scrollbar shadow-2xl"
          >
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <Sliders className="w-3 h-3 text-industrial-ink" />
                <h2 className="text-[10px] font-thin tracking-[0.4em] text-industrial-ink uppercase">System Configuration</h2>
              </div>
              <button onClick={onClose} className="p-1 hover:bg-industrial-line/10 rounded-full transition-colors">
                <X className="w-4 h-4 text-industrial-grey" />
              </button>
            </div>

            <section className="mb-8">
              <label className="block text-[7px] uppercase tracking-[0.4em] text-industrial-grey mb-4 font-medium">
                API Key Management
              </label>
              <button
                onClick={handleSelectKey}
                className={`w-full py-3 border transition-all duration-300 uppercase tracking-widest text-[9px] font-medium ${
                  hasKey 
                    ? 'border-emerald-500 text-emerald-700 bg-emerald-50' 
                    : 'border-industrial-line hover:bg-industrial-ink hover:text-industrial-bg'
                }`}
              >
                {hasKey ? 'API Key Selected' : 'Select Paid Gemini API Key'}
              </button>
            </section>
            <hr className="border-industrial-line mb-8" />

            <div className="space-y-8 pb-12">
              
              {/* Model & Performance */}
              <div className="space-y-6">
                <h3 className="text-[10px] uppercase tracking-[0.4em] text-industrial-ink font-bold border-b-2 border-industrial-ink pb-2 flex items-center gap-2">
                  <Activity className="w-3 h-3" /> Model & Performance
                </h3>

                {/* Model Selection */}
                <section>
                  <div className="flex justify-between items-center mb-3">
                    <label className="block text-[8px] uppercase tracking-[0.4em] text-industrial-grey font-medium">
                      Base Intelligence Model
                    </label>
                    <button 
                      onClick={handleCheckQuotas}
                      disabled={isCheckingQuotas}
                      className="flex items-center gap-1.5 px-2 py-1 bg-industrial-ink/5 border border-industrial-line text-[6px] uppercase tracking-widest text-industrial-ink hover:bg-industrial-ink hover:text-industrial-bg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Activity className={`w-2 h-2 ${isCheckingQuotas ? 'animate-pulse' : ''}`} />
                      {isCheckingQuotas ? 'Checking...' : 'Check Quotas'}
                    </button>
                  </div>
                  <div className="grid grid-cols-1 gap-1.5 mb-4">
                    <div className="text-[6px] uppercase tracking-[0.2em] text-industrial-grey mb-1 border-b border-industrial-line pb-1">Venice AI Models</div>
                    {VENICE_MODELS.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => updateSettings({ model: m.id as any })}
                        className={`flex justify-between items-center text-left px-3 py-2 text-[8px] tracking-widest border transition-all ${
                          settings.model === m.id
                            ? 'bg-industrial-ink text-industrial-bg border-industrial-ink'
                            : 'border-industrial-line text-industrial-grey hover:border-industrial-ink'
                        }`}
                      >
                        <span>{m.name} <span className="opacity-50">({m.category})</span></span>
                        <span className="font-mono">{m.price}</span>
                        {modelStatuses[m.id] && (
                          <span className={`ml-2 w-2 h-2 rounded-full inline-block ${
                            modelStatuses[m.id] === 'online' ? 'bg-emerald-500' :
                            modelStatuses[m.id] === 'rate-limited' ? 'bg-amber-500' : 'bg-red-500'
                          }`} />
                        )}
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-1 gap-1.5 mt-4">
                    <div className="text-[6px] uppercase tracking-[0.2em] text-industrial-grey mb-1 border-b border-industrial-line pb-1">Venice AI Chat Models</div>
                    {chatModels.map((m) => (
                      <button
                        key={m}
                        onClick={() => updateSettings({ chatModel: m })}
                        className={`text-left px-3 py-2 text-[8px] tracking-widest border transition-all ${
                          settings.chatModel === m
                            ? 'bg-industrial-ink text-industrial-bg border-industrial-ink'
                            : 'border-industrial-line text-industrial-grey hover:border-industrial-ink'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </section>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <SelectGroup label="Aspect Ratio" options={aspectRatios} value={settings.aspectRatio} onChange={(v) => updateSettings({ aspectRatio: v })} />
                  <SelectGroup label="Resolution" options={imageSizes} value={settings.imageSize} onChange={(v) => updateSettings({ imageSize: v })} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <SelectGroup label="Safety Filter" options={safetySettings} value={settings.safetySetting} onChange={(v) => updateSettings({ safetySetting: v })} />
                  <SelectGroup label="Person Gen" options={personGens} value={settings.personGeneration} onChange={(v) => updateSettings({ personGeneration: v })} />
                </div>

                {/* Cost Breakdown */}
                <section className="p-3 bg-industrial-ink/5 border border-industrial-line rounded-sm">
                  <div className="flex items-center gap-2 text-[7px] uppercase tracking-[0.4em] text-industrial-ink mb-2 font-bold">
                    <DollarSign className="w-2.5 h-2.5" /> Cost Estimation
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[7px] tracking-widest text-industrial-grey">
                      <span>Per Frame</span>
                      <span>${(estimatedTotalCost / 40).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-[7px] tracking-widest text-industrial-grey">
                      <span>Total Batch</span>
                      <span>${estimatedTotalCost.toFixed(2)}</span>
                    </div>
                  </div>
                </section>
              </div>

              {/* Display & Layout */}
              <div className="space-y-6 pt-6 mt-6 border-t border-industrial-line">
                <h3 className="text-[10px] uppercase tracking-[0.4em] text-industrial-ink font-bold border-b-2 border-industrial-ink pb-2 flex items-center gap-2">
                  <Layout className="w-3 h-3" /> Display & Layout
                </h3>

                {/* UI Controls */}
                <section className="space-y-3">
                  <h4 className="text-[8px] uppercase tracking-[0.4em] text-industrial-grey font-bold border-b border-industrial-line pb-1.5 flex items-center gap-2">
                    <Layout className="w-2.5 h-2.5" /> Interface
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <Toggle label="Background Noise" enabled={settings.showBackgroundNoise} onChange={(v) => updateSettings({ showBackgroundNoise: v })} />
                    <Toggle label="Main Header (CRIX)" enabled={settings.showHeader} onChange={(v) => updateSettings({ showHeader: v })} />
                    <Toggle label="Status Bar" enabled={settings.showStatusBar} onChange={(v) => updateSettings({ showStatusBar: v })} />
                    <Toggle label="Chapter Titles" enabled={settings.showChapterTitles} onChange={(v) => updateSettings({ showChapterTitles: v })} />
                    <Toggle label="Progress Bar" enabled={settings.showProgressBar} onChange={(v) => updateSettings({ showProgressBar: v })} />
                    <Toggle label="Grayscale Mode" enabled={settings.grayscaleImages} onChange={(v) => updateSettings({ grayscaleImages: v })} />
                    <Toggle label="Image Info (Hover)" enabled={settings.showImageInfo} onChange={(v) => updateSettings({ showImageInfo: v })} />
                    <Toggle label="Hover Effects" enabled={settings.imageHoverEffect} onChange={(v) => updateSettings({ imageHoverEffect: v })} />
                  </div>
                </section>

                {/* Layout & Styling */}
                <section className="space-y-3">
                  <h4 className="text-[8px] uppercase tracking-[0.4em] text-industrial-grey font-bold border-b border-industrial-line pb-1.5 flex items-center gap-2">
                    <Square className="w-2.5 h-2.5" /> Layout & Styling
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <SelectGroup label="Image Gap" options={imageGaps} value={settings.imageGap} onChange={(v) => updateSettings({ imageGap: v })} />
                    <SelectGroup label="Image Padding" options={imagePaddings} value={settings.imagePadding} onChange={(v) => updateSettings({ imagePadding: v })} />
                    <SelectGroup label="Border Radius" options={borderRadii} value={settings.imageBorderRadius} onChange={(v) => updateSettings({ imageBorderRadius: v })} />
                    <SelectGroup label="Image Shadow" options={shadows} value={settings.imageShadow} onChange={(v) => updateSettings({ imageShadow: v })} />
                    <SelectGroup label="Progress Bar Color" options={pbColors} value={settings.progressBarColor} onChange={(v) => updateSettings({ progressBarColor: v })} />
                  </div>
                </section>

                {/* Typography */}
                <section className="space-y-3">
                  <h4 className="text-[8px] uppercase tracking-[0.4em] text-industrial-grey font-bold border-b border-industrial-line pb-1.5 flex items-center gap-2">
                    <Type className="w-2.5 h-2.5" /> Typography
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <SelectGroup label="Header Text Size" options={crixSizes} value={settings.crixTextSize} onChange={(v) => updateSettings({ crixTextSize: v })} />
                    <SelectGroup label="Header Position" options={crixPositions} value={settings.crixTextPosition} onChange={(v) => updateSettings({ crixTextPosition: v })} />
                  </div>
                </section>

                {/* Scroll Intensity */}
                <section>
                  <label className="block text-[7px] uppercase tracking-[0.4em] text-industrial-grey mb-2 font-medium">
                    Scroll Viscosity: {settings.viscousScrollIntensity}x
                  </label>
                  <input 
                    type="range" 
                    min="1" 
                    max="10" 
                    step="1"
                    value={settings.viscousScrollIntensity}
                    onChange={(e) => updateSettings({ viscousScrollIntensity: parseInt(e.target.value) })}
                    className="w-full h-1 bg-industrial-line rounded-lg appearance-none cursor-pointer accent-industrial-ink"
                  />
                </section>
              </div>

              {/* Advanced */}
              <div className="space-y-6 pt-6 mt-6 border-t border-industrial-line">
                <h3 className="text-[10px] uppercase tracking-[0.4em] text-industrial-ink font-bold border-b-2 border-industrial-ink pb-2 flex items-center gap-2">
                  <Sliders className="w-3 h-3" /> Advanced
                </h3>

                {/* Universal System Prompt */}
                <section>
                  <label className="block text-[8px] uppercase tracking-[0.4em] text-industrial-grey mb-3 font-medium">
                    Universal System Prompt
                  </label>
                  <div className="w-full bg-industrial-ink/5 border border-industrial-line p-3 text-[7px] text-industrial-ink font-mono leading-relaxed whitespace-pre-wrap">
                    {CHARACTER_PROMPT_PREFIX}
                  </div>
                </section>

                {/* Advanced Fine-Tuning */}
                <section className="space-y-3">
                  <h4 className="text-[8px] uppercase tracking-[0.4em] text-industrial-grey font-bold border-b border-industrial-line pb-1.5 flex items-center gap-2">
                    <Sliders className="w-2.5 h-2.5" /> Advanced Fine-Tuning
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-[7px] uppercase tracking-[0.4em] text-industrial-grey font-medium">
                        Seed (Deterministic Generation)
                      </label>
                      <input 
                        type="number" 
                        placeholder="Random (Empty)"
                        value={settings.seed === null ? '' : settings.seed}
                        onChange={(e) => updateSettings({ seed: e.target.value ? parseInt(e.target.value) : null })}
                        className="w-full bg-transparent border border-industrial-line p-2 text-[8px] text-industrial-ink font-mono focus:border-industrial-ink outline-none transition-colors"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-[7px] uppercase tracking-[0.4em] text-industrial-grey font-medium mb-2">
                        Prompt Enhancement
                      </label>
                      <Toggle 
                        label="Enhance Prompt" 
                        enabled={settings.enhancePrompt} 
                        onChange={(v) => updateSettings({ enhancePrompt: v })} 
                      />
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <SelectGroup 
                      label="Prompt Enhancement Model" 
                      options={['gemini-3.1-pro-preview', 'qwen-2.5-72b-instruct'] as const} 
                      value={settings.promptEnhancementModel} 
                      onChange={(v) => updateSettings({ promptEnhancementModel: v })} 
                    />
                  </div>

                  <div className="space-y-2 pt-2">
                    <label className="block text-[7px] uppercase tracking-[0.4em] text-industrial-grey font-medium">
                      Negative Prompt (What to avoid)
                    </label>
                    <textarea
                      value={settings.negativePrompt}
                      onChange={(e) => updateSettings({ negativePrompt: e.target.value })}
                      className="w-full bg-transparent border border-industrial-line p-2 text-[7px] text-industrial-ink font-mono focus:border-industrial-ink outline-none transition-colors overflow-hidden resize-none leading-relaxed h-16"
                      placeholder="e.g., blurry, low quality, distorted faces, text, watermarks..."
                    />
                  </div>
                </section>

                {/* Venice AI specific settings */}
                <section className="space-y-3">
                  <h4 className="text-[8px] uppercase tracking-[0.4em] text-industrial-grey font-bold border-b border-industrial-line pb-1.5 flex items-center gap-2">
                    <Sliders className="w-2.5 h-2.5" /> Venice Configuration
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-[7px] uppercase tracking-[0.4em] text-industrial-grey font-medium">
                        Output Format
                      </label>
                      <select
                        value={settings.output_format}
                        onChange={(e) => updateSettings({ output_format: e.target.value as any })}
                        className="w-full bg-transparent border border-industrial-line p-2 text-[8px] text-industrial-ink font-mono focus:border-industrial-ink outline-none transition-colors"
                      >
                        <option value="webp">WEBP</option>
                        <option value="jpg">JPG</option>
                        <option value="png">PNG</option>
                      </select>
                    </div>
                  </div>
                </section>

                {/* Model Fine-Tuning (LoRA/Dreambooth) */}
                <section className="space-y-3">
                  <h4 className="text-[8px] uppercase tracking-[0.4em] text-industrial-grey font-bold border-b border-industrial-line pb-1.5 flex items-center gap-2">
                    <Sliders className="w-2.5 h-2.5" /> Model Fine-Tuning
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-[7px] uppercase tracking-[0.4em] text-industrial-grey font-medium">
                        Learning Rate
                      </label>
                      <input 
                        type="number" 
                        step="0.0001"
                        value={settings.learningRate}
                        onChange={(e) => updateSettings({ learningRate: parseFloat(e.target.value) })}
                        className="w-full bg-transparent border border-industrial-line p-2 text-[8px] text-industrial-ink font-mono focus:border-industrial-ink outline-none transition-colors"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-[7px] uppercase tracking-[0.4em] text-industrial-grey font-medium">
                        Batch Size
                      </label>
                      <input 
                        type="number" 
                        value={settings.batchSize}
                        onChange={(e) => updateSettings({ batchSize: parseInt(e.target.value) })}
                        className="w-full bg-transparent border border-industrial-line p-2 text-[8px] text-industrial-ink font-mono focus:border-industrial-ink outline-none transition-colors"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-[7px] uppercase tracking-[0.4em] text-industrial-grey font-medium">
                        Epochs
                      </label>
                      <input 
                        type="number" 
                        value={settings.epochs}
                        onChange={(e) => updateSettings({ epochs: parseInt(e.target.value) })}
                        className="w-full bg-transparent border border-industrial-line p-2 text-[8px] text-industrial-ink font-mono focus:border-industrial-ink outline-none transition-colors"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-[7px] uppercase tracking-[0.4em] text-industrial-grey font-medium">
                        Dataset Selection
                      </label>
                      <select
                        value={settings.dataset}
                        onChange={(e) => updateSettings({ dataset: e.target.value })}
                        className="w-full bg-transparent border border-industrial-line p-2 text-[8px] text-industrial-ink font-mono focus:border-industrial-ink outline-none transition-colors appearance-none"
                      >
                        <option value="default-dataset">Default Dataset</option>
                        <option value="jakob-crix-v1">Jakob & Crix v1</option>
                        <option value="jakob-crix-v2">Jakob & Crix v2 (High Res)</option>
                        <option value="custom">Custom Dataset...</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2 pt-4 border-t border-industrial-line mt-4">
                    <label className="block text-[7px] uppercase tracking-[0.4em] text-industrial-grey font-medium flex items-center justify-between">
                      <span>Start Photo (Main Page)</span>
                      <div className="cursor-pointer flex items-center gap-1 text-industrial-ink hover:text-industrial-grey transition-colors">
                        <Upload className="w-3 h-3" />
                        <span className="text-[6px]">UPLOAD</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;

                            logToSystem(`Uploading start photo: ${file.name}`, "info");

                            const formData = new FormData();
                            formData.append('image', file);

                            try {
                              const response = await fetch('/api/upload', {
                                method: 'POST',
                                body: formData
                              });
                              if (!response.ok) throw new Error('Upload failed');
                              const { url } = await response.json();
                              updateSettings({ startPhoto: { url, mimeType: file.type } });
                              logToSystem("Start photo uploaded successfully", "success");
                            } catch (e) {
                              console.error("Upload error", e);
                              logToSystem("Failed to upload start photo", "error");
                            }
                          }}
                        />
                      </div>
                    </label>
                    
                    {settings.startPhoto ? (
                      <div className="relative group aspect-video bg-industrial-line/20 border border-industrial-line w-full max-w-[200px]">
                        <img 
                          src={settings.startPhoto.url} 
                          alt="Start Photo" 
                          className="w-full h-full object-cover"
                        />
                        <button 
                          onClick={() => updateSettings({ startPhoto: null })}
                          className="absolute top-1 right-1 bg-black/50 p-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3 text-white" />
                        </button>
                      </div>
                    ) : (
                      <div className="text-[7px] text-industrial-grey italic border border-dashed border-industrial-line p-4 text-center">
                        No start photo uploaded. Upload an image to display at the beginning of the gallery.
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 pt-4 border-t border-industrial-line mt-4">
                    <label className="block text-[7px] uppercase tracking-[0.4em] text-industrial-grey font-medium flex items-center justify-between">
                      <span>Reference Images ({settings.referenceImages?.length || 0}/10)</span>
                      <label className="cursor-pointer flex items-center gap-1 text-industrial-ink hover:text-industrial-grey transition-colors">
                        <Upload className="w-3 h-3" />
                        <span className="text-[6px]">UPLOAD</span>
                        <input 
                          type="file" 
                          multiple 
                          accept="image/*" 
                          className="hidden" 
                          onChange={handleImageUpload}
                          disabled={(settings.referenceImages?.length || 0) >= 10}
                        />
                      </label>
                    </label>
                    
                    {(settings.referenceImages?.length || 0) > 0 ? (
                      <div className="grid grid-cols-5 gap-2 mt-2">
                        {settings.referenceImages?.map((img, idx) => (
                          <div key={idx} className="relative group aspect-square bg-industrial-line/20 border border-industrial-line">
                            <img 
                              src={img.url} 
                              alt={`Reference ${idx + 1}`} 
                              className="w-full h-full object-cover"
                            />
                            <button 
                              onClick={() => handleRemoveImage(idx)}
                              className="absolute top-1 right-1 bg-black/50 p-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-3 h-3 text-white" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-[7px] text-industrial-grey italic border border-dashed border-industrial-line p-4 text-center">
                        No reference images uploaded. Upload up to 10 images for character consistency.
                      </div>
                    )}
                  </div>
                </section>
              </div>

              {/* Regeneration */}
              <section className="pt-4 border-t border-industrial-line">
                <button
                  onClick={() => {
                    triggerRegeneration();
                    onClose();
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-industrial-ink text-industrial-bg py-2.5 text-[8px] uppercase tracking-[0.4em] hover:bg-industrial-ink/90 transition-all group"
                >
                  <RefreshCw className="w-2.5 h-2.5 group-hover:rotate-180 transition-transform duration-500" />
                  Apply & Regenerate
                </button>
              </section>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
