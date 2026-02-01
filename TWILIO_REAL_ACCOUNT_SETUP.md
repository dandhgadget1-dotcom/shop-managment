# Twilio Real Account Setup Guide for Pakistan

## 🚀 Step-by-Step: Upgrade to Paid Twilio Account

### Step 1: Upgrade Your Twilio Account

1. **Log in to Twilio Console:**
   - Go to: https://console.twilio.com
   - Sign in with your existing trial account (or create new account)

2. **Upgrade to Paid Account:**
   - Click on your account name (top right)
   - Go to **Billing** → **Payment Methods**
   - Click **"Add Payment Method"**
   - Enter your credit/debit card details
   - **Minimum:** No minimum deposit required! Pay as you go.

3. **Verify Your Account:**
   - Twilio may ask for phone verification
   - May require business information (if sending to many numbers)
   - Usually takes a few minutes to approve

### Step 2: Get a Twilio Phone Number for Pakistan

1. **Navigate to Phone Numbers:**
   - Go to: https://console.twilio.com/us1/develop/phone-numbers/manage/search
   - Or: Dashboard → Phone Numbers → Buy a number

2. **Search for Pakistan Number:**
   - Click **"Buy a number"**
   - Select **Country:** Pakistan
   - Check **"SMS"** capability (required)
   - Optionally check **"Voice"** if you want voice calls later
   - Click **"Search"**

3. **Purchase a Number:**
   - You'll see available numbers (usually costs ~$1-2/month)
   - Select a number you like
   - Click **"Buy"** or **"Purchase"**
   - Confirm the purchase

4. **Note Your Number:**
   - Copy the phone number (e.g., +923001234567)
   - This is your `TWILIO_PHONE_NUMBER`

### Step 3: Get Your Credentials

1. **Account SID:**
   - Dashboard → Overview
   - Copy **"Account SID"** (starts with `AC...`)

2. **Auth Token:**
   - Dashboard → Overview
   - Click **"Show"** next to Auth Token
   - Copy the **Auth Token** (keep this secret!)

3. **Phone Number:**
   - Phone Numbers → Manage → Active numbers
   - Copy your purchased number (e.g., +923001234567)

### Step 4: Configure Environment Variables

1. **Open `.env.local` file** in your project root

2. **Add/Update these variables:**
   ```env
   # Twilio Configuration (REAL ACCOUNT)
   TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   TWILIO_AUTH_TOKEN=your_auth_token_here
   TWILIO_PHONE_NUMBER=+923001234567
   
   # Disable Development Mode (set to false or remove)
   SMS_DEV_MODE=false
   ```

3. **Save the file**

4. **Restart your development server:**
   ```bash
   npm run dev
   ```

### Step 5: Test Real SMS Sending

1. **Test with Your Own Number First:**
   - Go to your application
   - Open a customer with installment payment
   - Click "Send Reminder" button
   - Check your phone for the SMS

2. **Verify It Works:**
   - You should receive the SMS within seconds
   - Check Twilio Console → Monitor → Logs → Messaging
   - You'll see the message status and cost

---

## 💰 Twilio Pricing for Pakistan

### SMS Costs:
- **Pakistan Mobile:** ~$0.05-0.08 per SMS
- **Varies by carrier:** Jazz, Telenor, Ufone, Zong
- **No monthly fees** (pay per SMS only)

### Phone Number Cost:
- **Monthly fee:** ~$1-2/month for Pakistan number
- **One-time setup:** Usually free

### Example Monthly Cost:
- **100 SMS/month:** ~$5-8 + $1-2 (number) = **$6-10/month**
- **500 SMS/month:** ~$25-40 + $1-2 (number) = **$26-42/month**

---

## 🔒 Security Best Practices

1. **Never commit `.env.local` to Git:**
   - It's already in `.gitignore`
   - Double-check it's not tracked

2. **Use Environment Variables in Production:**
   - Vercel: Settings → Environment Variables
   - Other hosts: Use their environment variable system

3. **Rotate Auth Token if Exposed:**
   - Twilio Console → Account → Auth Tokens
   - Create new token, update `.env.local`

---

## 📋 Checklist Before Going Live

- [ ] Twilio account upgraded to paid
- [ ] Payment method added
- [ ] Pakistan phone number purchased
- [ ] Credentials copied to `.env.local`
- [ ] `SMS_DEV_MODE=false` or removed
- [ ] Tested with your own number
- [ ] Verified SMS received successfully
- [ ] Checked Twilio console for message logs

---

## 🐛 Troubleshooting

### Error: "Invalid 'To' Phone Number"
- **Solution:** Make sure phone number is in format: `+923001234567`
- The system auto-formats, but verify customer phone numbers are correct

### Error: "The number is unverified"
- **Solution:** This only happens in trial accounts. Paid accounts can send to any valid number.

### Error: "Insufficient funds"
- **Solution:** Add payment method and ensure card is valid
- Twilio charges automatically when balance is low

### SMS Not Received
- **Check Twilio Console:** Monitor → Logs → Messaging
- **Check status:** "delivered", "failed", "queued"
- **Check phone number format:** Must be +923001234567
- **Check carrier:** Some carriers may block SMS (rare)

---

## 📞 Twilio Support

- **Documentation:** https://www.twilio.com/docs
- **Support:** https://support.twilio.com
- **Status Page:** https://status.twilio.com
- **Community:** https://stackoverflow.com/questions/tagged/twilio

---

## 🎯 Next Steps After Setup

1. **Test thoroughly** with a few real customers
2. **Monitor costs** in Twilio Console → Billing
3. **Set up alerts** for high usage (optional)
4. **Consider bulk sending** optimization if sending many SMS
5. **Track delivery rates** in Twilio Console

---

## 💡 Pro Tips

1. **Start Small:** Test with 5-10 customers first
2. **Monitor Costs:** Check Twilio billing dashboard regularly
3. **Optimize Messages:** Shorter messages = same cost, better delivery
4. **Schedule Wisely:** Send reminders during business hours (better response)
5. **Track Results:** Monitor which customers respond to reminders

---

## ✅ You're Ready!

Once you've completed these steps, your application will send real SMS reminders to customers in Pakistan. The system will automatically format phone numbers and send reminders when you click the "Send Reminder" button in the Installments Ledger.

Good luck with your real-world testing! 🚀

