"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Zap, Crown, Sparkles } from "lucide-react";

const SHOJI_DELAY = 0.2;
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const, delay: SHOJI_DELAY + delay },
});

const plans = [
  {
    id: "free",
    tier: "無料",
    name: "Free",
    subtitle: "Muryō · For beginners",
    price: "0",
    period: "forever",
    description: "Start your journey into Japanese vocabulary.",
    color: "stone",
    features: [
      "Up to 50 words",
      "Basic flashcards",
      "3 topics",
      "Manual entry only",
    ],
    cta: "Current Plan",
    disabled: true,
  },
  {
    id: "pro",
    tier: "上級",
    name: "Pro",
    subtitle: "Jōkyū · For learners",
    price: "4.9",
    period: "/ month",
    description: "Unlock AI-powered learning and unlimited vocabulary.",
    color: "rose",
    featured: true,
    features: [
      "Unlimited words",
      "AI auto-translate",
      "AI example generator",
      "Unlimited topics",
      "Sakura vocabulary overlay",
      "Priority support",
    ],
    cta: "Upgrade to Pro",
    disabled: false,
  },
  {
    id: "master",
    tier: "師範",
    name: "Master",
    subtitle: "Shihan · For masters",
    price: "9.9",
    period: "/ month",
    description: "The complete experience for serious learners.",
    color: "amber",
    features: [
      "Everything in Pro",
      "AI conversation practice",
      "Spaced repetition system",
      "Export to Anki / CSV",
      "Custom AI vocabulary sets",
      "Early access to features",
    ],
    cta: "Upgrade to Master",
    disabled: false,
  },
];

function KumikoDivider() {
  return (
    <div className="flex items-center justify-center gap-3 my-2">
      <div className="w-12 h-px bg-stone-200 dark:bg-stone-700" />
      <div className="flex gap-1">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="w-1 h-1 rounded-full bg-stone-300 dark:bg-stone-600" />
        ))}
      </div>
      <div className="w-12 h-px bg-stone-200 dark:bg-stone-700" />
    </div>
  );
}

