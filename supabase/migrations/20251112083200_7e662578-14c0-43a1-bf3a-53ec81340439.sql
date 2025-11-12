-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Authenticated users can insert logs" ON public.notification_logs;

-- Create new policy that allows both authenticated users AND service role
CREATE POLICY "Users and service can insert logs" 
ON public.notification_logs 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL OR 
  auth.role() = 'service_role'
);