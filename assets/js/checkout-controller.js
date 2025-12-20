/**
 * CHECKOUT CONTROLLER
 * Handles Stripe Payment Element integration and payment processing
 */

(function () {
  'use strict';

  const loadingDiv = document.getElementById('loading');
  const contentDiv = document.getElementById('checkout-content');

  let stripe = null;
  let elements = null;
  let paymentElement = null;
  let currentJobData = null;
  let currentPayment = null;

  /**
   * Get payment number from URL
   */
  function getPaymentNumber() {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentParam = urlParams.get('payment');
    return paymentParam ? parseInt(paymentParam, 10) : null;
  }

  /**
   * Get job data from sessionStorage
   */
  function getJobData() {
    const jobDataStr = sessionStorage.getItem('jobData');
    if (!jobDataStr) {
      return null;
    }
    try {
      return JSON.parse(jobDataStr);
    } catch (e) {
      console.error('Error parsing job data:', e);
      return null;
    }
  }

  /**
   * Format currency
   */
  function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  }

  /**
   * Create PaymentIntent via serverless function
   * Uses stripe_price_id from JSON to ensure correct payment amount
   * 
   * Flow: Frontend → Serverless Function → Stripe API → Returns client_secret
   */
  async function createPaymentIntent(jobData, payment) {
    // Vercel API endpoint (backend serverless functions)
    // Frontend is on GitHub Pages, API is on Vercel
    const serverlessEndpoint = 'https://freelance-payments-neon.vercel.app/api/create-payment-intent';

    // Validate Stripe Price ID exists
    if (!payment.stripe_price_id) {
      throw new Error('Stripe Price ID not found. Payment may not be set up in Stripe catalog yet.');
    }

    try {
      const response = await fetch(serverlessEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // Use stripe_price_id to ensure exact payment amount
          price_id: payment.stripe_price_id,
          // Additional metadata for webhook handling
          metadata: {
            job_id: jobData.job_id,
            invoice_number: jobData.invoice_number || jobData.job_id,
            payment_number: payment.payment_number,
            client_last_name: jobData.client?.last_name,
            project_keyword: jobData.client?.project_keyword
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to create payment intent: ${response.status}`);
      }

      const data = await response.json();
      return data.clientSecret;
    } catch (error) {
      console.error('Error creating payment intent:', error);
      throw error;
    }
  }

  /**
   * Initialize Stripe Payment Element
   */
  async function initializePaymentElement(clientSecret) {
    // Initialize Stripe with publishable key
    // TODO: Replace with your Stripe publishable key (from Stripe Dashboard)
    // Option 1: Set directly here (for testing)
    // Option 2: Load from config.js file (see PHASE2_SETUP.md)
    const publishableKey = 'pk_test_51Sbjhg9fljwH26CPk5PQKftpMaVQ7D7kIH3O3tYVEFSkOzVdqI5DWtT7EMcJDUqQLKEgIosx7q4nfgjrB1KMf85100WsuWFKNr';

    if (!publishableKey || publishableKey === 'pk_test_YOUR_KEY_HERE') {
      throw new Error('Stripe publishable key not configured. Please set window.STRIPE_PUBLISHABLE_KEY or update checkout-controller.js');
    }

    stripe = Stripe(publishableKey); // Stripe (capital S) is the constructor function

    // Create Elements instance
    elements = stripe.elements({
      clientSecret: clientSecret,
      appearance: {
        theme: 'stripe',
        variables: {
          colorPrimary: 'hsl(var(--primary))',
          colorBackground: 'hsl(var(--background))',
          colorText: 'hsl(var(--foreground))',
          colorDanger: 'hsl(var(--destructive))',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          spacingUnit: '4px',
          borderRadius: '8px',
        }
      }
    });

    // Create and mount Payment Element
    paymentElement = elements.create('payment');
    await paymentElement.mount('#payment-element');
  }

  /**
   * Handle payment form submission
   */
  async function handlePaymentSubmit(event) {
    event.preventDefault();

    const submitButton = document.getElementById('submit-payment');
    const errorDiv = document.getElementById('payment-error');

    // Disable submit button
    submitButton.disabled = true;
    submitButton.textContent = 'Processing...';
    errorDiv.textContent = '';

    try {
      // Confirm payment
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment-success.html`,
        },
        redirect: 'if_required' // Don't redirect automatically, handle in JS
      });

      if (error) {
        // Show error to user
        errorDiv.textContent = error.message;
        submitButton.disabled = false;
        submitButton.textContent = 'Pay Now';
        return;
      }

      // Payment succeeded
      if (paymentIntent && paymentIntent.status === 'succeeded') {
        await handlePaymentSuccess(paymentIntent);
      }

    } catch (error) {
      console.error('Payment error:', error);
      errorDiv.textContent = 'An error occurred. Please try again.';
      submitButton.disabled = false;
      submitButton.textContent = 'Pay Now';
    }
  }

  /**
   * Handle successful payment
   */
  async function handlePaymentSuccess(paymentIntent) {
    // Update job data
    const paymentIndex = currentJobData.payments.findIndex(
      p => p.payment_number === currentPayment.payment_number
    );

    if (paymentIndex !== -1) {
      currentJobData.payments[paymentIndex].status = 'paid';
      currentJobData.payments[paymentIndex].paid_date = new Date().toISOString().split('T')[0];
      currentJobData.payments[paymentIndex].paid_date_unix = Math.floor(Date.now() / 1000);
    }

    // Update sessionStorage
    sessionStorage.setItem('jobData', JSON.stringify(currentJobData));

    // TODO: Update JSON file via GitHub Actions API
    // For now, show success and route to next step

    // Show success message
    contentDiv.innerHTML = `
      <div class="card p-8 text-center">
        <div class="mb-4">
          <svg class="w-16 h-16 mx-auto text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
          </svg>
        </div>
        <h2 class="card-title mb-4">Payment Successful!</h2>
        <p class="text-muted-foreground mb-6">
          Your payment of ${formatCurrency(currentPayment.amount)} has been processed successfully.
        </p>
        <div class="flex gap-4 justify-center">
          <a href="/payment-router.html" class="btn btn-primary">Continue</a>
        </div>
      </div>
    `;

    // Route to next step after a moment
    setTimeout(() => {
      if (typeof PaymentRouter !== 'undefined') {
        const routeInfo = PaymentRouter.determineRoute(currentJobData);
        PaymentRouter.routeUser(routeInfo);
      } else {
        window.location.href = '/payment-router.html';
      }
    }, 2000);
  }

  /**
   * Build checkout form HTML
   */
  function buildCheckoutForm(jobData, payment) {
    return `
      <div class="card p-6 space-y-6">
        <!-- Header -->
        <div class="card-header pb-4">
          <h1 class="card-title">Complete Payment</h1>
          <p class="text-sm text-muted-foreground mt-2">
            Payment ${payment.payment_number} of ${jobData.payments.length}
          </p>
        </div>

        <!-- Payment Summary -->
        <div class="bg-muted/50 rounded-lg p-4 space-y-2">
          <div class="flex justify-between">
            <span class="text-muted-foreground">Amount:</span>
            <span class="font-semibold text-lg">${formatCurrency(payment.amount)}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-muted-foreground">Description:</span>
            <span>${payment.description}</span>
          </div>
        </div>

        <!-- Payment Form -->
        <form id="payment-form" class="space-y-4">
          <div id="payment-element">
            <!-- Stripe Payment Element will be mounted here -->
          </div>
          
          <div id="payment-error" class="text-sm text-destructive"></div>
          
          <button type="submit" id="submit-payment" class="btn btn-primary w-full">
            Pay ${formatCurrency(payment.amount)}
          </button>
        </form>

        <!-- Navigation -->
        <div class="flex gap-4 justify-center pt-4 border-t">
          <a href="/invoice.html?payment=${payment.payment_number}" class="btn btn-outline">
            Back to Invoice
          </a>
          <a href="/contract.html" class="btn btn-outline">
            View Contract
          </a>
        </div>
      </div>
    `;
  }

  /**
   * Initialize checkout page
   */
  async function init() {
    const jobData = getJobData();

    if (!jobData) {
      alert('Job data not found. Redirecting to lookup.');
      window.location.href = '/';
      return;
    }

    currentJobData = jobData;

    // Get payment number
    const paymentNumber = getPaymentNumber();
    const payments = jobData.payments || [];

    // Find the payment
    let payment = null;
    if (paymentNumber) {
      payment = payments.find(p => p.payment_number === paymentNumber);
    } else {
      // Default to first pending payment
      payment = payments.find(p => p.status === 'pending');
    }

    if (!payment) {
      alert('Payment not found. Redirecting to lookup.');
      window.location.href = '/';
      return;
    }

    // Check if already paid
    if (payment.status === 'paid') {
      alert('This payment has already been completed.');
      window.location.href = '/payment-router.html';
      return;
    }

    currentPayment = payment;

    // Build checkout form
    const checkoutHTML = buildCheckoutForm(jobData, payment);
    contentDiv.innerHTML = checkoutHTML;

    // Hide loading, show content
    loadingDiv.classList.add('hidden');
    contentDiv.classList.remove('hidden');

    try {
      // Create PaymentIntent and get client secret
      const clientSecret = await createPaymentIntent(jobData, payment);

      // Initialize Stripe Payment Element
      await initializePaymentElement(clientSecret);

      // Attach form submit handler
      const form = document.getElementById('payment-form');
      form.addEventListener('submit', handlePaymentSubmit);

    } catch (error) {
      console.error('Checkout initialization error:', error);
      contentDiv.innerHTML = `
        <div class="card p-6">
          <h2 class="card-title mb-4">Error</h2>
          <p class="text-destructive mb-4">${error.message || 'Failed to initialize checkout. Please try again.'}</p>
          <a href="/invoice.html?payment=${payment.payment_number}" class="btn btn-primary">Back to Invoice</a>
        </div>
      `;
      loadingDiv.classList.add('hidden');
      contentDiv.classList.remove('hidden');
    }
  }

  // Export for use in other scripts
  window.CheckoutController = {
    getJobData,
    getPaymentNumber
  };

  // Initialize on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
