// src/components/effects/RoleGatedFeatures.tsx
"use client";

import { useAuth } from "@/app/hooks/useAuth";
import { useRole } from "@/app/hooks/useRole";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Crown, X, ArrowRight } from "lucide-react";
import AuthenticatedExtras from "../providers/AuthenticatedExtras";
import { SeedButton } from "../SeedButton";
import VoiceChat from "./VoiceChat";

// ─── Feature matrix theo role ─────────────────────────────────────────────────
//  role   │ chatbot │ voice │ anki │ seed
//  ───────┼─────────┼───────┼──────┼──────
//  user   │  ✗      │  ✗    │  ✗   │  ✗
//  pro    │  ✓      │  ✗    │  ✗   │  ✗
//  master │  ✓      │  ✓    │  ✓   │  ✗
//  admin  │  ✓      │  ✓    │  ✓   │  ✓

const VIP_FEATURES = [
  { icon: "桜", label: "Sakura AI Chatbot",   desc: "Chat với AI tutor cá nhân",    tier: "pro"    },
  { icon: "🎙",  label: "Voice Conversation", desc: "Luyện nói & nghe với Whisper", tier: "master" },
  { icon: "✦",  label: "Anki Export",         desc: "Xuất flashcard sang Anki",     tier: "master" },
] as const;

function UpgradePrompt() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <motion.button
        onClick={() => setOpen(p => !p)}
        whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
        className="fixed bottom-6 right-6 z-[200] w-[52px] h-[52px] rounded-full border border-amber-200 dark:border-amber-800 bg-white dark:bg-stone-900 flex flex-col items-center justify-center shadow-lg"
      >
        <Crown className="w-5 h-5 text-amber-500" strokeWidth={1.5} />
        <span style={{ fontSize: 8, letterSpacing: 1, color: "rgb(200,150,50)", marginTop: 1 }}>VIP</span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="fixed bottom-[72px] right-6 z-[199] w-[300px] rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 overflow-hidden"
            style={{ boxShadow: "0 8px 40px rgba(0,0,0,0.1)" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100 dark:border-stone-800">
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-500" strokeWidth={1.5} />
                <span className="text-sm font-light text-stone-800 dark:text-stone-100 tracking-wide">VIP Features</span>
              </div>
              <button onClick={() => setOpen(false)}
                className="w-6 h-6 rounded-lg flex items-center justify-center text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors">
                <X className="w-3.5 h-3.5" strokeWidth={1.5} />
              </button>
            </div>

            {/* Features */}
            <div className="px-5 py-4 space-y-3">
              {VIP_FEATURES.map(f => (
                <div key={f.label} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center flex-shrink-0 text-sm">
                    {f.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-light text-stone-800 dark:text-stone-100">{f.label}</p>
                      <span className={`text-[9px] uppercase tracking-[1px] px-1.5 py-0.5 rounded-full
                        ${f.tier === "master"
                          ? "bg-purple-100 dark:bg-purple-950/30 text-purple-500"
                          : "bg-amber-100 dark:bg-amber-950/30 text-amber-500"}`}>
                        {f.tier}
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-400 dark:text-stone-500">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="px-5 pb-5">
              <div className="h-px bg-stone-100 dark:bg-stone-800 mb-4" />
              <a href="/upgrade"
                className="flex items-center justify-center gap-2 w-full h-10 rounded-xl bg-amber-500 hover:bg-amber-400 text-white text-sm font-light tracking-wide transition-colors">
                <Crown className="w-4 h-4" strokeWidth={1.5} />
                Nâng cấp VIP
                <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.5} />
              </a>
              <p className="text-center text-[10px] text-stone-300 dark:text-stone-600 mt-2 tracking-wide">
                Liên hệ admin để kích hoạt
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function RoleGatedFeatures() {
  const { user }                         = useAuth();
  const { loading, isVip, isAdmin, isPro, isMaster } = useRole();

  // Chờ load xong, hoặc chưa đăng nhập → không render gì
  if (loading || !user) return null;

  // User thường → nút upgrade
  if (!isVip) return <UpgradePrompt />;

  return (
    <>
      {/* Pro trở lên: chatbot */}
      {isPro && <AuthenticatedExtras />}
      {/* Master trở lên: voice chat + anki export */} 
      {isMaster && <VoiceChat />}
      {/* Admin only: seed button */}
      {isAdmin && <SeedButton />}
    </>
  );
}