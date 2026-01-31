import { NextResponse } from "next/server";
import { db } from "@/app/libs/firebase";
import { addDoc, collection } from "firebase/firestore";

export async function POST(req: Request) {
  const body = await req.json();

  const {
    english,
    meaning,
    example,
    topic,
  } = body;

  if (!english || !meaning || !topic) {
    return NextResponse.json(
      { error: "Missing fields" },
      { status: 400 },
    );
  }

  await addDoc(collection(db, "words"), {
    english,
    meaning,
    example: example || "",
    topic,
    learned: false,
    isPreset: true, // ⭐ hệ thống
    createdAt: Date.now(),
  });

  return NextResponse.json({ success: true });
}
