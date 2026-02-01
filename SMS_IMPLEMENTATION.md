# SMS Reminder System Implementation

## Overview

A complete SMS notification system has been implemented using Twilio to send installment reminders to customers in Pakistan. The system automatically formats Pakistan phone numbers and sends reminders about upcoming installments.

## Features Implemented

### 1. Twilio Integration (`src/lib/twilio.js`)
- ✅ Twilio client initialization
- ✅ Pakistan phone number formatting (handles multiple formats)
- ✅ SMS sending functionality
- ✅ Installment reminder message generation

### 2. API Endpoints

#### Send Single Reminder
- **Endpoint**: `POST /api/sms/send-reminder`
- **Body**: 
  ```json
  {
    "customerId": "customer_id",
    "installmentNumber": 1  // Optional
  }
  ```
- Sends a reminder to a specific customer for a specific installment

#### Send Bulk Reminders
- **Endpoint**: `POST /api/sms/send-reminders`
- **Body**:
  ```json
  {
    "daysAhead": 7,  // Optional, default: 7
    "sendAll": false  // Optional, default: false
  }
  ```
- Checks all customers and sends reminders for upcoming installments

#### Preview Reminders
- **Endpoint**: `GET /api/sms/send-reminders?daysAhead=7&sendAll=false`
- Returns a preview of customers who would receive reminders (without sending)

### 3. Frontend Integration

#### API Client (`src/lib/api.js`)
- Added `smsAPI` object with three methods:
  - `sendReminder(customerId, installmentNumber)`
  - `sendReminders(daysAhead, sendAll)`
  - `previewReminders(daysAhead, sendAll)`

#### UI Component Updates (`src/components/InstallmentsLedger.jsx`)
- Added "Send Reminder" button (MessageSquare icon) for pending installments
- Button appears next to "Record Payment" button
- Shows toast notifications for success/error
- Disabled state while sending

## Setup Instructions

### 1. Install Dependencies
```bash
npm install twilio
```

### 2. Configure Environment Variables

Add to `.env.local`:
```env
TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+923001234567
```

### 3. Get Twilio Credentials

1. Sign up at https://www.twilio.com
2. Get Account SID and Auth Token from dashboard
3. Purchase a phone number with SMS capabilities
4. For Pakistan, ensure the number supports local SMS

## Phone Number Format

The system automatically formats Pakistan phone numbers. Accepts:
- `03001234567` → `+923001234567`
- `923001234567` → `+923001234567`
- `+923001234567` → Used as is

## SMS Message Format

```
Assalam-o-Alaikum [Customer Name],

Your installment #[Number] for [Phone Name] is due on [Date].
Amount: Rs. [Amount]

Please make the payment on time.
Contact: [Shop Phone]
Thank you!
[Shop Name]
```

## Usage Examples

### Send Reminder from UI
1. Open customer's Installments Ledger
2. Find pending installment
3. Click the MessageSquare icon button
4. Toast notification will show success/error

### Send Reminder via API
```javascript
import { smsAPI } from '@/lib/api';

// Send reminder for next pending installment
await smsAPI.sendReminder(customerId);

// Send reminder for specific installment
await smsAPI.sendReminder(customerId, 3);
```

### Send Bulk Reminders
```javascript
// Send reminders for installments due in next 7 days
await smsAPI.sendReminders(7, false);

// Send reminders for all pending installments
await smsAPI.sendReminders(7, true);
```

## Automated Reminders

Set up automated daily reminders using:

### Cron Job (Server)
```bash
0 9 * * * curl -X POST http://localhost:3000/api/sms/send-reminders \
  -H "Content-Type: application/json" \
  -d '{"daysAhead":7}'
```

### Vercel Cron
Create `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/sms/send-reminders",
    "schedule": "0 9 * * *"
  }]
}
```

## Error Handling

- Invalid phone numbers are caught and reported
- Missing Twilio credentials show clear error messages
- Failed SMS sends are logged and reported via toast
- Customer without contact info is skipped gracefully

## Security Notes

- Never commit `.env.local` to version control
- Keep Twilio Auth Token secure
- Consider rate limiting SMS endpoints
- Monitor Twilio usage and costs

## Cost Considerations

- Twilio charges per SMS sent
- Pakistan SMS rates vary (check Twilio pricing)
- Consider setting up budget alerts in Twilio
- Monitor usage in Twilio console

## Troubleshooting

See `TWILIO_SETUP.md` for detailed troubleshooting guide.

## Files Created/Modified

### New Files
- `src/lib/twilio.js` - Twilio service utility
- `src/app/api/sms/send-reminder/route.js` - Single reminder endpoint
- `src/app/api/sms/send-reminders/route.js` - Bulk reminders endpoint
- `TWILIO_SETUP.md` - Setup guide
- `SMS_IMPLEMENTATION.md` - This file

### Modified Files
- `src/lib/api.js` - Added SMS API functions
- `src/components/InstallmentsLedger.jsx` - Added send reminder button
- `package.json` - Added twilio dependency

## Next Steps

1. Configure Twilio credentials in environment variables
2. Test with a single customer first
3. Set up automated cron job for daily reminders
4. Monitor Twilio usage and costs
5. Consider adding SMS history/logging feature

