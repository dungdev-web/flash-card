"use client";

import { createContext, useContext, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Types ────────────────────────────────────────────────────────────────────
type ShojiState = "idle" | "closing" | "closed" | "opening";

interface ShojiCtx {
  navigate: (href: string) => void;
}

const ShojiContext = createContext<ShojiCtx>({ navigate: () => {} });
export const useShojiNav = () => useContext(ShojiContext);

// ─── Shoji Panel ─────────────────────────────────────────────────────────────
function ShojiPanel({ side }: { side: "left" | "right" }) {
  const cols = 4;
  const rows = 9;
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 border-[10px] border-[#7a5c38]" />
      <div className="absolute left-[10px] right-[10px] top-[10px] h-[5px] bg-[#5a4228]" />
      <div className="absolute left-[10px] right-[10px] bottom-[10px] h-[5px] bg-[#5a4228]" />
      <div className="absolute inset-[15px]">
        {Array.from({ length: cols - 1 }).map((_, i) => (
          <div key={`v${i}`} className="absolute top-0 bottom-0 w-[2px] bg-[#8b6b44]"
            style={{ left: `${((i + 1) / cols) * 100}%` }} />
        ))}
        {Array.from({ length: rows - 1 }).map((_, j) => (
          <div key={`h${j}`} className="absolute left-0 right-0 h-[2px] bg-[#8b6b44]"
            style={{ top: `${((j + 1) / rows) * 100}%` }} />
        ))}
        {Array.from({ length: rows }).map((_, r) =>
          Array.from({ length: cols }).map((_, c) => (
            <div key={`${r}-${c}`} className="absolute bg-[rgba(255,252,235,0.76)]"
              style={{
                left: `${(c / cols) * 100 + 0.4}%`,
                top: `${(r / rows) * 100 + 0.4}%`,
                width: `${(1 / cols) * 100 - 0.8}%`,
                height: `${(1 / rows) * 100 - 0.8}%`,
              }} />
          ))
        )}
      </div>
      <div className={`absolute top-1/2 -translate-y-1/2 w-[7px] h-[56px] bg-[#7a5c38] rounded-full ${
        side === "left" ? "right-[18px]" : "left-[18px]"
      }`} />
    </div>
  );
}

// ─── Door variants ────────────────────────────────────────────────────────────
// closing = doors slide IN to center (covering screen)
// opening = doors slide OUT from center (revealing page)
const leftVariants = {
  hidden:  { x: "-100%" },   // off-screen left (fully open)
  closing: { x: 0 },          // slide in → covers left half
  opening: { x: "-100%" },    // slide out → reveals left half
};
const rightVariants = {
  hidden:  { x: "100%" },
  closing: { x: 0 },
  opening: { x: "100%" },
};

// ─── Provider ─────────────────────────────────────────────────────────────────
export function ShojiProvider({ children }: { children: React.ReactNode }) {
  const [phase, setPhase] = useState<ShojiState>("idle");
  const routerRef = useRef<(href: string) => void>(null!);

  // Inject Next.js router lazily (avoids SSR issues)
  const setRouter = useCallback((fn: (href: string) => void) => {
    routerRef.current = fn;
  }, []);

  const navigate = useCallback((href: string) => {
    // 1) Close doors
    setPhase("closing");

    // 2) After doors fully closed, navigate
    setTimeout(() => {
      setPhase("closed");
      routerRef.current?.(href);

      // 3) Small pause so new page renders behind closed doors, then open
      setTimeout(() => {
        setPhase("opening");

        // 4) After opening done, reset
        setTimeout(() => setPhase("idle"), 1100);
      }, 80);
    }, 1000); // matches closing transition duration
  }, []);

  const showDoors = phase !== "idle";
  const doorAnim = phase === "closing" || phase === "closed" ? "closing" : "opening";

  return (
    <ShojiContext.Provider value={{ navigate }}>
      <ShojiRouterBridge setRouter={setRouter} />
      {children}

      {/* Fullscreen shoji overlay */}
      {showDoors && (
        <div className="fixed inset-0 z-[9999] pointer-events-none">
          {/* Dark backdrop */}
          <div className="absolute inset-0 bg-[#0d0d18]" />

          {/* Left door */}
          <motion.div
            className="absolute top-0 left-0 bottom-0 w-1/2"
            variants={leftVariants}
            initial="hidden"
            animate={doorAnim}
            transition={{ duration: 1.0, ease: [0.4, 0, 0.2, 1] }}
          >
            <ShojiPanel side="left" />
          </motion.div>

          {/* Right door */}
          <motion.div
            className="absolute top-0 right-0 bottom-0 w-1/2"
            variants={rightVariants}
            initial="hidden"
            animate={doorAnim}
            transition={{ duration: 1.0, ease: [0.4, 0, 0.2, 1] }}
          >
            <ShojiPanel side="right" />
          </motion.div>

          {/* Wood frame */}
          <div className="absolute top-0 left-0 right-0 h-[14px] " />
          <div className="absolute bottom-0 left-0 right-0 h-[14px] " />
          <div className="absolute top-0 bottom-0 left-0 w-[12px] " />
          <div className="absolute top-0 bottom-0 right-0 w-[12px] " />
        </div>
      )}
    </ShojiContext.Provider>
  );
}

// Bridge component to grab Next.js router inside client tree
function ShojiRouterBridge({ setRouter }: { setRouter: (fn: (href: string) => void) => void }) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { useRouter } = require("next/navigation");
  const router = useRouter();
  // Register push fn once
  useState(() => { setRouter((href) => router.push(href)); });
  return null;
}