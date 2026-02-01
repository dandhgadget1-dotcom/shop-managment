
-- ============================================
-- Supabase Migration Script
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Create customers table
CREATE TABLE IF NOT EXISTS customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  id_no TEXT NOT NULL,
  contact_info TEXT NOT NULL,
  address TEXT NOT NULL,
  id_front TEXT,
  id_back TEXT,
  id_front_public_id TEXT,
  id_back_public_id TEXT,
  id_front_preview TEXT,
  id_back_preview TEXT,
  supporting_person JSONB,
  phone JSONB,
  payment JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create indexes for customers
CREATE INDEX IF NOT EXISTS idx_customers_id_no ON customers(id_no);
CREATE INDEX IF NOT EXISTS idx_customers_created_at ON customers(created_at DESC);

-- 3. Enable Row Level Security for customers
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policy for customers
DROP POLICY IF EXISTS "Service role can do everything" ON customers;
CREATE POLICY "Service role can do everything" ON customers
  FOR ALL
  USING (auth.role() = 'service_role');

-- 5. Create shop table
CREATE TABLE IF NOT EXISTS shop (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_name TEXT DEFAULT '',
  shop_address TEXT DEFAULT '',
  shop_phone TEXT DEFAULT '',
  shop_email TEXT DEFAULT '',
  ntn_number TEXT DEFAULT '',
  footer_message TEXT DEFAULT 'Thank you for your business!',
  enable_auto_reminders BOOLEAN DEFAULT false,
  enable_manual_reminders BOOLEAN DEFAULT true,
  reminder_days_ahead INTEGER DEFAULT 7 CHECK (reminder_days_ahead >= 1 AND reminder_days_ahead <= 30),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Enable Row Level Security for shop
ALTER TABLE shop ENABLE ROW LEVEL SECURITY;

-- 7. Create RLS policy for shop
DROP POLICY IF EXISTS "Service role can do everything" ON shop;
CREATE POLICY "Service role can do everything" ON shop
  FOR ALL
  USING (auth.role() = 'service_role');

-- 8. Create update_updated_at_column function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. Create trigger for customers updated_at
DROP TRIGGER IF EXISTS update_customers_updated_at ON customers;
CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 10. Create trigger for shop updated_at
DROP TRIGGER IF EXISTS update_shop_updated_at ON shop;
CREATE TRIGGER update_shop_updated_at
  BEFORE UPDATE ON shop
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
