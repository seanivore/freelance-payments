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
        // Version format: https://js.stripe.com/{release-name}/stripe.js
        const stripeRelease = 'basil';
        const stripeUrl = `https://js.stripe.com/${stripeRelease}/stripe.js`;

        // CRITICAL: Remove ALL existing Stripe.js scripts (including from HTML)
        // We must use Basil version for initCheckout to work
        // Get the absolute URL to compare properly
        const existingScripts = document.querySelectorAll(`script[src*="js.stripe.com"], script[src*="stripe.js"]`);
        existingScripts.forEach(script => {
          // Get absolute URL for comparison
          const scriptUrl = script.src || script.getAttribute('src');
          // Remove if it's not the exact Basil version URL
          if (!scriptUrl || !scriptUrl.includes(`/${stripeRelease}/stripe.js`)) {
            console.log('Removing existing Stripe.js script:', scriptUrl);
            script.remove();
            // Clear window.Stripe to force reload
            delete window.Stripe;
          }
        });

        // Check if correct version already exists (using absolute URL check)
        let script = null;
        const allScripts = document.querySelectorAll('script[src]');
        for (const s of allScripts) {
          const src = s.src || s.getAttribute('src');
          if (src && src.includes(`/${stripeRelease}/stripe.js`)) {
            script = s;
            break;
          }
        }

        if (!script) {
          // Create new script with Basil version - use absolute URL
          console.log('Creating new Stripe.js script with URL:', stripeUrl);
          script = document.createElement('script');
          // CRITICAL: Use setAttribute to ensure absolute URL is preserved
          script.setAttribute('src', stripeUrl);
          // Also set .src property as fallback
          script.src = stripeUrl;
          script.async = true;
          script.crossOrigin = 'anonymous';
          script.setAttribute('data-stripe-release', stripeRelease);

          // Verify the URL was set correctly
          const finalSrc = script.src || script.getAttribute('src');
          if (finalSrc !== stripeUrl && !finalSrc.endsWith('/basil/stripe.js')) {
            console.error('⚠️ Script src mismatch! Expected:', stripeUrl, 'Got:', finalSrc);
          }

          script.onerror = () => {
            console.error('Stripe.js script failed to load. URL was:', script.src);
            reject(new Error('Stripe.js script failed to load (network/CSP). Check Content-Security-Policy, ad/script blockers, and network.'));
          };

          script.onload = () => {
            console.log('✅ Stripe.js script loaded successfully from:', script.src);
            script.dataset.loaded = 'true';
            resolve();
          };
          document.head.appendChild(script);
        } else {
          // Correct version already exists
          console.log('Reusing existing Stripe.js script:', script.src);
          if (script.dataset.loaded === 'true') {
            resolve();
          } else {
            script.addEventListener('load', () => {
              script.dataset.loaded = 'true';
              resolve();
            });
            script.addEventListener('error', () => {
              console.error('Existing Stripe.js script failed to load:', script.src);
              reject(new Error('Stripe.js existing script failed to load.'));
            });
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
   * WHY: For ui_mode: custom, we must use initCheckout() with fetchClientSecret function.
   * Per Stripe docs: initCheckout accepts fetchClientSecret (async function) not clientSecret (string).
   * Custom UI mode allows full control over checkout flow while maintaining Stripe's optimized payment handling.
   */
  async function mountStripeElements(jobData, paymentNumber, containerDiv, returnUrl) {
    try {
      // 1) Validate inputs early
      if (!jobData || !paymentNumber) {
        throw new Error('Missing jobData or paymentNumber for Stripe Checkout.');
      }

      const publishableKey = window.STRIPE_PUBLISHABLE_KEY;
      if (!publishableKey) {
        throw new Error('Stripe publishable key not configured. Set STRIPE_PUBLISHABLE_KEY via environment or include it in the API response.');
      }

      // 2) Clean up any existing Checkout instances
      elementsInstances.forEach((instance, container) => {
        try {
          if (instance) {
            if (instance.paymentElement && typeof instance.paymentElement.unmount === 'function') {
              instance.paymentElement.unmount();
            }
            if (instance.billingAddressElement && typeof instance.billingAddressElement.unmount === 'function') {
              instance.billingAddressElement.unmount();
            }
            if (instance.checkout && typeof instance.checkout.unmount === 'function') {
              instance.checkout.unmount();
            }
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

      // 5) Initialize Stripe (Basil release - custom checkout is GA, no beta flag needed)
      const stripe = window.Stripe(publishableKey);

      if (!stripe || typeof stripe.initCheckout !== 'function') {
        throw new Error('Stripe.initCheckout is unavailable. Check Stripe.js version and ensure latest version is loaded.');
      }

      // 6) Initialize Checkout with fetchClientSecret function (for ui_mode: custom)
      // Per Stripe docs: initCheckout accepts fetchClientSecret (async function), not clientSecret (string)
      // This function will be called by Stripe.js to fetch the client secret when needed
      console.log('Initializing Stripe Checkout with fetchClientSecret function...');
      console.log('Stripe object:', typeof stripe, 'initCheckout type:', typeof stripe.initCheckout);

      // Debug: Check Stripe.js version info if available
      if (stripe._apiVersion) {
        console.log('Stripe API version:', stripe._apiVersion);
      }

      // Create fetchClientSecret function that will be called by Stripe.js
      // Per Stripe docs: This function is called by Stripe.js when it needs the client secret
      const fetchClientSecret = async () => {
        console.log('🔄 fetchClientSecret called by Stripe.js, creating checkout session...');
        const data = await createCheckoutSession(jobData, paymentNumber);

        // Store publishable key if provided (for future use)
        if (data.publishable_key) {
          window.STRIPE_PUBLISHABLE_KEY = data.publishable_key;
          console.log('Stripe publishable key stored from fetchClientSecret');
        }

        if (!data.client_secret) {
          throw new Error('No client_secret returned from server');
        }

        // Validate client secret format
        if (!data.client_secret.startsWith('cs_')) {
          throw new Error(`Invalid client secret format: ${data.client_secret.substring(0, 20)}...`);
        }

        console.log('✅ Client secret fetched:', data.client_secret.substring(0, 20) + '...');
        return data.client_secret;
      };

      // Use fetchClientSecret function (per Stripe documentation)
      const appearance = {
        theme: 'stripe'
      };
      const initOptions = {
        fetchClientSecret: fetchClientSecret,
        elementsOptions: { appearance }
      };
      console.log('initCheckout options:', { fetchClientSecret: '[Function]', elementsOptions: initOptions.elementsOptions });

      const checkout = stripe.initCheckout(initOptions);
      console.log('✅ Stripe Checkout initialized');

      // 7) Listen for Checkout events
      checkout.on('change', (event) => {
        // Handle checkout state changes if needed
        console.log('Checkout state changed:', event);
      });

      // 8) Load actions to get session data and confirm method
      console.log('Loading checkout actions...');
      let loadActionsResult;
      try {
        loadActionsResult = await checkout.loadActions();
        console.log('✅ Checkout actions loaded:', loadActionsResult.type);
      } catch (loadError) {
        console.error('❌ Error loading checkout actions:', loadError);
        throw new Error(`Failed to load checkout actions: ${loadError.message || 'Unknown error'}`);
      }

      if (loadActionsResult.type !== 'success') {
        console.error('❌ Load actions failed:', loadActionsResult);
        throw new Error(`Failed to load checkout actions: ${loadActionsResult.error?.message || 'Unknown error'}`);
      }

      const actions = loadActionsResult.actions;
      console.log('✅ Actions object received');

      const session = actions.getSession();
      console.log('✅ Session retrieved:', session);

      // Get amount from session (handle different possible structures)
      let amount = 0;
      try {
        if (session.total?.total?.amount) {
          amount = session.total.total.amount / 100;
        } else if (session.amount_total) {
          amount = session.amount_total / 100;
        } else if (session.total?.amount) {
          amount = session.total.amount / 100;
        }
      } catch (e) {
        console.warn('Could not extract amount from session:', e);
      }

      // 9) Prepare form HTML
      console.log('Preparing form HTML...');
      containerDiv.innerHTML = `
        <form id="payment-form">
          <div id="payment-element"></div>
          <div id="billing-address-element"></div>
          <button type="submit" id="submit-button" class="btn btn-primary mt-6 w-full">
            <span id="button-text">Pay ${formatCurrency(amount)} now</span>
            <span id="spinner" class="hidden">Processing...</span>
          </button>
          <div id="payment-message" class="hidden mt-4 text-red-600"></div>
        </form>
      `;

      // 10) Create and mount Payment Element
      console.log('Creating Payment Element...');
      const paymentElement = checkout.createPaymentElement();
      console.log('Mounting Payment Element...');
      paymentElement.mount('#payment-element');
      console.log('✅ Payment Element mounted');

      // 11) Create and mount Billing Address Element
      console.log('Creating Billing Address Element...');
      const billingAddressElement = checkout.createBillingAddressElement();
      console.log('Mounting Billing Address Element...');
      billingAddressElement.mount('#billing-address-element');
      console.log('✅ Billing Address Element mounted');

      // 12) Handle form submission
      const form = document.getElementById('payment-form');
      const submitButton = document.getElementById('submit-button');
      const buttonText = document.getElementById('button-text');
      const spinner = document.getElementById('spinner');
      const paymentMessage = document.getElementById('payment-message');

      form.addEventListener('submit', async (event) => {
        event.preventDefault();

        // Disable form during submission
        submitButton.disabled = true;
        buttonText.classList.add('hidden');
        spinner.classList.remove('hidden');
        paymentMessage.classList.add('hidden');

        try {
          // Confirm payment using actions
          const { error } = await actions.confirm();

          if (error) {
            // Show error to user
            paymentMessage.textContent = error.message || 'An error occurred. Please try again.';
            paymentMessage.classList.remove('hidden');
            submitButton.disabled = false;
            buttonText.classList.remove('hidden');
            spinner.classList.add('hidden');
          } else {
            // Payment will redirect automatically via return_url
            console.log('Payment confirmed, redirecting...');
          }
        } catch (err) {
          console.error('Error confirming payment:', err);
          paymentMessage.textContent = err.message || 'An unexpected error occurred. Please try again.';
          paymentMessage.classList.remove('hidden');
          submitButton.disabled = false;
          buttonText.classList.remove('hidden');
          spinner.classList.add('hidden');
        }
      });

      // Store Checkout instance and actions for cleanup
      elementsInstances.set(containerDiv, { checkout, actions, paymentElement, billingAddressElement });

      // 13) Mark as mounted
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

      // Ensure we have a publishable key before proceeding
      // Try to get it from API first, otherwise use existing value
      if (!window.STRIPE_PUBLISHABLE_KEY) {
        // Fetch publishable key from API (create a session just to get the key)
        createCheckoutSession(jobData, paymentNumber)
          .then(data => {
            if (data.publishable_key) {
              window.STRIPE_PUBLISHABLE_KEY = data.publishable_key;
              console.log('Stripe publishable key received from API');
            }
            // Now mount Stripe Elements with fetchClientSecret
            mountStripeElementsWithFetch(jobData, paymentNumber, contentDiv);
          })
          .catch(error => {
            console.error('Error fetching publishable key:', error);
            showErrorState(contentDiv, 'Failed to initialize payment. Please try again.');
            section.dataset.initStarted = 'false';
          });
      } else {
        // Publishable key already available, mount directly
        mountStripeElementsWithFetch(jobData, paymentNumber, contentDiv);
      }
    }
  }

  /**
   * Mount Stripe Elements using fetchClientSecret pattern
   * This is the correct way per Stripe documentation
   */
  async function mountStripeElementsWithFetch(jobData, paymentNumber, containerDiv) {
    try {
      const returnUrl = `${window.location.origin}/${jobData.product?.id || sessionStorage.getItem('jobId')}#completion`;
      console.log('Mounting Stripe Checkout with fetchClientSecret pattern...');
      await mountStripeElements(jobData, paymentNumber, containerDiv, returnUrl);
      console.log('✅ mountStripeElements completed successfully');
    } catch (e) {
      console.error('❌ Error in mountStripeElements:', e);
      showErrorState(containerDiv, `Failed to load payment form: ${e.message}. Please try again.`);
      // Reset init flag so user can retry
      const sectionId = paymentNumber === 1 ? 'payment-1' : 'payment-2';
      const section = document.getElementById(sectionId);
      if (section) {
        section.dataset.initStarted = 'false';
      }
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
