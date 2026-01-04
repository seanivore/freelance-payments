/**
 * Vercel Serverless Function
 * Stripe Webhook Handler
 * Receives payment events and updates JSON files
 * 
 * POST /api/webhook
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Disable body parsing for Stripe webhook signature verification
// Vercel serverless functions need raw body as Buffer/string
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
    // Get raw body - Vercel provides req.body as parsed JSON by default
    // For webhook signature verification, we need the raw body string
    // Try to get raw body from request stream if available
    let rawBody;

    if (Buffer.isBuffer(req.body)) {
      // Already a buffer (body parsing disabled)
      rawBody = req.body;
    } else if (typeof req.body === 'string') {
      // Already a string
      rawBody = Buffer.from(req.body, 'utf8');
    } else {
      // Body was parsed as JSON - need to read from stream
      // For Vercel, we'll need to read the raw body differently
      // Try reading from req as stream
      rawBody = await new Promise((resolve, reject) => {
        let data = Buffer.alloc(0);
        req.on('data', chunk => {
          data = Buffer.concat([data, Buffer.from(chunk)]);
        });
        req.on('end', () => resolve(data));
        req.on('error', reject);
      });
    }

    // Verify webhook signature with raw body
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  // Handle the event (v4 schema: Checkout Sessions instead of Payment Intents)
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;

      // Extract metadata (v4 schema)
      const metadata = session.metadata || {};
      const jobId = metadata.job_id;
      const paymentNumber = parseInt(metadata.payment_number, 10);

      if (!jobId || !paymentNumber) {
        console.error('Missing job_id or payment_number in metadata');
        return res.status(400).json({
          error: 'Missing required metadata'
        });
      }

      // Prepare payment data (v4 schema: succeeded timestamp)
      const succeededTimestamp = new Date().toISOString() + 'Z';
      const paymentData = {
        succeeded: succeededTimestamp
      };

      // Trigger GitHub Actions workflow to update payment status
      try {
        const githubToken = process.env.GITHUB_TOKEN;
        const repoOwner = process.env.GITHUB_REPO_OWNER || 'seanivore';
        const repoName = process.env.GITHUB_REPO_NAME || 'freelance-payments';
        const workflowId = 'orchestrate.yml';
        const workflowUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/actions/workflows/${workflowId}/dispatches`;

        const payload = JSON.stringify({
          ref: 'freelance-payments',
          inputs: {
            action: 'update-payment',
            job_id: jobId,
            payload: JSON.stringify({
              payment_number: paymentNumber,
              succeeded: succeededTimestamp
            }),
          },
        });

        const updateResponse = await fetch(workflowUrl, {
          method: 'POST',
          headers: {
            'Authorization': `token ${githubToken}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
          },
          body: payload,
        });

        if (!updateResponse.ok) {
          const errorText = await updateResponse.text();
          throw new Error(`GitHub API error: ${updateResponse.status} - ${errorText}`);
        }

        console.log(`✅ Payment updated: ${jobId} - Payment ${paymentNumber}`);
      } catch (error) {
        console.error('Error updating payment:', error);
        // Don't fail webhook - log and continue
      }

      break;

    case 'checkout.session.async_payment_succeeded':
      // Handle async payment success (e.g., bank transfers)
      const asyncSession = event.data.object;
      console.log('Async payment succeeded:', asyncSession.id);
      // Same handling as checkout.session.completed
      break;

    case 'checkout.session.async_payment_failed':
      const failedSession = event.data.object;
      console.log('Async payment failed:', failedSession.id);
      // Optionally log or notify
      break;

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  // Return a response to acknowledge receipt of the event
  res.json({ received: true });
};
