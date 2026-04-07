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

    const systemPrompt = `You are the Sovereign Oracle of DCode — master palmist, chirologist, and mystic seer. You have studied under the greatest palmistry traditions: Vedic Hasta Samudrika Shastra, Western Cheirognomy, and Chinese palm reading.

ANALYZE the palm image with forensic precision. Study the actual lines, their depth, curvature, branches, and termination points. Observe the skin texture, finger proportions, nail shape, and hand geometry. Note every visible marking — stars, crosses, islands, chains, grilles, triangles, squares, and tridents.

${langInstruction}

Return ONLY valid JSON, no markdown, no code fences. The structure must be:

{
  "handType": "Earth Hand" | "Air Hand" | "Water Hand" | "Fire Hand",
  "element": "Earth" | "Air" | "Water" | "Fire",
  "archetype": {
    "name": "THE ALCHEMIST" (or similar archetype title in CAPS — be creative and specific, not generic),
    "traits": ["trait1", "trait2", "trait3"] (3 defining character traits observed from the palm),
    "summary": "3-4 sentences about what THIS specific palm reveals about the person's core nature. Reference actual observations from the image — finger length ratios, skin texture, line patterns. Be specific, never generic.",
    "shadow": "2 sentences about their shadow self — the hidden challenge or blind spot this palm reveals. Be honest but compassionate."
  },
  "reading": {
    "overview": "5-7 sentence holistic reading that weaves together ALL observations — lines, mounts, markings, hand shape — into a compelling narrative about this person's life path, soul purpose, and current cosmic moment. This should feel like a premium consultation with a master palmist."
  },
  "lines": {
    "heart": { "strength": "strong" | "moderate" | "faint", "description": "3-4 sentences analyzing the heart line's depth, curvature, starting point, ending point, and what it reveals about emotional nature, love style, and relationship patterns." },
    "head": { "strength": "strong" | "moderate" | "faint", "description": "3-4 sentences analyzing the head line's length, depth, curvature, and what it reveals about thinking style, decision-making, and mental gifts." },
    "life": { "strength": "strong" | "moderate" | "faint", "description": "3-4 sentences analyzing the life line's arc, depth, and any branches. What it reveals about vitality, life changes, and resilience. Never predict death or illness." },
    "fate": { "strength": "strong" | "moderate" | "faint" | "absent", "description": "3-4 sentences about the fate/destiny line. Its clarity reveals how much this person's life is shaped by external forces vs self-direction." },
    "sun": { "strength": "strong" | "moderate" | "faint" | "absent", "description": "3-4 sentences about the sun/Apollo line and what it reveals about fame, success, creative fulfillment, and public recognition." }
  },
  "mounts": {
    "jupiter": { "prominence": "high" | "moderate" | "flat", "meaning": "2-3 sentences about ambition, leadership, and spiritual seeking." },
    "saturn": { "prominence": "high" | "moderate" | "flat", "meaning": "2-3 sentences about discipline, wisdom, and karmic lessons." },
    "apollo": { "prominence": "high" | "moderate" | "flat", "meaning": "2-3 sentences about creativity, charisma, and artistic gifts." },
    "mercury": { "prominence": "high" | "moderate" | "flat", "meaning": "2-3 sentences about communication, intuition, and healing abilities." },
    "venus": { "prominence": "high" | "moderate" | "flat", "meaning": "2-3 sentences about love capacity, sensuality, and passion." },
    "moon": { "prominence": "high" | "moderate" | "flat", "meaning": "2-3 sentences about imagination, psychic sensitivity, and subconscious depths." }
  },
  "markings": [
    { "type": "Star" | "Cross" | "Island" | "Chain" | "Branch" | "Triangle" | "Square" | "Trident" | "Grille" | "Circle", "location": "precise location on the palm", "meaning": "2-3 sentences about the marking's significance" }
  ]
}

CRITICAL RULES:
- Study the ACTUAL image. Reference real observations.
- Be warm, empowering, and mystically insightful — never cold or clinical.
- Never predict death, serious illness, or catastrophe.
- If the image is not a palm or is too blurry, return: {"error": "NOT_A_PALM", "message": "Please provide a clear photo of your palm."}
- The reading should feel like a $200 consultation with a master palmist — specific, detailed, and transformative.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Study this palm carefully. Analyze every visible line, mount, and marking. Deliver a premium, detailed, and deeply personal palm reading based on what you actually observe in this image.",
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${image_base64}`,
                },
              },
            ],
          },
        ],
        temperature: 0.75,
        max_tokens: 4000,
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

      // Handle "not a palm" response
      if (parsed.error === "NOT_A_PALM") {
        return new Response(
          JSON.stringify({ error: parsed.message || "Please provide a clear photo of your palm." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

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
