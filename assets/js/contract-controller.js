/**
 * CONTRACT CONTROLLER
 * Loads job data and populates contract template dynamically
 * 
 * Updated for new schema: Uses price[] array, contract.signatures structure, _metadata.job_id
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
  function generatePaymentSchedule(prices) {
    if (!prices || prices.length === 0) return '<li>No payments defined</li>';

    return prices.map((price, index) => {
      // Convert cents to dollars
      const amount = price.unit_amount / 100;
      const dueText = price.due_type === 'date'
        ? `Due: ${formatDate(price.due_date)}`
        : `Due: ${price.due_term}`;

      return `<li>Payment ${price.payment_number}: ${formatCurrency(amount)} - ${price.nickname || 'Payment'} (${dueText})</li>`;
    }).join('');
  }

  /**
   * Replace template placeholders
   */
  function replacePlaceholders(template, data) {
    let html = template;

    // Client info (new schema: client.business not client.name)
    html = html.replace(/\{\{CLIENT_NAME\}\}/g, data.client?.business || '');
    html = html.replace(/\{\{CLIENT_CONTACT_NAME\}\}/g, data.client?.contact?.full_name || '');
    html = html.replace(/\{\{CLIENT_TITLE\}\}/g, data.client?.contact?.title || '');
    html = html.replace(/\{\{CLIENT_ADDRESS\}\}/g,
      `${data.client?.address?.street || ''}, ${data.client?.address?.city || ''}, ${data.client?.address?.state || ''} ${data.client?.address?.zip || ''}`.trim());

    // Contract dates (new schema field names)
    html = html.replace(/\{\{CONTRACT_DATE\}\}/g, formatDate(data.contract?.draft_date));
    html = html.replace(/\{\{START_DATE\}\}/g, formatDate(data.contract?.work_start));
    html = html.replace(/\{\{END_DATE\}\}/g, formatDate(data.contract?.work_end));

    // Payment info (new schema field names)
    html = html.replace(/\{\{RATE_TYPE\}\}/g, data.contract?.rate_type || '');
    html = html.replace(/\{\{TOTAL_FEE\}\}/g, formatCurrency(data.contract?.work_cost || 0));
    html = html.replace(/\{\{DEPOSIT_PERCENT\}\}/g, data.contract?.deposit_percent ? `${data.contract.deposit_percent}%` : '');
    html = html.replace(/\{\{INVOICE_DAYS\}\}/g, data.contract?.balance_pay_days || '');
    html = html.replace(/\{\{LATE_FEE\}\}/g, formatCurrency(data.contract?.late_fee || 0));
    html = html.replace(/\{\{HOURLY_FEE\}\}/g, formatCurrency(data.contract?.maintenance_monthly_fee || 0));
    html = html.replace(/\{\{PAYMENT_SCHEDULE\}\}/g, generatePaymentSchedule(data.price)); // New schema: price[] not payments[]

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

    // Update job data (new schema: contract.signatures structure)
    jobData.contract.signed = true;
    jobData.contract.signatures.contractor.legal_name = contractorSignature;
    jobData.contract.signatures.contractor.signed_date = contractorDate;
    jobData.contract.signatures.client.legal_name = clientSignature;
    jobData.contract.signatures.client.signed_date = clientDate;

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
          job_id: jobData._metadata.job_id, // New schema: _metadata.job_id
          signature_data: {
            signed: true,
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
