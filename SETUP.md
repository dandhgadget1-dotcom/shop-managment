# Setup Guide

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

This will install all dependencies including Next.js and Mongoose.

### 2. Set Up MongoDB

**Option A: Local MongoDB**
1. Install MongoDB on your system
2. Start MongoDB service
3. Use connection string: `mongodb://localhost:27017/shop-management`

**Option B: MongoDB Atlas (Cloud)**
1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a cluster
3. Get your connection string
4. Update the connection string in server `.env` file

### 3. Configure Environment Variables

**Create `.env.local` in the root directory:**
```env
MONGODB_URI=mongodb://localhost:27017/shop-management
```

**Note:** If using MongoDB Atlas, replace with your Atlas connection string.

### 4. Start the Application

```bash
npm run dev
```

### 5. Access the Application

- Application: http://localhost:3000
- API Routes: http://localhost:3000/api

## Troubleshooting

### MongoDB Connection Issues

1. **Check if MongoDB is running:**
   ```bash
   # Windows
   net start MongoDB
   
   # Mac/Linux
   sudo systemctl start mongod
   ```

2. **Verify connection string format:**
   - Local: `mongodb://localhost:27017/shop-management`
   - Atlas: `mongodb+srv://username:password@cluster.mongodb.net/shop-management`

### CORS Issues

With Next.js API routes, CORS is not an issue since everything runs on the same origin. If you see CORS errors:
- Make sure you're using relative paths (`/api`) in API calls
- Check that API routes are in `src/app/api/` directory

### Port Already in Use

If port 3000 is already in use:
- Next.js will automatically use the next available port (3001, 3002, etc.)
- Or specify a port: `npm run dev -- -p 3001`

## Testing the API

You can test the API using curl or Postman:

```bash
# Get all customers
curl http://localhost:3000/api/customers

# Health check
curl http://localhost:3000/api/health
```

## Next Steps

1. Add authentication (recommended for production)
2. Set up file storage for ID images (AWS S3, Cloudinary, etc.)
3. Add input validation and sanitization
4. Set up error logging
5. Configure production environment variables

