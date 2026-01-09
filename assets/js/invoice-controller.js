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

   * Initialize invoice section
   * @param {number} explicitPaymentNumber - Passed by FlowManager
   */
  async function init(explicitPaymentNumber) {
    // Note: FlowManager ensures section is visible before calling init
    
    const jobData = await getJobData();

    if (!jobData) {
      if (contentDiv) {
        contentDiv.innerHTML = '<p class="error">Job data not found. Please start from the <a href="/">homepage</a>.</p>';
      }
      return;
    }

    // Use explicit number from FlowManager, or fallback (shouldn't happen)
    const paymentNumber = explicitPaymentNumber || 1; 

    // ... (rest of render logic is fine) ...
    
    const jobId = jobData.product?.id || sessionStorage.getItem('jobId');

    // v4 schema: Get PDF URL from docs.invoice (or balance)
    // Map payment number to document key
    // Payment 1 -> 'invoice'
    // Payment 2 -> 'balance'
    const docKey = paymentNumber === 1 ? 'invoice' : 'balance';
    
    const pdfPath = jobData.docs?.[docKey]?.pdf;
    const pdfUrl = pdfPath
      ? `https://payments.august.style/${pdfPath}`
      : jobData.docs?.[docKey]?.url;

    if (!pdfUrl) {
      if (contentDiv) {
        contentDiv.innerHTML = `<p class="error">${docKey === 'invoice' ? 'Invoice' : 'Balance Invoice'} PDF not found. Please contact support.</p>`;
      }
      return;
    }

    // Embed PDF
    if (!embedInvoicePDF(pdfUrl)) {
      if (contentDiv) {
        contentDiv.innerHTML = '<p class="error">Failed to load invoice PDF viewer.</p>';
      }
      return;
    }

    // Show Action Buttons & Setup Listener
    const actionsDiv = document.getElementById('invoice-actions');
    const proceedBtn = document.getElementById('invoice-proceed-btn');
    
    if (actionsDiv) {
      actionsDiv.classList.remove('hidden');
      
      if (proceedBtn) {
         proceedBtn.innerHTML = `Proceed to Payment ${paymentNumber} <svg class="w-4 h-4 ml-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>`;
         
         // Clone to strip old listeners
         const newBtn = proceedBtn.cloneNode(true);
         proceedBtn.parentNode.replaceChild(newBtn, proceedBtn);
         
         newBtn.addEventListener('click', () => {
             handleProceed(jobId, paymentNumber, jobData);
         });
         
         // Reset state
         newBtn.disabled = false;
      }
    }

    // Track view (once per load)
    trackInvoiceViewed(jobId, paymentNumber);
  }

  /**
   * Handle Proceed
   */
  async function handleProceed(jobId, paymentNumber, jobData) {
      const btn = document.getElementById('invoice-proceed-btn');
      if (btn) {
          btn.disabled = true;
          btn.innerHTML = 'Processing...';
      }

      // Track event
      if (typeof EventTracker !== 'undefined') {
          // Ensure we call generic track if available, or fallback
          if (EventTracker.track) {
             await EventTracker.track(jobId, 'downloaded_docs', { payment_number: paymentNumber });
          } else {
             // Fallback for safety
             console.warn('EventTracker.track missing');
          }
      }

      // Update FlowManager
      const key = paymentNumber === 1 ? 'invoice' : 'balance';
      if (window.FlowManager) {
          window.FlowManager.updateState(key);
      } else {
          window.location.reload();
      }
  }

  // Export
  window.InvoiceController = {
    init // Called by FlowManager
  };

})();
