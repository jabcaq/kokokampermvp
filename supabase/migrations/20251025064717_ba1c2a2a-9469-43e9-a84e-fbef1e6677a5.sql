-- Enable pg_cron and pg_net extensions for scheduled tasks
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;

-- Schedule check-handover-day (daily at 8:00 AM) - dzień wydania pojazdu
SELECT cron.schedule(
  'check-handover-day-notification',
  '0 8 * * *',
  $$
  SELECT
    net.http_post(
        url:='https://qfnptknanxyfxvcuhgck.supabase.co/functions/v1/check-handover-day',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmbnB0a25hbnh5Znh2Y3VoZ2NrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyNDUyOTYsImV4cCI6MjA3NDgyMTI5Nn0.qoz2ULJWoQHPZwBMH6HdBB6mUcJTZxeLXacqGRBZLsA"}'::jsonb,
        body:='{}'::jsonb
    ) as request_id;
  $$
);

-- Schedule check-return-day (daily at 8:00 AM) - dzień zwrotu pojazdu
SELECT cron.schedule(
  'check-return-day-notification',
  '0 8 * * *',
  $$
  SELECT
    net.http_post(
        url:='https://qfnptknanxyfxvcuhgck.supabase.co/functions/v1/check-return-day',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmbnB0a25hbnh5Znh2Y3VoZ2NrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyNDUyOTYsImV4cCI6MjA3NDgyMTI5Nn0.qoz2ULJWoQHPZwBMH6HdBB6mUcJTZxeLXacqGRBZLsA"}'::jsonb,
        body:='{}'::jsonb
    ) as request_id;
  $$
);

-- Schedule check-return-2days (daily at 8:00 AM) - 2 dni przed zwrotem
SELECT cron.schedule(
  'check-return-2days-notification',
  '0 8 * * *',
  $$
  SELECT
    net.http_post(
        url:='https://qfnptknanxyfxvcuhgck.supabase.co/functions/v1/check-return-2days',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmbnB0a25hbnh5Znh2Y3VoZ2NrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyNDUyOTYsImV4cCI6MjA3NDgyMTI5Nn0.qoz2ULJWoQHPZwBMH6HdBB6mUcJTZxeLXacqGRBZLsA"}'::jsonb,
        body:='{}'::jsonb
    ) as request_id;
  $$
);

-- Schedule check-upcoming-rentals (daily at 8:00 AM) - 3 dni przed wynajmem
SELECT cron.schedule(
  'check-upcoming-rentals-notification',
  '0 8 * * *',
  $$
  SELECT
    net.http_post(
        url:='https://qfnptknanxyfxvcuhgck.supabase.co/functions/v1/check-upcoming-rentals',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmbnB0a25hbnh5Znh2Y3VoZ2NrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyNDUyOTYsImV4cCI6MjA3NDgyMTI5Nn0.qoz2ULJWoQHPZwBMH6HdBB6mUcJTZxeLXacqGRBZLsA"}'::jsonb,
        body:='{}'::jsonb
    ) as request_id;
  $$
);

-- Schedule check-rental-2days (daily at 8:00 AM) - 2 dni przed wynajmem
SELECT cron.schedule(
  'check-rental-2days-notification',
  '0 8 * * *',
  $$
  SELECT
    net.http_post(
        url:='https://qfnptknanxyfxvcuhgck.supabase.co/functions/v1/check-rental-2days',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmbnB0a25hbnh5Znh2Y3VoZ2NrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyNDUyOTYsImV4cCI6MjA3NDgyMTI5Nn0.qoz2ULJWoQHPZwBMH6HdBB6mUcJTZxeLXacqGRBZLsA"}'::jsonb,
        body:='{}'::jsonb
    ) as request_id;
  $$
);

-- Schedule check-expiring-insurance (daily at 9:00 AM) - wygasające ubezpieczenie
SELECT cron.schedule(
  'check-expiring-insurance-notification',
  '0 9 * * *',
  $$
  SELECT
    net.http_post(
        url:='https://qfnptknanxyfxvcuhgck.supabase.co/functions/v1/check-expiring-insurance',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmbnB0a25hbnh5Znh2Y3VoZ2NrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyNDUyOTYsImV4cCI6MjA3NDgyMTI5Nn0.qoz2ULJWoQHPZwBMH6HdBB6mUcJTZxeLXacqGRBZLsA"}'::jsonb,
        body:='{}'::jsonb
    ) as request_id;
  $$
);

-- Schedule check-expiring-inspection (daily at 9:00 AM) - wygasający przegląd
SELECT cron.schedule(
  'check-expiring-inspection-notification',
  '0 9 * * *',
  $$
  SELECT
    net.http_post(
        url:='https://qfnptknanxyfxvcuhgck.supabase.co/functions/v1/check-expiring-inspection',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmbnB0a25hbnh5Znh2Y3VoZ2NrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyNDUyOTYsImV4cCI6MjA3NDgyMTI5Nn0.qoz2ULJWoQHPZwBMH6HdBB6mUcJTZxeLXacqGRBZLsA"}'::jsonb,
        body:='{}'::jsonb
    ) as request_id;
  $$
);