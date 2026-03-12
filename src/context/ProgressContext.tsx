import React, { createContext, useContext, useState, useCallback } from 'react';

export type GenerationStatus = 'pending' | 'generating' | 'success' | 'error';
export type LogType = 'info' | 'warn' | 'error' | 'success';

export interface SystemLog {
  id: string;
  message: string;
  type: LogType;
  timestamp: number;
}

export interface ImageProgress {
  id: string;
  status: GenerationStatus;
  thumbnail?: string;
  prompt: string;
  chapterId: string;
  index: number;
}

interface ProgressContextType {
  images: Record<string, ImageProgress>;
  updateProgress: (id: string, update: Partial<ImageProgress>) => void;
  activeImageId: string | null;
  setActiveImageId: (id: string | null) => void;
  totalImages: number;
  completedCount: number;
  logs: SystemLog[];
  addLog: (message: string, type?: LogType) => void;
}

const ProgressContext = createContext<ProgressContextType | undefined>(undefined);

export function ProgressProvider({ children, totalImages }: { children: React.ReactNode; totalImages: number }) {
  const [images, setImages] = useState<Record<string, ImageProgress>>({});
  const [activeImageId, setActiveImageId] = useState<string | null>(null);
  const [logs, setLogs] = useState<SystemLog[]>([]);

  const updateProgress = useCallback((id: string, update: Partial<ImageProgress>) => {
    setImages(prev => ({
      ...prev,
      [id]: {
        ...(prev[id] || { id, status: 'pending', prompt: '', chapterId: '', index: 0 }),
        ...update,
      },
    }));
  }, []);

  const addLog = useCallback((message: string, type: LogType = 'info') => {
    const newLog: SystemLog = {
      id: Math.random().toString(36).substring(7),
      message,
      type,
      timestamp: Date.now(),
    };
    setLogs(prev => [newLog, ...prev].slice(0, 50)); // Keep last 50 logs
  }, []);

  const completedCount = (Object.values(images) as ImageProgress[]).filter(img => img.status === 'success').length;

  return (
    <ProgressContext.Provider value={{ 
      images, 
      updateProgress, 
      activeImageId, 
      setActiveImageId, 
      totalImages, 
      completedCount,
      logs,
      addLog
    }}>
      {children}
    </ProgressContext.Provider>
  );
}

export function useProgress() {
  const context = useContext(ProgressContext);
  if (!context) {
    throw new Error('useProgress must be used within a ProgressProvider');
  }
  return context;
}
