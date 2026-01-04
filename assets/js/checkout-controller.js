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
   * Enhanced design with better colors, typography, and visual hierarchy
   */
  function buildCheckoutForm(jobData, priceObject, paymentNumber) {
    const amount = (priceObject.unit_amount || 0) / 100; // Convert cents to dollars
    const jobId = jobData.product?.id || '';
    const totalPayments = jobData.product?.total_payments || 2;
    const hasDiscount = paymentNumber === 1 && jobData.coupon && jobData.coupon.amount_off > 0;
    const discountAmount = hasDiscount ? (jobData.coupon.amount_off || 0) / 100 : 0;
    const finalAmount = hasDiscount ? amount - discountAmount : amount;

    return `
      <div class="card p-6 md:p-8 space-y-6 shadow-lg">
        <!-- Header with Payment Badge -->
        <div class="card-header pb-4 text-center">
          <div class="flex items-center justify-center gap-2 mb-3">
            <span class="px-3 py-1 rounded-full text-xs font-semibold bg-primary/20 text-primary border border-primary/30">
              Payment ${paymentNumber} of ${totalPayments}
            </span>
          </div>
          <h1 class="card-title text-2xl md:text-3xl">Complete Payment</h1>
          <p class="text-sm text-muted-foreground mt-2">
            Secure checkout powered by Stripe
          </p>
        </div>

        <!-- Enhanced Payment Summary Card -->
        <div class="bg-gradient-to-br from-card via-muted/30 to-card rounded-lg p-6 space-y-4 border border-primary/20 shadow-lg">
          <!-- Amount Display - Large and Prominent -->
          <div class="text-center py-4 border-b border-border/50">
            <p class="text-sm text-muted-foreground mb-2 uppercase tracking-wide">Total Amount</p>
            <p class="text-4xl md:text-5xl font-bold text-foreground">${formatCurrency(finalAmount)}</p>
            ${hasDiscount ? `
            <p class="text-sm text-muted-foreground mt-2 line-through">${formatCurrency(amount)}</p>
            ` : ''}
          </div>

          <!-- Payment Details -->
          <div class="space-y-3 pt-2">
            <div class="flex items-center justify-between">
              <span class="text-muted-foreground flex items-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
                Description:
              </span>
              <span class="font-medium text-foreground">${priceObject.nickname || 'Payment'}</span>
            </div>
            
            ${hasDiscount ? `
            <div class="flex items-center justify-between pt-2 border-t border-border/30">
              <span class="text-muted-foreground flex items-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                Discount:
              </span>
              <span class="font-semibold text-green-500 flex items-center gap-1">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
                -${formatCurrency(discountAmount)}
              </span>
            </div>
            <div class="bg-green-500/10 border border-green-500/20 rounded-md p-2">
              <p class="text-xs text-green-600 font-medium text-center">${jobData.coupon.name || 'Discount Applied'}</p>
            </div>
            ` : ''}
          </div>
        </div>

        <!-- Enhanced Pay Button -->
        <button id="pay-button" class="btn btn-primary w-full py-4 text-lg font-semibold 
          bg-gradient-to-r from-primary to-primary/80 
          hover:from-primary/90 hover:to-primary/70 
          transition-all duration-200 shadow-lg hover:shadow-xl
          flex items-center justify-center gap-2">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
          </svg>
          Pay ${formatCurrency(finalAmount)}
        </button>

        <!-- Loading state (hidden initially) -->
        <div id="checkout-loading" class="hidden text-center py-6">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p class="text-sm text-muted-foreground">Redirecting to secure payment...</p>
          <p class="text-xs text-muted-foreground mt-2">Powered by Stripe</p>
        </div>

        <!-- Error message (hidden initially) -->
        <div id="checkout-error" class="hidden text-sm text-destructive bg-destructive/10 border border-destructive/20 p-4 rounded-lg"></div>

        <!-- Navigation -->
        <div class="flex gap-3 justify-center pt-4 border-t border-border/50">
          <a href="#invoice" class="btn btn-outline text-sm">
            ← Back to Invoice
          </a>
          <a href="#contract" class="btn btn-outline text-sm">
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
