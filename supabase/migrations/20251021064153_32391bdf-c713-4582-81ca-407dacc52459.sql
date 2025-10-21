-- Create notification logs table for audit trail
CREATE TABLE public.notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_type TEXT NOT NULL,
  notification_title TEXT NOT NULL,
  action_description TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT,
  contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL,
  contract_number TEXT,
  inquiry_id UUID REFERENCES inquiries(id) ON DELETE SET NULL,
  inquiry_number TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() AT TIME ZONE 'Europe/Warsaw'),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() AT TIME ZONE 'Europe/Warsaw')
);

-- Enable RLS
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

-- Allow everyone to view logs
CREATE POLICY "Anyone can view notification logs"
ON public.notification_logs
FOR SELECT
USING (true);

-- Allow authenticated users to insert logs
CREATE POLICY "Authenticated users can insert logs"
ON public.notification_logs
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Admins can delete logs
CREATE POLICY "Admins can delete logs"
ON public.notification_logs
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create index for faster queries
CREATE INDEX idx_notification_logs_created_at ON public.notification_logs(created_at DESC);
CREATE INDEX idx_notification_logs_user_id ON public.notification_logs(user_id);
CREATE INDEX idx_notification_logs_type ON public.notification_logs(notification_type);

-- Trigger to update updated_at
CREATE TRIGGER update_notification_logs_updated_at
BEFORE UPDATE ON public.notification_logs
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();