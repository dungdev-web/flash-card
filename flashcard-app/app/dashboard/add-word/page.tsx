"use client";

import { useEffect, useState } from "react";
import { useDebounce } from "@/app/hooks/useDebounce";
import { useAuth } from "@/app/hooks/useAuth";
import { addWord } from "@/app/libs/firestore";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2, Check, Globe, Languages, MessageSquare,
  FileText, Wand2, Tag, ArrowRight, Plus,
  ImageOff, RefreshCw, BookOpen, Layers, Hash,
} from "lucide-react";
import AuthGuard from "@/components/auth/AuthGuard";

const SHOJI_DELAY = 1.15;
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const, delay: SHOJI_DELAY + delay },
});

const TOPICS = [
  { value: "Daily",  labelJa: "日常" },
  { value: "Work",   labelJa: "仕事" },
  { value: "Travel", labelJa: "旅行" },
  { value: "Food",   labelJa: "食事" },
  { value: "Tech",   labelJa: "技術" },
  { value: "Health", labelJa: "健康" },
];

interface MeaningData {
  partOfSpeech: string;
  definitions: Array<{ definition: string }>;
}

function Label({ icon: Icon, children, aside }: {
  icon: React.ElementType; children: React.ReactNode; aside?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between mb-1.5">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[2px] text-stone-400 dark:text-stone-500">
        <Icon className="w-3 h-3" strokeWidth={1.5} />{children}
      </div>
      {aside}
    </div>
  );
}

function StoneInput({ value, onChange, placeholder, disabled, className = "" }: {
  value: string; onChange: (v: string) => void; placeholder?: string; disabled?: boolean; className?: string;
}) {
  return (
    <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} disabled={disabled}
      className={`w-full bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 rounded-lg px-3 h-9 text-sm text-stone-800 dark:text-stone-100 placeholder:text-stone-300 dark:placeholder:text-stone-600 focus:outline-none focus:border-stone-400 dark:focus:border-stone-500 transition-colors disabled:opacity-40 ${className}`}
    />
  );
}

function StoneTextarea({ value, onChange, placeholder }: {
  value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={3}
      className="w-full h-full bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 rounded-lg px-3 py-2 text-sm text-stone-800 dark:text-stone-100 placeholder:text-stone-300 dark:placeholder:text-stone-600 focus:outline-none focus:border-stone-400 dark:focus:border-stone-500 transition-colors resize-none"
    />
  );
}

// ── Word image via internal API (Unsplash official or Picsum fallback) ──
interface ImgData { url: string; author: string; authorUrl: string }

