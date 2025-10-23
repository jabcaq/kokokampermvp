-- Create cron job that runs every hour to check for pending review requests
SELECT cron.schedule(
  'send-review-requests-hourly',
  '0 * * * *', -- Every hour at minute 0
  $$
  SELECT
    net.http_post(
        url:='https://qfnptknanxyfxvcuhgck.supabase.co/functions/v1/send-review-request',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmbnB0a25hbnh5Znh2Y3VoZ2NrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyNDUyOTYsImV4cCI6MjA3NDgyMTI5Nn0.qoz2ULJWoQHPZwBMH6HdBB6mUcJTZxeLXacqGRBZLsA"}'::jsonb
    ) as request_id;
  $$
);