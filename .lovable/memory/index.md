# Project Memory

## Core
RULE #1: EVERYTHING is personalized to the individual. All readings, content, and features use the person's DOB, birth time, and birth place. Nothing generic.
DCode — mystical/spiritual app "The Chambers". Dark cosmic theme (#0B1A1A bg, gold #F5D060 accent, copper #B87333).
Libre Baskerville display font, system sans body. 9 chambers (Sacred Codes merged into Vault per spec).
Lovable Cloud enabled. BETA_MODE=true (all access, no paywall yet). Config in src/lib/config.ts.
Never navigate Dre away from chat. He checks app on phone.
NO local content databases — all readings/descriptions come from Gemini AI via API. Only store user profile + cached readings in DB.
User has their own Gemini API key (stored as GEMINI_API_KEY secret). Uses gemini-2.5-flash model.
Template fallbacks exist in src/lib/fallbacks.ts — used ONLY when Gemini API fails.
Auth: email/password via Lovable Cloud. Profile stored in user_profiles table.
i18n: EN/ES/PT-BR via i18next + browser language detection + manual switcher in header. AI readings generated in user's language.

## Memories
- [Design system](mem://design/tokens) — Full cosmic palette, gold/copper/cream tokens, animations
- [Chambers spec](mem://features/chambers) — All 10 chambers with features and calculation engines
- [Pricing](mem://features/pricing) — Monthly $33, Annual $233, Lifetime $688, Founders free
- [Architecture](mem://features/architecture) — API-first: Gemini for all content, DB only for user data, cached_readings for daily caching
