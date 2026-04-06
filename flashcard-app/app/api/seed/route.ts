// src/app/api/seed/route.ts
import { NextResponse } from "next/server";
import { db } from "@/app/libs/firebase";
import { collection, addDoc, getDocs, query, where } from "firebase/firestore";
import { readFile } from "fs/promises";
import path from "path";

// ── Parser (inline, no extra import needed) ──────────────────────────────────
interface PresetWord {
  english: string;
  meaning: string;
  example: string;
  topic: string;
}

function parseTxt(content: string): PresetWord[] {
  const words: PresetWord[] = [];
  let currentTopic = "Daily";

  for (const raw of content.split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;

    // [Topic] header
    const topicMatch = line.match(/^\[(.+)\]$/);
    if (topicMatch) { currentTopic = topicMatch[1].trim(); continue; }

    // english | meaning | example | topic?
    const parts = line.split("|").map(p => p.trim());
    if (parts.length < 2) continue;
    const [english, meaning, example = "", topicCol] = parts;
    if (!english || !meaning) continue;

    words.push({ english, meaning, example, topic: topicCol || currentTopic });
  }
  return words;
}

// ── Route handler ─────────────────────────────────────────────────────────────
export async function POST() {
  // Read preset-words.txt from /public
  const filePath = path.join(process.cwd(), "public", "preset-words.txt");
  let PRESET_WORDS: PresetWord[];

  try {
    const content = await readFile(filePath, "utf-8");
    PRESET_WORDS = parseTxt(content);
  } catch {
    return NextResponse.json(
      { error: "preset-words.txt not found in /public" },
      { status: 500 }
    );
  }

  const wordsRef = collection(db, "words");
  let added = 0;
  let skipped = 0;

  for (const word of PRESET_WORDS) {
    // Tránh seed trùng — giữ nguyên logic cũ của bạn
    const q = query(
      wordsRef,
      where("english", "==", word.english),
      where("topic",   "==", word.topic),
      where("isPreset","==", true)
    );

    const snap = await getDocs(q);
    if (!snap.empty) { skipped++; continue; }

    await addDoc(wordsRef, {
      ...word,
      learned:  false,
      isPreset: true,
      userId:   "SYSTEM",
      createdAt: Date.now(),
    });

    added++;
  }

  return NextResponse.json({
    message: "Seed completed",
    total:   PRESET_WORDS.length,
    added,
    skipped,
  });
}