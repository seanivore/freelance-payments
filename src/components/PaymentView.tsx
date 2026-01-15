import React from 'react';
import { JobData } from '@/lib/data';
import { CheckoutProvider } from '@stripe/react-stripe-js/checkout';
import { stripePromise } from '@/lib/stripe';
import { CheckoutForm } from './CheckoutForm';
import { Loader2 } from 'lucide-react';

type PaymentViewProps = {
  data: JobData;
  paymentNumber: 1 | 2;
  onCreateSession: () => Promise<void>;
  isCreatingSession: boolean;
  clientSecret: string | null;
};

export const PaymentView: React.FC<PaymentViewProps> = ({
  data,
  paymentNumber,
  onCreateSession,
  isCreatingSession,
  clientSecret
}) => {
  const isPayment1 = paymentNumber === 1;
  const price = isPayment1 ? data.product.price1 : data.product.price2;
  const invoiceUrl = isPayment1 ? data.docs.invoice.url : data.docs.balance.url;
  const invoiceFilename = invoiceUrl.split('/').pop() || '';

  // Create checkout session promise for CheckoutProvider
  const checkoutSessionPromise = React.useMemo(() => {
    if (!clientSecret) return null;
    return Promise.resolve(clientSecret);
  }, [clientSecret]);

  // If clientSecret exists, show CheckoutForm
  if (clientSecret && checkoutSessionPromise) {
    return (
      <CheckoutProvider
        stripe={stripePromise}
        options={{
          clientSecret: checkoutSessionPromise,
          elementsOptions: {
            appearance: {
              theme: 'stripe'
            }
          }
        }}
      >
        <CheckoutForm />
      </CheckoutProvider>
    );
  }

  // Otherwise show payment initiation UI
  return (
    <div className="flex flex-col items-center justify-center p-10 mt-10">
      <div className="max-w-md w-full bg-slate-900 p-8 rounded-lg border border-slate-800 shadow-xl">
        <h2 className="text-2xl font-bold mb-6 text-center text-white">
          {isPayment1 ? 'First Payment' : 'Final Balance'}
        </h2>
        
        <div className="mb-8 space-y-4">
          <div className="flex justify-between border-b border-slate-700 pb-2">
            <span className="text-slate-400">Invoice</span>
            <span className="font-mono">{invoiceFilename}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Amount Due</span>
            <span className="text-3xl font-bold text-emerald-400">
              ${(price.unit_amount / 100).toFixed(2)}
            </span>
          </div>
        </div>

        <button 
          className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-600 disabled:cursor-not-allowed text-slate-900 font-bold py-4 rounded-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-emerald-500/20 flex items-center justify-center gap-2"
          onClick={onCreateSession}
          disabled={isCreatingSession}
        >
          {isCreatingSession ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Starting checkout...
            </>
          ) : (
            'Continue to Checkout'
          )}
        </button>
        
        <p className="mt-4 text-xs text-center text-slate-500">
          Payments processed securely by Stripe. No card data is stored on this server.
        </p>
      </div>
    </div>
  );
};
