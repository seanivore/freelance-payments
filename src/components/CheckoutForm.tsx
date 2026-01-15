import React, { useState } from 'react';
import {
  PaymentElement,
  useCheckout
} from '@stripe/react-stripe-js/checkout';

export const CheckoutForm: React.FC = () => {
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const checkoutState = useCheckout();

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
  const totalAmount = checkout.total?.total?.amount;
  const formattedAmount = totalAmount ? (Number(totalAmount) / 100).toFixed(2) : '0.00';
  
  // Access line items and totals from checkout session
  const lineItems = checkout.lineItems || [];
  const subtotal = checkout.total?.subtotal?.amount ? Number(checkout.total.subtotal.amount) / 100 : 0;
  const discount = checkout.total?.discount?.amount ? Number(checkout.total.discount.amount) / 100 : 0;
  const total = checkout.total?.total?.amount ? Number(checkout.total.total.amount) / 100 : 0;

  return (
    <div className="max-w-md mx-auto p-8 bg-slate-900 rounded-lg border border-slate-800 shadow-xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Order Summary - Display line items and totals */}
        {lineItems.length > 0 && (
          <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
            <h4 className="mb-3 text-lg font-semibold text-slate-200">Order Summary</h4>
            <div className="space-y-2 mb-4">
              {lineItems.map((item: any, index: number) => {
                const itemAmount = item.amount_total ? Number(item.amount_total) / 100 : 0;
                return (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-slate-300">
                      {item.description || `Item ${index + 1}`} {item.quantity > 1 ? `× ${item.quantity}` : ''}
                    </span>
                    <span className="text-slate-200 font-medium">${itemAmount.toFixed(2)}</span>
                  </div>
                );
              })}
            </div>
            <div className="border-t border-slate-700 pt-3 space-y-2">
              {subtotal > 0 && (
                <div className="flex justify-between text-sm text-slate-400">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
              )}
              {discount > 0 && (
                <div className="flex justify-between text-sm text-emerald-400">
                  <span>Discount</span>
                  <span>-${discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold text-white pt-2 border-t border-slate-700">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}
        
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
