-- Enable pg_cron extension for scheduled tasks
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create cron job to check upcoming rentals every day at 8:00 AM Warsaw time
-- Warsaw is UTC+1 (or UTC+2 during DST), so 8:00 AM Warsaw = 7:00 AM UTC (winter) or 6:00 AM UTC (summer)
-- We'll use 6:00 AM UTC to be safe during DST
SELECT cron.schedule(
  'check-upcoming-rentals',
  '0 6 * * *', -- Every day at 6:00 AM UTC (8:00 AM Warsaw time during DST)
  $$
  SELECT
    net.http_post(
        url:='https://qfnptknanxyfxvcuhgck.supabase.co/functions/v1/check-upcoming-rentals',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmbnB0a25hbnh5Znh2Y3VoZ2NrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyNDUyOTYsImV4cCI6MjA3NDgyMTI5Nn0.qoz2ULJWoQHPZwBMH6HdBB6mUcJTZxeLXacqGRBZLsA"}'::jsonb,
        body:=concat('{"scheduled_time": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);