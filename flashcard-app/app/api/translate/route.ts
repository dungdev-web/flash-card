import { NextResponse } from "next/server";


export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const word = searchParams.get("word");

  if (!word) {
    return NextResponse.json({ meaning: "" });
  }

  try {
    const res = await fetch(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=vi&dt=t&q=${encodeURIComponent(word)}`
    );

    const data = await res.json();
    const meaning = data[0][0][0] || "";

    return NextResponse.json({ meaning });
  } catch (error) {
    return NextResponse.json({ meaning: "" }, { status: 500 });
  }
}
// export async function POST(req: NextRequest) {
//   try {
//     const { word, meaning, topic } = await req.json();

//     // Sử dụng Gemini API
//     const response = await fetch(
//       `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
//       {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           contents: [
//             {
//               parts: [
//                 {
//                   text: `Create a simple, natural example sentence using the word "${word}" (meaning: ${meaning}) in the context of "${topic}". Make it practical and easy to understand. Return only the example sentence, nothing else.`,
//                 },
//               ],
//             },
//           ],
//           generationConfig: {
//             temperature: 0.7,
//             maxOutputTokens: 100,
//           },
//         }),
//       }
//     );

//     const data = await response.json();
//     const example =
//       data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";

//     return NextResponse.json({ example });
//   } catch (error) {
//     console.error("Error generating example:", error);
//     return NextResponse.json({ example: "" }, { status: 500 });
//   }
// }
