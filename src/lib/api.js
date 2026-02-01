// Use relative paths for Next.js API routes
const API_BASE_URL = '/api';

// Log API base URL for debugging (only in development)
if (process.env.NODE_ENV === 'development') {
  console.log('API Base URL:', API_BASE_URL);
}

// Helper function to handle API responses
async function handleResponse(response) {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'An error occurred' }));
    throw new Error(error.message || 'An error occurred');
  }
  return response.json();
}

// Helper function to handle fetch errors
async function handleFetchError(error, url) {
  if (error instanceof TypeError && error.message === 'Failed to fetch') {
    console.error('❌ Backend server is not reachable:', url);
    console.error('Please make sure:');
    console.error('1. Backend server is running (cd server && npm run dev)');
    console.error('2. Backend is running on port 5000');
    console.error('3. CORS is enabled in backend');
    throw new Error('Cannot connect to backend server. Please make sure the backend is running on http://localhost:5000');
  }
  throw error;
}

// Customer API functions
export const customerAPI = {
  // Get all customers
  getAll: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/customers`);
      return handleResponse(response);
    } catch (error) {
      return handleFetchError(error, `${API_BASE_URL}/customers`);
    }
  },

  // Get single customer by ID
  getById: async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/customers/${id}`);
      return handleResponse(response);
    } catch (error) {
      return handleFetchError(error, `${API_BASE_URL}/customers/${id}`);
    }
  },

  // Create new customer
  create: async (customerData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/customers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(customerData),
      });
      return handleResponse(response);
    } catch (error) {
      return handleFetchError(error, `${API_BASE_URL}/customers`);
    }
  },

  // Update customer
  update: async (id, customerData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/customers/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(customerData),
      });
      return handleResponse(response);
    } catch (error) {
      return handleFetchError(error, `${API_BASE_URL}/customers/${id}`);
    }
  },

  // Delete customer
  delete: async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/customers/${id}`, {
        method: 'DELETE',
      });
      return handleResponse(response);
    } catch (error) {
      return handleFetchError(error, `${API_BASE_URL}/customers/${id}`);
    }
  },

  // Add payment record (for installments)
  addPayment: async (customerId, paymentData) => {
    const response = await fetch(`${API_BASE_URL}/customers/${customerId}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentData),
    });
    return handleResponse(response);
  },

  // Update payment record
  updatePayment: async (customerId, paymentId, paymentData) => {
    const response = await fetch(`${API_BASE_URL}/customers/${customerId}/payments/${paymentId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentData),
    });
    return handleResponse(response);
  },

  // Delete payment record
  deletePayment: async (customerId, paymentId) => {
    const response = await fetch(`${API_BASE_URL}/customers/${customerId}/payments/${paymentId}`, {
      method: 'DELETE',
    });
    return handleResponse(response);
  },
};

// Image upload API functions
export const uploadAPI = {
  // Upload image to Cloudinary
  upload: async (image, folder, publicId = null) => {
    try {
      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image, folder, publicId }),
      });
      return handleResponse(response);
    } catch (error) {
      return handleFetchError(error, `${API_BASE_URL}/upload`);
    }
  },

  // Delete image from Cloudinary
  delete: async (publicId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ publicId }),
      });
      return handleResponse(response);
    } catch (error) {
      return handleFetchError(error, `${API_BASE_URL}/upload`);
    }
  },
};

// Shop API functions
export const shopAPI = {
  // Get shop settings
  get: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/shop`);
      return handleResponse(response);
    } catch (error) {
      return handleFetchError(error, `${API_BASE_URL}/shop`);
    }
  },

  // Update shop settings
  update: async (shopData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/shop`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(shopData),
      });
      return handleResponse(response);
    } catch (error) {
      return handleFetchError(error, `${API_BASE_URL}/shop`);
    }
  },
};

// WhatsApp API functions (using /api/sms routes for backward compatibility)
export const smsAPI = {
  // Send WhatsApp reminder to a specific customer
  sendReminder: async (customerId, installmentNumber = null) => {
    try {
      const response = await fetch(`${API_BASE_URL}/sms/send-reminder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ customerId, installmentNumber }),
      });
      return handleResponse(response);
    } catch (error) {
      return handleFetchError(error, `${API_BASE_URL}/sms/send-reminder`);
    }
  },

  // Send WhatsApp reminders to all customers with upcoming installments
  sendReminders: async (daysAhead = 7, sendAll = false) => {
    try {
      const response = await fetch(`${API_BASE_URL}/sms/send-reminders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ daysAhead, sendAll }),
      });
      return handleResponse(response);
    } catch (error) {
      return handleFetchError(error, `${API_BASE_URL}/sms/send-reminders`);
    }
  },

  // Preview WhatsApp reminders without sending
  previewReminders: async (daysAhead = 7, sendAll = false) => {
    try {
      const response = await fetch(`${API_BASE_URL}/sms/send-reminders?daysAhead=${daysAhead}&sendAll=${sendAll}`);
      return handleResponse(response);
    } catch (error) {
      return handleFetchError(error, `${API_BASE_URL}/sms/send-reminders`);
    }
  },
};

