/**
 * Vercel Serverless Function
 * Creates Stripe PaymentIntent using price_id from JSON
 * 
 * POST /api/create-payment-intent
 * Body: { price_id: string, metadata: object }
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { price_id, metadata } = req.body;

    // Validate required fields
    if (!price_id) {
      return res.status(400).json({ error: 'price_id is required' });
    }

    // Retrieve Price to get amount and currency
    const price = await stripe.prices.retrieve(price_id);

    // Create PaymentIntent with Price amount/currency
    const paymentIntent = await stripe.paymentIntents.create({
      amount: price.unit_amount,
      currency: price.currency,
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        ...metadata,
        price_id: price_id,
        created_via: 'freelance-payments-api',
      },
    });

    res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });

  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({
      error: 'Failed to create payment intent',
      message: error.message,
    });
  }
};
