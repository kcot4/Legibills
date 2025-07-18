-- This script creates a PostgreSQL wrapper function to securely call your 'legislators' Edge Function.
-- To use it:
-- 1. Replace the <YOUR_SERVICE_ROLE_KEY> placeholder below with your actual Supabase service_role key.
-- 2. Run this entire script in the Supabase SQL Editor.
-- 3. After it's created, you can trigger your Edge Function by running: SELECT call_legislators_function();

CREATE OR REPLACE FUNCTION call_legislators_function()
RETURNS text AS $$
DECLARE
  response_id bigint;
BEGIN
  -- This function makes an authenticated HTTP POST request to your Edge Function.
  -- It uses the pg_net extension to do this.
  SELECT id INTO response_id
  FROM net.http_post(
    -- 1. The URL of the Edge Function to call
    url := 'https://ycbupihievenxlsdtmtq.supabase.co/functions/v1/legislators',

    -- 2. The required headers for authorization and content type
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || '<YOUR_SERVICE_ROLE_KEY>' -- <-- IMPORTANT: PASTE YOUR KEY HERE
    ),

    -- 3. The body of the request (can be an empty JSON object)
    body := '{}'::jsonb
  );

  -- You can add more logic here to check the response if needed
  -- For now, we just return a success message.
  RETURN 'Successfully triggered the legislators function. Check function logs for details. Response ID: ' || response_id;

EXCEPTION
  WHEN OTHERS THEN
    -- If the request fails, this will report the error.
    RETURN 'Error: ' || SQLERRM;
END;
$$
LANGUAGE plpgsql
-- SECURITY DEFINER is CRITICAL. It makes the function run with admin rights,
-- bypassing the need for a user session (which is what caused the original error).
SECURITY DEFINER;
