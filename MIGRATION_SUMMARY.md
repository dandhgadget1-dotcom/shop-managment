# MongoDB to Supabase Migration Summary

## ✅ Completed Migration Steps

### 1. Dependencies Updated
- ✅ Removed `mongoose` from `package.json`
- ✅ Added `@supabase/supabase-js` to `package.json`
- ✅ Installed new dependencies

### 2. Database Connection
- ✅ Created `src/lib/supabase.js` with Supabase client setup
- ✅ Deleted `src/lib/mongodb.js` (MongoDB connection)
- ✅ Deleted `src/lib/models/Customer.js` (Mongoose model)
- ✅ Deleted `src/lib/models/Shop.js` (Mongoose model)

### 3. API Routes Updated
All API routes have been converted from MongoDB/Mongoose to Supabase:

- ✅ `src/app/api/customers/route.js` - GET and POST
- ✅ `src/app/api/customers/[id]/route.js` - GET, PUT, DELETE
- ✅ `src/app/api/customers/[id]/payments/route.js` - POST
- ✅ `src/app/api/customers/[id]/payments/[paymentId]/route.js` - PUT, DELETE
- ✅ `src/app/api/shop/route.js` - GET, PUT
- ✅ `src/app/api/sms/send-reminder/route.js` - POST
- ✅ `src/app/api/sms/send-reminders/route.js` - POST, GET
- ✅ `src/app/api/cron/send-reminders/route.js` - GET

### 4. Data Transformation
- ✅ Created helper functions to transform data between camelCase (frontend) and snake_case (database)
- ✅ Handles ID transformation (Supabase UUID vs MongoDB ObjectId)
- ✅ Preserves all nested JSON structures (supportingPerson, phone, payment)

## 📋 Next Steps Required

### 1. Set Up Supabase Project
1. Go to https://app.supabase.com
2. Create a new project (or use existing)
3. Get your project credentials

### 2. Add Environment Variables
Add these to your `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

**How to get these:**
- Go to Supabase Dashboard → Settings → API
- Copy Project URL → `NEXT_PUBLIC_SUPABASE_URL`
- Copy anon/public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Copy service_role key → `SUPABASE_SERVICE_ROLE_KEY` (keep secret!)

### 3. Create Database Tables
Run the SQL scripts in `SUPABASE_MIGRATION.md` in your Supabase SQL Editor:

1. Create `customers` table
2. Create `shop` table
3. Set up Row Level Security policies
4. Create update triggers for `updated_at` timestamps

### 4. Remove Old Environment Variable
Remove this from `.env.local` (no longer needed):
```env
# MONGODB_URI=... (remove this)
```

## 🔄 Key Changes

### Column Naming Convention
- **MongoDB**: camelCase (`fullName`, `idNo`, `contactInfo`)
- **Supabase**: snake_case (`full_name`, `id_no`, `contact_info`)
- **Solution**: API routes automatically transform between formats

### ID Field
- **MongoDB**: `_id` (ObjectId)
- **Supabase**: `id` (UUID)
- **Solution**: API routes use `id` consistently

### Nested Objects
- Stored as JSONB in Supabase (e.g., `supporting_person`, `phone`, `payment`)
- Maintains same structure as MongoDB subdocuments

### Queries
- MongoDB: `Customer.find({ 'payment.paymentType': 'installment' })`
- Supabase: Fetch all customers, filter in JavaScript (since Supabase doesn't support nested field queries directly)

## 📝 Files Modified

### Created
- `src/lib/supabase.js` - Supabase client setup
- `SUPABASE_MIGRATION.md` - Detailed migration guide with SQL scripts

### Deleted
- `src/lib/mongodb.js`
- `src/lib/models/Customer.js`
- `src/lib/models/Shop.js`

### Modified
- `package.json` - Updated dependencies
- All API route files in `src/app/api/`

## ⚠️ Important Notes

1. **No Frontend Changes Required**: The API routes handle all data transformation, so your frontend code should work without changes.

2. **Data Migration**: If you have existing MongoDB data, you'll need to export and import it to Supabase. See `SUPABASE_MIGRATION.md` for details.

3. **Testing**: After setting up Supabase, test all CRUD operations:
   - Create customer
   - Read customers
   - Update customer
   - Delete customer
   - Add/update/delete payments
   - Update shop settings

4. **Row Level Security**: The migration includes RLS policies that allow the service role to bypass security. Adjust these if needed for your use case.

## 🐛 Troubleshooting

If you encounter errors:

1. **"Please define NEXT_PUBLIC_SUPABASE_URL"**
   - Check your `.env.local` file has the Supabase variables
   - Restart your dev server after adding env variables

2. **"relation 'customers' does not exist"**
   - Run the SQL scripts in Supabase SQL Editor
   - Check you're using the correct project

3. **"new row violates row-level security policy"**
   - Verify RLS policies are created correctly
   - Check you're using the service role key for server-side operations

## 📚 Documentation

See `SUPABASE_MIGRATION.md` for:
- Complete SQL schema setup
- Detailed environment variable instructions
- Data migration guide
- Troubleshooting tips
