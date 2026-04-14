/**
 * Normalize an i18n language code to one of the three values the
 * generate-reading edge function accepts: "en", "es", or "pt".
 *
 * Examples:
 *   "pt-BR"  → "pt"
 *   "es-MX"  → "es"
 *   "en-US"  → "en"
 *   "fr"     → "en"  (unsupported → default)
 */
export function normalizeLanguage(lang: string): "en" | "es" | "pt" {
  if (lang.startsWith("pt")) return "pt";
  if (lang.startsWith("es")) return "es";
  return "en";
}
