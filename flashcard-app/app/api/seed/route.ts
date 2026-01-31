import { NextResponse } from "next/server";
import { db } from "@/app/libs/firebase";
import { collection, addDoc, getDocs, query, where } from "firebase/firestore";

const PRESET_WORDS = [
  {
    english: "routine",
    meaning: "thói quen hằng ngày",
    example: "My morning routine starts at 6 a.m.",
    topic: "Daily",
  },
  {
    english: "expression",
    meaning: "sự diễn đạt, biểu cảm",
    example: "Her facial expression showed happiness.",
    topic: "Daily",
  },
  {
    english: "destination",
    meaning: "điểm đến",
    example: "Paris is my favorite destination.",
    topic: "Travel",
  },
];

export async function POST() {
  const wordsRef = collection(db, "words");

  let added = 0;

  for (const word of PRESET_WORDS) {
    // ❌ tránh seed trùng
    const q = query(
      wordsRef,
      where("english", "==", word.english),
      where("topic", "==", word.topic),
      where("isPreset", "==", true)
    );

    const snap = await getDocs(q);
    if (!snap.empty) continue;

    await addDoc(wordsRef, {
      ...word,
      learned: false,
      isPreset: true,
      userId: "SYSTEM", // ⭐ quan trọng
      createdAt: Date.now(),
    });

    added++;
  }

  return NextResponse.json({
    message: "Seed completed",
    added,
  });
}
