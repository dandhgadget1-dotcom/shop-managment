# Quick Guide: Test Real WhatsApp Messages

Follow these steps to send real WhatsApp messages to your phone for testing.

## Step 1: Get Your Twilio WhatsApp Sandbox Details

1. **Go to Twilio Console**: https://console.twilio.com
2. **Navigate to**: Messaging → Try it out → Send a WhatsApp message
3. **You'll see**:
   - **Sandbox Number**: `+1 415 523 8886` (or similar)
   - **Join Code**: Something like `join example-code` (note this down!)

## Step 2: Join the Twilio Sandbox from Your WhatsApp

1. **Open WhatsApp** on your phone (the number you want to receive test messages)
2. **Send a message** to the sandbox number: `+1 415 523 8886`
3. **Send the join code** you got from Step 1
   - Example: If the code is `join example-code`, send exactly: `join example-code`
4. **Wait for confirmation** - You should receive a message like "You're all set! You can send and receive messages from the Twilio Sandbox."

## Step 3: Update Your Environment Variables

1. **Open your `.env.local` file** in the project root
2. **Make sure you have these variables**:

```env
# Twilio Configuration
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here

# WhatsApp Configuration
# Use the sandbox number from Twilio Console
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886

# IMPORTANT: Set this to false to send real messages
WHATSAPP_DEV_MODE=false
```

3. **Save the file**

## Step 4: Restart Your Development Server

1. **Stop your current server** (Ctrl+C in terminal)
2. **Start it again**:
   ```bash
   npm run dev
   ```

## Step 5: Test Sending a Real WhatsApp Message

1. **Open your app** in the browser
2. **Go to a customer** with an installment payment
3. **Click the "Send Reminder" button** (message icon) next to a pending installment
4. **Check your WhatsApp** - You should receive the message within a few seconds!

## Troubleshooting

### "Message not received"
- ✅ Make sure you joined the sandbox (Step 2)
- ✅ Check that `WHATSAPP_DEV_MODE=false` in `.env.local`
- ✅ Restart your dev server after changing `.env.local`
- ✅ Verify `TWILIO_WHATSAPP_FROM` matches the sandbox number from Twilio Console

### "Failed to send WhatsApp" error
- ✅ Check your Twilio credentials are correct
- ✅ Verify your Twilio account has balance (even free trial has $15.50)
- ✅ Check Twilio Console → Monitor → Logs for error details

### Still seeing "DEV MODE" in console
- ✅ Make sure `.env.local` has `WHATSAPP_DEV_MODE=false` (not `true`)
- ✅ Restart your dev server completely
- ✅ Check for typos in the variable name

## What You Should See

### In Console (when working):
```
POST /api/sms/send-reminder 200 in XXXms
```
(No "DEV MODE" message)

### In Twilio Console:
1. Go to **Monitor** → **Logs** → **Messaging**
2. You'll see your message with status: `delivered`, `sent`, or `failed`

### In Your WhatsApp:
You'll receive the actual reminder message with:
- Customer name
- Installment details
- Due date
- Amount
- Shop contact info

## Next Steps

Once testing works:
1. **Add more test numbers** to the sandbox (up to 5 numbers)
2. **Test with real customer data**
3. **When ready for production**, apply for WhatsApp Business Account in Twilio Console

---

**Note**: Sandbox only works with numbers that have joined. For production, you'll need WhatsApp Business Account approval.
