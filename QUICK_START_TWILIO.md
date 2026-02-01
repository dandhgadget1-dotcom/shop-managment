# 🚀 Quick Start: Real Twilio SMS Setup (5 Minutes)

## Step 1: Upgrade Twilio Account (2 minutes)

1. Go to: https://console.twilio.com
2. Click **Billing** → **Payment Methods**
3. Add your credit/debit card
4. ✅ Account upgraded!

## Step 2: Buy Pakistan Phone Number (2 minutes)

1. Go to: https://console.twilio.com/us1/develop/phone-numbers/manage/search
2. Click **"Buy a number"**
3. Select **Country: Pakistan**
4. Check **"SMS"** capability
5. Click **"Search"** → **"Buy"**
6. ✅ Number purchased!

## Step 3: Get Credentials (1 minute)

1. **Account SID:** Dashboard → Copy "Account SID" (starts with `AC...`)
2. **Auth Token:** Dashboard → Click "Show" → Copy token
3. **Phone Number:** Phone Numbers → Active numbers → Copy your number

## Step 4: Configure (30 seconds)

1. Open `.env.local` file
2. Add/Update:
   ```env
   TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   TWILIO_AUTH_TOKEN=your_auth_token_here
   TWILIO_PHONE_NUMBER=+923001234567
   SMS_DEV_MODE=false
   ```
3. Save file
4. Restart server: `npm run dev`

## Step 5: Test! 🎉

1. Open your app
2. Go to a customer with installments
3. Click **"Send Reminder"** button
4. Check your phone - SMS should arrive! 📱

---

## 💰 Cost

- **Phone Number:** ~$1-2/month
- **SMS to Pakistan:** ~$0.05-0.08 per SMS
- **Example:** 100 SMS/month = ~$6-10/month

---

## ❌ Troubleshooting

**"Twilio credentials not configured"**
→ Check `.env.local` has all 3 variables

**"Invalid phone number"**
→ Make sure customer phone is in format: +923001234567

**SMS not received**
→ Check Twilio Console → Monitor → Logs → Messaging

---

## 📚 Full Guide

For detailed instructions, see: **TWILIO_REAL_ACCOUNT_SETUP.md**

---

✅ **You're ready to send real SMS!** 🚀

