import { NextResponse } from "next/server";
import { db } from "@/app/libs/firebase";
import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const topic = searchParams.get("topic");
  const userId = searchParams.get("userId");

  if (!topic) return NextResponse.json([]);

  const wordsRef = collection(db, "words");

  // 1️⃣ preset words
  const presetQuery = query(
    wordsRef,
    where("topic", "==", topic),
    where("isPreset", "==", true)
  );

  // 2️⃣ user words
  const userQuery =
    userId
      ? query(
          wordsRef,
          where("topic", "==", topic),
          where("userId", "==", userId)
        )
      : null;

  const presetSnap = await getDocs(presetQuery);
  const userSnap = userQuery ? await getDocs(userQuery) : null;

  const map = new Map<string, any>();

  presetSnap.docs.forEach(doc =>
    map.set(doc.id, { id: doc.id, ...doc.data() })
  );

  userSnap?.docs.forEach(doc =>
    map.set(doc.id, { id: doc.id, ...doc.data() })
  );

  return NextResponse.json([...map.values()]);
}
