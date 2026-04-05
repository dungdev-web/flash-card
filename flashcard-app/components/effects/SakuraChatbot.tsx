"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle, X, Mic, MicOff, Send, Loader2, Volume2, ChevronDown,
} from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

type RecordState = "idle" | "recording" | "transcribing";

function detectTopic(pathname: string): string {
  if (pathname.includes("/topics/")) {
    return pathname.split("/topics/")[1]?.split("/")[0]?.toLowerCase() ?? "general";
  }
  if (pathname.includes("flashcard")) return "vocabulary";
  if (pathname.includes("add-word"))  return "vocabulary";
  return "general English";
}

// ─── Greeting lines ───────────────────────────────────────────────────────────
const GREETINGS = [
  "こんにちは！ I'm Sakura, your language guide. What would you like to practice today?",
  "ようこそ！ Welcome! Ask me anything about vocabulary or pronunciation.",
  "はじめまして！ Let's learn together. What's on your mind?",
];

// ─── Waveform animation ───────────────────────────────────────────────────────
function Waveform({ active }: { active: boolean }) {
  return (
    <div className="flex items-center gap-[3px] h-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <motion.div
          key={i}
          className="w-[3px] rounded-full bg-pink-300"
          animate={active ? { height: ["4px", "14px", "4px"] } : { height: "4px" }}
          transition={{ duration: 0.6, delay: i * 0.1, repeat: active ? Infinity : 0, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

// ─── Single message bubble ────────────────────────────────────────────────────
function Bubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3`}
    >
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-pink-100 dark:bg-stone-700 flex items-center justify-center mr-2 flex-shrink-0 mt-0.5">
          <span style={{ fontSize: 14 }}>桜</span>
        </div>
      )}
      <div
        className={`max-w-[82%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed
          ${isUser
            ? "bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-br-sm"
            : "bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-100 rounded-bl-sm"
          }`}
      >
        {msg.content}
      </div>
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function SakuraChatbot() {
  const pathname = usePathname();
  const topic = detectTopic(pathname);

  const [open, setOpen]         = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [recState, setRecState] = useState<RecordState>("idle");

  const mediaRef    = useRef<MediaRecorder | null>(null);
  const chunksRef   = useRef<Blob[]>([]);
  const bottomRef   = useRef<HTMLDivElement>(null);
  const inputRef    = useRef<HTMLInputElement>(null);

  // Init greeting
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        id: "init",
        role: "assistant",
        content: GREETINGS[Math.floor(Math.random() * GREETINGS.length)],
        timestamp: new Date(),
      }]);
    }
  }, []);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  // Focus input on open
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 300);
  }, [open]);

  // ── Send message ──
  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: Message = {
      id:        Date.now().toString(),
      role:      "user",
      content:   text.trim(),
      timestamp: new Date(),
    };

    setMessages((p) => [...p, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const history = [...messages, userMsg].slice(-10).map((m) => ({
        role: m.role, content: m.content,
      }));

      const res = await fetch("/api/chat", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ messages: history, topic }),
      });

      const data = await res.json();
      setMessages((p) => [...p, {
        id:        Date.now().toString() + "a",
        role:      "assistant",
        content:   data.reply ?? "申し訳ありません — Something went wrong.",
        timestamp: new Date(),
      }]);
    } catch {
      setMessages((p) => [...p, {
        id:        Date.now().toString() + "e",
        role:      "assistant",
        content:   "接続エラー — Connection error. Please try again.",
        timestamp: new Date(),
      }]);
    } finally {
      setLoading(false);
    }
  }, [messages, loading, topic]);

  // ── Whisper recording ──
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";

      const rec = new MediaRecorder(stream, { mimeType: mime });
      chunksRef.current = [];

      rec.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };

      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        setRecState("transcribing");

        try {
          const blob = new Blob(chunksRef.current, { type: mime });
          const form = new FormData();
          form.append("audio", blob, "recording.webm");

          const res  = await fetch("/api/transcribe", { method: "POST", body: form });
          const data = await res.json();

          if (data.text?.trim()) {
            await sendMessage(data.text.trim());
          }
        } catch {
          setMessages((p) => [...p, {
            id:        Date.now().toString() + "w",
            role:      "assistant",
            content:   "音声認識エラー — Could not transcribe audio.",
            timestamp: new Date(),
          }]);
        } finally {
          setRecState("idle");
        }
      };

      rec.start();
      mediaRef.current = rec;
      setRecState("recording");
    } catch {
      alert("Microphone access denied. Please allow microphone permissions.");
    }
  }, [sendMessage]);

  const stopRecording = useCallback(() => {
    mediaRef.current?.stop();
    mediaRef.current = null;
  }, []);

  const toggleRecord = () => {
    if (recState === "recording") stopRecording();
    else if (recState === "idle") startRecording();
  };

  return (
    <>
      {/* ── Floating button ── */}
      <motion.button
        onClick={() => setOpen((p) => !p)}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        className="fixed bottom-6 right-6 z-[200] w-13 h-13 w-[52px] h-[52px] rounded-full border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 flex items-center justify-center shadow-lg"
        aria-label="Open Sakura chatbot"
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.div key="close" initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0 }}>
              <X className="w-5 h-5 text-stone-500 dark:text-stone-400" strokeWidth={1.5} />
            </motion.div>
          ) : (
            <motion.div key="open" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
              className="flex flex-col items-center gap-0">
              <span style={{ fontSize: 18, lineHeight: 1 }}>桜</span>
              <span style={{ fontSize: 8, letterSpacing: 1, color: "rgb(180,140,140)" }}>AI</span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* ── Chat panel ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="fixed bottom-[72px] right-6 z-[199] w-[340px] flex flex-col rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 overflow-hidden"
            style={{ height: 480, boxShadow: "0 8px 40px rgba(0,0,0,0.12)" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100 dark:border-stone-800 flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-pink-50 dark:bg-stone-800 border border-pink-100 dark:border-stone-700 flex items-center justify-center">
                  <span style={{ fontSize: 16 }}>桜</span>
                </div>
                <div>
                  <p className="text-sm font-light text-stone-800 dark:text-stone-100 tracking-wide">Sakura</p>
                  <p className="text-[10px] uppercase tracking-[1.5px] text-stone-400 dark:text-stone-500">{topic} · tutor</p>
                </div>
              </div>
              <button onClick={() => setOpen(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-stone-400 hover:text-stone-700 dark:hover:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors">
                <ChevronDown className="w-4 h-4" strokeWidth={1.5} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-0" style={{ scrollbarWidth: "none" }}>
              {messages.map((m) => <Bubble key={m.id} msg={m} />)}

              {loading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-full bg-pink-100 dark:bg-stone-700 flex items-center justify-center mr-0 flex-shrink-0">
                    <span style={{ fontSize: 14 }}>桜</span>
                  </div>
                  <div className="px-3.5 py-2.5 rounded-2xl rounded-bl-sm bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
                    <Loader2 className="w-4 h-4 text-stone-400 animate-spin" strokeWidth={1.5} />
                  </div>
                </motion.div>
              )}

              {recState === "transcribing" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-end mb-3">
                  <div className="px-3.5 py-2.5 rounded-2xl rounded-br-sm bg-stone-100 dark:bg-stone-800 flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 text-stone-400 animate-spin" strokeWidth={1.5} />
                    <span className="text-xs text-stone-400">Transcribing...</span>
                  </div>
                </motion.div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* Input bar */}
            <div className="flex-shrink-0 px-3 py-3 border-t border-stone-100 dark:border-stone-800">
              {recState === "recording" && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                  className="flex items-center gap-2 mb-2 px-1">
                  <Waveform active />
                  <span className="text-[11px] uppercase tracking-[1.5px] text-pink-400">Recording...</span>
                </motion.div>
              )}

              <div className="flex items-center gap-2">
                {/* Mic button */}
                <motion.button
                  onClick={toggleRecord}
                  disabled={recState === "transcribing" || loading}
                  whileTap={{ scale: 0.92 }}
                  className={`w-9 h-9 rounded-xl border flex items-center justify-center flex-shrink-0 transition-all
                    ${recState === "recording"
                      ? "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-400"
                      : "border-stone-200 dark:border-stone-700 text-stone-400 dark:text-stone-500 hover:border-stone-400 dark:hover:border-stone-500"
                    } disabled:opacity-30`}
                >
                  {recState === "recording"
                    ? <MicOff className="w-4 h-4" strokeWidth={1.5} />
                    : <Mic className="w-4 h-4" strokeWidth={1.5} />}
                </motion.button>

                {/* Text input */}
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
                  placeholder="Type or speak..."
                  disabled={recState !== "idle" || loading}
                  className="flex-1 h-9 px-3 text-sm bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-800 dark:text-stone-100 placeholder:text-stone-300 dark:placeholder:text-stone-600 focus:outline-none focus:border-stone-400 dark:focus:border-stone-500 transition-colors disabled:opacity-40"
                />

                {/* Send */}
                <motion.button
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim() || loading || recState !== "idle"}
                  whileTap={{ scale: 0.92 }}
                  className="w-9 h-9 rounded-xl bg-stone-900 dark:bg-stone-100 flex items-center justify-center flex-shrink-0 disabled:opacity-25 hover:bg-stone-700 dark:hover:bg-stone-300 transition-colors"
                >
                  <Send className="w-3.5 h-3.5 text-white dark:text-stone-900" strokeWidth={1.5} />
                </motion.button>
              </div>

              <p className="text-[10px] text-center text-stone-300 dark:text-stone-600 mt-2 tracking-[1px]">
                Whisper · Qwen · OpenRouter
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}