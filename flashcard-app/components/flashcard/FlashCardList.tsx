"use client";

import { useEffect, useState } from "react";
import FlashCard from "@/components/flashcard/FlashCard";
import { Word } from "@/app/types/word";
import { getWordsByUser, toggleLearned, searchWords } from "@/app/libs/firestore";
import { useAuth } from "@/app/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Shuffle,
  BookOpen,
  Search,
  X,
  Circle,
} from "lucide-react";
import { useDebounce } from "@/app/hooks/useDebounce";

const SHOJI_DELAY = 1.15;
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const, delay: SHOJI_DELAY + delay },
});

function WashiBar({ value, delay = 0 }: { value: number; delay?: number }) {
  return (
    <div className="relative h-[2px] w-full bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden">
      <motion.div
        className="absolute inset-y-0 left-0 bg-stone-800 dark:bg-stone-200 rounded-full"
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: SHOJI_DELAY + delay }}
      />
    </div>
  );
}

function KumikoLine() {
  return (
    <div className="flex items-center gap-3 my-6">
      <div className="flex-1 h-px bg-stone-200 dark:bg-stone-700" />
      <div className="w-1 h-1 rounded-full bg-stone-400 dark:bg-stone-500" />
      <div className="flex-1 h-px bg-stone-200 dark:bg-stone-700" />
    </div>
  );
}

