# Supabase Migration Guide

This document outlines the migration from MongoDB to Supabase and the required environment variables.

## Environment Variables

Add the following environment variables to your `.env.local` file:

### Required Supabase Variables

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### How to Get These Values

1. Go to your Supabase project dashboard: https://app.supabase.com
2. Navigate to **Settings** → **API**
3. Copy the following:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` (keep this secret!)

### Other Environment Variables (Keep Existing)

You should still have these variables from your previous setup:

```env
# Cloudinary (if using)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Twilio (if using SMS)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number

# Admin Credentials
USER_NAME=your_admin_username
USER_PASSWORD=your_admin_password

# Cron Secret (optional)
CRON_SECRET=your_cron_secret
```

## Database Schema Setup

You need to create two tables in Supabase:

### 1. Customers Table

Run this SQL in your Supabase SQL Editor:

```sql
CREATE TABLE customers (
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

-- Create index for faster lookups
CREATE INDEX idx_customers_id_no ON customers(id_no);
CREATE INDEX idx_customers_created_at ON customers(created_at DESC);

-- Enable Row Level Security (optional, but recommended)
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Create policy to allow service role full access
CREATE POLICY "Service role can do everything" ON customers
  FOR ALL
  USING (auth.role() = 'service_role');
```

### 2. Shop Table

Run this SQL in your Supabase SQL Editor:

```sql
CREATE TABLE shop (
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

-- Enable Row Level Security
ALTER TABLE shop ENABLE ROW LEVEL SECURITY;

-- Create policy to allow service role full access
CREATE POLICY "Service role can do everything" ON shop
  FOR ALL
  USING (auth.role() = 'service_role');
```

### 3. Update Trigger for updated_at

Create a function to automatically update the `updated_at` timestamp:

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to customers table
CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply to shop table
CREATE TRIGGER update_shop_updated_at
  BEFORE UPDATE ON shop
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

## Migration Steps

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Set Up Supabase Project**
   - Create a new project at https://app.supabase.com
   - Run the SQL scripts above in the SQL Editor

3. **Update Environment Variables**
   - Add Supabase credentials to `.env.local`
   - Remove `MONGODB_URI` (no longer needed)

4. **Test the Application**
   - Start the development server: `npm run dev`
   - Test creating, reading, updating, and deleting customers
   - Test shop settings

## Data Migration (If You Have Existing MongoDB Data)

If you have existing data in MongoDB that you want to migrate:

1. Export your MongoDB data to JSON
2. Transform the data to match the Supabase schema (snake_case for column names)
3. Use Supabase's import feature or write a migration script

## Key Changes

### Column Naming
- MongoDB used camelCase (e.g., `fullName`)
- Supabase uses snake_case (e.g., `full_name`)
- The API routes handle the transformation automatically

### ID Field
- MongoDB used `_id` (ObjectId)
- Supabase uses `id` (UUID)
- The API routes transform `id` to match frontend expectations

### JSON Fields
- Nested objects (supportingPerson, phone, payment) are stored as JSONB in Supabase
- This allows for flexible schema and efficient querying

### Queries
- MongoDB queries like `Customer.find()` are replaced with Supabase queries like `supabaseAdmin.from('customers').select('*')`
- Nested field queries (e.g., `'payment.paymentType': 'installment'`) are handled by fetching all records and filtering in JavaScript

## Troubleshooting

### Error: "Please define NEXT_PUBLIC_SUPABASE_URL"
- Make sure you've added the Supabase environment variables to `.env.local`
- Restart your development server after adding environment variables

### Error: "relation 'customers' does not exist"
- Make sure you've run the SQL scripts to create the tables in Supabase
- Check that you're using the correct project

### Error: "new row violates row-level security policy"
- Make sure you've created the RLS policies as shown above
- The service role key should bypass RLS, but check your policies

## Next Steps

1. Remove the old MongoDB connection code (already done)
2. Test all API endpoints
3. Verify data is being saved correctly in Supabase
4. Update any frontend code if needed (should work as-is due to transformation functions)
