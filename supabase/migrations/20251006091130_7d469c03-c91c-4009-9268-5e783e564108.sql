-- Add 'return_handler' role to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'return_handler';