function WordImagePanel({ word, meaning }: { word: string; meaning: string }) {
  const [imgKey,     setImgKey]     = useState(0);
  const [imgData,    setImgData]    = useState<ImgData | null>(null);
  const [imgLoading, setImgLoading] = useState(false);
  const [imgError,   setImgError]   = useState(false);

  useEffect(() => {
    if (!word) { setImgData(null); return; }
    setImgLoading(true);
    setImgError(false);
    fetch(`/api/word-image?word=${encodeURIComponent(word)}&sig=${imgKey}`)
      .then(r => r.json())
      .then(d => { setImgData(d); setImgLoading(false); })
      .catch(() => { setImgError(true); setImgLoading(false); });
  }, [word, imgKey]);

  const src = imgData?.url ?? null;

  return (
    <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl overflow-hidden" style={{ height: 240 }}>
      <div className="relative w-full h-full bg-stone-100 dark:bg-stone-800">
        {!word ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <ImageOff className="w-6 h-6 text-stone-300 dark:text-stone-600" strokeWidth={1} />
            <p className="text-[10px] uppercase tracking-[2px] text-stone-300 dark:text-stone-600">Enter a word</p>
          </div>
        ) : imgError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <ImageOff className="w-5 h-5 text-stone-300 dark:text-stone-600" strokeWidth={1} />
            <p className="text-[10px] text-stone-400 dark:text-stone-500">No image</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div key={word + imgKey} className="absolute inset-0"
              initial={{ opacity: 0, scale: 1.04 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}>
              {imgLoading && (
                <div className="absolute inset-0 flex items-center justify-center z-10">
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}>
                    <Loader2 className="w-5 h-5 text-stone-300" strokeWidth={1.5} />
                  </motion.div>
                </div>
              )}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src!} alt={word} className="w-full h-full object-cover"
                onLoad={() => setImgLoading(false)}
                onError={() => { setImgError(true); setImgLoading(false); }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
              <div className="absolute bottom-3 left-3 right-10">
                <p className="text-white text-base font-extralight tracking-wide drop-shadow">{word}</p>
                {meaning && <p className="text-white/65 text-xs font-light mt-0.5">{meaning}</p>}
              </div>
              <button onClick={() => { setImgKey(k => k + 1); }}
                className="absolute top-2.5 right-2.5 w-7 h-7 rounded-lg bg-black/30 hover:bg-black/50 flex items-center justify-center transition-colors">
                <RefreshCw className="w-3.5 h-3.5 text-white" strokeWidth={1.5} />
              </button>
              {imgData?.author && (<a href={imgData.authorUrl} target="_blank" rel="noreferrer" className="absolute bottom-2 right-2.5 text-[9px] text-white/35 tracking-wide hover:text-white/60 transition-colors">{imgData.author} · Unsplash</a>)}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

// ── Word stats ──
function WordStatsPanel({ word, meaning, partOfSpeech, definition, transcription }: {
  word: string; meaning: string; partOfSpeech: string; definition: string; transcription: string;
}) {
  if (!word) return (
    <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl p-4 flex flex-col items-center justify-center gap-2" style={{ minHeight: 100 }}>
      <BookOpen className="w-5 h-5 text-stone-300 dark:text-stone-600" strokeWidth={1} />
      <p className="text-[10px] uppercase tracking-[2px] text-stone-300 dark:text-stone-600">Word preview</p>
    </div>
  );

  const letters   = word.replace(/[^a-zA-Z]/g, "").length;
  const syllables = Math.max(1, word.toLowerCase().replace(/[^aeiouy]/g,"").replace(/[aeiouy]{2,}/g,"a").length);

  return (
    <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl p-3.5">
      <div className="flex items-baseline gap-2 flex-wrap mb-2 pb-2 border-b border-stone-100 dark:border-stone-800">
        <span className="text-lg font-extralight text-stone-800 dark:text-stone-100 tracking-tight">{word}</span>
        {transcription && <span className="text-xs text-stone-400 dark:text-stone-500 font-light">/{transcription}/</span>}
      </div>
      {meaning && <p className="text-sm text-stone-500 dark:text-stone-400 font-light mb-2.5">{meaning}</p>}
      <div className="grid grid-cols-3 gap-2 mb-2.5">
        {[
          { icon: Hash,    label: "Letters",   value: letters },
          { icon: Layers,  label: "Syllables", value: syllables },
          { icon: BookOpen,label: "Type",      value: partOfSpeech || "—" },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="text-center py-1.5 rounded-lg bg-stone-50 dark:bg-stone-800">
            <p className="text-sm font-light text-stone-700 dark:text-stone-200">{value}</p>
            <p className="text-[9px] uppercase tracking-[1px] text-stone-300 dark:text-stone-600 mt-0.5">{label}</p>
          </div>
        ))}
      </div>
      {definition && (
        <p className="text-[11px] text-stone-400 dark:text-stone-500 italic leading-relaxed">
          &ldquo;{definition}&rdquo;
        </p>
      )}
    </div>
  );
}

// ── Memory tip ──
function MemoryTipPanel({ word, meaning, example }: { word: string; meaning: string; example: string }) {
  return (
    <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl p-3.5 flex-1">
      <Label icon={BookOpen}>Memory Tip</Label>
      {word ? (
        <motion.div key={word} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
          <div className="flex flex-wrap gap-1">
            {word.split("").map((ch, i) => (
              <span key={i} className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs font-light text-stone-700 dark:text-stone-300">
                {ch === " " ? "·" : ch}
              </span>
            ))}
          </div>
          <div className="space-y-1.5 pt-1">
            {[
              { label: "Associate", text: meaning ? `Link "${word}" → "${meaning}" visually` : "—" },
              { label: "Repeat",    text: "Say 3× aloud with eyes closed" },
              { label: "Use it",    text: example ? "Write 1 personal sentence today" : "Generate an example first" },
            ].map(({ label, text }) => (
              <div key={label} className="flex items-start gap-2">
                <div className="w-1 h-1 rounded-full bg-stone-300 dark:bg-stone-600 mt-1.5 flex-shrink-0" />
                <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-relaxed">
                  <span className="text-[10px] uppercase tracking-[1.5px] text-stone-400 dark:text-stone-500">{label} · </span>
                  {text}
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      ) : (
        <p className="text-[11px] text-stone-300 dark:text-stone-600 italic">Enter a word to see tips.</p>
      )}
    </div>
  );
}

// ── Main ──
export default function AddWordPage() {
  const { user } = useAuth();
  const router   = useRouter();

  const [english,        setEnglish]        = useState("");
  const [meaning,        setMeaning]        = useState("");
  const [example,        setExample]        = useState("");
  const [transcription,  setTranscription]  = useState("");
  const [audioUrl,       setAudioUrl]       = useState("");
  const [loading,        setLoading]        = useState(false);
  const [loadingExample, setLoadingExample] = useState(false);
  const [saving,         setSaving]         = useState(false);
  const [success,        setSuccess]        = useState(false);
  const [error,          setError]          = useState("");
  const [topic,          setTopic]          = useState("Daily");
  const [availableParts, setAvailableParts] = useState<MeaningData[]>([]);
  const [selectedPart,   setSelectedPart]   = useState(0);
  const [wordType,       setWordType]       = useState<"word" | "phrase">("word");

  const debouncedEnglish = useDebounce(english, 500);

  useEffect(() => { setWordType(english.trim().includes(" ") ? "phrase" : "word"); }, [english]);

  useEffect(() => {
    if (!debouncedEnglish || debouncedEnglish.length < 2) { setMeaning(""); return; }
    setLoading(true);
    fetch(`/api/translate?word=${encodeURIComponent(debouncedEnglish)}`)
      .then(r => r.json()).then(d => setMeaning(d.meaning || ""))
      .catch(() => setMeaning("")).finally(() => setLoading(false));
  }, [debouncedEnglish]);

  const simpleTranscription = (w: string) =>
    w.toLowerCase().replace(/ough/g,"ɔː").replace(/tion/g,"ʃən").replace(/c/g,"k").replace(/qu/g,"kw").replace(/e$/g,"")
     .split("").map(c=>({a:"æ",e:"ɛ",i:"ɪ",o:"ɒ",u:"ʌ",y:"aɪ"}[c]??c)).join("");

  useEffect(() => {
    if (!english || wordType === "phrase") { setTranscription(""); setAudioUrl(""); setAvailableParts([]); return; }
    fetch(`/api/transcription?word=${encodeURIComponent(english)}`)
      .then(r => r.json()).then(d => {
        setAudioUrl(d.audioUrl || "");
        setTranscription(d.phonetic || simpleTranscription(english));
        if (d.meanings?.length) { setAvailableParts(d.meanings); setSelectedPart(0); } else setAvailableParts([]);
      }).catch(() => { setTranscription(simpleTranscription(english)); setAvailableParts([]); });
  }, [english, wordType]);

  const currentPartOfSpeech = wordType === "phrase" ? "phrase" : (availableParts[selectedPart]?.partOfSpeech || "");
  const currentDefinition   = availableParts[selectedPart]?.definitions[0]?.definition || "";

  const generateExample = async () => {
    if (!english || !meaning) return;
    setLoadingExample(true);
    try {
      const r = await fetch("/api/generate-example", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word: english, meaning: currentDefinition || meaning, partOfSpeech: currentPartOfSpeech, topic }),
      });
      setExample((await r.json()).example || "");
    } catch { setExample(""); } finally { setLoadingExample(false); }
  };

  const handleSubmit = async () => {
    if (!english || !meaning) { setError("Fill in required fields"); setTimeout(() => setError(""), 3000); return; }
    if (!user) return;
    try {
      setSaving(true);
      await addWord({ english, meaning, topic, learned: false, userId: user.uid, example: example || "", isPreset: false, audioUrl: audioUrl || "", phonetic: transcription || "", createdAt: Date.now(), partOfSpeech: currentPartOfSpeech });
      setSuccess(true);
      setTimeout(() => router.push("/dashboard/flashcards"), 1500);
    } catch (err: any) { setError(err.message); setTimeout(() => setError(""), 3000); }
    finally { setSaving(false); }
  };

  return (
    <AuthGuard>
      <div className="h-[calc(100vh-57px)] flex flex-col px-6 py-5 max-w-6xl mx-auto overflow-hidden">

        {/* Header */}
        <motion.div {...fadeUp(0)} className="flex items-end justify-between mb-4 flex-shrink-0">
          <div>
            <p className="text-[10px] uppercase tracking-[3px] text-stone-400 dark:text-stone-500 mb-0.5">
              単語追加 · Add {wordType === "phrase" ? "Phrase" : "Word"}
            </p>
            <h1 className="text-2xl font-extralight tracking-tight text-stone-800 dark:text-stone-100">New Entry</h1>
          </div>
          <div className="flex items-center gap-1.5">
            {["Word","Context","Topic"].map((s, i) => {
              const done = i === 0 ? (!!english && !!meaning) : i === 1 ? !!example : true;
              return (
                <div key={s} className="flex items-center gap-1.5">
                  <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] tracking-wide transition-all duration-300 ${done ? "bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900" : "border border-stone-200 dark:border-stone-700 text-stone-400 dark:text-stone-500"}`}>
                    {done && <Check className="w-2.5 h-2.5" strokeWidth={2.5} />}{s}
                  </div>
                  {i < 2 && <div className="w-4 h-px bg-stone-200 dark:bg-stone-700" />}
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* 3-col grid */}
        <div className="grid grid-cols-3 gap-3 flex-1 min-h-0">

          {/* LEFT: word inputs */}
          <motion.div {...fadeUp(0.04)} className="flex flex-col gap-3 overflow-hidden">
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl p-3.5">
              <Label icon={wordType === "phrase" ? MessageSquare : Globe}
                aside={english ? <span className="text-[10px] px-2 py-0.5 rounded-full border border-stone-200 dark:border-stone-700 text-stone-400 dark:text-stone-500 uppercase tracking-wide">{wordType}</span> : null}>
                English {wordType === "phrase" ? "Phrase" : "Word"}
              </Label>
              <div className="relative">
                <StoneInput value={english} onChange={setEnglish} placeholder={wordType === "phrase" ? "e.g. give up..." : "e.g. ambiguous..."} className="text-base h-10" />
                <AnimatePresence>{loading && <motion.div className="absolute right-3 top-1/2 -translate-y-1/2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><Loader2 className="w-3.5 h-3.5 text-stone-400 animate-spin" strokeWidth={1.5} /></motion.div>}</AnimatePresence>
              </div>
            </div>

            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl p-3.5">
              <Label icon={Languages} aside={meaning ? <span className="flex items-center gap-1 text-[10px] text-stone-400 dark:text-stone-500"><Wand2 className="w-2.5 h-2.5" strokeWidth={1.5} />auto-filled</span> : null}>
                Vietnamese Meaning
              </Label>
              <StoneInput value={meaning} onChange={setMeaning} placeholder="Meaning appears automatically..." />
            </div>

            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl p-3.5 flex flex-col gap-3 flex-1">
              <AnimatePresence>
                {wordType === "word" && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.28 }}>
                    <Label icon={Languages}>Transcription</Label>
                    <StoneInput value={transcription} onChange={setTranscription} placeholder="Phonetic..." />
                  </motion.div>
                )}
              </AnimatePresence>
              <AnimatePresence>
                {wordType === "word" && availableParts.length > 0 && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.28 }}>
                    <Label icon={Tag}>Part of Speech</Label>
                    <div className="flex flex-wrap gap-1.5">
                      {availableParts.map((part, i) => (
                        <button key={i} onClick={() => setSelectedPart(i)}
                          className={`text-[10px] uppercase tracking-[1.5px] px-2.5 py-1 rounded-full border transition-all ${selectedPart === i ? "bg-stone-900 dark:bg-stone-100 border-stone-900 dark:border-stone-100 text-white dark:text-stone-900" : "border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-400 hover:border-stone-400"}`}>
                          {part.partOfSpeech}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="flex-1 flex flex-col justify-end">
                <WordStatsPanel word={english} meaning={meaning} partOfSpeech={currentPartOfSpeech} definition={currentDefinition} transcription={transcription} />
              </div>
            </div>
          </motion.div>

          {/* MIDDLE: example + topic + submit */}
          <motion.div {...fadeUp(0.08)} className="flex flex-col gap-3 overflow-hidden">
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl p-3.5 flex flex-col flex-1">
              <Label icon={FileText}
                aside={<button onClick={generateExample} disabled={!english || !meaning || loadingExample} className="flex items-center gap-1 text-[10px] uppercase tracking-[1.5px] text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 disabled:opacity-30 transition-colors">{loadingExample ? <Loader2 className="w-2.5 h-2.5 animate-spin" strokeWidth={1.5} /> : <Wand2 className="w-2.5 h-2.5" strokeWidth={1.5} />}{loadingExample ? "Generating..." : "AI Generate"}</button>}>
                Example Sentence
              </Label>
              <div className="flex-1"><StoneTextarea value={example} onChange={setExample} placeholder="Click 'AI Generate' or write your own..." /></div>
              {example && english && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2 pt-2 border-t border-stone-100 dark:border-stone-800">
                  <p className="text-[10px] uppercase tracking-[1.5px] text-stone-300 dark:text-stone-600 mb-1">Preview</p>
                  <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                    {example.split(new RegExp(`(${english})`, "gi")).map((part, i) =>
                      part.toLowerCase() === english.toLowerCase()
                        ? <mark key={i} className="bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 rounded px-0.5 not-italic">{part}</mark>
                        : part
                    )}
                  </p>
                </motion.div>
              )}
            </div>

            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl p-3.5">
              <Label icon={Tag}>Topic</Label>
              <div className="grid grid-cols-6 gap-1">
                {TOPICS.map(t => (
                  <button key={t.value} onClick={() => setTopic(t.value)}
                    className={`py-2 rounded-lg border text-center transition-all ${topic === t.value ? "bg-stone-900 dark:bg-stone-100 border-stone-900 dark:border-stone-100" : "border-stone-200 dark:border-stone-700 hover:border-stone-400 dark:hover:border-stone-500"}`}>
                    <p className={`text-[10px] font-light leading-none mb-0.5 ${topic === t.value ? "text-white dark:text-stone-900" : "text-stone-700 dark:text-stone-300"}`}>{t.value}</p>
                    <p className={`text-[9px] ${topic === t.value ? "text-stone-400 dark:text-stone-600" : "text-stone-300 dark:text-stone-600"}`}>{t.labelJa}</p>
                  </button>
                ))}
              </div>
            </div>

            <AnimatePresence>{error && <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-xs text-red-500 dark:text-red-400 px-1">{error}</motion.p>}</AnimatePresence>

            <button onClick={handleSubmit} disabled={!english || !meaning || saving || success}
              className="w-full h-11 rounded-xl flex items-center justify-center gap-2 text-sm font-light tracking-wide transition-all disabled:opacity-40 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 hover:bg-stone-700 dark:hover:bg-stone-300">
              <AnimatePresence mode="wait">
                {success ? <motion.span key="ok" initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-2"><Check className="w-4 h-4" strokeWidth={1.5} />{wordType === "phrase" ? "Phrase" : "Word"} Added</motion.span>
                  : saving ? <motion.span key="saving" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" strokeWidth={1.5} />Saving...</motion.span>
                  : <motion.span key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2"><Plus className="w-4 h-4" strokeWidth={1.5} />Add {wordType === "phrase" ? "Phrase" : "Word"}<ArrowRight className="w-3.5 h-3.5 ml-1" strokeWidth={1.5} /></motion.span>}
              </AnimatePresence>
            </button>
          </motion.div>

          {/* RIGHT: image + memory tip */}
          <motion.div {...fadeUp(0.12)} className="flex flex-col gap-3 overflow-hidden">
            <WordImagePanel word={english} meaning={meaning} />
            <MemoryTipPanel word={english} meaning={meaning} example={example} />
          </motion.div>
        </div>
      </div>
    </AuthGuard>
  );
}