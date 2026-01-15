/**
 * Vercel Serverless Function
 * Handles OAuth callback and exchanges authorization code for tokens
 * 
 * GET /api/google/callback?code=...
 * Returns: { refresh_token: string, instructions: string }
 * 
 * After user completes OAuth consent, Google redirects here with code
 * We exchange code for tokens and extract refresh_token for GitHub Secrets
 */

import { google } from 'googleapis';

export default async (req, res) => {
  // Only allow GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { code, error } = req.query;

    if (error) {
      return res.status(400).json({
        error: 'OAuth authorization failed',
        details: error
      });
    }

    if (!code) {
      return res.status(400).json({
        error: 'Missing authorization code',
        details: 'No code parameter in callback URL'
      });
    }

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

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.refresh_token) {
      return res.status(400).json({
        error: 'No refresh token received',
        details: 'OAuth flow did not return refresh_token. Ensure access_type=offline and prompt=consent were used.',
        tokens_received: Object.keys(tokens)
      });
    }

    // Return refresh token with instructions
    res.status(200).json({
      success: true,
      refresh_token: tokens.refresh_token,
      instructions: [
        '1. Copy the refresh_token value above',
        '2. Go to GitHub repository Settings → Secrets and variables → Actions',
        '3. Add new secret: Name = GOOGLE_REFRESH_TOKEN, Value = (paste refresh_token)',
        '4. The Python PDF generation script will now be able to authenticate headlessly',
        '',
        '⚠️ Keep this refresh_token secure - it provides access to your Google Drive/Docs'
      ]
    });
  } catch (error) {
    console.error('OAuth callback failed:', error);
    res.status(500).json({
      error: 'Failed to exchange authorization code',
      details: error.message
    });
  }
};
