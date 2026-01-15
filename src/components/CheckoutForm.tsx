import React, { useState, useEffect } from 'react';
import {
  PaymentElement,
  useCheckout
} from '@stripe/react-stripe-js/checkout';
import { apiUrl } from '@/lib/api';

export const CheckoutForm: React.FC = () => {
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fallbackTotal, setFallbackTotal] = useState<number | null>(null);

  const checkoutState = useCheckout();

  // ✅ ALL hooks must be called BEFORE any early returns (React Rules of Hooks)
  // Fetch session details if totals missing (fallback for $0 display issue)
  useEffect(() => {
    // Guard: only execute when checkout is ready (success state)
    if (checkoutState.type === 'success') {
      const checkout = checkoutState.checkout;
      const totalAmountRaw = checkout?.total?.total?.amount;
      const totalAmount = totalAmountRaw ? Number(totalAmountRaw) : 0;
      
      // If totals missing or zero, try to fetch from session-status API
      // Type assertion: clientSecret exists on checkout sessions but TypeScript types don't expose it
      const clientSecret = (checkout as any).clientSecret;
      if ((!totalAmount || totalAmount === 0) && clientSecret) {
        // Extract session_id from client_secret (format: cs_test_xxx_secret_yyy)
        const sessionId = clientSecret.split('_secret_')[0];
        if (sessionId) {
          fetch(apiUrl(`/api/session-status?session_id=${sessionId}`))
            .then(res => res.json())
            .then(data => {
              // Use amount_total from session if available
              if (data.amount_total) {
                setFallbackTotal(Number(data.amount_total) / 100);
              }
            })
            .catch(err => {
              console.warn('Failed to fetch session details:', err);
            });
        }
      }
    }
  }, [checkoutState]);

  // NOW early returns are safe (all hooks have been called)
  if (checkoutState.type === 'loading') {
    return (
      <div className="flex items-center justify-center p-10">
        <div className="text-slate-400">Loading checkout...</div>
      </div>
    );
  }

  if (checkoutState.type === 'error') {
    return (
      <div className="p-8 text-center text-red-400 bg-red-900/20 rounded-lg border border-red-900/50">
        Error: {checkoutState.error.message}
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { checkout } = checkoutState;
    setIsSubmitting(true);

    // Email is automatically set from the customer object when session is created
    // No need to validate or update email - Stripe handles it automatically
    const confirmResult = await checkout.confirm();

    // This point will only be reached if there is an immediate error when
    // confirming the payment. Otherwise, your customer will be redirected to
    // your `return_url`. For some payment methods like iDEAL, your customer will
    // be redirected to an intermediate site first to authorize the payment, then
    // redirected to the `return_url`.
    if (confirmResult.type === 'error') {
      setMessage(confirmResult.error.message);
    }

    setIsSubmitting(false);
  };

  const { checkout } = checkoutState;
  const totalAmountRaw = checkout?.total?.total?.amount;
  const totalAmount = totalAmountRaw ? Number(totalAmountRaw) : 0;
  
  // Calculate display total: use fallback if available, otherwise use checkout total, otherwise 0
  let displayTotal = 0;
  if (fallbackTotal !== null) {
    displayTotal = fallbackTotal;
  } else if (totalAmount > 0) {
    displayTotal = totalAmount / 100;
  }
  
  const formattedAmount = displayTotal > 0 ? displayTotal.toFixed(2) : '0.00';
  
  // Debug logging
  if (process.env.NODE_ENV === 'development') {
    console.log('Checkout state:', checkoutState);
    console.log('Total amount (raw):', totalAmount);
    console.log('Fallback total:', fallbackTotal);
    console.log('Display total:', displayTotal);
    console.log('Formatted amount:', formattedAmount);
  }

  return (
    <div className="max-w-md mx-auto p-8 bg-slate-900 rounded-lg border border-slate-800 shadow-xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Amount Due - Simplified display */}
        <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 text-center">
          <div className="text-slate-400 text-sm mb-2">Amount Due</div>
          <div className="text-4xl font-bold text-emerald-400">${formattedAmount}</div>
        </div>
        
        <div>
          <h4 className="mb-3 text-lg font-semibold text-slate-200">Payment</h4>
          <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
            <PaymentElement id="payment-element" />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          id="submit"
          className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-600 disabled:cursor-not-allowed text-slate-900 font-bold py-4 rounded-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-emerald-500/20 flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
          ) : (
            `Pay $${formattedAmount} now`
          )}
        </button>

        {/* Show any error or success messages */}
        {message && (
          <div id="payment-message" className="p-4 text-sm text-center bg-red-900/20 border border-red-900/50 rounded-lg text-red-400">
            {message}
          </div>
        )}
      </form>
    </div>
  );
};
