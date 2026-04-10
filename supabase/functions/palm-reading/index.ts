import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const context = body.context || {};
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({
          error: "Server misconfiguration: GEMINI_API_KEY is missing.",
        }),
        { status: 500, headers: corsHeaders },
      );
    }

    // Compose prompts for palm reading
    const systemPrompt = `You are a knowledgeable palmist who interprets the lines and shapes of a person's palm to reveal insights into their personality, past, and future. Provide your reading in clear, concise language without markdown or code fences.`;
    const userPrompt = `Please analyze the following palm reading request: ${JSON.stringify(context)}. Offer insights about love, career, health, and any unique markings.`;

    // Configure AbortController for an 8-second timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const requestBody = {
      contents: [
        { role: "system", parts: [{ text: systemPrompt }] },
        { role: "user", parts: [{ text: userPrompt }] },
      ],
      generationConfig: {
        temperature: 0.8,
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
        return new Response(
          JSON.stringify({ error: "The AI request timed out." }),
          { status: 408, headers: corsHeaders },
        );
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      const errorText = await response.text();
      return new Response(
        JSON.stringify({
          error: `AI request failed with status ${response.status}: ${errorText}`,
        }),
        { status: 500, headers: corsHeaders },
      );
    }

    const data = await response.json();
    const content =
      data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ||
      "Readings are temporarily unavailable. Try again shortly.";
    return new Response(JSON.stringify({ content }), {
      status: 200,
      headers: corsHeaders,
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error.message || "Unexpected server error.",
      }),
      { status: 500, headers: corsHeaders },
    );
  }
});
