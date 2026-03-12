import { motion, AnimatePresence } from "motion/react";
import { useRef, useState, useEffect, useMemo } from "react";
import { generateLookbookImage } from "../services/imageService";
import { logToSystem } from "../utils/logger";
import { useProgress } from "../context/ProgressContext";
import { useHistory } from "../context/HistoryContext";
import { useSettings, ImageModel, AspectRatio, ImageSize } from "../context/SettingsContext";
import { Download, Sliders, X, Terminal, Cpu, MessageSquare, History, CheckSquare, Square } from "lucide-react";
import { safeStringify } from "../utils/json";
import { useSelection } from "../context/SelectionContext";

interface ImageCardProps {
  key?: string;
  prompt: string;
  chapterId: string;
  index: number;
}

export default function ImageCard({ prompt: initialPrompt, chapterId, index }: ImageCardProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasStartedLoading, setHasStartedLoading] = useState(false);
  const { updateProgress, setActiveImageId, images } = useProgress();
  const { settings, regenerateTrigger, isSettingsLoaded } = useSettings();
  const { history: globalHistory, addRecord, loading: historyLoading } = useHistory();
  const { selectedIds, toggleSelection } = useSelection();
  const imageId = `${chapterId}-${index}`;
  const isSelected = selectedIds.includes(imageId);
  
  // Get prompt from context if available, otherwise use initial prompt
  const prompt = useMemo(() => {
    return images[imageId]?.prompt || initialPrompt;
  }, [images, imageId, initialPrompt]);
  
  const [showSettings, setShowSettings] = useState(false);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);

  const [imageSettings, setImageSettings] = useState<{
    model: ImageModel;
    aspectRatio: AspectRatio;
    imageSize: ImageSize;
    prompt: string;
  } | null>(null);
  
  const ref = useRef<HTMLDivElement>(null);

  // Filter global history for this specific slot if needed, 
  // but for now let's just show the most recent generation for this slot
  // and allow selecting from global history if it matches the prompt?
  // Actually, the user wants "every single one to be kept as backup".
  // So we'll just use the global history and maybe filter by prompt or something.
  // For now, let's just focus on the generation part.

  const slotHistory = useMemo(() => {
    return globalHistory.filter(record => record.prompt === prompt);
  }, [globalHistory, prompt]);

  useEffect(() => {
    if (historyLoading) return;

    if (slotHistory.length > 0 && !imageUrl && !hasStartedLoading) {
      const latest = slotHistory[0];
      setImageUrl(latest.imageUrl);
      setSelectedImageId(latest.id);
      setLoading(false);
      setImageSettings({
        model: latest.model as ImageModel,
        aspectRatio: settings.aspectRatio,
        imageSize: settings.imageSize,
        prompt: latest.prompt
      });
      updateProgress(imageId, { status: 'success', thumbnail: latest.imageUrl });
    }
  }, [slotHistory, imageUrl, hasStartedLoading, imageId, settings.aspectRatio, settings.imageSize, updateProgress, historyLoading]);

  useEffect(() => {
    if (historyLoading || !hasStartedLoading || !isSettingsLoaded || imageUrl) return;

    let isMounted = true;
    const loadImage = async () => {
      try {
        setLoading(true);
        updateProgress(imageId, { status: 'generating', prompt, chapterId, index });
        
        logToSystem(`Initializing Venice AI generation for ${chapterId} — 0${index + 1}`, 'info');
        const result = await generateLookbookImage(prompt, settings);
        
        if (isMounted && result) {
          setImageUrl(result.url);
          setSelectedImageId(result.id);
          setLoading(false);
          setImageSettings({
            model: result.model as ImageModel,
            aspectRatio: settings.aspectRatio,
            imageSize: settings.imageSize,
            prompt: prompt
          });
          updateProgress(imageId, { status: 'success', thumbnail: result.url });
          
          // Add to global history context
          addRecord({
            id: result.id,
            prompt: prompt,
            model: result.model,
            imageUrl: result.url,
            timestamp: new Date().toISOString(),
            type: 'generate',
            settings: safeStringify(settings)
          });

          logToSystem(`Successfully rendered and archived ${chapterId} — 0${index + 1}`, 'success');
        }
      } catch (err: any) {
        console.error("Image generation failed:", err);
        const msg = err.message || "";
        
        if (isMounted) {
          updateProgress(imageId, { status: 'error' });
          logToSystem(`Failure for ${chapterId}: ${msg.substring(0, 50)}...`, 'error');
        }
      }
    };

    loadImage();
    return () => { isMounted = false; };
  }, [prompt, regenerateTrigger, hasStartedLoading, isSettingsLoaded]);

  const handleDownload = async () => {
    if (!imageUrl) return;
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `crix-jakob-${chapterId}-${index + 1}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      logToSystem(`Downloading ${chapterId} — 0${index + 1}`, 'info');
    } catch (err) {
      console.error("Download failed:", err);
      logToSystem("Download failed", "error");
    }
  };

  const handleSelectHistory = (record: any) => {
    setImageUrl(record.imageUrl);
    setSelectedImageId(record.id);
    setImageSettings({
      model: record.model as ImageModel,
      aspectRatio: settings.aspectRatio,
      imageSize: settings.imageSize,
      prompt: record.prompt
    });
  };

  const getImageBorderRadiusClass = () => {
    switch (settings.imageBorderRadius) {
      case 'none': return 'rounded-none';
      case 'small': return 'rounded-sm';
      case 'medium': return 'rounded-md';
      case 'large': return 'rounded-2xl';
      default: return 'rounded-none';
    }
  };

  const getImageShadowClass = () => {
    switch (settings.imageShadow) {
      case 'none': return 'shadow-none';
      case 'small': return 'shadow-sm';
      case 'medium': return 'shadow-md';
      case 'large': return 'shadow-[0_20px_50px_rgba(0,0,0,1)]';
      default: return 'shadow-none';
    }
  };

  return (
    <motion.div
      ref={ref}
      onViewportEnter={() => {
        setActiveImageId(imageId);
        setHasStartedLoading(true);
      }}
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
      }}
      className={`flex-shrink-0 w-[80vw] md:w-[60vw] h-[70vh] relative group overflow-hidden bg-industrial-line/20 snap-center mx-4 ${getImageBorderRadiusClass()} ${getImageShadowClass()}`}
    >
      {loading ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center">
          <div className="w-full max-w-[200px] h-1 bg-industrial-line/50 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-industrial-ink"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 5, ease: "linear", repeat: Infinity }}
            />
          </div>
        </div>
      ) : (
        <img
          src={imageUrl || ""}
          alt={`Lookbook image ${index}`}
          className={`w-full h-full object-cover transition-all duration-700 ease-in-out ${settings.grayscaleImages ? 'grayscale hover:grayscale-0' : ''}`}
          referrerPolicy="no-referrer"
          onError={(e) => {
            console.error(`Image failed to load: ${imageUrl}`);
            logToSystem(`Image failed to load: ${imageUrl}`, 'error');
          }}
          onLoad={() => console.log(`Image loaded successfully: ${imageUrl}`)}
        />
      )}
      
      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-20">
        <button
          onClick={(e) => { e.stopPropagation(); toggleSelection(imageId); }}
          className={`p-2 rounded-sm backdrop-blur-sm transition-colors ${isSelected ? 'bg-industrial-ink text-industrial-bg' : 'bg-industrial-ink/80 text-industrial-bg hover:bg-industrial-ink'}`}
        >
          {isSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
        </button>
      </div>
      
      {settings.showImageInfo && (
        <div className="absolute bottom-8 left-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col gap-2 pointer-events-auto">
          
          {/* History Thumbnails */}
          {slotHistory.length > 1 && (
            <div className="flex items-center gap-2 mb-2 overflow-x-auto no-scrollbar pb-2">
              <div className="flex items-center gap-1 text-[7px] uppercase tracking-widest text-industrial-bg bg-industrial-ink/80 px-2 py-1 backdrop-blur-sm rounded-sm shrink-0">
                <History className="w-2.5 h-2.5" /> History
              </div>
              {slotHistory.map((record) => (
                <button
                  key={record.id}
                  onClick={(e) => { e.stopPropagation(); handleSelectHistory(record); }}
                  className={`relative w-10 h-10 shrink-0 overflow-hidden border-2 transition-all ${
                    selectedImageId === record.id 
                      ? 'border-industrial-bg scale-110 z-10 shadow-lg' 
                      : 'border-transparent opacity-60 hover:opacity-100 hover:border-industrial-bg/50'
                  }`}
                  title={`Generated with ${record.model}`}
                >
                  <img 
                    src={record.imageUrl} 
                    alt="History thumbnail" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[9px] uppercase tracking-[0.3em] text-industrial-bg bg-industrial-ink px-2 py-1 font-medium">
                {chapterId} — 0{index + 1}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={(e) => { e.stopPropagation(); setShowSettings(true); }}
                className="p-2 bg-industrial-ink/80 text-industrial-bg backdrop-blur-sm hover:bg-industrial-ink transition-colors rounded-sm"
                title="View GenAI Settings"
              >
                <Sliders className="w-3 h-3" />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); handleDownload(); }}
                className="p-2 bg-industrial-ink/80 text-industrial-bg backdrop-blur-sm hover:bg-industrial-ink transition-colors rounded-sm"
                title="Download Image"
              >
                <Download className="w-3 h-3" />
              </button>
            </div>
          </div>
          <p className="text-[10px] text-industrial-grey bg-industrial-ink/80 backdrop-blur-sm p-3 font-light leading-relaxed border-l border-industrial-line line-clamp-2">
            {prompt}
          </p>
        </div>
      )}

      {/* Individual Image Settings Modal */}
      <AnimatePresence>
        {showSettings && imageSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-industrial-ink/95 backdrop-blur-md p-8 flex flex-col justify-center"
          >
            <button 
              onClick={() => setShowSettings(false)}
              className="absolute top-4 right-4 p-2 text-industrial-bg hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <Terminal className="w-4 h-4 text-industrial-grey" />
                <h3 className="text-[10px] uppercase tracking-[0.4em] font-medium text-industrial-bg">Frame Parameters</h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-[8px] uppercase tracking-widest text-industrial-grey">
                    <Cpu className="w-3 h-3" /> Model
                  </div>
                  <div className="text-[10px] font-mono text-industrial-bg truncate">{imageSettings.model}</div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-[8px] uppercase tracking-widest text-industrial-grey">
                    <Terminal className="w-3 h-3" /> Resolution
                  </div>
                  <div className="text-[10px] font-mono text-industrial-bg">{imageSettings.aspectRatio} @ {imageSettings.imageSize}</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-[8px] uppercase tracking-widest text-industrial-grey">
                  <MessageSquare className="w-3 h-3" /> Prompt DNA
                </div>
                <div className="text-[10px] font-mono text-industrial-bg/80 leading-relaxed max-h-40 overflow-y-auto no-scrollbar p-3 bg-white/5 rounded-sm border border-white/10">
                  {imageSettings.prompt}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
