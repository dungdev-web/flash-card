import { NextResponse } from "next/server";
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const word = searchParams.get("word");

  if (!word) {
    return NextResponse.json({ phonetic: "" });
  }

  try {
    const res = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`
    );

    const data = await res.json();
    
    // Lấy phiên âm IPA
    const phonetic = data[0]?.phonetic || 
                     data[0]?.phonetics?.[0]?.text || 
                     "";
    
    // Lấy file audio phát âm
    const audioUrl = data[0]?.phonetics?.find((p: any) => p.audio)?.audio || "";

    return NextResponse.json({ 
      phonetic,
      audioUrl 
    });
  } catch (error) {
    return NextResponse.json({ phonetic: "", audioUrl: "" }, { status: 500 });
  }
}