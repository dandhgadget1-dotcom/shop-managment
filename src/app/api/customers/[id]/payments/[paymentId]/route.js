import { NextResponse } from 'next/server';
import supabaseAdmin from '@/lib/supabase';
import { syncCustomer } from '@/lib/dbSync';

// Helper function to transform customer data
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

// PUT /api/customers/:id/payments/:paymentId - Update payment record
export async function PUT(request, { params }) {
  try {
    const { id, paymentId } = await params;
    
    // Get customer
    const { data: customerData, error: fetchError } = await supabaseAdmin
      .from('customers')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !customerData) {
      return NextResponse.json(
        { message: 'Customer not found' },
        { status: 404 }
      );
    }

    const customer = transformCustomer(customerData);

    if (!customer.payment || !customer.payment.payments) {
      return NextResponse.json(
        { message: 'Payment record not found' },
        { status: 404 }
      );
    }

    // Find payment by id or _id (for backward compatibility)
    const paymentIndex = customer.payment.payments.findIndex(
      p => (p.id && p.id.toString() === paymentId) || (p._id && p._id.toString() === paymentId)
    );

    if (paymentIndex === -1) {
      return NextResponse.json(
        { message: 'Payment record not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const paymentAmount = parseFloat(body.amount) || 0;
    
    if (paymentAmount <= 0) {
      return NextResponse.json(
        { message: 'Payment amount must be greater than 0' },
        { status: 400 }
      );
    }

    // Validate payment amount doesn't exceed remaining balance
    if (customer.payment.paymentType === 'installment') {
      const totalAmount = parseFloat(customer.payment.calculatedAmount?.totalWithInterest || 0);
      const oldPaymentAmount = parseFloat(customer.payment.payments[paymentIndex].amount || 0);
      const currentTotalPaid = (customer.payment.payments || []).reduce((sum, p) => {
        return sum + (parseFloat(p.amount) || 0);
      }, 0);
      
      // Calculate new total paid (excluding old payment, including new payment)
      const newTotalPaid = currentTotalPaid - oldPaymentAmount + paymentAmount;
      
      // Validate that new total doesn't exceed total amount
      if (newTotalPaid > totalAmount) {
        const remainingAmount = totalAmount - (currentTotalPaid - oldPaymentAmount);
        return NextResponse.json(
          { 
            message: `Payment amount exceeds remaining balance. Maximum allowed: Rs. ${remainingAmount.toFixed(2)}` 
          },
          { status: 400 }
        );
      }
    }

    customer.payment.payments[paymentIndex] = {
      ...customer.payment.payments[paymentIndex],
      ...body,
      updatedAt: new Date().toISOString(),
    };

    // Update customer with modified payment
    const { data: updatedCustomer, error: updateError } = await supabaseAdmin
      .from('customers')
      .update({ payment: customer.payment })
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    // Sync to MongoDB (fire and forget - don't wait for it)
    syncCustomer(updatedCustomer, 'update').catch(err => {
      console.error('[PUT /api/customers/:id/payments/:paymentId] MongoDB sync error:', err);
    });

    return NextResponse.json(transformCustomer(updatedCustomer));
  } catch (error) {
    return NextResponse.json(
      { message: error.message },
      { status: 400 }
    );
  }
}

// DELETE /api/customers/:id/payments/:paymentId - Delete payment record
export async function DELETE(request, { params }) {
  try {
    const { id, paymentId } = await params;
    
    // Get customer
    const { data: customerData, error: fetchError } = await supabaseAdmin
      .from('customers')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !customerData) {
      return NextResponse.json(
        { message: 'Customer not found' },
        { status: 404 }
      );
    }

    const customer = transformCustomer(customerData);

    if (!customer.payment || !customer.payment.payments) {
      return NextResponse.json(
        { message: 'Payment record not found' },
        { status: 404 }
      );
    }

    // Filter out the payment (support both id and _id for backward compatibility)
    customer.payment.payments = customer.payment.payments.filter(
      p => !((p.id && p.id.toString() === paymentId) || (p._id && p._id.toString() === paymentId))
    );

    // Update customer with modified payment
    const { data: updatedCustomer, error: updateError } = await supabaseAdmin
      .from('customers')
      .update({ payment: customer.payment })
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    // Sync to MongoDB (fire and forget - don't wait for it)
    syncCustomer(updatedCustomer, 'update').catch(err => {
      console.error('[DELETE /api/customers/:id/payments/:paymentId] MongoDB sync error:', err);
    });

    return NextResponse.json(transformCustomer(updatedCustomer));
  } catch (error) {
    return NextResponse.json(
      { message: error.message },
      { status: 400 }
    );
  }
}

