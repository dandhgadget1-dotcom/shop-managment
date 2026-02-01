# Troubleshooting Guide

## "Failed to fetch" Error

This error occurs when the frontend cannot connect to the API routes. Here's how to fix it:

### Step 1: Check if Next.js Server is Running

**Open a terminal and run:**
```bash
npm run dev
```

You should see:
```
▲ Next.js 16.0.8
- Local:        http://localhost:3000
```

If you see an error, check:
- Dependencies are installed (`npm install`)
- MongoDB connection string is correct in `.env.local`

### Step 2: Verify API Routes are Accessible

**Test the API routes directly:**
```bash
# Using curl
curl http://localhost:3000/api/health

# Or open in browser
http://localhost:3000/api/health
```

You should see:
```json
{"status":"OK","message":"Server is running"}
```

If this doesn't work, check:
- Next.js server is running
- MongoDB connection is working

### Step 3: Check Environment Variables

**Create `.env.local` in the root directory:**
```env
MONGODB_URI=mongodb://localhost:27017/shop-management
```

**Important:** 
- The file must be named `.env.local` (not `.env`)
- Restart the Next.js dev server after creating/updating this file
- No need for `NEXT_PUBLIC_API_URL` - API routes use relative paths (`/api`)

### Step 4: Restart the Server

1. **Stop the server** (Ctrl+C)
2. **Start Next.js:**
   ```bash
   npm run dev
   ```
3. **Wait for Next.js to start** (you'll see "Local: http://localhost:3000")

### Step 5: Check Browser Console

Open browser DevTools (F12) and check:
- **Console tab**: Look for any error messages
- **Network tab**: Check if requests to `/api/customers` are failing

### Common Issues

#### Issue: "Port 3000 already in use"
**Solution:**
1. Next.js will automatically use the next available port (3001, 3002, etc.)
2. Or specify a port:
   ```bash
   npm run dev -- -p 3001
   ```

#### Issue: MongoDB Connection Error
**Solution:**
1. Make sure MongoDB is running:
   ```bash
   # Windows
   net start MongoDB
   
   # Mac/Linux
   sudo systemctl start mongod
   ```
2. Or use MongoDB Atlas and update `MONGODB_URI` in `.env.local`
3. Check the connection string format in `.env.local`

#### Issue: CORS Errors
**Solution:**
With Next.js API routes, CORS is not an issue since everything runs on the same origin. If you see CORS errors:
1. Make sure you're using relative paths (`/api`) not absolute URLs
2. Clear browser cache and restart
3. Check that API routes are in `src/app/api/` directory

#### Issue: "Cannot find module"
**Solution:**
```bash
npm install
```

Make sure `mongoose` is installed:
```bash
npm install mongoose
```

#### Issue: Environment Variable Not Working
**Solution:**
1. File must be named `.env.local` (not `.env`)
2. Only `MONGODB_URI` is needed (no `NEXT_PUBLIC_` prefix needed)
3. Restart Next.js dev server after changes
4. Check that MongoDB connection is working

### Quick Checklist

- [ ] Next.js server is running (`npm run dev`)
- [ ] Next.js shows "Local: http://localhost:3000"
- [ ] MongoDB is running and connected
- [ ] `.env.local` exists in root directory
- [ ] `MONGODB_URI=mongodb://localhost:27017/shop-management` in `.env.local`
- [ ] Server restarted after environment changes
- [ ] `http://localhost:3000/api/health` works in browser
- [ ] `mongoose` is installed (`npm install mongoose`)

### Still Not Working?

1. **Check firewall**: Make sure port 3000 is not blocked
2. **Try different browser**: Clear cache and try incognito mode
3. **Check network**: Make sure no proxy is interfering
4. **Verify file locations**: 
   - `.env.local` should be in root directory (same level as `package.json`)
   - API routes should be in `src/app/api/` directory
5. **Check MongoDB connection**: Verify MongoDB is running and connection string is correct

### Getting Help

If you're still stuck, provide:
1. Next.js server logs
2. Browser console errors
3. Network tab showing the failed request
4. Contents of `.env.local` (without sensitive data)
5. Output of `curl http://localhost:3000/api/health`
6. MongoDB connection status

