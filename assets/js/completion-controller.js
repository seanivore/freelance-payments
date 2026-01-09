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
   * Reloads fresh job data to ensure accurate payment status
   */
  async function init() {
    // Only initialize if we're in the completion section
    if (!completionSection || completionSection.classList.contains('hidden')) {
      return;
    }

    let jobData = getJobData();
    const jobId = jobData?.product?.id || sessionStorage.getItem('jobId');

    if (!jobData || !jobId) {
      if (completionContent) {
        completionContent.innerHTML = '<p class="error">Job data not found. Please start from the <a href="/">homepage</a>.</p>';
      }
      return;
    }

    // CRITICAL: Reload fresh job data from server to get accurate payment status
    // sessionStorage might have stale data - webhooks update the JSON file, not sessionStorage
    try {
      const jobPath = sessionStorage.getItem('jobPath') || `assets/jobs/${jobId}.json`;
      const freshResponse = await fetch(`/${jobPath}?t=${Date.now()}`); // Cache bust
      if (freshResponse.ok) {
        const freshJobData = await freshResponse.json();
        sessionStorage.setItem('jobData', JSON.stringify(freshJobData));
        jobData = freshJobData; // Use fresh data
        console.log('✅ Completion: Reloaded fresh payment status from server (checking payment_1/payment_2 state)');
      }
    } catch (e) {
      console.warn('Could not reload fresh job data for completion, using sessionStorage:', e);
    }

    const state = jobData.state || {};
    const payment1 = state.payment_1 || {};
    const payment2 = state.payment_2 || {};
    const price1 = jobData.price1 || {};
    const price2 = jobData.price2 || {};
    const product = jobData.product || {};

    // Check payment status
    const payment1Paid = payment1.succeeded !== null;
    const payment2Paid = payment2.succeeded !== null;
    const totalPayments = product.total_payments || (price2?.id ? 2 : 1); // Default: 2 if price2 exists, else 1
    const hasPrice2 = !!price2?.id; // Check if price2 actually exists

    // Determine completion status
    let completionMessage = '';
    let isComplete = false;

    // For single payment jobs (totalPayments === 1 OR no price2)
    if (totalPayments === 1 && payment1Paid && !hasPrice2) {
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
    } else if (totalPayments === 2 || hasPrice2) {
      if (payment1Paid && payment2Paid) {
        isComplete = true;
        const amount1 = (price1.unit_amount || 0) / 100;
        const amount2 = (price2.unit_amount || 0) / 100;
        const total = amount1 + amount2;
        
        // PDF Links
        const contractUrl = jobData.docs?.contract?.url || jobData.docs?.contract?.pdf;
        const inv1Url = jobData.docs?.invoice_1?.url || jobData.docs?.invoice_1?.pdf;
        const inv2Url = jobData.docs?.invoice_2?.url || jobData.docs?.invoice_2?.pdf;

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
            <p class="text-muted-foreground mb-8">
              Your payments have been processed successfully. You can download your documents below.
            </p>
            
            <div class="flex flex-col gap-3 max-w-xs mx-auto">
                ${contractUrl ? `<a href="${contractUrl}" target="_blank" class="btn btn-outline w-full">Download Contract</a>` : ''}
                ${inv1Url ? `<a href="${inv1Url}" target="_blank" class="btn btn-outline w-full">Download Initial Invoice</a>` : ''}
                ${inv2Url ? `<a href="${inv2Url}" target="_blank" class="btn btn-outline w-full">Download Balance Invoice</a>` : ''}
            </div>
          </div>
        `;
      } else if (payment1Paid && !payment2Paid) {
        const amount2 = (price2.unit_amount || 0) / 100;
        const workEnd = jobData.contract?.work_end || 'project completion';
        const customerName = jobData.customer?.name || 'valued client';
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
              Your remaining balance of ${formatCurrency(amount2)} will be due before ${workEnd}.
            </p>
            <p class="text-sm text-muted-foreground mb-6">
              You can pay now or wait until we email you. Thank you for your business, ${customerName}!
            </p>
            <div class="flex gap-4 justify-center">
              <a href="#payment-2" class="btn btn-primary">Pay Now</a>
              <a href="#invoice" class="btn btn-outline">View Invoice</a>
            </div>
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
  // Only initialize if user actually navigated to completion section (hash matches)
  function checkAndInit() {
    const hash = window.location.hash;
    const isOnCompletion = hash === '#completion' || hash.includes('#completion');

    if (completionSection && !completionSection.classList.contains('hidden') && isOnCompletion) {
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

  // Listen for hash changes (user navigating between sections)
  window.addEventListener('hashchange', checkAndInit);

})();
