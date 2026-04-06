import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface UseCachedReadingOptions {
  readingType: string;
  cacheKey: string;
  context: Record<string, unknown>;
  enabled?: boolean;
}

export function useCachedReading({
  readingType,
  cacheKey,
  context,
  enabled = true,
}: UseCachedReadingOptions) {
  const [content, setContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !cacheKey) return;

    let cancelled = false;

    async function fetchReading() {
      setIsLoading(true);
      setError(null);

      try {
        // 1. Check cache first
        const { data: cached } = await supabase
          .from("cached_readings")
          .select("content")
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

        // 2. Generate via Gemini edge function
        const { data: fnData, error: fnError } = await supabase.functions.invoke(
          "generate-reading",
          {
            body: { reading_type: readingType, context },
          }
        );

        if (fnError) throw new Error(fnError.message);

        const generatedContent = fnData?.content;
        if (!generatedContent) throw new Error("No content returned");

        if (!cancelled) {
          setContent(generatedContent);
        }

        // 3. Cache the result (fire and forget)
        const { data: userData } = await supabase.auth.getUser();
        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user) {
          await supabase.from("cached_readings").upsert(
            [{
              user_id: userData.user.id,
              reading_type: readingType,
              cache_key: cacheKey,
              content: generatedContent,
              metadata: context as Record<string, unknown>,
            }],
            { onConflict: "user_id,reading_type,cache_key" }
          );
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load reading");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    fetchReading();
    return () => { cancelled = true; };
  }, [readingType, cacheKey, enabled]);

  return { content, isLoading, error };
}
