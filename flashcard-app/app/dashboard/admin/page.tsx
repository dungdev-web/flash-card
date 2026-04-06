// src/app/dashboard/admin/page.tsx
// Trang quản lý role — chỉ admin truy cập được
"use client";

import { useRole } from "@/app/hooks/useRole";
import { useAuth } from "@/app/hooks/useAuth";
import { setUserRole, type UserRole } from "@/app/libs/auth";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Crown, User, Shield, Loader2, Check, Search } from "lucide-react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/app/libs/firebase";
import AuthGuard from "@/components/auth/AuthGuard";

const SHOJI_DELAY = 1.15;
const fadeUp = (d = 0) => ({
  initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const, delay: SHOJI_DELAY + d },
});

const ROLE_META: Record<UserRole, { label: string; color: string; icon: React.ElementType }> = {
  admin: { label: "Admin",  color: "bg-red-100 dark:bg-red-950/30 text-red-600 dark:text-red-400",    icon: Shield },
  pro:   { label: "Pro",   color: "bg-amber-100 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400", icon: Crown },
  master:{ label: "Master",color: "bg-amber-200 dark:bg-amber-950/50 text-amber-700 dark:text-amber-500", icon: Crown },
  user:  { label: "User",  color: "bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400",  icon: User },
};

interface UserEntry {
  uid: string; email: string; role: UserRole;
}

export default function AdminPage() {
  const { isAdmin, loading: roleLoading } = useRole();

  const [email,    setEmail]    = useState("");
  const [result,   setResult]   = useState<UserEntry | null>(null);
  const [searching, setSearching] = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);
  const [error,    setError]    = useState("");

  if (roleLoading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 className="w-6 h-6 text-stone-400 animate-spin" strokeWidth={1} />
    </div>
  );

  if (!isAdmin) return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-3 text-stone-400">
      <Shield className="w-8 h-8" strokeWidth={1} />
      <p className="text-sm font-light">Admin access required</p>
    </div>
  );

  const searchUser = async () => {
    if (!email.trim()) return;
    setSearching(true); setResult(null); setError("");
    try {
      const q    = query(collection(db, "users"), where("email", "==", email.trim()));
      const snap = await getDocs(q);
      if (snap.empty) { setError(`No user found: ${email}`); }
      else {
        const d = snap.docs[0].data() as UserEntry;
        setResult({ uid: d.uid, email: d.email, role: d.role ?? "user" });
      }
    } catch { setError("Search failed"); }
    finally { setSearching(false); }
  };

  const updateRole = async (role: UserRole) => {
    if (!result) return;
    setSaving(true);
    try {
      await setUserRole(result.uid, role);
      setResult(prev => prev ? { ...prev, role } : null);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch { setError("Update failed"); }
    finally { setSaving(false); }
  };

  return (
    <AuthGuard>
      <div className="max-w-xl mx-auto px-4 py-8">
        <motion.div {...fadeUp(0)} className="mb-8">
          <p className="text-[11px] uppercase tracking-[3px] text-stone-400 dark:text-stone-500 mb-1">
            管理者 · Admin
          </p>
          <h1 className="text-3xl font-extralight tracking-tight text-stone-800 dark:text-stone-100">
            Role Manager
          </h1>
        </motion.div>

        {/* Search */}
        <motion.div {...fadeUp(0.05)} className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl p-5 mb-4">
          <p className="text-[10px] uppercase tracking-[2px] text-stone-400 dark:text-stone-500 mb-3">
            Search user by email
          </p>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-300 dark:text-stone-600" strokeWidth={1.5} />
              <input value={email} onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === "Enter" && searchUser()}
                placeholder="user@email.com"
                className="w-full h-9 pl-8 pr-3 text-sm bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-800 dark:text-stone-100 placeholder:text-stone-300 focus:outline-none focus:border-stone-400 transition-colors"
              />
            </div>
            <button onClick={searchUser} disabled={searching}
              className="px-4 h-9 rounded-lg bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-sm font-light disabled:opacity-40 hover:bg-stone-700 dark:hover:bg-stone-300 transition-colors flex items-center gap-1.5">
              {searching ? <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={1.5} /> : "Search"}
            </button>
          </div>
          <AnimatePresence>
            {error && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="text-xs text-red-400 mt-2 px-1">{error}</motion.p>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Result */}
        <AnimatePresence>
          {result && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl p-5">

              {/* User info */}
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-stone-100 dark:border-stone-800">
                <div>
                  <p className="text-sm font-light text-stone-800 dark:text-stone-100">{result.email}</p>
                  <p className="text-[11px] text-stone-400 dark:text-stone-500 mt-0.5 font-mono">{result.uid.slice(0, 16)}...</p>
                </div>
                {(() => {
                  const { label, color, icon: Icon } = ROLE_META[result.role];
                  return (
                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs ${color}`}>
                      <Icon className="w-3 h-3" strokeWidth={1.5} />
                      {label}
                    </div>
                  );
                })()}
              </div>

              {/* Role buttons */}
              <p className="text-[10px] uppercase tracking-[2px] text-stone-400 dark:text-stone-500 mb-3">
                Set role
              </p>
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(ROLE_META) as UserRole[]).map(r => {
                  const { label, icon: Icon } = ROLE_META[r];
                  const isActive = result.role === r;
                  return (
                    <button key={r} onClick={() => updateRole(r)} disabled={saving || isActive}
                      className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl border text-xs font-light transition-all disabled:opacity-50
                        ${isActive
                          ? "bg-stone-900 dark:bg-stone-100 border-stone-900 dark:border-stone-100 text-white dark:text-stone-900"
                          : "border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-400 hover:border-stone-400"}`}>
                      {saving && !isActive
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={1.5} />
                        : <Icon className="w-3.5 h-3.5" strokeWidth={1.5} />}
                      {label}
                    </button>
                  );
                })}
              </div>

              <AnimatePresence>
                {saved && (
                  <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="flex items-center gap-1.5 mt-3 text-xs text-stone-500 dark:text-stone-400">
                    <Check className="w-3.5 h-3.5" strokeWidth={2} />
                    Role updated
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick guide */}
        <motion.div {...fadeUp(0.1)} className="mt-6 border border-stone-200 dark:border-stone-700 rounded-xl p-5">
          <p className="text-[10px] uppercase tracking-[2px] text-stone-400 dark:text-stone-500 mb-3">Permissions</p>
          <div className="space-y-2">
            {(Object.entries(ROLE_META) as [UserRole, typeof ROLE_META[UserRole]][]).map(([r, meta]) => {
              const Icon = meta.icon;
              const perms = r === "admin"
                ? ["All VIP features", "Admin panel", "Role management"]
                : r === "pro" || r === "master"
                ? ["Sakura AI chatbot", "Voice conversation", "Unlimited words"]
                : ["Flashcards", "Add words", "Topics"];
              return (
                <div key={r} className="flex items-start gap-3">
                  <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] flex-shrink-0 ${meta.color}`}>
                    <Icon className="w-2.5 h-2.5" strokeWidth={1.5} />
                    {meta.label}
                  </div>
                  <p className="text-[11px] text-stone-400 dark:text-stone-500">{perms.join(" · ")}</p>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </AuthGuard>
  );
}