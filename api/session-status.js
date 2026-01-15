/**
 * Vercel Serverless Function
 * Retrieves Checkout Session status
 * 
 * GET /api/session-status?session_id=cs_xxx
 * 
 * Returns session status, payment status, and payment intent details
 */

import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-03-31.basil'
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
      res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS, POST');
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
  
  // For actual requests (GET, POST), set CORS headers and validate origin
  if (isAllowedOrigin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS, POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  // Reject if origin not allowed (for non-OPTIONS requests)
  if (!isAllowedOrigin) {
    return res.status(403).json({ error: 'Origin not allowed' });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { session_id } = req.query;
  if (!session_id) {
    return res.status(400).json({ error: 'session_id is required' });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ['payment_intent']
    });

    res.status(200).json({
      status: session.status,
      payment_status: session.payment_status,
      payment_intent_id: session.payment_intent?.id || null,
      payment_intent_status: session.payment_intent?.status || null,
      amount_total: session.amount_total || null,
      amount_subtotal: session.amount_subtotal || null
    });
  } catch (error) {
    console.error('Error retrieving session:', error);
    res.status(500).json({ error: 'Failed to retrieve session' });
  }
};
