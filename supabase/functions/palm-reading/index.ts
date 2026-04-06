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
      ? "IMPORTANT: Write ALL text values in Spanish (Español)."
      : lang.startsWith("pt")
      ? "IMPORTANT: Write ALL text values in Brazilian Portuguese (Português Brasileiro)."
      : "Write all text values in English.";

    const systemPrompt = `You are the Sovereign Oracle of DCode — an expert palmist and mystic. Analyze the palm image and return a JSON object with this EXACT structure. ${langInstruction}

Return ONLY valid JSON, no markdown, no code fences. The structure must be:

{
  "handType": "Earth Hand" | "Air Hand" | "Water Hand" | "Fire Hand",
  "element": "Earth Element" | "Air Element" | "Water Element" | "Fire Element",
  "archetype": {
    "name": "THE BUILDER" (or similar archetype title in caps),
    "traits": ["Grounded", "Practical", "Resilient"] (3 key traits),
    "summary": "2-3 sentence overview of what the palm reveals about this person's core nature",
    "shadow": "1-2 sentence caution about their potential blind spot or risk"
  },
  "reading": {
    "overview": "4-6 sentence holistic palm reading weaving all elements together"
  },
  "lines": {
    "heart": { "strength": "strong" | "moderate" | "faint", "description": "2-3 sentences about the heart line" },
    "head": { "strength": "strong" | "moderate" | "faint", "description": "2-3 sentences about the head line" },
    "life": { "strength": "strong" | "moderate" | "faint", "description": "2-3 sentences about the life line" },
    "fate": { "strength": "strong" | "moderate" | "faint" | "absent", "description": "2-3 sentences about the fate line" },
    "sun": { "strength": "strong" | "moderate" | "faint" | "absent", "description": "2-3 sentences about the sun line" }
  },
  "mounts": {
    "jupiter": { "prominence": "high" | "moderate" | "flat", "meaning": "1-2 sentences" },
    "saturn": { "prominence": "high" | "moderate" | "flat", "meaning": "1-2 sentences" },
    "apollo": { "prominence": "high" | "moderate" | "flat", "meaning": "1-2 sentences" },
    "mercury": { "prominence": "high" | "moderate" | "flat", "meaning": "1-2 sentences" },
    "venus": { "prominence": "high" | "moderate" | "flat", "meaning": "1-2 sentences" },
    "moon": { "prominence": "high" | "moderate" | "flat", "meaning": "1-2 sentences" }
  },
  "markings": [
    { "type": "Star" | "Cross" | "Island" | "Chain" | "Branch" | "Triangle" | "Square" | "Trident", "location": "where on the palm", "meaning": "1-2 sentences" }
  ]
}

Be specific about what you observe. Be warm, insightful, and empowering. Never predict death or serious illness.`;

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
              { type: "text", text: "Analyze this palm image and return the structured JSON reading." },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${image_base64}`,
                },
              },
            ],
          },
        ],
        temperature: 0.7,
        max_tokens: 2500,
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
    let content = data.choices?.[0]?.message?.content || "";

    // Strip markdown code fences if present
    content = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();

    try {
      const parsed = JSON.parse(content);
      return new Response(
        JSON.stringify({ content: parsed }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch {
      console.error("Failed to parse AI response as JSON:", content);
      return new Response(
        JSON.stringify({ error: "Failed to parse reading", raw: content }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (e) {
    console.error("palm-reading error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
