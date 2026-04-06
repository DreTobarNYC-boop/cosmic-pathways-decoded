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
    } else if (reading_type === "stars_today") {
      systemPrompt = `You are the Sovereign Oracle of DCode — a cosmic guide who channels deep astrological wisdom.
Your readings are profound, poetic, and transformative. You speak with mystical authority.
You MUST respond with valid JSON only. No markdown, no code fences, just raw JSON.
${langInstruction}`;

      userPrompt = `Generate a detailed daily astrological reading for ${context.name}.

Cosmic Profile:
- Sun Sign: ${context.zodiacSign} (${context.element} element)
- Life Path Number: ${context.lifePath}
- Chinese Zodiac: ${context.chineseZodiac}
- Date: ${context.date}
- Birth Place: ${context.birthPlace || "Unknown"}
- Birth Time: ${context.birthTime || "Unknown"}
- Universal Day Number: ${context.universalDay}
- Personal Day Number: ${context.personalDay}

Respond with ONLY this JSON structure (no markdown):
{
  "title": "A poetic 2-4 word title for today's energy",
  "subtitle": "${context.zodiacSign} (cusp info if near a cusp) · Moon sign estimation · Dominant element",
  "reading": "A detailed 3-4 paragraph reading weaving planetary transits, numerological vibrations, and Chinese zodiac energy. Make it deeply personal and transformative. Use poetic, mystical language.",
  "cosmicAdvice": "A single powerful sentence of cosmic advice in quotes, like channeled wisdom.",
  "luckyNumber": a single number 1-33,
  "powerColor": "A specific color name like Seafoam Green or Midnight Indigo",
  "affirmation": "A powerful first-person affirmation for the day in quotes."
}`;
    } else if (reading_type.startsWith("stars_")) {
      // Handle other stars tabs: stars_monthly, stars_yearly, stars_love, stars_career, stars_birth_chart
      const tabType = reading_type.replace("stars_", "");
      const tabLabels: Record<string, string> = {
        monthly: "monthly astrological forecast",
        yearly: `${new Date().getFullYear()} yearly overview`,
        love: "love and relationships reading",
        career: "career and purpose reading",
        birth_chart: "birth chart analysis",
      };
      const label = tabLabels[tabType] || `${tabType} reading`;

      systemPrompt = `You are the Sovereign Oracle of DCode — a cosmic guide who channels deep astrological wisdom.
Your readings are profound, poetic, and transformative. You speak with mystical authority.
You MUST respond with valid JSON only. No markdown, no code fences, just raw JSON.
${langInstruction}`;

      userPrompt = `Generate a detailed ${label} for ${context.name}.

Cosmic Profile:
- Sun Sign: ${context.zodiacSign} (${context.element} element)
- Life Path Number: ${context.lifePath}
- Chinese Zodiac: ${context.chineseZodiac}
- Date: ${context.date}
- Birth Place: ${context.birthPlace || "Unknown"}
- Birth Time: ${context.birthTime || "Unknown"}

Respond with ONLY this JSON structure (no markdown):
{
  "title": "A poetic 2-4 word title",
  "subtitle": "A brief cosmic context line",
  "reading": "A detailed 3-4 paragraph ${label}. Make it deeply personal and transformative.",
  "cosmicAdvice": "A single powerful sentence of wisdom."
}`;
    } else if (reading_type === "frequency_reading") {
      systemPrompt = `You are the Sovereign Oracle of DCode — a consciousness guide who interprets the Hawkins Map of Consciousness with profound mystical insight.
You speak with authority about energy fields, consciousness calibration, and spiritual evolution.
You MUST respond with valid JSON only. No markdown, no code fences, just raw JSON.
${langInstruction}`;

      const answersDetail = context.answers ? JSON.stringify(context.answers) : "[]";

      userPrompt = `Generate a consciousness frequency reading for ${context.name}.

Their quiz results:
- Consciousness Level: ${context.level} (${context.emotion})
- Calibration: ${context.calibration}
- Total Score: ${context.totalScore}/50
- Category Scores: ${answersDetail}
- Next Level: ${context.nextLevel} (${context.pointsToNext} points away)

Respond with ONLY this JSON structure (no markdown):
{
  "reading": "A detailed 1-2 paragraph reading about their consciousness level on the Hawkins scale. Reference their specific calibration number, what it means to be at ${context.level}, and how their category scores reveal their energy pattern. Make it feel like a channeled message about their field. Use 'you' voice.",
  "shadow": "A concise paragraph about the shadow side of ${context.level} level — the trap or risk at this frequency. What could hold them back.",
  "gift": "A concise paragraph about the gift of ${context.level} level — what makes this frequency rare and powerful. What they bring to the world."
}`;
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
        max_tokens: reading_type === "daily_horoscope" ? 600 : 1200,
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
