import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function extractJSON(raw: string): Record<string, unknown> {
  const cleaned = raw.replace(/```json|```/g, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    // Graceful fallback — wrap plain prose in the overview field
    return {
      handType: "Unknown",
      element: "Unknown",
      archetype: { name: "Palm Oracle", traits: [], summary: cleaned.slice(0, 200), shadow: "" },
      reading: { overview: cleaned },
      lines: {},
      mounts: {},
      markings: [],
    };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const context = body.context || {};
    const image_base64 = body.image_base64 || null;
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

    if (!GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Server misconfiguration: GEMINI_API_KEY is missing." }),
        { status: 500, headers: corsHeaders },
      );
    }

    const systemPrompt = `You are a master palmist and cosmic decoder. Analyze the palm and return ONLY a valid JSON object — no markdown, no backticks, no explanation outside the JSON. Use this exact structure:
{
  "handType": "Fire|Earth|Air|Water",
  "element": "element name",
  "archetype": {
    "name": "2-3 word archetype title",
    "traits": ["trait1", "trait2", "trait3"],
    "summary": "2-3 sentence personality and destiny summary",
    "shadow": "One sentence about their core challenge or shadow side"
  },
  "reading": {
    "overview": "3-4 sentence holistic reading combining all elements observed"
  },
  "lines": {
    "heart": { "strength": "strong|moderate|faint", "description": "2 sentence reading of this line" },
    "head": { "strength": "strong|moderate|faint", "description": "2 sentence reading of this line" },
    "life": { "strength": "strong|moderate|faint", "description": "2 sentence reading of this line" },
    "fate": { "strength": "strong|moderate|faint|absent", "description": "2 sentence reading of this line" }
  },
  "mounts": {
    "jupiter": { "prominence": "raised|flat|overdeveloped", "meaning": "1 sentence interpretation" },
    "saturn": { "prominence": "raised|flat|overdeveloped", "meaning": "1 sentence interpretation" },
    "apollo": { "prominence": "raised|flat|overdeveloped", "meaning": "1 sentence interpretation" },
    "mercury": { "prominence": "raised|flat|overdeveloped", "meaning": "1 sentence interpretation" },
    "venus": { "prominence": "raised|flat|overdeveloped", "meaning": "1 sentence interpretation" },
    "moon": { "prominence": "raised|flat|overdeveloped", "meaning": "1 sentence interpretation" }
  },
  "markings": [
    { "type": "marking type", "location": "location on palm", "meaning": "what this marking signifies" }
  ]
}
If no special markings are visible, return an empty array for markings.`;

    const userPromptText = image_base64
      ? `Carefully examine this palm image. Identify the hand type, major lines, mounts, and any special markings. Return only the JSON object.${Object.keys(context).length > 0 ? ` Context: ${JSON.stringify(context)}` : ""}`
      : `Provide a palm reading based on this context: ${JSON.stringify(context)}. Return only the JSON object.`;

    const userParts: unknown[] = [{ text: userPromptText }];
    if (image_base64) {
      userParts.unshift({
        inlineData: {
          mimeType: "image/jpeg",
          data: image_base64,
        },
      });
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    const requestBody = {
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: "user", parts: userParts }],
      generationConfig: {
        temperature: 0.75,
        maxOutputTokens: 1500,
      },
    };

    let response;
    try {
      response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
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
          JSON.stringify({ error: "The reading timed out. Please try again with better lighting." }),
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
        JSON.stringify({ error: `AI request failed: ${errorText}` }),
        { status: 500, headers: corsHeaders },
      );
    }

    const data = await response.json();
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";

    if (!raw) {
      return new Response(
        JSON.stringify({ error: "No reading was returned. Please try again." }),
        { status: 500, headers: corsHeaders },
      );
    }

    const parsed = extractJSON(raw);

    return new Response(JSON.stringify(parsed), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message || "Unexpected server error." }),
      { status: 500, headers: corsHeaders },
    );
  }
});
