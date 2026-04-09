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

    const systemPrompt = `You are a skilled palm reader who speaks in plain, everyday language. No flowery mystical language. No fairy-tale words. Write like you're talking to a friend — direct, warm, real.

ANALYZE the palm image carefully. Look at the actual lines, their depth, curvature, branches, and where they end. Look at finger proportions, hand shape, and any visible markings (stars, crosses, islands, chains, triangles, squares).

${langInstruction}

WRITING STYLE RULES:
- Use simple, everyday words. Say "you're practical" not "you possess an earthen resonance."
- Say "you think before you act" not "your cerebral energies are channeled through cosmic deliberation."
- No words like: cosmic, mystical, ethereal, celestial, sovereign, divine, sacred, transcendent, alchemical, luminous, radiant, realm, vessel, channeling, resonance, vibration, awakening.
- Write like a smart friend explaining what they see in your palm — casual but knowledgeable.
- Keep sentences short. Get to the point.

SOLUTION-BASED APPROACH (CRITICAL):
- Every observation MUST come with practical, actionable advice. Never just name a problem — always decode it and give a real-world solution.
- Never say "today is a bad day" or "avoid doing X." Instead, say "this is a good day to slow down and plan" or "use this energy to reflect before making big moves."
- Frame challenges as opportunities. If someone has a weak fate line, don't say "you lack direction" — say "you're self-made, so set clear goals each week to stay on track."
- We DECODE. We give people the tools to work with what they've got. Every reading should leave them feeling empowered with something concrete they can do.

Return ONLY valid JSON, no markdown, no code fences. The structure must be:

{
  "handType": "Earth Hand" | "Air Hand" | "Water Hand" | "Fire Hand",
  "element": "Earth" | "Air" | "Water" | "Fire",
  "archetype": {
    "name": "THE BUILDER" (or similar — a clear, simple label like THE HEALER, THE THINKER, THE LEADER, THE CREATOR. All caps. No fancy titles.),
    "traits": ["trait1", "trait2", "trait3"] (3 simple character traits — like "loyal", "stubborn", "creative". One word each.),
    "summary": "3-4 plain sentences about what this palm says about who they are. Reference what you actually see — finger length, skin texture, line patterns. Be specific.",
    "shadow": "2 sentences about their blind spot or challenge. Be honest but kind."
  },
  "reading": {
    "overview": "5-7 sentence reading that ties everything together — lines, hand shape, markings — into a clear picture of this person's strengths, challenges, and direction in life. Talk like a real person, not a fantasy character."
  },
  "lines": {
    "heart": { "strength": "strong" | "moderate" | "faint", "description": "2-3 plain sentences about the heart line and what it says about how they love and connect with people." },
    "head": { "strength": "strong" | "moderate" | "faint", "description": "2-3 plain sentences about the head line and how they think and make decisions." },
    "life": { "strength": "strong" | "moderate" | "faint", "description": "2-3 plain sentences about the life line and their energy, resilience, and major life shifts. Never predict death or illness." },
    "fate": { "strength": "strong" | "moderate" | "faint" | "absent", "description": "2-3 plain sentences about the fate line and whether their path feels more self-made or guided by circumstance." },
    "sun": { "strength": "strong" | "moderate" | "faint" | "absent", "description": "2-3 plain sentences about the sun line and their potential for recognition, success, and personal fulfillment." }
  },
  "mounts": {
    "jupiter": { "prominence": "high" | "moderate" | "flat", "meaning": "1-2 plain sentences about ambition and leadership." },
    "saturn": { "prominence": "high" | "moderate" | "flat", "meaning": "1-2 plain sentences about discipline and responsibility." },
    "apollo": { "prominence": "high" | "moderate" | "flat", "meaning": "1-2 plain sentences about creativity and self-expression." },
    "mercury": { "prominence": "high" | "moderate" | "flat", "meaning": "1-2 plain sentences about communication and intuition." },
    "venus": { "prominence": "high" | "moderate" | "flat", "meaning": "1-2 plain sentences about love and passion." },
    "moon": { "prominence": "high" | "moderate" | "flat", "meaning": "1-2 plain sentences about imagination and gut feelings." }
  },
  "markings": [
    { "type": "Star" | "Cross" | "Island" | "Chain" | "Branch" | "Triangle" | "Square" | "Trident" | "Grille" | "Circle", "location": "where on the palm", "meaning": "1-2 plain sentences about what it means" }
  ]
}

RULES:
- Study the ACTUAL image. Reference real observations.
- Be warm and honest — not cold, not over-the-top.
- Never predict death, serious illness, or catastrophe.
- If the image is not a palm or is too blurry, return: {"error": "NOT_A_PALM", "message": "Please provide a clear photo of your palm."}
- This should feel like a legit reading from someone who knows their stuff — not a fortune cookie and not a fantasy novel.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash", // Fast model for quick responses
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analyze this palm. Return JSON.",
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
        temperature: 0.7,
        max_tokens: 2000,
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
