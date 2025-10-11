-- Update existing user_ai_quota system for weekly summary edge function
-- This migration extends the existing quota system to support the new edge function approach

-- Add indexes for better performance if they don't exist
CREATE INDEX IF NOT EXISTS idx_user_ai_quota_user_id ON public.user_ai_quota (user_id);
CREATE INDEX IF NOT EXISTS idx_user_ai_quota_cycle_start ON public.user_ai_quota (cycle_start_at);

-- Create function to get or initialize user quota (compatible with existing system)
CREATE OR REPLACE FUNCTION get_or_init_user_quota(p_user_id uuid)
RETURNS public.user_ai_quota AS $$
DECLARE
    quota_record public.user_ai_quota;
BEGIN
    -- Try to get existing quota record
    SELECT * INTO quota_record
    FROM public.user_ai_quota
    WHERE user_id = p_user_id;

    -- If no record exists, create one with current timestamp
    IF NOT FOUND THEN
        INSERT INTO public.user_ai_quota (user_id, cycle_start_at)
        VALUES (p_user_id, now())
        RETURNING * INTO quota_record;
    END IF;

    RETURN quota_record;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to reset quota if cycle has expired (28 days)
CREATE OR REPLACE FUNCTION reset_quota_if_expired(p_user_id uuid)
RETURNS public.user_ai_quota AS $$
DECLARE
    quota_record public.user_ai_quota;
    cycle_expired boolean;
BEGIN
    -- Get current quota record
    SELECT * INTO quota_record FROM get_or_init_user_quota(p_user_id);

    -- Check if cycle has expired (28 days)
    cycle_expired := now() >= (quota_record.cycle_start_at + interval '28 days');

    -- Reset quota if expired
    IF cycle_expired THEN
        UPDATE public.user_ai_quota
        SET ai_summaries_count = 0,
            cycle_start_at = now(),
            updated_at = now()
        WHERE user_id = p_user_id
        RETURNING * INTO quota_record;
    END IF;

    RETURN quota_record;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function for concurrency-safe quota increment
CREATE OR REPLACE FUNCTION conditional_increment_quota(
    p_user_id uuid,
    p_expected_count int
)
RETURNS public.user_ai_quota AS $$
DECLARE
    quota_record public.user_ai_quota;
    updated_rows int;
BEGIN
    -- Attempt atomic increment only if current count matches expected
    UPDATE public.user_ai_quota
    SET ai_summaries_count = ai_summaries_count + 1,
        updated_at = now()
    WHERE user_id = p_user_id
      AND ai_summaries_count = p_expected_count
    RETURNING * INTO quota_record;

    GET DIAGNOSTICS updated_rows = ROW_COUNT;

    -- If no rows were updated, return null (indicates race condition)
    IF updated_rows = 0 THEN
        RETURN NULL;
    END IF;

    RETURN quota_record;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add RLS policy for service role to manage all quotas (edge function needs this)
CREATE POLICY "Service role can manage all quotas" ON public.user_ai_quota
    FOR ALL
    USING (
        -- Allow service role (used by edge functions)
        auth.jwt() ->> 'role' = 'service_role' OR
        -- Allow existing authenticated user access
        auth.uid() = user_id
    );

-- Add comments for the new functions
COMMENT ON FUNCTION get_or_init_user_quota(uuid) IS
'Gets existing quota record or creates new one for user. Used by edge function.';

COMMENT ON FUNCTION reset_quota_if_expired(uuid) IS
'Resets quota if 28-day cycle has expired. Returns updated quota record.';

COMMENT ON FUNCTION conditional_increment_quota(uuid, int) IS
'Atomically increments quota count only if current count matches expected value. Prevents race conditions.';
