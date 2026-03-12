import React, { useRef, useEffect, useState } from "react";
import { CHAPTERS } from "../constants";
import ChapterSection from "./ChapterSection";
import ImageCard from "./ImageCard";
import SettingsModal from "./SettingsModal";
import { useSettings } from "../context/SettingsContext";
import { useProgress } from "../context/ProgressContext";
import { useHistory } from "../context/HistoryContext";
import { useSelection } from "../context/SelectionContext";
import MultiEditModal from "./MultiEditModal";
import { motion, useScroll, MotionValue } from "motion/react";
import { Sliders, Info, Cpu, DollarSign, Terminal, History, Wand2 } from "lucide-react";
import { editImage } from "../services/imageService";
import { logToSystem } from "../utils/logger";
import { safeStringify } from "../utils/json";

export default function HorizontalGallery() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const { settings, estimatedTotalCost, isSettingsOpen, setIsSettingsOpen } = useSettings();
  const { setActiveImageId, images, updateProgress } = useProgress();
  const { history, loading: historyLoading, addRecord } = useHistory();
  const { selectedIds, clearSelection } = useSelection();
  const [isMultiEditOpen, setIsMultiEditOpen] = useState(false);
  
  const { scrollXProgress } = useScroll({
    container: scrollRef
  }) as { scrollXProgress: MotionValue<number> };

  const handleProgressInteraction = (clientX: number) => {
    if (!progressBarRef.current || !scrollRef.current) return;
    
    const rect = progressBarRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percentage = x / rect.width;
    
    const scrollWidth = scrollRef.current.scrollWidth - scrollRef.current.clientWidth;
    scrollRef.current.scrollTo({
      left: scrollWidth * percentage,
      behavior: isDragging ? "auto" : "smooth"
    });
  };

  const onMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    handleProgressInteraction(e.clientX);
  };

  const onMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      handleProgressInteraction(e.clientX);
    }
  };

  const onMouseUp = () => {
    setIsDragging(false);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    handleProgressInteraction(e.touches[0].clientX);
  };

  const onTouchMove = (e: TouchEvent) => {
    if (isDragging) {
      handleProgressInteraction(e.touches[0].clientX);
    }
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
      window.addEventListener('touchmove', onTouchMove);
      window.addEventListener('touchend', onMouseUp);
    } else {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onMouseUp);
    };
  }, [isDragging]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      if (e.deltaY === 0) return;
      e.preventDefault();
      el.scrollTo({
        left: el.scrollLeft + e.deltaY * 3, // Multiplier for "viscous" feel
        behavior: "smooth",
      });
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const getCrixTextSizeClass = () => {
    switch (settings.crixTextSize) {
      case 'small': return 'text-lg';
      case 'medium': return 'text-2xl';
      case 'large': return 'text-4xl';
      case 'massive': return 'text-6xl';
      default: return 'text-2xl';
    }
  };

  const getHeaderPositionClass = () => {
    switch (settings.crixTextPosition) {
      case 'top-left': return 'top-0 left-0 justify-start items-start';
      case 'top-center': return 'top-0 left-0 justify-center items-start';
      case 'top-right': return 'top-0 left-0 justify-end items-start';
      case 'bottom-left': return 'bottom-0 left-0 justify-start items-end';
      case 'bottom-center': return 'bottom-0 left-0 justify-center items-end';
      case 'bottom-right': return 'bottom-0 left-0 justify-end items-end';
      default: return 'top-0 left-0 justify-start items-start';
    }
  };

  const getProgressBarColorClass = () => {
    switch (settings.progressBarColor) {
      case 'ink': return 'bg-industrial-ink';
      case 'grey': return 'bg-industrial-grey';
      case 'accent': return 'bg-white';
      default: return 'bg-industrial-ink';
    }
  };

  const getImageGapClass = () => {
    switch (settings.imageGap) {
      case 'small': return 'gap-4';
      case 'medium': return 'gap-12';
      case 'large': return 'gap-24';
      default: return 'gap-12';
    }
  };

  const getImagePaddingClass = () => {
    switch (settings.imagePadding) {
      case 'none': return 'px-0';
      case 'small': return 'px-12';
      case 'large': return 'px-24';
      default: return 'px-12';
    }
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
      case 'large': return 'shadow-2xl';
      default: return 'shadow-none';
    }
  };

  return (
    <div className="relative h-full w-full bg-industrial-bg">
      {/* Background noise/texture */}
      {settings.showBackgroundNoise && (
        <div className="fixed inset-0 pointer-events-none opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]" />
      )}
      
      {/* Header */}
      {settings.showHeader && (
        <header className={`fixed w-full p-8 z-50 flex items-center mix-blend-difference pointer-events-none ${getHeaderPositionClass()}`}>
          <h1 className={`${getCrixTextSizeClass()} font-thin tracking-[0.5em] text-industrial-ink`}>
            CRIX
          </h1>
          {selectedIds.length > 1 && (
            <button
              onClick={() => setIsMultiEditOpen(true)}
              className="pointer-events-auto ml-8 flex items-center gap-2 bg-industrial-ink text-industrial-bg px-4 py-2 rounded-sm text-[10px] uppercase tracking-widest"
            >
              <Wand2 className="w-3 h-3" />
              Multi-Edit ({selectedIds.length})
            </button>
          )}
        </header>
      )}

      <MultiEditModal 
        isOpen={isMultiEditOpen} 
        onClose={() => setIsMultiEditOpen(false)} 
        onConfirm={async (instruction) => {
          setIsMultiEditOpen(false);
          logToSystem(`Batch processing ${selectedIds.length} frames...`, 'info');
          
          for (const id of selectedIds) {
            const activeImage = images[id];
            if (!activeImage?.thumbnail) continue;

            try {
              const result = await editImage(instruction, activeImage.thumbnail, {
                model: settings.model,
                aspectRatio: settings.aspectRatio,
                seed: settings.seed,
                output_format: settings.output_format
              });

              if (result) {
                addRecord({
                  id: result.id,
                  prompt: instruction,
                  model: result.model,
                  imageUrl: result.imageUrl,
                  timestamp: new Date().toISOString(),
                  type: 'edit',
                  settings: safeStringify(settings)
                });
                
                // Update the gallery image
                updateProgress(id, { thumbnail: result.imageUrl });
              }
            } catch (error: any) {
              logToSystem(`Edit failed for ${id}: ${error.message}`, 'error');
            }
          }
          
          clearSelection();
          logToSystem('Batch processing complete.', 'success');
        }}
        count={selectedIds.length}
      />

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

      {/* Main Scroll Container */}
      <div 
        ref={scrollRef}
        className="horizontal-scroll-container no-scrollbar h-full"
      >
        {/* Start Photo Section */}
        {settings.startPhoto && (
          <div className={`flex-shrink-0 flex items-center justify-center h-full w-screen snap-center ${getImagePaddingClass()}`}>
            <div className={`relative h-[80vh] w-[80vw] max-w-5xl flex items-center justify-center overflow-hidden bg-industrial-line/20 ${getImageBorderRadiusClass()} ${getImageShadowClass()}`}>
              <img 
                src={`data:${settings.startPhoto.mimeType};base64,${settings.startPhoto.data}`} 
                alt="Start Photo" 
                className={`w-full h-full object-cover transition-all duration-700 ease-in-out ${settings.grayscaleImages ? 'grayscale hover:grayscale-0' : ''}`}
              />
            </div>
          </div>
        )}

        {/* Chapters and Images */}
        {CHAPTERS.map((chapter) => (
          <div key={chapter.id} className={`flex items-center ${getImageGapClass()}`}>
            {settings.showChapterTitles && <ChapterSection chapter={chapter} />}
            
            <motion.div 
              className={`flex items-center ${getImageGapClass()} ${getImagePaddingClass()}`}
              variants={{
                hidden: { opacity: 0 },
                visible: { opacity: 1, transition: { staggerChildren: 0.2 } }
              }}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: false, amount: 0.1 }}
            >
              {chapter.imagePrompts.map((prompt, idx) => (
                <ImageCard 
                  key={`${chapter.id}-${idx}`} 
                  prompt={prompt} 
                  chapterId={chapter.id}
                  index={idx}
                />
              ))}
            </motion.div>
          </div>
        ))}

        {/* History Section */}
        {history.length > 0 && (
          <div className={`flex items-center ${getImageGapClass()}`}>
            <div className="flex-shrink-0 w-[50vw] h-full flex flex-col justify-center items-center snap-center px-12">
              <div className="flex items-center gap-4 mb-8">
                <History className="w-8 h-8 text-industrial-ink" />
                <h2 className="text-4xl font-thin tracking-[0.4em] uppercase text-industrial-ink">Archive</h2>
              </div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-industrial-grey text-center max-w-xs">
                Permanent record of all Venice AI generations and edits.
              </p>
            </div>

            <div className={`flex items-center ${getImageGapClass()} ${getImagePaddingClass()}`}>
              {history.map((record) => (
                <div key={record.id} className="flex-shrink-0 flex items-center justify-center h-full w-[80vw] max-w-4xl snap-center">
                  <div className={`relative h-[70vh] w-full bg-industrial-line/10 overflow-hidden ${getImageBorderRadiusClass()} ${getImageShadowClass()} group`}>
                    <img 
                      src={record.imageUrl} 
                      alt={record.prompt} 
                      className={`w-full h-full object-cover transition-all duration-700 ${settings.grayscaleImages ? 'grayscale hover:grayscale-0' : ''}`}
                    />
                    <div className="absolute inset-0 bg-industrial-ink/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-8">
                      <div className="space-y-2">
                        <div className="text-[8px] font-mono uppercase tracking-widest text-industrial-bg/60">{new Date(record.timestamp).toLocaleString()}</div>
                        <div className="text-xs font-mono text-industrial-bg line-clamp-3 uppercase tracking-tight">{record.prompt}</div>
                        <div className="flex items-center gap-4 pt-4">
                          <div className="text-[8px] font-mono uppercase tracking-widest px-2 py-1 border border-industrial-bg/20 text-industrial-bg/80">{record.model}</div>
                          <div className="text-[8px] font-mono uppercase tracking-widest px-2 py-1 border border-industrial-bg/20 text-industrial-bg/80">{record.type}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Outro Section / Technical Info */}
        {settings.showTechnicalInfo && (
          <motion.section 
            onViewportEnter={() => setActiveImageId(null)}
            className="flex-shrink-0 w-[100vw] h-screen flex flex-col justify-center items-center snap-center bg-industrial-ink text-industrial-bg"
          >
            <div className="w-full max-w-4xl px-12 flex justify-center items-center">
              <div className="w-full max-w-md bg-white/5 backdrop-blur-md p-8 rounded-sm border border-white/10 space-y-6">
                <div className="flex items-center gap-3 mb-4">
                  <Info className="w-4 h-4 text-industrial-grey" />
                  <h3 className="text-[10px] uppercase tracking-[0.4em] font-medium">Technical Specification</h3>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <Cpu className="w-4 h-4 mt-1 text-industrial-grey" />
                    <div>
                      <div className="text-[9px] uppercase tracking-widest text-industrial-grey mb-1">Model & Engine</div>
                      <div className="text-xs font-mono">{settings.model}</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <Terminal className="w-4 h-4 mt-1 text-industrial-grey" />
                    <div>
                      <div className="text-[9px] uppercase tracking-widest text-industrial-grey mb-1">Configuration</div>
                      <div className="text-xs font-mono">{settings.aspectRatio} @ {settings.imageSize}</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <DollarSign className="w-4 h-4 mt-1 text-industrial-grey" />
                    <div>
                      <div className="text-[9px] uppercase tracking-widest text-industrial-grey mb-1">Estimated Cost</div>
                      <div className="text-xs font-mono">~${(estimatedTotalCost / 40).toFixed(2)} per frame / ${estimatedTotalCost.toFixed(2)} total</div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </motion.section>
        )}
      </div>

      {/* Footer / Interactive Progress Bar */}
      <footer className="fixed bottom-[84px] left-8 right-8 z-50 flex flex-col gap-2 pointer-events-none">
        {settings.showProgressBar && (
          <div 
            ref={progressBarRef}
            className="h-8 w-full flex items-center cursor-pointer group pointer-events-auto"
            onMouseDown={onMouseDown}
            onTouchStart={onTouchStart}
          >
            <div className="w-full h-[1px] bg-industrial-line/30 relative overflow-visible">
              {/* Active Progress */}
              <motion.div 
                style={{ scaleX: scrollXProgress }}
                className={`absolute inset-0 origin-left h-[2px] -top-[0.5px] ${getProgressBarColorClass()}`}
              />
              
              {/* Draggable Handle */}
              <motion.div
                style={{ left: `${(scrollXProgress.get() || 0) * 100}%` }}
                className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-lg border border-industrial-bg ${getProgressBarColorClass()}`}
              />
            </div>
          </div>
        )}
      </footer>
    </div>
  );
}

