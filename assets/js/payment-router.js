/**
 * PAYMENT ROUTER - State Machine
 * Determines user routing based on contract signing status and payment completion
 * Routes: contract → invoice → checkout → completion
 * 
 * Updated for v4 schema: Uses state.payment_1/payment_2, product.id
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
   * Determine route based on job state (v4 schema)
   * Returns: { route: string, paymentNumber?: number, reason: string }
   * 
   * Routes: contract → invoice → checkout → completion
   * Uses v4 schema: contract.signatures, state.client_status, state.payment_1/payment_2
   */
  function determineRoute(jobData) {
    if (!jobData) {
      return {
        route: 'error',
        reason: 'Job data not found'
      };
    }

    const contract = jobData.contract || {};
    const state = jobData.state || {};
    const clientStatus = state.client_status || {};

    // v4 schema: prices are in separate objects (price1, price2)
    // Payment status is checked from state.payment_1 and state.payment_2
    const initialPayment = state.payment_1 || {};
    const balancePayment = state.payment_2 || {};

    // Check if contract is signed (v4 schema: contract.signatures.client.signed_date)
    const isContractSigned = !!(contract.signatures &&
      contract.signatures.client &&
      contract.signatures.client.signed_date);

    // Check payment status
    const initialPaid = initialPayment.succeeded !== null;
    const balancePaid = balancePayment.succeeded !== null;
    const allPaymentsPaid = initialPaid && balancePaid;

    // State machine logic
    if (!isContractSigned) {
      // Contract not signed → go to contract section
      return {
        route: 'contract',
        reason: 'Contract not yet signed'
      };
    }

    if (allPaymentsPaid) {
      // All payments complete → completion section
      return {
        route: 'completion',
        reason: 'All payments completed'
      };
    }

    // Contract signed, determine which payment is pending
    if (!initialPaid) {
      // First payment pending → invoice then checkout for payment 1
      return {
        route: 'invoice',
        paymentNumber: 1,
        reason: 'Initial payment is pending'
      };
    } else if (!balancePaid) {
      // Second payment pending → invoice then checkout for payment 2
      return {
        route: 'invoice',
        paymentNumber: 2,
        reason: 'Balance payment is pending'
      };
    }

    // Fallback (shouldn't reach here)
    return {
      route: 'error',
      reason: 'Unable to determine route'
    };
  }

  /**
   * Route user to appropriate section (hash-based routing for single-page app)
   * Maps routes to section IDs: contract, invoice, payment-1, payment-2, completion
   */
  function routeUser(routeInfo) {
    const { route, paymentNumber } = routeInfo;
    const jobId = sessionStorage.getItem('jobId');

    // Map route to section ID
    let sectionId;
    switch (route) {
      case 'contract':
        sectionId = 'contract';
        break;

      case 'invoice':
        sectionId = 'invoice';
        break;

      case 'checkout':
        // Map payment number to section ID
        if (paymentNumber === 1) {
          sectionId = 'payment-1';
        } else if (paymentNumber === 2) {
          sectionId = 'payment-2';
        } else {
          sectionId = 'payment-1'; // Default to first payment
        }
        break;

      case 'completion':
        sectionId = 'completion';
        break;

      case 'error':
      default:
        // Show error or redirect to lookup
        alert(`Error: ${routeInfo.reason}. Redirecting to lookup.`);
        window.location.href = '/';
        return;
    }

    // Update URL hash to navigate to section
    if (jobId) {
      // We're on the job page, just update hash
      window.location.hash = sectionId;

      // Scroll to section (handled by job.html's hashchange listener)
      const targetElement = document.getElementById(sectionId);
      if (targetElement) {
        // Show section, hide others
        document.querySelectorAll('.job-section').forEach(section => {
          section.classList.add('hidden');
        });
        targetElement.classList.remove('hidden');
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } else {
      // Not on job page yet, redirect to job page with hash
      // This shouldn't happen if called from job.html, but handle it anyway
      console.warn('No jobId found, cannot route to section');
      window.location.href = '/';
    }
  }

  /**
   * Main execution (only runs if explicitly called, not auto-executed)
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

    // Route user (will update hash, not redirect)
    routeUser(routeInfo);
  }

  // Export for use in other scripts
  window.PaymentRouter = {
    determineRoute,
    routeUser,
    getJobData,
    init
  };

})();
