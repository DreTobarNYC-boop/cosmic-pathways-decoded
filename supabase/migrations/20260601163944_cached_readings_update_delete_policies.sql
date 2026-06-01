-- Add missing UPDATE and DELETE RLS policies for cached_readings (idempotent).
--
-- Without UPDATE, the upsert in useCachedReading silently fails on conflict,
-- so every session regenerates readings instead of hitting the cache.
-- Without DELETE, the retry logic silently fails and the user sees the same
-- broken reading on every retry.
--
-- These policies may already exist (applied via the Supabase dashboard in
-- migration 20260410000001). The DO blocks below make this migration safe
-- to run in any environment regardless of current state.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'cached_readings'
      AND policyname = 'Users can update their own cached readings'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Users can update their own cached readings"
        ON public.cached_readings FOR UPDATE
        USING (auth.uid() = user_id)
        WITH CHECK (auth.uid() = user_id)
    $policy$;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'cached_readings'
      AND policyname = 'Users can delete their own cached readings'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Users can delete their own cached readings"
        ON public.cached_readings FOR DELETE
        USING (auth.uid() = user_id)
    $policy$;
  END IF;
END $$;
