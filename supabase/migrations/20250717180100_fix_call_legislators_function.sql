-- This script FIXES the PostgreSQL wrapper function to correctly handle the output from pg_net.
-- To use it:
-- 1. Replace the <YOUR_SERVICE_ROLE_KEY> placeholder below with your actual Supabase service_role key.
-- 2. Run this entire script in the Supabase SQL Editor to UPDATE the function.

CREATE OR REPLACE FUNCTION call_legislators_function()
RETURNS text AS $$
DECLARE
  response_id bigint;
BEGIN
  -- This function makes an authenticated HTTP POST request to your Edge Function.
  SELECT net.http_post(
    -- 1. The URL of the Edge Function to call
    url := 'https://ycbupihievenxlsdtmtq.supabase.co/functions/v1/legislators',

    -- 2. The required headers for authorization and content type
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || '<YOUR_SERVICE_ROLE_KEY>' -- <-- IMPORTANT: PASTE YOUR KEY HERE
    ),

    -- 3. The body of the request (can be an empty JSON object)
    body := '{}'::jsonb
  ) INTO response_id; -- <-- FIX IS HERE: Assign the result directly.

  RETURN 'Successfully triggered the legislators function. Check function logs for details. Response ID: ' || response_id;

EXCEPTION
  WHEN OTHERS THEN
    -- If the request fails, this will report the error.
    RETURN 'Error: ' || SQLERRM;
END;
$$
LANGUAGE plpgsql
SECURITY DEFINER;
