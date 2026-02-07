import mongoose from 'mongoose';

const ShopSchema = new mongoose.Schema(
  {
    // Use Supabase UUID as _id to maintain exact sync
    _id: {
      type: String,
      required: true,
    },
    shop_name: String,
    shop_address: String,
    shop_phone: String,
    shop_email: String,
    ntn_number: String,
    footer_message: String,
    enable_auto_reminders: {
      type: Boolean,
      default: false,
    },
    enable_manual_reminders: {
      type: Boolean,
      default: true,
    },
    reminder_days_ahead: {
      type: Number,
      default: 7,
    },
    created_at: {
      type: Date,
      default: Date.now,
    },
    updated_at: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: true, // Keep _id as we're using Supabase UUID
    timestamps: false, // We handle timestamps manually
  }
);

// No pre-save hooks needed - we handle timestamps manually in sync service
// This prevents "next is not a function" errors

const Shop = mongoose.models.Shop || mongoose.model('Shop', ShopSchema);

export default Shop;
