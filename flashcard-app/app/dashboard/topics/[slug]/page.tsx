"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import FlashCard from "@/components/flashcard/FlashCard";
import { Word } from "@/app/types/word";
import { motion } from "framer-motion";
import { useAuth } from "@/app/hooks/useAuth";
import AuthGuard from "@/components/auth/AuthGuard";
export default function TopicDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [words, setWords] = useState<Word[]>([]);
  const [current, setCurrent] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    if (!slug || !user) return;

    const fetchWords = async () => {
      const res = await fetch(`/api/words?topic=${slug}&userId=${user.uid}`);
      const data = await res.json();
      setWords(data || []);
    };

    fetchWords();
  }, [slug, user]); // ✅ THÊM user

  const nextFlashcard = () => {
    setCurrent((prev) => (prev + 1) % words.length);
  };

  const prevFlashcard = () => {
    setCurrent((prev) => (prev - 1 + words.length) % words.length);
  };

  const onToggleLearned = (id: string, learned: boolean) => {
    setWords((prev) => prev.map((w) => (w.id === id ? { ...w, learned } : w)));
  };

  if (!words.length) {
    return (
      <div className="flex items-center justify-center h-[70vh] text-gray-400">
        No words in topic "{slug}" 😢
      </div>
    );
  }

  return (
    <AuthGuard>
    
    <div className="min-h-screen flex flex-col items-center justify-center gap-6">
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold bg-linear-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent"
      >
        Topic: {slug}
      </motion.h1>

      <FlashCard word={words[current]} onToggleLearned={onToggleLearned} />

      <div className="flex gap-4">
        <button
          onClick={prevFlashcard}
          className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700"
        >
          ⬅ Prev
        </button>
        <button
          onClick={nextFlashcard}
          className="px-4 py-2 rounded-lg bg-blue-500 text-white"
        >
          Next ➡
        </button>
      </div>

      <p className="text-xs text-gray-400">
        {current + 1} / {words.length}
      </p>
    </div>
    </AuthGuard>
  );
}
