/**
 * PAYMENT LOOKUP
 * Handles form submission and job lookup via manifest
 */

(function () {
  'use strict';

  const form = document.getElementById('lookup-form');
  const errorDiv = document.getElementById('error-message');
  const errorText = document.getElementById('error-text');

  /**
   * Normalize lookup key (matches Python script)
   */
  function normalizeLookupKey(text) {
    return text.toLowerCase().replace(/\s+/g, '-').replace(/_/g, '-').trim();
  }

  /**
   * Show error message
   */
  function showError(message) {
    errorText.textContent = message;
    errorDiv.classList.remove('hidden');
  }

  /**
   * Hide error message
   */
  function hideError() {
    errorDiv.classList.add('hidden');
  }

  /**
   * Load manifest and find job
   */
  async function lookupJob(lastName, projectKeyword) {
    try {
      // Load manifest
      const manifestResponse = await fetch('/assets/js/manifest.json');
      if (!manifestResponse.ok) {
        throw new Error('Manifest not found. Please contact support.');
      }

      const manifest = await manifestResponse.json();

      if (!manifest.jobs || Object.keys(manifest.jobs).length === 0) {
        throw new Error('No jobs found in system.');
      }

      // Create lookup key
      const normalizedLastName = normalizeLookupKey(lastName);
      const normalizedKeyword = normalizeLookupKey(projectKeyword);
      const lookupKey = `${normalizedLastName}-${normalizedKeyword}`;

      // Find job entry in manifest (now an object with file_path, job_id, etc.)
      const jobEntry = manifest.jobs[lookupKey];

      if (!jobEntry) {
        throw new Error('Job not found. Please check your last name and project keyword.');
      }

      // Extract job_id and file_path from entry
      const jobId = jobEntry.job_id;
      const jobPath = jobEntry.file_path;

      // Store job data in sessionStorage for routing
      sessionStorage.setItem('jobPath', jobPath);
      sessionStorage.setItem('jobId', jobId);
      sessionStorage.setItem('lookupKey', lookupKey);

      // Load job data to verify it exists
      const jobResponse = await fetch(`/${jobPath}`);
      if (!jobResponse.ok) {
        throw new Error('Job data not found. Please contact support.');
      }

      const jobData = await jobResponse.json();
      sessionStorage.setItem('jobData', JSON.stringify(jobData));

      // Redirect to job_id-based URL (404.html will route to appropriate section)
      window.location.href = `/${jobId}`;

    } catch (error) {
      console.error('Lookup error:', error);
      showError(error.message || 'An error occurred. Please try again.');
    }
  }

  /**
   * Handle form submission
   */
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError();

    const lastName = document.getElementById('last-name').value.trim();
    const projectKeyword = document.getElementById('project-keyword').value.trim();

    if (!lastName || !projectKeyword) {
      showError('Please fill in all fields.');
      return;
    }

    // Disable form during lookup
    const submitButton = form.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.textContent = 'Looking up...';

    try {
      await lookupJob(lastName, projectKeyword);
    } finally {
      // Re-enable form (in case of error)
      submitButton.disabled = false;
      submitButton.textContent = originalText;
    }
  });

  // Clear sessionStorage on page load (fresh lookup)
  sessionStorage.removeItem('jobPath');
  sessionStorage.removeItem('jobId');
  sessionStorage.removeItem('lookupKey');
  sessionStorage.removeItem('jobData');

})();
