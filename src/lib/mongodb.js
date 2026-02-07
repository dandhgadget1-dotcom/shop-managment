import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

// MongoDB is optional - app will work without it, just won't sync
let isMongoDBEnabled = !!MONGODB_URI;

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  // If MongoDB is not configured, return null (sync will be skipped)
  if (!isMongoDBEnabled) {
    return null;
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts)
      .then((mongoose) => {
        console.log('[MongoDB] Connected successfully');
        return mongoose;
      })
      .catch((error) => {
        // Clear the promise so we can retry
        cached.promise = null;
        
        // Provide helpful error messages
        if (error.message.includes('Authentication failed') || error.message.includes('bad auth')) {
          console.error('[MongoDB] Authentication failed. Please check:');
          console.error('  1. Username and password in MONGODB_URI are correct');
          console.error('  2. Database user has proper permissions');
          console.error('  3. Connection string format is correct');
          console.error('  4. If using MongoDB Atlas, check Network Access settings');
        } else if (error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo')) {
          console.error('[MongoDB] Connection failed. Please check:');
          console.error('  1. MongoDB server is running (if local)');
          console.error('  2. Connection string hostname is correct');
          console.error('  3. Network connectivity');
        } else {
          console.error('[MongoDB] Connection error:', error.message);
        }
        
        throw error;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectDB;
