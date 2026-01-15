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

import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-03-31.basil' // Required for ui_mode: 'custom'
});

export default async (req, res) => {
  // CORS configuration - allow requests from frontend domain
  const allowedOrigins = [
    'https://payments.august.style',
    'http://localhost:5173', // Vite dev server
    'http://localhost:3000'  // Common dev port
  ];
  
  const origin = req.headers.origin;
  const isAllowedOrigin = origin && allowedOrigins.includes(origin);
  
  // Handle preflight OPTIONS request FIRST - before any other logic
  if (req.method === 'OPTIONS') {
    try {
      // Always allow OPTIONS requests (preflight) - set CORS headers
      if (isAllowedOrigin) {
        res.setHeader('Access-Control-Allow-Origin', origin);
      }
      res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS, GET');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Max-Age', '86400');
      return res.status(200).json({});
    } catch (error) {
      // If there's an error, still try to return with CORS headers
      if (isAllowedOrigin) {
        res.setHeader('Access-Control-Allow-Origin', origin);
      }
      return res.status(200).json({});
    }
  }
  
  // For actual requests (POST, GET), set CORS headers and validate origin
  if (isAllowedOrigin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS, GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  // Reject if origin not allowed (for non-OPTIONS requests)
  if (!isAllowedOrigin) {
    return res.status(403).json({ error: 'Origin not allowed' });
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
      return_url: return_url || `${req.headers.origin}/${job_id}?session_id={CHECKOUT_SESSION_ID}`,
      expires_at: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours from now
      metadata: {
        job_id: job_id,
        payment_number: payment_number.toString(),
        created_via: 'freelance-payments-api'
      }
    };

    // Add customer if provided (v4 schema: customer_id from request body)
    // CRITICAL: We DO NOT set 'customer_creation', 'billing_address_collection', or 'phone_number_collection'
    // to avoid redundancy and conflicts (Stripe 500 errors). We rely on the established customer object 
    // and Stripe Elements defaults.
    if (customer_id) {
      sessionParams.customer = customer_id;
      // Set client_reference_id to customer.id for reconciliation with internal systems
      sessionParams.client_reference_id = customer_id;
    }

    // Add discounts if any
    if (discounts.length > 0) {
      sessionParams.discounts = discounts;
    }

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
