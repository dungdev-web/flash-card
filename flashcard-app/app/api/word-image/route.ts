// src/app/api/word-image/route.ts
// Unsplash official API — key stays server-side only
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const word      = req.nextUrl.searchParams.get("word") ?? "";
  const sig       = req.nextUrl.searchParams.get("sig")  ?? "0"; // cache-bust
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;

  if (!word) return NextResponse.json({ error: "No word" }, { status: 400 });

  // ── If no Unsplash key, fall back to Picsum (always works, random beautiful photo) ──
  if (!accessKey) {
    const seed  = encodeURIComponent(word + sig);
    const url   = `https://picsum.photos/seed/${seed}/600/380`;
    return NextResponse.json({ url, author: "Picsum", authorUrl: "https://picsum.photos" });
  }

  try {
    const res = await fetch(
      `https://api.unsplash.com/photos/random?query=${encodeURIComponent(word)}&orientation=landscape&content_filter=high`,
      {
        headers: { Authorization: `Client-ID ${accessKey}` },
        // Revalidate every 10 min per word (ISR-friendly)
        next: { revalidate: 600 },
      }
    );

    if (!res.ok) throw new Error(`Unsplash ${res.status}`);

    const data = await res.json();
    return NextResponse.json({
      url:        data.urls?.regular ?? data.urls?.full,
      thumb:      data.urls?.small,
      author:     data.user?.name ?? "Unsplash",
      authorUrl:  data.user?.links?.html ?? "https://unsplash.com",
      description: data.alt_description ?? "",
    });
  } catch {
    // Final fallback: Picsum with word seed
    const seed = encodeURIComponent(word + sig);
    return NextResponse.json({
      url:       `https://picsum.photos/seed/${seed}/600/380`,
      author:    "Picsum",
      authorUrl: "https://picsum.photos",
    });
  }
}