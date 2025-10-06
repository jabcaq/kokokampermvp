-- Create employee_schedules table
CREATE TABLE IF NOT EXISTS public.employee_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  work_date DATE NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(employee_id, work_date)
);

-- Create employee_availability_settings table
CREATE TABLE IF NOT EXISTS public.employee_availability_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  max_concurrent_returns INTEGER NOT NULL DEFAULT 3,
  return_duration_minutes INTEGER NOT NULL DEFAULT 30,
  advance_booking_days INTEGER NOT NULL DEFAULT 14,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert default settings
INSERT INTO public.employee_availability_settings (max_concurrent_returns, return_duration_minutes, advance_booking_days)
VALUES (3, 30, 14)
ON CONFLICT DO NOTHING;

-- Add assigned_employee_id to vehicle_returns
ALTER TABLE public.vehicle_returns 
ADD COLUMN IF NOT EXISTS assigned_employee_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_employee_schedules_date ON public.employee_schedules(work_date);
CREATE INDEX IF NOT EXISTS idx_employee_schedules_employee ON public.employee_schedules(employee_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_returns_assigned_employee ON public.vehicle_returns(assigned_employee_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_returns_scheduled_date ON public.vehicle_returns(scheduled_return_date);

-- Enable RLS on new tables
ALTER TABLE public.employee_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_availability_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for employee_schedules
CREATE POLICY "Anyone can view employee schedules"
  ON public.employee_schedules FOR SELECT
  USING (true);

CREATE POLICY "Employees can insert their own schedules"
  ON public.employee_schedules FOR INSERT
  WITH CHECK (
    auth.uid() = employee_id OR 
    public.has_role(auth.uid(), 'admin'::app_role) OR
    public.has_role(auth.uid(), 'return_handler'::app_role)
  );

CREATE POLICY "Employees can update their own schedules"
  ON public.employee_schedules FOR UPDATE
  USING (
    auth.uid() = employee_id OR 
    public.has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Admins can delete schedules"
  ON public.employee_schedules FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for employee_availability_settings
CREATE POLICY "Anyone can view settings"
  ON public.employee_availability_settings FOR SELECT
  USING (true);

CREATE POLICY "Only admins can modify settings"
  ON public.employee_availability_settings FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Add triggers for updated_at
CREATE TRIGGER update_employee_schedules_updated_at
  BEFORE UPDATE ON public.employee_schedules
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_employee_availability_settings_updated_at
  BEFORE UPDATE ON public.employee_availability_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();