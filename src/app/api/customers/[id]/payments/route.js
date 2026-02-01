import { NextResponse } from 'next/server';
import supabaseAdmin from '@/lib/supabase';

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

// POST /api/customers/:id/payments - Add payment record (for installments)
export async function POST(request, { params }) {
  try {
    const { id } = await params;
    
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

    if (!customer.payment || customer.payment.paymentType !== 'installment') {
      return NextResponse.json(
        { message: 'Customer does not have an installment payment plan' },
        { status: 400 }
      );
    }

    const paymentRecord = await request.json();
    const paymentAmount = parseFloat(paymentRecord.amount) || 0;
    
    if (paymentAmount <= 0) {
      return NextResponse.json(
        { message: 'Payment amount must be greater than 0' },
        { status: 400 }
      );
    }

    // Validate payment amount doesn't exceed remaining balance
    const totalAmount = parseFloat(customer.payment.calculatedAmount?.totalWithInterest || 0);
    const currentTotalPaid = (customer.payment.payments || []).reduce((sum, p) => {
      return sum + (parseFloat(p.amount) || 0);
    }, 0);
    
    // Check if updating existing payment
    const existingPaymentIndex = customer.payment.payments?.findIndex(
      p => p.installmentNumber === paymentRecord.installmentNumber && paymentRecord.installmentNumber !== null
    ) ?? -1;
    
    let newTotalPaid;
    if (existingPaymentIndex >= 0) {
      // When updating, exclude the old payment amount
      const oldPaymentAmount = parseFloat(customer.payment.payments[existingPaymentIndex].amount || 0);
      newTotalPaid = currentTotalPaid - oldPaymentAmount + paymentAmount;
    } else {
      // When adding new payment
      newTotalPaid = currentTotalPaid + paymentAmount;
    }
    
    // Validate that new total doesn't exceed total amount
    if (newTotalPaid > totalAmount) {
      const remainingAmount = totalAmount - (existingPaymentIndex >= 0 
        ? (currentTotalPaid - parseFloat(customer.payment.payments[existingPaymentIndex].amount || 0))
        : currentTotalPaid);
      return NextResponse.json(
        { 
          message: `Payment amount exceeds remaining balance. Maximum allowed: Rs. ${remainingAmount.toFixed(2)}` 
        },
        { status: 400 }
      );
    }

    paymentRecord.recordedAt = new Date().toISOString();

    if (!customer.payment.payments) {
      customer.payment.payments = [];
    }

    if (existingPaymentIndex >= 0) {
      // Update existing payment
      customer.payment.payments[existingPaymentIndex] = {
        ...customer.payment.payments[existingPaymentIndex],
        ...paymentRecord,
        updatedAt: new Date().toISOString(),
      };
    } else {
      // Add new payment
      customer.payment.payments.push(paymentRecord);
    }

    // Update customer with new payment
    const { data: updatedCustomer, error: updateError } = await supabaseAdmin
      .from('customers')
      .update({ payment: customer.payment })
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    return NextResponse.json(transformCustomer(updatedCustomer));
  } catch (error) {
    return NextResponse.json(
      { message: error.message },
      { status: 400 }
    );
  }
}

