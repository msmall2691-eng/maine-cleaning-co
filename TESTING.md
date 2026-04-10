# Testing Plan - Twilio + Stripe Integration

## 📋 Prerequisites

Before testing, ensure:

```bash
# Environment variables set
TWILIO_ACCOUNT_SID=✅
TWILIO_AUTH_TOKEN=✅
TWILIO_PHONE_NUMBER=✅
STRIPE_SECRET_KEY=✅
STRIPE_WEBHOOK_SECRET=✅
DATABASE_URL=✅

# Database migrated
npm run db:push

# Dev server running
npm run dev
```

---

## 🧪 Test Suite 1: Data Model & Validation

### Test 1.1: Phone Normalization
```bash
POST /api/intake/submit
{
  "name": "Sarah Johnson",
  "email": "sarah@example.com",
  "phone": "555-123-4567",  # Flexible format
  "address": "123 Main St",
  "serviceType": "standard",
  "frequency": "weekly",
  "sqft": 1500,
  "bathrooms": 2,
  "petHair": "some",
  "condition": "maintenance",
  "estimateMin": 500,
  "estimateMax": 700
}
```

**Expected**:
- ✅ Phone normalized to +15551234567 (E.164)
- ✅ Approval token generated (24h expiry)
- ✅ Response includes submissionId and approvalLink
- ✅ SMS sent automatically (if Twilio configured)

### Test 1.2: Email/Phone Validation
```bash
# Should fail - no email or phone
POST /api/intake/submit
{
  "name": "Test",
  "serviceType": "standard",
  "estimateMin": 500,
  "estimateMax": 700
}
```

**Expected**:
- ❌ 422 error: "Either email or phone number is required"

### Test 1.3: Amount Validation
```bash
# Should fail - min > max
POST /api/intake/submit
{
  "name": "Test",
  "email": "test@example.com",
  "estimateMin": 700,
  "estimateMax": 500  # Invalid
}
```

**Expected**:
- ❌ 422 error: "Minimum estimate must be less than or equal to maximum estimate"

---

## 🧪 Test Suite 2: SMS Approval Workflow

### Test 2.1: Approval Token (Single Use)
```bash
# First approval should work
GET /api/sms/approval-link/abc123...token...

# Second approval should fail
GET /api/sms/approval-link/abc123...token...
```

**Expected**:
- ✅ First call: 200 OK, "Your request has been approved"
- ❌ Second call: 400 error, "This request has already been approved"

### Test 2.2: Token Expiration
```bash
# Create submission with manual token (for testing)
# Wait 24+ hours OR modify token expiry to past date
GET /api/sms/approval-link/expired_token
```

**Expected**:
- ❌ 410 error: "Approval link has expired (24 hours)"

### Test 2.3: SMS Auto-Approval (Multiple Requests)
```bash
# Create 3 pending requests from same phone number

# Send SMS reply "YES"
POST /api/webhooks/twilio/sms
{
  "From": "+15551234567",
  "To": "+1205551234567",  # Your Twilio number
  "Body": "YES"
}
```

**Expected**:
- ✅ OLDEST pending request approved (not newest)
- ✅ Payment link SMS sent
- ✅ Other requests remain pending

### Test 2.4: SMS Rejection
```bash
POST /api/webhooks/twilio/sms
{
  "From": "+15551234567",
  "To": "+1205551234567",
  "Body": "NO"
}
```

**Expected**:
- ✅ Status set to "rejected"
- ✅ Log shows rejection

### Test 2.5: Phone Validation on Manual SMS Send
```bash
# Try to send SMS to invalid phone
POST /api/sms/send-approval/42
# (where submission 42 has phone "555-123-4567" in E.164 format)
```

**Expected**:
- ❌ If phone not E.164: 400 error, "Invalid phone number format"
- ✅ If phone valid: SMS sent successfully

---

## 💳 Test Suite 3: Stripe Payment

