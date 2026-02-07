import { NextResponse } from 'next/server';
import supabaseAdmin from '@/lib/supabase';
import { syncCustomer } from '@/lib/dbSync';

// GET /api/customers - Get all customers
export async function GET() {
  try {
    const { data: customers, error } = await supabaseAdmin
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Transform data to match frontend expectations (snake_case to camelCase)
    // Don't spread ...customer to avoid including snake_case fields
    const transformedCustomers = customers.map(customer => ({
      id: customer.id,
      fullName: customer.full_name,
      idNo: customer.id_no,
      contactInfo: customer.contact_info,
      address: customer.address,
      idFront: customer.id_front,
      idBack: customer.id_back,
      idFrontPublicId: customer.id_front_public_id,
      idBackPublicId: customer.id_back_public_id,
      idFrontPreview: customer.id_front_preview,
      idBackPreview: customer.id_back_preview,
      supportingPerson: customer.supporting_person, // Already camelCase from frontend
      phone: customer.phone, // Already camelCase from frontend
      payment: customer.payment, // Already camelCase from frontend
      createdAt: customer.created_at,
      updatedAt: customer.updated_at,
    }));

    return NextResponse.json(transformedCustomers);
  } catch (error) {
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    );
  }
}

// POST /api/customers - Create new customer
export async function POST(request) {
  try {
    const customerData = await request.json();
    
    // Allow same customer (same ID number) to buy multiple phones
    // No duplicate check needed - same person can have multiple purchases

    // Transform nested objects to JSON for Supabase
    const insertData = {
      full_name: customerData.fullName,
      id_no: customerData.idNo,
      contact_info: customerData.contactInfo,
      address: customerData.address,
      id_front: customerData.idFront || null,
      id_back: customerData.idBack || null,
      id_front_public_id: customerData.idFrontPublicId || null,
      id_back_public_id: customerData.idBackPublicId || null,
      id_front_preview: customerData.idFrontPreview || null,
      id_back_preview: customerData.idBackPreview || null,
      supporting_person: customerData.supportingPerson || null,
      phone: customerData.phone || null,
      payment: customerData.payment || null,
    };

    const { data: savedCustomer, error } = await supabaseAdmin
      .from('customers')
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;

    // Sync to MongoDB (fire and forget - don't wait for it)
    syncCustomer(savedCustomer, 'create').catch(err => {
      console.error('[POST /api/customers] MongoDB sync error:', err);
    });

    // Transform response to match frontend expectations (only camelCase, no snake_case)
    const transformedCustomer = {
      id: savedCustomer.id,
      fullName: savedCustomer.full_name,
      idNo: savedCustomer.id_no,
      contactInfo: savedCustomer.contact_info,
      address: savedCustomer.address,
      idFront: savedCustomer.id_front,
      idBack: savedCustomer.id_back,
      idFrontPublicId: savedCustomer.id_front_public_id,
      idBackPublicId: savedCustomer.id_back_public_id,
      idFrontPreview: savedCustomer.id_front_preview,
      idBackPreview: savedCustomer.id_back_preview,
      supportingPerson: savedCustomer.supporting_person,
      phone: savedCustomer.phone,
      payment: savedCustomer.payment,
      createdAt: savedCustomer.created_at,
      updatedAt: savedCustomer.updated_at,
    };

    return NextResponse.json(transformedCustomer, { status: 201 });
  } catch (error) {
    // Log detailed error information
    console.error('[POST /api/customers] Error:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });

    // Handle Supabase duplicate key errors
    if (error.code === '23505') {
      return NextResponse.json(
        { 
          message: 'A record with this value already exists.',
          code: 'DUPLICATE_KEY',
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        message: error.message || 'Failed to create customer',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 400 }
    );
  }
}

