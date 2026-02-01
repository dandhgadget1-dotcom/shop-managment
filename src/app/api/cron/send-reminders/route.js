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
 * GET /api/cron/send-reminders
 * Automatic cron job endpoint - runs daily to send WhatsApp reminders
 * This endpoint is called automatically by the cron scheduler
 * 
 * For Next.js 15.1+ with Vercel: Use vercel.json cron configuration
 * For local development: Use node-cron service
 */
export async function GET(request) {
  // Verify cron secret if set (for security)
  const cronSecret = process.env.CRON_SECRET;
  const providedSecret = request.headers.get('x-cron-secret') || 
                        new URL(request.url).searchParams.get('secret');
  
  if (cronSecret && providedSecret !== cronSecret) {
    return NextResponse.json(
      { message: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    // Get shop settings (including SMS settings)
    const { data: shopData } = await supabaseAdmin
      .from('shop')
      .select('*')
      .limit(1)
      .single();
    
    const shop = shopData ? transformShop(shopData) : {};
    
    // Check if automatic reminders are enabled
    if (!shop.enableAutoReminders) {
      return NextResponse.json({
        success: false,
        message: 'Automatic reminders are disabled in settings',
        skipped: true,
      });
    }

    // Get configuration from database settings
    const daysAhead = shop.reminderDaysAhead || 7;
    const sendAll = false; // Always use daysAhead logic, not sendAll

    // Get all customers with installment payments
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
      timestamp: new Date().toISOString(),
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

    // Log results
    console.log(`[CRON] Reminder job completed at ${results.timestamp}`);
    console.log(`[CRON] Total: ${results.total}, Sent: ${results.sent}, Failed: ${results.failed}, Skipped: ${results.skipped}`);

    return NextResponse.json({
      success: true,
      message: `Automatic reminder job completed. Processed ${results.total} reminders. Sent: ${results.sent}, Failed: ${results.failed}, Skipped: ${results.skipped}`,
      results,
    });
  } catch (error) {
    console.error('[CRON] Error in reminder job:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to send reminder WhatsApp messages',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

