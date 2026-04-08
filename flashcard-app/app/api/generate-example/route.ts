import { NextResponse, NextRequest } from "next/server";

// Models confirmed working April 2026 - ordered by reliability
const MODELS = [
  "google/gemma-3-27b-it:free",
  "google/gemma-3-12b-it:free",
  "meta-llama/llama-3.3-70b-instruct:free",
  "microsoft/phi-4-reasoning-plus:free",
  "openrouter/free", // auto-router last resort
  "google/gemma-4-26b-a4b-it"

];

export async function POST(req: NextRequest) {
  try {
    const { word, meaning, topic, partOfSpeech } = await req.json();

    const isPhrase = word.trim().includes(" ");
    const wordType = isPhrase ? "phrase" : "word";

    const getPromptGuidance = () => {
      if (isPhrase) {
        return `- Use the entire phrase "${word}" naturally in the sentence
- Common phrase types: idiom, phrasal verb, collocation, expression`;
      }
      switch (partOfSpeech?.toLowerCase()) {
        case "noun":     return `- Use "${word}" as a NOUN (subject, object, or complement)`;
        case "verb":     return `- Use "${word}" as a VERB (action or state)`;
        case "adjective":return `- Use "${word}" as an ADJECTIVE (describing a noun)`;
        case "adverb":   return `- Use "${word}" as an ADVERB (modifying verb or adjective)`;
        case "preposition": return `- Use "${word}" as a PREPOSITION`;
        case "conjunction": return `- Use "${word}" as a CONJUNCTION`;
        case "interjection": return `- Use "${word}" as an INTERJECTION`;
        default: return `- Use "${word}" naturally. Meaning: ${meaning}`;
      }
    };

    // Random elements to force variety
    const subjects   = ["I", "She", "He", "We", "My friend", "The teacher", "A stranger", "My sister", "People"];
    const timeFrames = ["yesterday", "this morning", "last night", "every day", "once", "recently", "just now"];
    const randomSubject   = subjects[Math.floor(Math.random() * subjects.length)];
    const randomTime      = timeFrames[Math.floor(Math.random() * timeFrames.length)];
    const randomNum       = Math.floor(Math.random() * 9000) + 1000;

    const prompt = `[${randomNum}] Write exactly ONE English sentence about "${word}" from the perspective of "${randomSubject}", set "${randomTime}", topic: ${topic}.

${getPromptGuidance()}
- Be creative and specific — avoid clichés like "My ${word} likes to sleep on the sofa"
- Vary sentence structure, tense, and setting
- Level: A2–C1 natural English

Respond with ONLY: English sentence (Vietnamese translation in parentheses)
Example format: She found a stray cat near the market yesterday (Cô ấy tìm thấy một con mèo hoang gần chợ hôm qua).`;

    let responseData: any = null;
    let usedModel = "";

    for (const model of MODELS) {
      let res: Response;
      try {
        res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.OPENROUTER_API_KEY2}`,
            "X-Title": "Vocab App",
          },
          body: JSON.stringify({
            model,
            messages: [{ role: "user", content: prompt }],
            max_tokens: 200,
            temperature: 1.3,
            top_p: 0.9,
            // Disable caching
            transforms: [],
          }),
        });
      } catch (fetchErr) {
        console.warn(`⚠️ Fetch error ${model}:`, fetchErr);
        continue;
      }

      if (res.ok) {
        responseData = await res.json();
        usedModel = model;
        break;
      }

      const status = res.status;
      const errText = await res.text();
      console.warn(`⚠️ ${model} → ${status}:`, errText);
      if (status !== 429 && status !== 404) break;
    }

    if (!responseData) {
      console.error("❌ All models exhausted");
      return NextResponse.json({ example: "" }, { status: 500 });
    }

    const text = responseData.choices?.[0]?.message?.content ?? "";
    console.log(`✅ [${usedModel}] raw:`, text);
    console.log("📝 Input:", { word, partOfSpeech, topic, randomSubject, randomTime });

    const cleanedExample = text
      .trim()
      .replace(/^\[?\d+\]?\s*/, "")   // remove leading [seed]
      .replace(/^["']|["']$/g, "")    // remove surrounding quotes
      .split("\n")[0]
      .trim();

    return NextResponse.json({ example: cleanedExample || "" });
  } catch (error) {
    console.error("❌ Unexpected error:", error);
    return NextResponse.json({ example: "" }, { status: 500 });
  }
}