SELECT cron.schedule(
  'import-bills-job',
  '*/10 * * * *',
  $$
    SELECT net.http_post(
      url:='https://ycbupihievenxlsdtmtq.supabase.co/functions/v1/import-bills',
      body:='{}'::jsonb,
      headers:=jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljYnVwaWhpZXZlbnhsc2R0bXRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczMTg1MDksImV4cCI6MjA2Mjg5NDUwOX0.zl9Ifz9qx04HcsJm-lhN24tKC2oBt9F1T38D5wTb9nU'
      )
    )
  $$
);
