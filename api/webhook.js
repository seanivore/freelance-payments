/**
 * Vercel Serverless Function
 * Stripe Webhook Handler
 * Receives payment events and updates JSON files
 * 
 * POST /api/webhook
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('Stripe webhook secret not configured');
    return res.status(500).json({ error: 'Webhook secret not configured' });
  }

  let event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;

      // Extract metadata
      const metadata = paymentIntent.metadata || {};
      const jobId = metadata.job_id;
      const paymentNumber = parseInt(metadata.payment_number, 10);

      if (!jobId || !paymentNumber) {
        console.error('Missing job_id or payment_number in metadata');
        return res.status(400).json({
          error: 'Missing required metadata'
        });
      }

      // Prepare payment data
      const paymentData = {
        status: 'paid',
        paid_date: new Date().toISOString().split('T')[0],
        paid_date_unix: Math.floor(Date.now() / 1000),
        stripe_payment_intent_id: paymentIntent.id,
      };

      // Call update-payment API (or directly trigger GitHub Action)
      try {
        const updateResponse = await fetch(
          `${req.headers.origin || process.env.SITE_URL}/api/update-payment`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              job_id: jobId,
              payment_number: paymentNumber,
              payment_data: paymentData,
            }),
          }
        );

        if (!updateResponse.ok) {
          throw new Error('Failed to update payment');
        }

        console.log(`✅ Payment updated: ${jobId} - Payment ${paymentNumber}`);
      } catch (error) {
        console.error('Error updating payment:', error);
        // Don't fail webhook - log and continue
      }

      break;

    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object;
      console.log('Payment failed:', failedPayment.id);
      // Optionally log or notify
      break;

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  // Return a response to acknowledge receipt of the event
  res.json({ received: true });
};
