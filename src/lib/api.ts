/**
 * API base URL configuration
 * Uses Vercel backend URL for API calls
 */
const getApiBaseUrl = (): string => {
  // In production, use the Vercel backend URL
  // In development, use localhost or the Vercel URL
  if (import.meta.env.PROD) {
    // Use environment variable if set, otherwise default to Vercel backend
    return import.meta.env.VITE_API_BASE_URL || 'https://freelance-payments-neon.vercel.app';
  } else {
    // In development, prefer env var, fallback to Vercel backend
    return import.meta.env.VITE_API_BASE_URL || 'https://freelance-payments-neon.vercel.app';
  }
};

export const API_BASE_URL = getApiBaseUrl();

/**
 * Helper to build API endpoint URLs
 */
export const apiUrl = (endpoint: string): string => {
  // Remove leading slash if present to avoid double slashes
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${API_BASE_URL}/${cleanEndpoint}`;
};
