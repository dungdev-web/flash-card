"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic, MicOff, Volume2, VolumeX, X, Loader2,
  Radio, MessageCircle,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Turn {
  id: string;
  role: "user" | "assistant";
  text: string;
}

type Phase =
  | "idle"        // waiting
  | "recording"   // mic active
  | "transcribing"// whisper processing
  | "thinking"    // Qwen generating
  | "speaking"    // TTS playing
  | "error";

function detectTopic(pathname: string): string {
  if (pathname.includes("/topics/")) return pathname.split("/topics/")[1]?.split("/")[0] ?? "general";
  if (pathname.includes("flashcard")) return "vocabulary";
  return "general English";
}

// ─── Waveform bars ────────────────────────────────────────────────────────────
function Waveform({ active, color = "#f9a8d4" }: { active: boolean; color?: string }) {
  return (
    <div className="flex items-center gap-[3px]" style={{ height: 24 }}>
      {Array.from({ length: 7 }).map((_, i) => (
        <motion.div
          key={i}
          style={{ width: 3, borderRadius: 2, background: color, originY: 1 }}
          animate={active
            ? { height: [4, 8 + i * 3, 20, 6, 16, 4] }
            : { height: 4 }}
          transition={{
            duration: 0.7 + i * 0.08,
            delay: i * 0.06,
            repeat: active ? Infinity : 0,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

// ─── Phase label ─────────────────────────────────────────────────────────────
const PHASE_LABEL: Record<Phase, string> = {
  idle:         "tap to speak",
  recording:    "listening...",
  transcribing: "transcribing...",
  thinking:     "thinking...",
  speaking:     "speaking...",
  error:        "error — try again",
};

// ─── Browser TTS fallback ─────────────────────────────────────────────────────
function browserSpeak(text: string): Promise<void> {
  return new Promise((resolve) => {
    const synth = window.speechSynthesis;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang  = "en-US";
    u.rate  = 0.92;
    u.pitch = 1.05;
    const voices = synth.getVoices();
    const v = voices.find(v => v.lang === "en-US" && v.name.toLowerCase().includes("samantha"))
           || voices.find(v => v.lang === "en-US" && v.name.toLowerCase().includes("zira"))
           || voices.find(v => v.lang === "en-US");
    if (v) u.voice = v;
    u.onend = () => resolve();
    u.onerror = () => resolve();
    synth.speak(u);
  });
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function VoiceChat() {
  const pathname = usePathname();
  const topic    = detectTopic(pathname);

  const [open,    setOpen]    = useState(false);
  const [phase,   setPhase]   = useState<Phase>("idle");
  const [turns,   setTurns]   = useState<Turn[]>([]);
  const [muted,   setMuted]   = useState(false);
  const [userText, setUserText] = useState("");

  const mediaRef   = useRef<MediaRecorder | null>(null);
  const chunksRef  = useRef<Blob[]>([]);
  const audioRef   = useRef<HTMLAudioElement | null>(null);
  const historyRef = useRef<{ role: string; content: string }[]>([]);
  const bottomRef  = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns]);

  // Greet on first open
  useEffect(() => {
    if (open && turns.length === 0) {
      const greeting = `こんにちは！ I'm Sakura. Let's practice ${topic}  together. Just speak to me!`;
      addTurn("assistant", greeting);
      if (!muted) speakText(greeting);
    }
  }, [open]);

  const addTurn = (role: Turn["role"], text: string) => {
    const turn: Turn = { id: Date.now().toString(), role, text };
    setTurns(p => [...p, turn]);
    historyRef.current = [...historyRef.current, { role, content: text }];
    return turn;
  };

  // ── Play TTS ──────────────────────────────────────────────────────────────
  const speakText = useCallback(async (text: string) => {
    if (muted) return;
    setPhase("speaking");

    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      const contentType = res.headers.get("content-type") ?? "";

      if (contentType.includes("audio")) {
        // Groq TTS — play binary audio
        const blob = await res.blob();
        const url  = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audioRef.current = audio;
        await new Promise<void>((resolve) => {
          audio.onended = () => resolve();
          audio.onerror = () => resolve();
          audio.play().catch(() => resolve());
        });
        URL.revokeObjectURL(url);
      } else {
        // Fallback — browser TTS
        const { text: fallbackText } = await res.json();
        await browserSpeak(fallbackText ?? text);
      }
    } catch {
      await browserSpeak(text);
    }

    setPhase("idle");
  }, [muted]);

  // ── Stop TTS ──────────────────────────────────────────────────────────────
  const stopSpeaking = () => {
    audioRef.current?.pause();
    window.speechSynthesis?.cancel();
    setPhase("idle");
  };

  // ── Record ────────────────────────────────────────────────────────────────
  const startRecording = useCallback(async () => {
    if (phase !== "idle") { stopSpeaking(); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime   = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus" : "audio/webm";
      const rec    = new MediaRecorder(stream, { mimeType: mime });
      chunksRef.current = [];

      rec.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      rec.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        await handleTranscribe(mime);
      };

      rec.start();
      mediaRef.current = rec;
      setPhase("recording");
    } catch {
      setPhase("error");
      setTimeout(() => setPhase("idle"), 2000);
    }
  }, [phase]);

  const stopRecording = useCallback(() => {
    mediaRef.current?.stop();
    mediaRef.current = null;
  }, []);

  const toggleMic = () => {
    if (phase === "recording") stopRecording();
    else if (phase === "idle") startRecording();
    else if (phase === "speaking") stopSpeaking();
  };

  // ── Transcribe → Chat → TTS ───────────────────────────────────────────────
  const handleTranscribe = async (mime: string) => {
    setPhase("transcribing");

    let userSaid = "";
    try {
      const blob = new Blob(chunksRef.current, { type: mime });
      const form = new FormData();
      form.append("audio", blob, "recording.webm");

      const res  = await fetch("/api/transcribe", { method: "POST", body: form });
      const data = await res.json();
      userSaid   = data.text?.trim() ?? "";
    } catch {
      setPhase("error");
      setTimeout(() => setPhase("idle"), 2000);
      return;
    }

    if (!userSaid) { setPhase("idle"); return; }

    setUserText(userSaid);
    addTurn("user", userSaid);
    setUserText("");

    // Chat
    setPhase("thinking");
    let reply = "";
    try {
      const res = await fetch("/api/chat", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: historyRef.current.slice(-12),
          topic,
          voiceMode: true, // hint for shorter, spoken-style replies
        }),
      });
      const data = await res.json();
      reply = data.reply ?? "申し訳ありません — Could you repeat that?";
    } catch {
      reply = "接続エラー — Connection error. Please try again.";
    }

    addTurn("assistant", reply);
    await speakText(reply);
  };

  // ── Keyboard shortcut: Space to talk ─────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.code === "Space" && document.activeElement?.tagName !== "INPUT") {
        e.preventDefault();
        toggleMic();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, phase, toggleMic]);

  // ── Cleanup on close ──────────────────────────────────────────────────────
  const handleClose = () => {
    stopSpeaking();
    mediaRef.current?.stop();
    setOpen(false);
    setPhase("idle");
  };

  const isBusy = phase === "transcribing" || phase === "thinking";
  const isRec  = phase === "recording";
  const isTTS  = phase === "speaking";

  return (
    <>
      {/* ── Floating button ── */}
      <motion.button
        onClick={() => setOpen(p => !p)}
        whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
        className="fixed bottom-21.5 right-6 z-[200] w-[52px] h-[52px] rounded-full border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 flex flex-col items-center justify-center shadow-lg"
        aria-label="Voice chat"
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.div key="x" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
              <X className="w-5 h-5 text-stone-500 dark:text-stone-400" strokeWidth={1.5} />
            </motion.div>
          ) : (
            <motion.div key="mic" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
              className="flex flex-col items-center">
              <Radio className="w-5 h-5 text-pink-400" strokeWidth={1.5} />
              <span style={{ fontSize: 8, letterSpacing: 1, color: "rgb(180,130,150)", marginTop: 1 }}>VOICE</span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* ── Voice panel ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="fixed bottom-[192px] right-6 z-[199] w-[320px] rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 overflow-hidden flex flex-col"
            style={{ height: 400, boxShadow: "0 8px 40px rgba(0,0,0,0.1)" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100 dark:border-stone-800 flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-pink-50 dark:bg-stone-800 border border-pink-100 dark:border-stone-700 flex items-center justify-center">
                  <span style={{ fontSize: 16 }}>桜</span>
                </div>
                <div>
                  <p className="text-sm font-light text-stone-800 dark:text-stone-100 tracking-wide">Sakura</p>
                  <p className="text-[10px] uppercase tracking-[1.5px] text-stone-400 dark:text-stone-500">voice · {topic}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {/* Mute toggle */}
                <button onClick={() => { setMuted(p => !p); if (isTTS) stopSpeaking(); }}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-stone-400 hover:text-stone-700 dark:hover:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors">
                  {muted
                    ? <VolumeX className="w-4 h-4" strokeWidth={1.5} />
                    : <Volume2 className="w-4 h-4" strokeWidth={1.5} />}
                </button>
                <button onClick={handleClose}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-stone-400 hover:text-stone-700 dark:hover:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors">
                  <X className="w-4 h-4" strokeWidth={1.5} />
                </button>
              </div>
            </div>

            {/* Transcript */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2" style={{ scrollbarWidth: "none" }}>
              {turns.map(t => (
                <motion.div key={t.id}
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  className={`flex ${t.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[82%] px-3 py-2 rounded-xl text-xs leading-relaxed
                    ${t.role === "user"
                      ? "bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-br-sm"
                      : "bg-stone-50 dark:bg-stone-800 border border-stone-100 dark:border-stone-700 text-stone-700 dark:text-stone-200 rounded-bl-sm"}`}>
                    {t.text}
                  </div>
                </motion.div>
              ))}
              {userText && (
                <div className="flex justify-end">
                  <div className="px-3 py-2 rounded-xl rounded-br-sm bg-stone-200 dark:bg-stone-700 text-xs text-stone-500 dark:text-stone-400 italic">
                    {userText}
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Mic area */}
            <div className="flex-shrink-0 border-t border-stone-100 dark:border-stone-800 px-4 py-4">

              {/* Status */}
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] uppercase tracking-[2px] text-stone-400 dark:text-stone-500">
                  {PHASE_LABEL[phase]}
                </p>
                {(isRec || isTTS) && <Waveform active color={isRec ? "#f9a8d4" : "#86efac"} />}
                {isBusy && <Loader2 className="w-3.5 h-3.5 text-stone-400 animate-spin" strokeWidth={1.5} />}
              </div>

              {/* Big mic button */}
              <div className="flex items-center justify-center gap-4">
                <motion.button
                  onClick={toggleMic}
                  disabled={isBusy}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.93 }}
                  className={`w-16 h-16 rounded-full flex items-center justify-center transition-all disabled:opacity-30
                    ${isRec
                      ? "bg-red-500 border-2 border-red-400"
                      : isTTS
                      ? "bg-emerald-500 border-2 border-emerald-400"
                      : "bg-stone-900 dark:bg-stone-100 border-2 border-stone-900 dark:border-stone-100"}`}
                >
                  <AnimatePresence mode="wait">
                    {isRec ? (
                      <motion.div key="stop" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                        <MicOff className="w-6 h-6 text-white" strokeWidth={1.5} />
                      </motion.div>
                    ) : isTTS ? (
                      <motion.div key="vol" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                        <Volume2 className="w-6 h-6 text-white" strokeWidth={1.5} />
                      </motion.div>
                    ) : (
                      <motion.div key="mic" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                        <Mic className="w-6 h-6 text-white dark:text-stone-900" strokeWidth={1.5} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>
              </div>

              <p className="text-center text-[10px] text-stone-300 dark:text-stone-600 mt-3 tracking-[1px]">
                {isRec ? "tap to stop" : isTTS ? "tap to interrupt" : "tap · or hold Space"}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}