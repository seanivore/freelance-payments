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
  const downloadButton = document.getElementById('invoice-download-btn');

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

    // Check state to determine which payment is pending (v4 schema: state.payment_2, not balance_payment_intent)
    const state = jobData.state || {};
    const initialPaid = state.payment_1?.succeeded !== null;
    const balancePaid = state.payment_2?.succeeded !== null;

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
   */
  function embedInvoicePDF(pdfUrl) {
    if (!pdfViewerDiv) {
      console.error('PDF viewer div not found');
      return false;
    }

    // Create iframe for PDF embedding
    const iframe = document.createElement('iframe');
    iframe.src = pdfUrl;
    iframe.style.width = '100%';
    iframe.style.height = '800px';
    iframe.style.border = 'none';
    iframe.style.borderRadius = '8px';
    iframe.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
    iframe.setAttribute('title', 'Invoice PDF');
    
    // Clear existing content
    pdfViewerDiv.innerHTML = '';
    pdfViewerDiv.appendChild(iframe);
    
    return true;
  }

  /**
   * Setup download button (v4 schema: link to PDF)
   */
  function setupDownloadButton(pdfUrl, jobId) {
    if (!downloadButton) return;
    
    downloadButton.href = pdfUrl;
    downloadButton.download = pdfUrl.split('/').pop();
    downloadButton.style.display = 'inline-block';
    
    // Track download event
    downloadButton.addEventListener('click', () => {
      if (typeof EventTracker !== 'undefined' && jobId) {
        EventTracker.trackDocumentDownloaded(jobId, 'invoice');
      }
    });
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

    // Track invoice viewed
    if (jobId) {
      await trackInvoiceViewed(jobId, paymentNumber);
    }

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

    // Setup download button
    setupDownloadButton(pdfUrl, jobId);
  }

  // Export for use in other scripts
  window.InvoiceController = {
    getJobData,
    getPaymentNumber,
    init
  };

  // Initialize when invoice section becomes visible (single-page template)
  function checkAndInit() {
    if (invoiceSection && !invoiceSection.classList.contains('hidden')) {
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

})();
