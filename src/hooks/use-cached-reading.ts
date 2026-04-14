import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { normalizeLanguage } from "@/lib/language";

interface UseCachedReadingOptions {
  readingType: string;
  cacheKey: string;
  context: Record<string, unknown>;
  fallback?: string;
  enabled?: boolean;
}

export function useCachedReading({
  readingType,
  cacheKey,
  context,
  fallback,
  enabled = true,
}: UseCachedReadingOptions) {
  const [content, setContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const contextRef = useRef(context);
  contextRef.current = context;

  useEffect(() => {
    if (!enabled || !cacheKey) return;

    let cancelled = false;

    async function fetchReading() {
      setIsLoading(true);
      setError(null);

      try {
        const { data: authData } = await supabase.auth.getUser();
        const userId = authData?.user?.id;

        if (userId) {
          const { data: cached } = await supabase
            .from("cached_readings")
            .select("content")
            .eq("user_id", userId)
            .eq("reading_type", readingType)
            .eq("cache_key", cacheKey)
            .maybeSingle();

          if (cached?.content) {
            if (!cancelled) {
              setContent(cached.content);
              setIsLoading(false);
            }
            return;
          }
        }

        // Build a clean context payload the edge function understands
        const ctx = contextRef.current;
        const rawLang = String(ctx.selectedLanguage ?? ctx.language ?? "en");
        const selectedLanguage = normalizeLanguage(rawLang);
        const body = {
          reading_type: readingType,
          readingType,
          sign: ctx.sign ?? ctx.zodiacSign ?? ctx.sunSign ?? "",
          name: ctx.name ?? ctx.firstName ?? "",
          birthDate: ctx.birthDate ?? ctx.dateOfBirth ?? "",
          selectedLanguage,
          context: { ...ctx, language: selectedLanguage },
        };

        const { data: fnData, error: fnError } = await supabase.functions.invoke(
          "generate-reading",
          { body }
        );

        if (fnError) throw new Error(fnError.message);

        // Accept whatever key the edge function returns
        const generatedContent =
          fnData?.reading ??
          fnData?.content ??
          fnData?.text ??
          fnData?.message ??
          (typeof fnData === "string" ? fnData : null);

        if (!generatedContent) throw new Error("No content returned");

        // Strip any accidental JSON wrapping
        let cleanContent = generatedContent.trim();
        if (cleanContent.startsWith("{") || cleanContent.startsWith("[")) {
          try {
            const parsed = JSON.parse(cleanContent);
            cleanContent =
              parsed?.reading ??
              parsed?.content ??
              parsed?.text ??
              Object.values(parsed).find((v) => typeof v === "string") ??
              cleanContent;
          } catch {
            cleanContent = cleanContent
              .replace(/^\{.*?"[^"]+"\s*:\s*"/, "")
              .replace(/"\s*\}$/, "")
              .trim();
          }
        }

        if (!cancelled) {
          setContent(cleanContent);
        }

        if (userId) {
          supabase.from("cached_readings").upsert(
            [{
              user_id: userId,
              reading_type: readingType,
              cache_key: cacheKey,
              content: cleanContent,
              metadata: contextRef.current as unknown as Json,
            }],
            { onConflict: "user_id,reading_type,cache_key" }
          ).then(() => {});
        }
      } catch (err) {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : "Failed to load reading";
          setError(msg);
          if (fallback) {
            setContent(fallback);
          }
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    fetchReading();
    return () => { cancelled = true; };
  }, [readingType, cacheKey, enabled, fallback]);

  return { content, isLoading, error };
}