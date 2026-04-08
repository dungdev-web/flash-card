"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  BookOpen,
  Sparkles,
  Crown,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/app/hooks/useAuth";
import AuthGuard from "@/components/auth/AuthGuard";
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const, delay },
});

const fmt = (n: number) => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");

// ── Sakura canvas (giữ nguyên) ────────────────────────────────────────────────
function SakuraCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);
    const COLORS = [
      "#f9a8d4",
      "#fda4af",
      "#fce7f3",
      "#fbcfe8",
      "#f0abfc",
      "#e9d5ff",
    ];
    const petals = Array.from({ length: 60 }, () => ({
      x: Math.random() * window.innerWidth,
      y: -20 - Math.random() * 400,
      r: 4 + Math.random() * 7,
      vx: (Math.random() - 0.5) * 0.6,
      vy: 0.8 + Math.random() * 1.2,
      angle: Math.random() * Math.PI * 2,
      va: (Math.random() - 0.5) * 0.04,
      alpha: 0.5 + Math.random() * 0.5,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      sw: 40 + Math.random() * 60,
      sphase: Math.random() * Math.PI * 2,
    }));
    let t = 0,
      raf: number;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      t++;
      for (const p of petals) {
        p.x += p.vx + Math.sin(t / p.sw + p.sphase) * 0.3;
        p.y += p.vy;
        p.angle += p.va;
        if (p.y > canvas.height + 20) p.y = -20;
        ctx.save();
        ctx.globalAlpha = p.alpha * 0.7;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(
          p.r * 1.2,
          -p.r * 1.8,
          p.r * 2.2,
          -p.r * 0.8,
          p.r * 1.8,
          p.r * 0.5,
        );
        ctx.bezierCurveTo(p.r * 1.4, p.r * 1.5, p.r * 0.4, p.r * 1.2, 0, 0);
        ctx.fillStyle = p.color;
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(
          -p.r * 1.2,
          -p.r * 1.8,
          -p.r * 2.2,
          -p.r * 0.8,
          -p.r * 1.8,
          p.r * 0.5,
        );
        ctx.bezierCurveTo(-p.r * 1.4, p.r * 1.5, -p.r * 0.4, p.r * 1.2, 0, 0);
        ctx.fillStyle = p.color;
        ctx.fill();
        ctx.restore();
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);
  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function CheckoutSuccessPage() {
  const params = useSearchParams();
  const { user } = useAuth();

  const ref = params.get("ref") ?? "—";
  const amount = Number(params.get("amount") ?? 0);
  const plan = (params.get("plan") ?? "pro") as "pro" | "master";
  const planLabel = plan === "master" ? "Master · 師範" : "Pro · 上級";
  const planSeal = plan === "master" ? "師" : "上";
  const planColor = plan === "master" ? "#c47d2e" : "#e84d6a";

  const [status, setStatus] = useState<"loading" | "done" | "error">("loading");

  // ── Gọi API upgrade role + gửi email ngay khi mount ──
  useEffect(() => {
    if (!user || !ref || ref === "—") return;

    const upgrade = async () => {
      try {
        const idToken = await user.getIdToken();

        const res = await fetch("/api/payment-success", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            uid: user.uid,
            email: user.email,
            amount,
            ref,
            plan,
            idToken, // ← phải có dòng này
          }),
        });
        if (!res.ok) throw new Error("API error");
        setStatus("done");
      } catch {
        setStatus("error");
      }
    };

    upgrade();
  }, [user, ref, amount]);

  return (
    <AuthGuard>
      <div
        className="min-h-screen bg-[#fdf9f6] flex items-center justify-center relative overflow-hidden px-4"
        style={{ fontFamily: "'Noto Serif JP', 'Georgia', serif" }}
      >
        <SakuraCanvas />

        <div
          className="fixed inset-0 pointer-events-none"
          style={{ zIndex: 1 }}
        >
          <div
            className="w-full h-full"
            style={{
              backgroundImage:
                "repeating-linear-gradient(0deg,transparent,transparent 47px,rgba(180,150,130,0.06) 48px),repeating-linear-gradient(90deg,transparent,transparent 47px,rgba(180,150,130,0.06) 48px)",
            }}
          />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-[2] w-full max-w-md"
        >
          <div className="bg-white/80 backdrop-blur-xl border border-stone-200/80 rounded-3xl px-8 py-10 text-center shadow-sm">
            {/* Seal */}
            <motion.div
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                type: "spring",
                stiffness: 200,
                damping: 18,
                delay: 0.2,
              }}
              className="mx-auto mb-6 relative"
              style={{ width: 80, height: 80 }}
            >
              <motion.div
                className="absolute inset-0 rounded-full border-2"
                style={{ borderColor: planColor }}
                animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.1, 0.5] }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
              <div
                className="w-full h-full rounded-full flex items-center justify-center text-3xl font-light"
                style={{
                  background: `${planColor}12`,
                  border: `2px solid ${planColor}`,
                  color: planColor,
                }}
              >
                {planSeal}
              </div>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.5 }}
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center"
              >
                <Check className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
              </motion.div>
            </motion.div>

            <motion.div {...fadeUp(0.3)}>
              <p className="text-[11px] uppercase tracking-[4px] text-stone-400 mb-2">
                支払い完了 · Payment Complete
              </p>
              <h1 className="text-3xl font-extralight tracking-tight text-stone-800 mb-1">
                ありがとう
              </h1>
              <p className="text-sm font-light text-stone-400 tracking-wide mb-6">
                Thank you for your support.
              </p>
            </motion.div>

            {/* Upgrade status */}
            <motion.div {...fadeUp(0.35)} className="mb-4">
              <div
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-light"
                style={{
                  borderColor: `${planColor}40`,
                  background: `${planColor}08`,
                  color: planColor,
                }}
              >
                {status === "loading" && (
                  <>
                    <Loader2
                      className="w-3 h-3 animate-spin"
                      strokeWidth={1.5}
                    />
                    Đang kích hoạt tài khoản...
                  </>
                )}
                {status === "done" && (
                  <>
                    <Check className="w-3 h-3" strokeWidth={2} />
                    {planLabel} đã được kích hoạt · Email đã gửi
                  </>
                )}
                {status === "error" && <>⚠ Lỗi kích hoạt — liên hệ admin</>}
              </div>
            </motion.div>

            {/* Plan badge */}
            <motion.div {...fadeUp(0.38)} className="mb-6">
              <div
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border text-sm font-light"
                style={{
                  borderColor: `${planColor}50`,
                  background: `${planColor}08`,
                  color: planColor,
                }}
              >
                <Crown className="w-3.5 h-3.5" strokeWidth={1.5} />
                {planLabel}
              </div>
            </motion.div>

            {/* Receipt */}
            <motion.div
              {...fadeUp(0.44)}
              className="bg-stone-50/80 border border-stone-100 rounded-2xl px-5 py-4 mb-6 text-left space-y-2.5"
            >
              {[
                { label: "Mã giao dịch", value: ref },
                { label: "Số tiền", value: `${fmt(amount)} ₫` },
                { label: "Trạng thái", value: "Thành công ✓", green: true },
              ].map(({ label, value, green }) => (
                <div
                  key={label}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-stone-400 font-light">{label}</span>
                  <span
                    className={`font-light ${green ? "text-emerald-600" : "text-stone-600"}`}
                  >
                    {value}
                  </span>
                </div>
              ))}
            </motion.div>

            {/* Features */}
            <motion.div {...fadeUp(0.5)} className="mb-7">
              <p className="text-[10px] uppercase tracking-[2px] text-stone-400 mb-3">
                Quyền lợi đã mở khoá
              </p>
              <div className="grid grid-cols-2 gap-2">
                {(plan === "master"
                  ? [
                      "Sakura AI chatbot",
                      "Voice conversation",
                      "Anki export",
                      "SRS system",
                    ]
                  : [
                      "Sakura AI chatbot",
                      "Từ vựng unlimited",
                      "AI dịch tự động",
                      "AI example",
                    ]
                ).map((f) => (
                  <div
                    key={f}
                    className="flex items-center gap-2 text-[11px] text-stone-500"
                  >
                    <div
                      className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: `${planColor}12` }}
                    >
                      <Sparkles
                        className="w-2.5 h-2.5"
                        style={{ color: planColor }}
                        strokeWidth={1.5}
                      />
                    </div>
                    {f}
                  </div>
                ))}
              </div>
            </motion.div>

            {/* CTAs */}
            <motion.div {...fadeUp(0.56)} className="flex flex-col gap-2">
              <Link href="/dashboard">
                <div
                  className="flex items-center justify-center gap-2 w-full h-11 rounded-xl text-sm font-light text-white transition-all hover:opacity-90"
                  style={{ background: planColor }}
                >
                  <BookOpen className="w-4 h-4" strokeWidth={1.5} />
                  Bắt đầu học ngay
                  <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
                </div>
              </Link>
              <Link href="/dashboard">
                <div className="flex items-center justify-center w-full h-10 rounded-xl text-sm font-light text-stone-400 hover:text-stone-600 transition-colors">
                  Về trang chủ
                </div>
              </Link>
            </motion.div>

            <motion.p
              {...fadeUp(0.62)}
              className="text-[10px] text-stone-300 mt-5 tracking-wide"
            >
              Biên lai đã được gửi đến email của bạn · 桜 Sakura AI
            </motion.p>
          </div>
        </motion.div>
      </div>
    </AuthGuard>
  );
}