export default function FlashCardList() {
  const { user } = useAuth();
  const [allWords, setAllWords] = useState<Word[]>([]);
  const [words, setWords] = useState<Word[]>([]);
  const [currentWord, setCurrentWord] = useState<Word | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const debouncedSearch = useDebounce(searchKeyword, 500);

  useEffect(() => {
    if (!user) return;
    getWordsByUser(user.uid).then((data) => {
      setAllWords(data);
      setWords(data);
      setCurrentIndex(0);
      setCurrentWord(data[0] ?? null);
    });
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const run = async () => {
      if (!debouncedSearch.trim()) {
        setWords(allWords);
        setCurrentIndex(0);
        setCurrentWord(allWords[0] ?? null);
        setIsSearching(false);
        return;
      }
      setIsSearching(true);
      try {
        const results = await searchWords(user.uid, debouncedSearch.toLowerCase());
        setWords(results);
        setCurrentIndex(0);
        setCurrentWord(results[0] ?? null);
      } catch {
        setWords([]);
        setCurrentWord(null);
      } finally {
        setIsSearching(false);
      }
    };
    run();
  }, [debouncedSearch, user, allWords]);

  const clearSearch = () => {
    setSearchKeyword("");
    setWords(allWords);
    setCurrentIndex(0);
    setCurrentWord(allWords[0] ?? null);
  };

  const prev = () => {
    if (!words.length) return;
    setDirection(-1);
    const i = currentIndex === 0 ? words.length - 1 : currentIndex - 1;
    setCurrentIndex(i);
    setCurrentWord(words[i]);
  };

  const next = () => {
    if (!words.length) return;
    setDirection(1);
    const i = currentIndex === words.length - 1 ? 0 : currentIndex + 1;
    setCurrentIndex(i);
    setCurrentWord(words[i]);
  };

  const random = () => {
    if (!words.length) return;
    setDirection(0);
    const i = Math.floor(Math.random() * words.length);
    setCurrentIndex(i);
    setCurrentWord(words[i]);
  };

  const handleToggleLearned = async (id: string, learned: boolean) => {
    await toggleLearned(id, learned);
    setAllWords((p) => p.map((w) => (w.id === id ? { ...w, learned } : w)));
    setWords((p) => p.map((w) => (w.id === id ? { ...w, learned } : w)));
    setCurrentWord((p) => (p?.id === id ? { ...p, learned } : p));
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === "INPUT") return;
      if (e.code === "Space") { e.preventDefault(); random(); }
      if (e.code === "ArrowLeft" || e.code === "KeyA") { e.preventDefault(); prev(); }
      if (e.code === "ArrowRight" || e.code === "KeyD") { e.preventDefault(); next(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [words, currentIndex]);

  const learnedCount = allWords.filter((w) => w.learned).length;
  const progress = allWords.length > 0 ? (learnedCount / allWords.length) * 100 : 0;

  const variants = {
    enter: (d: number) => ({ x: d === 1 ? 260 : d === -1 ? -260 : 0, opacity: 0, scale: 0.92, rotateY: d === 0 ? 90 : 0 }),
    center: { x: 0, opacity: 1, scale: 1, rotateY: 0 },
    exit: (d: number) => ({ x: d === 1 ? -260 : d === -1 ? 260 : 0, opacity: 0, scale: 0.92, rotateY: d === 0 ? -90 : 0 }),
  };

  return (
    <div className="flex flex-col items-center gap-0 w-full max-w-xl mx-auto px-4 py-8">

      {/* Header */}
      <motion.div {...fadeUp(0)} className="w-full mb-8">
        <p className="text-[11px] uppercase tracking-[3px] text-stone-400 dark:text-stone-500 mb-1">
          単語カード · Flashcards
        </p>
        <h1 className="text-3xl font-extralight tracking-tight text-stone-800 dark:text-stone-100">
          Practice
        </h1>
      </motion.div>

      {/* Search */}
      <motion.div {...fadeUp(0.05)} className="w-full">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" strokeWidth={1.5} />
          <input
            placeholder="Search words..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="w-full h-11 pl-9 pr-9 text-sm bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-800 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:border-stone-400 dark:focus:border-stone-500 transition-colors"
          />
          <AnimatePresence>
            {searchKeyword && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                onClick={clearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
              >
                <X className="w-3.5 h-3.5 text-stone-400" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
        {searchKeyword && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="mt-2 text-xs text-stone-400 dark:text-stone-500">
            {isSearching ? "Searching..." : words.length > 0
              ? `${words.length} result${words.length > 1 ? "s" : ""} for "${searchKeyword}"`
              : `No results for "${searchKeyword}"`}
          </motion.p>
        )}
      </motion.div>

      <KumikoLine />

      {/* Progress */}
      <motion.div {...fadeUp(0.1)} className="w-full">
        <div className="flex items-center justify-between mb-3 text-xs text-stone-400 dark:text-stone-500">
          <span className="uppercase tracking-[1.5px]">Progress</span>
          <span className="tabular-nums">{learnedCount} / {allWords.length}</span>
        </div>
        <WashiBar value={progress} delay={0.15} />
        <div className="flex items-center justify-between mt-2 text-[10px] text-stone-300 dark:text-stone-600 tabular-nums">
          <span>Card {words.length > 0 ? currentIndex + 1 : 0} of {words.length}</span>
          <span>{Math.round(progress)}%</span>
        </div>
      </motion.div>

      <KumikoLine />

      {/* Card area */}
      {!currentWord ? (
        <motion.div {...fadeUp(0.15)} className="flex flex-col items-center gap-3 py-16 text-center">
          <Circle className="w-8 h-8 text-stone-300 dark:text-stone-600" strokeWidth={1} />
          <p className="text-sm text-stone-400 dark:text-stone-500 font-light">
            {searchKeyword ? `No results for "${searchKeyword}"` : "言葉がまだありません"}
          </p>
          <p className="text-xs text-stone-300 dark:text-stone-600">
            {searchKeyword ? "Try a different term" : "Add words to begin"}
          </p>
        </motion.div>
      ) : (
        <>
          <motion.div {...fadeUp(0.15)} className="relative w-full flex justify-center" style={{ minHeight: 220 }}>
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={currentWord.id}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  x: { type: "spring", stiffness: 280, damping: 28 },
                  opacity: { duration: 0.25 },
                  scale: { duration: 0.3 },
                  rotateY: { duration: 0.5 },
                }}
              >
                <FlashCard word={currentWord} onToggleLearned={handleToggleLearned} />
              </motion.div>
            </AnimatePresence>
          </motion.div>

          {/* Controls */}
          <motion.div {...fadeUp(0.2)} className="flex items-center gap-6 mt-8">
            <button
              onClick={prev}
              disabled={words.length === 0}
              className="w-11 h-11 rounded-full border border-stone-200 dark:border-stone-700 flex items-center justify-center text-stone-500 dark:text-stone-400 hover:border-stone-400 dark:hover:border-stone-500 hover:text-stone-800 dark:hover:text-stone-100 disabled:opacity-30 transition-all"
            >
              <ChevronLeft className="w-4 h-4" strokeWidth={1.5} />
            </button>

            <motion.button
              onClick={random}
              disabled={words.length === 0}
              whileHover={{ rotate: 180 }}
              transition={{ type: "spring", stiffness: 300 }}
              className="w-13 h-13 w-14 h-14 rounded-full bg-stone-900 dark:bg-stone-100 flex items-center justify-center text-white dark:text-stone-900 disabled:opacity-30 hover:bg-stone-700 dark:hover:bg-stone-300 transition-colors"
            >
              <Shuffle className="w-4 h-4" strokeWidth={1.5} />
            </motion.button>

            <button
              onClick={next}
              disabled={words.length === 0}
              className="w-11 h-11 rounded-full border border-stone-200 dark:border-stone-700 flex items-center justify-center text-stone-500 dark:text-stone-400 hover:border-stone-400 dark:hover:border-stone-500 hover:text-stone-800 dark:hover:text-stone-100 disabled:opacity-30 transition-all"
            >
              <ChevronRight className="w-4 h-4" strokeWidth={1.5} />
            </button>
          </motion.div>

          {/* Keyboard hints */}
          <motion.div {...fadeUp(0.25)} className="flex items-center gap-5 mt-5 text-[10px] text-stone-300 dark:text-stone-600 uppercase tracking-[1.5px]">
            <span className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 border border-stone-200 dark:border-stone-700 rounded text-[9px]">←</kbd>
              prev
            </span>
            <span className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 border border-stone-200 dark:border-stone-700 rounded text-[9px]">Space</kbd>
              random
            </span>
            <span className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 border border-stone-200 dark:border-stone-700 rounded text-[9px]">→</kbd>
              next
            </span>
          </motion.div>
        </>
      )}
    </div>
  );
}