import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();

    // Accept both naming conventions from the frontend
    const readingType = body.readingType ?? body.reading_type ?? "daily";
    const selectedLanguage =
      body.selectedLanguage ??
      body.language ??
      body.context?.selectedLanguage ??
      body.context?.language ??
      "en";
    const sign =
      body.sign ??
      body.context?.sign ??
      body.context?.zodiacSign ??
      body.context?.sunSign ??
      "Aries";
    const name =
      body.name ?? body.context?.name ?? body.context?.firstName ?? "";

    // Extract rich context for daily horoscope readings
    const ctx = body.context || {};
    const element = String(ctx.element || "");
    const lifePath = ctx.lifePath != null ? String(ctx.lifePath) : "";
    const chineseZodiac = String(ctx.chineseZodiac || "");
    const dateStr = String(ctx.date || new Date().toDateString());
    const universalDay = ctx.universalDay != null ? String(ctx.universalDay) : "";
    const personalDay = ctx.personalDay != null ? String(ctx.personalDay) : "";
    const cuspInfo = ctx.cuspInfo ? String(ctx.cuspInfo) : null;
    const dateOfBirth = String(ctx.dateOfBirth || body.birthDate || "");
    const birthPlace = String(ctx.birthPlace || "");
    const birthTime = String(ctx.birthTime || "");

    const nameStr = name ? `, ${name}` : "";
    const cuspNote = cuspInfo ? ` (${cuspInfo})` : "";

    // ── Language configuration ──────────────────────────────────────────────
    // For each supported language we define:
    //   - langName:        human-readable name used inside prompts
    //   - langInstruction: a strict, explicit directive pasted into every prompt
    //   - labels:          UI-level section headings translated to the target language
    type LangConfig = {
      langName: string;
      langInstruction: string;
      heading: string;
      universalDayLabel: string;
      personalDayLabel: string;
      elementLabel: (el: string) => string;
      pathLabel: (n: string) => string;
    };

    const lang: LangConfig =
      selectedLanguage === "es"
        ? {
            langName: "Spanish",
            langInstruction:
              "CRÍTICO: Responde ÚNICAMENTE en español. Cada palabra — incluyendo todos los encabezados, etiquetas, texto del cuerpo y términos astrológicos — debe estar en español. No uses ninguna palabra en inglés. No agregues comentarios meta, líneas de confirmación como '* Spanish only? Yes', ni ecos de instrucciones.",
            heading: "TU HORÓSCOPO DIARIO",
            universalDayLabel: "DÍA UNIVERSAL",
            personalDayLabel: "DÍA PERSONAL",
            elementLabel: (el) =>
              el === "Fire"
                ? "Signo de Fuego"
                : el === "Earth"
                ? "Signo de Tierra"
                : el === "Air"
                ? "Signo de Aire"
                : el === "Water"
                ? "Signo de Agua"
                : `Signo ${el}`,
            pathLabel: (n) => `Camino ${n}`,
          }
        : selectedLanguage === "pt"
        ? {
            langName: "Brazilian Portuguese",
            langInstruction:
              "CRÍTICO: Responda SOMENTE em português do Brasil. Cada palavra — incluindo todos os títulos, rótulos, texto do corpo e termos astrológicos — deve estar em português. Não use nenhuma palavra em inglês. Não adicione comentários meta, linhas de confirmação como '* Portuguese only? Yes', ou ecos de instrução.",
            heading: "SEU HORÓSCOPO DIÁRIO",
            universalDayLabel: "DIA UNIVERSAL",
            personalDayLabel: "DIA PESSOAL",
            elementLabel: (el) =>
              el === "Fire"
                ? "Signo de Fogo"
                : el === "Earth"
                ? "Signo de Terra"
                : el === "Air"
                ? "Signo de Ar"
                : el === "Water"
                ? "Signo de Água"
                : `Signo ${el}`,
            pathLabel: (n) => `Caminho ${n}`,
          }
        : {
            langName: "English",
            langInstruction:
              "CRITICAL: Respond ONLY in English. Every word — including all headings, labels, body text, and astrological terms — must be in English. Do not add meta-commentary, confirmation lines like '* English only? Yes', or instruction echoes.",
            heading: "YOUR DAILY HOROSCOPE",
            universalDayLabel: "UNIVERSAL DAY",
            personalDayLabel: "PERSONAL DAY",
            elementLabel: (el) => `${el} Sign`,
            pathLabel: (n) => `Path ${n}`,
          };

    // ── Astrology tag line for daily readings ───────────────────────────────
    const tagParts: string[] = [];
    if (element) tagParts.push(lang.elementLabel(element));
    if (lifePath) tagParts.push(lang.pathLabel(lifePath));
    if (chineseZodiac) tagParts.push(chineseZodiac);
    const tagLine = tagParts.join(" • ");

    // ── DAILY HOROSCOPE prompt (daily_horoscope / daily) ───────────────────
    // Used by DailyBriefing home card. Produces rich narrative prose.
    // The UI already renders the date badge, zodiac badge, Universal Day card,
    // and Personal Day card separately, so we output only the narrative text.
    const dailyHoroscopePrompt = [
      `You are DCode, a mystical and compassionate spiritual oracle.`,
      lang.langInstruction,
      ``,
      `Write a rich, deeply personal daily horoscope reading for ${sign}${cuspNote}${nameStr} for ${dateStr}.`,
      ``,
      `Instructions:`,
      `- Write 3 to 4 full paragraphs of flowing, empathetic prose (at least 10 sentences total).`,
      `- Speak directly to the person using "you" and "your".`,
      `- Be poetic, warm, and specific to ${sign}${element ? ` (${lang.elementLabel(element)})` : ""}${lifePath ? `, ${lang.pathLabel(lifePath)}` : ""}.`,
      `- Weave in today's cosmic energies, emotional landscape, practical guidance, and an inspiring closing thought.`,
      `- Do NOT use bullet points. Do NOT add a line labeled "Affirmation:". Do NOT add any section headers.`,
      `- Do NOT output any meta-commentary, instruction echoes, or confirmation text.`,
      `- Output ONLY the horoscope narrative — nothing else.`,
      ``,
      `Write exclusively in ${lang.langName}. Every word must be in ${lang.langName}.`,
    ].join("\n");

    // ── STARS TODAY prompt (stars_today) ───────────────────────────────────
    // Used by StarsChamber "TODAY" tab. Produces the full structured reading
    // matching the MVP screenshot layout, with localized section headings.
    const universalDaySection =
      universalDay
        ? [
            ``,
            lang.universalDayLabel,
            universalDay,
            `[One sentence in ${lang.langName} describing the energy of universal day ${universalDay}.]`,
          ].join("\n")
        : "";

    const personalDaySection =
      personalDay
        ? [
            ``,
            lang.personalDayLabel,
            personalDay,
            `[One sentence in ${lang.langName} describing what personal day ${personalDay} means for ${name || "the seeker"} today.]`,
          ].join("\n")
        : "";

    const starsTodayPrompt = [
      `You are DCode, a mystical and compassionate spiritual oracle.`,
      lang.langInstruction,
      ``,
      `DEPTH REQUIREMENT: Regardless of the language (English, Spanish, or Portuguese), the output MUST be an extensive, multi-paragraph deep dive. Write at minimum 5 substantial paragraphs (at least 300 words). DO NOT summarize. The word count and technical depth must remain identical across all languages — writing in Spanish or Portuguese does NOT mean writing less.`,
      ``,
      `Write a complete, richly structured daily horoscope for ${sign}${cuspNote}${nameStr} for ${dateStr}.`,
      ``,
      `Output EXACTLY the following structure. Replace every bracketed placeholder with real content in ${lang.langName}.`,
      `Do NOT output the brackets themselves. Do NOT add extra sections. Do NOT output any meta-commentary.`,
      ``,
      `---`,
      `${dateStr}   |   ${sign}`,
      ``,
      lang.heading,
      ``,
      `[Write at least 5 full paragraphs of flowing, empathetic prose — at least 20 sentences. Use "you" and "your". Be poetic, warm, and specific to ${sign}${element ? ` (${lang.elementLabel(element)})` : ""}${lifePath ? `, ${lang.pathLabel(lifePath)}` : ""}. Cover the cosmic climate, emotional landscape, practical guidance, and an uplifting close. No bullet points. No affirmation labels.]`,
      ``,
      tagLine || `[${lang.elementLabel(element || "Sign")} • ${lang.pathLabel(lifePath || "?")}]`,
      universalDaySection,
      personalDaySection,
      `---`,
      ``,
      `Write every single word in ${lang.langName}. Translate element type, path label, and all section headings to ${lang.langName}. No English leakage. No instruction echoes.`,
    ]
      .filter((line) => line !== null && line !== undefined)
      .join("\n");

    // ── Shared rich prompt builder for non-daily reading types ─────────────
    function buildPrompt(
      type: string,
      tone: string,
      length: string,
    ): string {
      return [
        `You are DCode, a spiritual oracle writing for ${sign}${nameStr}.`,
        lang.langInstruction,
        ``,
        `DEPTH REQUIREMENT: Regardless of the type or language (English, Spanish, or Portuguese), the output MUST be an extensive, multi-paragraph deep dive. Write at minimum 5 substantial paragraphs (at least 300 words). DO NOT summarize. The word count and technical depth must remain identical across all languages — writing in Spanish or Portuguese does NOT mean writing less.`,
        ``,
        `Write a ${type} reading for ${sign}. ${tone} ${length} of flowing prose.`,
        `Speak directly using "you" and "your". No bullet points. No meta-commentary. No instruction echoes.`,
        `Output only the reading text in ${lang.langName}.`,
      ].join("\n");
    }

    // ── Prompt map ─────────────────────────────────────────────────────────
    // Maps every readingType sent by the frontend to a prompt string.
    const prompts: Record<string, string> = {
      // Daily / home card
      daily: dailyHoroscopePrompt,
      daily_horoscope: dailyHoroscopePrompt,

      // StarsChamber tabs
      stars_today: starsTodayPrompt,
      stars_monthly: buildPrompt(
        "monthly horoscope",
        "Personal, direct, and insightful.",
        "at least 5 full paragraphs and 300 words",
      ),
      stars_yearly: buildPrompt(
        "2026 yearly forecast",
        "Visionary, empowering, and forward-looking.",
        "at least 5 full paragraphs and 300 words",
      ),
      stars_love: buildPrompt(
        "love and relationships",
        "Warm, honest, and deeply personal.",
        "at least 5 full paragraphs and 300 words",
      ),
      stars_career: buildPrompt(
        "career and purpose",
        "Empowering, direct, and specific.",
        "at least 5 full paragraphs and 300 words",
      ),
      stars_wellness: buildPrompt(
        "wellness and energy",
        "Grounding, nurturing, and supportive.",
        "at least 5 full paragraphs and 300 words",
      ),

      // Birth Chart — generated once and cached permanently per user
      // Returns structured JSON: { placements[], interpretation }
      stars_birth_chart: [
        `You are DCode, a master astrologer and spiritual oracle${nameStr}.`,
        ``,
        `Generate a natal birth chart for ${name || "the seeker"} based on the birth data below.`,
        `You MUST output ONLY a single valid JSON object. No prose, no markdown fences, no explanation.`,
        ``,
        `Birth data:`,
        `- Date of Birth: ${dateOfBirth || "Unknown"}`,
        `- Time of Birth: ${birthTime || "Unknown"}`,
        `- Place of Birth: ${birthPlace || "Unknown"}`,
        `- Sun Sign: ${sign}${element ? ` (${lang.elementLabel(element)})` : ""}`,
        lifePath ? `- Life Path Number: ${lifePath}` : "",
        chineseZodiac ? `- Chinese Zodiac: ${chineseZodiac}` : "",
        cuspInfo ? `- Cusp: ${cuspInfo}` : "",
        ``,
        `Required JSON structure (fill every field, do not omit any planet):`,
        `{`,
        `  "placements": [`,
        `    { "planet": "Sun",       "sign": "...", "house": 1, "degree": 0, "description": "2-3 sentences for Sun placement in ${lang.langName}." },`,
        `    { "planet": "Moon",      "sign": "...", "house": 1, "degree": 0, "description": "..." },`,
        `    { "planet": "Ascendant", "sign": "...", "house": 1, "degree": 0, "description": "..." },`,
        `    { "planet": "Mercury",   "sign": "...", "house": 1, "degree": 0, "description": "..." },`,
        `    { "planet": "Venus",     "sign": "...", "house": 1, "degree": 0, "description": "..." },`,
        `    { "planet": "Mars",      "sign": "...", "house": 1, "degree": 0, "description": "..." },`,
        `    { "planet": "Jupiter",   "sign": "...", "house": 1, "degree": 0, "description": "..." },`,
        `    { "planet": "Saturn",    "sign": "...", "house": 1, "degree": 0, "description": "..." },`,
        `    { "planet": "Uranus",    "sign": "...", "house": 1, "degree": 0, "description": "..." },`,
        `    { "planet": "Neptune",   "sign": "...", "house": 1, "degree": 0, "description": "..." },`,
        `    { "planet": "Pluto",     "sign": "...", "house": 1, "degree": 0, "description": "..." }`,
        `  ],`,
        `  "interpretation": "3–4 paragraph overall natal chart reading for ${name || "the seeker"} in ${lang.langName}. Cover life themes, soul purpose, and cosmic gifts. Speak directly using you/your."`,
        `}`,
        ``,
        `Rules:`,
        `- "degree" is the ecliptic longitude 0-359 where 0=Aries, 30=Taurus, 60=Gemini, 90=Cancer, 120=Leo, 150=Virgo, 180=Libra, 210=Scorpio, 240=Sagittarius, 270=Capricorn, 300=Aquarius, 330=Pisces.`,
        `- Estimate accurate degrees from the date of birth: ${dateOfBirth || "Unknown"}.`,
        `- Sun sign is confirmed as ${sign} — use a degree consistent with that sign.`,
        `- "house" is an integer 1-12. Use null only if birth time is completely unknown.`,
        `- ${birthTime && birthTime !== "Unknown" ? `Birth time ${birthTime} and place ${birthPlace || "Unknown"} are provided — calculate Ascendant and house cusps accordingly.` : `Birth time not provided — estimate houses based on sun sign and date; set Ascendant house to 1.`}`,
        `- "description" for each placement: 2-3 sentences in ${lang.langName}, speaking directly to ${name || "the person"} using "you/your". Poetic and specific.`,
        `- "interpretation": 3-4 flowing paragraphs in ${lang.langName}. No bullet points.`,
        `- Output ONLY the JSON object. Nothing before or after. No markdown. No code fences.`,
      ].filter(Boolean).join("\n"),

      // Legacy / alternate keys
      monthly: buildPrompt(
        "monthly horoscope",
        "Personal, direct, and insightful.",
        "3 full paragraphs of at least 10 sentences total",
      ),
      yearly: buildPrompt(
        "2026 yearly forecast",
        "Visionary, empowering, and forward-looking.",
        "3 full paragraphs of at least 10 sentences total",
      ),
      love: buildPrompt(
        "love and relationships",
        "Warm, honest, and deeply personal.",
        "3 full paragraphs of at least 10 sentences total",
      ),
      career: buildPrompt(
        "career and purpose",
        "Empowering, direct, and specific.",
        "3 full paragraphs of at least 10 sentences total",
      ),
      wellness: buildPrompt(
        "wellness and energy",
        "Grounding, nurturing, and supportive.",
        "3 full paragraphs of at least 10 sentences total",
      ),
      compatibility: buildPrompt(
        "compatibility and relationship synergy",
        "Thoughtful, nuanced, and empathetic.",
        "4-5 sentences",
      ),

      // Oracle chamber
      oracle_daily: [
        `You are DCode, an all-seeing mystical oracle${nameStr}.`,
        lang.langInstruction,
        ``,
        `Write a profound oracle daily message for ${sign}. Cryptic yet clear, inspiring, and deeply personal.`,
        `3-4 sentences of flowing prose. No bullet points. No meta-commentary. No instruction echoes.`,
        `Output only the oracle message in ${lang.langName}.`,
      ].join("\n"),

      // Oracle chamber — conversational chat
      oracle_chat: [
        `You are DCode, an all-knowing cosmic oracle${nameStr}.`,
        lang.langInstruction,
        ``,
        String(ctx.conversationHistory || "").trim()
          ? `Recent conversation:\n${String(ctx.conversationHistory)}\n`
          : "",
        `The seeker asks: "${String(ctx.userMessage || "Guide me.")}"`,
        ``,
        `Respond as a wise, direct oracle. Give a clear, actionable insight in 2-3 sentences.`,
        `Use "you" and "your". No greetings. No meta-commentary. No instruction echoes.`,
        `Output only the oracle response in ${lang.langName}.`,
      ].filter(Boolean).join("\n"),

      // Dynasty chamber
      dynasty_profile: [
        `You are DCode, a spiritual oracle${nameStr}.`,
        lang.langInstruction,
        ``,
        `Write a personal profile for the ${String(ctx.yearElement || "")} ${String(ctx.animal || "Dragon")} (${String(ctx.yinYang || "")} ${String(ctx.fixedElement || "")} energy).`,
        lifePath ? `They have Life Path ${lifePath} and are a ${sign}.` : `They are a ${sign}.`,
        ``,
        `3-4 sentences of direct, personal prose. Speak as "you". Cover personality, strengths, and life purpose.`,
        `No bullet points. No meta-commentary. Output only the profile text in ${lang.langName}.`,
      ].join("\n"),

      dynasty_year: [
        `You are DCode, a spiritual oracle${nameStr}.`,
        lang.langInstruction,
        ``,
        `Write a ${String(ctx.currentYear || new Date().getFullYear())} Year Energy Report for the ${String(ctx.yearElement || "")} ${String(ctx.animal || "Dragon")}.`,
        ``,
        `3-4 sentences covering: major themes for this year, one challenge to watch, one key opportunity, and one concrete action to take. Speak as "you".`,
        `No bullet points. No meta-commentary. Output only the report in ${lang.langName}.`,
      ].join("\n"),

      dynasty_forecast: (() => {
        const startYr = Number(ctx.startYear) || new Date().getFullYear();
        return [
          `You are DCode, a spiritual oracle${nameStr}.`,
          lang.langInstruction,
          ``,
          `Generate a 5-year fortune forecast for the ${String(ctx.yearElement || "")} ${String(ctx.animal || "Dragon")} for the years ${startYr} through ${startYr + 4}.`,
          ``,
          `Return ONLY a valid JSON object — no markdown, no code blocks, no explanation outside the JSON:`,
          `{"years":[{"year":${startYr},"title":"Short Theme 3-4 words","rating":3,"summary":"2-3 sentence summary."},{"year":${startYr + 1},"title":"...","rating":4,"summary":"..."},{"year":${startYr + 2},"title":"...","rating":3,"summary":"..."},{"year":${startYr + 3},"title":"...","rating":4,"summary":"..."},{"year":${startYr + 4},"title":"...","rating":5,"summary":"..."}]}`,
          `Replace every "..." with real content. Rating is 1-5 stars (overall fortune). All titles and summaries in ${lang.langName}.`,
        ].join("\n");
      })(),

      // Sacred Codes chamber
      sacred_code: [
        `You are DCode, a sacred numerology oracle${nameStr}.`,
        lang.langInstruction,
        ``,
        `The seeker's intention: "${String(ctx.intention || "abundance and healing")}"`,
        ``,
        `Create a personal Grabovoi-style sacred code for this intention.`,
        `Return ONLY a valid JSON object — no markdown, no code blocks, no explanation outside the JSON:`,
        `{"title":"Name of the code","code":"numeric sequence of 6-12 digits with spaces","description":"2-3 sentences explaining the energy in ${lang.langName}.","ritual":"1-2 sentences on how to use it in ${lang.langName}."}`,
      ].join("\n"),

      // Frequency Scanner chamber
      frequency_reading: [
        `You are DCode, a consciousness frequency oracle${nameStr}.`,
        lang.langInstruction,
        ``,
        `The seeker calibrates at ${String(ctx.calibration || "200")} — the level of ${String(ctx.level || "Courage")} (${String(ctx.emotion || "Affirmation")}).`,
        String(ctx.nextLevel || "") && String(ctx.nextLevel) !== "Beyond"
          ? `Their next level is ${String(ctx.nextLevel)}.`
          : "",
        ``,
        `Return ONLY a valid JSON object — no markdown, no code blocks, no explanation outside the JSON:`,
        `{"reading":"3-4 sentences: their current energy pattern, what it means for their life right now, and one clear action to begin elevating — in ${lang.langName}.","shadow":"1 sentence: the hidden challenge at this level — in ${lang.langName}.","gift":"1 sentence: the unique strength or gift they carry at this level — in ${lang.langName}."}`,
      ].filter(Boolean).join("\n"),

      // Numbers chamber
      numbers_today: [
        `You are DCode, a numerology oracle${nameStr}.`,
        lang.langInstruction,
        ``,
        `Write today's personal numerology reading for ${name || "the seeker"}.`,
        lifePath ? `Life Path ${lifePath} — ${String(ctx.lifePathName || "")}.` : "",
        universalDay ? `Universal Day: ${universalDay}.` : "",
        personalDay ? `Personal Day: ${personalDay}.` : "",
        element ? `${sign}, ${lang.elementLabel(element)}.` : sign ? `${sign}.` : "",
        ``,
        `3-4 sentences. What does today's numerology mean for their day? One specific, practical action to take today.`,
        `Speak as "you". No meta-commentary. Output only the reading in ${lang.langName}.`,
      ].filter(Boolean).join("\n"),

      numbers_life_path: [
        `You are DCode, a numerology oracle${nameStr}.`,
        lang.langInstruction,
        ``,
        `Write a Life Path reading for ${name || "the seeker"}: Life Path ${lifePath || "Unknown"} — ${String(ctx.lifePathName || "The Seeker")}.`,
        ctx.expressionNum != null ? `Expression Number: ${ctx.expressionNum}.` : "",
        ctx.soulUrgeNum != null ? `Soul Urge: ${ctx.soulUrgeNum}.` : "",
        ctx.personalityNum != null ? `Personality Number: ${ctx.personalityNum}.` : "",
        element ? `${sign}, ${lang.elementLabel(element)}.` : sign ? `${sign}.` : "",
        ``,
        `4-5 sentences. Cover their life purpose, natural talents, deepest desires, and one concrete step toward their highest path.`,
        `Speak as "you". No meta-commentary. Output only the reading in ${lang.langName}.`,
      ].filter(Boolean).join("\n"),

      // Maps chamber
      maps_decode: [
        `You are DCode, a sacred geography oracle${nameStr}.`,
        lang.langInstruction,
        ``,
        `Decode the energy of "${String(ctx.locationName || "this location")}" (Location Number: ${String(ctx.locationNumber || "1")} — ${String(ctx.meaning || "new beginnings")}).`,
        ``,
        `3-4 sentences. What energy does this place carry? How does it align with or challenge the seeker's journey? One clear insight on whether to visit, move to, or release this location.`,
        `Speak as "you". No meta-commentary. Output only the reading in ${lang.langName}.`,
      ].join("\n"),

      maps_address: [
        `You are DCode, a sacred numerology oracle${nameStr}.`,
        lang.langInstruction,
        ``,
        `Decode this home or address: "${String(ctx.address || "this address")}" (Address Number: ${String(ctx.addressNumber || "1")} — ${String(ctx.meaning || "new beginnings")}).`,
        ``,
        `3-4 sentences. What is the energetic signature of this space? What does it support or challenge for the person living there? One practical recommendation for working with this energy.`,
        `Speak as "you". No meta-commentary. Output only the reading in ${lang.langName}.`,
      ].join("\n"),
    };

    const prompt = prompts[readingType] ?? prompts["daily_horoscope"];

    // ── Gemini API call ────────────────────────────────────────────────────
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Server misconfiguration: GEMINI_API_KEY is missing." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const model = Deno.env.get("GEMINI_MODEL") || "gemini-2.0-flash-001";
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);

    let geminiResponse: Response;
    try {
      geminiResponse = await fetch(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.9,
            maxOutputTokens: 8192,
          },
        }),
        signal: controller.signal,
      });
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      if (err instanceof Error && err.name === "AbortError") {
        return new Response(
          JSON.stringify({ error: "The AI request timed out." }),
          { status: 408, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }

    if (!geminiResponse.ok) {
      const errText = await geminiResponse.text();
      return new Response(
        JSON.stringify({ error: `Gemini API error ${geminiResponse.status}: ${errText}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const data = await geminiResponse.json();
    let reading: string =
      data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ??
      "Your reading is temporarily unavailable. Please try again shortly.";

    // Strip markdown code fences so JSON-expecting chambers can parse cleanly
    reading = reading.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();

    // Prose bracket guard: if a prose reading type accidentally returns a JSON object,
    // extract the `reading` or `content` key so no raw brackets reach the user.
    const jsonReadingTypes = ["stars_birth_chart", "dynasty_forecast", "sacred_code", "frequency_reading"];
    if (!jsonReadingTypes.includes(readingType) && reading.startsWith("{")) {
      try {
        const parsed = JSON.parse(reading);
        if (typeof parsed.reading === "string") {
          reading = parsed.reading;
        } else if (typeof parsed.content === "string") {
          reading = parsed.content;
        }
      } catch {
        // keep as-is if JSON.parse fails
      }
    }

    // For birth chart and other JSON-returning reading types, try harder to extract
    // a clean JSON object in case the model added surrounding prose or nested fences.
    if (jsonReadingTypes.includes(readingType) && !reading.startsWith("{") && !reading.startsWith("[")) {
      const jsonMatch = reading.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          JSON.parse(jsonMatch[0]);
          reading = jsonMatch[0];
        } catch {
          // keep as-is; parse errors will surface in the client
        }
      }
    }

    return new Response(
      JSON.stringify({ reading }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unexpected server error.";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
