# Shop Management System

A full-stack shop management system for managing customers, phone sales, and installment payments.

## Features

- **Customer Management**: Add, edit, and delete customer information
- **Supporting Person**: Track supporting person details for each customer
- **Phone Inventory**: Manage phone details (name, model, IMEI, price)
- **Payment Management**: 
  - Direct payment option
  - Installment payment plans with interest calculation
  - Payment tracking and ledger
- **Statistics Dashboard**: View sales, payments, and customer statistics

## Tech Stack

### Frontend
- Next.js 16
- React 19
- Tailwind CSS
- Radix UI Components
- Context API for state management

### Backend
- Next.js API Routes
- MongoDB with Mongoose
- RESTful API

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd shop-managment
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**

   Create a `.env.local` file in the root directory:
   ```env
   MONGODB_URI=mongodb://localhost:27017/shop-management
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

   **Note:** 
   - If using MongoDB Atlas, replace the connection string with your Atlas URI.
   - For Cloudinary setup:
     1. Sign up at [Cloudinary](https://cloudinary.com/)
     2. Go to your Dashboard
     3. Copy your Cloud Name, API Key, and API Secret
     4. Add them to your `.env.local` file

4. **Start MongoDB**

   Make sure MongoDB is running on your system. If using MongoDB Atlas, update the `MONGODB_URI` in `.env.local`.

5. **Start the development server**
   ```bash
   npm run dev
   ```

   The application will run on `http://localhost:3000`
   - Frontend: `http://localhost:3000`
   - API Routes: `http://localhost:3000/api`

## API Endpoints

### Customers

- `GET /api/customers` - Get all customers
- `GET /api/customers/:id` - Get single customer
- `POST /api/customers` - Create new customer
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer

### Payments

- `POST /api/customers/:id/payments` - Add payment record (for installments)
- `PUT /api/customers/:id/payments/:paymentId` - Update payment record
- `DELETE /api/customers/:id/payments/:paymentId` - Delete payment record

## Project Structure

```
shop-managment/
├── server/                 # Backend API
│   ├── config/            # Database configuration
│   ├── models/            # MongoDB models
│   ├── routes/            # API routes
│   ├── server.js          # Express server
│   └── package.json
├── src/
│   ├── app/               # Next.js app directory
│   ├── components/        # React components
│   ├── context/           # React Context providers
│   └── lib/               # Utility functions and API client
└── package.json
```

## Usage

1. **Add a Customer**: Click "Add Customer" button and fill in the customer details, supporting person information, and phone details.

2. **Manage Payments**: 
   - Select a customer and click "Add Payment"
   - Choose between "Direct Purchase" or "Installment Plan"
   - For installments, set down payment, interest rate, and number of installments

3. **View Installments**: Click "View Installments" on a customer with an installment plan to see the payment schedule and record payments.

4. **View Statistics**: The dashboard shows total sold, pending, paid amounts, and customer statistics.

## Development

### Backend Development

```bash
cd server
npm run dev  # Uses nodemon for auto-reload
```

### Frontend Development

```bash
npm run dev  # Next.js development server
```

## Production Build

### Build Frontend

```bash
npm run build
npm start
```

### Start Backend

```bash
cd server
npm start
```

## Notes

- The system stores ID card images as base64 strings in the database. For production, consider using a file storage service (AWS S3, Cloudinary, etc.)
- Make sure to secure your MongoDB connection string in production
- Add authentication and authorization for production use

## License

MIT
