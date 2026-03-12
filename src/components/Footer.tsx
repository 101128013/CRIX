import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Wand2, Send, Loader2, Settings2, Terminal, ChevronUp, ChevronDown, X, MessageSquare, Database } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { useProgress, LogType } from '../context/ProgressContext';
import { useHistory } from '../context/HistoryContext';
import { generateLookbookImage, editImage } from '../services/imageService';
import { logToSystem } from '../utils/logger';

import { auth, signInWithGoogle, onAuthStateChanged } from '../services/firebase';
import { User, signOut } from 'firebase/auth';

export default function Footer() {
  const { settings, setIsSettingsOpen } = useSettings();
  const { activeImageId, setActiveImageId, images, logs, addLog, totalImages } = useProgress();
  const { history, addRecord } = useHistory();
  const [user, setUser] = useState<User | null>(auth.currentUser);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Sign out error", error);
    }
  };

  const [prompt, setPrompt] = useState('');
  const [instruction, setInstruction] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isLogOpen, setIsLogOpen] = useState(false);
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleLog = (e: any) => {
      const { message, type } = e.detail;
      addLog(message, type);
    };
    window.addEventListener('system-log', handleLog);
    return () => window.removeEventListener('system-log', handleLog);
  }, [addLog]);

  useEffect(() => {
    if (isLogOpen && logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs, isLogOpen]);

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    logToSystem(`Starting generation with ${settings.model}...`, 'info');

    try {
      const result = await generateLookbookImage(prompt, {
        model: settings.model,
        aspectRatio: settings.aspectRatio,
        imageSize: settings.imageSize,
        seed: settings.seed
      });

      if (result) {
        addRecord({
          id: result.id,
          prompt: prompt,
          model: result.model,
          imageUrl: result.url,
          timestamp: new Date().toISOString(),
          type: 'generate',
          settings: JSON.stringify(settings)
        });
        setPrompt('');
        logToSystem('Generation complete.', 'success');
      }
    } catch (error: any) {
      logToSystem(`Generation failed: ${error.message}`, 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEdit = async () => {
    if (!activeImageId || isEditing) return;

    const activeImage = images[activeImageId];
    if (!activeImage?.thumbnail) {
      logToSystem('No image data found for editing', 'error');
      return;
    }

    setIsEditing(true);
    logToSystem(`Applying edit to active frame...`, 'info');

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
          settings: JSON.stringify(settings)
        });
        setInstruction('');
        logToSystem('Edit complete.', 'success');
      }
    } catch (error: any) {
      logToSystem(`Edit failed: ${error.message}`, 'error');
    } finally {
      setIsEditing(false);
    }
  };

  const getLogColor = (type: LogType) => {
    switch (type) {
      case 'error': return 'text-red-500';
      case 'warn': return 'text-yellow-500';
      case 'success': return 'text-emerald-500';
      default: return 'text-industrial-grey';
    }
  };

  const activeImage = useMemo(() => {
    if (!activeImageId) return null;
    return images[activeImageId];
  }, [images, activeImageId]);

  return (
    <>
      <AnimatePresence>
        {isLogOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsLogOpen(false)}
              className="fixed inset-0 bg-black/20 z-[40]"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed bottom-[112px] left-0 right-0 h-[60vh] bg-industrial-ink/95 backdrop-blur-xl border-t border-industrial-line z-[60] flex flex-col"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-industrial-line">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-industrial-grey" />
                  <h3 className="text-[10px] uppercase tracking-[0.4em] font-medium text-industrial-bg">System Telemetry Log</h3>
                </div>
                <button onClick={() => setIsLogOpen(false)} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                  <ChevronDown className="w-4 h-4 text-industrial-grey" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2 font-mono text-[10px] tracking-wider">
                {logs.slice().reverse().map((log) => (
                  <div key={log.id} className="flex gap-4">
                    <span className="text-industrial-grey/50 shrink-0">
                      [{new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}]
                    </span>
                    <span className={`shrink-0 ${getLogColor(log.type)} uppercase`}>
                      [{log.type.padEnd(7)}]
                    </span>
                    <span className="text-industrial-bg/80 break-words">
                      {log.message}
                    </span>
                  </div>
                ))}
                <div ref={logEndRef} />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="shrink-0 z-50 bg-industrial-ink/95 backdrop-blur-xl border-t border-industrial-line flex flex-col font-mono text-[10px] uppercase tracking-widest text-industrial-grey">
        
        {/* Line 0: Sliding Prompts Marquee */}
        <div className="h-6 border-b border-industrial-line/30 bg-industrial-bg/10 overflow-hidden flex items-center relative">
          <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-industrial-ink to-transparent z-10" />
          <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-industrial-ink to-transparent z-10" />
          <motion.div 
            animate={{ x: [0, -2000] }}
            transition={{ 
              duration: 60, 
              repeat: Infinity, 
              ease: "linear" 
            }}
            className="flex items-center gap-12 whitespace-nowrap px-12"
          >
            {history.length > 0 ? (
              history.map((record, i) => (
                <div key={`${record.id}-${i}`} className="flex items-center gap-3">
                  <span className="text-industrial-grey/40">[{record.model}]</span>
                  <span className="text-industrial-bg/70">{record.prompt}</span>
                  <span className="w-1 h-1 bg-industrial-grey/30 rounded-full" />
                </div>
              ))
            ) : (
              <span className="text-industrial-grey/40 italic">Awaiting telemetry data... No active prompts in buffer...</span>
            )}
            {/* Duplicate for seamless loop if history is short */}
            {history.length > 0 && history.length < 5 && history.map((record, i) => (
              <div key={`dup-${record.id}-${i}`} className="flex items-center gap-3">
                <span className="text-industrial-grey/40">[{record.model}]</span>
                <span className="text-industrial-bg/70">{record.prompt}</span>
                <span className="w-1 h-1 bg-industrial-grey/30 rounded-full" />
              </div>
            ))}
          </motion.div>
        </div>

        {/* Line 1: Input (Prompt / Chat) */}
        <div className="h-12 border-b border-industrial-line/30 flex items-center px-4 bg-industrial-bg/5">
          {activeImageId ? (
            <div className="flex-1 flex items-center gap-4">
              <div className="flex items-center gap-2 text-industrial-bg shrink-0">
                <Wand2 className="w-4 h-4" />
                <span>Edit Frame {activeImageId}</span>
              </div>
              <input
                type="text"
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleEdit()}
                placeholder="Instruct the AI to modify this frame..."
                className="flex-1 bg-transparent border-none focus:ring-0 text-industrial-bg placeholder:text-industrial-grey/50"
              />
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleEdit}
                  disabled={isEditing}
                  className="bg-industrial-bg text-industrial-ink px-4 py-1.5 hover:bg-white transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {isEditing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                  {isEditing ? 'Refining' : 'Apply'}
                </button>
                <button
                  onClick={() => setActiveImageId(null)}
                  className="p-1.5 hover:bg-white/10 transition-colors text-industrial-grey"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center gap-4">
              <div className="flex items-center gap-2 text-industrial-bg shrink-0">
                <Sparkles className="w-4 h-4" />
                <span>Generate</span>
              </div>
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                placeholder="Describe a new scene for Crix & Jakob..."
                className="flex-1 bg-transparent border-none focus:ring-0 text-industrial-bg placeholder:text-industrial-grey/50"
              />
              <button
                onClick={handleGenerate}
                disabled={!prompt.trim() || isGenerating}
                className="bg-industrial-bg text-industrial-ink px-4 py-1.5 hover:bg-white transition-all disabled:opacity-50 flex items-center gap-2 shrink-0"
              >
                {isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                {isGenerating ? 'Processing' : 'Generate'}
              </button>
            </div>
          )}
        </div>

        {/* Line 2: Sliding Texts / Logs */}
        <div 
          className="h-8 border-b border-industrial-line/30 flex items-center px-4 cursor-pointer hover:bg-white/5 transition-colors overflow-hidden"
          onClick={() => setIsLogOpen(!isLogOpen)}
        >
          <div className="flex-1 relative h-full flex items-center overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={logs.length > 0 ? logs[0].id : 'idle'}
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -10, opacity: 0 }}
                className="flex items-center gap-4 w-full"
              >
                {logs.length > 0 ? (
                  <div className="flex items-center gap-3 w-full">
                    <span className={`shrink-0 ${getLogColor(logs[0].type)}`}>
                      [{logs[0].type}]
                    </span>
                    <span className="text-industrial-bg/90 truncate">
                      {logs[0].message}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 w-full">
                    <span className="text-industrial-grey shrink-0">[SYSTEM]</span>
                    <span className="text-industrial-grey truncate">AWAITING TELEMETRY... STANDBY...</span>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
          <div className="flex items-center pl-4 border-l border-industrial-line/30 h-full shrink-0">
            {isLogOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
          </div>
        </div>

        {/* Line 3: Site Functions (Configs, LLM Chats, Prompts per page) */}
        {/* Removed */}
      </div>
    </>
  );
}
