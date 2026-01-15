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
  // Set CORS headers - allow requests from frontend domain
  const allowedOrigins = [
    'https://payments.august.style',
    'http://localhost:5173', // Vite dev server
    'http://localhost:3000'  // Common dev port
  ];
  
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS, GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
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
      'logged_in',
      'contract_loaded',
      'contract_signed',
      'downloaded_docs',
      'payment_1', // Can be tracked if client side wants to log it, though webhook is source of truth
      'payment_2',
      'batch'
    ];

    if (!validEventTypes.includes(event_type)) {
      return res.status(400).json({ error: `Invalid event_type. Must be one of: ${validEventTypes.join(', ')}` });
    }

    // Trigger GitHub Actions workflow to update state
    // This queues the update for batch processing
    const githubToken = process.env.GITHUB_TOKEN;
    const repo = process.env.GITHUB_REPO || 'seanivore/freelance-payments';
    
    // UPDATED: Use the new exit-events workflow
    const workflowId = 'user-exit-events.yml';

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
                // We pass the raw payload for the python script to parse
                // The API can accept a single event or a batch (array)
                // If single, we wrap it
                job_id: job_id,
                payload_json: JSON.stringify(Array.isArray(event_data) ? event_data : [{
                    type: event_type,
                    timestamp: new Date().toISOString(),
                    data: event_data
                }])
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
