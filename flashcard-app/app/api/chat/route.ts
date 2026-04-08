// src/app/api/chat/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { messages, topic, voiceMode = false } = await req.json();
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: "Missing API key" }, { status: 500 });
  }

  const system = `You are Sakura (桜), a warm and elegant Japanese-style language tutor.
Your personality:
- Speak gently, encouragingly, with occasional Japanese phrases (with translations)
- Focus on teaching English vocabulary and helping users practice
- Current topic context: "${topic ?? "general English"}"
- Keep responses concise but meaningful (2-4 sentences)
- If voiceMode is true: reply in 1-2 short spoken sentences only, no markdown, no bullet points
- Occasionally suggest related words or example sentences
- Use light Japanese cultural references naturally
- Address the user respectfully, never be condescending
- If the user speaks Vietnamese, reply in Vietnamese with English vocabulary highlights`;

  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
        "X-Title": "FlashCard App",
      },
      body: JSON.stringify({
        model: "nvidia/nemotron-3-super-120b-a12b:free",
        messages: [
          { role: "system", content: system },
          ...messages,
        ],
        temperature: 0.85,
        max_tokens: 400,
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
    const reply = data.choices?.[0]?.message?.content ?? "";
    return NextResponse.json({ reply });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}