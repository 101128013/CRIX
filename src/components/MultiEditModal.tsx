import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Wand2, Sparkles, Layers, Image as ImageIcon } from 'lucide-react';

interface MultiEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (instruction: string) => void;
  count: number;
}

export default function MultiEditModal({ isOpen, onClose, onConfirm, count }: MultiEditModalProps) {
  const [instruction, setInstruction] = useState('');

  const suggestions = [
    "Make this a 90s cartoon",
    "Remove the background",
    "make this a photo",
    " ",
    "Change the background to a beach while keeping the person in the exact same position, scale, and pose.",
    "Using this style, a bunny, a dog and a cat are having a tea party seated around a small white table",
    "Using this style, a panda astronaut riding a unicorn"
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-industrial-ink/90 backdrop-blur-sm"
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-lg bg-industrial-bg border border-industrial-line/20 shadow-2xl overflow-hidden"
        >
          <div className="p-6 border-b border-industrial-line/10 flex items-center justify-between bg-industrial-ink text-industrial-bg">
            <div className="flex items-center gap-3">
              <Layers className="w-4 h-4 text-industrial-grey" />
              <h2 className="text-xs font-mono uppercase tracking-[0.3em]">Batch Edit: {count} Items</h2>
            </div>
            <button onClick={onClose} className="hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-8 space-y-8">
            <div className="space-y-4">
              <label className="block text-[10px] uppercase tracking-widest text-industrial-grey font-bold">
                Global Transformation Instruction
              </label>
              <div className="relative">
                <textarea
                  value={instruction}
                  onChange={(e) => setInstruction(e.target.value)}
                  placeholder="Describe the change to apply to all selected images..."
                  className="w-full bg-industrial-line/5 border border-industrial-line/20 p-4 font-mono text-xs focus:outline-none focus:border-industrial-ink min-h-[120px] resize-none"
                />
                <Wand2 className="absolute bottom-4 right-4 w-4 h-4 text-industrial-grey/30" />
              </div>
            </div>

            <div className="space-y-3">
              <div className="text-[8px] uppercase tracking-widest text-industrial-grey font-bold flex items-center gap-2">
                <Sparkles className="w-3 h-3" />
                Quick Presets
              </div>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => setInstruction(s)}
                    className="text-[9px] font-mono uppercase tracking-tight px-3 py-2 bg-industrial-line/5 border border-industrial-line/10 hover:bg-industrial-ink hover:text-industrial-bg transition-all"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4">
              <button
                onClick={() => {
                  onConfirm(instruction);
                  onClose();
                }}
                className="w-full bg-industrial-ink text-industrial-bg py-4 font-mono text-xs font-bold uppercase tracking-[0.2em] hover:bg-black transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              >
                <Sparkles className="w-4 h-4" />
                Execute Multi-Edit
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
