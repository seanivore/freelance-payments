import React, { useState, useEffect } from 'react';
import {
  PaymentElement,
  useCheckout
} from '@stripe/react-stripe-js/checkout';
import { apiUrl } from '@/lib/api';

type CheckoutFormProps = {
  price?: { unit_amount: number };
  coupon?: { amount_off?: number };
};

export const CheckoutForm: React.FC<CheckoutFormProps> = ({ 
  price, 
  coupon
}) => {
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fallbackTotal, setFallbackTotal] = useState<number | null>(null);

  const checkoutState = useCheckout();
  
  // Calculate expected amount from price data immediately (used as fallback)
  const calculatedAmount = React.useMemo(() => {
    if (price) {
      const baseAmount = price.unit_amount / 100;
      const discountAmount = (coupon?.amount_off || 0) / 100;
      return Math.max(0, baseAmount - discountAmount);
    }
    return null;
  }, [price, coupon]);

  // ✅ ALL hooks must be called BEFORE any early returns (React Rules of Hooks)
  // Fetch session details if totals missing (fallback for $0 display issue)
  useEffect(() => {
    // Guard: only execute when checkout is ready (success state)
    if (checkoutState.type === 'success') {
      const checkout = checkoutState.checkout;
      const totalAmountRaw = checkout?.total?.total?.amount;
      const totalAmount = totalAmountRaw ? Number(totalAmountRaw) : 0;
      
      // If totals missing or zero, try multiple fallback strategies
      if (!totalAmount || totalAmount === 0) {
        const clientSecret = (checkout as any).clientSecret;
        
        // Strategy 1: Fetch from session-status API
        if (clientSecret) {
          const sessionId = clientSecret.split('_secret_')[0];
          if (sessionId) {
            console.log('Fetching session status for fallback amount...', sessionId);
            fetch(apiUrl(`/api/session-status?session_id=${sessionId}`))
              .then(res => res.json())
              .then(data => {
                console.log('Session status response:', data);
                if (data.amount_total) {
                  const amount = Number(data.amount_total) / 100;
                  console.log('Using session-status amount:', amount);
                  setFallbackTotal(amount);
                } else {
                  // Strategy 2: Calculate from price data if available
                  if (price) {
                    const calculatedAmount = (price.unit_amount / 100) - ((coupon?.amount_off || 0) / 100);
                    console.log('Calculating from price data:', calculatedAmount, 'price:', price.unit_amount, 'coupon:', coupon?.amount_off);
                    if (calculatedAmount > 0) {
                      setFallbackTotal(calculatedAmount);
                    }
                  }
                }
              })
              .catch(err => {
                console.warn('Failed to fetch session details:', err);
                // Strategy 2 fallback: Calculate from price data
                if (price) {
                  const calculatedAmount = (price.unit_amount / 100) - ((coupon?.amount_off || 0) / 100);
                  console.log('Using calculated fallback amount:', calculatedAmount);
                  if (calculatedAmount > 0) {
                    setFallbackTotal(calculatedAmount);
                  }
                }
              });
          }
        } else if (price) {
          // Strategy 2: Calculate from price data if no clientSecret yet
          const calculatedAmount = (price.unit_amount / 100) - ((coupon?.amount_off || 0) / 100);
          console.log('Using price data fallback (no session yet):', calculatedAmount);
          if (calculatedAmount > 0) {
            setFallbackTotal(calculatedAmount);
          }
        }
      } else {
        console.log('Checkout has valid total amount:', totalAmount / 100);
      }
    }
  }, [checkoutState, price, coupon]);

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
  
  // Calculate display total: use fallback if available, otherwise use checkout total, otherwise calculated amount
  let displayTotal = 0;
  if (fallbackTotal !== null) {
    displayTotal = fallbackTotal;
  } else if (totalAmount > 0) {
    displayTotal = totalAmount / 100;
  } else if (calculatedAmount !== null && calculatedAmount > 0) {
    // Use calculated amount as immediate fallback while waiting for session-status API
    displayTotal = calculatedAmount;
  }
  
  const formattedAmount = displayTotal > 0 ? displayTotal.toFixed(2) : '0.00';
  
  // Debug logging (always log in case of issues)
  console.log('CheckoutForm Debug:', {
    checkoutStateType: checkoutState.type,
    totalAmountRaw: totalAmount,
    totalAmountDollars: totalAmount / 100,
    fallbackTotal,
    calculatedAmount,
    displayTotal,
    formattedAmount,
    priceData: price ? { unit_amount: price.unit_amount, coupon: coupon?.amount_off } : null
  });

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
