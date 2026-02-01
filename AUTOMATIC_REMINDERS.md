# Automatic SMS Reminders Setup

This guide explains how to set up **automatic** SMS reminders that run without manual intervention.

## Overview

The system supports automatic reminders in two ways:
1. **Vercel Deployment**: Uses Vercel Cron (configured in `vercel.json`)
2. **Local Development**: Uses a standalone cron server (`cron-server.js`)

## Quick Setup

### For Vercel Deployment (Recommended)

1. **Deploy to Vercel** - The `vercel.json` file is already configured
2. **Set Environment Variables** in Vercel:
   ```
   TWILIO_ACCOUNT_SID=your_account_sid
   TWILIO_AUTH_TOKEN=your_auth_token
   TWILIO_PHONE_NUMBER=+923001234567
   SMS_REMINDER_DAYS_AHEAD=7
   CRON_SECRET=your_secret_key (optional, for security)
   ```

3. **That's it!** Vercel will automatically call `/api/cron/send-reminders` daily at 9:00 AM (Pakistan time)

### For Local Development

1. **Set Twilio credentials in `.env.local`**:
   ```env
   TWILIO_ACCOUNT_SID=your_account_sid
   TWILIO_AUTH_TOKEN=your_auth_token
   TWILIO_PHONE_NUMBER=+923001234567
   REMINDER_CRON_SCHEDULE=0 9 * * *  # 9 AM daily (optional)
   CRON_SECRET=your_secret_key (optional)
   ```

2. **Enable automatic reminders in UI**:
   - Go to Settings (gear icon in Customers Table)
   - Scroll to "SMS Reminder Settings"
   - Check "Enable Automatic SMS Reminders"
   - Set "Reminder Days Ahead" (default: 7)
   - Save settings

3. **Start the cron server** (in a separate terminal):
   ```bash
   npm run dev:cron
   ```

4. **Start your Next.js app** (in another terminal):
   ```bash
   npm run dev
   ```

**Note:** All SMS settings (enable/disable, days ahead) are now managed in the Shop Settings UI - no need to update environment variables!

## Configuration Options

### SMS Settings (Managed in UI)

**All SMS reminder settings are now managed in Shop Settings UI:**

| Setting | Description | Default | Location |
|---------|-------------|---------|----------|
| Enable Automatic SMS Reminders | Enable automatic daily reminders | `false` | Shop Settings → SMS Reminder Settings |
| Enable Manual SMS Reminders | Enable manual reminder button | `true` | Shop Settings → SMS Reminder Settings |
| Reminder Days Ahead | Days before due date to send reminders | `7` | Shop Settings → SMS Reminder Settings |

### Environment Variables (For Twilio & Cron Schedule Only)

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `TWILIO_ACCOUNT_SID` | Twilio Account SID | - | Yes |
| `TWILIO_AUTH_TOKEN` | Twilio Auth Token | - | Yes |
| `TWILIO_PHONE_NUMBER` | Twilio phone number | - | Yes |
| `REMINDER_CRON_SCHEDULE` | Cron schedule (local only) | `0 9 * * *` | No |
| `CRON_SECRET` | Secret key for cron endpoint security | - | No |
| `TZ` | Timezone | `Asia/Karachi` | No |

**Note:** Enable/disable and days ahead settings are now in the UI - no need to update environment variables!

### Cron Schedule Format

The cron schedule uses standard cron syntax: `minute hour day month weekday`

Examples:
- `0 9 * * *` - Daily at 9:00 AM
- `0 10 * * 1` - Every Monday at 10:00 AM
- `0 9,15 * * *` - Daily at 9:00 AM and 3:00 PM
- `*/30 9-17 * * *` - Every 30 minutes from 9 AM to 5 PM

## How It Works

### Automatic Flow

1. **Cron triggers** the endpoint `/api/cron/send-reminders` at scheduled time
2. **System checks** all customers with installment payments
3. **Finds upcoming installments** within the configured days ahead
4. **Sends SMS reminders** to customers with pending installments
5. **Logs results** for monitoring

### What Gets Sent

- Reminders are sent for installments due within the next N days (default: 7 days)
- Only pending (unpaid) installments receive reminders
- Customers without contact information are skipped
- Each customer receives one reminder per upcoming installment

## Monitoring

### Check Cron Logs

**Vercel:**
- Go to Vercel Dashboard → Your Project → Functions → Cron Jobs
- View execution logs and status

**Local Development:**
- Check the terminal running `npm run dev:cron`
- Logs show:
  - When the job runs
  - How many reminders were sent
  - Success/failure status

### Manual Testing

You can manually trigger the cron job:

```bash
# Using curl
curl http://localhost:3000/api/cron/send-reminders

# With secret (if configured)
curl http://localhost:3000/api/cron/send-reminders?secret=your_secret
```

## Troubleshooting

### Reminders Not Sending

1. **Check if automatic reminders are enabled:**
   - Vercel: Check environment variables
   - Local: Ensure `ENABLE_AUTO_REMINDERS=true` and cron server is running

2. **Check Twilio credentials:**
   - Verify all Twilio environment variables are set
   - Test manually using the "Send Reminder" button in UI

3. **Check cron schedule:**
   - Verify the schedule is correct
   - For Vercel, check `vercel.json`
   - For local, check `REMINDER_CRON_SCHEDULE` in `.env.local`

4. **Check logs:**
   - Vercel: Check function logs in dashboard
   - Local: Check cron server terminal output

### Cron Job Not Running

**Vercel:**
- Ensure `vercel.json` is committed and deployed
- Check Vercel dashboard for cron job status
- Verify the endpoint `/api/cron/send-reminders` is accessible

**Local:**
- Ensure `npm run dev:cron` is running
- Check that `ENABLE_AUTO_REMINDERS=true` is set
- Verify the cron schedule format is correct

## Security

### Protecting the Cron Endpoint

The cron endpoint can be protected with a secret:

1. Set `CRON_SECRET` in environment variables
2. The endpoint will require the secret in:
   - Header: `x-cron-secret`
   - Query parameter: `?secret=your_secret`

**Note:** Vercel Cron automatically includes security headers, but adding a secret provides extra protection.

## Cost Management

- **Monitor Twilio usage** regularly
- **Set up Twilio budget alerts**
- **Adjust `SMS_REMINDER_DAYS_AHEAD`** to control how many reminders are sent
- **Use preview endpoint** to check before enabling automatic reminders:
  ```bash
  GET /api/sms/send-reminders?daysAhead=7
  ```

## Disabling Automatic Reminders

**Vercel:**
- Remove or comment out the cron job in `vercel.json`
- Or set `SMS_REMINDER_DAYS_AHEAD=0` to effectively disable

**Local:**
- Stop the cron server (`Ctrl+C`)
- Or set `ENABLE_AUTO_REMINDERS=false` in `.env.local`

## Next Steps

1. ✅ Set up Twilio credentials
2. ✅ Enable automatic reminders
3. ✅ Test with a single customer first
4. ✅ Monitor the first few automatic runs
5. ✅ Adjust schedule and days ahead as needed

## Support

For issues:
- Check Twilio console for SMS delivery status
- Review cron logs for errors
- Test manual reminder sending first
- Verify customer contact information is correct

