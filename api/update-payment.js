/**
 * Vercel Serverless Function
 * Updates payment status in JSON file via GitHub Actions
 * Called by Stripe webhook when payment succeeds
 * 
 * POST /api/update-payment
 * Body: { job_id: string, payment_number: number, payment_data: object }
 */

module.exports = async (req, res) => {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { job_id, payment_number, payment_data } = req.body;

    // Validate required fields
    if (!job_id || payment_number === undefined || !payment_data) {
      return res.status(400).json({
        error: 'job_id, payment_number, and payment_data are required'
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

    // Trigger GitHub Actions workflow_dispatch (new orchestrator workflow)
    const workflowId = 'orchestrate.yml';
    const workflowUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/actions/workflows/${workflowId}/dispatches`;

    const payload = JSON.stringify({
      ref: 'freelance-payments',
      inputs: {
        action: 'update-payment',
        job_id: job_id,
        payload: JSON.stringify({
          payment_number: payment_number,
          succeeded: payment_data.succeeded || new Date().toISOString() + 'Z' // v4 schema: ISO timestamp
        }),
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
      message: 'Payment update workflow triggered',
      job_id: job_id,
      payment_number: payment_number,
    });

  } catch (error) {
    console.error('Error updating payment:', error);
    res.status(500).json({
      error: 'Failed to update payment',
      message: error.message,
    });
  }
};
