/**
 * INVOICE CONTROLLER
 * Loads job data and displays specific payment invoice
 */

(function () {
  'use strict';

  const loadingDiv = document.getElementById('loading');
  const contentDiv = document.getElementById('invoice-content');

  /**
   * Get payment number from URL or default to first pending
   */
  function getPaymentNumber() {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentParam = urlParams.get('payment');
    return paymentParam ? parseInt(paymentParam, 10) : null;
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
   * Get due date/term text
   */
  function getDueDateText(payment) {
    if (payment.due_type === 'date' && payment.due_date) {
      return formatDate(payment.due_date);
    } else if (payment.due_type === 'term' && payment.due_term) {
      return payment.due_term;
    }
    return 'TBD';
  }

  /**
   * Replace template placeholders
   */
  function replacePlaceholders(template, jobData, payment) {
    let html = template;

    // Invoice number (same as job_id)
    html = html.replace(/\{\{INVOICE_NUMBER\}\}/g, jobData.invoice_number || jobData.job_id || '');
    html = html.replace(/\{\{INVOICE_DATE\}\}/g, formatDate(jobData.contract?.date));

    // Payment status
    const status = payment.status || 'pending';
    html = html.replace(/\{\{PAYMENT_STATUS\}\}/g, status);

    // Client info
    html = html.replace(/\{\{CLIENT_NAME\}\}/g, jobData.client?.name || '');
    html = html.replace(/\{\{CLIENT_CONTACT_NAME\}\}/g, jobData.client?.contact?.name || '');
    html = html.replace(/\{\{CLIENT_ADDRESS\}\}/g,
      `${jobData.client?.address?.street || ''}, ${jobData.client?.address?.city || ''}, ${jobData.client?.address?.state || ''} ${jobData.client?.address?.zip || ''}`.trim());
    html = html.replace(/\{\{CLIENT_EMAIL\}\}/g, jobData.client?.contact?.email || '');
    html = html.replace(/\{\{CLIENT_PHONE\}\}/g, jobData.client?.contact?.phone || '');

    // Payment details
    html = html.replace(/\{\{PAYMENT_NUMBER\}\}/g, payment.payment_number);
    html = html.replace(/\{\{TOTAL_PAYMENTS\}\}/g, jobData.payments?.length || 0);
    html = html.replace(/\{\{PAYMENT_AMOUNT\}\}/g, formatCurrency(payment.amount));
    html = html.replace(/\{\{PAYMENT_DESCRIPTION\}\}/g, payment.description || '');
    html = html.replace(/\{\{PAYMENT_DETAILS\}\}/g, payment.description || '');
    html = html.replace(/\{\{DUE_DATE_OR_TERM\}\}/g, getDueDateText(payment));

    // Contract date
    html = html.replace(/\{\{CONTRACT_DATE\}\}/g, formatDate(jobData.contract?.date));

    // Payment terms
    html = html.replace(/\{\{INVOICE_DAYS\}\}/g, jobData.contract?.invoice_days || '30');
    if (jobData.contract?.late_fee) {
      html = html.replace(/\{\{#if LATE_FEE\}\}/g, '');
      html = html.replace(/\{\{\/if\}\}/g, '');
      html = html.replace(/\{\{LATE_FEE\}\}/g, formatCurrency(jobData.contract.late_fee));
    } else {
      // Remove conditional block if no late fee
      html = html.replace(/\{\{#if LATE_FEE\}\}[\s\S]*?\{\{\/if\}\}/g, '');
    }

    // Project name (could be derived from project_keyword or client name)
    const projectName = jobData.client?.name || `Project ${jobData.job_id}`;
    html = html.replace(/\{\{PROJECT_NAME\}\}/g, projectName);

    // Job ID for navigation
    html = html.replace(/\{\{JOB_ID\}\}/g, jobData.job_id || '');

    // Payment link (if pending and Stripe price ID exists)
    if (payment.status === 'pending' && payment.stripe_price_id) {
      html = html.replace(/\{\{#if PAYMENT_LINK\}\}/g, '');
      html = html.replace(/\{\{\/if\}\}/g, '');
      html = html.replace(/\{\{PAYMENT_LINK\}\}/g, `/checkout.html?payment=${payment.payment_number}`);
    } else {
      // Remove payment link conditional
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
   * Initialize invoice page
   */
  async function init() {
    const jobData = await getJobData();

    if (!jobData) {
      alert('Job data not found. Redirecting to lookup.');
      window.location.href = '/';
      return;
    }

    // Get payment number
    const paymentNumber = getPaymentNumber();
    const payments = jobData.payments || [];

    // Find the payment
    let payment = null;
    if (paymentNumber) {
      payment = payments.find(p => p.payment_number === paymentNumber);
    } else {
      // Default to first pending payment
      payment = payments.find(p => p.status === 'pending');
    }

    if (!payment) {
      alert('Payment not found. Redirecting to lookup.');
      window.location.href = '/';
      return;
    }

    // Load template
    const template = await loadInvoiceTemplate();
    if (!template) {
      alert('Failed to load invoice template.');
      return;
    }

    // Replace placeholders
    const invoiceHTML = replacePlaceholders(template, jobData, payment);

    // Inject into page
    contentDiv.innerHTML = invoiceHTML;

    // Hide loading, show content
    loadingDiv.classList.add('hidden');
    contentDiv.classList.remove('hidden');
  }

  // Export for use in other scripts
  window.InvoiceController = {
    getJobData,
    getPaymentNumber
  };

  // Initialize on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
