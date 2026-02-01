import twilio from 'twilio';

// Initialize Twilio client
let twilioClient = null;

function getTwilioClient() {
  if (!twilioClient) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    if (!accountSid || !authToken) {
      throw new Error(
        'Twilio credentials not configured. Please set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN environment variables.\n' +
        'For setup instructions, see: WHATSAPP_SETUP.md'
      );
    }

    twilioClient = twilio(accountSid, authToken);
  }

  return twilioClient;
}

/**
 * Format Pakistan phone number to E.164 format (+92XXXXXXXXXX)
 * Handles various formats:
 * - 03001234567 -> +923001234567
 * - 923001234567 -> +923001234567
 * - +923001234567 -> +923001234567
 * - 3001234567 -> +923001234567 (assumes leading 0 was removed)
 */
export function formatPakistanPhoneNumber(phoneNumber) {
  if (!phoneNumber) {
    return null;
  }

  // Remove all spaces, dashes, and other non-digit characters except +
  let cleaned = phoneNumber.replace(/[^\d+]/g, '');

  // If it already starts with +92, return as is (after cleaning)
  if (cleaned.startsWith('+92')) {
    // Ensure it's exactly 13 characters (+92 + 10 digits)
    if (cleaned.length === 13) {
      return cleaned;
    }
    // If it's longer, truncate or handle error
    if (cleaned.length > 13) {
      return cleaned.substring(0, 13);
    }
  }

  // If it starts with 92 (without +), add +
  if (cleaned.startsWith('92')) {
    if (cleaned.length === 12) {
      return `+${cleaned}`;
    }
    // If longer, truncate
    if (cleaned.length > 12) {
      return `+${cleaned.substring(0, 12)}`;
    }
  }

  // If it starts with 0, replace with +92
  if (cleaned.startsWith('0')) {
    const withoutZero = cleaned.substring(1);
    if (withoutZero.length === 10) {
      return `+92${withoutZero}`;
    }
  }

  // If it's 10 digits (without leading 0), add +92
  if (cleaned.length === 10 && /^\d+$/.test(cleaned)) {
    return `+92${cleaned}`;
  }

  // If it's 11 digits starting with 0, replace 0 with +92
  if (cleaned.length === 11 && cleaned.startsWith('0')) {
    return `+92${cleaned.substring(1)}`;
  }

  // If we can't format it properly, return null
  return null;
}

/**
 * Send WhatsApp message using Twilio
 * @param {string} to - Phone number in E.164 format (e.g., +923001234567)
 * @param {string} message - Message body
 * @returns {Promise<Object>} Twilio message object
 */
export async function sendWhatsApp(to, message) {
  try {
    // Development mode: Mock WhatsApp sending (no cost, no API call)
    // Only enable if explicitly set to 'true' (default is false for production)
    const isDevelopmentMode = process.env.WHATSAPP_DEV_MODE === 'true' || process.env.SMS_DEV_MODE === 'true';
    
    if (isDevelopmentMode) {
      const formattedTo = formatPakistanPhoneNumber(to);
      if (!formattedTo) {
        throw new Error(`Invalid phone number format: ${to}. Please provide a valid Pakistan phone number.`);
      }
      
      // Mock WhatsApp - just log it, don't actually send
      console.log('💬 [DEV MODE] WhatsApp Mock Send:');
      console.log('   To:', formattedTo);
      console.log('   Message:', message);
      console.log('   Length:', message.length, 'characters');
      console.log('   ⚠️  Development mode is ON - WhatsApp not actually sent');
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return {
        success: true,
        messageSid: `DEV_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        status: 'queued',
        to: formattedTo,
        devMode: true,
      };
    }

    const client = getTwilioClient();
    
    // Twilio WhatsApp sender (sandbox or approved number)
    // For sandbox: whatsapp:+14155238886
    // For production: whatsapp:+12345678901 (your approved number)
    const whatsappFrom = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886';
    
    // Format the phone number for Pakistan
    const formattedTo = formatPakistanPhoneNumber(to);
    if (!formattedTo) {
      throw new Error(`Invalid phone number format: ${to}. Please provide a valid Pakistan phone number.`);
    }

    // Send WhatsApp message
    const messageResult = await client.messages.create({
      body: message,
      from: whatsappFrom,
      to: `whatsapp:${formattedTo}`, // Add whatsapp: prefix
    });

    return {
      success: true,
      messageSid: messageResult.sid,
      status: messageResult.status,
      to: formattedTo,
    };
  } catch (error) {
    console.error('Error sending WhatsApp:', error);
    throw new Error(`Failed to send WhatsApp: ${error.message}`);
  }
}

/**
 * Send installment reminder via WhatsApp
 * @param {Object} customer - Customer object
 * @param {Object} installment - Installment object with number, date, amount
 * @param {Object} shop - Shop settings object
 * @returns {Promise<Object>} Result of WhatsApp send
 */
export async function sendInstallmentReminder(customer, installment, shop = {}) {
  try {
    const customerName = customer.fullName || 'Customer';
    const phoneName = customer.phone?.name || 'Phone';
    const installmentAmount = installment.amount?.toFixed(2) || '0.00';
    const dueDate = new Date(installment.date).toLocaleDateString('en-PK', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const installmentNumber = installment.number || 'N/A';
    const shopName = shop.shopName || 'Our Shop';
    const shopPhone = shop.shopPhone || '';

    // Create WhatsApp reminder message (can be longer than SMS, supports emojis)
    const message = `Assalam-o-Alaikum ${customerName} 👋\n\n` +
      `📱 *Installment Reminder*\n\n` +
      `Your installment #${installmentNumber} for *${phoneName}* is due on *${dueDate}*.\n\n` +
      `💰 Amount: *Rs. ${installmentAmount}*\n\n` +
      `Please make the payment on time.\n` +
      (shopPhone ? `📞 Contact: ${shopPhone}\n` : '') +
      `\nThank you!\n${shopName}`;

    // Send WhatsApp
    return await sendWhatsApp(customer.contactInfo, message);
  } catch (error) {
    console.error('Error sending installment reminder:', error);
    throw error;
  }
}
