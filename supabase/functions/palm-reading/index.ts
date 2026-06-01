import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
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
    const image_base64 = body.image_base64 || null;
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
    const userPromptText = image_base64
      ? `Carefully examine this palm image and provide a detailed palm reading. Analyze the major lines (heart, head, life, fate), the mounts, finger shapes, and any notable markings. Offer specific insights about love, career, health, and personality. Context about this person: ${JSON.stringify(context)}.`
      : `Please provide a palm reading based on the following context: ${JSON.stringify(context)}. Offer insights about love, career, health, and any unique markings.`;

    // Build the user parts — include image if provided
    const userParts: unknown[] = [{ text: userPromptText }];
    if (image_base64) {
      userParts.unshift({
        inlineData: {
          mimeType: "image/jpeg",
          data: image_base64,
        },
      });
    }

    // Configure AbortController for an 8-second timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const requestBody = {
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: [
        { role: "user", parts: userParts },
      ],
      generationConfig: {
        temperature: 0.8,
        maxOutputTokens: 800,
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
