"use client";

// import { useAuth } from "@/app/hooks/useAuth";
import SakuraOverlay from "@/components/effects/SakuraOverlay";
import SakuraChatbot from "@/components/effects/SakuraChatbot";
export default function AuthenticatedExtras() {
  // const { user, loading } = useAuth();
  // if (loading || !user) return null;
  return (
    <>
      <SakuraOverlay maxPetals={35} />
      <SakuraChatbot />
    </>
  );
}
