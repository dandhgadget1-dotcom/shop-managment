# Migration from Separate Server to Next.js API Routes

## What Changed

The project has been refactored from using a separate Express server to using Next.js API Routes. This is the recommended approach for Next.js projects.

## Benefits

1. **Single Project**: Everything is in one codebase
2. **Single Server**: No need to run two separate servers
3. **Simpler Deployment**: Deploy as a single Next.js application
4. **Better Integration**: API routes are part of the Next.js app
5. **Automatic Optimization**: Next.js handles API route optimization

## File Structure Changes

### Before (Separate Server)
```
shop-managment/
├── server/              # Separate Express server
│   ├── server.js
│   ├── routes/
│   ├── models/
│   └── config/
└── src/                 # Next.js frontend
```

### After (Next.js API Routes)
```
shop-managment/
├── src/
│   ├── app/
│   │   └── api/        # Next.js API routes
│   │       └── customers/
│   ├── lib/
│   │   ├── mongodb.js  # MongoDB connection
│   │   └── models/     # Mongoose models
│   └── components/
└── package.json         # Single package.json
```

## Migration Steps

### 1. Install Dependencies

```bash
npm install mongoose
```

### 2. Update Environment Variables

**Remove:**
- `server/.env` file
- `NEXT_PUBLIC_API_URL` from `.env.local` (no longer needed)

**Keep/Update:**
- `.env.local` in root with only:
  ```env
  MONGODB_URI=mongodb://localhost:27017/shop-management
  ```

### 3. Remove Old Server Files

You can now delete the `server/` folder:
```bash
rm -rf server/
```

### 4. Update API Client

The API client now uses relative paths (`/api`) instead of absolute URLs. No changes needed in your components - they'll automatically use the new API routes.

## API Endpoints (Unchanged)

All API endpoints remain the same:
- `GET /api/customers` - Get all customers
- `GET /api/customers/:id` - Get single customer
- `POST /api/customers` - Create customer
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer
- `POST /api/customers/:id/payments` - Add payment
- `PUT /api/customers/:id/payments/:paymentId` - Update payment
- `DELETE /api/customers/:id/payments/:paymentId` - Delete payment

## Running the Application

**Before:**
```bash
# Terminal 1
cd server
npm run dev

# Terminal 2
npm run dev
```

**After:**
```bash
# Single command
npm run dev
```

That's it! Everything runs on `http://localhost:3000`.

## Deployment

### Before
- Deploy frontend and backend separately
- Configure CORS between them
- Manage two deployments

### After
- Single deployment (Vercel, Netlify, etc.)
- No CORS configuration needed
- Simpler deployment process

## Notes

- MongoDB connection is cached globally to prevent multiple connections
- API routes use Next.js Route Handlers (App Router)
- All existing functionality remains the same
- No changes needed in frontend components

