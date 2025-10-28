-- Allow public access to employee schedules for booking purposes
CREATE POLICY "Allow public read of available employee schedules"
ON employee_schedules
FOR SELECT
USING (is_available = true);

-- Allow public access to settings for booking purposes  
CREATE POLICY "Allow public read of availability settings"
ON employee_availability_settings
FOR SELECT
USING (true);

-- Allow public access to employee profiles for booking purposes
CREATE POLICY "Allow public read of employee profiles"
ON profiles
FOR SELECT
USING (true);