import { NextResponse, NextRequest } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
  try {
    const { word, meaning, topic } = await req.json();

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
    });

    const prompt = `
Create ONE simple English sentence using the word "${word}".
Meaning: ${meaning}
Context: ${topic}

Rules:
- One sentence only
- Simple, natural English
- No explanation
`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    console.log("🧠 Gemini raw:", text);

    return NextResponse.json({
      example: text?.trim() || "",
    });
  } catch (error) {
    console.error("❌ Gemini error:", error);
    return NextResponse.json({ example: "" }, { status: 500 });
  }
}
