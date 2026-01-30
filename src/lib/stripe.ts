import { loadStripe } from '@stripe/stripe-js';

// Get publishable key from environment or use test key as fallback
// Vite requires VITE_ prefix for client-side environment variables
const publishableKey =
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
export const stripePromise = loadStripe(publishableKey);
