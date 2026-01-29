import React, { useState } from 'react';
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
  
  // Calculate expected amount from price data (used as fallback)
  const calculatedAmount = React.useMemo(() => {
    if (price) {
      const baseAmount = price.unit_amount / 100;
      const discountAmount = (coupon?.amount_off || 0) / 100;
      return Math.max(0, baseAmount - discountAmount);
    }
    return null;
  }, [price, coupon]);

  // Loading state
  if (checkoutState.type === 'loading') {
    return (
      <div className="w-full max-w-md animate-fade-in-up">
        <div className="bg-portfolio-bg-dark/90 backdrop-blur-sm p-8 rounded-2xl border border-portfolio-border shadow-2xl">
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="w-12 h-12 border-4 border-portfolio-accent-mauve border-t-transparent rounded-full animate-spin" />
            <p className="text-portfolio-text-secondary">Loading checkout...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (checkoutState.type === 'error') {
    return (
      <div className="w-full max-w-md animate-fade-in-up">
        <div className="bg-portfolio-bg-dark/90 backdrop-blur-sm p-8 rounded-2xl border border-red-500/30 shadow-2xl">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-red-400 mb-2">Unable to load checkout</h3>
            <p className="text-portfolio-text-secondary text-sm mb-4">
              {checkoutState.error.message || 'An unexpected error occurred.'}
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="text-portfolio-accent-mauve hover:text-portfolio-accent-mauve/80 text-sm underline"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { checkout } = checkoutState;
    setIsSubmitting(true);
    setMessage(null);

    const confirmResult = await checkout.confirm();

    if (confirmResult.type === 'error') {
      // Show user-friendly error message
      let errorMessage = confirmResult.error.message;
      
      // Make technical errors more user-friendly
      if (errorMessage?.includes('card')) {
        errorMessage = 'There was an issue with your card. Please check your details and try again.';
      } else if (errorMessage?.includes('network') || errorMessage?.includes('connection')) {
        errorMessage = 'Connection issue. Please check your internet and try again.';
      }
      
      setMessage(errorMessage || 'Payment could not be processed. Please try again.');
    }

    setIsSubmitting(false);
  };

  const { checkout } = checkoutState;
  
  // Read amount from checkout session
  const amountInCents = checkout?.total?.total?.minorUnitsAmount ?? null;
  const displayAmount = amountInCents !== null 
    ? amountInCents / 100 
    : (calculatedAmount ?? 0);
  
  const currency = checkout?.currency?.toUpperCase() || 'USD';
  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(displayAmount);

  return (
    <div className="w-full max-w-md animate-fade-in-up">
      <div className="bg-portfolio-bg-dark/90 backdrop-blur-sm p-8 rounded-2xl border border-portfolio-border shadow-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Amount Display */}
          <div className="text-center py-4 bg-portfolio-bg-primary rounded-xl border border-portfolio-border">
            <span className="text-portfolio-text-secondary text-sm block mb-1">Amount Due</span>
            <span className="text-4xl font-bold text-portfolio-accent-mauve">{formattedAmount}</span>
          </div>
          
          {/* Payment Element */}
          <div className="space-y-2">
            <h4 className="font-agency text-lg text-portfolio-text-primary tracking-wide">Payment Details</h4>
            <div className="bg-portfolio-bg-primary p-4 rounded-xl border border-portfolio-border">
              <PaymentElement 
                id="payment-element"
                options={{
                  layout: 'tabs'
                }}
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-portfolio-accent-mauve hover:bg-portfolio-accent-mauve/80 text-portfolio-bg-dark font-semibold py-4 rounded-lg transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-glow flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-portfolio-bg-dark border-t-transparent rounded-full animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              `Pay ${formattedAmount}`
            )}
          </button>

          {/* Error Message */}
          {message && (
            <div className="p-4 text-sm text-center bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
              {message}
            </div>
          )}

          {/* Security Note */}
          <p className="text-xs text-center text-portfolio-text-secondary/70">
            Your payment is secured with industry-standard encryption.
          </p>
        </form>
      </div>
    </div>
  );
};
