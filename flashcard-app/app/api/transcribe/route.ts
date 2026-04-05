// src/app/api/transcribe/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: "Missing Groq API key" }, { status: 500 });
  }

  try {
    const formData = await req.formData();
    const audio = formData.get("audio") as File;

    if (!audio) {
      return NextResponse.json({ error: "No audio file" }, { status: 400 });
    }

    const groqForm = new FormData();
    groqForm.append("file", audio, "recording.webm");
    groqForm.append("model", "whisper-large-v3");
    groqForm.append("language", "en");
    groqForm.append("response_format", "json");

    const res = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}` },
      body: groqForm,
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: err }, { status: 502 });
    }

    const data = await res.json();
    return NextResponse.json({ text: data.text ?? "" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}