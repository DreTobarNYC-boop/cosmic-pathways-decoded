import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const TONE_RULES = `
WRITING STYLE (MANDATORY):
- Use plain, everyday language. Talk like a smart friend — direct, warm, real.
- NO flowery or fantasy words. Banned words: cosmic, mystical, ethereal, celestial, sovereign, divine, sacred, transcendent, alchemical, luminous, radiant, realm, vessel, channeling, resonance, vibration, awakening, veil, oracle, transmute, alchemy, tapestry, weave, unfurl, beckon.
- Keep sentences short. Get to the point.
- Say "you're good at reading people" NOT "your psychic antenna resonates with the collective consciousness."
- Say "today is a good day to plan ahead" NOT "the cosmic winds whisper of preparation."

SOLUTION-BASED APPROACH (CRITICAL):
- Every observation MUST include practical, actionable advice. Never just name a problem — always give a real-world solution.
- NEVER say "today is a bad day" or "avoid doing X." Frame everything constructively.
- If it's a challenging day, say what to DO with that energy: "This is a great day to pause and reflect before making big moves" NOT "beware of hasty decisions."
- Frame challenges as opportunities with specific actions.
- Every reading should leave the person with something concrete they can actually do TODAY.
- We DECODE — we give people tools to work with what they've got.`;

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
      systemPrompt = `You are a knowledgeable astrologer who gives practical, personalized daily readings.
${TONE_RULES}
Write in second person ("you"). No greeting, no sign-off — just the reading.
Aim for 4-6 sentences. Always end with a specific thing they can do today.
${langInstruction}`;

      const cuspLine = context.cuspInfo ? `\n- Cusp Placement: ${context.cuspInfo} — blend both signs' traits into the reading` : "";

      userPrompt = `Generate today's horoscope for ${context.name}:
- Sun Sign: ${context.zodiacSign} (${context.element} element)${cuspLine}
- Life Path Number: ${context.lifePath}
- Chinese Zodiac: ${context.chineseZodiac}
- Birth Place: ${context.birthPlace || "Unknown"}
- Birth Time: ${context.birthTime || "Unknown"}
- Date: ${context.date}
- Universal Day Number: ${context.universalDay}
- Personal Day Number: ${context.personalDay}

Give a personal, practical daily reading that connects their astrology and numerology. End with a specific action or mindset shift for today.${context.cuspInfo ? " Since they're on a cusp, blend both signs throughout." : ""}`;

    } else if (reading_type === "stars_today") {
      systemPrompt = `You are a knowledgeable astrologer who gives practical, personalized readings in plain language.
${TONE_RULES}
You MUST respond with valid JSON only. No markdown, no code fences, just raw JSON.
${langInstruction}`;

      const cuspLine = context.cuspInfo ? `\n- Cusp Placement: ${context.cuspInfo}` : "";

      userPrompt = `Generate a detailed daily astrological reading for ${context.name}.

Profile:
- Sun Sign: ${context.zodiacSign} (${context.element} element)${cuspLine}
- Life Path Number: ${context.lifePath}
- Chinese Zodiac: ${context.chineseZodiac}
- Date of Birth: ${context.dateOfBirth || "Unknown"}
- Current Date: ${context.date}
- Birth Place: ${context.birthPlace || "Unknown"}
- Birth Time: ${context.birthTime || "Unknown"}
- Universal Day Number: ${context.universalDay}
- Personal Day Number: ${context.personalDay}

Respond with ONLY this JSON structure (no markdown):
{
  "title": "A clear 2-4 word theme for today",
  "subtitle": "${context.zodiacSign}${context.cuspInfo ? ` (${context.cuspInfo})` : ""} · Dominant energy today",
  "reading": "A detailed 3-4 paragraph reading that's practical and solution-based. Tell them what today's energy is good for and give specific actions they can take. Plain language, no flowery words.${context.cuspInfo ? " Blend both cusp signs throughout." : ""}",
  "cosmicAdvice": "One clear, powerful sentence of practical advice for today.",
  "luckyNumber": a single number 1-33,
  "powerColor": "A specific color name like Sage Green or Deep Navy",
  "affirmation": "A grounded first-person affirmation — practical, not fluffy."
}`;

    } else if (reading_type.startsWith("stars_")) {
      const tabType = reading_type.replace("stars_", "");
      const tabLabels: Record<string, string> = {
        monthly: "monthly forecast",
        yearly: `${new Date().getFullYear()} yearly overview`,
        love: "love and relationships reading",
        career: "career and purpose reading",
        birth_chart: "birth chart analysis",
      };
      const label = tabLabels[tabType] || `${tabType} reading`;

      systemPrompt = `You are a knowledgeable astrologer who gives practical, personalized readings in plain language.
${TONE_RULES}
You MUST respond with valid JSON only. No markdown, no code fences, just raw JSON.
${langInstruction}`;

      const cuspLine = context.cuspInfo ? `\n- Cusp Placement: ${context.cuspInfo}` : "";

      userPrompt = `Generate a detailed ${label} for ${context.name}.

Profile:
- Sun Sign: ${context.zodiacSign} (${context.element} element)${cuspLine}
- Life Path Number: ${context.lifePath}
- Chinese Zodiac: ${context.chineseZodiac}
- Date of Birth: ${context.dateOfBirth || "Unknown"}
- Current Date: ${context.date}
- Birth Place: ${context.birthPlace || "Unknown"}
- Birth Time: ${context.birthTime || "Unknown"}

Respond with ONLY this JSON structure (no markdown):
{
  "title": "A clear 2-4 word title",
  "subtitle": "A brief context line",
  "reading": "A detailed 3-4 paragraph ${label}. Be practical and solution-based. Give specific actions and advice. Plain language.${context.cuspInfo ? " Blend both cusp signs throughout." : ""}",
  "cosmicAdvice": "One clear sentence of practical advice."
}`;

    } else if (reading_type === "numbers_today") {
      systemPrompt = `You are a skilled numerologist who explains number meanings in plain, practical language.
${TONE_RULES}
Write in second person. No greeting, no sign-off. 3-5 sentences. End with a specific action for today.
${langInstruction}`;

      userPrompt = `Generate today's numerology reading for ${context.name}.
- Life Path: ${context.lifePath} (${context.lifePathName})
- Personal Day: ${context.personalDay}
- Universal Day: ${context.universalDay}
- Personal Month: ${context.personalMonth}
- Personal Year: ${context.personalYear}
- Sun Sign: ${context.zodiacSign}
- Birth Place: ${context.birthPlace || "Unknown"}
- Birth Time: ${context.birthTime || "Unknown"}
- Date: ${context.date}

Tell them what today's numbers mean in plain terms and give them one specific thing to focus on or do today.`;

    } else if (reading_type === "numbers_life_path") {
      systemPrompt = `You are a skilled numerologist who explains life path numbers in plain, practical language.
${TONE_RULES}
Write in second person. No greeting, no sign-off. 2-3 paragraphs.
${langInstruction}`;

      userPrompt = `Generate a Life Path reading for ${context.name}.
- Life Path: ${context.lifePath} (${context.lifePathName})
- Expression Number: ${context.expressionNum}
- Soul Urge: ${context.soulUrgeNum}
- Personality: ${context.personalityNum}
- Sun Sign: ${context.zodiacSign} (${context.element})
- Chinese Zodiac: ${context.chineseZodiac}
- Birth Place: ${context.birthPlace || "Unknown"}
- Birth Time: ${context.birthTime || "Unknown"}

Explain what Life Path ${context.lifePath} means in practical terms — their natural strengths, what they're built for, their main challenge, and how to work with it. Include specific, actionable advice.`;

    } else if (reading_type === "frequency_reading") {
      systemPrompt = `You are a consciousness coach who uses the Hawkins scale to give practical self-development advice.
${TONE_RULES}
You MUST respond with valid JSON only. No markdown, no code fences, just raw JSON.
${langInstruction}`;

      const answersDetail = context.answers ? JSON.stringify(context.answers) : "[]";

      userPrompt = `Generate a consciousness frequency reading for ${context.name}.

Their profile:
- Birth Place: ${context.birthPlace || "Unknown"}
- Birth Time: ${context.birthTime || "Unknown"}
- Date of Birth: ${context.dateOfBirth || "Unknown"}

Their quiz results:
- Consciousness Level: ${context.level} (${context.emotion})
- Calibration: ${context.calibration}
- Total Score: ${context.totalScore}/50
- Category Scores: ${answersDetail}
- Next Level: ${context.nextLevel} (${context.pointsToNext} points away)

Respond with ONLY this JSON structure (no markdown):
{
  "reading": "A practical 1-2 paragraph explanation of where they are on the Hawkins scale. Reference their specific score and what it means in everyday terms. Give them a specific daily practice or mindset shift to raise their level. Use 'you' voice. Plain language.",
  "shadow": "A short paragraph about the main trap or risk at the ${context.level} level — what could hold them back. Include a practical way to avoid it.",
  "gift": "A short paragraph about the strength of being at ${context.level} — what they naturally bring to the table and how to use it more."
}`;

    } else if (reading_type === "oracle_daily") {
      systemPrompt = `You are a wise guide who gives practical daily advice based on someone's profile.
${TONE_RULES}
Write in second person. No greeting, no sign-off. 4-6 sentences. End with a clear action step.
${langInstruction}`;

      userPrompt = `Generate today's guidance for ${context.name}.
- Sun Sign: ${context.zodiacSign} (${context.element})
- Life Path: ${context.lifePath}
- Chinese Zodiac: ${context.chineseZodiac}
- Birth Place: ${context.birthPlace || "Unknown"}
- Birth Time: ${context.birthTime || "Unknown"}
- Universal Day: ${context.universalDay}
- Personal Day: ${context.personalDay}
- Date: ${context.date}

Give them a practical, personal message about today. What's the energy like, what should they focus on, and what's one specific thing they can do to make the most of it.`;

    } else if (reading_type === "oracle_chat") {
      systemPrompt = `You are a wise guide with deep knowledge of astrology, numerology, and Chinese zodiac. You give practical, solution-based answers.
${TONE_RULES}

The person you're talking to:
- Name: ${context.name}
- Sun Sign: ${context.zodiacSign} (${context.element})
- Life Path: ${context.lifePath}
- Chinese Zodiac: ${context.chineseZodiac}
- Birth Place: ${context.birthPlace}
- Birth Time: ${context.birthTime}

Use their profile when relevant. Speak in second person. Keep responses to 2-4 paragraphs. No greeting formulas. Always give practical advice — never leave them with just a problem.
${langInstruction}`;

      userPrompt = context.conversationHistory
        ? `Previous conversation:\n${context.conversationHistory}\n\nThey now ask: ${context.userMessage}`
        : context.userMessage;

    } else if (reading_type === "dynasty_profile") {
      systemPrompt = `You are a knowledgeable Chinese astrology reader who explains things in plain, practical language.
${TONE_RULES}
Write in second person. No greeting, no sign-off. 2-3 paragraphs.
${langInstruction}`;

      userPrompt = `Generate a Chinese zodiac profile reading for ${context.name}.
- Animal: ${context.animal}
- Year Element: ${context.yearElement}
- Fixed Element: ${context.fixedElement}
- Yin/Yang: ${context.yinYang}
- Core Traits: ${context.traits}
- Western Sun Sign: ${context.zodiacSign}
- Life Path: ${context.lifePath}
- Birth Place: ${context.birthPlace || "Unknown"}
- Birth Time: ${context.birthTime || "Unknown"}

Explain how the ${context.animal} and ${context.yearElement} element shape their personality and strengths in practical terms. Include how their Western sign (${context.zodiacSign}) adds to the picture. Give actionable advice on how to use these strengths.`;

    } else if (reading_type === "dynasty_year") {
      systemPrompt = `You are a knowledgeable Chinese astrology reader who gives practical yearly forecasts.
${TONE_RULES}
Write 2-3 paragraphs, second person, no greeting. Always solution-based.
${langInstruction}`;

      userPrompt = `Generate a ${context.currentYear} forecast for ${context.name}, a ${context.yearElement} ${context.animal}.
- Birth Place: ${context.birthPlace || "Unknown"}
- Birth Time: ${context.birthTime || "Unknown"}
What does ${context.currentYear} look like for the ${context.animal}? Give practical advice on what to focus on and how to handle any challenges.`;

    } else if (reading_type === "dynasty_forecast") {
      systemPrompt = `You are a knowledgeable Chinese astrology reader who gives practical multi-year forecasts.
${TONE_RULES}
You MUST respond with valid JSON only. No markdown, no code fences, just raw JSON.
${langInstruction}`;

      userPrompt = `Generate a 5-year forecast (${context.startYear} to ${context.startYear + 4}) for ${context.name}, a ${context.yearElement} ${context.animal}. Birth Place: ${context.birthPlace || "Unknown"}. Birth Time: ${context.birthTime || "Unknown"}.

Respond with ONLY this JSON structure (no markdown):
{
  "years": [
    { "year": ${context.startYear}, "title": "2-4 word theme", "rating": 1-5, "summary": "3-4 sentences — practical forecast with specific advice for this year" },
    { "year": ${context.startYear + 1}, "title": "2-4 word theme", "rating": 1-5, "summary": "3-4 sentences — practical forecast with advice" },
    { "year": ${context.startYear + 2}, "title": "2-4 word theme", "rating": 1-5, "summary": "3-4 sentences — practical forecast with advice" },
    { "year": ${context.startYear + 3}, "title": "2-4 word theme", "rating": 1-5, "summary": "3-4 sentences — practical forecast with advice" },
    { "year": ${context.startYear + 4}, "title": "2-4 word theme", "rating": 1-5, "summary": "3-4 sentences — practical forecast with advice" }
  ]
}`;

    } else if (reading_type === "maps_decode") {
      systemPrompt = `You are a numerology expert who explains the energy of places in practical terms.
${TONE_RULES}
Write in second person. 3-4 sentences.
${langInstruction}`;

      userPrompt = `Decode the numerological energy of "${context.locationName}" (number ${context.locationNumber}: ${context.meaning}) for ${context.name}. Birth Place: ${context.birthPlace || "Unknown"}. Birth Time: ${context.birthTime || "Unknown"}. Date of Birth: ${context.dateOfBirth || "Unknown"}. What does this place's energy mean for them practically? Is it good for work, rest, creativity, relationships? Give specific advice.`;

    } else if (reading_type === "maps_address") {
      systemPrompt = `You are a numerology expert who explains address energy in practical terms.
${TONE_RULES}
Write in second person. 3-4 sentences.
${langInstruction}`;

      userPrompt = `Decode the numerological energy of address "${context.address}" (number ${context.addressNumber}: ${context.meaning}) for ${context.name}. Birth Place: ${context.birthPlace || "Unknown"}. Birth Time: ${context.birthTime || "Unknown"}. Date of Birth: ${context.dateOfBirth || "Unknown"}. How does this number affect their living space? Give practical tips on how to make the most of it.`;

    } else if (reading_type === "sacred_code") {
      systemPrompt = `You are an expert in Grabovoi healing codes and number sequences. You explain them in plain, practical language.
${TONE_RULES}
You MUST respond with valid JSON only. No markdown, no code fences, just raw JSON.
${langInstruction}`;

      userPrompt = `The person ${context.name} wants a Grabovoi code for this intention: "${context.intention}".
Birth Place: ${context.birthPlace || "Unknown"}. Birth Time: ${context.birthTime || "Unknown"}. Date of Birth: ${context.dateOfBirth || "Unknown"}.

Find the best Grabovoi number sequence for this intention. Use a well-known code if one exists, otherwise find one that fits.

Respond with ONLY this JSON structure (no markdown):
{
  "title": "A clear 2-5 word name for this code",
  "code": "The Grabovoi number sequence (digits only, 6-12 digits)",
  "description": "2-3 plain sentences explaining what this code does and why it works. No flowery language.",
  "ritual": "A specific 1-2 sentence instruction for how to use this code in practice."
}`;

    } else {
      systemPrompt = `You are a knowledgeable guide providing personalized readings. Be practical and solution-based. ${TONE_RULES} ${langInstruction}`;
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
      data.choices?.[0]?.message?.content || "Readings are temporarily unavailable. Try again shortly.";

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
