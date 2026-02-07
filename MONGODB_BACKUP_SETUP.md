# MongoDB Backup Setup Guide

This document explains how to set up MongoDB as a backup database for your Supabase primary database.

## Overview

The system now automatically syncs all data operations from Supabase to MongoDB in the background. This provides a disaster recovery solution where:

- **Supabase** remains the primary database (current system)
- **MongoDB** acts as a backup database (exact copy)
- All CREATE, UPDATE, and DELETE operations are automatically mirrored
- If Supabase fails, you can switch to MongoDB seamlessly

## Setup Instructions

### 1. Install MongoDB

You can use either:
- **MongoDB Atlas** (Cloud - Recommended): https://www.mongodb.com/cloud/atlas
- **Local MongoDB**: Install MongoDB locally on your machine

### 2. Get MongoDB Connection String

#### For MongoDB Atlas:
1. Create a free account at https://www.mongodb.com/cloud/atlas
2. Create a new cluster
3. Go to "Database Access" and create a database user
4. Go to "Network Access" and add your IP address (or 0.0.0.0/0 for development)
5. Click "Connect" → "Connect your application"
6. Copy the connection string (it will look like: `mongodb+srv://username:password@cluster.mongodb.net/dbname?retryWrites=true&w=majority`)

#### For Local MongoDB:
- Connection string: `mongodb://localhost:27017/shop-management`

### 3. Add Environment Variable

Add the MongoDB connection string to your `.env.local` file:

```env
# MongoDB Backup Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/shop-management?retryWrites=true&w=majority
```

**Important**: Replace `username`, `password`, `cluster`, and `dbname` with your actual MongoDB credentials.

### 4. Restart Your Development Server

After adding the environment variable, restart your Next.js development server:

```bash
npm run dev
```

## How It Works

### Automatic Sync

The system automatically syncs data in the background:

1. **Customer Operations**:
   - Creating a customer → Synced to MongoDB
   - Updating a customer → Synced to MongoDB
   - Deleting a customer → Synced to MongoDB
   - Adding/updating/deleting payments → Synced to MongoDB

2. **Shop Settings**:
   - Creating shop settings → Synced to MongoDB
   - Updating shop settings → Synced to MongoDB

### Sync Behavior

- **Non-blocking**: MongoDB sync happens asynchronously and won't slow down your Supabase operations
- **Error handling**: If MongoDB sync fails, it logs an error but doesn't affect your Supabase operations
- **Exact copy**: MongoDB stores the exact same data structure as Supabase
- **ID mapping**: Supabase UUIDs are used as MongoDB `_id` to maintain exact sync

## Verifying Sync

### Check MongoDB Connection

The sync service logs operations to the console. Look for messages like:
```
[DB Sync] Customer created in MongoDB: <uuid>
[DB Sync] Customer updated in MongoDB: <uuid>
[DB Sync] Customer deleted from MongoDB: <uuid>
```

### Check for Errors

If sync fails, you'll see error messages in the console:
```
[DB Sync] Error syncing customer to MongoDB: { ... }
```

These errors won't break your application, but you should investigate them.

## Syncing Existing Data

If you already have data in Supabase and want to sync it to MongoDB, you can use the provided sync script:

```bash
npm run sync:mongodb
```

Or directly:

```bash
node scripts/sync-existing-data.js
```

This script will:
1. Fetch all customers from Supabase
2. Fetch all shop settings from Supabase
3. Sync them to MongoDB

**Note**: This script only needs to be run once to backfill existing data. All new operations will be automatically synced.

## Disaster Recovery

### If Supabase Fails

If Supabase becomes unavailable, you can:

1. **Temporarily switch to MongoDB** by modifying your API routes to read from MongoDB instead of Supabase
2. **Restore data** from MongoDB back to Supabase once it's back online
3. **Use MongoDB as primary** until Supabase is restored

### Switching to MongoDB (Emergency)

To temporarily use MongoDB as primary:

1. Update `src/lib/supabase.js` to add a fallback mechanism
2. Or modify API routes to check Supabase first, then fallback to MongoDB
3. Once Supabase is restored, switch back and sync any new data

## Troubleshooting

### MongoDB Connection Errors

**Error**: "Please define the MONGODB_URI environment variable"
- **Solution**: Add `MONGODB_URI` to your `.env.local` file

**Error**: "MongoServerError: Authentication failed"
- **Solution**: Check your MongoDB username and password in the connection string

**Error**: "MongoNetworkError: connect ECONNREFUSED"
- **Solution**: Check your MongoDB connection string and network access settings

### Sync Not Working

1. Check console logs for sync errors
2. Verify MongoDB connection string is correct
3. Ensure MongoDB is accessible from your server
4. Check that MongoDB database and collections are created (they're created automatically on first sync)

## Data Structure

MongoDB collections mirror Supabase tables:

- **customers** collection → `customers` table in Supabase
- **shops** collection → `shop` table in Supabase

Both use the same data structure and field names (snake_case format).

## Best Practices

1. **Monitor sync logs**: Regularly check console logs for sync errors
2. **Test MongoDB connection**: Periodically verify MongoDB is accessible
3. **Backup MongoDB**: Consider backing up MongoDB as well for extra safety
4. **Monitor storage**: MongoDB Atlas free tier has storage limits
5. **Keep credentials secure**: Never commit `.env.local` to version control

## Support

If you encounter issues:
1. Check the console logs for detailed error messages
2. Verify all environment variables are set correctly
3. Test MongoDB connection independently
4. Review MongoDB Atlas dashboard for connection issues
