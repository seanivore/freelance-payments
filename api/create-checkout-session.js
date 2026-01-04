/**
 * Vercel Serverless Function
 * Creates Stripe Checkout Session on-demand (per CHECKOUT_SESSION_DETAILS.md)
 * 
 * POST /api/create-checkout-session
 * Body: { price_id: string, coupon_id?: string, customer_id?: string, job_id: string, payment_number: number, return_url: string }
 * 
 * Creates a new Checkout Session each time user clicks Pay (sessions expire after 24 hours)
 * v4 schema: Uses customer_id (not customer.id)
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', 'https://payments.august.style');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { price_id, coupon_id, customer_id, job_id, payment_number, return_url } = req.body;

    // Validate required fields
    if (!price_id) {
      return res.status(400).json({ error: 'price_id is required' });
    }

    if (!job_id) {
      return res.status(400).json({ error: 'job_id is required' });
    }

    if (!payment_number) {
      return res.status(400).json({ error: 'payment_number is required' });
    }

    // Build line items
    const lineItems = [{
      price: price_id,
      quantity: 1
    }];

    // Build discounts array (only for first payment)
    const discounts = [];
    if (coupon_id && payment_number === 1) {
      discounts.push({ coupon: coupon_id });
    }

    // Create Checkout Session with custom UI mode (Stripe Elements)
    const sessionParams = {
      mode: 'payment',
      line_items: lineItems,
      ui_mode: 'custom', // Custom UI with Stripe Elements (per user request)
      return_url: return_url || `${req.headers.origin}/${job_id}#completion`,
      expires_at: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours from now
      metadata: {
        job_id: job_id,
        payment_number: payment_number.toString(),
        created_via: 'freelance-payments-api'
      },
      // Enable after-expiration recovery (per CHECKOUT_SESSION_DETAILS.md)
      after_expiration: {
        recovery: {
          enabled: true
        }
      }
    };

    // Add customer if provided (v4 schema: customer_id from request body)
    if (customer_id) {
      sessionParams.customer = customer_id;
      sessionParams.customer_creation = 'always';
    } else {
      sessionParams.customer_creation = 'always';
    }

    // Add discounts if any
    if (discounts.length > 0) {
      sessionParams.discounts = discounts;
    }

    // Add billing address collection
    sessionParams.billing_address_collection = 'required';

    // Add branding settings if provided (from job JSON schema)
    // These can be passed from frontend if needed, or use defaults
    sessionParams.branding_settings = {
      font_family: 'noto_sans',
      background_color: '#1f1f1f',
      border_style: 'pill',
      button_color: '#9C528B',
      display_name: 'august.style designer'
    };

    // Create session
    const session = await stripe.checkout.sessions.create(sessionParams);

    // For custom UI mode, return client_secret and publishable key for Stripe Elements
    res.status(200).json({
      session_id: session.id,
      client_secret: session.client_secret, // Required for Stripe Elements confirmPayment()
      publishable_key: process.env.STRIPE_PUBLISHABLE_KEY || null, // Return publishable key if available
      session_url: session.url // Fallback if needed
    });

  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({
      error: 'Failed to create checkout session',
      message: error.message,
    });
  }
};
