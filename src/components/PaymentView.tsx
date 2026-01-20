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
  const price = isPayment1 ? data.price1 : data.price2;
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
      <div className="relative min-h-screen">
        {/* Background Art */}
        <div className="fixed inset-0 -z-20">
          <img
            src="/assets/media/pdf-viewer-bg-art-3.webp"
            alt=""
            aria-hidden="true"
            className="w-full h-full object-cover"
          />
          <div 
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(to bottom, rgba(15, 15, 15, 0.8) 0%, rgba(15, 15, 15, 0.6) 50%, rgba(15, 15, 15, 0.8) 100%)',
            }}
          />
        </div>

        <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
          <CheckoutProvider
            stripe={stripePromise}
            options={{
              clientSecret: checkoutSessionPromise,
              elementsOptions: {
                appearance: {
                  theme: 'night',
                  variables: {
                    colorPrimary: '#C99CAD',
                    colorBackground: '#1f1f1f',
                    colorText: '#EBEBEB',
                    colorDanger: '#ef4444',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    borderRadius: '8px',
                  },
                }
              }
            }}
          >
            <CheckoutForm 
              price={price}
              coupon={isPayment1 ? data.coupon : undefined}
            />
          </CheckoutProvider>
        </div>
      </div>
    );
  }

  // Otherwise show payment initiation UI
  return (
    <div className="relative min-h-screen">
      {/* Background Art */}
      <div className="fixed inset-0 -z-20">
        <img
          src="/assets/media/pdf-viewer-bg-art-3.webp"
          alt=""
          aria-hidden="true"
          className="w-full h-full object-cover"
        />
        <div 
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to bottom, rgba(15, 15, 15, 0.8) 0%, rgba(15, 15, 15, 0.6) 50%, rgba(15, 15, 15, 0.8) 100%)',
          }}
        />
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md animate-fade-in-up">
          <div className="bg-portfolio-bg-dark/90 backdrop-blur-sm p-8 rounded-2xl border border-portfolio-border shadow-2xl">
            {/* Header */}
            <h2 className="font-agency text-3xl text-center text-portfolio-text-primary mb-2 tracking-wide">
              {isPayment1 ? 'First Payment' : 'Final Balance'}
            </h2>
            <p className="text-center text-portfolio-text-secondary text-sm mb-8">
              {isPayment1 
                ? 'Complete your initial payment to begin the project.' 
                : 'Complete your final payment to finalize the project.'}
            </p>
            
            {/* Invoice Reference */}
            <div className="mb-6 space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-portfolio-border">
                <span className="text-portfolio-text-secondary text-sm">Reference</span>
                <span className="font-mono text-sm text-portfolio-text-primary">{invoiceFilename}</span>
              </div>
              
              {/* Amount Display */}
              <div className="text-center py-6">
                <span className="text-portfolio-text-secondary text-sm block mb-2">Amount Due</span>
                <span className="text-5xl font-bold text-portfolio-accent-mauve">
                  ${(price.unit_amount / 100).toFixed(2)}
                </span>
              </div>
            </div>

            {/* CTA Button */}
            <button 
              className="w-full bg-portfolio-accent-mauve hover:bg-portfolio-accent-mauve/80 text-portfolio-bg-dark font-semibold py-4 rounded-lg transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-glow flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              onClick={onCreateSession}
              disabled={isCreatingSession}
            >
              {isCreatingSession ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Preparing checkout...</span>
                </>
              ) : (
                'Continue to Checkout'
              )}
            </button>
            
            {/* Security Note */}
            <p className="mt-6 text-xs text-center text-portfolio-text-secondary/70">
              Payments processed securely by Stripe. Your card details are never stored on our servers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
