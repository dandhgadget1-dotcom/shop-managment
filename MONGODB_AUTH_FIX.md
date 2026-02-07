# Fixing MongoDB Authentication Error

## Error Message
```
[DB Sync] Error syncing customer to MongoDB: {
  operation: 'create',
  customerId: '...',
  error: 'bad auth : Authentication failed.'
}
```

## What This Means
Your MongoDB connection string has incorrect credentials or the database user doesn't have proper permissions.

## How to Fix

### If Using MongoDB Atlas (Cloud)

1. **Check Your Connection String Format**
   ```
   mongodb+srv://USERNAME:PASSWORD@cluster.mongodb.net/DATABASE_NAME?retryWrites=true&w=majority
   ```
   
   Make sure:
   - `USERNAME` and `PASSWORD` are URL-encoded (special characters replaced)
   - No spaces in username or password
   - Password doesn't contain `@`, `:`, `/`, `?`, `#`, `[`, `]`

2. **Verify Database User**
   - Go to MongoDB Atlas Dashboard
   - Click "Database Access"
   - Find your user and verify username/password
   - If password has special characters, you need to URL-encode them:
     - `@` → `%40`
     - `:` → `%3A`
     - `/` → `%2F`
     - `#` → `%23`
     - ` ` (space) → `%20`

3. **Check User Permissions**
   - In "Database Access", click on your user
   - Make sure they have "Read and write to any database" or at least access to your database
   - If using custom role, ensure it has `find`, `insert`, `update`, `delete` permissions

4. **Check Network Access**
   - Go to "Network Access" in Atlas
   - Make sure your IP address is whitelisted (or use `0.0.0.0/0` for development)
   - Wait a few minutes after adding IP address

5. **Test Connection String**
   - Copy your connection string from Atlas
   - Format: `mongodb+srv://username:password@cluster.mongodb.net/shop-management?retryWrites=true&w=majority`
   - Replace `username`, `password`, `cluster`, and `shop-management` with your values

### If Using Local MongoDB

1. **Check MongoDB is Running**
   ```bash
   # Windows
   net start MongoDB
   
   # Or check services
   services.msc
   ```

2. **Verify Connection String**
   ```
   mongodb://localhost:27017/shop-management
   ```
   
   Or with authentication:
   ```
   mongodb://username:password@localhost:27017/shop-management
   ```

3. **Check MongoDB User**
   - Connect to MongoDB shell: `mongosh`
   - Check users: `use admin` then `db.getUsers()`
   - Verify user has permissions on your database

## Common Issues

### Issue 1: Password Contains Special Characters
**Solution**: URL-encode special characters in password
- Example: If password is `my@pass#123`, use `my%40pass%23123` in connection string

### Issue 2: Wrong Database Name
**Solution**: Make sure database name in connection string matches what you're using
- Connection string: `mongodb+srv://...@cluster.mongodb.net/shop-management`
- Database name: `shop-management`

### Issue 3: User Doesn't Exist
**Solution**: Create a new database user in MongoDB Atlas
1. Go to "Database Access"
2. Click "Add New Database User"
3. Choose "Password" authentication
4. Set username and password
5. Set privileges to "Read and write to any database" (or specific database)

### Issue 4: Connection String Format Wrong
**Solution**: Use the exact format from MongoDB Atlas
- Click "Connect" → "Connect your application"
- Copy the connection string
- Replace `<password>` with your actual password (URL-encoded if needed)

## Testing Your Connection

After updating your `.env.local` file:

1. **Restart your dev server**
   ```bash
   npm run dev
   ```

2. **Try creating a customer**
   - If sync works, you'll see: `[DB Sync] Customer created in MongoDB: <uuid>`
   - If it fails, check console for the specific error

3. **Check MongoDB Atlas Dashboard**
   - Go to "Collections"
   - You should see `customers` and `shops` collections
   - Data should appear after operations

## Quick Fix Checklist

- [ ] Connection string is in `.env.local` as `MONGODB_URI=...`
- [ ] Username and password are correct
- [ ] Password is URL-encoded if it has special characters
- [ ] Database user has read/write permissions
- [ ] Network access is configured (if using Atlas)
- [ ] Connection string format is correct
- [ ] Restarted dev server after changes

## Still Having Issues?

1. **Check the exact error message** in your console
2. **Verify connection string** by testing it in MongoDB Compass or mongosh
3. **Try creating a new database user** with a simple password (no special characters)
4. **Check MongoDB Atlas status** - make sure cluster is running

## Note

The app will continue to work even if MongoDB sync fails - it just won't backup to MongoDB. The error is logged but doesn't break your Supabase operations.
