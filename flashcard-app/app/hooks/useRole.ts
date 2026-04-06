// src/app/hooks/useRole.ts
// Hook dùng ở bất kỳ component nào để kiểm tra role

"use client";

import { useEffect, useState } from "react";
import { useAuth } from "./useAuth";
import { getUserRole, type UserRole } from "@/app/libs/auth";

export function useRole() {
  const { user, loading: authLoading } = useAuth();
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setRole(null);
      setLoading(false);
      return;
    }

    getUserRole(user.uid)
      .then((r) => setRole(r))
      .finally(() => setLoading(false));
  }, [user, authLoading]);

  return {
    role,
    loading,
    isAdmin: role === "admin",
    isPro: role === "pro" || role === "master" || role === "admin",
    isMaster: role === "master" || role === "admin",
    isVip: role === "pro" || role === "master" || role === "admin", 
    isUser: role === "user",
  };
}
