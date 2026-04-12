import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();

    // Accept both naming conventions from the frontend
    const readingType = body.readingType ?? body.reading_type ?? "daily";
    const selectedLanguage = body.selectedLanguage ?? body.language ?? body.context?.selectedLanguage ?? body.context?.language ?? "en";
    const sign = body.sign ?? body.context?.sign ?? body.context?.zodiacSign ?? body.context?.sunSign ?? "Aries";
    const name = body.name ?? body.context?.name ?? body.context?.firstName ?? "";

    const languageInstruction =
      selectedLanguage === "es"
        ? "Respond ONLY in Spanish. Do not use any English."
        : selectedLanguage === "pt"
        ? "Respond ONLY in Portuguese (Brazilian). Do not use any English."
        : "Respond in English.";

    const nameStr = name ? `, speaking to ${name}` : "";

    const prompts: Record<string, string> = {
      daily: `You are DCode, a spiritual oracle speaking directly to a ${sign}${nameStr}. ${languageInstruction} Write a personal, deeply insightful daily horoscope for today. Speak directly to them — use "you" and "your". 3-4 sentences. No JSON, no formatting, just flowing prose.`,
      monthly: `You are DCode, a spiritual oracle${nameStr}. ${languageInstruction} Write a monthly horoscope for ${sign} for this month. Personal, direct, insightful. 4-5 sentences. No JSON, just flowing prose.`,
      yearly: `You are DCode, a spiritual oracle${nameStr}. ${languageInstruction} Write a 2026 yearly forecast for ${sign}. Personal, visionary, empowering. 5-6 sentences. No JSON, just flowing prose.`,
      love: `You are DCode, a spiritual oracle${nameStr}. ${languageInstruction} Write a love and relationships reading for ${sign}. Warm, honest, personal. 3-4 sentences. No JSON, just flowing prose.`,
      career: `You are DCode, a spiritual oracle${nameStr}. ${languageInstruction} Write a career and purpose reading for ${sign}. Empowering, direct, specific. 3-4 sentences. No JSON, just flowing prose.`,
      wellness: `You are DCode, a spiritual oracle${nameStr}. ${languageInstruction} Write a wellness and energy reading for ${sign}. Grounding, nurturing, personal. 3-4 sentences. No JSON, just flowing prose.`,
      compatibil