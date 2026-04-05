"use client";

import { useState } from "react";
import { loginWithEmail, loginWithGoogle } from "@/app/libs/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Mail, Lock, ArrowRight, Chrome } from "lucide-react";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const, delay },
});

function StoneInput({
  type = "text", value, onChange, placeholder, icon: Icon,
}: {
  type?: string; value: string; onChange: (v: string) => void;
  placeholder?: string; icon: React.ElementType;
}) {
  return (
    <div className="relative">
      <Icon
        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-300 dark:text-stone-600"
        strokeWidth={1.5}
      />
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-11 pl-10 pr-4 text-sm bg-stone-50 dark:bg-stone-800/60
          border border-stone-200 dark:border-stone-700 rounded-xl
          text-stone-800 dark:text-stone-100
          placeholder:text-stone-300 dark:placeholder:text-stone-600
          focus:outline-none focus:border-stone-400 dark:focus:border-stone-500
          transition-colors"
      />
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) { setError("Please fill in all fields"); return; }
    try {
      setLoading(true); setError("");
      await loginWithEmail(email, password);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally { setLoading(false); }
  };

  const handleGoogle = async () => {
    try {
      setGoogleLoading(true); setError("");
      await loginWithGoogle();
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally { setGoogleLoading(false); }
  };

  return (
    <div className="min-h-screen flex">

      {/* ── Left panel — decorative ── */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="hidden lg:flex flex-col justify-between w-[420px] flex-shrink-0 bg-stone-900 dark:bg-white px-12 py-14 relative overflow-hidden"
      >
        {/* Subtle grid */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 39px,#fff 40px),repeating-linear-gradient(90deg,transparent,transparent 39px,#fff 40px)" }} />

        {/* Kumiko corner */}
        <div className="absolute top-0 right-0 w-32 h-32 border-b border-l border-stone-700 rounded-bl-3xl" />
        <div className="absolute bottom-0 left-0 w-24 h-24 border-t border-r border-stone-700 rounded-tr-3xl" />

        {/* Top wordmark */}
        <div className="relative z-10">
          <p className="text-[10px] uppercase tracking-[4px] text-stone-600 mb-1">学習アプリ</p>
          <p className="text-xl font-extralight tracking-[3px] text-white/80 dark:text-black">FlashCard</p>
        </div>

        {/* Center quote */}
        <div className="relative z-10">
          <p className="text-4xl font-extralight text-white/90 dark:text-black leading-tight tracking-tight mb-4">
            学ぶことは<br />生きること
          </p>
          <p className="text-sm font-light text-stone-500 tracking-wide">
            To learn is to live.
          </p>
          <div className="mt-8 h-px w-12 bg-stone-700" />
        </div>

        {/* Bottom stats */}
        <div className="relative z-10 grid grid-cols-3 gap-4">
          {[
            { value: "10k+", label: "Words" },
            { value: "4",    label: "Topics" },
            { value: "AI",   label: "Powered" },
          ].map(({ value, label }) => (
            <div key={label}>
              <p className="text-lg font-extralight text-white/70 dark:text-black tracking-tight">{value}</p>
              <p className="text-[10px] uppercase tracking-[2px] text-stone-600 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── Right panel — form ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-stone-50 dark:bg-stone-950">
        <div className="w-full max-w-sm">

          {/* Header */}
          <motion.div {...fadeUp(0)} className="mb-10">
            {/* Mobile-only wordmark */}
            <div className="lg:hidden mb-8">
              <p className="text-[10px] uppercase tracking-[4px] text-stone-400 dark:text-stone-500 mb-0.5">学習アプリ</p>
              <p className="text-base font-light tracking-[2px] text-stone-700 dark:text-stone-300">FlashCard</p>
            </div>
            <p className="text-[11px] uppercase tracking-[3px] text-stone-400 dark:text-stone-500 mb-1">
              ログイン · Sign in
            </p>
            <h1 className="text-3xl font-extralight tracking-tight text-stone-800 dark:text-stone-100">
              Welcome back
            </h1>
          </motion.div>

          {/* Google */}
          <motion.div {...fadeUp(0.06)} className="mb-6">
            <button
              onClick={handleGoogle}
              disabled={googleLoading || loading}
              className="w-full h-11 flex items-center justify-center gap-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-sm font-light text-stone-700 dark:text-stone-300 hover:border-stone-400 dark:hover:border-stone-500 hover:text-stone-900 dark:hover:text-stone-100 transition-all disabled:opacity-40"
            >
              {googleLoading
                ? <Loader2 className="w-4 h-4 animate-spin" strokeWidth={1.5} />
                : <Chrome className="w-4 h-4" strokeWidth={1.5} />}
              Continue with Google
            </button>
          </motion.div>

          {/* Divider */}
          <motion.div {...fadeUp(0.09)} className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-stone-200 dark:bg-stone-800" />
            <span className="text-[10px] uppercase tracking-[2px] text-stone-300 dark:text-stone-600">or</span>
            <div className="flex-1 h-px bg-stone-200 dark:bg-stone-800" />
          </motion.div>

          {/* Email + Password */}
          <motion.div {...fadeUp(0.12)} className="space-y-3 mb-4">
            <StoneInput
              value={email} onChange={setEmail}
              placeholder="Email address" icon={Mail}
            />
            <StoneInput
              type="password" value={password} onChange={v => { setPassword(v); setError(""); }}
              placeholder="Password" icon={Lock}
            />
          </motion.div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="text-xs text-red-500 dark:text-red-400 mb-4 px-1"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          {/* Submit */}
          <motion.div {...fadeUp(0.15)}>
            <button
              onClick={handleLogin}
              disabled={loading || googleLoading}
              className="w-full h-11 rounded-xl flex items-center justify-center gap-2 text-sm font-light tracking-wide transition-all disabled:opacity-40 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 hover:bg-stone-700 dark:hover:bg-stone-300"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" strokeWidth={1.5} />
              ) : (
                <>
                  Sign in
                  <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
                </>
              )}
            </button>
          </motion.div>

          {/* Footer */}
          <motion.div {...fadeUp(0.18)} className="mt-8 flex items-center justify-between">
            <p className="text-xs text-stone-400 dark:text-stone-500">
              Chưa có tài khoản?{" "}
              <Link href="/register" className="text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 transition-colors underline underline-offset-2">
                Đăng ký
              </Link>
            </p>
            <div className="h-3 w-px bg-stone-200 dark:bg-stone-700" />
            <p className="text-[10px] uppercase tracking-[2px] text-stone-300 dark:text-stone-600">
              桜 · AI
            </p>
          </motion.div>

        </div>
      </div>
    </div>
  );
}