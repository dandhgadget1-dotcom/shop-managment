import { NextResponse } from 'next/server';
import supabaseAdmin from '@/lib/supabase';
import { sendInstallmentReminder } from '@/lib/twilio';

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

/**
 * POST /api/sms/send-reminder
 * Send a reminder WhatsApp message to a specific customer for a specific installment
 * 
 * Body: {
 *   customerId: string,
 *   installmentNumber: number (optional, if not provided, sends for next pending installment)
 * }
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { customerId, installmentNumber } = body;

    if (!customerId) {
      return NextResponse.json(
        { message: 'Customer ID is required' },
        { status: 400 }
      );
    }

    // Get customer
    const { data: customerData, error: customerError } = await supabaseAdmin
      .from('customers')
      .select('*')
      .eq('id', customerId)
      .single();

    if (customerError || !customerData) {
      return NextResponse.json(
        { message: 'Customer not found' },
        { status: 404 }
      );
    }

    const customer = transformCustomer(customerData);

    // Check if customer has installment payment
    if (!customer.payment || customer.payment.paymentType !== 'installment') {
      return NextResponse.json(
        { message: 'Customer does not have an installment payment plan' },
        { status: 400 }
      );
    }

    // Get shop settings (including SMS settings)
    const { data: shopData } = await supabaseAdmin
      .from('shop')
      .select('*')
      .limit(1)
      .single();
    
    const shop = shopData ? transformShop(shopData) : {};
    
    // Check if manual reminders are enabled
    if (!shop.enableManualReminders) {
      return NextResponse.json(
        { message: 'Manual reminders are disabled in settings. Please enable them in Shop Settings.' },
        { status: 403 }
      );
    }

    // Calculate installments
    const payment = customer.payment;
    const numberOfInstallments = parseInt(payment.numberOfInstallments) || 0;
    const installmentAmount = payment.calculatedAmount?.installmentAmount || 0;
    const startDate = new Date(payment.installmentDate);
    const payments = payment.payments || [];

    // Find the installment to send reminder for
    let targetInstallment = null;

    if (installmentNumber) {
      // Find specific installment
      const installmentDate = new Date(startDate);
      installmentDate.setMonth(startDate.getMonth() + (installmentNumber - 1));
      
      const paymentRecord = payments.find(p => p.installmentNumber === installmentNumber);
      
      if (paymentRecord) {
        return NextResponse.json(
          { message: `Installment #${installmentNumber} has already been paid` },
          { status: 400 }
        );
      }

      targetInstallment = {
        number: installmentNumber,
        date: installmentDate,
        amount: installmentAmount,
      };
    } else {
      // Find next pending installment
      const now = new Date();
      for (let i = 0; i < numberOfInstallments; i++) {
        const installmentDate = new Date(startDate);
        installmentDate.setMonth(startDate.getMonth() + i);
        const instNumber = i + 1;
        
        const paymentRecord = payments.find(p => p.installmentNumber === instNumber);
        
        if (!paymentRecord && installmentDate >= now) {
          targetInstallment = {
            number: instNumber,
            date: installmentDate,
            amount: installmentAmount,
          };
          break;
        }
      }
    }

    if (!targetInstallment) {
      return NextResponse.json(
        { message: 'No pending installment found to send reminder for' },
        { status: 400 }
      );
    }

    // Check if customer has contact info
    if (!customer.contactInfo) {
      return NextResponse.json(
        { message: 'Customer does not have contact information' },
        { status: 400 }
      );
    }

    // Send WhatsApp reminder
    const result = await sendInstallmentReminder(customer, targetInstallment, shop);

    const isDevMode = process.env.WHATSAPP_DEV_MODE === 'true' || process.env.SMS_DEV_MODE === 'true' || process.env.NODE_ENV === 'development';
    
    return NextResponse.json({
      success: true,
      message: isDevMode 
        ? 'Reminder WhatsApp message sent successfully (Development Mode - not actually sent)' 
        : 'Reminder WhatsApp message sent successfully',
      data: result,
      devMode: isDevMode,
    });
  } catch (error) {
    console.error('Error sending reminder WhatsApp:', error);
    return NextResponse.json(
      { 
        message: error.message || 'Failed to send reminder WhatsApp message',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

