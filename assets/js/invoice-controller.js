/**
 * INVOICE CONTROLLER
 * Loads job data and displays specific payment invoice
 * 
 * Updated for v3 schema: Uses initial_price_object, balance_price_object, customer_object, product_object.id
 * Works within single-page template (job.html) with #invoice section
 */

(function () {
  'use strict';

  const contentDiv = document.getElementById('invoice-content');
  const invoiceSection = document.getElementById('invoice');

  /**
   * Get payment number from hash, state, or default to first pending (v3 schema)
   */
  function getPaymentNumber(jobData) {
    // Try hash first (e.g., #invoice?payment=1)
    const hash = window.location.hash;
    const hashMatch = hash.match(/payment[=-](\d+)/);
    if (hashMatch) {
      return parseInt(hashMatch[1], 10);
    }

    // Check state_management to determine which payment is pending
    const stateManagement = jobData.state_management || {};
    const initialPaid = stateManagement.initial_payment_intent?.succeeded !== null;
    const balancePaid = stateManagement.balance_payment_intent?.succeeded !== null;

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
   * Track invoice viewed event
   */
  async function trackInvoiceViewed(jobId, paymentNumber) {
    try {
      await fetch('https://freelance-payments-neon.vercel.app/api/track-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_id: jobId,
          event_type: 'invoice_viewed',
          event_data: { payment_number: paymentNumber, timestamp: new Date().toISOString() }
        })
      });
    } catch (e) {
      console.warn('Failed to track invoice viewed:', e);
    }
  }

  /**
   * Replace template placeholders (v3 schema)
   */
  function replacePlaceholders(template, jobData, priceObject, paymentNumber) {
    let html = template;

    // Invoice number (v3 schema: product_object.id)
    const invoiceNumber = jobData.product_object?.id || '';
    html = html.replace(/\{\{INVOICE_NUMBER\}\}/g, invoiceNumber);
    html = html.replace(/\{\{INVOICE_DATE\}\}/g, formatDate(jobData.state_management?.object?.created || new Date().toISOString().split('T')[0]));

    // Payment status (v3 schema: check state_management)
    const stateManagement = jobData.state_management || {};
    let isPaid = false;
    if (paymentNumber === 1) {
      isPaid = stateManagement.initial_payment_intent?.succeeded !== null;
    } else if (paymentNumber === 2) {
      isPaid = stateManagement.balance_payment_intent?.succeeded !== null;
    }
    const status = isPaid ? 'paid' : 'pending';
    html = html.replace(/\{\{PAYMENT_STATUS\}\}/g, status);

    // Client info (v3 schema: customer_object)
    const customer = jobData.customer_object || {};
    html = html.replace(/\{\{CLIENT_NAME\}\}/g, customer.business_name || customer.individual_name || '');
    html = html.replace(/\{\{CLIENT_CONTACT_NAME\}\}/g, customer.individual_name || '');
    const address = customer.address || {};
    html = html.replace(/\{\{CLIENT_ADDRESS\}\}/g,
      `${address.line1 || ''}, ${address.city || ''}, ${address.state || ''} ${address.postal_code || ''}`.trim());
    html = html.replace(/\{\{CLIENT_EMAIL\}\}/g, customer.email || '');
    html = html.replace(/\{\{CLIENT_PHONE\}\}/g, customer.phone || '');

    // Payment details (v3 schema: price_object.unit_amount in cents)
    const amount = (priceObject.unit_amount || 0) / 100; // Convert cents to dollars
    html = html.replace(/\{\{PAYMENT_NUMBER\}\}/g, paymentNumber);
    html = html.replace(/\{\{TOTAL_PAYMENTS\}\}/g, '2'); // v3 schema always has 2 payments
    html = html.replace(/\{\{PAYMENT_AMOUNT\}\}/g, formatCurrency(amount));
    html = html.replace(/\{\{PAYMENT_DESCRIPTION\}\}/g, priceObject.nickname || '');
    html = html.replace(/\{\{PAYMENT_DETAILS\}\}/g, priceObject.nickname || '');
    const payBy = priceObject.metadata?.pay_by || 'TBD';
    html = html.replace(/\{\{DUE_DATE_OR_TERM\}\}/g, payBy);

    // Contract date
    html = html.replace(/\{\{CONTRACT_DATE\}\}/g, formatDate(jobData.state_management?.object?.created || new Date().toISOString().split('T')[0]));

    // Payment terms (v3 schema: balance_price_object.metadata.pay_days)
    const balancePrice = jobData.balance_price_object || {};
    html = html.replace(/\{\{INVOICE_DAYS\}\}/g, balancePrice.metadata?.pay_days || '14');
    const lateFeeStr = balancePrice.metadata?.late_fee || '';
    if (lateFeeStr) {
      html = html.replace(/\{\{#if LATE_FEE\}\}/g, '');
      html = html.replace(/\{\{\/if\}\}/g, '');
      html = html.replace(/\{\{LATE_FEE\}\}/g, lateFeeStr);
    } else {
      html = html.replace(/\{\{#if LATE_FEE\}\}[\s\S]*?\{\{\/if\}\}/g, '');
    }

    // Project name (v3 schema: project field)
    const projectName = jobData.project || jobData.customer_object?.business_name || `Project ${invoiceNumber}`;
    html = html.replace(/\{\{PROJECT_NAME\}\}/g, projectName);

    // Job ID for navigation
    html = html.replace(/\{\{JOB_ID\}\}/g, invoiceNumber);

    // Payment link (if pending, use hash-based routing)
    if (!isPaid && priceObject.active === true) {
      html = html.replace(/\{\{#if PAYMENT_LINK\}\}/g, '');
      html = html.replace(/\{\{\/if\}\}/g, '');
      html = html.replace(/\{\{PAYMENT_LINK\}\}/g, `#payment-${paymentNumber}`);
    } else {
      html = html.replace(/\{\{#if PAYMENT_LINK\}\}[\s\S]*?\{\{\/if\}\}/g, '');
    }

    return html;
  }

  /**
   * Load invoice template and extract body content
   */
  async function loadInvoiceTemplate() {
    try {
      const response = await fetch('/assets/templates/invoice-template.html');
      if (!response.ok) {
        throw new Error('Failed to load invoice template');
      }
      const fullHTML = await response.text();

      // Extract body content (between <body> and </body> tags)
      const bodyMatch = fullHTML.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      if (bodyMatch) {
        return bodyMatch[1];
      }

      // Fallback: return full HTML if body tags not found
      return fullHTML;
    } catch (error) {
      console.error('Error loading template:', error);
      return null;
    }
  }

  /**
   * Initialize invoice section (works within single-page template)
   */
  async function init() {
    // Only initialize if we're in the invoice section
    if (!invoiceSection || invoiceSection.classList.contains('hidden')) {
      return;
    }

    const jobData = await getJobData();

    if (!jobData) {
      contentDiv.innerHTML = '<p>Job data not found. Please start from the <a href="/">homepage</a>.</p>';
      return;
    }

    // Get payment number (v3 schema: determine from state or hash)
    const paymentNumber = getPaymentNumber(jobData);
    if (!paymentNumber) {
      contentDiv.innerHTML = '<p>All payments are complete. <a href="#completion">View completion page</a>.</p>';
      return;
    }

    // Get price object (v3 schema: initial_price_object or balance_price_object)
    let priceObject = null;
    if (paymentNumber === 1) {
      priceObject = jobData.initial_price_object;
    } else if (paymentNumber === 2) {
      priceObject = jobData.balance_price_object;
    }

    if (!priceObject) {
      contentDiv.innerHTML = '<p>Payment not found. Please contact support.</p>';
      return;
    }

    const jobId = jobData.product_object?.id || sessionStorage.getItem('jobId');

    // Track invoice viewed
    if (jobId) {
      await trackInvoiceViewed(jobId, paymentNumber);
    }

    // Load template
    const template = await loadInvoiceTemplate();
    if (!template) {
      contentDiv.innerHTML = '<p>Failed to load invoice template.</p>';
      return;
    }

    // Replace placeholders
    const invoiceHTML = replacePlaceholders(template, jobData, priceObject, paymentNumber);

    // Inject into page
    contentDiv.innerHTML = invoiceHTML;
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
