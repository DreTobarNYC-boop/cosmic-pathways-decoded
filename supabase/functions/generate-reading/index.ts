import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const readingType = body.reading_type || body.readingType;
    const context = body.context || {};
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      return new Response(JSON.stringify({ error: "Server misconfiguration: GEMINI_API_KEY is missing." }), { status: 500, headers: corsHeaders });
    }

    // Build prompts. Adjust these prompts based on your application's needs.
    const systemPrompt = `You are a knowledgeable astrologer who provides personalized readings. Respond with clear, concise insights in plain language. Do not include markdown or code fences.`;
    const userPrompt = `Generate a reading for the following context and reading type: ${readingType}. Context: ${JSON.stringify(context)}.`;

    // Prepare request for Gemini 3 Flash
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const requestBody = {
      contents: [
        { role: "system", parts: [{ text: systemPrompt }] },
        { role: "user", parts: [{ text: userPrompt }] },
      ],
      generationConfig: {
        temperature: 0.9,
        maxOutputTokens: 600,
      },
    };

    let response;
    try {
      response = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/gemini-3-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
          signal: controller.signal,
        },
      );
    } catch (error) {
      if (error.name === "AbortError") {
        return new Response(JSON.stringify({ error: "The AI request timed out." }), { status: 408, headers: corsHeaders });
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      const errorText = await response.text();
      return new Response(JSON.stringify({ error: `AI request failed with status ${response.status}: ${errorText}` }), { status: 500, headers: corsHeaders });
    }

    const data = await response.json();
    const content =
      data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ||
      "Readings are temporarily unavailable. Try again shortly.";
    return new Response(JSON.stringify({ content }), { status: 200, headers: corsHeaders });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message || "Unexpected server error." }), { status: 500, headers: corsHeaders });
  }
});
