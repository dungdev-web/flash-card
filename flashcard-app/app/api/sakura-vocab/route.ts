// src/app/api/sakura-vocab/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const topic = req.nextUrl.searchParams.get("topic") ?? "daily";
  const count = Number(req.nextUrl.searchParams.get("count") ?? "15");
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: "Missing API key" }, { status: 500 });
  }

  const prompt = `Generate ${count} English vocabulary words for the topic "${topic}".
For each word provide the Vietnamese meaning.
Respond ONLY with a valid JSON array, no markdown, no extra text.
Format: [{"word":"...","meaning":"..."}]
Words should be intermediate to advanced, varied and interesting.`;

  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer":
          process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
        "X-Title": "FlashCard App",
      },
      body: JSON.stringify({
        model: "nvidia/nemotron-3-super-120b-a12b:free",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.9,
        max_tokens: 800,
      }),
    });

    if (!res.ok) {
      const errBody = await res.text(); // ← thêm dòng này
      console.error("OpenRouter error:", res.status, errBody);
      return NextResponse.json(
        { error: `OpenRouter ${res.status}`, detail: errBody },
        { status: 502 },
      );
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content ?? "[]";
    const clean = text.replace(/```json|```/g, "").trim();
    const words = JSON.parse(clean);

    return NextResponse.json({ words });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
