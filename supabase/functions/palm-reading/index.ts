import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Attempt to repair truncated JSON by closing open structures
function repairJSON(json: string): string {
  let result = json.trim();
  let inString = false;
  let escaped = false;
  const stack: string[] = [];

  for (let i = 0; i < result.length; i++) {
    const c = result[i];
    if (escaped) { escaped = false; continue; }
    if (c === "\\" && inString) { escaped = true; continue; }
    if (c === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (c === "{" || c === "[") stack.push(c === "{" ? "}" : "]");
    else if (c === "}" || c === "]") stack.pop();
  }

  // Close any mid-string truncation
  if (inString) result += '"';
  // Remove trailing incomplete key-value (dangling comma)
  result = result.replace(/,\s*$/, "");
  // Close all open structures in reverse
  while (stack.length > 0) result += stack.pop();

  return result;
}

function extractJSON(raw: string): Record<string, unknown> {
  const cleaned = raw.replace(/```json\s*/g, "").replace(/```/g, "").trim();

  // 1. Try parsing as-is
  try { return JSON.parse(cleaned); } catch { /* continue */ }

  // 2. Try repairing truncated JSON
  try {
    const repaired = repairJSON(cleaned);
    const parsed = JSON.parse(repaired);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed) && Object.keys(parsed).length > 2) {
      return parsed as Record<string, unknown>;
    }
  } catch { /* continue */ }

  // 3. Clean fallback — never show raw JSON to the user
  return {
    handType: "Unknown",
    element: "Unknown",
    archetype: {
      name: "Palm Oracle",
      traits: [],
      summary: "Your reading was received. Please scan your palm again for the full cosmic reading.",
      shadow: "",
      hiddenGift: "",
    },
    overallReading: {
      lifeTheme: "",
      currentChapter: "",
      cosmicMessage: "Please scan your palm again — the Oracle has more to reveal.",
    },
    lines: {},
    mounts: {},
    fingers: {},
    love: {},
    career: {},
    health: {},
    timeline: {},
    markings: [],
    closingMessage: "Scan your palm again to receive your complete cosmic reading.",
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const context = body.context || {};
    const image_base64 = body.image_base64 || null;
    const language = body.language || "en";
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    const GEMINI_MODEL = Deno.env.get("GEMINI_MODEL") ?? "gemini-2.5-flash";

    const langEnforcement = language.startsWith("es")
      ? "CRITICAL: Escribe TODA tu respuesta en ESPAÑOL. Cada valor de texto en el JSON debe estar en español. NO uses inglés."
      : language.startsWith("pt")
      ? "CRITICAL: Escreva TODA a sua resposta em PORTUGUÊS BRASILEIRO. Cada valor de texto no JSON deve estar em português. NÃO use inglês."
      : "Write your entire response in English.";

    if (!GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Server misconfiguration: GEMINI_API_KEY is missing." }),
        { status: 500, headers: corsHeaders },
      );
    }

    const systemPrompt = `You are a master palmist. Analyze this palm and return ONLY a valid JSON object — no markdown, no backticks, nothing outside the JSON. Be warm, specific, and personal. Every field must feel written for this exact person.

${langEnforcement}

IMPORTANT: Keep every text field to 1-2 sentences maximum. Be vivid and precise, not verbose.

{
  "handType": "Fire|Earth|Air|Water",
  "element": "element name",
  "archetype": {
    "name": "2–3 word title (e.g. 'The Visionary Flame')",
    "traits": ["trait1", "trait2", "trait3", "trait4"],
    "summary": "2 sentences — who they are at their core, spoken directly to them.",
    "shadow": "1 sentence — their core challenge, compassionate tone.",
    "hiddenGift": "1 sentence — a power they may not fully see in themselves."
  },
  "overallReading": {
    "lifeTheme": "1-2 sentences on the central theme of their life as written in the hand.",
    "currentChapter": "1-2 sentences on what is actively unfolding right now.",
    "cosmicMessage": "1-2 sentences — the single most important message their hand delivers today."
  },
  "lines": {
    "heart": {
      "strength": "strong|moderate|faint",
      "length": "long|medium|short",
      "curve": "deeply curved|gently curved|straight",
      "description": "2 sentences on their emotional world and how they love.",
      "loveStyle": "1 sentence on their emotional signature in relationships."
    },
    "head": {
      "strength": "strong|moderate|faint",
      "length": "long|medium|short",
      "slope": "straight|gently sloping|deeply sloping",
      "description": "2 sentences on their mind and thinking style.",
      "thinkingStyle": "1 sentence on how their mind works best."
    },
    "life": {
      "strength": "strong|moderate|faint",
      "length": "long|medium|short",
      "description": "2 sentences on their vitality and life energy.",
      "vitalityMessage": "1 sentence on what energizes or depletes them."
    },
    "fate": {
      "strength": "strong|moderate|faint|absent",
      "description": "2 sentences on their life path and calling.",
      "careerMessage": "1 sentence on the career energy written in the line."
    },
    "sun": {
      "present": true,
      "description": "1-2 sentences on success potential and public presence."
    },
    "mercury": {
      "present": true,
      "description": "1-2 sentences on communication gifts and intuition."
    }
  },
  "mounts": {
    "jupiter": { "prominence": "dominant|present|flat|overdeveloped", "meaning": "1 sentence." },
    "saturn": { "prominence": "dominant|present|flat|overdeveloped", "meaning": "1 sentence." },
    "apollo": { "prominence": "dominant|present|flat|overdeveloped", "meaning": "1 sentence." },
    "mercury": { "prominence": "dominant|present|flat|overdeveloped", "meaning": "1 sentence." },
    "venus": { "prominence": "dominant|present|flat|overdeveloped", "meaning": "1 sentence." },
    "moon": { "prominence": "dominant|present|flat|overdeveloped", "meaning": "1 sentence." },
    "upperMars": { "prominence": "dominant|present|flat|overdeveloped", "meaning": "1 sentence." },
    "lowerMars": { "prominence": "dominant|present|flat|overdeveloped", "meaning": "1 sentence." }
  },
  "fingers": {
    "thumb": { "flexibility": "flexible|moderate|stiff", "length": "long|average|short", "reading": "1 sentence on willpower and approach to challenges." },
    "index": { "length": "long|average|short", "reading": "1 sentence on ambition." },
    "middle": { "length": "long|average|short", "reading": "1 sentence on responsibility." },
    "ring": { "length": "long|average|short", "reading": "1 sentence on creativity." },
    "pinky": { "length": "long|average|short", "reading": "1 sentence on communication." }
  },
  "love": {
    "relationshipStyle": "1-2 sentences on how they love.",
    "soulMateQualities": "1 sentence on what they need in a partner.",
    "currentLoveEnergy": "1 sentence on their current romantic energy.",
    "advice": "1 sentence of love guidance."
  },
  "career": {
    "naturalTalents": "1-2 sentences on what they are naturally brilliant at.",
    "successPotential": "1 sentence on success capacity from the lines.",
    "timing": "1 sentence on career timing or upcoming shifts.",
    "advice": "1 sentence of career guidance."
  },
  "health": {
    "vitalityLevel": "high|moderate|sensitive",
    "strengths": "1 sentence on physical vitality.",
    "areasToNurture": "1 sentence on what to watch, gentle tone.",
    "advice": "1 sentence of wellness guidance."
  },
  "timeline": {
    "past": "1-2 sentences on formative patterns from earlier line sections.",
    "present": "1-2 sentences on where they stand right now.",
    "future": "1-2 sentences on the path ahead — hopeful and empowering."
  },
  "markings": [
    { "type": "star|cross|square|triangle|island|chain|grille|branch|fork|tassle", "location": "location", "meaning": "1 sentence", "significance": "major|minor" }
  ],
  "closingMessage": "3 sentences spoken directly to their soul — reference something specific you saw in their hand. This is the moment they screenshot and share."
}

Return empty array [] for markings if none visible. sun and mercury lines present:true unless genuinely absent.

REMEMBER: ${langEnforcement}`;

    const userPromptText = image_base64
      ? `Study every detail of this palm — the lines, mounts, finger proportions, thumb shape, and any markings. Deliver the full professional reading in the exact JSON structure specified.${Object.keys(context).length > 0 ? ` Seeker context: ${JSON.stringify(context)}` : ""}`
      : `Deliver a full professional palm reading based on this context: ${JSON.stringify(context)}. Use the exact JSON structure specified.`;

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
    const timeoutId = setTimeout(() => controller.abort(), 45000);

    const requestBody = {
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: "user", parts: userParts }],
      generationConfig: {
        temperature: 0.8,
        maxOutputTokens: 4000,
      },
    };

    let response;
    try {
      response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
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
