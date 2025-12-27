/**
 * CONTRACT CONTROLLER
 * Loads job data and populates contract template dynamically
 * 
 * Updated for v3 schema: Uses product_object.id, customer_object, initial_price_object, balance_price_object
 * Works within single-page template (job.html) with #contract section
 */

(function () {
  'use strict';

  const contentDiv = document.getElementById('contract-content');
  const contractSection = document.getElementById('contract');

  /**
   * Get job data from sessionStorage or load from path
   */
  async function getJobData() {
    // Try sessionStorage first
    const jobDataStr = sessionStorage.getItem('jobData');
    if (jobDataStr) {
      try {
        return JSON.parse(jobDataStr);
      } catch (e) {
        console.error('Error parsing job data from session:', e);
      }
    }

    // Fallback: try to load from jobPath
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
   * Generate payment schedule HTML (v3 schema: initial_price_object and balance_price_object)
   */
  function generatePaymentSchedule(jobData) {
    const initialPrice = jobData.initial_price_object;
    const balancePrice = jobData.balance_price_object;
    const payments = [];

    if (initialPrice) {
      const amount = initialPrice.unit_amount / 100;
      const payBy = initialPrice.metadata?.pay_by || 'start of work';
      payments.push(`<li>Payment 1: ${formatCurrency(amount)} - ${initialPrice.nickname || 'Initial Payment'} (Due: ${payBy})</li>`);
    }

    if (balancePrice) {
      const amount = balancePrice.unit_amount / 100;
      const payBy = balancePrice.metadata?.pay_by || 'before project launch';
      payments.push(`<li>Payment 2: ${formatCurrency(amount)} - ${balancePrice.nickname || 'Final Payment'} (Due: ${payBy})</li>`);
    }

    return payments.length > 0 ? payments.join('') : '<li>No payments defined</li>';
  }

  /**
   * Replace template placeholders (v3 schema)
   */
  function replacePlaceholders(template, data) {
    let html = template;

    // Client info (v3 schema: customer_object)
    const customer = data.customer_object || {};
    html = html.replace(/\{\{CLIENT_NAME\}\}/g, customer.business_name || customer.individual_name || '');
    html = html.replace(/\{\{CLIENT_CONTACT_NAME\}\}/g, customer.individual_name || '');
    html = html.replace(/\{\{CLIENT_TITLE\}\}/g, customer.description || '');
    const address = customer.address || {};
    html = html.replace(/\{\{CLIENT_ADDRESS\}\}/g,
      `${address.line1 || ''}, ${address.city || ''}, ${address.state || ''} ${address.postal_code || ''}`.trim());

    // Contract dates (v3 schema)
    html = html.replace(/\{\{CONTRACT_DATE\}\}/g, formatDate(data.state_management?.object?.created || new Date().toISOString().split('T')[0]));
    html = html.replace(/\{\{START_DATE\}\}/g, formatDate(data.contract?.work_start));
    html = html.replace(/\{\{END_DATE\}\}/g, formatDate(data.contract?.work_end));

    // Payment info (v3 schema: calculate from price objects)
    const initialPrice = data.initial_price_object || {};
    const balancePrice = data.balance_price_object || {};
    const totalAmount = ((initialPrice.unit_amount || 0) + (balancePrice.unit_amount || 0)) / 100;
    html = html.replace(/\{\{RATE_TYPE\}\}/g, 'Flat Rate');
    html = html.replace(/\{\{TOTAL_FEE\}\}/g, formatCurrency(totalAmount));
    html = html.replace(/\{\{DEPOSIT_PERCENT\}\}/g, initialPrice.unit_amount && totalAmount > 0
      ? `${Math.round((initialPrice.unit_amount / 100 / totalAmount) * 100)}%` : '');
    html = html.replace(/\{\{INVOICE_DAYS\}\}/g, balancePrice.metadata?.pay_days || '14');
    html = html.replace(/\{\{LATE_FEE\}\}/g, formatCurrency(parseFloat(balancePrice.metadata?.late_fee?.replace('$', '') || '0') * 100));
    html = html.replace(/\{\{HOURLY_FEE\}\}/g, formatCurrency(parseFloat(data.contract?.maintenance_monthly_fee?.replace('$', '') || '0') * 100));
    html = html.replace(/\{\{PAYMENT_SCHEDULE\}\}/g, generatePaymentSchedule(data));

    // Project scope
    html = html.replace(/\{\{PROJECT_SCOPE_SUMMARY\}\}/g, data.project_scope_summary || '');

    // Maintenance period
    html = html.replace(/\{\{MAINTENANCE_PERIOD_MONTHS\}\}/g, data.contract?.maintenance_period_months || '3');

    return html;
  }

  /**
   * Load contract template and extract body content
   */
  async function loadContractTemplate() {
    try {
      const response = await fetch('/assets/templates/contract-template.html');
      if (!response.ok) {
        throw new Error('Failed to load contract template');
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
   * Track contract loaded event
   */
  async function trackContractLoaded(jobId) {
    try {
      await fetch('https://freelance-payments-neon.vercel.app/api/track-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_id: jobId,
          event_type: 'contract_loaded',
          event_data: { timestamp: new Date().toISOString() }
        })
      });
    } catch (e) {
      console.warn('Failed to track contract loaded:', e);
    }
  }

  /**
   * Track contract scrolled to bottom
   */
  function setupScrollTracking(jobId) {
    const contractEnd = document.querySelector('#contract-content .contract-end, #contract-content > *:last-child');
    if (!contractEnd) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // Contract bottom is visible
          fetch('https://freelance-payments-neon.vercel.app/api/track-event', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              job_id: jobId,
              event_type: 'contract_scrolled_complete',
              event_data: { timestamp: new Date().toISOString() }
            })
          }).catch(e => console.warn('Failed to track scroll:', e));

          observer.disconnect();
        }
      });
    }, { threshold: 0.5 });

    observer.observe(contractEnd);
  }

  /**
   * Initialize contract section (works within single-page template)
   */
  async function init() {
    // Only initialize if we're in the contract section
    if (!contractSection || contractSection.classList.contains('hidden')) {
      return;
    }

    const jobData = await getJobData();

    if (!jobData) {
      contentDiv.innerHTML = '<p>Job data not found. Please start from the <a href="/">homepage</a>.</p>';
      return;
    }

    const jobId = jobData.product_object?.id || sessionStorage.getItem('jobId');

    // Track contract loaded
    if (jobId) {
      await trackContractLoaded(jobId);
    }

    // Load template
    const template = await loadContractTemplate();
    if (!template) {
      contentDiv.innerHTML = '<p>Failed to load contract template.</p>';
      return;
    }

    // Replace placeholders
    const contractHTML = replacePlaceholders(template, jobData);

    // Inject into page
    contentDiv.innerHTML = contractHTML;

    // Setup scroll tracking
    if (jobId) {
      setTimeout(() => setupScrollTracking(jobId), 500);
    }

    // Attach signature handler if contract not signed (v3 schema: check signatures.client.signed_date)
    const isSigned = !!(jobData.contract?.signatures?.client?.signed_date);
    if (!isSigned) {
      attachSignatureHandler(jobData);
    }
  }

  /**
   * Attach signature functionality
   */
  function attachSignatureHandler(jobData) {
    const signButton = document.querySelector('[onclick="signContract()"]');
    if (signButton) {
      signButton.addEventListener('click', async () => {
        await handleContractSigning(jobData);
      });
    }

    // Make signature handler available globally
    window.signContract = async () => {
      await handleContractSigning(jobData);
    };
  }

  /**
   * Handle contract signing
   */
  async function handleContractSigning(jobData) {
    const contractorSignature = document.querySelector('[data-field="contractor_signature"]')?.textContent.trim();
    const contractorDate = document.querySelector('[data-field="contractor_date"]')?.textContent.trim();
    const clientSignature = document.querySelector('[data-field="client_signature"]')?.textContent.trim();
    const clientDate = document.querySelector('[data-field="client_date"]')?.textContent.trim();

    if (!contractorSignature || !contractorDate || !clientSignature || !clientDate) {
      alert('Please fill in all signature fields before signing.');
      return;
    }

    // Update job data (v3 schema: contract.signatures structure)
    if (!jobData.contract.signatures) {
      jobData.contract.signatures = { contractor: {}, client: {} };
    }
    jobData.contract.signatures.contractor.legal_name = contractorSignature;
    jobData.contract.signatures.contractor.signed_date = contractorDate;
    jobData.contract.signatures.client.legal_name = clientSignature;
    jobData.contract.signatures.client.signed_date = clientDate;

    // Update sessionStorage
    sessionStorage.setItem('jobData', JSON.stringify(jobData));

    const jobId = jobData.product_object?.id || sessionStorage.getItem('jobId');

    // Call Vercel API to update JSON file via GitHub Actions
    try {
      const response = await fetch('https://freelance-payments-neon.vercel.app/api/sign-contract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          job_id: jobId,
          signature_data: {
            signatures: {
              contractor: {
                legal_name: contractorSignature,
                signed_date: contractorDate
              },
              client: {
                legal_name: clientSignature,
                signed_date: clientDate
              }
            }
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update contract');
      }

      alert('Contract signed! Redirecting to invoice...');
    } catch (error) {
      console.error('Error signing contract:', error);
      alert('Contract signed locally, but failed to update server. Please contact support.');
    }

    // Route to next step (invoice/checkout) using hash-based routing
    if (typeof PaymentRouter !== 'undefined') {
      const routeInfo = PaymentRouter.determineRoute(jobData);
      PaymentRouter.routeUser(routeInfo);
    } else {
      // Fallback: update hash directly
      window.location.hash = 'invoice';
    }
  }

  // Export for use in other scripts
  window.ContractController = {
    getJobData,
    handleContractSigning
  };

  // Initialize when contract section becomes visible (single-page template)
  function checkAndInit() {
    if (contractSection && !contractSection.classList.contains('hidden')) {
      init();
    }
  }

  // Watch for section visibility changes
  const observer = new MutationObserver(checkAndInit);
  if (contractSection) {
    observer.observe(contractSection, { attributes: true, attributeFilter: ['class'] });
  }

  // Also initialize on page load if section is already visible
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkAndInit);
  } else {
    checkAndInit();
  }

})();
