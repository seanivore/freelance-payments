/**
 * PAYMENT ROUTER (Refactored "FluxGate")
 * Central Intelligence for User Routing based strictly on ISO Timestamps.
 * 
 * Logic:
 * 1. Check client_status.logged_in -> (Assumed true if we have jobData, but good to verify)
 * 2. Check client_status.contract_signed -> if missing, GOTO Contract
 * 3. Check client_status.payment_1 -> if missing, GOTO Invoice/Payment 1
 * 4. Check client_status.payment_2 -> if missing (and required), GOTO Invoice/Payment 2
 * 5. Else -> GOTO Completion
 */

(function () {
  'use strict';

  /**
   * Get job data from sessionStorage
   */
  function getJobData() {
    const jobDataStr = sessionStorage.getItem('jobData');
    if (!jobDataStr) return null;
    try {
      return JSON.parse(jobDataStr);
    } catch (e) {
      console.error('FluxGate: Error parsing job data', e);
      return null;
    }
  }

  /**
   * Determine the current route based on strict timestamp state
   * Returns: { route: string, paymentNumber?: number, reason: string }
   */
  function determineRoute(jobData) {
    if (!jobData) {
      return { route: 'error', reason: 'No job data found' };
    }

    const state = jobData.state || {};
    const clientStatus = state.client_status || {};
    const product = jobData.product || {};
    
    // v4.4.0: Strict Timestamp Logic
    const hasSignedContract = !!clientStatus.contract_signed;
    const hasPaid1 = !!clientStatus.payment_1;
    const hasPaid2 = !!clientStatus.payment_2;
    
    // Total payments derived from product/prices
    // If price2 exists and has an ID, we assume 2 payments.
    const hasPrice2 = !!(jobData.price2 && jobData.price2.id);
    const totalPayments = product.total_payments || (hasPrice2 ? 2 : 1);

    console.log('FluxGate Status:', {
      signed: hasSignedContract,
      paid1: hasPaid1,
      paid2: hasPaid2,
      totalPayments
    });

    // 1. Contract Gate
    if (!hasSignedContract) {
      return {
        route: 'contract',
        reason: 'Contract not signed'
      };
    }

    // 2. Payment 1 Gate
    if (!hasPaid1) {
      return {
        route: 'invoice', // Invoice leads to Payment 1
        paymentNumber: 1,
        reason: 'Payment 1 pending'
      };
    }

    // 3. Payment 2 Gate
    if (totalPayments > 1 && !hasPaid2) {
      return {
        route: 'invoice', // Invoice leads to Payment 2
        paymentNumber: 2,
        reason: 'Payment 2 pending'
      };
    }

    // 4. Completion
    return {
      route: 'completion',
      reason: 'All steps completed'
    };
  }

  /**
   * Route user and update UI
   */
  function routeUser(routeInfo) {
    console.log('FluxGate Routing to:', routeInfo);
    
    if (routeInfo.route === 'error') {
      window.location.href = '/'; // Redirect to home/lookup
      return;
    }

    // Map internal route to hash/section ID
    let targetHash = routeInfo.route;
    
    // Handle invoice vs payment page distinction if needed
    // The previous router mapped 'invoice' to 'invoice' section, which likely has a "Pay" button
    // moving them to '#payment-1' or '#payment-2'.
    // FluxGate simply puts them at the start of that flow (Invoice View).
    
    // If we are already on a valid step for this route, don't force-reload
    // e.g., if Route is 'invoice' (for payment 1) and user is on '#payment-1', let them be?
    // STRICT MODE: No, force them to the correct logical step OR allow sub-steps.
    // Let's stick to the main gates: Contract, Invoice, Completion.
    // The 'checkout' sections (#payment-1, #payment-2) are sub-sections of the Invoice flow.
    
    // We will just return the routeInfo for the calling script to handle navigation
    // or set hash directly if standalone.
    
    // In job.html inline script, it handles the visual switching. 
    // This function might be called manually.
    
    // Logic from previous router:
    let sectionId = targetHash;
    if (targetHash === 'checkout') {
         sectionId = (routeInfo.paymentNumber === 2) ? 'payment-2' : 'payment-1';
    }
    
    // If pure 'invoice', we probably want to ensure the invoice controller knows which payment
    // We can use hash params or simple state.
    
    window.location.hash = sectionId;
  }

  /**
   * Initialize
   */
  function init() {
    const jobData = getJobData();
    if (!jobData) return;
    const route = determineRoute(jobData);
    routeUser(route);
  }

  // Export
  window.PaymentRouter = {
    determineRoute,
    routeUser,
    init,
    getJobData
  };

})();
