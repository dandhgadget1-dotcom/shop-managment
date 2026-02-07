/**
 * Database Sync Service
 * 
 * This service mirrors all Supabase operations to MongoDB for backup purposes.
 * It ensures both databases stay in sync by replicating CREATE, UPDATE, and DELETE operations.
 * 
 * All operations are wrapped in try-catch to ensure Supabase operations never fail
 * due to MongoDB sync issues.
 */

import connectDB from './mongodb';
import Customer from './models/Customer';
import Shop from './models/Shop';

/**
 * Sync customer data to MongoDB
 * @param {Object} customerData - Customer data from Supabase (snake_case format)
 * @param {string} operation - 'create', 'update', or 'delete'
 */
export async function syncCustomer(customerData, operation = 'create') {
  try {
    const db = await connectDB();
    if (!db) {
      // MongoDB not configured or connection failed - skip sync silently
      return;
    }

    if (operation === 'delete') {
      // Delete from MongoDB
      await Customer.findByIdAndDelete(customerData.id);
      console.log(`[DB Sync] Customer deleted from MongoDB: ${customerData.id}`);
      return;
    }

    // Prepare data for MongoDB (using Supabase UUID as _id)
    const mongoData = {
      _id: customerData.id,
      full_name: customerData.full_name,
      id_no: customerData.id_no,
      contact_info: customerData.contact_info,
      address: customerData.address,
      id_front: customerData.id_front || null,
      id_back: customerData.id_back || null,
      id_front_public_id: customerData.id_front_public_id || null,
      id_back_public_id: customerData.id_back_public_id || null,
      id_front_preview: customerData.id_front_preview || null,
      id_back_preview: customerData.id_back_preview || null,
      supporting_person: customerData.supporting_person || null,
      phone: customerData.phone || null,
      payment: customerData.payment || null,
      created_at: customerData.created_at ? new Date(customerData.created_at) : new Date(),
      updated_at: customerData.updated_at ? new Date(customerData.updated_at) : new Date(),
    };

    if (operation === 'create') {
      // Create new customer in MongoDB
      await Customer.create(mongoData);
      console.log(`[DB Sync] Customer created in MongoDB: ${customerData.id}`);
    } else if (operation === 'update') {
      // Update existing customer in MongoDB
      await Customer.findByIdAndUpdate(
        customerData.id,
        mongoData,
        { upsert: true, new: true } // upsert: create if doesn't exist
      );
      console.log(`[DB Sync] Customer updated in MongoDB: ${customerData.id}`);
    }
  } catch (error) {
    // Log error but don't throw - we don't want MongoDB sync failures to break Supabase operations
    console.error(`[DB Sync] Error syncing customer to MongoDB:`, {
      operation,
      customerId: customerData?.id,
      error: error.message,
    });
  }
}

/**
 * Sync shop data to MongoDB
 * @param {Object} shopData - Shop data from Supabase (snake_case format)
 * @param {string} operation - 'create' or 'update'
 */
export async function syncShop(shopData, operation = 'create') {
  try {
    const db = await connectDB();
    if (!db) {
      // MongoDB not configured or connection failed - skip sync silently
      return;
    }

    // Prepare data for MongoDB (using Supabase UUID as _id)
    const mongoData = {
      _id: shopData.id,
      shop_name: shopData.shop_name,
      shop_address: shopData.shop_address,
      shop_phone: shopData.shop_phone,
      shop_email: shopData.shop_email,
      ntn_number: shopData.ntn_number,
      footer_message: shopData.footer_message,
      enable_auto_reminders: shopData.enable_auto_reminders || false,
      enable_manual_reminders: shopData.enable_manual_reminders !== undefined 
        ? shopData.enable_manual_reminders 
        : true,
      reminder_days_ahead: shopData.reminder_days_ahead || 7,
      created_at: shopData.created_at ? new Date(shopData.created_at) : new Date(),
      updated_at: shopData.updated_at ? new Date(shopData.updated_at) : new Date(),
    };

    if (operation === 'create') {
      // Create new shop in MongoDB
      await Shop.create(mongoData);
      console.log(`[DB Sync] Shop created in MongoDB: ${shopData.id}`);
    } else if (operation === 'update') {
      // Update existing shop in MongoDB
      await Shop.findByIdAndUpdate(
        shopData.id,
        mongoData,
        { upsert: true, new: true } // upsert: create if doesn't exist
      );
      console.log(`[DB Sync] Shop updated in MongoDB: ${shopData.id}`);
    }
  } catch (error) {
    // Log error but don't throw - we don't want MongoDB sync failures to break Supabase operations
    console.error(`[DB Sync] Error syncing shop to MongoDB:`, {
      operation,
      shopId: shopData?.id,
      error: error.message,
    });
  }
}

/**
 * Sync customer deletion to MongoDB
 * @param {string} customerId - Customer ID to delete
 */
export async function syncCustomerDelete(customerId) {
  try {
    const db = await connectDB();
    if (!db) {
      // MongoDB not configured or connection failed - skip sync silently
      return;
    }
    await Customer.findByIdAndDelete(customerId);
    console.log(`[DB Sync] Customer deleted from MongoDB: ${customerId}`);
  } catch (error) {
    console.error(`[DB Sync] Error deleting customer from MongoDB:`, {
      customerId,
      error: error.message,
    });
  }
}
