"use client";

import { useState, useEffect, useRef } from "react";
import { loginWithEmail, loginWithGoogle } from "@/app/libs/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Mail, Lock, ArrowRight, Chrome } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const, delay },
});

function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      alpha: number;
      char: string;
      type: "kanji" | "dot" | "line";
      angle: number;
      va: number;
      len: number;
      life: number;
      maxLife: number;
    }

    const KANJI = [
      "桜",
      "語",
      "学",
      "花",
      "心",
      "道",
      "水",
      "山",
      "風",
      "光",
      "空",
      "夢",
      "愛",
      "詩",
      "書",
      "旅",
      "時",
      "命",
      "力",
      "友",
      "笑",
      "音",
      "色",
      "月",
      "星",
      "森",
      "海",
      "鳥",
      "雨",
      "雪",
      "葉",
      "森",
      "空",
      "海",
      "川",
      "石",
      "火",
      "風",
      "花",
      "月",
      "山",
      "川",
      "森",
      "空",
      "海",
      "川",
      "石",
      "火",
      "風",
      "花",
      "月",
      "山",
      "川",
      "森",
      "空",
      "海",
      "川",
      "石",
      "火",
      "風",
      "花",
      "月",
    ];
    const particles: Particle[] = [];

    const spawn = () => {
      const W = canvas.width,
        H = canvas.height;
      const r = Math.random();
      const type: "kanji" | "dot" | "line" =
        r < 0.25 ? "kanji" : r < 0.55 ? "dot" : "line";
      const maxLife = 200 + Math.random() * 320;
      particles.push({
        x: Math.random() * W,
        y: H * 0.2 + Math.random() * H * 0.8,
        vx: (Math.random() - 0.5) * 0.28,
        vy: -0.12 - Math.random() * 0.22,
        size:
          type === "kanji" ? 12 + Math.random() * 16 : 1.5 + Math.random() * 3,
        alpha: 0,
        char: KANJI[Math.floor(Math.random() * KANJI.length)],
        type,
        angle: Math.random() * Math.PI * 2,
        va: (Math.random() - 0.5) * 0.007,
        len: 24 + Math.random() * 72,
        life: 0,
        maxLife,
      });
    };

    for (let i = 0; i < 45; i++) {
      particles.push({
        x: Math.random() * 1000,
        y: Math.random() * 800,
        vx: 0,
        vy: -0.2,
        size: 12,
        alpha: 0,
        char: KANJI[i % KANJI.length],
        type: "kanji",
        angle: Math.random() * Math.PI * 2,
        va: 0.005,
        len: 40,
        life: Math.floor(Math.random() * 280),
        maxLife: 380,
      });
    }

    let frame = 0;
    let raf: number;

    const loop = () => {
      const W = canvas.width,
        H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      ctx.fillStyle = "#f0ebe3";
      ctx.fillRect(0, 0, W, H);

      ctx.strokeStyle = "rgba(140,110,90,0.18)";
      ctx.lineWidth = 0.5;
      const g = 48;
      for (let x = 0; x < W; x += g) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
        ctx.stroke();
      }
      for (let y = 0; y < H; y += g) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }

      frame++;
      if (frame % 20 === 0 && particles.length < 85) spawn();

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life++;
        p.x += p.vx + Math.sin(frame * 0.007 + i * 0.4) * 0.1;
        p.y += p.vy;
        p.angle += p.va;

        const prog = p.life / p.maxLife;
        p.alpha =
          prog < 0.12
            ? prog / 0.12
            : prog > 0.78
              ? 1 - (prog - 0.78) / 0.22
              : 1;

        if (p.life >= p.maxLife || p.y < -80) {
          particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = p.alpha * 0.55;

        if (p.type === "kanji") {
          ctx.font = `300 ${p.size}px serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillStyle = "#3d2218";
          ctx.translate(p.x, p.y);
          ctx.rotate(p.angle * 0.25);
          ctx.fillText(p.char, 0, 0);
        } else if (p.type === "dot") {
          ctx.fillStyle = "#a06040";
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.strokeStyle = "#905030";
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          const dx = Math.cos(p.angle) * p.len * 0.5;
          const dy = Math.sin(p.angle) * p.len * 0.5;
          ctx.moveTo(p.x - dx, p.y - dy);
          ctx.lineTo(p.x + dx, p.y + dy);
          ctx.stroke();
        }
        ctx.restore();
      }

      const t = frame * 0.003;
      const circles = [
        { cx: W * 0.12, cy: H * 0.18, r: 160, phase: 0 },
        { cx: W * 0.88, cy: H * 0.72, r: 200, phase: 2.1 },
        { cx: W * 0.5, cy: H * 0.92, r: 130, phase: 4.2 },
        { cx: W * 0.75, cy: H * 0.25, r: 110, phase: 1.1 },
      ];
      for (const c of circles) {
        const pulse = Math.sin(t + c.phase) * 0.5 + 0.5;
        ctx.save();
        ctx.globalAlpha = 0.18 + pulse * 0.1;
        ctx.strokeStyle = "#8b5e3c";
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.arc(c.cx, c.cy, c.r + pulse * 18, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(c.cx, c.cy, c.r - 28 + pulse * 12, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ zIndex: 0 }}
    />
  );
}

function StoneInput({
  type = "text",
  value,
  onChange,
  placeholder,
  icon: Icon,
}: {
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  icon: React.ElementType;
}) {
  return (
    <div className="relative">
      <Icon
        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black  "
        strokeWidth={1.5}
      />
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-11 pl-10 pr-4 text-sm bg-white/70 backdrop-blur-sm
          border border-stone-200/80  rounded-xl
          text-stone-800 
          placeholder:text-stone-300 
          focus:outline-none focus:border-stone-400 dark:focus:border-stone-500
            transition-all"
      />
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { user, loading: authLoading } = useAuth();
  useEffect(() => {
    if (!authLoading && user) router.push("/dashboard");
  }, [user, authLoading]);
  if (authLoading || user)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2
          className="w-5 h-5 text-stone-300 animate-spin"
          strokeWidth={1}
        />
      </div>
    );
  const handleLogin = async () => {
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }
    try {
      setLoading(true);
      setError("");
      await loginWithEmail(email, password);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    try {
      setGoogleLoading(true);
      setError("");
      await loginWithGoogle();
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="hidden lg:flex flex-col justify-between w-[420px] flex-shrink-0 bg-stone-900  px-12 py-14 relative overflow-hidden"
      >
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg,transparent,transparent 39px,#fff 40px),repeating-linear-gradient(90deg,transparent,transparent 39px,#fff 40px)",
          }}
        />
        <div className="absolute top-0 right-0 w-32 h-32 border-b border-l border-stone-700 rounded-bl-3xl" />
        <div className="absolute bottom-0 left-0 w-24 h-24 border-t border-r border-stone-700 rounded-tr-3xl" />

        <div className="relative z-10">
          <p className="text-[10px] uppercase tracking-[4px] text-stone-600 mb-1">
            学習アプリ
          </p>
          <p className="text-xl font-extralight tracking-[3px] text-white/80">
            FlashCard
          </p>
        </div>

        <div className="relative z-10">
          <p className="text-4xl font-extralight text-white/90 leading-tight tracking-tight mb-4">
            学ぶことは
            <br />
            生きること
          </p>
          <p className="text-sm font-light text-stone-500 tracking-wide">
            To learn is to live.
          </p>
          <div className="mt-8 h-px w-12 bg-stone-700" />
        </div>

        <div className="relative z-10 grid grid-cols-3 gap-4">
          {[
            { value: "10k+", label: "Words" },
            { value: "4", label: "Topics" },
            { value: "AI", label: "Powered" },
          ].map(({ value, label }) => (
            <div key={label}>
              <p className="text-lg font-extralight text-white/70 tracking-tight">
                {value}
              </p>
              <p className="text-[10px] uppercase tracking-[2px] text-stone-600 mt-0.5">
                {label}
              </p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Right panel with animated background */}
      <div className="flex-1 relative flex items-center justify-center px-6 py-12 overflow-hidden">
        <AnimatedBackground />

        <div
          className="absolute inset-0 z-[1] pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 60% 60% at 50% 50%, transparent 20%, rgba(240,235,227,0.45) 100%)",
          }}
        />

        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-[2] w-full max-w-sm bg-white/50  backdrop-blur-lg border border-white/70  rounded-2xl px-8 py-10 shadow-sm"
        >
          {/* Mobile wordmark */}
          <div className="lg:hidden mb-8">
            <p className="text-[10px] uppercase tracking-[4px] text-stone-400 dark:text-stone-500 mb-0.5">
              学習アプリ
            </p>
            <p className="text-base font-light tracking-[2px] text-stone-700 dark:text-stone-300">
              FlashCard
            </p>
          </div>

          {/* Header */}
          <motion.div {...fadeUp(0)} className="mb-8">
            <p className="text-[11px] uppercase tracking-[3px] text-stone-400 dark:text-stone-500 mb-1">
              ログイン · Sign in
            </p>
            <h1 className="text-3xl font-extralight tracking-tight text-stone-800 ">
              Welcome back
            </h1>
          </motion.div>

          {/* Google */}
          <motion.div {...fadeUp(0.06)} className="mb-6">
            <button
              onClick={handleGoogle}
              disabled={googleLoading || loading}
              className="w-full h-11 flex items-center justify-center gap-2.5 rounded-xl border border-stone-200/80    backdrop-blur-sm text-sm font-light text-stone-700  hover:border-stone-400  hover:bg-white  transition-all disabled:opacity-40"
            >
              {googleLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" strokeWidth={1.5} />
              ) : (
                <Chrome className="w-4 h-4" strokeWidth={1.5} />
              )}
              Continue with Google
            </button>
          </motion.div>

          {/* Divider */}
          <motion.div
            {...fadeUp(0.09)}
            className="flex items-center gap-3 mb-6"
          >
            <div className="flex-1 h-px bg-stone-200/80 dark:bg-stone-700/60" />
            <span className="text-[10px] uppercase tracking-[2px] text-stone-300 dark:text-stone-600">
              or
            </span>
            <div className="flex-1 h-px bg-stone-200/80 dark:bg-stone-700/60" />
          </motion.div>

          {/* Fields */}
          <motion.div {...fadeUp(0.12)} className="space-y-3 mb-4">
            <StoneInput
              value={email}
              onChange={setEmail}
              placeholder="Email address"
              icon={Mail}
            />
            <StoneInput
              type="password"
              value={password}
              onChange={(v) => {
                setPassword(v);
                setError("");
              }}
              placeholder="Password"
              icon={Lock}
            />
          </motion.div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
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
              className="w-full h-11 rounded-xl flex items-center justify-center gap-2 text-sm font-light tracking-wide transition-all disabled:opacity-40 bg-stone-900  text-white  hover:bg-stone-700 "
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" strokeWidth={1.5} />
              ) : (
                <>
                  <span>Sign in</span>
                  <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
                </>
              )}
            </button>
          </motion.div>

          {/* Footer */}
          <motion.div
            {...fadeUp(0.18)}
            className="mt-7 flex items-center justify-between"
          >
            <p className="text-xs text-stone-400 dark:text-stone-500">
              Chưa có tài khoản?{" "}
              <Link
                href="/register"
                className="text-stone-700  hover:text-stone-900  transition-colors underline underline-offset-3"
              >
                Đăng ký
              </Link>
            </p>
            <div className="h-3 w-px bg-stone-200/80 dark:bg-stone-700" />
            <p className="text-[10px] uppercase tracking-[2px] text-stone-300 dark:text-stone-600">
              桜 · AI
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
