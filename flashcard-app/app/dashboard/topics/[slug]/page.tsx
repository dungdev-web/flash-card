"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import FlashCard from "@/components/flashcard/FlashCard";
import { Word } from "@/app/types/word";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/app/hooks/useAuth";
import AuthGuard from "@/components/auth/AuthGuard";
import { ChevronLeft, ChevronRight, Shuffle, Circle, ArrowLeft } from "lucide-react";
import Link from "next/link";

const SHOJI_DELAY = 1.15;
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 14 },
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

const TOPIC_JA: Record<string, string> = {
  daily:      "日常",
  business:   "仕事",
  technology: "技術",
  ielts:      "試験",
};

export default function TopicDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();

  const [words, setWords]     = useState<Word[]>([]);
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug || !user) return;
    setLoading(true);
    fetch(`/api/words?topic=${slug}&userId=${user.uid}`)
      .then((r) => r.json())
      .then((d) => { setWords(d || []); setCurrent(0); })
      .finally(() => setLoading(false));
  }, [slug, user]);

  const go = (dir: number) => {
    if (!words.length) return;
    setDirection(dir);
    setCurrent((p) => (p + dir + words.length) % words.length);
  };

  const random = () => {
    if (words.length < 2) return;
    setDirection(0);
    const i = Math.floor(Math.random() * words.length);
    setCurrent(i);
  };

  const onToggleLearned = (id: string, learned: boolean) =>
    setWords((p) => p.map((w) => (w.id === id ? { ...w, learned } : w)));

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === "INPUT") return;
      if (e.code === "ArrowLeft"  || e.code === "KeyA") { e.preventDefault(); go(-1); }
      if (e.code === "ArrowRight" || e.code === "KeyD") { e.preventDefault(); go(1);  }
      if (e.code === "Space") { e.preventDefault(); random(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [words, current]);

  const learnedCount = words.filter((w) => w.learned).length;
  const progress = words.length ? (learnedCount / words.length) * 100 : 0;
  const labelJa = TOPIC_JA[slug?.toLowerCase()] ?? "話題";

  const variants = {
    enter: (d: number) => ({ x: d === 1 ? 260 : d === -1 ? -260 : 0, opacity: 0, scale: 0.93, rotateY: d === 0 ? 90 : 0 }),
    center: { x: 0, opacity: 1, scale: 1, rotateY: 0 },
    exit:  (d: number) => ({ x: d === 1 ? -260 : d === -1 ? 260 : 0, opacity: 0, scale: 0.93, rotateY: d === 0 ? -90 : 0 }),
  };

  return (
    <AuthGuard>
      <div className="max-w-xl mx-auto px-4 py-8">

        {/* Back + Header */}
        <motion.div {...fadeUp(0)} className="mb-8">
          <Link href="/dashboard/topics"
            className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[2px] text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 transition-colors mb-4">
            <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.5} />
            Topics
          </Link>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[3px] text-stone-400 dark:text-stone-500 mb-1">
                {labelJa} · {slug}
              </p>
              <h1 className="text-3xl font-extralight tracking-tight text-stone-800 dark:text-stone-100 capitalize">
                {slug}
              </h1>
            </div>
            <span className="text-[11px] tabular-nums text-stone-400 dark:text-stone-500">
              {learnedCount}/{words.length}
            </span>
          </div>
        </motion.div>

        {/* Loading */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
              <Circle className="w-7 h-7 text-stone-300 dark:text-stone-600" strokeWidth={1} />
            </motion.div>
          </div>
        ) : !words.length ? (
          <motion.div {...fadeUp(0.05)} className="flex flex-col items-center gap-3 py-20 text-center">
            <Circle className="w-8 h-8 text-stone-300 dark:text-stone-600" strokeWidth={1} />
            <p className="text-sm text-stone-400 dark:text-stone-500 font-light">
              言葉がありません
            </p>
            <p className="text-xs text-stone-300 dark:text-stone-600">
              No words in &ldquo;{slug}&rdquo; yet
            </p>
          </motion.div>
        ) : (
          <>
            {/* Progress */}
            <motion.div {...fadeUp(0.05)} className="mb-6">
              <WashiBar value={progress} delay={0.08} />
              <div className="flex justify-between mt-2 text-[10px] tabular-nums text-stone-300 dark:text-stone-600">
                <span>Card {current + 1} of {words.length}</span>
                <span>{Math.round(progress)}%</span>
              </div>
            </motion.div>

            <KumikoLine />

            {/* Card */}
            <motion.div {...fadeUp(0.1)} className="relative flex justify-center" style={{ minHeight: 220 }}>
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={words[current]?.id}
                  custom={direction}
                  variants={variants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{
                    x: { type: "spring", stiffness: 280, damping: 28 },
                    opacity: { duration: 0.22 },
                    scale: { duration: 0.28 },
                    rotateY: { duration: 0.45 },
                  }}
                >
                  <FlashCard word={words[current]} onToggleLearned={onToggleLearned} />
                </motion.div>
              </AnimatePresence>
            </motion.div>

            {/* Controls */}
            <motion.div {...fadeUp(0.15)} className="flex items-center justify-center gap-6 mt-8">
              <button onClick={() => go(-1)}
                className="w-11 h-11 rounded-full border border-stone-200 dark:border-stone-700 flex items-center justify-center text-stone-500 dark:text-stone-400 hover:border-stone-400 dark:hover:border-stone-500 hover:text-stone-800 dark:hover:text-stone-100 transition-all">
                <ChevronLeft className="w-4 h-4" strokeWidth={1.5} />
              </button>

              <motion.button onClick={random}
                whileHover={{ rotate: 180 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="w-14 h-14 rounded-full bg-stone-900 dark:bg-stone-100 flex items-center justify-center text-white dark:text-stone-900 hover:bg-stone-700 dark:hover:bg-stone-300 transition-colors">
                <Shuffle className="w-4 h-4" strokeWidth={1.5} />
              </motion.button>

              <button onClick={() => go(1)}
                className="w-11 h-11 rounded-full border border-stone-200 dark:border-stone-700 flex items-center justify-center text-stone-500 dark:text-stone-400 hover:border-stone-400 dark:hover:border-stone-500 hover:text-stone-800 dark:hover:text-stone-100 transition-all">
                <ChevronRight className="w-4 h-4" strokeWidth={1.5} />
              </button>
            </motion.div>

            {/* Keyboard hints */}
            <motion.div {...fadeUp(0.2)} className="flex items-center justify-center gap-5 mt-5 text-[10px] text-stone-300 dark:text-stone-600 uppercase tracking-[1.5px]">
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
    </AuthGuard>
  );
}