# study.io Premium - Razorpay Subscriptions Setup Guide

This guide details all manual steps required in the **Supabase**, **Razorpay**, and **Vercel** dashboards to enable and test recurring paid subscriptions.

---

## 1. Supabase Setup

### Step 1.1: Run the Database Migration
1. Log into your [Supabase Dashboard](https://supabase.com/dashboard).
2. Select your project.
3. In the left navigation, click on **SQL Editor**.
4. Click **New query**, paste the contents of `billing_migration.sql`, and click **Run**.
5. Verify that the following tables exist under **Table Editor**:
   - `subscriptions`: Contains columns `user_id`, `provider`, `provider_subscription_id`, `plan`, `status`, `premium_until`, `cancel_at_cycle_end`, timestamps, and RLS enabled.
   - `billing_events`: Contains columns `id`, `type`, `payload`, `received_at`, and RLS enabled (no user access).

### Step 1.2: Copy the Supabase Service Role Key
1. In the left navigation, go to **Project Settings** (gear icon) > **API**.
2. Under **Project API keys**, find `service_role` (labeled "secret").
3. Click to copy this key.
   > **Security Notice**: This key bypasses Row-Level Security. Keep it confidential and never expose it in client code or commit it to Git.

---

## 2. Razorpay Dashboard Setup (Test Mode)

### Step 2.1: Enable Test Mode
1. Log into your [Razorpay Dashboard](https://dashboard.razorpay.com).
2. At the top of the dashboard, ensure the toggle is set to **Test Mode**. (All test transactions use fake funds).

### Step 2.2: Generate API Keys
1. In the left sidebar, navigate to **Account & Settings** > **API Keys** (under Website and app settings).
2. Click **Generate Test Key** (or copy your existing Key ID and Key Secret).
3. Save:
   - **Key ID**: Starts with `rzp_test_...` (will be mapped to `NEXT_PUBLIC_RAZORPAY_KEY_ID`).
   - **Key Secret**: (will be mapped to `RAZORPAY_KEY_SECRET`).

### Step 2.3: Create Subscription Plans
1. In the Razorpay sidebar, go to **Subscriptions** > **Plans**.
2. Click **+ Create Plan**.

#### Plan A: Monthly Plan
- **Plan Type**: `Monthly`
- **Plan Name**: `study.io Premium Monthly`
- **Billing Frequency**: Every `1` `Month`
- **Amount**: `₹499` (or desired test amount in INR)
- **Description**: `Full access to study.io Premium, advanced insights, and custom themes.`
- Click **Create Plan**.
- Copy the generated **Plan ID** (starts with `plan_...`).

#### Plan B: Yearly Plan
- **Plan Type**: `Yearly`
- **Plan Name**: `study.io Premium Yearly`
- **Billing Frequency**: Every `1` `Year`
- **Amount**: `₹4,999` (or desired test amount in INR)
- **Description**: `Full access to study.io Premium for one year.`
- Click **Create Plan**.
- Copy the generated **Plan ID** (starts with `plan_...`).

### Step 2.4: Configure Webhooks
1. In the Razorpay sidebar, go to **Account & Settings** > **Webhooks**.
2. Click **+ Add New Webhook**.
3. Fill in the details:
   - **Webhook URL**:
     - *For Production (Vercel)*: `https://<YOUR-APP-DOMAIN>.vercel.app/api/billing/webhook`
     - *For Local Testing*: Use a tunnel (e.g. `ngrok http 3000`), URL: `https://<YOUR-TUNNEL>.ngrok-free.app/api/billing/webhook`
   - **Secret**: Enter a secure random string (e.g. 32 alphanumeric characters). Copy this secret (will be mapped to `RAZORPAY_WEBHOOK_SECRET`).
   - **Alert Email**: Enter your developer notification email.
4. Under **Active Events**, select the following Subscription events:
   - `subscription.authenticated`
   - `subscription.activated`
   - `subscription.charged`
   - `subscription.completed`
   - `subscription.cancelled`
   - `subscription.halted`
   - `subscription.paused`
   - `subscription.resumed`
5. Click **Create Webhook**.

---

## 3. Environment Variables

### Local Development (`.env.local`)
Create or edit `.env.local` in the project root:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-id>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Razorpay Client Key (Exposed to browser)
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_...

# Razorpay Server Secrets (NEVER exposed to browser)
RAZORPAY_KEY_SECRET=your_test_key_secret_here
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret_here
RAZORPAY_PLAN_ID_MONTHLY=plan_...
RAZORPAY_PLAN_ID_YEARLY=plan_...
```

### Production / Vercel Dashboard
1. Go to your [Vercel Dashboard](https://vercel.com/dashboard).
2. Select your `study.io` project.
3. Navigate to **Settings** > **Environment Variables**.
4. Add all variables listed above for **Production**, **Preview**, and **Development** environments.
5. Trigger a redeploy to apply the environment variables.

---

## 4. API Endpoints Reference

All routes run on the Node.js runtime (`runtime = 'nodejs'`) and strictly guard server secrets:

| Route | Method | Description | Auth Required |
|---|---|---|---|
| `/api/billing/plans` | `GET` | Fetches live monthly/yearly plan details from Razorpay (cached 1 hour). | Public |
| `/api/billing/create-subscription` | `POST` | Generates a Razorpay subscription with `{ user_id }` notes. Returns `{ subscriptionId }`. | Authenticated |
| `/api/billing/verify` | `POST` | Timing-safe HMAC SHA256 verification of checkout payment signature and syncs status. | Authenticated |
| `/api/billing/sync` | `POST` | Queries Razorpay for latest status and updates database with 1-day grace period. | Authenticated |
| `/api/billing/cancel` | `POST` | Calls Razorpay cancel at cycle end and updates `cancel_at_cycle_end`. | Authenticated |
| `/api/billing/webhook` | `POST` | Verifies `x-razorpay-signature`, enforces idempotency via `billing_events`, and syncs updates. | Signature Checked |

---

## 5. Testing with Razorpay Test Cards & UPI

When testing checkout in Razorpay Test Mode:
- **Card**: Use Razorpay standard test cards (Card number `4111 1111 1111 1111`, any future expiry date, CVV `123`, OTP `123456`).
- **UPI**: Use `success@razorpay` to simulate a successful mandate and first charge.
