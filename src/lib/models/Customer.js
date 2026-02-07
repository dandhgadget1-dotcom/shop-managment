import mongoose from 'mongoose';

const CustomerSchema = new mongoose.Schema(
  {
    // Use Supabase UUID as _id to maintain exact sync
    _id: {
      type: String,
      required: true,
    },
    full_name: String,
    id_no: String,
    contact_info: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    address: String,
    id_front: String,
    id_back: String,
    id_front_public_id: String,
    id_back_public_id: String,
    id_front_preview: String,
    id_back_preview: String,
    supporting_person: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    phone: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    payment: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
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

const Customer = mongoose.models.Customer || mongoose.model('Customer', CustomerSchema);

export default Customer;
