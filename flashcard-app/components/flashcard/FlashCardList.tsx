"use client";

import { useEffect, useState } from "react";
import FlashCard from "@/components/flashcard/FlashCard";
import { Word } from "@/app/types/word";
import { getWordsByUser, toggleLearned, searchWords } from "@/app/libs/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/app/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Shuffle,
  BookOpen,
  Trophy,
  Target,
  Search,
  X,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { useDebounce } from "@/app/hooks/useDebounce";

export default function FlashCardList() {
  const { user } = useAuth();
  const [allWords, setAllWords] = useState<Word[]>([]); // 🆕 Lưu tất cả words
  const [words, setWords] = useState<Word[]>([]); // 🆕 Words hiển thị (filtered)
  const [currentWord, setCurrentWord] = useState<Word | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0); // -1: left, 1: right, 0: random
  
  // 🆕 Search state
  const [searchKeyword, setSearchKeyword] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const debouncedSearch = useDebounce(searchKeyword, 500);

  // 🔹 Load all words initially
  useEffect(() => {
    if (!user) return;

    getWordsByUser(user.uid).then((data) => {
      setAllWords(data);
      setWords(data);
      setCurrentIndex(0);
      setCurrentWord(data[0] ?? null);
    });
  }, [user]);

  // 🆕 Search effect
  useEffect(() => {
    if (!user) return;

    const performSearch = async () => {
      if (!debouncedSearch.trim()) {
        // Nếu không có keyword, hiển thị tất cả
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
      } catch (error) {
        console.error("Search error:", error);
        setWords([]);
        setCurrentWord(null);
      } finally {
        setIsSearching(false);
      }
    };

    performSearch();
  }, [debouncedSearch, user, allWords]);

  // 🆕 Clear search
  const clearSearch = () => {
    setSearchKeyword("");
    setWords(allWords);
    setCurrentIndex(0);
    setCurrentWord(allWords[0] ?? null);
  };

  const prevFlashcard = () => {
    if (words.length === 0) return;
    setDirection(-1);
    const newIndex = currentIndex === 0 ? words.length - 1 : currentIndex - 1;
    setCurrentIndex(newIndex);
    setCurrentWord(words[newIndex]);
  };

  const nextFlashcard = () => {
    if (words.length === 0) return;
    setDirection(1);
    const newIndex = currentIndex === words.length - 1 ? 0 : currentIndex + 1;
    setCurrentIndex(newIndex);
    setCurrentWord(words[newIndex]);
  };

  // 🔹 Toggle learned
  const handleToggleLearned = async (id: string, learned: boolean) => {
    await toggleLearned(id, learned);
    
    // Update both allWords and filtered words
    setAllWords((prev) => prev.map((w) => (w.id === id ? { ...w, learned } : w)));
    setWords((prev) => prev.map((w) => (w.id === id ? { ...w, learned } : w)));
    setCurrentWord((prev) =>
      prev && prev.id === id ? { ...prev, learned } : prev,
    );
  };

  // 🔹 Random card
  const randomFlashcard = () => {
    if (words.length === 0) return;
    setDirection(0);
    const randomIndex = Math.floor(Math.random() * words.length);
    setCurrentIndex(randomIndex);
    setCurrentWord(words[randomIndex]);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 🆕 Nếu đang focus vào search input thì không handle shortcuts
      if (document.activeElement?.tagName === "INPUT") return;

      const leftKeys = ["ArrowLeft", "KeyA"];
      const rightKeys = ["ArrowRight", "KeyD"];

      if (e.code === "Space") {
        e.preventDefault();
        randomFlashcard();
        return;
      }

      if (leftKeys.includes(e.code)) {
        e.preventDefault();
        prevFlashcard();
        return;
      }

      if (rightKeys.includes(e.code)) {
        e.preventDefault();
        nextFlashcard();
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [words, currentIndex]); // 🆕 Dependencies updated

  // 🔹 Calculate stats (based on ALL words, not filtered)
  const learnedCount = allWords.filter((w) => w.learned).length;
  const progress = allWords.length > 0 ? (learnedCount / allWords.length) * 100 : 0;

  const variants = {
    enter: (direction: number) => ({
      x: direction === 1 ? 300 : direction === -1 ? -300 : 0,
      opacity: 0,
      scale: 0.8,
      rotateY: direction === 0 ? 180 : 0,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      rotateY: 0,
    },
    exit: (direction: number) => ({
      x: direction === 1 ? -300 : direction === -1 ? 300 : 0,
      opacity: 0,
      scale: 0.8,
      rotateY: direction === 0 ? -180 : 0,
    }),
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center gap-8 w-full max-w-2xl mx-auto px-4"
    >
      {/* 🆕 Search Bar */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="w-full"
      >
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search words... (e.g., 'run', 'beautiful')"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="pl-10 pr-10 h-12 text-base border-2 focus:border-blue-400 dark:focus:border-blue-600 transition-all"
          />
          <AnimatePresence>
            {searchKeyword && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={clearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
        
        {/* 🆕 Search Results Info */}
        {searchKeyword && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 text-sm text-muted-foreground"
          >
            {isSearching ? (
              "Searching..."
            ) : words.length > 0 ? (
              <>
                Found <span className="font-semibold text-blue-600 dark:text-blue-400">{words.length}</span> word{words.length > 1 ? "s" : ""} matching "{searchKeyword}"
              </>
            ) : (
              <span className="text-red-500">No words found matching "{searchKeyword}"</span>
            )}
          </motion.p>
        )}
      </motion.div>

      {/* Stats Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="w-full"
      >
        <Card className="p-6 bg-linear-to-br from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 border-blue-100 dark:border-blue-900">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Target className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {searchKeyword ? "Total Progress" : "Progress"}
                </p>
                <p className="text-2xl font-bold bg-linear-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                  {learnedCount}/{allWords.length}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              <span className="text-lg font-semibold">
                {Math.round(progress)}%
              </span>
            </div>
          </div>

          <Progress value={progress} className="h-2" />

          <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
            <span>
              {searchKeyword ? `Showing: Card ${currentIndex + 1} of ${words.length}` : `Card ${currentIndex + 1} of ${words.length}`}
            </span>
            <span>{allWords.length - learnedCount} remaining</span>
          </div>
        </Card>
      </motion.div>

      {/* FlashCard with Animation or Empty State */}
      {!currentWord ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-4 py-12"
        >
          <div className="w-20 h-20 rounded-full bg-linear-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 flex items-center justify-center">
            <BookOpen className="w-10 h-10 text-blue-500" />
          </div>
          <p className="text-lg text-muted-foreground">
            {searchKeyword ? `No results for "${searchKeyword}"` : "Chưa có flashcard nào"}
          </p>
          <p className="text-sm text-muted-foreground/60">
            {searchKeyword ? "Try a different search term" : "Hãy thêm từ vựng để bắt đầu học!"}
          </p>
        </motion.div>
      ) : (
        <>
          <div className="relative w-full flex justify-center min-h-70">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={currentWord.id}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  x: { type: "spring", stiffness: 300, damping: 30 },
                  opacity: { duration: 0.3 },
                  scale: { duration: 0.3 },
                  rotateY: { duration: 0.6 },
                }}
              >
                <FlashCard
                  word={currentWord}
                  onToggleLearned={handleToggleLearned}
                />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex items-center gap-4"
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="outline"
                size="lg"
                onClick={prevFlashcard}
                disabled={words.length === 0}
                className="rounded-full w-14 h-14 p-0 shadow-lg hover:shadow-xl transition-all border-2 hover:border-blue-300 dark:hover:border-blue-700 disabled:opacity-50"
              >
                <ChevronLeft className="w-6 h-6" />
              </Button>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05, rotate: 180 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Button
                onClick={randomFlashcard}
                size="lg"
                disabled={words.length === 0}
                className="rounded-full w-16 h-16 p-0 shadow-lg hover:shadow-xl transition-all bg-linear-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 disabled:opacity-50"
              >
                <Shuffle className="w-6 h-6" />
              </Button>
            </motion.div>

            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="outline"
                size="lg"
                onClick={nextFlashcard}
                disabled={words.length === 0}
                className="rounded-full w-14 h-14 p-0 shadow-lg hover:shadow-xl transition-all border-2 hover:border-blue-300 dark:hover:border-blue-700 disabled:opacity-50"
              >
                <ChevronRight className="w-6 h-6" />
              </Button>
            </motion.div>
          </motion.div>

          {/* Keyboard Hints */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex items-center gap-4 text-xs text-muted-foreground"
          >
            <div className="flex items-center gap-1">
              <kbd className="px-2 py-1 bg-muted rounded">←</kbd>
              <span>Previous</span>
            </div>
            <div className="flex items-center gap-1">
              <kbd className="px-2 py-1 bg-muted rounded">Space</kbd>
              <span>Random</span>
            </div>
            <div className="flex items-center gap-1">
              <kbd className="px-2 py-1 bg-muted rounded">→</kbd>
              <span>Next</span>
            </div>
          </motion.div>
        </>
      )}
    </motion.div>
  );
}