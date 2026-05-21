-- Car Hire Platform Initial Schema
-- Created for Raymells Car Hire

-- Create customer_profiles table
CREATE TABLE IF NOT EXISTS public.customer_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  license_number TEXT NOT NULL,
  license_expiry DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id),
  UNIQUE(license_number)
);

-- Create admin_staff table
CREATE TABLE IF NOT EXISTS public.admin_staff (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'staff')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id)
);

-- Create vehicles table
CREATE TABLE IF NOT EXISTS public.vehicles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  class TEXT NOT NULL CHECK (class IN ('economy', 'compact', 'midsize', 'luxury', 'suv', 'van')),
  registration_plate TEXT NOT NULL UNIQUE,
  year INT NOT NULL,
  fuel_type TEXT NOT NULL CHECK (fuel_type IN ('Gasoline', 'Diesel', 'Hybrid')),
  features JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'rented', 'maintenance', 'out-of-service')),
  current_latitude FLOAT,
  current_longitude FLOAT,
  last_location_update TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create vehicle_pricing table
CREATE TABLE IF NOT EXISTS public.vehicle_pricing (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  price_per_hour DECIMAL(10, 2) NOT NULL,
  price_per_day DECIMAL(10, 2) NOT NULL,
  price_per_week DECIMAL(10, 2) NOT NULL,
  price_per_month DECIMAL(10, 2) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(vehicle_id)
);

-- Create bookings table
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_ref TEXT NOT NULL UNIQUE,
  customer_id UUID NOT NULL REFERENCES public.customer_profiles(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id),
  pickup_date TIMESTAMP WITH TIME ZONE NOT NULL,
  return_date TIMESTAMP WITH TIME ZONE NOT NULL,
  rental_type TEXT NOT NULL CHECK (rental_type IN ('hourly', 'daily', 'weekly', 'monthly')),
  total_price DECIMAL(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'active', 'completed', 'cancelled')),
  pickup_location TEXT NOT NULL,
  return_location TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create vehicle_tracking table
CREATE TABLE IF NOT EXISTS public.vehicle_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  latitude FLOAT NOT NULL,
  longitude FLOAT NOT NULL,
  speed INT DEFAULT 0,
  heading INT DEFAULT 0,
  battery_percentage INT,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create vehicle_damage_reports table
CREATE TABLE IF NOT EXISTS public.vehicle_damage_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  report_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  damage_description TEXT NOT NULL,
  damage_images JSONB DEFAULT '[]'::jsonb,
  estimated_cost DECIMAL(10, 2),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_customer_profiles_user_id ON public.customer_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_staff_user_id ON public.admin_staff(user_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON public.vehicles(status);
CREATE INDEX IF NOT EXISTS idx_vehicles_class ON public.vehicles(class);
CREATE INDEX IF NOT EXISTS idx_bookings_customer_id ON public.bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_vehicle_id ON public.bookings(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_pickup_date ON public.bookings(pickup_date);
CREATE INDEX IF NOT EXISTS idx_vehicle_tracking_vehicle_id ON public.vehicle_tracking(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_tracking_recorded_at ON public.vehicle_tracking(recorded_at);
CREATE INDEX IF NOT EXISTS idx_damage_reports_booking_id ON public.vehicle_damage_reports(booking_id);

-- Enable RLS on all tables
ALTER TABLE public.customer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_damage_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for customer_profiles
CREATE POLICY "Users can view own profile"
  ON public.customer_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON public.customer_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON public.customer_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for admin_staff
CREATE POLICY "Admin staff can view all staff"
  ON public.admin_staff FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.admin_staff WHERE user_id = auth.uid()));

-- RLS Policies for vehicles (read access for all)
CREATE POLICY "Anyone can read vehicles"
  ON public.vehicles FOR SELECT
  USING (true);

CREATE POLICY "Only admin can modify vehicles"
  ON public.vehicles FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.admin_staff WHERE user_id = auth.uid()));

CREATE POLICY "Only admin can delete vehicles"
  ON public.vehicles FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.admin_staff WHERE user_id = auth.uid()));

CREATE POLICY "Only admin can insert vehicles"
  ON public.vehicles FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.admin_staff WHERE user_id = auth.uid()));

-- RLS Policies for vehicle_pricing (read access for all)
CREATE POLICY "Anyone can read pricing"
  ON public.vehicle_pricing FOR SELECT
  USING (true);

CREATE POLICY "Only admin can modify pricing"
  ON public.vehicle_pricing FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.admin_staff WHERE user_id = auth.uid()));

-- RLS Policies for bookings
CREATE POLICY "Customers can view own bookings"
  ON public.bookings FOR SELECT
  USING (
    customer_id IN (SELECT id FROM public.customer_profiles WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.admin_staff WHERE user_id = auth.uid())
  );

CREATE POLICY "Customers can create bookings"
  ON public.bookings FOR INSERT
  WITH CHECK (
    customer_id IN (SELECT id FROM public.customer_profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Customers can update own bookings"
  ON public.bookings FOR UPDATE
  USING (
    customer_id IN (SELECT id FROM public.customer_profiles WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.admin_staff WHERE user_id = auth.uid())
  );

-- RLS Policies for vehicle_tracking
CREATE POLICY "Anyone can read vehicle tracking"
  ON public.vehicle_tracking FOR SELECT
  USING (true);

CREATE POLICY "Only admin can update tracking"
  ON public.vehicle_tracking FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.admin_staff WHERE user_id = auth.uid()));

CREATE POLICY "Only admin can insert tracking data"
  ON public.vehicle_tracking FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.admin_staff WHERE user_id = auth.uid()));

-- RLS Policies for damage_reports
CREATE POLICY "Users can view damage reports for own bookings"
  ON public.vehicle_damage_reports FOR SELECT
  USING (
    booking_id IN (
      SELECT id FROM public.bookings 
      WHERE customer_id IN (SELECT id FROM public.customer_profiles WHERE user_id = auth.uid())
    )
    OR EXISTS (SELECT 1 FROM public.admin_staff WHERE user_id = auth.uid())
  );

CREATE POLICY "Customers can report damage on own bookings"
  ON public.vehicle_damage_reports FOR INSERT
  WITH CHECK (
    booking_id IN (
      SELECT id FROM public.bookings 
      WHERE customer_id IN (SELECT id FROM public.customer_profiles WHERE user_id = auth.uid())
    )
  );
