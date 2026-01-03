/**
 * CHECKOUT CONTROLLER
 * Handles Stripe Checkout Session creation and redirect
 * 
 * Updated for v4 schema: Uses price1, price2, product.id, state.payment_1/payment_2
 * Creates Checkout Sessions on-demand (per CHECKOUT_SESSION_DETAILS.md)
 * Works within single-page template (job.html) with #payment-1 and #payment-2 sections
 */

(function () {
  'use strict';

  const checkoutContent1 = document.getElementById('checkout-content-1');
  const checkoutContent2 = document.getElementById('checkout-content-2');
  const paymentSection1 = document.getElementById('payment-1');
  const paymentSection2 = document.getElementById('payment-2');

  /**
   * Get payment number from hash or determine from state (v4 schema)
   */
  function getPaymentNumber(jobData) {
    // Try hash first (e.g., #payment-1)
    const hash = window.location.hash;
    const hashMatch = hash.match(/payment-(\d+)/);
    if (hashMatch) {
      return parseInt(hashMatch[1], 10);
    }

    // Check state to determine which payment is pending (v4 schema: state.payment_2, not balance_payment_intent)
    const state = jobData.state || {};
    const initialPaid = state.payment_1?.succeeded !== null;
    const balancePaid = state.payment_2?.succeeded !== null;

    if (!initialPaid) return 1;
    if (!balancePaid) return 2;

    return null; // All paid
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
   * Create Checkout Session on-demand (per CHECKOUT_SESSION_DETAILS.md)
   */
  async function createCheckoutSession(jobData, paymentNumber) {
    const serverlessEndpoint = 'https://freelance-payments-neon.vercel.app/api/create-checkout-session';

    // Get price object (v4 schema)
    let priceObject = null;
    let priceId = null;
    let couponId = null;

    if (paymentNumber === 1) {
      priceObject = jobData.price1;
      priceId = priceObject?.id;
      // Discounts only apply to first payment (v4 schema)
      couponId = jobData.coupon?.id || null;
    } else if (paymentNumber === 2) {
      priceObject = jobData.price2;
      priceId = priceObject?.id;
      couponId = null; // No discount on balance payment
    }

    if (!priceId) {
      throw new Error('Price ID not found. Payment may not be set up in Stripe catalog yet.');
    }

    const jobId = jobData.product?.id || sessionStorage.getItem('jobId');
    const customerId = jobData.customer?.id || null;

    try {
      const response = await fetch(serverlessEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          price_id: priceId,
          coupon_id: couponId,
          customer_id: customerId, // Fixed: should be customer_id, not customer.id
          job_id: jobId,
          payment_number: paymentNumber,
          return_url: `${window.location.origin}/${jobId}#completion`
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to create checkout session: ${response.status}`);
      }

      const data = await response.json();
      return data.session_url; // Stripe Checkout Session URL
    } catch (error) {
      console.error('Error creating checkout session:', error);
      throw error;
    }
  }

  /**
   * Build checkout form HTML (v4 schema)
   */
  function buildCheckoutForm(jobData, priceObject, paymentNumber) {
    const amount = (priceObject.unit_amount || 0) / 100; // Convert cents to dollars
    const jobId = jobData.product?.id || '';

    return `
      <div class="card p-6 space-y-6">
        <!-- Header -->
        <div class="card-header pb-4">
          <h1 class="card-title">Complete Payment</h1>
          <p class="text-sm text-muted-foreground mt-2">
            Payment ${paymentNumber} of 2
          </p>
        </div>

        <!-- Payment Summary -->
        <div class="bg-muted/50 rounded-lg p-4 space-y-2">
          <div class="flex justify-between">
            <span class="text-muted-foreground">Amount:</span>
            <span class="font-semibold text-lg">${formatCurrency(amount)}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-muted-foreground">Description:</span>
            <span>${priceObject.nickname || 'Payment'}</span>
          </div>
          ${paymentNumber === 1 && jobData.coupon ? `
          <div class="flex justify-between text-sm">
            <span class="text-muted-foreground">Discount:</span>
            <span class="text-green-600">${jobData.coupon.name || 'Applied'}</span>
          </div>
          ` : ''}
        </div>

        <!-- Pay Button -->
        <button id="pay-button" class="btn btn-primary w-full">
          Pay ${formatCurrency(amount)}
        </button>

        <!-- Loading state (hidden initially) -->
        <div id="checkout-loading" class="hidden text-center">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p class="text-sm text-muted-foreground">Redirecting to secure payment...</p>
        </div>

        <!-- Error message (hidden initially) -->
        <div id="checkout-error" class="hidden text-sm text-destructive bg-destructive/10 p-3 rounded"></div>

        <!-- Navigation -->
        <div class="flex gap-4 justify-center pt-4 border-t">
          <a href="#invoice" class="btn btn-outline">
            Back to Invoice
          </a>
          <a href="#contract" class="btn btn-outline">
            View Contract
          </a>
        </div>
      </div>
    `;
  }

  /**
   * Initialize checkout section (works within single-page template)
   */
  async function init(paymentNumber) {
    const jobData = getJobData();

    if (!jobData) {
      const errorMsg = '<p>Job data not found. Please start from the <a href="/">homepage</a>.</p>';
      if (paymentNumber === 1 && checkoutContent1) {
        checkoutContent1.innerHTML = errorMsg;
      } else if (paymentNumber === 2 && checkoutContent2) {
        checkoutContent2.innerHTML = errorMsg;
      }
      return;
    }

    // Get price object (v4 schema)
    let priceObject = null;
    if (paymentNumber === 1) {
      priceObject = jobData.price1;
    } else if (paymentNumber === 2) {
      priceObject = jobData.price2;
    }

    if (!priceObject) {
      const errorMsg = '<p>Payment not found. Please contact support.</p>';
      if (paymentNumber === 1 && checkoutContent1) {
        checkoutContent1.innerHTML = errorMsg;
      } else if (paymentNumber === 2 && checkoutContent2) {
        checkoutContent2.innerHTML = errorMsg;
      }
      return;
    }

    // Check if already paid (v4 schema: check state.payment_1/payment_2)
    const state = jobData.state || {};
    let isPaid = false;
    if (paymentNumber === 1) {
      isPaid = state.payment_1?.succeeded !== null;
    } else if (paymentNumber === 2) {
      isPaid = state.payment_2?.succeeded !== null;
    }

    if (isPaid) {
      const paidMsg = `
        <div class="card p-6 text-center">
          <div class="mb-4">
            <svg class="w-16 h-16 mx-auto text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <h2 class="card-title mb-4">Payment Already Completed</h2>
          <p class="text-muted-foreground mb-6">
            This payment has already been processed successfully.
          </p>
          <a href="#invoice" class="btn btn-primary">View Invoice</a>
        </div>
      `;
      if (paymentNumber === 1 && checkoutContent1) {
        checkoutContent1.innerHTML = paidMsg;
      } else if (paymentNumber === 2 && checkoutContent2) {
        checkoutContent2.innerHTML = paidMsg;
      }
      return;
    }

    // Build checkout form
    const checkoutHTML = buildCheckoutForm(jobData, priceObject, paymentNumber);
    const contentDiv = paymentNumber === 1 ? checkoutContent1 : checkoutContent2;
    if (contentDiv) {
      contentDiv.innerHTML = checkoutHTML;

      // Attach pay button handler
      const payButton = document.getElementById('pay-button');
      const loadingDiv = document.getElementById('checkout-loading');
      const errorDiv = document.getElementById('checkout-error');

      if (payButton) {
        payButton.addEventListener('click', async () => {
          payButton.disabled = true;
          payButton.classList.add('hidden');
          if (loadingDiv) loadingDiv.classList.remove('hidden');
          if (errorDiv) {
            errorDiv.classList.add('hidden');
            errorDiv.textContent = '';
          }

          try {
            // Create checkout session on-demand
            const sessionUrl = await createCheckoutSession(jobData, paymentNumber);

            // Redirect to Stripe Checkout Session
            window.location.href = sessionUrl;
          } catch (error) {
            console.error('Checkout error:', error);
            if (errorDiv) {
              errorDiv.textContent = error.message || 'Failed to create checkout session. Please try again.';
              errorDiv.classList.remove('hidden');
            }
            payButton.disabled = false;
            payButton.classList.remove('hidden');
            if (loadingDiv) loadingDiv.classList.add('hidden');
          }
        });
      }
    }
  }

  /**
   * Initialize checkout sections when they become visible
   */
  function checkAndInit() {
    const jobData = getJobData();
    if (!jobData) return;

    // Determine which payment is pending
    const paymentNumber = getPaymentNumber(jobData);
    if (!paymentNumber) return;

    // Initialize the appropriate section
    if (paymentNumber === 1 && paymentSection1 && !paymentSection1.classList.contains('hidden')) {
      init(1);
    } else if (paymentNumber === 2 && paymentSection2 && !paymentSection2.classList.contains('hidden')) {
      init(2);
    }
  }

  // Watch for section visibility changes
  const observer1 = paymentSection1 ? new MutationObserver(checkAndInit) : null;
  const observer2 = paymentSection2 ? new MutationObserver(checkAndInit) : null;

  if (paymentSection1 && observer1) {
    observer1.observe(paymentSection1, { attributes: true, attributeFilter: ['class'] });
  }
  if (paymentSection2 && observer2) {
    observer2.observe(paymentSection2, { attributes: true, attributeFilter: ['class'] });
  }

  // Also initialize on page load if section is already visible
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkAndInit);
  } else {
    checkAndInit();
  }

  // Export for use in other scripts
  window.CheckoutController = {
    getJobData,
    getPaymentNumber,
    init
  };

})();
