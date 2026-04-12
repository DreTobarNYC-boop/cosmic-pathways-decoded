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
    const { sign, birthDate, readingType, selectedLanguage } = await req.json();

    const language = selectedLanguage || "en";

    const languageInstruction =
      language === "es"
        ? "Respond ONLY in Spanish. Do not use any English."
        : language === "pt"
        ? "Respond ONLY in Portuguese (Brazilian). Do not use any English."
        : "Respond in English.";

    const prompts: Record<string, string> = {
      daily: `You are DCode, a spiritual oracle speaking directly to a ${sign}. ${languageInstruction} Write a personal, deeply insightful daily horoscope for today. Speak directly to them — use "you" and "your". 3-4 sentences. No JSON, no formatting, just flowing prose.`,
      monthly: `You are DCode, a spiritual oracle. ${languageInstruction} Write a monthly horoscope for ${sign} for this month. Personal, direct, insightful. 4-5 sentences. No JSON, just flowing prose.`,
      yearly: `You are DCode, a spiritual oracle. ${languageInstruction} Write a 2026 yearly forecast for ${sign}. Personal, visionary, empowering. 5-6 sentences. No JSON, just flowing prose.`,
      love: `You are DCode, a spiritual oracle. ${languageInstruction} Write a love and relationships reading for ${sign}. Warm, honest, personal. 3-4 sentences. No JSON, just flowing prose.`,
      career: `You are DCode, a spiritual oracle. ${languageInstruction} Write a career and purpose reading for ${sign}. Empowering, direct, specific. 3-4 sentences. No JSON, just flowing prose.`,
      wellness: `You are DCode, a spiritual oracle. ${languageInstruction} Write a wellness and energy reading for ${sign}. Grounding, nurturing, personal. 3-4 sentences. No JSON, just flowing prose.`,
    };

    const prompt = prompts[readingType] || prompts.daily;

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${Deno.env.get("GEMINI_API_KEY")}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.9,
            maxOutputTokens: 300,
          },
        }),
      }
    );

    const geminiData = await geminiResponse.json();
    const reading =
      geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || "Your reading is being prepared.";

    return new Response(JSON.stringify({ reading }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
