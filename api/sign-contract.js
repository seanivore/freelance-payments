/**
 * Vercel Serverless Function
 * Updates contract signed status in JSON file via GitHub Actions
 * 
 * POST /api/sign-contract
 * Body: { job_id: string, signature_data: object }
 */

const https = require('https');

module.exports = async (req, res) => {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { job_id, signature_data } = req.body;

    // Validate required fields
    if (!job_id || !signature_data) {
      return res.status(400).json({
        error: 'job_id and signature_data are required'
      });
    }

    // Get GitHub token from environment
    const githubToken = process.env.GITHUB_TOKEN;
    if (!githubToken) {
      return res.status(500).json({
        error: 'GitHub token not configured'
      });
    }

    // Get repository info from environment
    const repoOwner = process.env.GITHUB_REPO_OWNER || 'seanivore';
    const repoName = process.env.GITHUB_REPO_NAME || 'freelance-payments';

    // Trigger GitHub Actions workflow_dispatch
    const workflowId = 'process-job.yml';
    const workflowUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/actions/workflows/${workflowId}/dispatches`;

    const payload = JSON.stringify({
      ref: 'freelance-payments', // Update to your branch name
      inputs: {
        action: 'sign-contract',
        job_id: job_id,
        signature_data: JSON.stringify(signature_data),
      },
    });

    // Call GitHub Actions API
    const response = await fetch(workflowUrl, {
      method: 'POST',
      headers: {
        'Authorization': `token ${githubToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: payload,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`GitHub API error: ${response.status} - ${errorText}`);
    }

    res.status(200).json({
      success: true,
      message: 'Contract signing workflow triggered',
      job_id: job_id,
    });

  } catch (error) {
    console.error('Error signing contract:', error);
    res.status(500).json({
      error: 'Failed to sign contract',
      message: error.message,
    });
  }
};