### Test 3.1: Checkout Session Creation
```bash
POST /api/payments/create-checkout
{
  "submissionId": 42
}
```

**Expected**:
- ✅ 200 OK with checkoutUrl
- ✅ Checkout URL is valid Stripe URL
- ✅ checkoutUrl contains `/pay/cs_test_...`
- ✅ Response includes submissionId

**Validate in DB**:
```sql
SELECT stripeCustomerId, stripeCheckoutSessionId 
FROM intake_submissions 
WHERE id = 42;
-- Should have both values populated
```

### Test 3.2: Amount in Cents
```bash
# Create submission with estimate min=$500, max=$700
# Average = $600 = 60000 cents

POST /api/payments/create-checkout { "submissionId": 42 }

# Check Stripe session for correct amount
```

**Expected**:
- ✅ Stripe session amount: 60000 (cents)
- ✅ Display as $600.00 in checkout
- ❌ NOT 600 (would show as $6.00)

### Test 3.3: Minimum Amount Check
```bash
# Create submission with very low estimate
POST /api/intake/submit
{
  "estimateMin": 0.10,
  "estimateMax": 0.20
}
# Then try to create checkout
```

**Expected**:
- ❌ 400 error: "Minimum charge is $0.50"

### Test 3.4: Stripe Test Card Payments
```bash
# Use Stripe test cards
Visa: 4242 4242 4242 4242
Visa (fail): 4000 0000 0000 0002

# Click checkout URL from test 3.1
# Enter test card
# Complete payment
```

**Expected**:
- ✅ Payment succeeds (valid card)
- ✅ Webhook received (check logs)
- ✅ Invoice generated
- ✅ Invoice SMS sent
- ❌ Payment fails (invalid card)

---

## 📧 Test Suite 4: Webhook Signature Verification

### Test 4.1: Valid Stripe Webhook
```bash
# Stripe will send properly signed webhook
# Monitor logs for webhook processing
```

**Expected**:
- ✅ Webhook processed
- ✅ Log: "Payment completed - invoice generated"
- ✅ Invoice ID stored in DB

### Test 4.2: Invalid Signature
```bash
# Send POST to /api/webhooks/stripe with wrong signature
curl -X POST http://localhost:5000/api/webhooks/stripe \
  -H "stripe-signature: invalid_signature" \
  -d '{"type": "checkout.session.completed"}'
```

**Expected**:
- ❌ 400 error: "Invalid signature"

### Test 4.3: Idempotency (Duplicate Webhook)
```bash
# Stripe will retry webhook if we don't return 200 quickly
# Second webhook should detect it was already processed

# Simulate by sending same session ID twice
```

**Expected**:
- ✅ First webhook: processes, creates invoice
- ✅ Second webhook: skips, logs "Duplicate webhook - already processed"
- ✅ Only ONE invoice created (idempotency works)

### Test 4.4: Payment Status Check
```bash
# Manually send webhook with payment_status != "paid"
# (requires Stripe test mode setup)
```

**Expected**:
- ❌ Webhook ignored
- ✅ Log: "Session completed but payment not paid"
- ❌ NO invoice created

---

## 📊 Test Suite 5: End-to-End Flow

### Complete Flow Test
```
STEP 1: Submit Form
POST /api/intake/submit
{
  "name": "Test Customer",
  "phone": "555-123-4567",
  "email": "test@example.com",
  "serviceType": "standard",
  "estimateMin": 500,
  "estimateMax": 700
}
✅ Expected: submissionId=42, SMS sent

STEP 2: Approve via SMS
POST /api/webhooks/twilio/sms
{
  "From": "+15551234567",
  "Body": "YES"
}
✅ Expected: approvalStatus=approved, payment SMS sent

STEP 3: Click Payment Link
GET /api/payments/create-checkout
{
  "submissionId": 42
}
✅ Expected: checkoutUrl returned

STEP 4: Complete Payment
- Visit checkoutUrl
- Enter test card: 4242 4242 4242 4242
- Complete payment
✅ Expected: Redirected to /payment-success

STEP 5: Verify Invoice
- Check submission in DB:
  SELECT invoiceId FROM intake_submissions WHERE id=42
✅ Expected: invoiceId populated
- Check SMS logs:
✅ Expected: Invoice SMS sent to +15551234567
```

