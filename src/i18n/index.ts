import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "./en.json";
import es from "./es.json";
import ptBR from "./pt-BR.json";

function detectLanguage(): string {
  const nav = typeof navigator !== "undefined" ? navigator.language : "en";
  if (nav.startsWith("es")) return "es";
  if (nav.startsWith("pt")) return "pt-BR";
  return "en";
}

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      es: { translation: es },
      "pt-BR": { translation: ptBR },
      pt: { translation: ptBR },
    },
    lng: detectLanguage(),
    fallbackLng: "en",
    interpolation: { escapeValue: false },
  });

export default i18n;
