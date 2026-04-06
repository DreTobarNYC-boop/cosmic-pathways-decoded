import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    const { reading_type, context } = await req.json();

    if (!reading_type || !context) {
      return new Response(
        JSON.stringify({ error: "reading_type and context are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build prompt based on reading type
    let systemPrompt = "";
    let userPrompt = "";

    if (reading_type === "daily_horoscope") {
      systemPrompt = `You are the Sovereign Oracle of the 36 Chambers — a cosmic guide who speaks with mystical authority, 
poetic depth, and genuine spiritual insight. Your readings are deeply personalized and transformative. 
Never give generic advice. Weave the querent's specific cosmic data into every response.
Keep your response to 2-3 sentences — potent, poetic, and personal.`;

      userPrompt = `Generate today's cosmic briefing horoscope for:
- Sun Sign: ${context.zodiacSign} (${context.element} element)
- Life Path Number: ${context.lifePath}
- Chinese Zodiac: ${context.chineseZodiac}
- Date: ${context.date}
- Universal Day Number: ${context.universalDay}
- Personal Day Number: ${context.personalDay}

Weave their planetary energy, numerological vibration, and Chinese zodiac wisdom into a single cohesive daily reading.`;
    } else {
      systemPrompt = "You are a mystical cosmic guide providing personalized spiritual readings.";
      userPrompt = `Generate a ${reading_type} reading with the following context: ${JSON.stringify(context)}`;
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            { role: "user", parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] },
          ],
          generationConfig: {
            temperature: 0.9,
            maxOutputTokens: 500,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI generation failed", details: errorText }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const content =
      data.candidates?.[0]?.content?.parts?.[0]?.text || "The stars are silent at this moment. Try again shortly.";

    return new Response(
      JSON.stringify({ content }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("generate-reading error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
