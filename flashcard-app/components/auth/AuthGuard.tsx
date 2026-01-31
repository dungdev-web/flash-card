"use client";

import { redirect } from "next/navigation";
import { useAuth } from "@/app/hooks/useAuth";
export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) redirect("/login");
  return <>{children}</>;
}
