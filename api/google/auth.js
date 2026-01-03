/**
 * Vercel Serverless Function
 * Generates Google OAuth consent URL for initial authentication
 * 
 * GET /api/google/auth
 * Returns: { url: string } - OAuth consent URL
 * 
 * User visits this URL, completes OAuth flow, receives refresh token
 * One-time setup: refresh token stored in GitHub Secrets as GOOGLE_REFRESH_TOKEN
 */

const { google } = require('googleapis');

module.exports = async (req, res) => {
  // Only allow GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
      return res.status(500).json({
        error: 'Missing OAuth configuration',
        details: 'GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI must be set in Vercel environment variables'
      });
    }

    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUri
    );

    const scopes = [
      'https://www.googleapis.com/auth/documents',
      'https://www.googleapis.com/auth/drive.file'
    ];

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline', // Required to get refresh token
      prompt: 'consent', // Force consent screen to ensure refresh token
      scope: scopes
    });

    res.status(200).json({
      url: authUrl,
      instructions: 'Visit this URL to complete OAuth flow. After authorization, you will be redirected to /api/google/callback with a code. The refresh token will be displayed - add it to GitHub Secrets as GOOGLE_REFRESH_TOKEN.'
    });
  } catch (error) {
    console.error('OAuth auth URL generation failed:', error);
    res.status(500).json({
      error: 'Failed to generate OAuth URL',
      details: error.message
    });
  }
};
