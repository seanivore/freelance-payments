/**
 * COMPLETION CONTROLLER
 * Displays completion message after successful payment
 * 
 * Updated for v4 schema: Uses product.id, state.payment_1/payment_2
 * Works within single-page template (job.html) with #completion section
 */

(function () {
  'use strict';

  const completionContent = document.getElementById('completion-content');
  const completionSection = document.getElementById('completion');

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
   * Initialize completion section
   */
  async function init() {
    // Only initialize if we're in the completion section
    if (!completionSection || completionSection.classList.contains('hidden')) {
      return;
    }

    const jobData = getJobData();

    if (!jobData) {
      if (completionContent) {
        completionContent.innerHTML = '<p class="error">Job data not found. Please start from the <a href="/">homepage</a>.</p>';
      }
      return;
    }

    const jobId = jobData.product?.id || sessionStorage.getItem('jobId');
    const state = jobData.state || {};
    const payment1 = state.payment_1 || {};
    const payment2 = state.payment_2 || {};
    const price1 = jobData.price1 || {};
    const price2 = jobData.price2 || {};
    const product = jobData.product || {};

    // Check payment status
    const payment1Paid = payment1.succeeded !== null;
    const payment2Paid = payment2.succeeded !== null;
    const totalPayments = product.total_payments || 2;

    // Determine completion status
    let completionMessage = '';
    let isComplete = false;

    if (totalPayments === 1 && payment1Paid) {
      isComplete = true;
      const amount = (price1.unit_amount || 0) / 100;
      completionMessage = `
        <div class="card p-8 text-center">
          <div class="mb-6">
            <svg class="w-20 h-20 mx-auto text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <h1 class="text-3xl font-bold mb-4">Payment Complete!</h1>
          <p class="text-lg text-muted-foreground mb-6">
            Thank you for your payment of ${formatCurrency(amount)}.
          </p>
          <p class="text-muted-foreground">
            Your payment has been processed successfully. You will receive a confirmation email shortly.
          </p>
        </div>
      `;
    } else if (totalPayments === 2) {
      if (payment1Paid && payment2Paid) {
        isComplete = true;
        const amount1 = (price1.unit_amount || 0) / 100;
        const amount2 = (price2.unit_amount || 0) / 100;
        const total = amount1 + amount2;
        completionMessage = `
          <div class="card p-8 text-center">
            <div class="mb-6">
              <svg class="w-20 h-20 mx-auto text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h1 class="text-3xl font-bold mb-4">All Payments Complete!</h1>
            <p class="text-lg text-muted-foreground mb-6">
              Thank you for completing both payments totaling ${formatCurrency(total)}.
            </p>
            <p class="text-muted-foreground">
              Your payments have been processed successfully. You will receive a confirmation email shortly.
            </p>
          </div>
        `;
      } else if (payment1Paid && !payment2Paid) {
        const amount2 = (price2.unit_amount || 0) / 100;
        completionMessage = `
          <div class="card p-8 text-center">
            <div class="mb-6">
              <svg class="w-16 h-16 mx-auto text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <h1 class="text-2xl font-bold mb-4">First Payment Complete</h1>
            <p class="text-lg text-muted-foreground mb-6">
              Your first payment has been processed successfully.
            </p>
            <p class="text-muted-foreground mb-6">
              Your remaining balance of ${formatCurrency(amount2)} will be due before project completion.
            </p>
            <a href="#invoice" class="btn btn-primary">View Invoice</a>
          </div>
        `;
      } else {
        // No payments completed yet
        completionMessage = `
          <div class="card p-8 text-center">
            <p class="text-muted-foreground mb-6">
              Payment not found. Please contact support.
            </p>
            <a href="#invoice" class="btn btn-outline">View Invoice</a>
          </div>
        `;
      }
    } else {
      // Unknown payment structure
      completionMessage = `
        <div class="card p-8 text-center">
          <p class="text-muted-foreground mb-6">
            Payment status could not be determined. Please contact support.
          </p>
          <a href="#invoice" class="btn btn-outline">View Invoice</a>
        </div>
      `;
    }

    if (completionContent) {
      completionContent.innerHTML = completionMessage;
    }
  }

  // Export for use in other scripts
  window.CompletionController = {
    getJobData,
    init
  };

  // Initialize when completion section becomes visible
  function checkAndInit() {
    if (completionSection && !completionSection.classList.contains('hidden')) {
      init();
    }
  }

  // Watch for section visibility changes
  const observer = new MutationObserver(checkAndInit);
  if (completionSection) {
    observer.observe(completionSection, { attributes: true, attributeFilter: ['class'] });
  }

  // Also initialize on page load if section is already visible
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkAndInit);
  } else {
    checkAndInit();
  }

})();
