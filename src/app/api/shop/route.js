import { NextResponse } from 'next/server';
import supabaseAdmin from '@/lib/supabase';

// Helper function to transform shop data
function transformShop(shop) {
  if (!shop) return null;
  return {
    id: shop.id,
    shopName: shop.shop_name,
    shopAddress: shop.shop_address,
    shopPhone: shop.shop_phone,
    shopEmail: shop.shop_email,
    ntnNumber: shop.ntn_number,
    footerMessage: shop.footer_message,
    enableAutoReminders: shop.enable_auto_reminders,
    enableManualReminders: shop.enable_manual_reminders,
    reminderDaysAhead: shop.reminder_days_ahead,
    createdAt: shop.created_at,
    updatedAt: shop.updated_at,
  };
}

// GET /api/shop - Get shop settings
export async function GET() {
  try {
    // Get the first shop settings (we'll only have one shop settings document)
    const { data: shops, error } = await supabaseAdmin
      .from('shop')
      .select('*')
      .limit(1);

    if (error) throw error;
    
    // If no shop settings exist, return default settings
    if (!shops || shops.length === 0) {
      return NextResponse.json({
        shopName: "",
        shopAddress: "",
        shopPhone: "",
        shopEmail: "",
        ntnNumber: "",
        footerMessage: "Thank you for your business!",
        enableAutoReminders: false,
        enableManualReminders: true,
        reminderDaysAhead: 7,
      });
    }
    
    return NextResponse.json(transformShop(shops[0]));
  } catch (error) {
    console.error('Error fetching shop settings:', error);
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    );
  }
}

// PUT /api/shop - Update shop settings
export async function PUT(request) {
  try {
    const body = await request.json();
    
    // Prepare update data
    const updateData = {
      shop_name: body.shopName,
      shop_address: body.shopAddress,
      shop_phone: body.shopPhone,
      shop_email: body.shopEmail,
      ntn_number: body.ntnNumber,
      footer_message: body.footerMessage,
      enable_auto_reminders: body.enableAutoReminders,
      enable_manual_reminders: body.enableManualReminders,
      reminder_days_ahead: body.reminderDaysAhead,
    };

    // Check if shop settings exist
    const { data: existingShops } = await supabaseAdmin
      .from('shop')
      .select('id')
      .limit(1);

    let shop;
    
    if (!existingShops || existingShops.length === 0) {
      // Create new shop settings
      const { data: newShop, error: insertError } = await supabaseAdmin
        .from('shop')
        .insert(updateData)
        .select()
        .single();
      
      if (insertError) throw insertError;
      shop = newShop;
    } else {
      // Update existing shop settings
      const { data: updatedShop, error: updateError } = await supabaseAdmin
        .from('shop')
        .update(updateData)
        .eq('id', existingShops[0].id)
        .select()
        .single();
      
      if (updateError) throw updateError;
      shop = updatedShop;
    }
    
    return NextResponse.json(transformShop(shop));
  } catch (error) {
    console.error('Error updating shop settings:', error);
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    );
  }
}

