// src/app/api/tts/route.ts
// Text-to-Speech via OpenAI-compatible endpoint on Groq (hoặc dùng browser TTS làm fallback)
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { text } = await req.json();
  if (!text) return NextResponse.json({ error: "No text" }, { status: 400 });

  const groqKey = process.env.GROQ_API_KEY;

  // ── Option A: Groq TTS (playai-tts) ──────────────────────────────────────
  if (groqKey) {
    try {
      const res = await fetch("https://api.groq.com/openai/v1/audio/speech", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${groqKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "playai-tts",
          input: text,
          voice: "Arista-PlayAI",  // female, natural
          response_format: "mp3",
        }),
      });

      if (res.ok) {
        const audioBuffer = await res.arrayBuffer();
        return new NextResponse(audioBuffer, {
          headers: {
            "Content-Type":  "audio/mpeg",
            "Cache-Control": "no-store",
          },
        });
      }
    } catch {
      // fall through to browser TTS signal
    }
  }

  // ── Option B: Signal client to use browser SpeechSynthesis ───────────────
  return NextResponse.json({ fallback: true, text });
}