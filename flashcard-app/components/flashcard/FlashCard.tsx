"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Word } from "@/app/types/word";
import { Check, Sparkles, Volume2 } from "lucide-react";

const SHOJI_DELAY = 1.15;

type Props = {
  word: Word;
  onToggleLearned: (id: string, learned: boolean) => void;
};

const POS_COLORS: Record<string, string> = {
  noun:         "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300",
  verb:         "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300",
  adjective:    "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300",
  adverb:       "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300",
  phrase:       "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300",
  preposition:  "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300",
  conjunction:  "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300",
  pronoun:      "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300",
  interjection: "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300",
};

export default function FlashCard({ word, onToggleLearned }: Props) {
  const [flip, setFlip] = useState(false);
  const [voice, setVoice] = useState<SpeechSynthesisVoice | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const synth = window.speechSynthesis;
    const load = () => {
      const voices = synth.getVoices();
      setVoice(
        voices.find((v) => v.lang === "en-US" && v.name.toLowerCase().includes("samantha")) ||
        voices.find((v) => v.lang === "en-US" && v.name.toLowerCase().includes("zira")) ||
        voices.find((v) => v.lang === "en-US") ||
        null
      );
    };
    load();
    synth.onvoiceschanged = load;
  }, []);

  const speak = (text: string) => {
    if (typeof window === "undefined") return;
    const synth = window.speechSynthesis;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "en-US";
    u.rate = 0.88;
    u.pitch = 1.1;
    if (voice) u.voice = voice;
    synth.speak(u);
  };

  const posClass = POS_COLORS[(word.partOfSpeech || "").toLowerCase()] ?? POS_COLORS["noun"];

  return (
    <motion.div
      className="cursor-pointer"
      style={{ perspective: 1200 }}
      onClick={() => setFlip((f) => !f)}
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
    >
      <motion.div
        className="relative w-80 h-52"
        animate={{ rotateY: flip ? 180 : 0 }}
        transition={{ duration: 0.65, type: "spring", stiffness: 90, damping: 16 }}
        style={{ transformStyle: "preserve-3d" }}
      >

        {/* ── Learned toggle ── */}
        <div className="absolute -top-3 -right-3 z-20" style={{ backfaceVisibility: "hidden" }}>
          <motion.button
            onClick={(e) => { e.stopPropagation(); onToggleLearned(word.id!, !word.learned); }}
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.9 }}
            className={`w-9 h-9 rounded-full flex items-center justify-center border transition-colors shadow-sm
              ${word.learned
                ? "bg-stone-900 dark:bg-stone-100 border-stone-900 dark:border-stone-100"
                : "bg-white dark:bg-stone-900 border-stone-300 dark:border-stone-600"}`}
          >
            <AnimatePresence mode="wait">
              {word.learned ? (
                <motion.div key="on" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                  <Check className="w-4 h-4 text-white dark:text-stone-900" />
                </motion.div>
              ) : (
                <motion.div key="off" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                  <Sparkles className="w-4 h-4 text-stone-400" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </div>

        {/* ── FRONT ── */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 overflow-hidden"
          style={{ backfaceVisibility: "hidden" }}
        >
          {/* Kumiko corner accent */}
          <div className="absolute top-0 left-0 w-12 h-12 border-r border-b border-stone-100 dark:border-stone-800 rounded-br-2xl" />
          <div className="absolute bottom-0 right-0 w-12 h-12 border-l border-t border-stone-100 dark:border-stone-800 rounded-tl-2xl" />

          <div className="flex flex-col items-center gap-2 z-10 px-6 text-center">
            <h2 className="text-4xl font-extralight tracking-tight text-stone-800 dark:text-stone-100">
              {word.english}
            </h2>

            <div className="flex items-center gap-2 text-stone-400 dark:text-stone-500">
              {word.phonetic && (
                <span className="text-xs font-light tracking-wide">/{word.phonetic}/</span>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); speak(word.english); }}
                className="p-1 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
              >
                <Volume2 className="w-3.5 h-3.5" strokeWidth={1.5} />
              </button>
            </div>

            <div className="flex items-center gap-2 mt-1">
              {word.partOfSpeech && (
                <span className={`text-[10px] uppercase tracking-[1.5px] px-2 py-0.5 rounded-full ${posClass}`}>
                  {word.partOfSpeech}
                </span>
              )}
              <span className="text-[10px] uppercase tracking-[1.5px] px-2 py-0.5 rounded-full border border-stone-200 dark:border-stone-700 text-stone-400 dark:text-stone-500">
                {word.topic}
              </span>
            </div>
          </div>

          <p className="absolute bottom-4 text-[10px] tracking-[2px] uppercase text-stone-300 dark:text-stone-600">
            tap to reveal
          </p>
        </div>

        {/* ── BACK ── */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/60 overflow-hidden"
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        >
          <div className="absolute top-0 right-0 w-12 h-12 border-l border-b border-stone-200 dark:border-stone-700 rounded-bl-2xl" />
          <div className="absolute bottom-0 left-0 w-12 h-12 border-r border-t border-stone-200 dark:border-stone-700 rounded-tr-2xl" />

          <motion.div
            className="flex flex-col items-center gap-3 px-8 text-center z-10"
            animate={{ opacity: flip ? 1 : 0, y: flip ? 0 : 8 }}
            transition={{ delay: flip ? 0.35 : 0, duration: 0.4 }}
          >
            <h2 className="text-2xl font-light tracking-tight text-stone-800 dark:text-stone-100">
              {word.meaning}
            </h2>

            {word.example && (
              <p className="text-xs text-stone-500 dark:text-stone-400 italic leading-relaxed">
                &ldquo;{word.example}&rdquo;
              </p>
            )}

            {word.example && (
              <button
                onClick={(e) => { e.stopPropagation(); speak(word.example!); }}
                className="flex items-center gap-1.5 text-[10px] uppercase tracking-[1.5px] text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 transition-colors mt-1"
              >
                <Volume2 className="w-3 h-3" strokeWidth={1.5} />
                Listen
              </button>
            )}
          </motion.div>
        </div>

      </motion.div>
    </motion.div>
  );
}