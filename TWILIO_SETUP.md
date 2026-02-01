# Twilio SMS Setup Guide

This guide will help you set up Twilio SMS notifications for installment reminders in your shop management system.

## Prerequisites

1. A Twilio account (sign up at https://www.twilio.com)
2. A Twilio phone number with SMS capabilities
3. Twilio Account SID and Auth Token

## Step 1: Get Twilio Credentials

1. Log in to your Twilio Console: https://console.twilio.com
2. Navigate to the Dashboard
3. Find your **Account SID** and **Auth Token** (keep these secure!)
4. Go to **Phone Numbers** > **Manage** > **Active numbers** to get your Twilio phone number

## Step 2: Configure Environment Variables

Add the following environment variables to your `.env.local` file (or your deployment environment):

```env
# Twilio Configuration
TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+923001234567  # Your Twilio phone number in E.164 format
```

**Important Notes:**
- The `TWILIO_PHONE_NUMBER` must be in E.164 format (e.g., `+923001234567`)
- For Pakistan, Twilio phone numbers typically start with `+92`
- Make sure your Twilio phone number has SMS capabilities enabled

## Step 3: Phone Number Format

The system automatically formats Pakistan phone numbers. It accepts:
- `03001234567` → Converts to `+923001234567`
- `923001234567` → Converts to `+923001234567`
- `+923001234567` → Used as is

## Step 4: Testing the Setup

### Test Single Reminder

Send a reminder to a specific customer:

```bash
POST /api/sms/send-reminder
Content-Type: application/json

{
  "customerId": "customer_id_here",
  "installmentNumber": 1  // Optional: if not provided, sends for next pending installment
}
```

### Test Bulk Reminders

Send reminders to all customers with upcoming installments:

```bash
POST /api/sms/send-reminders
Content-Type: application/json

{
  "daysAhead": 7,  // Optional: default is 7 days
  "sendAll": false  // Optional: if true, sends for all pending installments
}
```

### Preview Reminders (without sending)

Check which customers would receive reminders:

```bash
GET /api/sms/send-reminders?daysAhead=7&sendAll=false
```

## Step 5: SMS Message Format

The reminder SMS will be sent in the following format:

```
Assalam-o-Alaikum [Customer Name],

Your installment #[Number] for [Phone Name] is due on [Date].
Amount: Rs. [Amount]

Please make the payment on time.
Contact: [Shop Phone]
Thank you!
[Shop Name]
```

## Step 6: Setting Up Automated Reminders

**✅ Automatic reminders are now built-in!** See `AUTOMATIC_REMINDERS.md` for complete setup instructions.

### Quick Setup:

**For Vercel Deployment:**
- The `vercel.json` file is already configured
- Just deploy and set your environment variables
- Reminders will run automatically daily at 9:00 AM

**For Local Development:**
1. Add to `.env.local`:
   ```env
   ENABLE_AUTO_REMINDERS=true
   ```
2. Run in a separate terminal:
   ```bash
   npm run dev:cron
   ```

**For Manual/External Cron:**
- You can still use external cron services
- Call: `GET /api/cron/send-reminders` or `POST /api/sms/send-reminders`

## Troubleshooting

### Error: "Twilio credentials not configured"
- Make sure all three environment variables are set correctly
- Restart your development server after adding environment variables

### Error: "Invalid phone number format"
- Ensure customer contact info is a valid Pakistan phone number
- The system will try to format it automatically, but it must be a valid format

### Error: "Failed to send SMS"
- Check your Twilio account balance
- Verify your Twilio phone number has SMS capabilities
- Check Twilio console for error logs

### SMS Not Received
- Verify the phone number format is correct
- Check if the number is opted out of SMS (check Twilio console)
- Ensure you have sufficient Twilio credits

## Cost Considerations

- Twilio charges per SMS sent
- Pakistan SMS rates vary, check Twilio pricing
- Consider setting up a daily limit or budget alerts in Twilio

## Security Notes

- Never commit your `.env.local` file to version control
- Keep your Auth Token secure
- Use environment variables in production
- Consider rate limiting the SMS endpoints

## Support

For Twilio-specific issues, refer to:
- Twilio Documentation: https://www.twilio.com/docs
- Twilio Support: https://support.twilio.com

