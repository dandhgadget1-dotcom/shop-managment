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
 * GET /api/reminders
 * Get all customers with pending installments due today or within the next 10 days
 */
export async function GET(request) {
  try {
    // Get shop settings
    const { data: shopData } = await supabaseAdmin
      .from('shop')
      .select('*')
      .limit(1)
      .single();
    
    const shop = shopData ? transformShop(shopData) : {};

    // Get all customers with installment payments
    const { data: allCustomers, error: customersError } = await supabaseAdmin
      .from('customers')
      .select('*');

    if (customersError) throw customersError;

    // Filter customers with installment payments
    const customers = allCustomers
      .map(transformCustomer)
      .filter(c => c.payment && c.payment.paymentType === 'installment');

    const reminders = [];
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Start of today
    
    // Show reminders 3 days in advance
    const threeDaysBefore = new Date(now);
    threeDaysBefore.setDate(now.getDate() - 3);
    threeDaysBefore.setHours(0, 0, 0, 0);
    
    // Reminders expire 10 days after due date
    const maxExpiryDate = new Date(now);
    maxExpiryDate.setDate(now.getDate() + 10);
    maxExpiryDate.setHours(23, 59, 59, 999);

    for (const customer of customers) {
      // Skip if no contact info
      if (!customer.contactInfo) {
        continue;
      }

      const payment = customer.payment;
      const numberOfInstallments = parseInt(payment.numberOfInstallments) || 0;
      const installmentAmount = payment.calculatedAmount?.installmentAmount || 0;
      const startDate = new Date(payment.installmentDate);
      const payments = payment.payments || [];

      // Find pending installments
      const pendingInstallments = [];

      for (let i = 0; i < numberOfInstallments; i++) {
        const installmentDate = new Date(startDate);
        installmentDate.setMonth(startDate.getMonth() + i);
        installmentDate.setHours(0, 0, 0, 0);
        const installmentNumber = i + 1;

        // Check if this installment has been paid
        const paymentRecord = payments.find(p => p.installmentNumber === installmentNumber);
        if (paymentRecord) {
          continue; // Skip paid installments
        }

        // Calculate expiry date (10 days after due date)
        const expiryDate = new Date(installmentDate);
        expiryDate.setDate(installmentDate.getDate() + 10);
        expiryDate.setHours(23, 59, 59, 999);

        // Show reminder if:
        // 1. Due date is within 3 days from now (3 days in advance)
        // 2. Or already overdue but not expired (within 10 days after due date)
        // 3. And not expired yet
        const shouldShow = 
          (installmentDate >= threeDaysBefore && installmentDate <= maxExpiryDate) &&
          expiryDate >= now;

        if (shouldShow) {
          // Calculate days until/since due date
          const daysDiff = Math.floor((installmentDate - now) / (1000 * 60 * 60 * 24));
          const isOverdue = installmentDate < now;
          const isDueToday = daysDiff === 0;
          const isDueSoon = daysDiff > 0 && daysDiff <= 3;
          
          // Calculate days until expiry
          const daysUntilExpiry = Math.floor((expiryDate - now) / (1000 * 60 * 60 * 24));
          const isExpiringSoon = daysUntilExpiry <= 2;

          pendingInstallments.push({
            number: installmentNumber,
            dueDate: installmentDate.toISOString(),
            expiryDate: expiryDate.toISOString(),
            amount: installmentAmount,
            daysDiff,
            daysUntilExpiry,
            isOverdue,
            isDueToday,
            isDueSoon,
            isExpiringSoon,
          });
        }
      }

      // Add customer to reminders if they have pending installments
      if (pendingInstallments.length > 0) {
        reminders.push({
          customerId: customer.id.toString(),
          customerName: customer.fullName,
          contactInfo: customer.contactInfo,
          phoneName: customer.phone?.name || 'N/A',
          phoneModel: customer.phone?.model || 'N/A',
          pendingInstallments,
        });
      }
    }

    // Sort reminders: overdue first, then due today, then due soon, then by due date
    reminders.sort((a, b) => {
      const aFirst = a.pendingInstallments[0];
      const bFirst = b.pendingInstallments[0];
      
      if (aFirst.isOverdue && !bFirst.isOverdue) return -1;
      if (!aFirst.isOverdue && bFirst.isOverdue) return 1;
      if (aFirst.isDueToday && !bFirst.isDueToday) return -1;
      if (!aFirst.isDueToday && bFirst.isDueToday) return 1;
      if (aFirst.isDueSoon && !bFirst.isDueSoon) return -1;
      if (!aFirst.isDueSoon && bFirst.isDueSoon) return 1;
      
      return new Date(aFirst.dueDate) - new Date(bFirst.dueDate);
    });

    return NextResponse.json({
      success: true,
      reminders,
      shop: {
        shopName: shop.shopName || 'Our Shop',
        shopPhone: shop.shopPhone || '',
      },
      total: reminders.length,
    });
  } catch (error) {
    console.error('Error getting reminders:', error);
    return NextResponse.json(
      {
        message: error.message || 'Failed to get reminders',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
