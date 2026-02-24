import { loadStripe } from '@stripe/stripe-js';

// Get publishable key from environment
// Vite requires VITE_ prefix for client-side environment variables
// Fallback to live key if env var not set (for production builds)
const publishableKey =
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ||
  'pk_live_51SbjhZ4zGcNmpOAwzNxw8bb0wCvTuWUI9bldIbsnYkq0q4WoN2aKnKUg7l0zkwRbdfYoWTylDDzHW0LJR7a6rF1B00Ie1yKnYn';

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
export const stripePromise = loadStripe(publishableKey);
