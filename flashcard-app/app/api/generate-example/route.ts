import { NextResponse, NextRequest } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
  try {
    const { word, meaning, topic, partOfSpeech } = await req.json();

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
    });

    // 🆕 Xác định loại (word hoặc phrase)
    const isPhrase = word.trim().includes(" ");
    const wordType = isPhrase ? "phrase" : "word";

    // 🆕 Tạo prompt động dựa trên part of speech
    const getPromptGuidance = () => {
      if (isPhrase) {
        return `- Use the entire phrase "${word}" naturally in the sentence
- The phrase should function as a complete unit in the context
- Common phrase types: idiom, phrasal verb, collocation, expression`;
      }

      // Guidance cho từng loại từ
      switch (partOfSpeech?.toLowerCase()) {
        case "noun":
          return `- Use "${word}" as a NOUN (subject, object, or complement)
- Example structures: "The ${word} is...", "I see a ${word}", "This ${word}..."`;

        case "verb":
          return `- Use "${word}" as a VERB (action or state)
- Example structures: "I ${word}...", "She ${word}s...", "They ${word}ed..."`;

        case "adjective":
          return `- Use "${word}" as an ADJECTIVE (describing a noun)
- Example structures: "The ${word} thing...", "A ${word} person...", "It looks ${word}"`;

        case "adverb":
          return `- Use "${word}" as an ADVERB (modifying verb, adjective, or sentence)
- Example structures: "He speaks ${word}", "She runs ${word}", "${word}, I agree"`;

        case "pronoun":
          return `- Use "${word}" as a PRONOUN (replacing a noun)
- Example structures: "${word} is...", "I saw ${word}", "Give it to ${word}"`;

        case "preposition":
          return `- Use "${word}" as a PREPOSITION (showing relationship)
- Example structures: "...${word} the table", "...${word} London", "...${word} 5 PM"`;

        case "conjunction":
          return `- Use "${word}" as a CONJUNCTION (connecting words/clauses)
- Example structures: "I like coffee ${word} tea", "She studied hard ${word} passed"`;

        case "interjection":
          return `- Use "${word}" as an INTERJECTION (exclamation)
- Example structures: "${word}! That's amazing", "${word}, I didn't know that"`;

        default:
          return `- Use "${word}" naturally in a sentence
- Make sure the word fits the meaning: ${meaning}`;
      }
    };

    const prompt = `
Create ONE simple, natural English sentence using the ${wordType} "${word}".

Word/Phrase: "${word}"
Type: ${partOfSpeech || (isPhrase ? "phrase" : "word")}
Meaning: ${meaning}
Context/Topic: ${topic}

Requirements:
${getPromptGuidance()}
- ONE sentence only (no multiple sentences)
- Simple, conversational English (A2-B1 level)
- Natural usage that a native speaker would say
- Context should relate to: ${topic}
- NO explanations, NO quotation marks around the word
- Just return the sentence directly

Example format: "I love reading books in my free time."
`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    console.log("🧠 Gemini raw:", text);
    console.log("📝 Input context:", { word, partOfSpeech, topic, isPhrase });

    // 🆕 Clean up response (remove quotes, extra whitespace, explanations)
    let cleanedExample = text
      ?.trim()
      .replace(/^["']|["']$/g, "") // Remove surrounding quotes
      .split('\n')[0] // Get only first line (alternative to /\n.*$/s)
      .trim();

    return NextResponse.json({
      example: cleanedExample || "",
    });
  } catch (error) {
    console.error("❌ Gemini error:", error);
    return NextResponse.json({ example: "" }, { status: 500 });
  }
}