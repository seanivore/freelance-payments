import { loadStripe } from '@stripe/stripe-js';

// Get publishable key from environment or use test key as fallback
// Vite requires VITE_ prefix for client-side environment variables
const publishableKey =
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ||
  'pk_test_51Sbjhg9fljwH26CPk5PQKftpMaVQ7D7kIH3O3tYVEFSkOzVdqI5DWtT7EMcJDUqQLKEgIosx7q4nfgjrB1KMf85100WsuWFKNr';

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
export const stripePromise = loadStripe(publishableKey);
