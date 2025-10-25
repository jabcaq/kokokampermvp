-- Update cron schedule to run at 7:00 AM Polish time (5:00 UTC in summer, 6:00 UTC in winter)
-- Using 5:00 UTC which equals 7:00 Polish summer time
SELECT cron.unschedule('check-handover-day-notification');

SELECT cron.schedule(
  'check-handover-day-notification',
  '0 5 * * *', -- 5:00 UTC = 7:00 Polish summer time
  $$
  SELECT
    net.http_post(
        url:='https://qfnptknanxyfxvcuhgck.supabase.co/functions/v1/check-handover-day',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmbnB0a25hbnh5Znh2Y3VoZ2NrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyNDUyOTYsImV4cCI6MjA3NDgyMTI5Nn0.qoz2ULJWoQHPZwBMH6HdBB6mUcJTZxeLXacqGRBZLsA"}'::jsonb,
        body:='{}'::jsonb
    ) as request_id;
  $$
);