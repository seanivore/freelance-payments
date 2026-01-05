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
      return data; // Return full response with client_secret and session_url
    } catch (error) {
      console.error('Error creating checkout session:', error);
      throw error;
    }
  }

  /**
   * Show loading state while redirecting to Stripe
   */
  function showLoadingState(contentDiv) {
    contentDiv.innerHTML = `
      <div class="card p-8 text-center">
        <div class="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-6"></div>
        <h2 class="text-2xl font-semibold mb-2">Redirecting to Stripe Checkout</h2>
        <p class="text-muted-foreground mb-4">Secure payment powered by Stripe</p>
        <p class="text-sm text-muted-foreground">Please wait...</p>
      </div>
    `;
  }

  /**
   * Show error state
   */
  function showErrorState(contentDiv, errorMessage) {
    contentDiv.innerHTML = `
      <div class="card p-6">
        <div class="text-center mb-4">
          <svg class="w-16 h-16 mx-auto text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        </div>
        <h2 class="text-xl font-semibold mb-4 text-center">Payment Error</h2>
        <p class="text-muted-foreground mb-6 text-center">${errorMessage}</p>
        <div class="flex gap-3 justify-center">
          <a href="#invoice" class="btn btn-outline">← Back to Invoice</a>
          <button onclick="location.reload()" class="btn btn-primary">Try Again</button>
        </div>
      </div>
    `;
  }

  /**
   * Stripe.js Loader (deterministic single-load with CSP/CORS handling)
   * WHY: Deterministic single-load for Stripe.js with clear failure modes,
   * CSP-friendly attributes, and a short retry to handle transient CDN failures.
   */
  const StripeLoader = (() => {
    let loadPromise = null;

    function injectStripeScript() {
      return new Promise((resolve, reject) => {
        // Load Stripe.js with Basil version (required for initCheckout with ui_mode: custom)
        // Version format: ?version=YYYY-MM-DD.release-name
        const stripeVersion = '2025-03-31.basil';
        const stripeUrl = `https://js.stripe.com/v3/?version=${stripeVersion}`;

        // CRITICAL: Remove any existing Stripe.js scripts (including from HTML)
        // We must use Basil version for initCheckout to work
        const existingScripts = document.querySelectorAll(`script[src*="js.stripe.com/v3"]`);
        existingScripts.forEach(script => {
          // Only remove if it doesn't have the correct version
          if (!script.src.includes(stripeVersion)) {
            script.remove();
            // Clear window.Stripe to force reload
            delete window.Stripe;
          }
        });

        // Check if correct version already exists
        let script = document.querySelector(`script[src*="${stripeVersion}"]`);

        if (!script) {
          // Create new script with Basil version
          script = document.createElement('script');
          script.src = stripeUrl;
          script.async = true;
          script.crossOrigin = 'anonymous';
          script.setAttribute('data-stripe-version', stripeVersion);

          script.onerror = () => {
            reject(new Error('Stripe.js script failed to load (network/CSP). Check Content-Security-Policy, ad/script blockers, and network.'));
          };

          script.onload = () => {
            script.dataset.loaded = 'true';
            resolve();
          };
          document.head.appendChild(script);
        } else {
          // Correct version already exists
          if (script.dataset.loaded === 'true') {
            resolve();
          } else {
            script.addEventListener('load', () => {
              script.dataset.loaded = 'true';
              resolve();
            });
            script.addEventListener('error', () => reject(new Error('Stripe.js existing script failed to load.')));
          }
        }
      });
    }

    async function waitForStripeFunction(timeoutMs = 4000) {
      const start = Date.now();
      while (typeof window.Stripe === 'undefined') {
        if (Date.now() - start > timeoutMs) {
          throw new Error('Stripe function not available after loading script. Possible CSP blocking or extension interference.');
        }
        await new Promise(r => setTimeout(r, 50));
      }

      // Small delay to ensure Stripe.js is fully initialized
      await new Promise(r => setTimeout(r, 100));
    }

    async function loadStripe({ retries = 1 } = {}) {
      if (!loadPromise) {
        loadPromise = (async () => {
          try {
            await injectStripeScript();
            await waitForStripeFunction(4000);

            // Mark loaded to help future calls
            const script = document.querySelector('script[src*="js.stripe.com/v3"]');
            if (script) script.dataset.loaded = 'true';
          } catch (err) {
            // Retry once if requested (handles transient CDN failures)
            if (retries > 0) {
              await new Promise(r => setTimeout(r, 250));
              return loadStripe({ retries: retries - 1 });
            }
            throw err;
          }
        })();
      }
      return loadPromise;
    }

    return { loadStripe };
  })();

  // Store Elements instances to clean up when needed
  const elementsInstances = new Map();

  /**
   * Mount Stripe Checkout with custom UI mode
   * WHY: For ui_mode: custom, we must use initCheckout() with Checkout Session client secret,
   * NOT elements() which expects PaymentIntent client secret.
   * Custom UI mode allows full control over checkout flow while maintaining Stripe's optimized payment handling.
   */
  async function mountStripeElements(clientSecret, containerDiv, returnUrl) {
    try {
      // 1) Validate inputs early
      if (!clientSecret || typeof clientSecret !== 'string') {
        throw new Error('Missing client_secret for Stripe Checkout. The server must return client_secret for custom UI mode.');
      }

      // Validate client secret format (should be cs_test_xxx or cs_live_xxx for Checkout Sessions)
      if (!clientSecret.startsWith('cs_')) {
        throw new Error(`Invalid client secret format. Expected Checkout Session client secret (cs_xxx), got: ${clientSecret.substring(0, 20)}...`);
      }

      const publishableKey = window.STRIPE_PUBLISHABLE_KEY;
      if (!publishableKey) {
        throw new Error('Stripe publishable key not configured. Set STRIPE_PUBLISHABLE_KEY via environment or include it in the API response.');
      }

      // 2) Clean up any existing Checkout instances
      elementsInstances.forEach((checkout, container) => {
        try {
          if (checkout && typeof checkout.unmount === 'function') {
            checkout.unmount();
          }
        } catch (e) {
          console.warn('Error unmounting existing Checkout:', e);
        }
      });
      elementsInstances.clear();

      // 3) Avoid concurrent mounts
      if (containerDiv.dataset.mounting === 'true') {
        // Already mounting; no-op
        return;
      }
      containerDiv.dataset.mounting = 'true';

      // 4) Ensure Stripe.js is loaded exactly once
      await StripeLoader.loadStripe({ retries: 1 });

      // 5) Initialize Stripe
      const stripe = window.Stripe(publishableKey);

      if (!stripe || typeof stripe.initCheckout !== 'function') {
        throw new Error('Stripe.initCheckout is unavailable. Check Stripe.js version and ensure latest version is loaded.');
      }

      // 6) Initialize Checkout with Checkout Session client secret (for ui_mode: custom)
      const checkout = await stripe.initCheckout({
        clientSecret: clientSecret
      });

      // 7) Prepare mount point (Checkout will create its own form)
      containerDiv.innerHTML = '<div id="checkout-container"></div>';

      const checkoutContainer = document.getElementById('checkout-container');
      if (!checkoutContainer) {
        throw new Error('Failed to create checkout container.');
      }

      // 8) Mount Checkout (this creates the payment form automatically)
      checkout.mount(checkoutContainer);

      // 9) Listen for Checkout events
      checkout.on('change', (event) => {
        // Handle checkout state changes if needed
        console.log('Checkout state changed:', event);
      });

      // Store Checkout instance for cleanup
      elementsInstances.set(containerDiv, checkout);

      // 10) Mark as mounted
      containerDiv.dataset.mounting = 'false';
      containerDiv.dataset.mounted = 'true';

      console.log('✅ Stripe Checkout mounted successfully with custom UI mode');

    } catch (error) {
      console.error('Error mounting Stripe Checkout:', error);
      containerDiv.dataset.mounting = 'false';
      showErrorState(
        containerDiv,
        `Failed to load payment form: ${error.message}. Tips: Verify Content-Security-Policy allows https://js.stripe.com. Disable ad/script blockers for this domain. Serve over HTTPS and check network tab for blocked/failed requests.`
      );
    }
  }

  /**
   * Initialize checkout section (works within single-page template)
   * Prevents multiple initializations with init flags
   */
  async function init(paymentNumber) {
    // Prevent multiple initializations
    const sectionId = paymentNumber === 1 ? 'payment-1' : 'payment-2';
    const section = paymentNumber === 1 ? paymentSection1 : paymentSection2;
    const contentDiv = paymentNumber === 1 ? checkoutContent1 : checkoutContent2;

    if (!section || section.classList.contains('hidden')) {
      return; // Section not visible, don't initialize
    }

    // Check if already initializing or initialized
    if (section.dataset.initStarted === 'true') {
      console.log(`Checkout section ${paymentNumber} already initializing, skipping...`);
      return;
    }

    section.dataset.initStarted = 'true';

    const jobData = getJobData();

    if (!jobData) {
      const errorMsg = '<p>Job data not found. Please start from the <a href="/">homepage</a>.</p>';
      if (contentDiv) {
        contentDiv.innerHTML = errorMsg;
      }
      section.dataset.initStarted = 'false';
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

    // Check if price ID exists (required for Stripe Checkout)
    const priceId = priceObject?.id;
    if (!priceId) {
      if (contentDiv) {
        showErrorState(contentDiv, 'Payment is not yet configured. The Stripe catalog may still be syncing.');
      }
      section.dataset.initStarted = 'false';
      return;
    }
    if (contentDiv) {
      showLoadingState(contentDiv);

      // Create checkout session and embed Stripe Checkout
      createCheckoutSession(jobData, paymentNumber)
        .then(async data => {
          // Store publishable key if provided by API (priority: API response > existing value)
          if (data.publishable_key) {
            window.STRIPE_PUBLISHABLE_KEY = data.publishable_key;
            console.log('Stripe publishable key received from API');
          }

          // Ensure we have a publishable key before proceeding
          if (!window.STRIPE_PUBLISHABLE_KEY) {
            throw new Error('Stripe publishable key not available. Please ensure STRIPE_PUBLISHABLE_KEY is set in Vercel environment variables.');
          }

          // For custom UI mode, use client_secret to mount Stripe Elements (Payment Element)
          if (data.client_secret) {
            try {
              const returnUrl = `${window.location.origin}/${jobData.product?.id || sessionStorage.getItem('jobId')}#completion`;
              await mountStripeElements(data.client_secret, contentDiv, returnUrl);
            } catch (e) {
              // Fallback: if Elements fails (e.g., Stripe.js blocked), redirect to hosted checkout
              if (data.session_url) {
                console.warn('Stripe Elements failed, falling back to Stripe-hosted redirect:', e.message);
                window.location.href = data.session_url;
                return;
              }
              throw e;
            }
          } else if (data.session_url) {
            // Fallback: redirect if no client_secret (shouldn't happen with custom UI mode)
            console.warn('No client_secret, falling back to redirect');
            window.location.href = data.session_url;
          } else {
            throw new Error('No checkout session data received');
          }
        })
        .catch(error => {
          console.error('Checkout error:', error);
          showErrorState(contentDiv, error.message || 'Failed to create checkout session. Please try again.');
          section.dataset.initStarted = 'false'; // Reset on error so user can retry
        });
    }
  }

  /**
   * Initialize checkout sections when they become visible
   * Only initializes if the hash matches the payment section (user navigated there)
   */
  function checkAndInit() {
    const jobData = getJobData();
    if (!jobData) return;

    // Determine which payment is pending
    const paymentNumber = getPaymentNumber(jobData);
    if (!paymentNumber) return;

    // Check if user actually navigated to this payment section (hash matches)
    const hash = window.location.hash;
    const isOnPayment1 = hash === '#payment-1' || hash.startsWith('#payment-1');
    const isOnPayment2 = hash === '#payment-2' || hash.startsWith('#payment-2');

    // Only initialize if section is visible AND hash matches (user navigated there)
    if (paymentNumber === 1 && paymentSection1 && !paymentSection1.classList.contains('hidden') && isOnPayment1) {
      init(1);
    } else if (paymentNumber === 2 && paymentSection2 && !paymentSection2.classList.contains('hidden') && isOnPayment2) {
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

  // Listen for hash changes (user navigating between sections)
  window.addEventListener('hashchange', checkAndInit);

  // Export for use in other scripts
  window.CheckoutController = {
    getJobData,
    getPaymentNumber,
    init
  };

})();
