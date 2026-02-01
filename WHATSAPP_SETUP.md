# WhatsApp Setup Guide for Twilio

This guide will help you set up WhatsApp messaging using Twilio for sending installment reminders to your customers in Pakistan.

## Why WhatsApp?

- ✅ **No phone number purchase needed** - Uses Twilio's WhatsApp sender
- ✅ **No A2P 10DLC registration** - Much simpler than SMS
- ✅ **Lower cost** - Typically $0.005-$0.01 per message
- ✅ **Better engagement** - WhatsApp is very popular in Pakistan
- ✅ **Rich messaging** - Supports emojis and longer messages

## Prerequisites

1. A Twilio account (sign up at https://www.twilio.com/try-twilio)
2. Twilio Account SID and Auth Token
3. WhatsApp Business Account (or use Twilio Sandbox for testing)

---

## Step 1: Create Twilio Account

1. Go to https://www.twilio.com/try-twilio
2. Sign up for a free account
3. Verify your email and phone number
4. You'll receive $15.50 in free credits to get started

---

## Step 2: Enable WhatsApp in Twilio Console

1. Log in to your Twilio Console: https://console.twilio.com
2. Navigate to **Messaging** → **Try it out** → **Send a WhatsApp message**
3. Follow the setup wizard
4. You'll see a sandbox number like: `whatsapp:+14155238886`
5. Note the **join code** (e.g., "join example-code")

### For Testing (Sandbox Mode)

The sandbox allows you to test WhatsApp messaging for free:

1. **Get your sandbox join code** from the Twilio Console
2. **Send the join code** to the sandbox number from your WhatsApp
   - Example: Send "join example-code" to `+1 415 523 8886`
3. Once joined, you can receive messages from the sandbox
4. You can add up to 5 numbers to the sandbox for testing

**Sandbox Limitations:**
- Only works with numbers that have joined the sandbox
- Good for testing and development
- Not suitable for production use

---

## Step 3: Get Production WhatsApp Business Account (Optional)

For production use without requiring customers to join a sandbox:

1. In Twilio Console, go to **Messaging** → **Senders** → **WhatsApp**
2. Click **"Request WhatsApp Business Account"**
3. Fill out the business verification form:
   - Business name
   - Business type
   - Website URL
   - Business description
   - Use case description
4. Submit for approval (usually takes 1-3 business days)
5. Once approved, you'll receive a WhatsApp Business number
6. This number can send to any WhatsApp user without opt-in

**Note:** For small businesses, you can start with the sandbox and upgrade later.

---

## Step 4: Configure Environment Variables

Add the following to your `.env.local` file:

```env
# Twilio Configuration
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here

# WhatsApp Configuration
# For sandbox (testing): whatsapp:+14155238886
# For production: whatsapp:+12345678901 (your approved number)
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886

# Development Mode (optional)
# Set to 'true' to mock WhatsApp sending (no actual messages sent, no cost)
WHATSAPP_DEV_MODE=false
```

### Where to Find Your Credentials

1. **Account SID**: Twilio Console → Dashboard (top of page)
2. **Auth Token**: Twilio Console → Dashboard → "Auth Token" (click to reveal)
3. **WhatsApp From**: 
   - Sandbox: `whatsapp:+14155238886` (default Twilio sandbox)
   - Production: Your approved WhatsApp Business number

---

## Step 5: Test Your Setup

### Test with Development Mode

1. Set `WHATSAPP_DEV_MODE=true` in `.env.local`
2. Restart your development server
3. Try sending a reminder from the Installments Ledger
4. Check the console logs - you should see mock WhatsApp messages
5. No actual messages will be sent, and no charges will occur

### Test with Real WhatsApp (Sandbox)

1. Set `WHATSAPP_DEV_MODE=false` in `.env.local`
2. Make sure you've joined the Twilio sandbox (see Step 2)
3. Add your test customer's WhatsApp number to the sandbox
4. Send a reminder from the Installments Ledger
5. Check your WhatsApp - you should receive the message

---

## Step 6: Configure Settings in the App

1. Open the **Shop Settings** modal
2. Navigate to **WhatsApp Reminder Settings**
3. Configure:
   - **Manual WhatsApp Reminders**: Enable/disable manual sending
   - **Automatic WhatsApp Reminders**: Enable/disable automatic daily reminders
   - **Reminder Days Ahead**: Number of days before due date to send reminders (1-30)
4. Click **Save Settings**

---

## Step 7: Set Up Automatic Reminders (Optional)

If you want automatic daily reminders:

### For Local Development

1. Install `node-cron`: `npm install node-cron`
2. Create `cron-server.js` in your project root (already included)
3. Run: `node cron-server.js`
4. The cron job will call `/api/cron/send-reminders` daily

### For Production (Vercel)

1. Create `vercel.json` in your project root:
```json
{
  "crons": [{
    "path": "/api/cron/send-reminders",
    "schedule": "0 9 * * *"
  }]
}
```

2. Deploy to Vercel
3. The cron job will run daily at 9:00 AM UTC

**Note:** Make sure `enableAutoReminders` is enabled in Shop Settings.

---

## Troubleshooting

### "Invalid phone number format" Error

- Make sure customer phone numbers are in Pakistan format
- Supported formats: `03001234567`, `923001234567`, `+923001234567`
- The system automatically formats them to `+923001234567`

### "Failed to send WhatsApp" Error

**For Sandbox:**
- Make sure the recipient has joined the sandbox
- Send the join code to the sandbox number from the recipient's WhatsApp
- Check that `TWILIO_WHATSAPP_FROM` is set to the sandbox number

**For Production:**
- Verify your WhatsApp Business Account is approved
- Check that `TWILIO_WHATSAPP_FROM` is set to your approved number
- Ensure your Twilio account has sufficient balance

### Messages Not Being Sent

1. Check `WHATSAPP_DEV_MODE` - if `true`, messages are mocked
2. Verify Twilio credentials are correct
3. Check Twilio Console → Monitor → Logs for errors
4. Ensure your Twilio account has sufficient balance

### Sandbox Join Code Not Working

- Make sure you're sending the message from WhatsApp (not SMS)
- The join code is case-sensitive
- Try sending just the code without any other text
- Check the Twilio Console for the exact join code format

---

## Cost Information

### WhatsApp Pricing (Twilio)

- **Per message**: $0.005 - $0.01 USD
- **No monthly fees** for the sender number
- **Pay-as-you-go** pricing

### Example Costs

- 100 reminders/month: ~$0.50 - $1.00
- 1,000 reminders/month: ~$5.00 - $10.00
- 10,000 reminders/month: ~$50.00 - $100.00

**Note:** Costs may vary based on destination country and message length.

---

## Best Practices

1. **Start with Sandbox**: Test thoroughly before requesting production approval
2. **Use Development Mode**: Test without incurring costs during development
3. **Monitor Usage**: Check Twilio Console regularly for usage and costs
4. **Set Up Alerts**: Configure Twilio billing alerts to avoid surprises
5. **Message Content**: Keep messages clear and professional
6. **Timing**: Send reminders during business hours for better response rates

---

## Support

- **Twilio Documentation**: https://www.twilio.com/docs/whatsapp
- **Twilio Support**: https://support.twilio.com
- **WhatsApp Business API**: https://www.twilio.com/whatsapp

---

## Migration from SMS

If you were previously using SMS:

1. ✅ All code has been updated to use WhatsApp
2. ✅ No changes needed to your database
3. ✅ Settings remain the same (just renamed from SMS to WhatsApp)
4. ✅ Update your `.env.local` with `TWILIO_WHATSAPP_FROM` instead of `TWILIO_PHONE_NUMBER`
5. ✅ Remove `TWILIO_PHONE_NUMBER` from your environment variables

---

## Next Steps

1. ✅ Set up Twilio account
2. ✅ Enable WhatsApp in Twilio Console
3. ✅ Configure environment variables
4. ✅ Test with sandbox or development mode
5. ✅ Request production WhatsApp Business Account (optional)
6. ✅ Configure settings in the app
7. ✅ Start sending reminders!

Happy messaging! 🎉

