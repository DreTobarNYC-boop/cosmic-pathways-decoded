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
  const langCode = language?.startsWith("es") ? "es" : language?.startsWith("pt") ? "pt" : "en";
  const lang = langCode === "es" ? "Spanish" : langCode === "pt" ? "Portuguese" : "English";

  // Strong language enforcement — inline and in the target language itself
  const langEnforcement = langCode === "es"
    ? "CRITICAL: Escribe TODA tu respuesta en ESPAÑOL. Cada palabra de cada campo JSON debe estar en español. NO uses inglés en ningún campo."
    : langCode === "pt"
    ? "CRITICAL: Escreva TODA a sua resposta em PORTUGUÊS BRASILEIRO. Cada palavra de cada campo JSON deve estar em português. NÃO use inglês em nenhum campo."
    : "Write your entire response in English.";

  const base = `You are a wise, warm guide helping people understand themselves and navigate their real lives.

YOUR ONLY JOB: Translate cosmic data into practical, personal insights people can actually use today.

STRICT RULES:
- ZERO astrology jargon. Never say "Venus in Aquarius", "Moon trine Saturn", "House 7", "natal placement", "transit", "aspect", "opposition", "conjunction", or any astrological terminology.
- ZERO numerology jargon. Never say "your Expression number indicates" or reference numbers technically.
- Speak DIRECTLY to the person using "you" — like their most insightful friend who knows them deeply.
- Every sentence must answer: "What does this mean for MY real life right now?"
- Be specific, warm, honest, and practical. No vague spiritual fluff.
- The person's name is ${context.name ?? "Seeker"} — use it naturally, once or twice.

${langEnforcement}
Respond ONLY with a JSON object in this exact format, no markdown, no backticks:
{
  "title": "3-5 words capturing today's core energy — conversational, not mystical",
  "subtitle": "${context.sunSign ?? context.sign ?? "Your Sign"} · ${context.chineseZodiac ?? ""} · ${context.element ?? ""}",
  "reading": "Two paragraphs spoken directly to ${context.name ?? "this person"}. Paragraph 1: What is true about their energy and situation RIGHT NOW — practical and personal. Paragraph 2: One specific thing to do or be aware of today. Actionable. No astrology talk.",
  "cosmicAdvice": "One sentence of real, usable wisdom. Max 20 words. Something they could tell a friend.",
  "luckyNumber": ${context.personalDay ?? 7},
  "powerColor": "One color that matches today's energy",
  "sunSign": "${context.sunSign ?? context.sign ?? ""}",
  "affirmation": "One sentence starting with I that feels true and empowering for this specific person."
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
    daily_horoscope: `TASK: TODAY'S READING for ${context.name ?? "this person"}. Tell them what today actually feels like for them and what to do with it. What kind of day is this — for their energy, their focus, their relationships? What one thing should they prioritize or avoid? Be specific to who they are, not generic. No astrology language.`,

    stars_today: `TASK: TODAY'S READING for ${context.name ?? "this person"}. What does today feel like for them? What's the energy they woke up with, and what should they do with it? One thing to lean into, one thing to watch out for. Speak like you know them personally. No astrology terms.`,

    stars_birth_chart: `TASK: WHO THIS PERSON IS — a personal profile for ${context.name ?? "this person"} in plain everyday language. Three paragraphs: (1) Who they are at their core — their personality, their gifts, their blind spots. What makes them uniquely them. (2) How they love — what they need in relationships, how they show up for people, what breaks their heart. (3) What they're built for — their natural strengths, what kind of work fulfills them, what their life is pointing toward. Every sentence should make them think "that's exactly me." Zero jargon.`,

    stars_monthly: `TASK: THIS MONTH for ${context.name ?? "this person"}. What's the big theme of this month for them personally? What area of life needs the most attention — relationships, work, health, finances, personal growth? What opportunity is opening up and what should they stop doing? Be direct and useful, not poetic.`,

    stars_yearly: `TASK: THIS YEAR for ${context.name ?? "this person"}. What is this year really about for them? What chapter of their life are they in? What are they being asked to build, release, or step into? What will they look back on this year as having been about? Make it feel true to their specific life, not generic.`,

    stars_love: `TASK: LOVE & RELATIONSHIPS for ${context.name ?? "this person"}. How do they love? What do they actually need from a partner that they might not even admit to themselves? What patterns do they keep repeating in relationships? What would their ideal relationship actually look like in practice — day to day, not fantasy? What should they work on? Be honest and warm, like a close friend telling them the truth.`,

    stars_career: `TASK: WORK & CAREER for ${context.name ?? "this person"}. What are they naturally good at — what work environments make them come alive? What kind of work would feel like a waste of their life? What's holding them back professionally right now? What's the move they should make? Be practical and direct. This is career coaching, not astrology.`,

    stars_wellness: `TASK: HEALTH & ENERGY for ${context.name ?? "this person"}. What is their body and mind trying to tell them right now? What drains them that they keep ignoring? What simple habits would make the biggest difference for their wellbeing? What does their ideal version of taking care of themselves look like? Be real and specific, not generic wellness advice.`,

    compatibility: `TASK: COMPATIBILITY between ${context.name ?? "Person A"} and ${context.otherName ?? "this person"}. Three paragraphs: (1) What naturally works between them — where they click, what they build together, the easy parts. (2) Where it gets hard — the real friction points, not surface stuff, but the deeper incompatibilities they'll keep running into. (3) What this relationship is actually capable of at its best — and what it would take to get there. Speak directly to ${context.name ?? "the user"}. Be honest. No astrology terms.`,

    oracle_daily: `TASK: A DIRECT MESSAGE for ${context.name ?? "this person"} today. One powerful paragraph. What do they most need to hear right now? What truth are they avoiding? What are they ready for that they don't know yet? Speak with clarity and conviction. Like the wisest person they've ever met is looking them in the eye.`,

    oracle_chat: `TASK: Answer ${context.name ?? "this person"}'s question directly and personally. Their question is in context.userMessage. Use everything you know about them to give a real, specific, useful answer — not a generic spiritual response. 2-3 paragraphs. If they ask about love, talk about their specific love patterns. If they ask about money, talk about their specific relationship with ambition and security. Make them feel seen.`,

    dynasty_profile: `TASK: WHO THIS PERSON IS based on their Chinese zodiac for ${context.name ?? "this person"}. Not a textbook description — a personal profile. What does their animal sign reveal about how they actually operate in the world? Their instincts, their loyalty patterns, their ambitions, their fears? Write it like you're describing someone you know well to another person. Warm, specific, real.`,

    dynasty_year: `TASK: WHAT THIS YEAR HOLDS for ${context.name ?? "this person"} based on their Chinese zodiac energy. What is the year actually asking of them — in their work, their relationships, their personal growth? What's the opportunity and what's the trap? What should they focus on and what should they let go of this year? Practical and personal.`,

    dynasty_forecast: `TASK: 5-YEAR OUTLOOK for ${context.name ?? "this person"} based on Chinese zodiac cycles. For each year 2026-2030, give a short title and 1-2 sentences about what that year will be about for them personally — what life area is highlighted, what the energy is, what they should be doing. Make it feel like a personal roadmap, not a horoscope. You MUST return ONLY a JSON object: { "years": [ { "year": 2026, "title": "...", "rating": 4, "summary": "..." }, ... ] }`,

    numbers_today: `TASK: TODAY'S ENERGY for ${context.name ?? "this person"} based on their personal numbers. What kind of day is this for them specifically? What should they prioritize today? What does this day want from them — high output, rest, connection, introspection? One clear, practical paragraph. No number talk, just what it means.`,

    numbers_life_path: `TASK: ${context.name ?? "This person"}'s LIFE PURPOSE AND STRENGTHS. What are they here to do? What are their natural gifts that they might be underusing? What is the theme of their entire life? What kind of person are they at their best? What do they struggle with that's actually connected to their greatest strength? Two paragraphs. Make it personal, specific, and true. No jargon.`,
  };

  const task = tasks[type] ?? tasks.daily_horoscope;

  // dynasty_forecast requires a different output schema — don't include the horoscope base
  if (type === "dynasty_forecast") {
    return `You are a master Chinese astrologer. ${langEnforcement}
${data}

${task}`;
  }

  return `${base}\n${data}\n\n${task}\n\nREMEMBER: ${langEnforcement}`;
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
