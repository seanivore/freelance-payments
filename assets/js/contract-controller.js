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
   * Simple iframe approach - browser handles PDF rendering
   */
  function embedContractPDF(pdfUrl) {
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
    iframe.style.height = '90vh';
    iframe.style.minHeight = '600px';
    iframe.style.border = 'none';
    iframe.style.borderRadius = '8px';
    iframe.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
    iframe.style.display = 'block';
    iframe.setAttribute('title', 'Contract PDF');
    iframe.setAttribute('loading', 'lazy');

    pdfViewerDiv.appendChild(iframe);

    return true;
  }

  /**
   * Setup sign button visibility (download handled by browser PDF viewer)
   */
  function setupSignButton(jobId) {
    const signButton = document.getElementById('contract-sign-btn');
    const actionsDiv = document.getElementById('contract-actions');

    if (signButton && actionsDiv) {
      actionsDiv.classList.remove('hidden');

      // Track if needed (button click handled by modal script)
      signButton.addEventListener('click', () => {
        if (typeof EventTracker !== 'undefined' && jobId) {
          // Event tracking handled by modal submission
        }
      });
    }
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
   * Only tracks after user has actually scrolled, not just when PDF loads
   */
  function setupScrollTracking(jobId) {
    // Track scroll completion for PDF iframe (v4: PDF embedding)
    const pdfViewer = pdfViewerDiv?.querySelector('iframe');
    if (!pdfViewer) return;

    // Prevent multiple observers from being created
    if (pdfViewer.dataset.scrollTrackingSetup === 'true') {
      return;
    }
    pdfViewer.dataset.scrollTrackingSetup = 'true';

    let hasScrolled = false;
    let scrollTimeout = null;
    let intersectionObserver = null;

    // Wait for iframe to load first
    pdfViewer.addEventListener('load', () => {
      // Wait a moment for PDF to render, then set up scroll tracking
      setTimeout(() => {
        // Listen for scroll events on window (PDF iframe scrolls bubble up)
        const scrollHandler = () => {
          if (!hasScrolled) {
            hasScrolled = true;
            // Clear any existing timeout
            if (scrollTimeout) clearTimeout(scrollTimeout);

            // Wait a moment after scroll stops, then check if PDF is mostly visible
            scrollTimeout = setTimeout(() => {
              // Use intersection observer to verify PDF is mostly visible after user scrolled
              if (intersectionObserver) {
                intersectionObserver.disconnect();
              }

              intersectionObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                  // Only track if user has scrolled AND PDF is 90%+ visible
                  if (entry.isIntersecting && entry.intersectionRatio >= 0.9 && hasScrolled) {
                    console.log('📜 Contract PDF scrolled to completion (user scrolled and PDF 90%+ visible)');
                    if (typeof EventTracker !== 'undefined') {
                      EventTracker.trackContractScrolledComplete(jobId);
                    }
                    intersectionObserver.disconnect();
                    window.removeEventListener('scroll', scrollHandler, true);
                  }
                });
              }, { threshold: 0.9 });

              intersectionObserver.observe(pdfViewer);
            }, 500); // Wait 500ms after scroll stops
          }
        };

        // Listen for scroll events (capture phase to catch iframe scrolls)
        window.addEventListener('scroll', scrollHandler, true);
      }, 1500); // Wait 1.5 seconds after PDF loads before enabling scroll tracking
    });
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

    // Prevent duplicate initialization
    if (contractSection.dataset.initStarted === 'true') {
      return;
    }
    contractSection.dataset.initStarted = 'true';

    const jobData = await getJobData();

    if (!jobData) {
      if (contentDiv) {
        contentDiv.innerHTML = '<p class="error">Job data not found. Please start from the <a href="/">homepage</a>.</p>';
      }
      contractSection.dataset.initStarted = 'false'; // Reset on error
      return;
    }

    const jobId = jobData.product?.id || sessionStorage.getItem('jobId');

    // Track contract loaded (only once)
    if (jobId && !contractSection.dataset.contractLoaded) {
      await trackContractLoaded(jobId);
      contractSection.dataset.contractLoaded = 'true';
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

    // Setup sign button
    setupSignButton(jobId);

    // Setup scroll tracking (for PDF iframe)
    if (jobId) {
      setTimeout(() => setupScrollTracking(jobId), 500);
    }

    // Attach signature handler if contract not signed (v4 schema: check signatures.client.signed_date)
    const isSigned = !!(jobData.contract?.signatures?.client?.signed_date);
    if (!isSigned) {
      try {
        attachSignatureHandler(jobData);
      } catch (error) {
        console.error('Error attaching signature handler:', error);
        // Non-fatal error - contract can still be viewed
      }
    }
  }

  /**
   * Attach signature functionality (v4: modal-based signing)
   * Sign button is now in side actions panel
   */
  function attachSignatureHandler(jobData) {
    // The modal is handled by job.html's inline script
    // This function ensures the sign button is visible and stores jobData reference
    const signButton = document.getElementById('contract-sign-btn');
    const actionsDiv = document.getElementById('contract-actions');

    if (signButton && actionsDiv) {
      actionsDiv.classList.remove('hidden');
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

    // v4.4.0: Optimistically update client_status for FluxGate routing
    if (!jobData.state) jobData.state = {};
    if (!jobData.state.client_status) jobData.state.client_status = {};
    jobData.state.client_status.contract_signed = clientDate;

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

      // Reload job data from server to get fresh state before routing
      // This ensures we have the latest payment status, not stale sessionStorage
      try {
        const jobPath = sessionStorage.getItem('jobPath') || `assets/jobs/${jobId}.json`;
        const freshResponse = await fetch(`/${jobPath}?t=${Date.now()}`); // Cache bust
        if (freshResponse.ok) {
          const freshJobData = await freshResponse.json();
          sessionStorage.setItem('jobData', JSON.stringify(freshJobData));
          jobData = freshJobData; // Use fresh data for routing
        }
      } catch (e) {
        console.warn('Could not reload fresh job data, using local:', e);
      }

      // Track contract signed event (only once, per person)
      if (typeof EventTracker !== 'undefined') {
        EventTracker.trackContractSigned(jobId);
      }

      alert('Contract signed! Redirecting to invoice...');

      // Route to next step (invoice/checkout) using hash-based routing
      // CRITICAL: Always route to invoice after signing, never completion
      // Completion should only be reached after actual payment via webhook
      window.location.hash = 'invoice';
    } catch (error) {
      console.error('Error signing contract:', error);
      alert('Contract signed locally, but failed to update server. Please contact support.');
      // Don't route if signing failed - user should try again
      return;
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

  // Listen for hash changes (user navigating between sections)
  window.addEventListener('hashchange', checkAndInit);

})();
