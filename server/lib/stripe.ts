/**
 * Stripe Payment Integration
 *
 * Handles:
 * - Checkout session creation
 * - Payment intent processing
 * - Invoice generation
 * - Subscription management
 *
 * Requires environment variables:
 *   STRIPE_SECRET_KEY
 *   STRIPE_PUBLISHABLE_KEY
 *   STRIPE_WEBHOOK_SECRET
 */

import Stripe from "stripe";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

let stripeClient: Stripe | null = null;

/**
 * Get or initialize Stripe client
 */
function getStripeClient(): Stripe | null {
  if (!STRIPE_SECRET_KEY) {
    console.warn("[stripe] Stripe secret key not configured");
    return null;
  }

  if (!stripeClient) {
    stripeClient = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: "2024-04-10",
    });
  }

  return stripeClient;
}

/**
 * Check if Stripe is configured
 */
export function isStripeConfigured(): boolean {
  return Boolean(STRIPE_SECRET_KEY && STRIPE_WEBHOOK_SECRET);
}

/**
 * Create a Stripe customer
 * @param email Customer email
 * @param name Customer name
 * @param phone Customer phone
 */
export async function createOrGetStripeCustomer(
  email: string,
  name?: string | null,
  phone?: string | null
): Promise<string | null> {
  const stripe = getStripeClient();
  if (!stripe) return null;

  try {
    // Search for existing customer by email
    const customers = await stripe.customers.list({
      email,
      limit: 1,
    });

    if (customers.data.length > 0) {
      return customers.data[0].id;
    }

    // Create new customer
    const customer = await stripe.customers.create({
      email,
      name: name || undefined,
      phone: phone || undefined,
      metadata: {
        createdAt: new Date().toISOString(),
      },
    });

    console.log("[stripe] Created customer", { customerId: customer.id, email });
    return customer.id;
  } catch (err) {
    console.error("[stripe] Failed to create/get customer", { error: String(err), email });
    return null;
  }
}

/**
 * Create a Stripe checkout session for one-time cleaning
 * @param customerId Stripe customer ID
 * @param submissionId Maine submission ID (for tracking)
 * @param amount Price in cents ($500 = 50000)
 * @param description Service description
 * @param successUrl Redirect after payment
 * @param cancelUrl Redirect if user cancels
 */
export async function createCheckoutSession(
  customerId: string,
  submissionId: number,
  amount: number,
  description: string,
  successUrl: string,
  cancelUrl: string
): Promise<string | null> {
  const stripe = getStripeClient();
  if (!stripe) return null;

  try {
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Maine Cleaning Co",
              description,
              metadata: {
                submissionId: String(submissionId),
              },
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      client_reference_id: String(submissionId),
      metadata: {
        submissionId: String(submissionId),
        description,
      },
    });

    console.log("[stripe] Created checkout session", {
      sessionId: session.id,
      customerId,
      amount,
      submissionId,
    });

    return session.url;
  } catch (err) {
    console.error("[stripe] Failed to create checkout session", { error: String(err) });
    return null;
  }
}

/**
 * Create a Stripe subscription for recurring cleanings
 * @param customerId Stripe customer ID
 * @param submissionId Maine submission ID
 * @param priceId Stripe price ID (or create inline)
 * @param frequency Billing frequency
 * @param description Service description
 */
export async function createSubscription(
  customerId: string,
  submissionId: number,
  priceId: string,
  frequency: "weekly" | "biweekly" | "monthly",
  description: string
): Promise<string | null> {
  const stripe = getStripeClient();
  if (!stripe) return null;

  try {
    const intervalMap: Record<string, "week" | "month"> = {
      weekly: "week",
      biweekly: "week",
      monthly: "month",
    };

    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      metadata: {
        submissionId: String(submissionId),
        description,
        frequency,
      },
    });

    console.log("[stripe] Created subscription", {
      subscriptionId: subscription.id,
      customerId,
      frequency,
      submissionId,
    });

    return subscription.id;
  } catch (err) {
    console.error("[stripe] Failed to create subscription", { error: String(err) });
    return null;
  }
}

/**
 * Create a Stripe Invoice manually
 * @param customerId Stripe customer ID
 * @param submissionId Maine submission ID
 * @param amount Amount in cents
 * @param description Invoice description
 */
export async function createInvoice(
  customerId: string,
  submissionId: number,
  amount: number,
  description: string
): Promise<string | null> {
  const stripe = getStripeClient();
  if (!stripe) return null;

  try {
    const invoice = await stripe.invoices.create({
      customer: customerId,
      description,
      metadata: {
        submissionId: String(submissionId),
      },
      collection_method: "send_invoice",
      days_until_due: 7,
    });

    // Add line item to invoice
    await stripe.invoiceItems.create({
      customer: customerId,
      amount,
      currency: "usd",
      description,
      invoice: invoice.id,
      metadata: {
        submissionId: String(submissionId),
      },
    });

    // Finalize the invoice
    const finalizedInvoice = await stripe.invoices.finalizeInvoice(invoice.id);

    console.log("[stripe] Created invoice", {
      invoiceId: finalizedInvoice.id,
      customerId,
      amount,
      submissionId,
    });

    return finalizedInvoice.id;
  } catch (err) {
    console.error("[stripe] Failed to create invoice", { error: String(err) });
    return null;
  }
}

/**
 * Retrieve a Stripe session by ID
 */
export async function getCheckoutSession(sessionId: string): Promise<Stripe.Checkout.Session | null> {
  const stripe = getStripeClient();
  if (!stripe) return null;

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    return session;
  } catch (err) {
    console.error("[stripe] Failed to retrieve session", { error: String(err) });
    return null;
  }
}

/**
 * Parse Stripe webhook signature and verify authenticity
 * @param body Raw request body
 * @param signature Stripe signature from header
 */
export function verifyStripeWebhookSignature(body: string, signature: string): Record<string, any> | null {
  const stripe = getStripeClient();
  if (!stripe || !STRIPE_WEBHOOK_SECRET) return null;

  try {
    const event = stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET);
    return event as any;
  } catch (err) {
    console.error("[stripe] Webhook signature verification failed", { error: String(err) });
    return null;
  }
}

/**
 * Interface for payment-related data
 */
export interface PaymentData {
  submissionId: number;
  customerId: string;
  amount: number; // cents
  currency: string;
  status: "pending" | "completed" | "failed";
  stripeSessionId?: string;
  stripePaymentIntentId?: string;
  stripePriceId?: string;
  paymentMethod?: string;
  receiptUrl?: string;
  invoiceId?: string;
  invoiceUrl?: string;
  paidAt?: Date;
  refundedAt?: Date;
  refundedAmount?: number;
  refundReason?: string;
}

/**
 * Build payment confirmation URL for SMS/email
 * @param invoiceUrl Stripe invoice URL or custom PDF URL
 * @param baseUrl Base URL of website
 */
export function buildPaymentConfirmationLink(invoiceUrl: string, baseUrl: string = "https://maine-clean.co"): string {
  return invoiceUrl;
}

/**
 * Format amount for display
 * 50000 cents → "$500.00"
 */
export function formatAmountForDisplay(amount: number, currency: string = "USD"): string {
  const locale = currency === "USD" ? "en-US" : "en-GB";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(amount / 100);
}
