import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useProgress } from "../context/ProgressContext";
import { CHAPTERS } from "../constants";

export default function ProgressTracker() {
  const [isOpen, setIsOpen] = useState(false);
  const { images, completedCount, totalImages } = useProgress();

  const allPrompts = CHAPTERS.flatMap(c => 
    c.imagePrompts.map((p, i) => ({ chapterId: c.id, index: i, prompt: p }))
  );

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-8 right-8 z-[60] flex items-center gap-3 bg-industrial-ink/80 backdrop-blur-md border border-industrial-line px-4 py-2 rounded-full hover:bg-industrial-ink transition-all group"
      >
        <div className="relative w-4 h-4">
          <svg className="w-4 h-4 transform -rotate-90">
            <circle
              cx="8"
              cy="8"
              r="7"
              stroke="currentColor"
              strokeWidth="1.5"
              fill="transparent"
              className="text-industrial-grey/20"
            />
            <circle
              cx="8"
              cy="8"
              r="7"
              stroke="currentColor"
              strokeWidth="1.5"
              fill="transparent"
              strokeDasharray={44}
              strokeDashoffset={44 - (44 * completedCount) / totalImages}
              className="text-emerald-500 transition-all duration-500"
            />
          </svg>
        </div>
        <span className="text-[10px] uppercase tracking-[0.2em] text-industrial-grey group-hover:text-industrial-bg transition-colors">
          Telemetry {completedCount}/{totalImages}
        </span>
      </button>

      {/* Overlay Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-industrial-bg/80 backdrop-blur-sm z-[70]"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-screen w-full md:w-[450px] bg-industrial-ink z-[80] shadow-2xl border-l border-industrial-line flex flex-col"
            >
              <div className="p-8 border-bottom border-industrial-line flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-extralight tracking-widest text-industrial-bg uppercase">Lookbook Telemetry</h2>
                  <p className="text-[10px] text-industrial-grey uppercase tracking-widest mt-1">
                    {completedCount} of {totalImages} frames rendered
                  </p>
                </div>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="text-industrial-grey hover:text-industrial-bg transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 no-scrollbar">
                <div className="grid grid-cols-4 gap-3">
                  {allPrompts.map((item, i) => {
                    const id = `${item.chapterId}-${item.index}`;
                    const data = images[id];
                    
                    return (
                      <div 
                        key={id}
                        className="aspect-square bg-industrial-bg/5 border border-industrial-line/30 rounded-sm relative overflow-hidden group"
                      >
                        {data?.status === 'success' ? (
                          <img 
                            src={data.thumbnail} 
                            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                            alt=""
                          />
                        ) : data?.status === 'generating' ? (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-4 h-4 border border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
                          </div>
                        ) : data?.status === 'error' ? (
                          <div className="absolute inset-0 flex items-center justify-center text-red-500/50">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </div>
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-industrial-grey/10">
                            <span className="text-[8px] font-mono">{i + 1}</span>
                          </div>
                        )}
                        
                        {/* Tooltip on hover */}
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-industrial-ink/90 p-2 transition-opacity pointer-events-none flex flex-col justify-end">
                          <p className="text-[7px] text-industrial-bg uppercase tracking-tighter line-clamp-3 leading-tight">
                            {item.prompt}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="p-8 border-t border-industrial-line bg-industrial-bg/5">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-[10px] uppercase tracking-widest text-industrial-grey">Overall Progress</span>
                  <span className="text-[10px] font-mono text-industrial-grey">{Math.round((completedCount / totalImages) * 100)}%</span>
                </div>
                <div className="w-full h-[2px] bg-industrial-line/30 relative">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(completedCount / totalImages) * 100}%` }}
                    className="absolute inset-0 bg-emerald-500"
                  />
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
