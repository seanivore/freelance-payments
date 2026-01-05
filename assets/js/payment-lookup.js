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

      // Read response text once (can't read Response body twice)
      const manifestText = await manifestResponse.text();

      let manifest;
      try {
        manifest = JSON.parse(manifestText);
      } catch (jsonError) {
        console.error('Error parsing manifest.json:', jsonError);
        console.error('Manifest content (first 500 chars):', manifestText.substring(0, 500));
        throw new Error(`Invalid manifest.json format: ${jsonError.message}. Please contact support.`);
      }

      if (!manifest.jobs || Object.keys(manifest.jobs).length === 0) {
        throw new Error('No jobs found in system.');
      }

      // Normalize inputs
      const normalizedLastName = normalizeLookupKey(lastName);
      const normalizedKeyword = normalizeLookupKey(projectKeyword);

      // Find job entry by matching login_name and login_keyword separately
      let jobEntry = null;
      let lookupKey = null;

      for (const [key, entry] of Object.entries(manifest.jobs)) {
        const entryLoginName = normalizeLookupKey(entry.login_name || '');
        const entryKeyword = normalizeLookupKey(entry.login_keyword || '');

        if (entryLoginName === normalizedLastName && entryKeyword === normalizedKeyword) {
          jobEntry = entry;
          lookupKey = key;
          break;
        }
      }

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

      let jobData;
      try {
        const jobText = await jobResponse.text();
        jobData = JSON.parse(jobText);
      } catch (jsonError) {
        console.error(`Error parsing job JSON (${jobPath}):`, jsonError);
        console.error('Job content (first 500 chars):', (await jobResponse.text()).substring(0, 500));
        throw new Error(`Invalid job data format: ${jsonError.message}. Please contact support.`);
      }
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
