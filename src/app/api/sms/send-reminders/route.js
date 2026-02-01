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
 * POST /api/sms/send-reminders
 * Check all customers and send WhatsApp reminders for upcoming installments
 * 
 * Body (optional): {
 *   daysAhead: number (default: 7) - Number of days ahead to check for upcoming installments
 *   sendAll: boolean (default: false) - If true, send reminders for all pending installments, not just upcoming ones
 * }
 */
export async function POST(request) {
  try {
    // Get shop settings (including SMS settings)
    const { data: shopData } = await supabaseAdmin
      .from('shop')
      .select('*')
      .limit(1)
      .single();
    
    const shop = shopData ? transformShop(shopData) : {};
    
    // Check if manual reminders are enabled
    if (!shop.enableManualReminders) {
      return NextResponse.json({
        success: false,
        message: 'Manual reminders are disabled in settings. Please enable them in Shop Settings.',
      }, { status: 403 });
    }

    const body = await request.json() || {};
    // Use database setting if not provided in request, otherwise allow override
    const daysAhead = body.daysAhead !== undefined 
      ? parseInt(body.daysAhead) 
      : (shop.reminderDaysAhead || 7);
    const sendAll = body.sendAll === true;

    // Get all customers with installment payments
    // Note: Supabase doesn't support nested field queries like MongoDB
    // We'll fetch all customers and filter in JavaScript
    const { data: allCustomers, error: customersError } = await supabaseAdmin
      .from('customers')
      .select('*');

    if (customersError) throw customersError;

    // Filter customers with installment payments
    const customers = allCustomers
      .map(transformCustomer)
      .filter(c => c.payment && c.payment.paymentType === 'installment');

    const results = {
      total: 0,
      sent: 0,
      failed: 0,
      skipped: 0,
      details: [],
    };

    const now = new Date();
    const targetDate = new Date(now);
    targetDate.setDate(now.getDate() + daysAhead);

    for (const customer of customers) {
      // Skip if no contact info
      if (!customer.contactInfo) {
        results.skipped++;
        results.details.push({
          customerId: customer.id.toString(),
          customerName: customer.fullName,
          status: 'skipped',
          reason: 'No contact information',
        });
        continue;
      }

      const payment = customer.payment;
      const numberOfInstallments = parseInt(payment.numberOfInstallments) || 0;
      const installmentAmount = payment.calculatedAmount?.installmentAmount || 0;
      const startDate = new Date(payment.installmentDate);
      const payments = payment.payments || [];

      // Find upcoming installments
      const upcomingInstallments = [];

      for (let i = 0; i < numberOfInstallments; i++) {
        const installmentDate = new Date(startDate);
        installmentDate.setMonth(startDate.getMonth() + i);
        const installmentNumber = i + 1;

        // Check if this installment has been paid
        const paymentRecord = payments.find(p => p.installmentNumber === installmentNumber);
        if (paymentRecord) {
          continue; // Skip paid installments
        }

        // Check if installment is upcoming or overdue
        if (sendAll) {
          // Send for all pending installments
          if (installmentDate <= targetDate) {
            upcomingInstallments.push({
              number: installmentNumber,
              date: installmentDate,
              amount: installmentAmount,
            });
          }
        } else {
          // Only send for installments due within the next N days
          if (installmentDate >= now && installmentDate <= targetDate) {
            upcomingInstallments.push({
              number: installmentNumber,
              date: installmentDate,
              amount: installmentAmount,
            });
          }
        }
      }

      // Send reminders for upcoming installments
      for (const installment of upcomingInstallments) {
        results.total++;
        try {
          const result = await sendInstallmentReminder(customer, installment, shop);
          results.sent++;
          results.details.push({
            customerId: customer.id.toString(),
            customerName: customer.fullName,
            installmentNumber: installment.number,
            dueDate: installment.date.toISOString(),
            status: 'sent',
            messageSid: result.messageSid,
          });
        } catch (error) {
          results.failed++;
          results.details.push({
            customerId: customer.id.toString(),
            customerName: customer.fullName,
            installmentNumber: installment.number,
            dueDate: installment.date.toISOString(),
            status: 'failed',
            error: error.message,
          });
        }
      }

      // If no upcoming installments found for this customer
      if (upcomingInstallments.length === 0 && customer.contactInfo) {
        results.skipped++;
        results.details.push({
          customerId: customer.id.toString(),
          customerName: customer.fullName,
          status: 'skipped',
          reason: 'No upcoming installments found',
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${results.total} reminders. Sent: ${results.sent}, Failed: ${results.failed}, Skipped: ${results.skipped}`,
      results,
    });
  } catch (error) {
    console.error('Error sending reminder WhatsApp:', error);
    return NextResponse.json(
      {
        message: error.message || 'Failed to send reminder WhatsApp messages',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/sms/send-reminders
 * Get a preview of customers who would receive reminders (without sending)
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const daysAhead = parseInt(searchParams.get('daysAhead')) || 7;
    const sendAll = searchParams.get('sendAll') === 'true';

    // Get all customers with installment payments
    const { data: allCustomers, error: customersError } = await supabaseAdmin
      .from('customers')
      .select('*');

    if (customersError) throw customersError;

    // Filter customers with installment payments
    const customers = allCustomers
      .map(transformCustomer)
      .filter(c => c.payment && c.payment.paymentType === 'installment');

    const preview = {
      totalCustomers: customers.length,
      customersWithUpcomingInstallments: 0,
      totalInstallments: 0,
      customers: [],
    };

    const now = new Date();
    const targetDate = new Date(now);
    targetDate.setDate(now.getDate() + daysAhead);

    for (const customer of customers) {
      const payment = customer.payment;
      const numberOfInstallments = parseInt(payment.numberOfInstallments) || 0;
      const installmentAmount = payment.calculatedAmount?.installmentAmount || 0;
      const startDate = new Date(payment.installmentDate);
      const payments = payment.payments || [];

      const upcomingInstallments = [];

      for (let i = 0; i < numberOfInstallments; i++) {
        const installmentDate = new Date(startDate);
        installmentDate.setMonth(startDate.getMonth() + i);
        const installmentNumber = i + 1;

        const paymentRecord = payments.find(p => p.installmentNumber === installmentNumber);
        if (paymentRecord) {
          continue;
        }

        if (sendAll) {
          if (installmentDate <= targetDate) {
            upcomingInstallments.push({
              number: installmentNumber,
              date: installmentDate,
              amount: installmentAmount,
            });
          }
        } else {
          if (installmentDate >= now && installmentDate <= targetDate) {
            upcomingInstallments.push({
              number: installmentNumber,
              date: installmentDate,
              amount: installmentAmount,
            });
          }
        }
      }

      if (upcomingInstallments.length > 0 && customer.contactInfo) {
        preview.customersWithUpcomingInstallments++;
        preview.totalInstallments += upcomingInstallments.length;
        preview.customers.push({
          customerId: customer.id.toString(),
          customerName: customer.fullName,
          contactInfo: customer.contactInfo,
          phoneName: customer.phone?.name || 'N/A',
          upcomingInstallments: upcomingInstallments.map(inst => ({
            number: inst.number,
            dueDate: inst.date.toISOString(),
            amount: inst.amount,
          })),
        });
      }
    }

    return NextResponse.json({
      success: true,
      preview,
    });
  } catch (error) {
    console.error('Error getting reminder preview:', error);
    return NextResponse.json(
      {
        message: error.message || 'Failed to get reminder preview',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

