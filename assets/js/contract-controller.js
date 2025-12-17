/**
 * CONTRACT CONTROLLER
 * Loads job data and populates contract template dynamically
 */

(function () {
  'use strict';

  const loadingDiv = document.getElementById('loading');
  const contentDiv = document.getElementById('contract-content');

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
   * Generate payment schedule HTML
   */
  function generatePaymentSchedule(payments) {
    if (!payments || payments.length === 0) return '<li>No payments defined</li>';

    return payments.map((payment, index) => {
      const dueText = payment.due_type === 'date'
        ? `Due: ${formatDate(payment.due_date)}`
        : `Due: ${payment.due_term}`;

      return `<li>Payment ${payment.payment_number}: ${formatCurrency(payment.amount)} - ${payment.description} (${dueText})</li>`;
    }).join('');
  }

  /**
   * Replace template placeholders
   */
  function replacePlaceholders(template, data) {
    let html = template;

    // Client info
    html = html.replace(/\{\{CLIENT_NAME\}\}/g, data.client?.name || '');
    html = html.replace(/\{\{CLIENT_CONTACT_NAME\}\}/g, data.client?.contact?.name || '');
    html = html.replace(/\{\{CLIENT_TITLE\}\}/g, data.client?.contact?.title || '');
    html = html.replace(/\{\{CLIENT_ADDRESS\}\}/g,
      `${data.client?.address?.street || ''}, ${data.client?.address?.city || ''}, ${data.client?.address?.state || ''} ${data.client?.address?.zip || ''}`.trim());

    // Contract dates
    html = html.replace(/\{\{CONTRACT_DATE\}\}/g, formatDate(data.contract?.date));
    html = html.replace(/\{\{START_DATE\}\}/g, formatDate(data.contract?.start_date));
    html = html.replace(/\{\{END_DATE\}\}/g, formatDate(data.contract?.end_date));

    // Payment info
    html = html.replace(/\{\{RATE_TYPE\}\}/g, data.contract?.rate_type || '');
    html = html.replace(/\{\{TOTAL_FEE\}\}/g, formatCurrency(data.contract?.total_fee || 0));
    html = html.replace(/\{\{DEPOSIT_PERCENT\}\}/g, data.contract?.deposit_percent ? `${data.contract.deposit_percent}%` : '');
    html = html.replace(/\{\{INVOICE_DAYS\}\}/g, data.contract?.invoice_days || '');
    html = html.replace(/\{\{LATE_FEE\}\}/g, formatCurrency(data.contract?.late_fee || 0));
    html = html.replace(/\{\{HOURLY_FEE\}\}/g, formatCurrency(data.contract?.hourly_fee || 0));
    html = html.replace(/\{\{PAYMENT_SCHEDULE\}\}/g, generatePaymentSchedule(data.payments));

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
   * Initialize contract page
   */
  async function init() {
    const jobData = await getJobData();

    if (!jobData) {
      alert('Job data not found. Redirecting to lookup.');
      window.location.href = '/';
      return;
    }

    // Load template
    const template = await loadContractTemplate();
    if (!template) {
      alert('Failed to load contract template.');
      return;
    }

    // Replace placeholders
    const contractHTML = replacePlaceholders(template, jobData);

    // Inject into page
    contentDiv.innerHTML = contractHTML;

    // Hide loading, show content
    loadingDiv.classList.add('hidden');
    contentDiv.classList.remove('hidden');

    // Attach signature handler if contract not signed
    if (!jobData.contract?.signed) {
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

    // Update job data
    jobData.contract.signed = true;
    jobData.contract.signed_date = new Date().toISOString().split('T')[0];
    jobData.contract.signed_by = clientSignature;
    jobData.contract.contractor_signature = contractorSignature;
    jobData.contract.contractor_date = contractorDate;
    jobData.contract.client_date = clientDate;

    // Update sessionStorage
    sessionStorage.setItem('jobData', JSON.stringify(jobData));

    // Call Vercel API to update JSON file via GitHub Actions
    try {
      const response = await fetch('https://freelance-payments-neon.vercel.app/api/sign-contract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          job_id: jobData.job_id,
          signature_data: {
            signed: true,
            signed_date: jobData.contract.signed_date,
            signed_by: jobData.contract.signed_by,
            contractor_signature: jobData.contract.contractor_signature,
            contractor_date: jobData.contract.contractor_date,
            client_date: jobData.contract.client_date,
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update contract');
      }

      alert('Contract signed! Redirecting to payment...');
    } catch (error) {
      console.error('Error signing contract:', error);
      alert('Contract signed locally, but failed to update server. Please contact support.');
    }

    // Route to next step (invoice/checkout)
    if (typeof PaymentRouter !== 'undefined') {
      const routeInfo = PaymentRouter.determineRoute(jobData);
      PaymentRouter.routeUser(routeInfo);
    } else {
      window.location.href = '/payment-router.html';
    }
  }

  // Export for use in other scripts
  window.ContractController = {
    getJobData,
    handleContractSigning
  };

  // Initialize on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
