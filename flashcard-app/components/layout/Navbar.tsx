"use client";

import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ThemeToggle from "./ThemeToggle";
import { logout } from "@/app/libs/auth";
import { LogOut, BookOpen, Plus, LayoutDashboard, Menu, X } from "lucide-react";
import { useShojiNav } from "@/components/providers/ShojiContext";

const navItems = [
  {
    href: "/dashboard",
    label: "Dashboard",
    labelJa: "概要",
    icon: LayoutDashboard,
    num: "01",
  },
  {
    href: "/dashboard/flashcards",
    label: "Flashcards",
    labelJa: "単語カード",
    icon: BookOpen,
    num: "02",
  },
  {
    href: "/dashboard/add-word",
    label: "Add Word",
    labelJa: "追加",
    icon: Plus,
    num: "03",
  },
  {
    href: "/dashboard/topics",
    label: "Topics",
    labelJa: "トピック",
    icon: BookOpen,
    num: "04",
  },
];

function ShojiPanel({ side }: { side: "left" | "right" }) {
  const cols = 4,
    rows = 9;
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 border-[10px] border-[#7a5c38]" />
      <div className="absolute left-[10px] right-[10px] top-[10px]    h-[5px] bg-[#5a4228]" />
      <div className="absolute left-[10px] right-[10px] bottom-[10px] h-[5px] bg-[#5a4228]" />
      <div className="absolute inset-[15px]">
        {Array.from({ length: cols - 1 }).map((_, i) => (
          <div
            key={`v${i}`}
            className="absolute top-0 bottom-0 w-[2px] bg-[#8b6b44]"
            style={{ left: `${((i + 1) / cols) * 100}%` }}
          />
        ))}
        {Array.from({ length: rows - 1 }).map((_, j) => (
          <div
            key={`h${j}`}
            className="absolute left-0 right-0 h-[2px] bg-[#8b6b44]"
            style={{ top: `${((j + 1) / rows) * 100}%` }}
          />
        ))}
        {Array.from({ length: rows }).map((_, r) =>
          Array.from({ length: cols }).map((_, c) => (
            <div
              key={`${r}-${c}`}
              className="absolute bg-[rgba(255,252,235,0.76)]"
              style={{
                left: `${(c / cols) * 100 + 0.4}%`,
                top: `${(r / rows) * 100 + 0.4}%`,
                width: `${(1 / cols) * 100 - 0.8}%`,
                height: `${(1 / rows) * 100 - 0.8}%`,
              }}
            />
          )),
        )}
      </div>
      <div
        className={`absolute top-1/2 -translate-y-1/2 w-[7px] h-[56px] bg-[#7a5c38] rounded-full
        ${side === "left" ? "right-[18px]" : "left-[18px]"}`}
      />
    </div>
  );
}

function ShojiMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const { navigate } = useShojiNav();

  const handleNav = (href: string) => {
    onClose();
    navigate(href);
  };

  // Timing constants
  // Phase 1: doors slide in to center  → 0s – 0.50s
  // Phase 2: doors hold at center      → 0.50s – 0.55s
  // Phase 3: doors slide out           → 0.55s – 1.20s
  // Content appears after doors finish opening
  const CONTENT_DELAY = 1.5;

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[999]">
          <div className="absolute inset-0 bg-[#0c0c10]">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(0deg,transparent,transparent 79px,rgba(255,255,255,0.02) 80px)," +
                  "repeating-linear-gradient(90deg,transparent,transparent 79px,rgba(255,255,255,0.02) 80px)",
              }}
            />
          </div>

          {/* Menu content — appears only after doors have opened */}
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: CONTENT_DELAY, duration: 0.4 }}
          >
            <motion.div
              className="mb-14 text-center pointer-events-none"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: CONTENT_DELAY + 0.07 }}
            >
              <p className="text-[10px] uppercase tracking-[4px] text-stone-600 mb-1">
                学習アプリ
              </p>
              <p className="text-lg font-extralight tracking-[3px] text-white/80">
                FlashCard
              </p>
            </motion.div>

            <nav className="flex flex-col gap-1 w-72 pointer-events-auto">
              {navItems.map((item, idx) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <motion.div
                    key={item.href}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      delay: CONTENT_DELAY + 0.1 + idx * 0.07,
                      duration: 0.45,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                  >
                    <button
                      onClick={() => handleNav(item.href)}
                      className="w-full text-left"
                    >
                      <div
                        className={`relative flex items-center gap-4 px-5 py-4 rounded-xl transition-all duration-200
                        ${
                          isActive
                            ? "bg-white/[0.07] text-white"
                            : "text-stone-500 hover:bg-white/[0.04] hover:text-stone-300"
                        }`}
                      >
                        {isActive && (
                          <span className="absolute left-0 top-[22%] h-[56%] w-[2px] bg-stone-400 rounded-r-full" />
                        )}
                        <Icon
                          className="w-4 h-4 flex-shrink-0"
                          strokeWidth={1.5}
                        />
                        <span className="text-sm font-light tracking-wide flex-1">
                          {item.label}
                        </span>
                        <span className="text-[10px] text-stone-700 tracking-widest">
                          {item.labelJa}
                        </span>
                        <span className="text-[10px] text-stone-700 tabular-nums ml-2">
                          {item.num}
                        </span>
                      </div>
                    </button>
                  </motion.div>
                );
              })}
            </nav>

            <motion.div
              className="mt-14 flex flex-col items-center gap-4 pointer-events-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: CONTENT_DELAY + 0.45 }}
            >
              <div className="h-px w-16 bg-stone-800" />
              <button
                onClick={logout}
                className="flex items-center gap-2 text-[11px] uppercase tracking-[2px] text-stone-600 hover:text-stone-400 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" strokeWidth={1.5} />
                Logout
              </button>
            </motion.div>
          </motion.div>

          {/* Left shoji door: slides in from left → closes → opens back left */}
          <motion.div
            className="absolute top-0 left-0 bottom-0 w-1/2 z-20"
            initial={{ x: "-100%" }}
            animate={{ x: ["-100%", "0%", "-100%"] }}
            exit={{ x: 0 }}
            transition={{
              duration: 1.6,
              times: [0, 0.62, 1],
              ease: [0.4, 0, 0.2, 1],
            }}
          >
            <ShojiPanel side="left" />
          </motion.div>

          {/* Right shoji door: slides in from right → closes → opens back right */}
          <motion.div
            className="absolute top-0 right-0 bottom-0 w-1/2 z-20"
            initial={{ x: "100%" }}
            animate={{ x: ["100%", "0%", "100%"] }}
            exit={{ x: 0 }}
            transition={{
              duration: 1.6,
              times: [0, 0.62, 1],
              ease: [0.4, 0, 0.2, 1],
            }}
          >
            <ShojiPanel side="right" />
          </motion.div>

          {/* Center seam — visible only while doors are shut */}
          <motion.div
            className="absolute top-0 bottom-0 left-1/2 w-[2px]  z-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 1, 0] }}
            transition={{ duration: 1.2, times: [0, 0.38, 0.52, 0.62] }}
          />

          <div className="absolute top-0    left-0 right-0 h-[14px]  z-30 pointer-events-none" />
          <div className="absolute bottom-0 left-0 right-0 h-[14px]  z-30 pointer-events-none" />
          <div className="absolute top-0 bottom-0 left-0  w-[12px]  z-30 pointer-events-none" />
          <div className="absolute top-0 bottom-0 right-0 w-[12px]  z-30 pointer-events-none" />

          <motion.button
            onClick={onClose}
            className="absolute top-5 right-5 z-40 w-8 h-8 rounded-full border border-stone-700 text-stone-500 hover:text-stone-300 hover:border-stone-500 flex items-center justify-center transition-all"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: CONTENT_DELAY + 0.1 }}
          >
            <X className="w-3.5 h-3.5" strokeWidth={1.5} />
          </motion.button>
        </div>
      )}
    </AnimatePresence>
  );
}

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <>
      <motion.nav
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className={`border-b border-stone-200 dark:border-stone-800 bg-white/80 dark:bg-stone-950/80 backdrop-blur-xl transition-all duration-300
  ${scrolled ? "fixed top-0 left-0 right-0 z-50 shadow-sm" : "relative"}`}
      >
        <motion.div
          className="absolute inset-x-0 bottom-0 h-px bg-stone-200 dark:bg-stone-700"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.9, delay: 0.25 }}
        />

        <div className="flex items-center justify-between px-3 py-3.5 max-w-5xl mx-auto">
          <button
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            className="w-9 h-9 rounded-xl border border-stone-200 dark:border-stone-700 flex items-center justify-center text-stone-500 dark:text-stone-400 hover:border-stone-400 dark:hover:border-stone-500 hover:text-stone-800 dark:hover:text-stone-200 transition-all"
          >
            <Menu className="w-4 h-4" strokeWidth={1.5} />
          </button>

          <div className="text-center">
            <p className="text-[9px] uppercase tracking-[3px] text-stone-400 dark:text-stone-500 leading-none mb-0.5">
              学習
            </p>
            <p className="text-sm font-light tracking-[2px] text-stone-700 dark:text-stone-300">
              FlashCard
            </p>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={logout}
              aria-label="Logout"
              className="w-9 h-9 rounded-xl border border-stone-200 dark:border-stone-700 flex items-center justify-center text-stone-400 dark:text-stone-500 hover:border-stone-400 dark:hover:border-stone-500 hover:text-stone-700 dark:hover:text-stone-300 transition-all"
            >
              <LogOut className="w-4 h-4" strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </motion.nav>
      {scrolled && <div className="h-[57px]" />}
      <ShojiMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}
