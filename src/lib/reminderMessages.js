/**
 * Generate reminder message for a customer's installment
 * @param {Object} customer - Customer object with name, phone, etc.
 * @param {Object} installment - Installment object with number, dueDate, amount
 * @param {Object} shop - Shop settings with shopName, shopPhone, reminderMessageTemplate
 * @returns {string} Formatted reminder message
 */
export function generateReminderMessage(customer, installment, shop = {}) {
  const customerName = customer.customerName || 'Customer';
  const phoneName = customer.phoneName || 'Phone';
  const installmentAmount = parseFloat(installment.amount || 0).toFixed(2);
  const dueDate = new Date(installment.dueDate).toLocaleDateString('en-PK', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const installmentNumber = installment.number || 'N/A';
  const shopName = shop.shopName || 'Our Shop';
  const shopPhone = shop.shopPhone || '';

  // Use custom template if available, otherwise use default
  let template = shop.reminderMessageTemplate;
  
  if (!template || template.trim() === '') {
    // Default template
    template = `Assalam-o-Alaikum {customerName} 👋\n\n` +
      `📱 *Installment Reminder*\n\n` +
      `Your installment #{installmentNumber} for *{phoneName}* is due on *{dueDate}*.\n\n` +
      `💰 Amount: *Rs. {amount}*\n\n` +
      `Please make the payment on time.\n` +
      (shopPhone ? `📞 Contact: {shopPhone}\n` : '') +
      `\nThank you!\n{shopName}`;
  }

  // Replace placeholders with actual values
  const message = template
    .replace(/{customerName}/g, customerName)
    .replace(/{phoneName}/g, phoneName)
    .replace(/{installmentNumber}/g, installmentNumber)
    .replace(/{dueDate}/g, dueDate)
    .replace(/{amount}/g, installmentAmount)
    .replace(/{shopName}/g, shopName)
    .replace(/{shopPhone}/g, shopPhone || '');

  return message;
}
