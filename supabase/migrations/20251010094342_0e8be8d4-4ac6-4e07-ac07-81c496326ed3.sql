-- Update RLS policies to include admin_return_handler role

-- Profiles table - allow admin_return_handler to manage profiles
DROP POLICY IF EXISTS "Only admins can insert profiles" ON public.profiles;
CREATE POLICY "Admins and admin_return_handlers can insert profiles"
ON public.profiles
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'admin_return_handler'::app_role));

DROP POLICY IF EXISTS "Only admins can update profiles" ON public.profiles;
CREATE POLICY "Admins and admin_return_handlers can update profiles"
ON public.profiles
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'admin_return_handler'::app_role));

DROP POLICY IF EXISTS "Only admins can delete profiles" ON public.profiles;
CREATE POLICY "Admins and admin_return_handlers can delete profiles"
ON public.profiles
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'admin_return_handler'::app_role));

-- User roles table - allow admin_return_handler to manage roles
DROP POLICY IF EXISTS "Only admins can insert user roles" ON public.user_roles;
CREATE POLICY "Admins and admin_return_handlers can insert user roles"
ON public.user_roles
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'admin_return_handler'::app_role));

DROP POLICY IF EXISTS "Only admins can update user roles" ON public.user_roles;
CREATE POLICY "Admins and admin_return_handlers can update user roles"
ON public.user_roles
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'admin_return_handler'::app_role));

DROP POLICY IF EXISTS "Only admins can delete user roles" ON public.user_roles;
CREATE POLICY "Admins and admin_return_handlers can delete user roles"
ON public.user_roles
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'admin_return_handler'::app_role));

-- Employee schedules - allow admin_return_handler same access as return_handler
DROP POLICY IF EXISTS "Employees can insert their own schedules" ON public.employee_schedules;
CREATE POLICY "Employees can insert their own schedules"
ON public.employee_schedules
FOR INSERT
WITH CHECK (
  (auth.uid() = employee_id) OR 
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'return_handler'::app_role) OR
  has_role(auth.uid(), 'admin_return_handler'::app_role)
);

DROP POLICY IF EXISTS "Employees can update their own schedules" ON public.employee_schedules;
CREATE POLICY "Employees can update their own schedules"
ON public.employee_schedules
FOR UPDATE
USING (
  (auth.uid() = employee_id) OR 
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'admin_return_handler'::app_role)
);

DROP POLICY IF EXISTS "Admins can delete schedules" ON public.employee_schedules;
CREATE POLICY "Admins and admin_return_handlers can delete schedules"
ON public.employee_schedules
FOR DELETE
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'admin_return_handler'::app_role)
);

-- Employee availability settings
DROP POLICY IF EXISTS "Only admins can modify settings" ON public.employee_availability_settings;
CREATE POLICY "Admins and admin_return_handlers can modify settings"
ON public.employee_availability_settings
FOR ALL
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'admin_return_handler'::app_role)
);