/**
 * Vercel Serverless Function
 * Tracks user events (contract loaded, scrolled, invoice viewed, downloads, etc.)
 * 
 * POST /api/track-event
 * Body: { job_id: string, event_type: string, event_data: object }
 * 
 * Queues events for batch processing to update state.client_status in JSON files (v4 schema)
 */

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', 'https://payments.august.style');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { job_id, event_type, event_data } = req.body;

    // Validate required fields
    if (!job_id) {
      return res.status(400).json({ error: 'job_id is required' });
    }

    if (!event_type) {
      return res.status(400).json({ error: 'event_type is required' });
    }

    // Valid event types
    const validEventTypes = [
      'contract_loaded',
      'contract_scrolled_complete',
      'invoice_viewed',
      'contract_signed',
      'document_downloaded'
    ];

    if (!validEventTypes.includes(event_type)) {
      return res.status(400).json({ error: `Invalid event_type. Must be one of: ${validEventTypes.join(', ')}` });
    }

    // Trigger GitHub Actions workflow to update state
    // This queues the update for batch processing
    const githubToken = process.env.GITHUB_TOKEN;
    const repo = process.env.GITHUB_REPO || 'seanivore/freelance-payments';
    // Note: GitHub API uses the workflow filename
    const workflowId = 'user-behavior.yml';

    if (githubToken) {
      try {
        const githubResponse = await fetch(
          `https://api.github.com/repos/${repo}/actions/workflows/${workflowId}/dispatches`,
          {
            method: 'POST',
            headers: {
              'Authorization': `token ${githubToken}`,
              'Accept': 'application/vnd.github.v3+json',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              ref: 'freelance-payments',
              inputs: {
                action: 'track-event',
                job_id: job_id,
                payload: JSON.stringify({
                  event_type: event_type,
                  event_data: event_data || {}
                })
              }
            })
          }
        );

        if (!githubResponse.ok) {
          const errorText = await githubResponse.text();
          console.warn('GitHub Actions trigger failed:', errorText);
          // Don't fail the request - event is still logged
        }
      } catch (githubError) {
        console.warn('Error triggering GitHub Actions:', githubError);
        // Don't fail the request - event is still logged
      }
    }

    // Return success (event will be processed by GitHub Actions)
    res.status(200).json({
      success: true,
      message: 'Event tracked and queued for processing'
    });

  } catch (error) {
    console.error('Error tracking event:', error);
    res.status(500).json({
      error: 'Failed to track event',
      message: error.message,
    });
  }
};
