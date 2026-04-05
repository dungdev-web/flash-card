"use client";

import AuthGuard from "@/components/auth/AuthGuard";
import { useAuth } from "@/app/hooks/useAuth";
import { getWordsByUser } from "@/app/libs/firestore";
import { Word } from "@/app/types/word";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  BookOpen,
  CheckCircle2,
  TrendingUp,
  Target,
  Award,
  Zap,
  Clock,
  Circle,
} from "lucide-react";

// ─── Animation helpers ────────────────────────────────────────────────────────
// All elements delay by SHOJI_DELAY so they appear after the shoji doors open
const SHOJI_DELAY = 1.15;

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const , delay: SHOJI_DELAY + delay },
});

const fadeIn = (delay = 0) => ({
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.5, delay: SHOJI_DELAY + delay },
});

// ─── Achievement ──────────────────────────────────────────────────────────────
function getAchievement(percent: number) {
  if (percent >= 90) return { title: "師範", sub: "Shihan · Master",     rank: 5 };
  if (percent >= 70) return { title: "上級", sub: "Jōkyū · Expert",      rank: 4 };
  if (percent >= 50) return { title: "中級", sub: "Chūkyū · Advanced",   rank: 3 };
  if (percent >= 25) return { title: "初級", sub: "Shokyū · Intermediate", rank: 2 };
  return               { title: "入門", sub: "Nyūmon · Beginner",         rank: 1 };
}

// ─── Thin progress bar (washi-tape style) ─────────────────────────────────────
function WashiBar({ value, delay = 0 }: { value: number; delay?: number }) {
  return (
    <div className="relative h-[3px] w-full bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden">
      <motion.div
        className="absolute inset-y-0 left-0 bg-stone-800 dark:bg-stone-200 rounded-full"
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: SHOJI_DELAY + delay }}
      />
    </div>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  icon: Icon,
  delay,
  accent,
}: {
  label: string;
  value: number | string;
  icon: React.ElementType;
  delay: number;
  accent?: boolean;
}) {
  return (
    <motion.div {...fadeUp(delay)}>
      <div
        className={`relative p-5 rounded-2xl border transition-all duration-300 group
          ${accent
            ? "bg-stone-900 dark:bg-stone-100 border-stone-900 dark:border-stone-100"
            : "bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-700 hover:border-stone-400 dark:hover:border-stone-500"
          }`}
      >
        <div className="flex items-start justify-between mb-4">
          <div className={`p-2 rounded-xl ${accent ? "bg-white/10" : "bg-stone-100 dark:bg-stone-800"}`}>
            <Icon
              className={`w-4 h-4 ${accent ? "text-stone-100 dark:text-stone-900" : "text-stone-500 dark:text-stone-400"}`}
              strokeWidth={1.5}
            />
          </div>
        </div>
        <p className={`text-[11px] uppercase tracking-[2px] font-medium mb-1 ${accent ? "text-stone-400 dark:text-stone-500" : "text-stone-400 dark:text-stone-500"}`}>
          {label}
        </p>
        <p className={`text-3xl font-light tracking-tight ${accent ? "text-white dark:text-stone-900" : "text-stone-800 dark:text-stone-100"}`}>
          {value}
        </p>
      </div>
    </motion.div>
  );
}

// ─── Rank dots ────────────────────────────────────────────────────────────────
function RankDots({ rank }: { rank: number }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className={`w-1.5 h-1.5 rounded-full transition-colors ${
            i < rank ? "bg-stone-800 dark:bg-stone-200" : "bg-stone-300 dark:bg-stone-600"
          }`}
        />
      ))}
    </div>
  );
}

