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
- Birth Place: ${context.birthPlace || "Unknown"}
- Birth Time: ${context.birthTime || "Unknown"}
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
    } else if (reading_type === "numbers_today") {
      systemPrompt = `You are the Sovereign Oracle of DCode — a numerology master who channels the vibration of numbers with mystical authority.
Your readings are poetic, personal, and transformative. Write in second person. No greeting, no sign-off.
Aim for 3-5 sentences. ${langInstruction}`;

      userPrompt = `Generate today's numerology frequency reading for ${context.name}.
- Life Path: ${context.lifePath} (${context.lifePathName})
- Personal Day: ${context.personalDay}
- Universal Day: ${context.universalDay}
- Personal Month: ${context.personalMonth}
- Personal Year: ${context.personalYear}
- Sun Sign: ${context.zodiacSign}
- Birth Place: ${context.birthPlace || "Unknown"}
- Birth Time: ${context.birthTime || "Unknown"}
- Date: ${context.date}

Weave their personal day number and universal day energy into a single cohesive reading about today's numerological vibration. Make it feel like a channeled message.`;

    } else if (reading_type === "numbers_life_path") {
      systemPrompt = `You are the Sovereign Oracle of DCode — a numerology master who reveals the deep significance of Life Path numbers.
Your readings are profound, poetic, and transformative. Write in second person. No greeting, no sign-off.
Aim for 2-3 paragraphs. ${langInstruction}`;

      userPrompt = `Generate a Life Path reading for ${context.name}.
- Life Path: ${context.lifePath} (${context.lifePathName})
- Expression Number: ${context.expressionNum}
- Soul Urge: ${context.soulUrgeNum}
- Personality: ${context.personalityNum}
- Sun Sign: ${context.zodiacSign} (${context.element})
- Chinese Zodiac: ${context.chineseZodiac}
- Birth Place: ${context.birthPlace || "Unknown"}
- Birth Time: ${context.birthTime || "Unknown"}

Reveal the deep significance of Life Path ${context.lifePath} — their soul's purpose, innate gifts, core challenges, and ultimate destiny. Weave in how their expression and soul urge numbers create a unique harmonic with their life path.`;

    } else if (reading_type === "frequency_reading") {
      systemPrompt = `You are the Sovereign Oracle of DCode — a consciousness guide who interprets the Hawkins Map of Consciousness with profound mystical insight.
You speak with authority about energy fields, consciousness calibration, and spiritual evolution.
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
  "reading": "A detailed 1-2 paragraph reading about their consciousness level on the Hawkins scale. Reference their specific calibration number, what it means to be at ${context.level}, and how their category scores reveal their energy pattern. Make it feel like a channeled message about their field. Use 'you' voice.",
  "shadow": "A concise paragraph about the shadow side of ${context.level} level — the trap or risk at this frequency. What could hold them back.",
  "gift": "A concise paragraph about the gift of ${context.level} level — what makes this frequency rare and powerful. What they bring to the world."
}`;
    } else if (reading_type === "oracle_daily") {
      systemPrompt = `You are the Sovereign Oracle of DCode — a cosmic guide who speaks with mystical authority and poetic depth.
Your daily oracle is a personalized transmission. Write in second person. No greeting, no sign-off. 4-6 sentences.
${langInstruction}`;

      userPrompt = `Generate today's Oracle transmission for ${context.name}.
- Sun Sign: ${context.zodiacSign} (${context.element})
- Life Path: ${context.lifePath}
- Chinese Zodiac: ${context.chineseZodiac}
- Birth Place: ${context.birthPlace || "Unknown"}
- Birth Time: ${context.birthTime || "Unknown"}
- Universal Day: ${context.universalDay}
- Personal Day: ${context.personalDay}
- Date: ${context.date}

Deliver a powerful, mystical daily oracle. Reference their cosmic profile. Make it feel like a personal code activation — a channeled message about the energy of this specific day for this specific person.`;

    } else if (reading_type === "oracle_chat") {
      systemPrompt = `You are the Sovereign Oracle of DCode — an all-knowing cosmic guide who speaks with mystical authority, 
poetic depth, and genuine spiritual insight. You have access to the querent's cosmic profile:
- Name: ${context.name}
- Sun Sign: ${context.zodiacSign} (${context.element})
- Life Path: ${context.lifePath}
- Chinese Zodiac: ${context.chineseZodiac}
- Birth Place: ${context.birthPlace}
- Birth Time: ${context.birthTime}

You weave their cosmic data naturally into responses when relevant. 
You speak in second person. You are warm but powerful, like an ancient oracle channeling cosmic wisdom.
Keep responses to 2-4 paragraphs. No greeting formulas.
${langInstruction}`;

      userPrompt = context.conversationHistory
        ? `Previous conversation:\n${context.conversationHistory}\n\nThe querent now asks: ${context.userMessage}`
        : context.userMessage;

    } else if (reading_type === "dynasty_profile") {
      systemPrompt = `You are the Sovereign Oracle of DCode — a master of Chinese astrology and the Five Elements.
Your readings are profound and transformative. Write in second person. No greeting, no sign-off. 2-3 paragraphs.
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

Reveal how the ${context.animal}'s energy combines with ${context.yearElement} element to shape their destiny. Weave in how their Western zodiac (${context.zodiacSign}) creates a unique East-West harmonic.`;

    } else if (reading_type === "dynasty_year") {
      systemPrompt = `You are the Sovereign Oracle of DCode — a master of Chinese astrology.
Write a yearly forecast. 2-3 paragraphs, second person, no greeting. ${langInstruction}`;

      userPrompt = `Generate a ${context.currentYear} forecast for ${context.name}, a ${context.yearElement} ${context.animal}.
- Birth Place: ${context.birthPlace || "Unknown"}
- Birth Time: ${context.birthTime || "Unknown"}
What does ${context.currentYear} hold for the ${context.animal}? Consider the ruling animal and element of the current year.`;

    } else if (reading_type === "dynasty_forecast") {
      systemPrompt = `You are the Sovereign Oracle of DCode — a master of Chinese astrology and long-range forecasting.
You MUST respond with valid JSON only. No markdown, no code fences, just raw JSON.
${langInstruction}`;

      userPrompt = `Generate a 5-year forecast (${context.startYear} to ${context.startYear + 4}) for ${context.name}, a ${context.yearElement} ${context.animal}. Birth Place: ${context.birthPlace || "Unknown"}. Birth Time: ${context.birthTime || "Unknown"}.

Respond with ONLY this JSON structure (no markdown):
{
  "years": [
    { "year": ${context.startYear}, "title": "2-4 word theme", "rating": 1-5, "summary": "3-4 sentence forecast for this year" },
    { "year": ${context.startYear + 1}, "title": "2-4 word theme", "rating": 1-5, "summary": "3-4 sentence forecast" },
    { "year": ${context.startYear + 2}, "title": "2-4 word theme", "rating": 1-5, "summary": "3-4 sentence forecast" },
    { "year": ${context.startYear + 3}, "title": "2-4 word theme", "rating": 1-5, "summary": "3-4 sentence forecast" },
    { "year": ${context.startYear + 4}, "title": "2-4 word theme", "rating": 1-5, "summary": "3-4 sentence forecast" }
  ]
}

Consider the ruling animal and element of each year, and how they interact with the ${context.animal}'s energy.`;

    } else if (reading_type === "maps_decode") {
      systemPrompt = `You are the Sovereign Oracle of DCode — a numerology master who decodes the vibrational energy of places.
Write 2-3 sentences about this location's energy. Second person. ${langInstruction}`;

      userPrompt = `Decode the numerological energy of "${context.locationName}" (vibration number ${context.locationNumber}: ${context.meaning}) for ${context.name}. Birth Place: ${context.birthPlace || "Unknown"}. Birth Time: ${context.birthTime || "Unknown"}. Date of Birth: ${context.dateOfBirth || "Unknown"}. How does this place interact with their personal energy?`;

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
