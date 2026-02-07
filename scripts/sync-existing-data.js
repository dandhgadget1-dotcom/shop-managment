/**
 * Sync Existing Data Script
 * 
 * This script syncs all existing data from Supabase to MongoDB.
 * Run this once after setting up MongoDB to backfill existing data.
 * 
 * Usage: node scripts/sync-existing-data.js
 * 
 * Note: Make sure MONGODB_URI is set in your .env.local file
 */

import { createClient } from '@supabase/supabase-js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

// Load environment variables from .env.local
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, '..', '.env.local');

try {
  const envFile = readFileSync(envPath, 'utf8');
  envFile.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
      if (!process.env[key.trim()]) {
        process.env[key.trim()] = value;
      }
    }
  });
} catch (error) {
  console.warn('Could not load .env.local, using process.env directly');
}

// Also try dotenv as fallback
dotenv.config({ path: envPath });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const mongodbUri = process.env.MONGODB_URI;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Please define NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

if (!mongodbUri) {
  console.error('Error: Please define MONGODB_URI in .env.local');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Define schemas inline for the script
const CustomerSchema = new mongoose.Schema({}, { strict: false, _id: true });
const ShopSchema = new mongoose.Schema({}, { strict: false, _id: true });

const Customer = mongoose.models.Customer || mongoose.model('Customer', CustomerSchema);
const Shop = mongoose.models.Shop || mongoose.model('Shop', ShopSchema);

async function syncCustomers() {
  console.log('📦 Fetching customers from Supabase...');
  
  const { data: customers, error } = await supabaseAdmin
    .from('customers')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching customers:', error);
    return;
  }

  console.log(`Found ${customers.length} customers to sync`);

  let synced = 0;
  let errors = 0;

  for (const customer of customers) {
    try {
      const mongoData = {
        _id: customer.id,
        full_name: customer.full_name,
        id_no: customer.id_no,
        contact_info: customer.contact_info,
        address: customer.address,
        id_front: customer.id_front || null,
        id_back: customer.id_back || null,
        id_front_public_id: customer.id_front_public_id || null,
        id_back_public_id: customer.id_back_public_id || null,
        id_front_preview: customer.id_front_preview || null,
        id_back_preview: customer.id_back_preview || null,
        supporting_person: customer.supporting_person || null,
        phone: customer.phone || null,
        payment: customer.payment || null,
        created_at: customer.created_at ? new Date(customer.created_at) : new Date(),
        updated_at: customer.updated_at ? new Date(customer.updated_at) : new Date(),
      };

      await Customer.findByIdAndUpdate(
        customer.id,
        mongoData,
        { upsert: true, new: true }
      );

      synced++;
      if (synced % 10 === 0) {
        console.log(`  Synced ${synced}/${customers.length} customers...`);
      }
    } catch (error) {
      console.error(`Error syncing customer ${customer.id}:`, error.message);
      errors++;
    }
  }

  console.log(`✅ Customers sync complete: ${synced} synced, ${errors} errors`);
}

async function syncShop() {
  console.log('🏪 Fetching shop settings from Supabase...');
  
  const { data: shops, error } = await supabaseAdmin
    .from('shop')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error fetching shop settings:', error);
    return;
  }

  if (!shops || shops.length === 0) {
    console.log('No shop settings found in Supabase');
    return;
  }

  const shop = shops[0];

  try {
    const mongoData = {
      _id: shop.id,
      shop_name: shop.shop_name,
      shop_address: shop.shop_address,
      shop_phone: shop.shop_phone,
      shop_email: shop.shop_email,
      ntn_number: shop.ntn_number,
      footer_message: shop.footer_message,
      enable_auto_reminders: shop.enable_auto_reminders || false,
      enable_manual_reminders: shop.enable_manual_reminders !== undefined 
        ? shop.enable_manual_reminders 
        : true,
      reminder_days_ahead: shop.reminder_days_ahead || 7,
      created_at: shop.created_at ? new Date(shop.created_at) : new Date(),
      updated_at: shop.updated_at ? new Date(shop.updated_at) : new Date(),
    };

    await Shop.findByIdAndUpdate(
      shop.id,
      mongoData,
      { upsert: true, new: true }
    );

    console.log('✅ Shop settings synced successfully');
  } catch (error) {
    console.error('Error syncing shop settings:', error.message);
  }
}

async function main() {
  console.log('🚀 Starting data sync from Supabase to MongoDB...\n');

  try {
    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(mongodbUri);
    console.log('✅ Connected to MongoDB\n');

    // Sync customers
    await syncCustomers();
    console.log('');

    // Sync shop settings
    await syncShop();

    console.log('\n✨ Sync complete!');
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('📡 Disconnected from MongoDB');
  }
}

main();
