// Thêm tạm vào dashboard/page.tsx, chạy seed xong thì xóa component này đi

"use client";
import { useState } from "react";
import { Loader2, Database, Check } from "lucide-react";

export function SeedButton() {
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [result, setResult] = useState<{ added: number; skipped: number; total: number } | null>(null);

  const run = async () => {
    setState("loading");
    try {
      const res  = await fetch("/api/seed", { method: "POST" });
      const data = await res.json();
      setResult(data);
      setState("done");
    } catch {
      setState("error");
    }
  };

  return (
    <div className="fixed bottom-24 lèft-6 z-[300]">
      {state === "done" && result && (
        <div className="mb-2 px-4 py-2.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-xs text-stone-600 dark:text-stone-400 text-right">
          <p className="font-medium text-stone-800 dark:text-stone-100">Seed complete</p>
          <p>Added: {result.added} · Skipped: {result.skipped}</p>
        </div>
      )}
      {state === "error" && (
        <div className="mb-2 px-4 py-2 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 text-xs text-red-500">
          Error — check console
        </div>
      )}
      <button
        onClick={run}
        disabled={state === "loading" || state === "done"}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-xs font-light tracking-wide disabled:opacity-50 hover:bg-stone-700 dark:hover:bg-stone-300 transition-all"
      >
        {state === "loading" ? <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={1.5} />
          : state === "done" ? <Check className="w-3.5 h-3.5" strokeWidth={1.5} />
          : <Database className="w-3.5 h-3.5" strokeWidth={1.5} />}
        {state === "loading" ? "Seeding..." : state === "done" ? "Done" : "Seed Preset Words"}
      </button>
    </div>
  );
}