"use client";

import AuthGuard from "@/components/auth/AuthGuard";
import FlashCardList from "@/components/flashcard/FlashCardList";

export default function FlashcardsPage() {

  return (
    <AuthGuard>
      <FlashCardList/> 
    </AuthGuard>
  );
}
