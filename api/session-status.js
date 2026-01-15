/**
 * Vercel Serverless Function
 * Retrieves Checkout Session status
 * 
 * GET /api/session-status?session_id=cs_xxx
 * 
 * Returns session status, payment status, and payment intent details
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-03-31.basil'
});

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', 'https://payments.august.style');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
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
      payment_intent_status: session.payment_intent?.status || null
    });
  } catch (error) {
    console.error('Error retrieving session:', error);
    res.status(500).json({ error: 'Failed to retrieve session' });
  }
};
