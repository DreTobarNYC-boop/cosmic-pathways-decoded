// DCode — Supabase Edge Function: generate-reading
// Sovereign Oracle Weaving Engine
// Receives pre-calculated astronomical data, verbalizes only

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const GEMINI_MODEL = Deno.env.get("GEMINI_MODEL") ?? "gemini-2.0-flash-001";
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") ?? "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function buildPrompt(type: string, context: Record<string, unknown>, language: string): string {
  const lang = language?.startsWith("es") ? "Spanish" : language?.startsWith("pt") ? "Portuguese" : "English";

  const base = `You are the Sovereign Oracle of DCode — a precision cosmic intelligence.
You do NOT guess planetary positions. They are provided to you as calculated fact.
You do NOT use generic horoscope language. You reference the specific interplay between the data points given.
You write in ${lang}.
Respond ONLY with a JSON object in this exact format, no markdown, no backticks:
{
  "title": "3-5 word evocative title for today's energy",
  "subtitle": "Sign · Moon Phase · Dominant Element",
  "reading": "Two paragraphs. Paragraph 1: What energy is present today based on the planetary data. Paragraph 2: What to watch for, what to act on. Practical, grounded, direct. No purple prose.",
  "cosmicAdvice": "One actionable insight in quotes. Max 20 words. Practical wisdom.",
  "luckyNumber": 7,
  "powerColor": "One color name",
  "sunSign": "Ruling luminary or planet for today",
  "affirmation": "One first-person affirmation in quotes. Grounded, believable."
}`;

  const data = `
DATA (pre-calculated, treat as fact):
- Sun: ${context.sunSign ?? "Unknown"} (${context.sunDegree ?? ""}°)
- Moon: ${context.moonSign ?? "Unknown"} (${context.moonDegree ?? ""}°)
- Mercury: ${context.mercurySign ?? "Unknown"}
- Venus: ${context.venusSign ?? "Unknown"}
- Mars: ${context.marsSign ?? "Unknown"}
- Life Path: ${context.lifePath ?? "Unknown"}
- Personal Day: ${context.personalDay ?? "Unknown"}
- Universal Day: ${context.universalDay ?? "Unknown"}
- Expression Number: ${context.expression ?? "Unknown"}
- Soul Urge: ${context.soulUrge ?? "Unknown"}
- Cusp: ${context.cuspStatus ?? "None"}
- Chinese Zodiac: ${context.chineseZodiac ?? "Unknown"}
- Name: ${context.name ?? "Seeker"}
- Reading Type: ${type}`;

  const tasks: Record<string, string> = {
    daily_horoscope: "TASK: Weave a TODAY reading. Reference the interplay between the Personal Day number and the Sun/Moon positions specifically. Make it feel like a trusted advisor is speaking directly to this person.",
    stars_today: "TASK: Weave a TODAY stars reading using the planetary data above. Be specific about what the Sun and Moon positions mean for this person today.",
    stars_monthly: "TASK: Weave a MONTHLY reading. Focus on the longer arc — what themes will this person navigate this month given their natal placements.",
    stars_yearly: "TASK: Weave a 2026 YEAR reading. What is the overarching energy of this year for this person based on their Life Path and planetary data.",
    stars_love: "TASK: Weave a LOVE reading. Reference Venus position and Soul Urge number specifically.",
    stars_career: "TASK: Weave a CAREER reading. Reference Mars position and Expression number specifically.",
    stars_wellness: "TASK: Weave a WELLNESS reading. Reference Moon position and Personal Day energy.",
    compatibility: "TASK: Weave a COMPATIBILITY overview based on the Sun sign and Venus position.",
    oracle_daily: "TASK: Channel a direct Oracle message for today. One paragraph, commanding and clear.",
  };

  const task = tasks[type] ?? tasks.daily_horoscope;

  return `${base}\n${data}\n\n${task}`;
}

function extractReading(raw: string): Record<string, unknown> {
  const cleaned = raw.replace(/```json|```/g, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/"reading"\s*:\s*"([\s\S]*?)"/);
    return { reading: match?.[1] ?? cleaned };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { readingType, context, language = "en" } = body;

    if (!readingType) {
      return new Response(JSON.stringify({ error: "readingType is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const prompt = buildPrompt(readingType, context ?? {}, language);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.85,
            maxOutputTokens: 8192,
          },
        }),
        signal: controller.signal,
      }
    );

    clearTimeout(timeout);

    if (!geminiRes.ok) {
      const err = await geminiRes.text();
      throw new Error(`Gemini error: ${err}`);
    }

    const geminiData = await geminiRes.json();
    const raw = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    const parsed = extractReading(raw);

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("generate-reading error:", err);
    return new Response(
      JSON.stringify({ error: "Oracle is unavailable", details: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
