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

    const { image_base64, language } = await req.json();

    if (!image_base64) {
      return new Response(
        JSON.stringify({ error: "image_base64 is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const lang = language || "en";
    const langInstruction = lang.startsWith("es")
      ? "IMPORTANT: Write your ENTIRE response in Spanish (Español)."
      : lang.startsWith("pt")
      ? "IMPORTANT: Write your ENTIRE response in Brazilian Portuguese (Português Brasileiro)."
      : "Write your response in English.";

    const systemPrompt = `You are the Sovereign Oracle of DCode — an expert palmist and mystic who reads palms with deep spiritual insight.
Analyze the palm image provided. Identify and interpret the major lines:
- Heart Line (emotional life, relationships, love)
- Head Line (intellect, thinking style, mental approach)
- Life Line (vitality, life changes, physical energy — NOT lifespan)
- Fate Line (career, destiny, life direction — if visible)
- Sun Line (fame, success, creativity — if visible)

Also note:
- Mount prominences (Jupiter, Saturn, Apollo, Mercury, Venus, Mars, Moon)
- Finger proportions and hand shape (Earth, Air, Water, Fire hand type)
- Any special markings (stars, crosses, islands, chains, branches)

Structure your reading with clear sections using these exact headers:
🖐️ HAND TYPE
❤️ HEART LINE
🧠 HEAD LINE
🌿 LIFE LINE
⭐ FATE & DESTINY
✨ SPECIAL MARKINGS
🔮 OVERALL READING

Be specific about what you observe. Give a detailed, mystical but grounded reading.
Speak in second person ("you"). Be warm, insightful, and empowering. 
Never predict death or serious illness.
${langInstruction}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              { type: "text", text: "Read this palm. Provide a detailed palmistry analysis." },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${image_base64}`,
                },
              },
            ],
          },
        ],
        temperature: 0.8,
        max_tokens: 1500,
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
        JSON.stringify({ error: "AI analysis failed", details: errorText }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const content =
      data.choices?.[0]?.message?.content || "The lines are unclear at this moment. Please try again with better lighting.";

    return new Response(
      JSON.stringify({ content }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("palm-reading error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