// ─── Divider (torii-inspired) ─────────────────────────────────────────────────
function KumikoLine() {
  return (
    <div className="flex items-center gap-3 my-8">
      <div className="flex-1 h-px bg-stone-200 dark:bg-stone-700" />
      <div className="w-1 h-1 rounded-full bg-stone-400 dark:bg-stone-500" />
      <div className="flex-1 h-px bg-stone-200 dark:bg-stone-700" />
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user } = useAuth();
  const [words, setWords] = useState<Word[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setIsLoading(true);
    getWordsByUser(user.uid).then((data) => {
      setWords(data);
      setIsLoading(false);
    });
  }, [user]);

  const total     = words.length;
  const learned   = words.filter((w) => w.learned).length;
  const percent   = total ? Math.round((learned / total) * 100) : 0;
  const remaining = total - learned;

  const topicStats = words.reduce((acc, word) => {
    const topic = word.topic || "Other";
    if (!acc[topic]) acc[topic] = { total: 0, learned: 0 };
    acc[topic].total++;
    if (word.learned) acc[topic].learned++;
    return acc;
  }, {} as Record<string, { total: number; learned: number }>);

  const recentWords = [...words]
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
    .slice(0, 5);

  const achievement = getAchievement(percent);

  if (isLoading) {
    return (
      <AuthGuard>
        <div className="flex items-center justify-center min-h-[400px]">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <Circle className="w-8 h-8 text-stone-400" strokeWidth={1} />
          </motion.div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-0">

        {/* ── Header ── */}
        <motion.div {...fadeUp(0)} className="flex items-end justify-between mb-10">
          <div>
            {/* Japanese title watermark */}
            <p className="text-[11px] uppercase tracking-[3px] text-stone-400 dark:text-stone-500 mb-2">
              学習の記録 · Learning Record
            </p>
            <h1 className="text-4xl font-extralight tracking-tight text-stone-800 dark:text-stone-100">
              Dashboard
            </h1>
          </div>

          {/* Achievement badge */}
          <motion.div {...fadeIn(0.1)} className="text-right">
            <p className="text-4xl font-thin text-stone-800 dark:text-stone-100 leading-none">
              {achievement.title}
            </p>
            <p className="text-[11px] text-stone-400 dark:text-stone-500 mt-1 tracking-wide">
              {achievement.sub}
            </p>
            <div className="flex justify-end mt-2">
              <RankDots rank={achievement.rank} />
            </div>
          </motion.div>
        </motion.div>

        {/* ── Stat row ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Total"     value={total}     icon={BookOpen}     delay={0.05} accent />
          <StatCard label="Learned"   value={learned}   icon={CheckCircle2} delay={0.1} />
          <StatCard label="Remaining" value={remaining} icon={Target}       delay={0.15} />
          <StatCard label="Progress"  value={`${percent}%`} icon={TrendingUp} delay={0.2} />
        </div>

        <KumikoLine />

        {/* ── Progress hero ── */}
        <motion.div {...fadeUp(0.25)}>
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <Zap className="w-4 h-4 text-stone-400" strokeWidth={1.5} />
              <span className="text-[11px] uppercase tracking-[2px] text-stone-400 dark:text-stone-500">
                Overall Mastery
              </span>
              <span className="ml-auto text-2xl font-light text-stone-800 dark:text-stone-100">
                {percent}%
              </span>
            </div>
            <WashiBar value={percent} delay={0.3} />
            <p className="text-xs text-stone-400 dark:text-stone-500 mt-3">
              {learned} of {total} words mastered
            </p>
          </div>
        </motion.div>

        <KumikoLine />

        {/* ── Topics + Recent ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* Topics */}
          <motion.div {...fadeUp(0.3)}>
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-2xl p-6 h-full">
              <div className="flex items-center gap-2 mb-6">
                <Award className="w-4 h-4 text-stone-400" strokeWidth={1.5} />
                <span className="text-[11px] uppercase tracking-[2px] text-stone-400 dark:text-stone-500">
                  Topics
                </span>
              </div>

              {Object.keys(topicStats).length > 0 ? (
                <div className="space-y-5">
                  {Object.entries(topicStats).map(([topic, stats], idx) => {
                    const tp = Math.round((stats.learned / stats.total) * 100);
                    return (
                      <motion.div key={topic} {...fadeUp(0.35 + idx * 0.07)}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-stone-700 dark:text-stone-300">
                            {topic}
                          </span>
                          <span className="text-xs text-stone-400 dark:text-stone-500 tabular-nums">
                            {stats.learned}/{stats.total}
                          </span>
                        </div>
                        <WashiBar value={tp} delay={0.4 + idx * 0.07} />
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-stone-400 dark:text-stone-500 text-center py-10">
                  まだトピックがありません<br />
                  <span className="text-xs">No topics yet — start adding words.</span>
                </p>
              )}
            </div>
          </motion.div>

          {/* Recent words */}
          <motion.div {...fadeUp(0.32)}>
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-2xl p-6 h-full">
              <div className="flex items-center gap-2 mb-6">
                <Clock className="w-4 h-4 text-stone-400" strokeWidth={1.5} />
                <span className="text-[11px] uppercase tracking-[2px] text-stone-400 dark:text-stone-500">
                  Recent Words
                </span>
              </div>

              {recentWords.length > 0 ? (
                <div className="divide-y divide-stone-100 dark:divide-stone-800">
                  {recentWords.map((word, idx) => (
                    <motion.div
                      key={word.id}
                      {...fadeUp(0.38 + idx * 0.06)}
                      className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                            word.learned
                              ? "bg-stone-800 dark:bg-stone-200"
                              : "bg-stone-300 dark:bg-stone-600"
                          }`}
                        />
                        <div>
                          <p className="text-sm font-medium text-stone-800 dark:text-stone-100">
                            {word.english}
                          </p>
                          <p className="text-xs text-stone-400 dark:text-stone-500">
                            {word.meaning}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] uppercase tracking-[1.5px] text-stone-400 dark:text-stone-500 border border-stone-200 dark:border-stone-700 rounded-full px-2 py-0.5">
                        {word.topic}
                      </span>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-stone-400 dark:text-stone-500 text-center py-10">
                  言葉がまだありません<br />
                  <span className="text-xs">No words yet — begin your journey.</span>
                </p>
              )}
            </div>
          </motion.div>
        </div>

        <KumikoLine />

        {/* ── Motivational footer ── */}
        <motion.div {...fadeUp(0.5)}>
          <div className="flex items-center justify-between px-6 py-5 rounded-2xl bg-stone-900 dark:bg-stone-100 border border-stone-900 dark:border-stone-100">
            <div>
              <p className="text-white dark:text-stone-900 font-light text-lg">
                {percent >= 75
                  ? "もう少しです — Almost there."
                  : percent >= 50
                  ? "よく頑張っています — Keep going."
                  : percent >= 25
                  ? "いい調子です — On the right track."
                  : "始めましょう — Begin your journey."}
              </p>
              <p className="text-stone-400 dark:text-stone-600 text-xs mt-1">
                {remaining > 0
                  ? `${remaining} words remaining to master`
                  : "All words mastered — 完璧です。"}
              </p>
            </div>
            <BookOpen
              className="w-6 h-6 text-stone-600 dark:text-stone-400 flex-shrink-0 ml-6"
              strokeWidth={1}
            />
          </div>
        </motion.div>

      </div>
    </AuthGuard>
  );
}