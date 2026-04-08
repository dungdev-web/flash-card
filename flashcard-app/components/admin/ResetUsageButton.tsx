// components/admin/ResetUsageButton.tsx
"use client";

import { useState } from "react";
import { useAuth } from "@/app/hooks/useAuth";
import { RotateCcw, Loader2, Check, X } from "lucide-react";

interface Props {
  userId: string;
  userName?: string;
  date?: string; // "YYYY-MM-DD", defaults to today
  onSuccess?: () => void;
}

export default function ResetUsageButton({ userId, userName, date, onSuccess }: Props) {
  const { user } = useAuth();
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [confirm, setConfirm] = useState(false);

  const handleReset = async () => {
    if (!confirm) {
      setConfirm(true);
      setTimeout(() => setConfirm(false), 3000); // auto cancel after 3s
      return;
    }

    setStatus("loading");
    setConfirm(false);

    try {
      const token = await user!.getIdToken();
      const res = await fetch("/api/admin/reset-usage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId, date }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Reset failed");
      }

      setStatus("success");
      onSuccess?.();
      setTimeout(() => setStatus("idle"), 2500);
    } catch (err: any) {
      console.error(err);
      setStatus("error");
      setTimeout(() => setStatus("idle"), 2500);
    }
  };

  return (
    <button
      onClick={handleReset}
      disabled={status === "loading"}
      title={`Reset example gen count for ${userName ?? userId}`}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] border transition-all
        ${confirm
          ? "border-amber-400 bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400"
          : status === "success"
          ? "border-green-300 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
          : status === "error"
          ? "border-red-300 bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400"
          : "border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-400 hover:border-stone-400 dark:hover:border-stone-500"
        }`}
    >
      {status === "loading" && <Loader2 className="w-3 h-3 animate-spin" strokeWidth={1.5} />}
      {status === "success" && <Check className="w-3 h-3" strokeWidth={2} />}
      {status === "error"   && <X className="w-3 h-3" strokeWidth={2} />}
      {status === "idle"    && <RotateCcw className="w-3 h-3" strokeWidth={1.5} />}

      {status === "loading" ? "Resetting..."
       : status === "success" ? "Reset!"
       : status === "error"   ? "Failed"
       : confirm              ? "Confirm reset?"
       :                        "Reset usage"}
    </button>
  );
}