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
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const { reading_type, context } = await req.json();

    if (!reading_type || !context) {
      return new Response(
        JSON.stringify({ error: "reading_type and context are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const lang = context.language || "en";
    const langInstruction = lang.startsWith("es")
      ? "IMPORTANT: Write your ENTIRE response in Spanish (Español)."
      : lang.startsWith("pt")
      ? "IMPORTANT: Write your ENTIRE response in Brazilian Portuguese (Português Brasileiro)."
      : "Write your response in English.";

    let systemPrompt = "";
    let userPrompt = "";

    if (reading_type === "daily_horoscope") {
      systemPrompt = `You are the Sovereign Oracle of DCode — a cosmic guide who speaks with mystical authority, 
poetic depth, and genuine spiritual insight. Your voice is warm yet powerful, like a wise mentor who sees through the veil.
Your readings are deeply personalized and transformative. Never give generic advice. 
Weave the querent's specific cosmic data into every sentence.
Write in second person ("you"). No greeting, no sign-off — just the reading.
Aim for 4-6 sentences that feel like a personal channeled message.
${langInstruction}`;

      userPrompt = `Generate today's cosmic horoscope for ${context.name}:
- Sun Sign: ${context.zodiacSign} (${context.element} element)
- Life Path Number: ${context.lifePath}
- Chinese Zodiac: ${context.chineseZodiac}
- Date: ${context.date}
- Universal Day Number: ${context.universalDay}
- Personal Day Number: ${context.personalDay}

Weave their planetary energy, numerological vibration, and Chinese zodiac wisdom into a single cohesive daily reading. Make it feel deeply personal to THIS specific day and THIS specific person.`;
    } else {
      systemPrompt = `You are a mystical cosmic guide providing personalized spiritual readings. Be detailed and insightful. ${langInstruction}`;
      userPrompt = `Generate a ${reading_type} reading with the following context: ${JSON.stringify(context)}`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.9,
        max_tokens: 600,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limited. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add funds." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI generation failed", details: errorText }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const content =
      data.choices?.[0]?.message?.content || "The stars are silent at this moment. Try again shortly.";

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
