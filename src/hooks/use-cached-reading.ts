import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

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
  // Stable ref for context to avoid re-triggering
  const contextRef = useRef(context);
  contextRef.current = context;

  useEffect(() => {
    if (!enabled || !cacheKey) return;

    let cancelled = false;

    async function fetchReading() {
      setIsLoading(true);
      setError(null);

      try {
        // 1. Check if user is authenticated for DB caching
        const { data: authData } = await supabase.auth.getUser();
        const userId = authData?.user?.id;

        // 2. Check DB cache (only if authenticated)
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

        // 3. Generate via Gemini edge function
        const { data: fnData, error: fnError } = await supabase.functions.invoke(
          "generate-reading",
          { body: { reading_type: readingType, context: contextRef.current } }
        );

        if (fnError) throw new Error(fnError.message);

        const generatedContent = fnData?.content;
        if (!generatedContent) throw new Error("No content returned");

        if (!cancelled) {
          setContent(generatedContent);
        }

        // 4. Cache the result in DB (only if authenticated)
        if (userId) {
          supabase.from("cached_readings").upsert(
            [{
              user_id: userId,
              reading_type: readingType,
              cache_key: cacheKey,
              content: generatedContent,
              metadata: contextRef.current as unknown as Json,
            }],
            { onConflict: "user_id,reading_type,cache_key" }
          ).then(() => { /* fire and forget */ });
        }
      } catch (err) {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : "Failed to load reading";
          setError(msg);
          // Use fallback if provided
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