function SealMark({ char, color }: { char: string; color: string }) {
  const colors: Record<string, string> = {
    stone: "border-stone-300 dark:border-stone-600 text-stone-400 dark:text-stone-500",
    rose:  "border-rose-300 dark:border-rose-700 text-rose-400 dark:text-rose-500",
    amber: "border-amber-300 dark:border-amber-700 text-amber-500 dark:text-amber-400",
  };
  return (
    <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center text-lg font-light ${colors[color]}`}
      style={{ fontFamily: "'Noto Serif JP', 'Yu Mincho', serif" }}>
      {char}
    </div>
  );
}

export default function UpgradePage() {
  const [hoveredPlan, setHoveredPlan] = useState<string | null>(null);

  return (
    <div className="min-h-[calc(100vh-57px)] bg-white dark:bg-stone-950 px-6 py-12">
      <div className="max-w-5xl mx-auto">

        {/* ── Header ── */}
        <motion.div {...fadeUp(0)} className="text-center mb-16">
          {/* Decorative Japanese pattern top */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="h-px w-16 bg-stone-200 dark:bg-stone-700" />
            <p className="text-[10px] uppercase tracking-[5px] text-stone-400 dark:text-stone-500 px-3">
              料金プラン
            </p>
            <div className="h-px w-16 bg-stone-200 dark:bg-stone-700" />
          </div>

          <h1 className="text-5xl font-extralight tracking-tight text-stone-800 dark:text-stone-100 mb-3"
            style={{ fontFamily: "'Noto Serif JP', 'Yu Mincho', serif", letterSpacing: "-0.02em" }}>
            Choose Your Path
          </h1>
          <p className="text-stone-400 dark:text-stone-500 text-sm tracking-wide">
            道を選んでください · Every master was once a beginner.
          </p>
        </motion.div>

        {/* ── Plans grid ── */}
        <div className="grid grid-cols-3 gap-5 items-stretch">
          {plans.map((plan, idx) => (
            <motion.div key={plan.id} {...fadeUp(0.1 + idx * 0.08)}
              onMouseEnter={() => setHoveredPlan(plan.id)}
              onMouseLeave={() => setHoveredPlan(null)}
              className="relative">

              {/* Featured glow ring */}
              {plan.featured && (
                <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-rose-200 to-rose-100 dark:from-rose-900/40 dark:to-rose-950/20 -z-10" />
              )}

              <div className={`h-full flex flex-col rounded-2xl border transition-all duration-300
                ${plan.featured
                  ? "border-rose-200 dark:border-rose-800 bg-white dark:bg-stone-900 shadow-[0_0_40px_-8px_rgba(244,63,94,0.15)]"
                  : hoveredPlan === plan.id
                    ? "border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-900"
                    : "border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900"}`}>

                {/* Card inner */}
                <div className="p-6 flex flex-col flex-1">

                  {/* Top: seal + badge */}
                  <div className="flex items-start justify-between mb-5">
                    <SealMark
                      char={plan.tier[0]}
                      color={plan.color}
                    />
                    {plan.featured && (
                      <span className="flex items-center gap-1 text-[10px] uppercase tracking-[2px] px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-500 dark:text-rose-400">
                        <Sparkles className="w-2.5 h-2.5" strokeWidth={1.5} />
                        Popular
                      </span>
                    )}
                    {plan.id === "master" && (
                      <span className="flex items-center gap-1 text-[10px] uppercase tracking-[2px] px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400">
                        <Crown className="w-2.5 h-2.5" strokeWidth={1.5} />
                        Best
                      </span>
                    )}
                  </div>

                  {/* Tier name */}
                  <div className="mb-1">
                    <p className="text-2xl font-light text-stone-800 dark:text-stone-100"
                      style={{ fontFamily: "'Noto Serif JP', 'Yu Mincho', serif" }}>
                      {plan.tier}
                    </p>
                    <p className="text-xs text-stone-400 dark:text-stone-500 tracking-wide">{plan.subtitle}</p>
                  </div>

                  <KumikoDivider />

                  {/* Price */}
                  <div className="my-4">
                    <div className="flex items-baseline gap-1">
                      {plan.price !== "0" && (
                        <span className="text-xs text-stone-400 dark:text-stone-500 mb-1">$</span>
                      )}
                      <span className={`text-4xl font-extralight tracking-tight
                        ${plan.color === "rose"  ? "text-rose-500 dark:text-rose-400"
                        : plan.color === "amber" ? "text-amber-600 dark:text-amber-400"
                        : "text-stone-700 dark:text-stone-300"}`}>
                        {plan.price === "0" ? "Free" : plan.price}
                      </span>
                      <span className="text-xs text-stone-400 dark:text-stone-500 ml-1">{plan.period}</span>
                    </div>
                    <p className="text-[11px] text-stone-400 dark:text-stone-500 mt-1 leading-relaxed">
                      {plan.description}
                    </p>
                  </div>

                  {/* Features */}
                  <ul className="space-y-2.5 flex-1 mb-6">
                    {plan.features.map(f => (
                      <li key={f} className="flex items-start gap-2.5">
                        <div className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0
                          ${plan.color === "rose"  ? "bg-rose-50 dark:bg-rose-950/50"
                          : plan.color === "amber" ? "bg-amber-50 dark:bg-amber-950/30"
                          : "bg-stone-100 dark:bg-stone-800"}`}>
                          <Check className={`w-2.5 h-2.5
                            ${plan.color === "rose"  ? "text-rose-500 dark:text-rose-400"
                            : plan.color === "amber" ? "text-amber-600 dark:text-amber-400"
                            : "text-stone-500 dark:text-stone-400"}`}
                            strokeWidth={2.5} />
                        </div>
                        <span className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">{f}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <button disabled={plan.disabled}
                    className={`w-full h-11 rounded-xl text-sm font-light tracking-wide transition-all duration-200
                      ${plan.disabled
                        ? "border border-stone-200 dark:border-stone-700 text-stone-400 dark:text-stone-500 cursor-default"
                        : plan.color === "rose"
                          ? "bg-rose-500 hover:bg-rose-600 dark:bg-rose-600 dark:hover:bg-rose-500 text-white shadow-[0_4px_20px_-4px_rgba(244,63,94,0.4)]"
                          : "bg-stone-900 dark:bg-stone-100 hover:bg-stone-700 dark:hover:bg-stone-300 text-white dark:text-stone-900"}`}>
                    {plan.id === "pro" && !plan.disabled && (
                      <span className="flex items-center justify-center gap-2">
                        <Zap className="w-3.5 h-3.5" strokeWidth={1.5} />
                        {plan.cta}
                      </span>
                    )}
                    {plan.id === "master" && (
                      <span className="flex items-center justify-center gap-2">
                        <Crown className="w-3.5 h-3.5" strokeWidth={1.5} />
                        {plan.cta}
                      </span>
                    )}
                    {plan.id === "free" && plan.cta}
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* ── Footer note ── */}
        <motion.div {...fadeUp(0.45)} className="mt-14 text-center space-y-3">
          <div className="flex items-center justify-center gap-3">
            <div className="h-px w-24 bg-stone-100 dark:bg-stone-800" />
            <p className="text-[10px] uppercase tracking-[4px] text-stone-300 dark:text-stone-600">保証</p>
            <div className="h-px w-24 bg-stone-100 dark:bg-stone-800" />
          </div>
          <p className="text-xs text-stone-400 dark:text-stone-500 tracking-wide">
            Cancel anytime · No hidden fees · 7-day money-back guarantee
          </p>
          <p className="text-[10px] text-stone-300 dark:text-stone-700 tracking-widest uppercase">
            いつでもキャンセル可能
          </p>
        </motion.div>

      </div>
    </div>
  );
}