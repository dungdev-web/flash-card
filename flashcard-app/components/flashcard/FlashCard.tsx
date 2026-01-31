"use client";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Word } from "@/app/types/word";
import { Sparkles, Volume2, Check } from "lucide-react";

type Props = {
  word: Word;
  onToggleLearned: (id: string, learned: boolean) => void;
};

export default function FlashCard({ word, onToggleLearned }: Props) {
  const [flip, setFlip] = useState(false);
  const [femaleVoice, setFemaleVoice] = useState<SpeechSynthesisVoice | null>(
    null,
  );
  useEffect(() => {
    if (typeof window === "undefined") return;

    const synth = window.speechSynthesis;

    const loadVoices = () => {
      const voices = synth.getVoices();

      // 🔥 Ưu tiên giọng nữ tiếng Anh
      const preferred =
        voices.find(
          (v) => v.lang === "en-US" && v.name.toLowerCase().includes("female"),
        ) ||
        voices.find(
          (v) =>
            v.lang === "en-US" &&
            (v.name.toLowerCase().includes("zira") || // Windows
              v.name.toLowerCase().includes("samantha")), // macOS
        ) ||
        voices.find((v) => v.lang === "en-US");

      setFemaleVoice(preferred || null);
    };

    loadVoices();
    synth.onvoiceschanged = loadVoices;
  }, []);

  const speak = (text: string) => {
    if (typeof window === "undefined") return;

    const synth = window.speechSynthesis;
    synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 0.9;
    utterance.pitch = 1.2; // 👩 giọng nữ cao hơn
    utterance.volume = 1;

    if (femaleVoice) {
      utterance.voice = femaleVoice;
    }

    synth.speak(utterance);
  };

  return (
    <motion.div
      className="perspective cursor-pointer"
      onClick={() => setFlip(!flip)}
      whileHover={{ scale: 1.08, y: -8 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <motion.div
        className="relative w-80 h-52"
        animate={{ rotateY: flip ? 180 : 0 }}
        transition={{
          duration: 0.7,
          type: "spring",
          stiffness: 100,
          damping: 15,
        }}
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Glow Effect */}
        <motion.div
          className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-2xl blur-xl opacity-30"
          animate={{
            opacity: flip ? 0.5 : 0.3,
          }}
          transition={{ duration: 0.5 }}
        />

        {/* BUTTON UPDATE LEARNED */}
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
          className="absolute -top-3 -right-3 z-20"
        >
          <motion.div
            whileHover={{ scale: 1.2, rotate: 15 }}
            whileTap={{ scale: 0.9 }}
          >
            <Button
              size="sm"
              className={`rounded-full w-10 h-10 p-0 shadow-lg ${
                word.learned
                  ? "bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600"
                  : "bg-gradient-to-r from-gray-400 to-gray-500 hover:from-gray-500 hover:to-gray-600"
              }`}
              onClick={(e) => {
                e.stopPropagation();
                onToggleLearned(word.id!, !word.learned);
              }}
            >
              <AnimatePresence mode="wait">
                {word.learned ? (
                  <motion.div
                    key="learned"
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0, rotate: 180 }}
                  >
                    <Check className="w-5 h-5 text-white" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="not-learned"
                    initial={{ scale: 0, rotate: 180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0, rotate: -180 }}
                  >
                    <Sparkles className="w-5 h-5 text-white" />
                  </motion.div>
                )}
              </AnimatePresence>
            </Button>
          </motion.div>
        </motion.div>
        {/* Example */}

        {/* FRONT */}
        <Card className="absolute inset-0 flex flex-col items-center justify-center gap-4 backface-hidden shadow-2xl bg-gradient-to-br from-white to-blue-50 dark:from-gray-900 dark:to-blue-950 border-2 border-blue-100 dark:border-blue-900 rounded-2xl overflow-hidden">
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-200 dark:bg-blue-800 rounded-full blur-3xl opacity-20 -mr-16 -mt-16" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-200 dark:bg-purple-800 rounded-full blur-3xl opacity-20 -ml-12 -mb-12" />

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-center z-10"
          >
            <motion.h2
              className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent mb-2"
              animate={{
                backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "linear",
              }}
              style={{ backgroundSize: "200% 200%" }}
            >
              {word.english}
            </motion.h2>

            {/* Sound button */}
            <motion.button
              className="mt-2 p-2 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.stopPropagation();
                speak(word.english);
              }}
            >
              <Volume2 className="w-4 h-4 text-blue-500" />
            </motion.button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
          >
            <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-1 text-sm font-semibold shadow-lg">
              {word.topic}
            </Badge>
          </motion.div>

          {/* Hint text */}
          <motion.p
            className="text-xs text-gray-400 mt-4 absolute bottom-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            transition={{ delay: 0.6 }}
          >
            Click to reveal meaning ✨
          </motion.p>
        </Card>

        {/* BACK */}
        <Card
          className="absolute inset-0 flex flex-col items-center justify-center backface-hidden shadow-2xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 border-2 border-purple-100 dark:border-purple-900 rounded-2xl overflow-hidden"
          style={{ transform: "rotateY(180deg)" }}
        >
          {/* Decorative circles */}
          <div className="absolute top-0 left-0 w-32 h-32 bg-purple-200 dark:bg-purple-800 rounded-full blur-3xl opacity-20 -ml-16 -mt-16" />
          <div className="absolute bottom-0 right-0 w-24 h-24 bg-pink-200 dark:bg-pink-800 rounded-full blur-3xl opacity-20 -mr-12 -mb-12" />

          <motion.div
            className="px-6 text-center z-10"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{
              opacity: flip ? 1 : 0,
              scale: flip ? 1 : 0.8,
            }}
            transition={{ delay: flip ? 0.4 : 0, duration: 0.5 }}
          >
            {/* MEANING */}
            <motion.h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
              {word.meaning}
            </motion.h2>

            {/* ✅ EXAMPLE */}
            {word.example && (
              <motion.p
                className="mt-4 text-sm text-gray-700 dark:text-gray-300 italic leading-relaxed"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: flip ? 1 : 0, y: flip ? 0 : 10 }}
                transition={{ delay: 0.6 }}
              >
                “{word.example}”
              </motion.p>
            )}

            {/* 🔊 LISTEN EXAMPLE */}
            {word.example && (
              <motion.button
                className="mt-3 inline-flex items-center gap-1 text-xs text-purple-500 hover:text-purple-600"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => {
                  e.stopPropagation();
                  speak(word.example!);
                }}
              >
                <Volume2 className="w-3 h-3" />
                Listen example
              </motion.button>
            )}
          </motion.div>

          {/* Hint */}
          <motion.p
            className="text-xs text-gray-400 absolute bottom-4"
            animate={{ opacity: flip ? 0.6 : 0 }}
          >
            Click to flip back 🔄
          </motion.p>
        </Card>
      </motion.div>
    </motion.div>
  );
}
