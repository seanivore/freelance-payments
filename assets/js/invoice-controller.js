/**
 * INVOICE CONTROLLER
 * Loads job data and displays invoice PDF
 * 
 * Updated for v4 schema: Uses price1, price2, customer, product.id
 * Works within single-page template (job.html) with #invoice section
 * 
 * CRITICAL: v4 requires PDF embedding only - NO HTML fallback rendering
 */

(function () {
  'use strict';

  const contentDiv = document.getElementById('invoice-content');
  const invoiceSection = document.getElementById('invoice');
  const pdfViewerDiv = document.getElementById('invoice-pdf-viewer');

  /**
   * Get payment number from hash, state, or default to first pending (v4 schema)
   */
  function getPaymentNumber(jobData) {
    // Try hash first (e.g., #invoice?payment=1)
    const hash = window.location.hash;
    const hashMatch = hash.match(/payment[=-](\d+)/);
    if (hashMatch) {
      return parseInt(hashMatch[1], 10);
    }

    // Check state to determine which payment is pending (v4 schema: state.payment_1/payment_2)
    const state = jobData.state || {};
    const payment1 = state.payment_1 || {};
    const payment2 = state.payment_2 || {};

    // Check if payments are actually succeeded (succeeded must be a non-null timestamp)
    const initialPaid = payment1.succeeded !== null && payment1.succeeded !== undefined;
    const balancePaid = payment2.succeeded !== null && payment2.succeeded !== undefined;

    // Return first unpaid payment, or null if all paid
    if (!initialPaid) return 1;
    if (!balancePaid) return 2;

    return null; // All paid
  }

  /**
   * Get job data from sessionStorage or load from path
   */
  async function getJobData() {
    const jobDataStr = sessionStorage.getItem('jobData');
    if (jobDataStr) {
      try {
        return JSON.parse(jobDataStr);
      } catch (e) {
        console.error('Error parsing job data:', e);
      }
    }

    const jobPath = sessionStorage.getItem('jobPath');
    if (jobPath) {
      try {
        const response = await fetch(`/${jobPath}`);
        if (response.ok) {
          const data = await response.json();
          sessionStorage.setItem('jobData', JSON.stringify(data));
          return data;
        }
      } catch (e) {
        console.error('Error loading job data:', e);
      }
    }

    return null;
  }

  /**
   * Format date for display
   */
  function formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  /**
   * Format currency
   */
  function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  }

  /**
   * Track invoice viewed event (uses EventTracker for batching)
   */
  function trackInvoiceViewed(jobId, paymentNumber) {
    if (typeof EventTracker !== 'undefined') {
      EventTracker.trackInvoiceViewed(jobId, paymentNumber);
    }
  }

  /**
   * Embed invoice PDF (v4 schema: PDF only, no HTML fallback)
   * Simple iframe approach - browser handles PDF rendering
   */
  function embedInvoicePDF(pdfUrl) {
    if (!pdfViewerDiv) {
      console.error('PDF viewer div not found');
      return false;
    }

    // Clear existing content
    pdfViewerDiv.innerHTML = '';

    // Create iframe for PDF embedding
    const iframe = document.createElement('iframe');
    iframe.src = pdfUrl;
    iframe.style.width = '100%';
    iframe.style.height = '800px';
    iframe.style.border = 'none';
    iframe.style.borderRadius = '8px';
    iframe.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
    iframe.setAttribute('title', 'Invoice PDF');
    iframe.setAttribute('loading', 'lazy');

    pdfViewerDiv.appendChild(iframe);

    return true;
  }


  /**
   * Calculate amount due and amount paid (v4 schema)
   */
  function calculateAmounts(jobData) {
    const state = jobData.state || {};
    const payment1 = state.payment_1 || {};
    const payment2 = state.payment_2 || {};
    const price1 = jobData.price1 || {};
    const price2 = jobData.price2 || {};
    const product = jobData.product || {};

    let amountDue = 0;
    let amountPaid = 0;

    if (!payment1.succeeded) {
      amountDue = (price1.unit_amount || 0) / 100;
    } else {
      amountPaid += (price1.unit_amount || 0) / 100;

      if (product.total_payments === 2 && !payment2.succeeded) {
        amountDue = (price2.unit_amount || 0) / 100;
      }
    }

    if (payment2.succeeded) {
      amountPaid += (price2.unit_amount || 0) / 100;
    }

    return { amountDue, amountPaid };
  }

  /**
   * Initialize invoice section (works within single-page template)
   * v4 schema: PDF embedding only, NO HTML fallback
   */
  async function init() {
    // Only initialize if we're in the invoice section
    if (!invoiceSection || invoiceSection.classList.contains('hidden')) {
      return;
    }

    const jobData = await getJobData();

    if (!jobData) {
      if (contentDiv) {
        contentDiv.innerHTML = '<p class="error">Job data not found. Please start from the <a href="/">homepage</a>.</p>';
      }
      return;
    }

    // Get payment number (v4 schema: determine from state or hash)
    const paymentNumber = getPaymentNumber(jobData);
    if (!paymentNumber) {
      if (contentDiv) {
        contentDiv.innerHTML = '<p>All payments are complete. <a href="#completion">View completion page</a>.</p>';
      }
      return;
    }

    const jobId = jobData.product?.id || sessionStorage.getItem('jobId');

    // v4 schema: Get PDF URL from docs.invoice.pdf
    const pdfPath = jobData.docs?.invoice?.pdf;
    const pdfUrl = pdfPath
      ? `https://payments.august.style/${pdfPath}`
      : jobData.docs?.invoice?.url;

    if (!pdfUrl) {
      // v4 requirement: NO HTML fallback - show error instead
      if (contentDiv) {
        contentDiv.innerHTML = '<p class="error">Invoice PDF not found. Please contact support.</p>';
      }
      console.error('Invoice PDF not found for job:', jobId);
      return;
    }

    // Embed PDF
    if (!embedInvoicePDF(pdfUrl)) {
      if (contentDiv) {
        contentDiv.innerHTML = '<p class="error">Failed to load invoice PDF viewer.</p>';
      }
      return;
    }

    // Show Action Buttons
    const actionsDiv = document.getElementById('invoice-actions');
    const proceedBtn = document.getElementById('invoice-proceed-btn');
    
    if (actionsDiv) {
      actionsDiv.classList.remove('hidden');
      
      // Update button text based on payment number
      if (proceedBtn) {
         proceedBtn.innerHTML = `Proceed to Payment ${paymentNumber} <svg class="w-4 h-4 ml-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>`;
         
         // Remove old listeners (cloning)
         const newBtn = proceedBtn.cloneNode(true);
         proceedBtn.parentNode.replaceChild(newBtn, proceedBtn);
         
         newBtn.addEventListener('click', () => {
             handleProceed(jobId, paymentNumber, jobData);
         });
      }
    }

    // Track invoice viewed only once when user actually navigates to invoice section
    // Use a flag to prevent duplicate tracking
    if (jobId && !invoiceSection.dataset.invoiceTracked) {
      trackInvoiceViewed(jobId, paymentNumber);
      invoiceSection.dataset.invoiceTracked = 'true';
    }
  }

  /**
   * Handle Proceed Button Click
   * 1. Track 'downloaded_docs' event (which is the trigger for 'invoice'/'balance' timestamp)
   * 2. Optimistically update local state
   * 3. Route to Checkout
   */
  async function handleProceed(jobId, paymentNumber, jobData) {
      const btn = document.getElementById('invoice-proceed-btn');
      if (btn) {
          btn.disabled = true;
          btn.innerHTML = 'Processing...';
      }

      // Track the event
      if (typeof EventTracker !== 'undefined') {
          // 'downloaded_docs' is the event that sets client_status.invoice (or balance)
          await EventTracker.track('downloaded_docs', {
              job_id: jobId,
              payment_number: paymentNumber
          });
      }

      // Optimistic update
      const now = new Date().toISOString();
      if (!jobData.state) jobData.state = {};
      if (!jobData.state.client_status) jobData.state.client_status = {};
      
      if (paymentNumber === 1) {
          jobData.state.client_status.invoice = now;
      } else {
          jobData.state.client_status.balance = now;
      }
      
      sessionStorage.setItem('jobData', JSON.stringify(jobData));
      
      // Re-run router to move to checkout
      if (typeof PaymentRouter !== 'undefined') {
          PaymentRouter.init();
      } else {
          window.location.reload();
      }
  }

  // Export for use in other scripts
  window.InvoiceController = {
    getJobData,
    getPaymentNumber,
    init
  };

  // Initialize when invoice section becomes visible (single-page template)
  // Only initialize if user actually navigated to invoice section (hash matches)
  function checkAndInit() {
    const hash = window.location.hash;
    const isOnInvoice = hash === '#invoice' || hash.startsWith('#invoice');

    if (invoiceSection && !invoiceSection.classList.contains('hidden') && isOnInvoice) {
      init();
    }
  }

  // Watch for section visibility changes
  const observer = new MutationObserver(checkAndInit);
  if (invoiceSection) {
    observer.observe(invoiceSection, { attributes: true, attributeFilter: ['class'] });
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
