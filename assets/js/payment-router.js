/**
 * PAYMENT ROUTER - State Machine
 * Determines user routing based on contract signing status and payment completion
 * Routes: contract → invoice → checkout → completion
 * 
 * Updated for new schema: Uses price[] array, price.paid boolean, _metadata.job_id
 */

(function () {
  'use strict';

  /**
   * Load job data from sessionStorage
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
   * Determine route based on job state
   * Returns: { route: string, paymentNumber?: number, reason: string }
   */
  function determineRoute(jobData) {
    if (!jobData) {
      return {
        route: 'error',
        reason: 'Job data not found'
      };
    }

    const contract = jobData.contract || {};
    const prices = jobData.price || []; // New schema: price[] not payments[]

    // Check if contract is signed
    const isContractSigned = contract.signed === true;

    // Find pending payments (not paid AND active)
    const pendingPayments = prices.filter(p => p.paid === false && p.active === true);
    const paidPayments = prices.filter(p => p.paid === true);
    const allPaymentsPaid = pendingPayments.length === 0 && paidPayments.length > 0;

    // State machine logic
    if (!isContractSigned) {
      // Contract not signed → go to contract page
      return {
        route: 'contract',
        reason: 'Contract not yet signed'
      };
    }

    if (prices.length === 0) {
      // No prices defined (edge case)
      return {
        route: 'error',
        reason: 'No payments defined for this job'
      };
    }

    if (allPaymentsPaid) {
      // All payments complete → completion page
      return {
        route: 'completion',
        reason: 'All payments completed'
      };
    }

    // Contract signed, payments pending → find first pending payment
    const firstPendingPayment = pendingPayments[0];
    if (!firstPendingPayment) {
      return {
        route: 'error',
        reason: 'No active pending payments found'
      };
    }

    const paymentNumber = firstPendingPayment.payment_number;

    // Route to invoice for the pending payment
    return {
      route: 'invoice',
      paymentNumber: paymentNumber,
      reason: `Payment ${paymentNumber} is pending`
    };
  }

  /**
   * Route user to appropriate page
   */
  function routeUser(routeInfo) {
    const { route, paymentNumber } = routeInfo;

    switch (route) {
      case 'contract':
        window.location.href = '/contract.html';
        break;

      case 'invoice':
        if (paymentNumber) {
          window.location.href = `/invoice.html?payment=${paymentNumber}`;
        } else {
          window.location.href = '/invoice.html';
        }
        break;

      case 'checkout':
        if (paymentNumber) {
          window.location.href = `/checkout.html?payment=${paymentNumber}`;
        } else {
          window.location.href = '/checkout.html';
        }
        break;

      case 'completion':
        window.location.href = '/completion.html';
        break;

      case 'error':
      default:
        // Show error or redirect to lookup
        alert(`Error: ${routeInfo.reason}. Redirecting to lookup.`);
        window.location.href = '/';
        break;
    }
  }

  /**
   * Main execution
   */
  function init() {
    const jobData = getJobData();

    if (!jobData) {
      // No job data → redirect to lookup
      console.warn('No job data found, redirecting to lookup');
      window.location.href = '/';
      return;
    }

    // Determine route
    const routeInfo = determineRoute(jobData);
    console.log('Routing decision:', routeInfo);

    // Route user
    routeUser(routeInfo);
  }

  // Export for use in other scripts
  window.PaymentRouter = {
    determineRoute,
    routeUser,
    getJobData
  };

  // Auto-execute if this is the router page
  if (window.location.pathname.includes('payment-router')) {
    init();
  }

})();
