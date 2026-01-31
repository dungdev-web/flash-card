"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import AuthGuard from "@/components/auth/AuthGuard";
const topics = [
  {
    name: "Daily",
    slug: "daily",
    description: "Common words for everyday conversations",
    color: "from-blue-400 to-blue-600",
  },
  {
    name: "Business",
    slug: "Business",
    description: "Vocabulary for work and meetings",
    color: "from-emerald-400 to-emerald-600",
  },
  {
    name: "Technology",
    slug: "Technology",
    description: "Tech, IT, and software terms",
    color: "from-purple-400 to-purple-600",
  },
  {
    name: "IELTS",
    slug: "Ielts",
    description: "Academic & exam-focused vocabulary",
    color: "from-pink-400 to-pink-600",
  },
];

export default function TopicPage() {
  return (
    <AuthGuard>
    <div className="min-h-screen px-6 py-10">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
          Choose a Topic 📚
        </h1>
        <p className="text-gray-500 mt-3">
          Pick a topic and start learning with flashcards
        </p>
      </motion.div>

      {/* Topic Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
        {topics.map((topic, index) => (
          <motion.div
            key={topic.slug}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -10, scale: 1.05 }}
          >
            <Link href={`/dashboard/topics/${topic.slug}`}>
              <Card className="h-full cursor-pointer rounded-2xl p-6 shadow-xl relative overflow-hidden">
                {/* Glow */}
                <div
                  className={`absolute inset-0 opacity-20 bg-gradient-to-br ${topic.color}`}
                />

                <div className="relative z-10">
                  <h2 className="text-2xl font-semibold mb-2">
                    {topic.name}
                  </h2>
                  <p className="text-sm text-gray-600 mb-4">
                    {topic.description}
                  </p>
                  <Badge
                    className={`bg-gradient-to-r ${topic.color} text-white`}
                  >
                    Start learning →
                  </Badge>
                </div>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
    </AuthGuard>
  );
}