---

## 🔍 Database Validation Tests

### Check New Fields Exist
```sql
-- After npm run db:push
SELECT column_name FROM information_schema.columns 
WHERE table_name='intake_submissions';
```

**Expected fields**:
- ✅ approval_token
- ✅ approval_token_expires
- ✅ approval_status
- ✅ approval_method
- ✅ approval_timestamp
- ✅ stripe_customer_id
- ✅ stripe_checkout_session_id
- ✅ invoice_id
- ✅ estimated_price

### Verify Data Consistency
```sql
-- Check no approval without timestamp
SELECT id FROM intake_submissions 
WHERE approval_status = 'approved' 
AND approval_timestamp IS NULL;
-- Should return 0 rows

-- Check all stripeCustomerId values valid
SELECT COUNT(*) FROM intake_submissions 
WHERE stripe_customer_id IS NOT NULL 
AND stripe_customer_id NOT LIKE 'cus_%';
-- Should return 0 rows
```

---

## 📋 Manual Checklist

**Before Production**:

- [ ] **Database**
  - [ ] Run `npm run db:push`
  - [ ] Verify all new fields exist in prod DB
  - [ ] No rollback needed

- [ ] **Twilio**
  - [ ] Test SMS sends to your phone
  - [ ] Webhook URL configured in Twilio
  - [ ] Inbound SMS webhook receives messages
  - [ ] Test approval responses work

- [ ] **Stripe**
  - [ ] Use test API keys (not live)
  - [ ] Test payment flow end-to-end
  - [ ] Webhook endpoint created
  - [ ] Webhook secret stored securely
  - [ ] Test webhook signature verification

- [ ] **Code**
  - [ ] No console.errors on successful flow
  - [ ] Phone numbers normalized correctly
  - [ ] Amounts in cents (not dollars)
  - [ ] Timestamps recorded
  - [ ] IDs stored in DB

- [ ] **Security**
  - [ ] Token cannot be reused
  - [ ] Webhook signature verified
  - [ ] Phone format validated
  - [ ] Amount minimum enforced

- [ ] **Logging**
  - [ ] All major actions logged
  - [ ] Errors include context
  - [ ] Webhook events logged
  - [ ] Payment amounts logged

---

## 🚨 Common Issues & Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| SMS not sent | Twilio not configured | Check env vars set |
| Wrong amount charged | Dollars instead of cents | Verify * 100 conversion |
| Duplicate invoices | Webhook retry not idempotent | Check sessionId comparison |
| Payment fails silently | No error logging | Check webhook logs |
| Phone format rejected | Not E.164 | Verify +1234567890 format |
| Token reusable | No status check | Check approvalStatus !== pending |

---

## 📞 Test Credentials

### Stripe Test Cards
```
Success:    4242 4242 4242 4242
Auth fails: 4000 0000 0000 0002
Decline:    5555 5555 5555 4444
```

### Twilio
```
Account: Check .env TWILIO_ACCOUNT_SID
Token: Check .env TWILIO_AUTH_TOKEN
Number: Check .env TWILIO_PHONE_NUMBER
```

---

## ✅ Sign-Off

Test Results:
- [ ] All Unit Tests Pass
- [ ] All Integration Tests Pass
- [ ] End-to-End Flow Works
- [ ] Webhook Signature Valid
- [ ] No Duplicate Transactions
- [ ] Database Schema Correct
- [ ] Error Handling Works
- [ ] Logging Complete

**Ready for Production**: _______________  Date: _______________
