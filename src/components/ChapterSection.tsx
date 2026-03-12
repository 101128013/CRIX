import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { Chapter } from "../types";
import { useSettings } from "../context/SettingsContext";

interface ChapterSectionProps {
  chapter: Chapter;
}

export default function ChapterSection({ chapter }: ChapterSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { settings } = useSettings();
  
  const { scrollXProgress } = useScroll({
    target: ref,
    offset: ["start end", "center center", "end start"],
  });

  const opacity = useTransform(scrollXProgress, [0, 0.4, 0.6, 1], [0, 1, 1, 0]);
  const y = useTransform(scrollXProgress, [0, 0.5, 1], [50, 0, -50]);

  return (
    <motion.div
      ref={ref}
      style={{ opacity }}
      className="flex-shrink-0 w-[100vw] h-screen flex flex-col justify-center px-[10vw] snap-center"
    >
      {settings.showChapterTitles && (
        <>
          <motion.h2 
            style={{ y }}
            className="text-massive font-extralight text-industrial-ink mb-8"
          >
            {chapter.title}
          </motion.h2>
          
          <div className="max-w-2xl">
            <p className="text-xl md:text-2xl font-light text-industrial-grey leading-relaxed italic">
              {chapter.story}
            </p>
            <div className="mt-8 h-[1px] w-24 bg-industrial-line" />
          </div>
        </>
      )}
    </motion.div>
  );
}
