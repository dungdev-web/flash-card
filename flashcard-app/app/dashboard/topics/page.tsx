"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  Briefcase,
  Monitor,
  GraduationCap,
  Citrus,
  Utensils,
  Plane,
  Crown,
} from "lucide-react";
import AuthGuard from "@/components/auth/AuthGuard";
import { useRole } from "@/app/hooks/useRole";
import { Lock } from "lucide-react";
import { useRouter } from "next/navigation";
const SHOJI_DELAY = 1.15;
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: {
    duration: 0.5,
    ease: [0.22, 1, 0.36, 1] as const,
    delay: SHOJI_DELAY + delay,
  },
});

const topics = [
  {
    name: "Daily",
    labelJa: "日常",
    slug: "daily",
    description: "Common words for everyday conversations",
    icon: BookOpen,
    num: "01",
  },

  {
    name: "Business",
    labelJa: "仕事",
    slug: "business",
    description: "Vocabulary for work and meetings",
    icon: Briefcase,
    num: "02",
  },
  {
    name: "Technology",
    labelJa: "技術",
    slug: "technology",
    description: "Tech, IT, and software terms",
    icon: Monitor,
    num: "03",
  },
  {
    name: "IELTS",
    labelJa: "試験",
    slug: "ielts",
    description: "Academic & exam-focused vocabulary",
    icon: GraduationCap,
    num: "04",
  },
  {
    name: "Travel",
    labelJa: "旅行",
    slug: "travel",
    description: "Airport, directions, dining, and more",
    icon: Plane,
    num: "05",
  },
  {
    name: "Food",
    labelJa: "食べ物",
    slug: "food",
    description: "Fruits, dishes, and culinary terms",
    icon: Utensils,
    num: "06",
  },
  {
    name: "Health",
    labelJa: "健康",
    slug: "health",
    description: "Body parts, symptoms, and medical terms",
    icon: Citrus,
    num: "07",
  },
];

function KumikoLine() {
  return (
    <div className="flex items-center gap-3 my-8">
      <div className="flex-1 h-px bg-stone-200 dark:bg-stone-700" />
      <div className="w-1 h-1 rounded-full bg-stone-400 dark:bg-stone-500" />
      <div className="flex-1 h-px bg-stone-200 dark:bg-stone-700" />
    </div>
  );
}

export default function TopicPage() {
  const { isVip, isAdmin } = useRole();
  const isFree = !isVip && !isAdmin;
  const FREE_TOPIC_LIMIT = 3;
  const router = useRouter();
  return (
    <AuthGuard>
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div {...fadeUp(0)} className="mb-10">
          <p className="text-[11px] uppercase tracking-[3px] text-stone-400 dark:text-stone-500 mb-1">
            トピック · Topics
          </p>
          <h1 className="text-3xl font-extralight tracking-tight text-stone-800 dark:text-stone-100">
            Choose a Topic
          </h1>
        </motion.div>

        {/* Topic list */}
        <div className="space-y-3">
          {topics.map((topic, idx) => {
            const Icon = topic.icon;
            const locked = isFree && idx >= FREE_TOPIC_LIMIT;

            return (
              <motion.div key={topic.slug} {...fadeUp(0.06 + idx * 0.07)}>
                <div
                  onClick={() =>
                    locked
                      ? router.push("/upgrade")
                      : router.push(`/dashboard/topics/${topic.slug}`)
                  }
                  className={`group flex items-center gap-5 p-5 rounded-2xl border transition-all duration-200 cursor-pointer
          ${
            locked
              ? "border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/50 opacity-60 hover:opacity-80 hover:border-amber-200 dark:hover:border-amber-800"
              : "border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 hover:border-stone-400 dark:hover:border-stone-500"
          }`}
                >
                  {/* Icon box */}
                  <div
                    className={`w-11 h-11 rounded-xl border flex items-center justify-center flex-shrink-0 transition-all duration-200
          ${
            locked
              ? "border-stone-200 dark:border-stone-700 bg-stone-100 dark:bg-stone-800"
              : "border-stone-200 dark:border-stone-700 group-hover:bg-stone-900 dark:group-hover:bg-stone-100 group-hover:border-stone-900"
          }`}
                  >
                    {locked ? (
                      <Lock
                        className="w-3.5 h-3.5 text-stone-300 dark:text-stone-600"
                        strokeWidth={1.5}
                      />
                    ) : (
                      <Icon
                        className="w-4 h-4 text-stone-400 dark:text-stone-500 group-hover:text-white dark:group-hover:text-stone-900 transition-colors duration-200"
                        strokeWidth={1.5}
                      />
                    )}
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 mb-0.5">
                      <span className="text-base font-light text-stone-800 dark:text-stone-100">
                        {topic.name}
                      </span>
                      <span className="text-[10px] text-stone-400 dark:text-stone-500 tracking-widest">
                        {topic.labelJa}
                      </span>
                    </div>
                    <p className="text-xs text-stone-400 dark:text-stone-500 font-light truncate">
                      {locked
                        ? "Upgrade to unlock this topic"
                        : topic.description}
                    </p>
                  </div>

                  {/* Number + icon */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-[11px] tabular-nums text-stone-300 dark:text-stone-600">
                      {topic.num}
                    </span>
                    {locked ? (
                      <Crown
                        className="w-3.5 h-3.5 text-amber-400"
                        strokeWidth={1.5}
                      />
                    ) : (
                      <ArrowRight
                        className="w-4 h-4 text-stone-300 dark:text-stone-600 group-hover:text-stone-700 group-hover:translate-x-0.5 transition-all duration-200"
                        strokeWidth={1.5}
                      />
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        <KumikoLine />

        {/* Footer note */}
        <motion.p
          {...fadeUp(0.35)}
          className="text-center text-[11px] uppercase tracking-[2px] text-stone-300 dark:text-stone-600"
        >
          選んでください — Pick one to begin
        </motion.p>
      </div>
    </AuthGuard>
  );
}
