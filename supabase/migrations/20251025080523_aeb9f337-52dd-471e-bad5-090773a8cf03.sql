-- Update all cron schedules to run at Polish time (UTC-2 in summer)
-- Unschedule all existing jobs
SELECT cron.unschedule('check-expiring-inspection-notification');
SELECT cron.unschedule('check-expiring-insurance-notification');
SELECT cron.unschedule('check-rental-2days-notification');
SELECT cron.unschedule('check-return-2days-notification');
SELECT cron.unschedule('check-return-day-notification');
SELECT cron.unschedule('check-upcoming-rentals');
SELECT cron.unschedule('check-upcoming-rentals-notification');

-- Reschedule all jobs with Polish time (subtract 2 hours from Polish time to get UTC)

-- Check expiring inspection at 9:00 Polish (7:00 UTC)
SELECT cron.schedule(
  'check-expiring-inspection-notification',
  '0 7 * * *',
  $$
  SELECT
    net.http_post(
        url:='https://qfnptknanxyfxvcuhgck.supabase.co/functions/v1/check-expiring-inspection',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmbnB0a25hbnh5Znh2Y3VoZ2NrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyNDUyOTYsImV4cCI6MjA3NDgyMTI5Nn0.qoz2ULJWoQHPZwBMH6HdBB6mUcJTZxeLXacqGRBZLsA"}'::jsonb,
        body:='{}'::jsonb
    ) as request_id;
  $$
);

-- Check expiring insurance at 9:00 Polish (7:00 UTC)
SELECT cron.schedule(
  'check-expiring-insurance-notification',
  '0 7 * * *',
  $$
  SELECT
    net.http_post(
        url:='https://qfnptknanxyfxvcuhgck.supabase.co/functions/v1/check-expiring-insurance',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmbnB0a25hbnh5Znh2Y3VoZ2NrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyNDUyOTYsImV4cCI6MjA3NDgyMTI5Nn0.qoz2ULJWoQHPZwBMH6HdBB6mUcJTZxeLXacqGRBZLsA"}'::jsonb,
        body:='{}'::jsonb
    ) as request_id;
  $$
);

-- Check rental 2 days at 8:00 Polish (6:00 UTC)
SELECT cron.schedule(
  'check-rental-2days-notification',
  '0 6 * * *',
  $$
  SELECT
    net.http_post(
        url:='https://qfnptknanxyfxvcuhgck.supabase.co/functions/v1/check-rental-2days',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmbnB0a25hbnh5Znh2Y3VoZ2NrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyNDUyOTYsImV4cCI6MjA3NDgyMTI5Nn0.qoz2ULJWoQHPZwBMH6HdBB6mUcJTZxeLXacqGRBZLsA"}'::jsonb,
        body:='{}'::jsonb
    ) as request_id;
  $$
);

-- Check return 2 days at 8:00 Polish (6:00 UTC)
SELECT cron.schedule(
  'check-return-2days-notification',
  '0 6 * * *',
  $$
  SELECT
    net.http_post(
        url:='https://qfnptknanxyfxvcuhgck.supabase.co/functions/v1/check-return-2days',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmbnB0a25hbnh5Znh2Y3VoZ2NrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyNDUyOTYsImV4cCI6MjA3NDgyMTI5Nn0.qoz2ULJWoQHPZwBMH6HdBB6mUcJTZxeLXacqGRBZLsA"}'::jsonb,
        body:='{}'::jsonb
    ) as request_id;
  $$
);

-- Check return day at 8:00 Polish (6:00 UTC)
SELECT cron.schedule(
  'check-return-day-notification',
  '0 6 * * *',
  $$
  SELECT
    net.http_post(
        url:='https://qfnptknanxyfxvcuhgck.supabase.co/functions/v1/check-return-day',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmbnB0a25hbnh5Znh2Y3VoZ2NrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyNDUyOTYsImV4cCI6MjA3NDgyMTI5Nn0.qoz2ULJWoQHPZwBMH6HdBB6mUcJTZxeLXacqGRBZLsA"}'::jsonb,
        body:='{}'::jsonb
    ) as request_id;
  $$
);

-- Check upcoming rentals (3 days) at 8:00 Polish (6:00 UTC)
SELECT cron.schedule(
  'check-upcoming-rentals',
  '0 6 * * *',
  $$
  SELECT
    net.http_post(
        url:='https://qfnptknanxyfxvcuhgck.supabase.co/functions/v1/check-upcoming-rentals',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmbnB0a25hbnh5Znh2Y3VoZ2NrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyNDUyOTYsImV4cCI6MjA3NDgyMTI5Nn0.qoz2ULJWoQHPZwBMH6HdBB6mUcJTZxeLXacqGRBZLsA"}'::jsonb,
        body:='{}'::jsonb
    ) as request_id;
  $$
);

-- Check upcoming rentals notification at 8:00 Polish (6:00 UTC)
SELECT cron.schedule(
  'check-upcoming-rentals-notification',
  '0 6 * * *',
  $$
  SELECT
    net.http_post(
        url:='https://qfnptknanxyfxvcuhgck.supabase.co/functions/v1/check-upcoming-rentals',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmbnB0a25hbnh5Znh2Y3VoZ2NrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyNDUyOTYsImV4cCI6MjA3NDgyMTI5Nn0.qoz2ULJWoQHPZwBMH6HdBB6mUcJTZxeLXacqGRBZLsA"}'::jsonb,
        body:='{}'::jsonb
    ) as request_id;
  $$
);