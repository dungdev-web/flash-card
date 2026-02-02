"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useDebounce } from "@/app/hooks/useDebounce";
import { useAuth } from "@/app/hooks/useAuth";
import { addWord } from "@/app/libs/firestore";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Loader2,
  CheckCircle2,
  BookPlus,
  Languages,
  Globe,
  ArrowRight,
  Wand2,
  FileText,
  Lightbulb,
  MessageSquare, // 🆕 Icon cho phrase
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import AuthGuard from "@/components/auth/AuthGuard";

const TOPICS = [
  { value: "Daily", emoji: "☀️", color: "from-orange-400 to-yellow-400" },
  { value: "Work", emoji: "💼", color: "from-blue-400 to-cyan-400" },
  { value: "Travel", emoji: "✈️", color: "from-green-400 to-emerald-400" },
  { value: "Food", emoji: "🍔", color: "from-red-400 to-pink-400" },
  { value: "Tech", emoji: "💻", color: "from-purple-400 to-violet-400" },
  { value: "Health", emoji: "🏥", color: "from-teal-400 to-cyan-400" },
];

interface MeaningData {
  partOfSpeech: string;
  definitions: Array<{ definition: string }>;
}

export default function AddWordPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [english, setEnglish] = useState("");
  const [meaning, setMeaning] = useState("");
  const [example, setExample] = useState("");
  const [transcription, setTranscription] = useState("");
  const [audioUrl, setAudioUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingExample, setLoadingExample] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [topic, setTopic] = useState("Daily");
  
  const [availableParts, setAvailableParts] = useState<MeaningData[]>([]);
  const [selectedPartIndex, setSelectedPartIndex] = useState(0);
  
  // 🆕 Thêm state để phân loại word/phrase
  const [wordType, setWordType] = useState<"word" | "phrase">("word");
  
  const debouncedEnglish = useDebounce(english, 500);

  // 🆕 Kiểm tra xem là word hay phrase
  useEffect(() => {
    if (english.trim().includes(" ")) {
      setWordType("phrase");
    } else {
      setWordType("word");
    }
  }, [english]);

  // Fetch meaning
  useEffect(() => {
    if (!debouncedEnglish || debouncedEnglish.length < 2) {
      setMeaning("");
      return;
    }

    const fetchMeaning = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/translate?word=${encodeURIComponent(debouncedEnglish)}`,
        );
        const data = await res.json();
        setMeaning(data.meaning || "");
      } catch {
        setMeaning("");
      } finally {
        setLoading(false);
      }
    };

    fetchMeaning();
  }, [debouncedEnglish]);

  const simpleTranscription = (word: string) => {
    return word
      .toLowerCase()
      .replace(/ough/g, "ɔː")
      .replace(/tion/g, "ʃən")
      .replace(/c/g, "k")
      .replace(/qu/g, "kw")
      .replace(/e$/g, "")
      .split("")
      .map((char) => {
        switch (char) {
          case "a": return "æ";
          case "e": return "ɛ";
          case "i": return "ɪ";
          case "o": return "ɒ";
          case "u": return "ʌ";
          case "y": return "aɪ";
          default: return char;
        }
      })
      .join("");
  };

  // Fetch transcription (chỉ cho word, không cho phrase)
  useEffect(() => {
    // 🆕 Chỉ fetch transcription nếu là word đơn
    if (!english || wordType === "phrase") {
      setTranscription("");
      setAudioUrl("");
      setAvailableParts([]);
      return;
    }

    const fetchTranscription = async () => {
      try {
        const res = await fetch(
          `/api/transcription?word=${encodeURIComponent(english)}`,
        );
        const data = await res.json();
        setAudioUrl(data.audioUrl || "");

        if (data.phonetic) {
          setTranscription(data.phonetic);
        } else {
          setTranscription(simpleTranscription(english));
        }

        if (data.meanings && data.meanings.length > 0) {
          setAvailableParts(data.meanings);
          setSelectedPartIndex(0);
        } else {
          setAvailableParts([]);
        }
      } catch (error) {
        setTranscription(simpleTranscription(english));
        setAvailableParts([]);
      }
    };

    fetchTranscription();
  }, [english, wordType]);

  const currentPartOfSpeech = wordType === "phrase" 
    ? "phrase" // 🆕 Nếu là phrase, partOfSpeech = "phrase"
    : (availableParts[selectedPartIndex]?.partOfSpeech || "");
  
  const currentDefinition = availableParts[selectedPartIndex]?.definitions[0]?.definition || meaning;

  // Generate example sentence
  const generateExample = async () => {
    if (!english || !meaning) return;

    setLoadingExample(true);
    try {
      const res = await fetch("/api/generate-example", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          word: english, 
          meaning: currentDefinition,
          partOfSpeech: currentPartOfSpeech,
          topic 
        }),
      });
      const data = await res.json();
      setExample(data.example || "");
    } catch {
      setExample("");
    } finally {
      setLoadingExample(false);
    }
  };

  const handleSubmit = async () => {
    if (!english || !meaning) {
      setError("Vui lòng nhập đầy đủ thông tin");
      setTimeout(() => setError(""), 3000);
      return;
    }

    if (!user) return;

    try {
      setSaving(true);
      await addWord({
        english,
        meaning,
        topic,
        learned: false,
        userId: user.uid,
        example: example || "",
        isPreset: false,
        audioUrl: audioUrl || "",
        phonetic: transcription || "",
        createdAt: Date.now(),
        partOfSpeech: currentPartOfSpeech, // 🆕 Lưu "phrase" nếu là cụm từ
      });

      setSuccess(true);

      setTimeout(() => {
        router.push("/dashboard/flashcards");
      }, 1500);
    } catch (err: any) {
      setError(err.message);
      setTimeout(() => setError(""), 3000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AuthGuard>
      <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-2xl"
        >
          <Card className="relative overflow-hidden bg-linear-to-br from-white to-blue-50 dark:from-gray-900 dark:to-blue-950 border-2 border-blue-100 dark:border-blue-900 shadow-2xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-linear-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl -mr-32 -mt-32" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-linear-to-tr from-purple-400/20 to-pink-400/20 rounded-full blur-3xl -ml-24 -mb-24" />

            <div className="relative p-8 space-y-6">
              {/* Header */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="flex items-center gap-3"
              >
                <div className="p-3 rounded-xl bg-linear-to-br from-blue-500 to-purple-500 shadow-lg">
                  <BookPlus className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold bg-linear-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                    Add New {wordType === "phrase" ? "Phrase" : "Word"}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Expand your vocabulary journey
                  </p>
                </div>
              </motion.div>

              {/* English Input */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="space-y-2"
              >
                <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  {wordType === "phrase" ? (
                    <>
                      <MessageSquare className="w-4 h-4" />
                      English Phrase
                    </>
                  ) : (
                    <>
                      <Globe className="w-4 h-4" />
                      English Word
                    </>
                  )}
                </label>
                <div className="relative">
                  <Input
                    placeholder={wordType === "phrase" ? "Enter a phrase..." : "Enter a word..."}
                    value={english}
                    onChange={(e) => setEnglish(e.target.value)}
                    className="h-12 text-lg border-2 focus:border-blue-400 dark:focus:border-blue-600 transition-all"
                  />
                  <AnimatePresence>
                    {loading && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                      >
                        <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                
                {/* 🆕 Badge hiển thị word/phrase */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={wordType}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                  >
                    <Badge 
                      variant={wordType === "phrase" ? "default" : "secondary"}
                      className="mt-1"
                    >
                      {wordType === "phrase" ? (
                        <>
                          <MessageSquare className="w-3 h-3 mr-1" />
                          Phrase detected
                        </>
                      ) : (
                        <>
                          <Globe className="w-3 h-3 mr-1" />
                          Single word
                        </>
                      )}
                    </Badge>
                  </motion.div>
                </AnimatePresence>
              </motion.div>

              {/* Vietnamese Meaning */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="space-y-2"
              >
                <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Languages className="w-4 h-4" />
                  Vietnamese Meaning
                  {meaning && (
                    <motion.span
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-1 text-xs text-blue-500"
                    >
                      <Wand2 className="w-3 h-3" />
                      Auto-suggested
                    </motion.span>
                  )}
                </label>
                <div className="relative">
                  <Input
                    placeholder="Meaning will appear here..."
                    value={meaning}
                    onChange={(e) => setMeaning(e.target.value)}
                    className="h-12 text-lg bg-muted/50 border-2 border-dashed"
                  />
                </div>
              </motion.div>

              {/* 🆕 Part of Speech (chỉ hiện với WORD) */}
              {wordType === "word" && availableParts.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4125 }}
                  className="space-y-2"
                >
                  <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Languages className="w-4 h-4" />
                    Part of Speech
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {availableParts.map((part, index) => (
                      <Badge
                        key={index}
                        variant={selectedPartIndex === index ? "default" : "outline"}
                        onClick={() => setSelectedPartIndex(index)}
                        className="cursor-pointer px-4 py-2 text-sm hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors"
                      >
                        {part.partOfSpeech}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground italic mt-2">
                    💡 {currentDefinition}
                  </p>
                </motion.div>
              )}

              {/* 🆕 Phrase Type (chỉ hiện với PHRASE) */}
              {wordType === "phrase" && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4125 }}
                  className="space-y-2"
                >
                  <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <MessageSquare className="w-4 h-4" />
                    Type
                  </label>
                  <Badge variant="outline" className="px-4 py-2">
                    Phrase
                  </Badge>
                  <p className="text-sm text-muted-foreground italic">
                    💡 This is a phrase (multiple words). Transcription is not available for phrases.
                  </p>
                </motion.div>
              )}

              {/* Transcription (chỉ hiện với WORD) */}
              {wordType === "word" && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.425 }}
                  className="space-y-2"
                >
                  <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Languages className="w-4 h-4" />
                    Transcription
                  </label>
                  <div className="relative">
                    <Input
                      placeholder="Transcription will appear here..."
                      value={transcription}
                      onChange={(e) => setTranscription(e.target.value)}
                      className="h-12 text-lg bg-muted/50 border-2 border-dashed"
                    />
                  </div>
                </motion.div>
              )}

              {/* Example Sentence */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
                className="space-y-2"
              >
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <FileText className="w-4 h-4" />
                    Example Sentence
                    {example && (
                      <motion.span
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-1 text-xs text-purple-500"
                      >
                        <Lightbulb className="w-3 h-3" />
                        AI-generated
                      </motion.span>
                    )}
                  </label>

                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={generateExample}
                      disabled={!english || !meaning || loadingExample}
                      className="h-8 text-xs gap-1 hover:bg-purple-50 dark:hover:bg-purple-950/30"
                    >
                      {loadingExample ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3 h-3" />
                          Generate
                        </>
                      )}
                    </Button>
                  </motion.div>
                </div>

                <div className="relative">
                  <Textarea
                    placeholder="Click 'Generate' for an AI-powered example sentence..."
                    value={example}
                    onChange={(e) => setExample(e.target.value)}
                    className="min-h-20 text-base border-2 focus:border-purple-400 dark:focus:border-purple-600 transition-all resize-none"
                  />
                </div>

                <p className="text-xs text-muted-foreground italic">
                  💡 Tip: Examples help you remember the {wordType} better!
                </p>
              </motion.div>

              {/* Topic Selection */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="space-y-3"
              >
                <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Sparkles className="w-4 h-4" />
                  Choose Topic
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {TOPICS.map((t, idx) => (
                    <motion.div
                      key={t.value}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.6 + idx * 0.05 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <button
                        onClick={() => setTopic(t.value)}
                        className={`w-full p-4 rounded-xl border-2 transition-all ${
                          topic === t.value
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30 shadow-lg"
                            : "border-gray-200 dark:border-gray-800 hover:border-blue-300 dark:hover:border-blue-700"
                        }`}
                      >
                        <div className="flex flex-col items-center gap-2">
                          <span className="text-2xl">{t.emoji}</span>
                          <span className="text-sm font-medium">{t.value}</span>
                        </div>
                      </button>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Error Message */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-sm"
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit Button */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                <Button
                  onClick={handleSubmit}
                  disabled={!english || !meaning || saving || success}
                  className="w-full h-14 text-lg font-semibold bg-linear-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                >
                  <AnimatePresence mode="wait">
                    {success ? (
                      <motion.div
                        key="success"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="flex items-center gap-2"
                      >
                        <CheckCircle2 className="w-5 h-5" />
                        {wordType === "phrase" ? "Phrase" : "Word"} Added Successfully!
                      </motion.div>
                    ) : saving ? (
                      <motion.div
                        key="saving"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center gap-2"
                      >
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Adding {wordType === "phrase" ? "Phrase" : "Word"}...
                      </motion.div>
                    ) : (
                      <motion.div
                        key="add"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center gap-2"
                      >
                        Add {wordType === "phrase" ? "Phrase" : "Word"}
                        <ArrowRight className="w-5 h-5" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Button>
              </motion.div>

              {/* Stats Badge */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="flex justify-center gap-2 flex-wrap"
              >
                <Badge variant="outline" className="px-4 py-2">
                  <Sparkles className="w-3 h-3 mr-1" />
                  AI-powered translation
                </Badge>
                {wordType === "phrase" && (
                  <Badge variant="outline" className="px-4 py-2 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
                    <MessageSquare className="w-3 h-3 mr-1 text-blue-500" />
                    Multi-word phrase
                  </Badge>
                )}
                {example && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                    <Badge
                      variant="outline"
                      className="px-4 py-2 bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800"
                    >
                      <Lightbulb className="w-3 h-3 mr-1 text-purple-500" />
                      With example
                    </Badge>
                  </motion.div>
                )}
              </motion.div>
            </div>
          </Card>
        </motion.div>
      </div>
    </AuthGuard>
  );
}