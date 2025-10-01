-- Add form fields to inquiries table
ALTER TABLE public.inquiries
ADD COLUMN IF NOT EXISTS vehicle TEXT,
ADD COLUMN IF NOT EXISTS competitor_vehicle TEXT,
ADD COLUMN IF NOT EXISTS gearbox TEXT,
ADD COLUMN IF NOT EXISTS promotion_code TEXT,
ADD COLUMN IF NOT EXISTS departure_date DATE,
ADD COLUMN IF NOT EXISTS return_date DATE,
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS number_of_people INTEGER,
ADD COLUMN IF NOT EXISTS tuba_pay_rental BOOLEAN,
ADD COLUMN IF NOT EXISTS what_to_rent TEXT,
ADD COLUMN IF NOT EXISTS travel_companions TEXT,
ADD COLUMN IF NOT EXISTS inquiry_type TEXT,
ADD COLUMN IF NOT EXISTS flexible_dates BOOLEAN,
ADD COLUMN IF NOT EXISTS height NUMERIC(3,2),
ADD COLUMN IF NOT EXISTS partner_height NUMERIC(3,2),
ADD COLUMN IF NOT EXISTS daily_car TEXT,
ADD COLUMN IF NOT EXISTS camper_experience BOOLEAN,
ADD COLUMN IF NOT EXISTS driver_license TEXT,
ADD COLUMN IF NOT EXISTS sports_equipment TEXT,
ADD COLUMN IF NOT EXISTS number_of_bikes INTEGER,
ADD COLUMN IF NOT EXISTS number_of_skis INTEGER,
ADD COLUMN IF NOT EXISTS vacation_type TEXT,
ADD COLUMN IF NOT EXISTS vacation_description TEXT,
ADD COLUMN IF NOT EXISTS countries TEXT,
ADD COLUMN IF NOT EXISTS planned_camping TEXT,
ADD COLUMN IF NOT EXISTS meals TEXT,
ADD COLUMN IF NOT EXISTS required_equipment TEXT,
ADD COLUMN IF NOT EXISTS number_of_fuel_tanks INTEGER,
ADD COLUMN IF NOT EXISTS camper_layout TEXT,
ADD COLUMN IF NOT EXISTS budget_from NUMERIC,
ADD COLUMN IF NOT EXISTS budget_to NUMERIC,
ADD COLUMN IF NOT EXISTS other_notes TEXT;

COMMENT ON COLUMN public.inquiries.vehicle IS 'Pojazd';
COMMENT ON COLUMN public.inquiries.competitor_vehicle IS 'Konkurencyjny pojazd';
COMMENT ON COLUMN public.inquiries.gearbox IS 'Skrzynia biegów';
COMMENT ON COLUMN public.inquiries.promotion_code IS 'Promocja / kod';
COMMENT ON COLUMN public.inquiries.departure_date IS 'Data wyjazdu';
COMMENT ON COLUMN public.inquiries.return_date IS 'Data powrotu';
COMMENT ON COLUMN public.inquiries.first_name IS 'Imię';
COMMENT ON COLUMN public.inquiries.last_name IS 'Nazwisko';
COMMENT ON COLUMN public.inquiries.phone IS 'Numer telefonu';
COMMENT ON COLUMN public.inquiries.number_of_people IS 'Ilość osób';
COMMENT ON COLUMN public.inquiries.tuba_pay_rental IS 'Chcę skorzystać z wynajmu kampera / przyczepy na raty Tuba Pay';
COMMENT ON COLUMN public.inquiries.what_to_rent IS 'Co chcesz wypożyczyć';
COMMENT ON COLUMN public.inquiries.travel_companions IS 'Z kim podróżujesz';
COMMENT ON COLUMN public.inquiries.inquiry_type IS 'Typ zapytania';
COMMENT ON COLUMN public.inquiries.flexible_dates IS 'Czy termin elastyczny';
COMMENT ON COLUMN public.inquiries.height IS 'Wzrost (m)';
COMMENT ON COLUMN public.inquiries.partner_height IS 'Wzrost partner';
COMMENT ON COLUMN public.inquiries.daily_car IS 'Auto na co dzień';
COMMENT ON COLUMN public.inquiries.camper_experience IS 'Czy prowadzileś kampera';
COMMENT ON COLUMN public.inquiries.driver_license IS 'Prawo jazdy';
COMMENT ON COLUMN public.inquiries.sports_equipment IS 'Sprzęt sportowy';
COMMENT ON COLUMN public.inquiries.number_of_bikes IS 'Liczba rowerów';
COMMENT ON COLUMN public.inquiries.number_of_skis IS 'Liczba nart';
COMMENT ON COLUMN public.inquiries.vacation_type IS 'Typ wakacji';
COMMENT ON COLUMN public.inquiries.vacation_description IS 'Opis wakacji';
COMMENT ON COLUMN public.inquiries.countries IS 'Kraje';
COMMENT ON COLUMN public.inquiries.planned_camping IS 'Planowany kemping';
COMMENT ON COLUMN public.inquiries.meals IS 'Posiłki';
COMMENT ON COLUMN public.inquiries.required_equipment IS 'Potrzebne wyposażenie';
COMMENT ON COLUMN public.inquiries.number_of_fuel_tanks IS 'Liczba paliw6w';
COMMENT ON COLUMN public.inquiries.camper_layout IS 'Układ kampera';
COMMENT ON COLUMN public.inquiries.budget_from IS 'Budżet od';
COMMENT ON COLUMN public.inquiries.budget_to IS 'Budżet do';
COMMENT ON COLUMN public.inquiries.other_notes IS 'Inne uwagi';