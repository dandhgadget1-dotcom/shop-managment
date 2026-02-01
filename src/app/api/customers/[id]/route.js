import { NextResponse } from 'next/server';
import supabaseAdmin from '@/lib/supabase';
import { deleteImage } from '@/lib/cloudinary';

// Helper function to transform customer data (only camelCase, no snake_case)
function transformCustomer(customer) {
  if (!customer) return null;
  return {
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
    supportingPerson: customer.supporting_person,
    phone: customer.phone,
    payment: customer.payment,
    createdAt: customer.created_at,
    updatedAt: customer.updated_at,
  };
}

// GET /api/customers/:id - Get single customer
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const { data: customer, error } = await supabaseAdmin
      .from('customers')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { message: 'Customer not found' },
          { status: 404 }
        );
      }
      throw error;
    }

    return NextResponse.json(transformCustomer(customer));
  } catch (error) {
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    );
  }
}

// PUT /api/customers/:id - Update customer
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    
    // Get existing customer
    const { data: existingCustomer, error: fetchError } = await supabaseAdmin
      .from('customers')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existingCustomer) {
      return NextResponse.json(
        { message: 'Customer not found' },
        { status: 404 }
      );
    }

    const body = await request.json();

    // Transform customer data for comparison
    const customer = transformCustomer(existingCustomer);

    // Check if ID number is being changed and if it conflicts
    if (body.idNo && body.idNo !== customer.idNo) {
      const { data: existing } = await supabaseAdmin
        .from('customers')
        .select('id')
        .eq('id_no', body.idNo)
        .single();
      
      if (existing) {
        return NextResponse.json(
          { message: 'Customer with this ID number already exists' },
          { status: 400 }
        );
      }
    }

    // Handle payment updates specially
    if (body.payment && body.payment.payments) {
      // Validate payment amounts for installment payments
      if (body.payment.paymentType === 'installment' && customer.payment?.paymentType === 'installment') {
        const totalAmount = parseFloat(customer.payment.calculatedAmount?.totalWithInterest || 0);
        
        if (totalAmount > 0) {
          // Calculate total paid amount from new payments array
          const newTotalPaid = body.payment.payments.reduce((sum, p) => {
            return sum + (parseFloat(p.amount) || 0);
          }, 0);
          
          // Validate that total paid doesn't exceed total amount
          if (newTotalPaid > totalAmount) {
            const currentTotalPaid = (customer.payment.payments || []).reduce((sum, p) => {
              return sum + (parseFloat(p.amount) || 0);
            }, 0);
            const remainingAmount = Math.max(0, totalAmount - currentTotalPaid);
            return NextResponse.json(
              { 
                message: `Total payment amount exceeds remaining balance. Maximum allowed: Rs. ${remainingAmount.toFixed(2)}` 
              },
              { status: 400 }
            );
          }
          
          // Validate individual payment amounts
          for (const payment of body.payment.payments) {
            const paymentAmount = parseFloat(payment.amount) || 0;
            if (paymentAmount <= 0) {
              return NextResponse.json(
                { message: 'Payment amount must be greater than 0' },
                { status: 400 }
              );
            }
          }
        }
      }
      
      // Convert payment dates to ISO strings for JSON storage
      body.payment.payments = body.payment.payments.map(payment => {
        const paymentRecord = {
          paymentDate: payment.paymentDate ? new Date(payment.paymentDate).toISOString() : new Date().toISOString(),
          amount: parseFloat(payment.amount) || 0,
          notes: payment.notes || "",
        };
        
        // Include installmentNumber if provided (can be null for flexible payments)
        if (payment.installmentNumber !== undefined) {
          paymentRecord.installmentNumber = payment.installmentNumber !== null 
            ? parseInt(payment.installmentNumber) 
            : null;
        }
        
        // Include timestamps
        if (payment.recordedAt) {
          paymentRecord.recordedAt = new Date(payment.recordedAt).toISOString();
        }
        if (payment.updatedAt) {
          paymentRecord.updatedAt = new Date(payment.updatedAt).toISOString();
        }
        
        // Preserve id for existing records (Supabase uses id, not _id)
        if (payment.id || payment._id) {
          paymentRecord.id = payment.id || payment._id;
        }
        
        return paymentRecord;
      });
      
      // Handle installmentDate conversion
      if (body.payment.installmentDate) {
        body.payment.installmentDate = new Date(body.payment.installmentDate).toISOString();
      }
    }

    // Prepare update data
    const updateData = {};
    if (body.fullName !== undefined) updateData.full_name = body.fullName;
    if (body.idNo !== undefined) updateData.id_no = body.idNo;
    if (body.contactInfo !== undefined) updateData.contact_info = body.contactInfo;
    if (body.address !== undefined) updateData.address = body.address;
    if (body.idFront !== undefined) updateData.id_front = body.idFront;
    if (body.idBack !== undefined) updateData.id_back = body.idBack;
    if (body.idFrontPublicId !== undefined) updateData.id_front_public_id = body.idFrontPublicId;
    if (body.idBackPublicId !== undefined) updateData.id_back_public_id = body.idBackPublicId;
    if (body.idFrontPreview !== undefined) updateData.id_front_preview = body.idFrontPreview;
    if (body.idBackPreview !== undefined) updateData.id_back_preview = body.idBackPreview;
    if (body.supportingPerson !== undefined) updateData.supporting_person = body.supportingPerson;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.payment !== undefined) updateData.payment = body.payment;

    const { data: updatedCustomer, error: updateError } = await supabaseAdmin
      .from('customers')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    return NextResponse.json(transformCustomer(updatedCustomer));
  } catch (error) {
    if (error.code === '23505') {
      return NextResponse.json(
        { message: 'Customer with this ID number already exists' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { message: error.message },
      { status: 400 }
    );
  }
}

// DELETE /api/customers/:id - Delete customer
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    
    // Get customer first to access image public IDs
    const { data: customer, error: fetchError } = await supabaseAdmin
      .from('customers')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !customer) {
      return NextResponse.json(
        { message: 'Customer not found' },
        { status: 404 }
      );
    }

    // Delete all images from Cloudinary before deleting customer
    const imagesToDelete = [];
    
    if (customer.id_front_public_id) {
      imagesToDelete.push(customer.id_front_public_id);
    }
    if (customer.id_back_public_id) {
      imagesToDelete.push(customer.id_back_public_id);
    }
    if (customer.supporting_person?.idFrontPublicId) {
      imagesToDelete.push(customer.supporting_person.idFrontPublicId);
    }
    if (customer.supporting_person?.idBackPublicId) {
      imagesToDelete.push(customer.supporting_person.idBackPublicId);
    }

    // Delete all images in parallel
    if (imagesToDelete.length > 0) {
      await Promise.allSettled(
        imagesToDelete.map(publicId => deleteImage(publicId))
      );
    }

    const { error: deleteError } = await supabaseAdmin
      .from('customers')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;

    return NextResponse.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    );
  }
}

