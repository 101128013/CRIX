import { motion } from "motion/react";
import { useState, useEffect } from "react";

interface MarqueePromptBarProps {
  prompt: string;
  onEdit: (newPrompt: string) => void;
}

export default function MarqueePromptBar({ prompt, onEdit }: MarqueePromptBarProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedPrompt, setEditedPrompt] = useState(prompt);

  useEffect(() => {
    setEditedPrompt(prompt);
  }, [prompt]);

  if (isEditing) {
    return (
      <div className="absolute bottom-0 left-0 right-0 z-50 bg-industrial-ink p-4 border border-industrial-line">
        <textarea
          value={editedPrompt}
          onChange={(e) => setEditedPrompt(e.target.value)}
          className="w-full bg-industrial-bg text-industrial-ink text-[10px] p-2 border border-industrial-line"
          rows={3}
        />
        <div className="flex justify-end gap-4 mt-2">
          <button onClick={() => setIsEditing(false)} className="text-industrial-grey text-[8px] uppercase tracking-widest hover:text-industrial-ink">Cancel</button>
          <button onClick={() => { onEdit(editedPrompt); setIsEditing(false); }} className="text-industrial-ink text-[8px] uppercase tracking-widest font-bold hover:text-industrial-grey">Save</button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="h-8 w-full bg-industrial-ink/90 text-industrial-bg flex items-center overflow-hidden cursor-pointer pointer-events-auto border-t border-industrial-line"
      onClick={() => setIsEditing(true)}
    >
      <motion.div
        className="whitespace-nowrap inline-block text-[8px] uppercase tracking-[0.2em]"
        animate={{ x: ["100%", "-100%"] }}
        transition={{ duration: 20, ease: "linear", repeat: Infinity }}
      >
        {prompt.toUpperCase()}
      </motion.div>
    </div>
  );
}
