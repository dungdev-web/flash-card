"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, Check, Loader2, FileText, Package } from "lucide-react";
import { useAuth } from "@/app/hooks/useAuth";
import { getWordsByUser } from "@/app/libs/firestore";
import { Word } from "@/app/types/word";
import { useRole } from "@/app/hooks/useRole";

type ExportFormat = "txt" | "csv" | "apkg";

// ─── Format converters ────────────────────────────────────────────────────────

function toTSV(words: Word[]): string {
  // FIX: đổi #html:false → #html:true vì dùng <br> <small> <i> trong nội dung
  // FIX: thêm #tags column:3 để Anki nhận đúng cột tags
  const header = "#separator:tab\n#html:true\n#notetype:Basic\n#deck:Sakura Flashcards\n#tags column:3\n";
  const rows = words.map(w => {
    const front = w.phonetic
      ? `${w.english}<br><small style="color:#888">${w.phonetic}</small>`
      : w.english;
    const back = [
      `<b>${w.meaning}</b>`,
      w.example ? `<br><i style="color:#555">${w.example}</i>` : "",
      w.topic   ? `<br><small style="color:#aaa">[${w.topic}]</small>` : "",
    ].filter(Boolean).join("");
    const tags = w.topic?.toLowerCase().replace(/\s+/g, "_") ?? "";
    return `${front}\t${back}\t${tags}`;
  });
  return header + rows.join("\n");
}

function toCSV(words: Word[]): string {
  const header = "English,Phonetic,Vietnamese Meaning,Example,Topic,Learned";
  const escape = (s: string) => `"${(s ?? "").replace(/"/g, '""')}"`;
  const rows = words.map(w =>
    [w.english, w.phonetic, w.meaning, w.example, w.topic, w.learned ? "Yes" : "No"]
      .map(v => escape(String(v ?? "")))
      .join(",")
  );
  return [header, ...rows].join("\n");
}

// ─── Download helpers ─────────────────────────────────────────────────────────

function downloadBlob(content: string, filename: string, mime: string) {
  const bom  = mime.includes("utf-8") ? "\uFEFF" : "";
  const blob = new Blob([bom + content], { type: mime });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadArrayBuffer(buffer: ArrayBuffer, filename: string) {
  const blob = new Blob([buffer], { type: "application/octet-stream" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Main Component ───────────────────────────────────────────────────────────
interface AnkiExportButtonProps {
  words?: Word[];
  topic?: string;
  className?: string;
}

export function AnkiExportButton({ words: wordsProp, topic, className = "" }: AnkiExportButtonProps) {
  const { user }           = useAuth();
  const { isMaster }       = useRole();
  const [open,    setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done,    setDone]  = useState(false);
  const [error,   setError] = useState("");

  const ts   = () => new Date().toISOString().slice(0, 10);
  const slug  = topic ? `_${topic.toLowerCase()}` : "";

  const handleExport = async (format: ExportFormat) => {
    if (!user) { setError("Chưa đăng nhập"); return; }
    if (!isMaster) { setError("Tính năng chỉ dành cho Master"); return; }

    setLoading(true); setError(""); setOpen(false);

    try {
      let words: Word[] = wordsProp ?? await getWordsByUser(user.uid);
      if (topic) words = words.filter(w => w.topic?.toLowerCase() === topic.toLowerCase());
      if (!words.length) { setError("Không có từ để xuất"); setLoading(false); return; }

      if (format === "txt") {
        const content = toTSV(words);
        downloadBlob(content, `sakura${slug}_anki_${ts()}.txt`, "text/plain;charset=utf-8");
        setDone(true);
      }

      if (format === "csv") {
        const content = toCSV(words);
        downloadBlob(content, `sakura${slug}_${ts()}.csv`, "text/csv;charset=utf-8");
        setDone(true);
      }

      if (format === "apkg") {
        const res = await fetch("/api/anki-export", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ words, deckName: topic ? `Sakura::${topic}` : "Sakura Flashcards" }),
        });

        if (!res.ok) throw new Error("Server error generating .apkg");
        const buffer = await res.arrayBuffer();
        downloadArrayBuffer(buffer, `sakura${slug}_${ts()}.apkg`);
        setDone(true);
      }

      setTimeout(() => setDone(false), 3000);
    } catch (err: any) {
      setError(err.message ?? "Export thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <motion.button
        onClick={() => { if (!loading) setOpen(p => !p); }}
        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-light tracking-wide transition-all
          ${done
            ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400"
            : "bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:border-stone-400 dark:hover:border-stone-500"
          } ${loading ? "opacity-60 cursor-not-allowed" : ""}`}
      >
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.span key="l" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Loader2 className="w-4 h-4 animate-spin" strokeWidth={1.5} />
            </motion.span>
          ) : done ? (
            <motion.span key="d" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
              <Check className="w-4 h-4" strokeWidth={2} />
            </motion.span>
          ) : (
            <motion.span key="i" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Download className="w-4 h-4" strokeWidth={1.5} />
            </motion.span>
          )}
        </AnimatePresence>
        {loading ? "Đang xuất..." : done ? "Đã xuất!" : "Xuất Anki"}
      </motion.button>

      <AnimatePresence>
        {open && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.97 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="absolute left-0 bottom-[calc(100%+6px)] z-50 w-64 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-2xl shadow-lg overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-stone-100 dark:border-stone-800">
              <p className="text-[10px] uppercase tracking-[2px] text-stone-400 dark:text-stone-500">
                Chọn định dạng xuất
              </p>
            </div>

            {[
              { fmt: "txt" as ExportFormat, icon: FileText, label: "Anki TXT", desc: "Import thẳng vào Anki · có HTML", recommended: true },
              { fmt: "csv" as ExportFormat, icon: FileText, label: "CSV", desc: "Excel, Google Sheets, Anki", recommended: false },
              { fmt: "apkg" as ExportFormat, icon: Package, label: "Anki Package (.apkg)", desc: "File native · double-click để import", recommended: false },
            ].map(({ fmt, icon: Icon, label, desc, recommended }) => (
              <button
                key={fmt}
                onClick={() => handleExport(fmt)}
                className="w-full flex items-start gap-3 px-4 py-3 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors text-left group"
              >
                <div className="w-8 h-8 rounded-lg bg-stone-100 dark:bg-stone-800 group-hover:bg-stone-200 dark:group-hover:bg-stone-700 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors">
                  <Icon className="w-4 h-4 text-stone-500 dark:text-stone-400" strokeWidth={1.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-light text-stone-700 dark:text-stone-200">{label}</p>
                    {recommended && (
                      <span className="text-[9px] uppercase tracking-[1px] px-1.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800">
                        Khuyên dùng
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-stone-400 dark:text-stone-500 mt-0.5">{desc}</p>
                </div>
              </button>
            ))}

            <div className="px-4 py-2.5 border-t border-stone-100 dark:border-stone-800">
              <p className="text-[10px] text-stone-300 dark:text-stone-600 leading-relaxed">
                TXT: Anki → File → Import → chọn file → Tab separator<br />
                APKG: Double-click file để import trực tiếp
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="absolute right-0 top-[calc(100%+4px)] text-[11px] text-red-500 dark:text-red-400 bg-white dark:bg-stone-900 border border-red-100 dark:border-red-900 px-3 py-1.5 rounded-lg whitespace-nowrap z-50"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      {open && (
        <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
      )}
    </div>
  );
}