"use client";

import AuthGuard from "@/components/auth/AuthGuard";
import { useAuth } from "@/app/hooks/useAuth";
import { getWordsByUser } from "@/app/libs/firestore";
import { Word } from "@/app/types/word";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { 
  BookOpen, 
  CheckCircle2, 
  TrendingUp, 
  Target,
  Calendar,
  Award,
  Zap,
  Clock
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

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

  // 📊 STATISTICS LOGIC
  const total = words.length;
  const learned = words.filter((w) => w.learned).length;
  const percent = total ? Math.round((learned / total) * 100) : 0;
  const remaining = total - learned;

  // Group by topics
  const topicStats = words.reduce((acc, word) => {
    const topic = word.topic || "Other";
    if (!acc[topic]) {
      acc[topic] = { total: 0, learned: 0 };
    }
    acc[topic].total++;
    if (word.learned) acc[topic].learned++;
    return acc;
  }, {} as Record<string, { total: number; learned: number }>);

  // Recent words (last 5)
  const recentWords = [...words]
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
    .slice(0, 5);

  // Achievement levels
  const getAchievement = () => {
    if (percent >= 90) return { title: "Master", icon: "🏆", color: "from-yellow-400 to-orange-400" };
    if (percent >= 70) return { title: "Expert", icon: "⭐", color: "from-blue-400 to-purple-400" };
    if (percent >= 50) return { title: "Advanced", icon: "🎯", color: "from-green-400 to-emerald-400" };
    if (percent >= 25) return { title: "Intermediate", icon: "📚", color: "from-cyan-400 to-blue-400" };
    return { title: "Beginner", icon: "🌱", color: "from-gray-400 to-gray-500" };
  };

  const achievement = getAchievement();

  if (isLoading) {
    return (
      <AuthGuard>
        <div className="flex items-center justify-center min-h-[400px]">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <BookOpen className="w-12 h-12 text-blue-500" />
          </motion.div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="space-y-8 pb-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
              Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Welcome back! Track your learning progress
            </p>
          </div>
          
          {/* Achievement Badge */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.2 }}
          >
            <Badge className={`px-4 py-2 text-lg bg-gradient-to-r ${achievement.color} text-white border-0`}>
              {achievement.icon} {achievement.title}
            </Badge>
          </motion.div>
        </motion.div>

        {/* Main Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            title="Total Words"
            value={total}
            icon={<BookOpen className="w-6 h-6" />}
            color="from-blue-500 to-cyan-500"
            delay={0.1}
          />
          <StatCard
            title="Learned"
            value={learned}
            icon={<CheckCircle2 className="w-6 h-6" />}
            color="from-green-500 to-emerald-500"
            delay={0.2}
          />
          <StatCard
            title="Remaining"
            value={remaining}
            icon={<Target className="w-6 h-6" />}
            color="from-orange-500 to-red-500"
            delay={0.3}
          />
          <StatCard
            title="Progress"
            value={`${percent}%`}
            icon={<TrendingUp className="w-6 h-6" />}
            color="from-purple-500 to-pink-500"
            delay={0.4}
          />
        </div>

        {/* Progress Bar Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 border-2 border-blue-100 dark:border-blue-900">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Zap className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <h3 className="font-semibold">Overall Progress</h3>
                  <p className="text-sm text-muted-foreground">
                    {learned} of {total} words mastered
                  </p>
                </div>
              </div>
              <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                {percent}%
              </div>
            </div>
            <Progress value={percent} className="h-3" />
          </Card>
        </motion.div>

        {/* Topics & Recent Words */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Topics Breakdown */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Award className="w-5 h-5 text-purple-500" />
                <h3 className="font-semibold text-lg">Topics Breakdown</h3>
              </div>
              
              {Object.keys(topicStats).length > 0 ? (
                <div className="space-y-3">
                  {Object.entries(topicStats).map(([topic, stats], idx) => {
                    const topicPercent = Math.round((stats.learned / stats.total) * 100);
                    return (
                      <motion.div
                        key={topic}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.7 + idx * 0.1 }}
                        className="space-y-2"
                      >
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">{topic}</span>
                          <span className="text-muted-foreground">
                            {stats.learned}/{stats.total}
                          </span>
                        </div>
                        <Progress value={topicPercent} className="h-2" />
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No topics yet. Start adding words!
                </p>
              )}
            </Card>
          </motion.div>

          {/* Recent Words */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-blue-500" />
                <h3 className="font-semibold text-lg">Recent Words</h3>
              </div>
              
              {recentWords.length > 0 ? (
                <div className="space-y-3">
                  {recentWords.map((word, idx) => (
                    <motion.div
                      key={word.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.7 + idx * 0.1 }}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${word.learned ? 'bg-green-500' : 'bg-gray-300'}`} />
                        <div>
                          <p className="font-medium">{word.english}</p>
                          <p className="text-sm text-muted-foreground">{word.meaning}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {word.topic}
                      </Badge>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No words yet. Start your journey!
                </p>
              )}
            </Card>
          </motion.div>
        </div>

        {/* Motivational Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Card className="p-6 bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0">
            <div className="flex items-center gap-4">
              <div className="text-5xl">
                {percent >= 75 ? "🎉" : percent >= 50 ? "💪" : percent >= 25 ? "🚀" : "🌟"}
              </div>
              <div>
                <h3 className="text-xl font-bold mb-1">
                  {percent >= 75
                    ? "Excellent work! You're almost there!"
                    : percent >= 50
                    ? "Great progress! Keep it up!"
                    : percent >= 25
                    ? "You're on the right track!"
                    : "Start your learning journey today!"}
                </h3>
                <p className="text-blue-100">
                  {remaining > 0
                    ? `${remaining} more words to master. You can do it!`
                    : "Congratulations! You've mastered all your words!"}
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </AuthGuard>
  );
}

// 👉 Enhanced StatCard Component
function StatCard({
  title,
  value,
  icon,
  color,
  delay,
}: {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      whileHover={{ y: -5, scale: 1.02 }}
    >
      <Card className="p-6 relative overflow-hidden group hover:shadow-xl transition-all border-2 hover:border-blue-200 dark:hover:border-blue-800">
        {/* Gradient Background */}
        <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-5 group-hover:opacity-10 transition-opacity`} />
        
        {/* Content */}
        <div className="relative">
          <div className="flex items-center justify-between mb-3">
            <div className={`p-3 rounded-xl bg-gradient-to-br ${color} shadow-lg`}>
              <div className="text-white">{icon}</div>
            </div>
          </div>
          
          <p className="text-sm text-muted-foreground mb-1">{title}</p>
          <p className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
            {value}
          </p>
        </div>
      </Card>
    </motion.div>
  );
}