/**
 * CONTRACT CONTROLLER
 * Loads job data and displays contract PDF
 * 
 * Updated for v4 schema: Uses product.id, customer, price1, price2
 * Works within single-page template (job.html) with #contract section
 * 
 * CRITICAL: v4 requires PDF embedding only - NO HTML fallback rendering
 */

(function () {
  'use strict';

  const contentDiv = document.getElementById('contract-content');
  const contractSection = document.getElementById('contract');
  const pdfViewerDiv = document.getElementById('contract-pdf-viewer');
  const downloadButton = document.getElementById('contract-download-btn');
  const signButton = document.getElementById('contract-sign-btn');

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
   * Embed contract PDF (v4 schema: PDF only, no HTML fallback)
   */
  function embedContractPDF(pdfUrl) {
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
    iframe.setAttribute('title', 'Contract PDF');
    
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
        EventTracker.trackDocumentDownloaded(jobId, 'contract');
      }
    });
  }

  /**
   * Track contract loaded event (uses EventTracker for batching)
   */
  function trackContractLoaded(jobId) {
    if (typeof EventTracker !== 'undefined') {
      EventTracker.trackContractLoaded(jobId);
    }
  }

  /**
   * Track contract scrolled to bottom (uses EventTracker for batching)
   */
  function setupScrollTracking(jobId) {
    // Track scroll completion for PDF iframe (v4: PDF embedding)
    const pdfViewer = pdfViewerDiv?.querySelector('iframe');
    if (!pdfViewer) return;

    // Use intersection observer on PDF iframe to detect when user has scrolled
    // For PDFs, we'll track when the iframe is fully visible (user has likely scrolled through)
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.9) {
          // PDF is mostly visible - user has likely scrolled through
          if (typeof EventTracker !== 'undefined') {
            EventTracker.trackContractScrolledComplete(jobId);
          }
          observer.disconnect();
        }
      });
    }, { threshold: 0.9 });

    observer.observe(pdfViewer);
  }

  /**
   * Initialize contract section (works within single-page template)
   * v4 schema: PDF embedding only, NO HTML fallback
   */
  async function init() {
    // Only initialize if we're in the contract section
    if (!contractSection || contractSection.classList.contains('hidden')) {
      return;
    }

    const jobData = await getJobData();

    if (!jobData) {
      if (contentDiv) {
        contentDiv.innerHTML = '<p class="error">Job data not found. Please start from the <a href="/">homepage</a>.</p>';
      }
      return;
    }

    const jobId = jobData.product?.id || sessionStorage.getItem('jobId');

    // Track contract loaded
    if (jobId) {
      await trackContractLoaded(jobId);
    }

    // v4 schema: Get PDF URL from docs.contract.pdf
    const pdfPath = jobData.docs?.contract?.pdf;
    const pdfUrl = pdfPath 
      ? `https://payments.august.style/${pdfPath}` 
      : jobData.docs?.contract?.url;

    if (!pdfUrl) {
      // v4 requirement: NO HTML fallback - show error instead
      if (contentDiv) {
        contentDiv.innerHTML = '<p class="error">Contract PDF not found. Please contact support.</p>';
      }
      console.error('Contract PDF not found for job:', jobId);
      return;
    }

    // Embed PDF
    if (!embedContractPDF(pdfUrl)) {
      if (contentDiv) {
        contentDiv.innerHTML = '<p class="error">Failed to load contract PDF viewer.</p>';
      }
      return;
    }

    // Setup download button
    setupDownloadButton(pdfUrl, jobId);

    // Setup scroll tracking (for PDF iframe)
    if (jobId) {
      setTimeout(() => setupScrollTracking(jobId), 500);
    }

    // Attach signature handler if contract not signed (v4 schema: check signatures.client.signed_date)
    const isSigned = !!(jobData.contract?.signatures?.client?.signed_date);
    if (!isSigned && signButton) {
      attachSignatureHandler(jobData);
    }
  }

  /**
   * Attach signature functionality (v4: modal-based signing)
   */
  function attachSignatureHandler(jobData) {
    // The modal is handled by job.html's inline script
    // This function ensures the sign button is visible and stores jobData reference
    if (signButton) {
      signButton.classList.remove('hidden');
      // Store jobData reference for modal handler
      window._currentJobData = jobData;
    }
  }

  /**
   * Handle contract signing (called from modal form submission)
   * v4 schema: contract.signatures structure
   */
  async function handleContractSigning(jobData, signatureData) {
    // signatureData should contain: contractorName, contractorDate, clientName, clientDate
    const contractorSignature = signatureData.contractorName || signatureData.contractor?.legal_name;
    const contractorDate = signatureData.contractorDate || signatureData.contractor?.signed_date;
    const clientSignature = signatureData.clientName || signatureData.client?.legal_name;
    const clientDate = signatureData.clientDate || signatureData.client?.signed_date;

    if (!contractorSignature || !contractorDate || !clientSignature || !clientDate) {
      alert('Please fill in all signature fields before signing.');
      return;
    }

    // Update job data (v4 schema: contract.signatures structure)
    if (!jobData.contract) jobData.contract = {};
    if (!jobData.contract.signatures) {
      jobData.contract.signatures = { contractor: {}, client: {} };
    }
    jobData.contract.signatures.contractor.legal_name = contractorSignature;
    jobData.contract.signatures.contractor.signed_date = contractorDate;
    jobData.contract.signatures.client.legal_name = clientSignature;
    jobData.contract.signatures.client.signed_date = clientDate;

    // Update sessionStorage
    sessionStorage.setItem('jobData', JSON.stringify(jobData));

    const jobId = jobData.product?.id || sessionStorage.getItem('jobId');

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
