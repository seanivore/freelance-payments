import React, { useState, useEffect } from 'react';
import {
  PaymentElement,
  useCheckout
} from '@stripe/react-stripe-js/checkout';

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

  const checkoutState = useCheckout();
  
  // Log full checkout object structure for investigation
  useEffect(() => {
    if (checkoutState.type === 'success') {
      console.log('=== CHECKOUT OBJECT STRUCTURE DEBUG ===');
      console.log('Full checkoutState:', checkoutState);
      console.log('checkoutState.checkout:', checkoutState.checkout);
      console.log('checkoutState.checkout.currency:', checkoutState.checkout?.currency);
      console.log('checkoutState.checkout.total:', checkoutState.checkout?.total);
      console.log('checkoutState.checkout.total?.total:', checkoutState.checkout?.total?.total);
      console.log('checkoutState.checkout.total?.total?.minorUnitsAmount:', checkoutState.checkout?.total?.total?.minorUnitsAmount);
      console.log('checkoutState.checkout.total?.total?.amount:', checkoutState.checkout?.total?.total?.amount);
      console.log('checkoutState.checkout.total?.subtotal:', checkoutState.checkout?.total?.subtotal);
      console.log('========================================');
    }
  }, [checkoutState]);
  
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
  // Read amount from checkout session object (per Stripe React SDK)
  // Stripe React SDK structure: checkout.total.total.minorUnitsAmount (amount in cents)
  // Reference: node_modules/@stripe/stripe-js/dist/stripe-js/checkout.d.ts
  // StripeCheckoutSession.total: StripeCheckoutTotalSummary
  // StripeCheckoutTotalSummary.total: StripeCheckoutAmount
  // StripeCheckoutAmount.minorUnitsAmount: number (amount in cents)

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
  
  // Read amount from checkout session object (per Stripe React SDK type definitions)
  // Correct path: checkout.total.total.minorUnitsAmount (amount in cents as number)
  // Fallback to calculated amount from price data if checkout total not available
  const amountInCents = checkout?.total?.total?.minorUnitsAmount ?? null;
  
  // Determine display amount: use checkout amount if available, otherwise calculated fallback
  const displayAmount = amountInCents !== null 
    ? amountInCents / 100 
    : (calculatedAmount ?? 0);
  
  // Format with proper comma separators using Intl.NumberFormat
  // Use currency from checkout object (StripeCheckoutSession.currency: string)
  const currency = checkout?.currency?.toUpperCase() || 'USD';
  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(displayAmount);
  
  // Debug logging
  console.log('CheckoutForm Debug:', {
    checkoutStateType: checkoutState.type,
    amountInCents,
    currency: checkout?.currency,
    displayAmount,
    formattedAmount,
    calculatedAmount,
    usingCheckoutAmount: amountInCents !== null,
    priceData: price ? { unit_amount: price.unit_amount, coupon: coupon?.amount_off } : null
  });

  return (
    <div className="max-w-md mx-auto p-8 bg-slate-900 rounded-lg border border-slate-800 shadow-xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Amount Due - Display from checkout session object */}
        <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 text-center">
          <div className="text-slate-400 text-sm mb-2">Amount Due</div>
          <div className="text-4xl font-bold text-emerald-400">{formattedAmount}</div>
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
            `Pay ${formattedAmount} now`
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
