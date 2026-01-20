import React from 'react';
import { JobData } from '@/lib/data';

type CompletionViewProps = {
  data: JobData;
  completionType: 'completion1' | 'completion2';
};

export const CompletionView: React.FC<CompletionViewProps> = ({
  data,
  completionType
}) => {
  // Format currency helper
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount / 100); // Convert cents to dollars
  };

  if (completionType === 'completion1') {
    // STATE 1: Payment 1 completed - show once, then user goes to balance
    return (
      <div className="mx-auto max-w-[1100px] px-4 text-slate-100">
        <div className="mt-4 p-8 bg-slate-900 rounded-lg border border-slate-800 shadow-xl">
          <div className="text-center space-y-6">
            {/* Success visual */}
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <svg width="40" height="40" viewBox="0 0 16 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" clipRule="evenodd" d="M15.4695 0.232963C15.8241 0.561287 15.8454 1.1149 15.5171 1.46949L6.14206 11.5945C5.97228 11.7778 5.73221 11.8799 5.48237 11.8748C5.23253 11.8698 4.99677 11.7582 4.83452 11.5681L0.459523 6.44311C0.145767 6.07557 0.18937 5.52327 0.556912 5.20951C0.924454 4.89575 1.47676 4.93936 1.79051 5.3069L5.52658 9.68343L14.233 0.280522C14.5613 -0.0740672 15.1149 -0.0953599 15.4695 0.232963Z" fill="#10b981"/>
              </svg>
            </div>

            <h2 className="text-3xl font-bold text-white">Payment Received!</h2>
            
            <p className="text-slate-300 text-lg">
              Thank you for your payment. We're excited to get started on {data.project}.
            </p>

            {/* Next steps */}
            <div className="mt-8 p-6 bg-slate-800/50 rounded-lg border border-slate-700">
              <h3 className="text-lg font-semibold text-slate-200 mb-3">What's Next?</h3>
              <p className="text-slate-400 text-sm mb-4">
                You'll receive an email when your final balance is ready for payment.
                {data.price2?.pay_by && (
                  <span className="block mt-2">
                    Final payment due: <span className="text-slate-300 font-medium">{data.price2.pay_by}</span>
                  </span>
                )}
              </p>
            </div>

            {/* Download documents */}
            <div className="mt-6 space-y-3">
              <h3 className="text-lg font-semibold text-slate-200">Your Documents</h3>
              <div className="flex flex-col gap-3 items-center">
                <a
                  href={data.docs.contract.url}
                  download
                  className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors inline-flex items-center gap-2"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8 11L3 6h3V1h4v5h3l-5 5zM2 13h12v2H2v-2z" fill="currentColor"/>
                  </svg>
                  Download Contract PDF
                </a>
                <a
                  href={data.docs.invoice.url}
                  download
                  className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors inline-flex items-center gap-2"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8 11L3 6h3V1h4v5h3l-5 5zM2 13h12v2H2v-2z" fill="currentColor"/>
                  </svg>
                  Download Invoice PDF
                </a>
              </div>
            </div>

            {/* Instructions for final payment */}
            {data.price2 && (
              <div className="mt-6 pt-6 border-t border-slate-700">
                <p className="text-slate-400 text-sm">
                  Please return to the payments site and login to make your final payment.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  } else {
    // STATE 2: Payment 2 completed - all payments done, show forever
    return (
      <div className="mx-auto max-w-[1100px] px-4 text-slate-100">
        <div className="mt-4 p-8 bg-slate-900 rounded-lg border border-slate-800 shadow-xl">
          <div className="text-center space-y-6">
            {/* Success visual */}
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <svg width="40" height="40" viewBox="0 0 16 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" clipRule="evenodd" d="M15.4695 0.232963C15.8241 0.561287 15.8454 1.1149 15.5171 1.46949L6.14206 11.5945C5.97228 11.7778 5.73221 11.8799 5.48237 11.8748C5.23253 11.8698 4.99677 11.7582 4.83452 11.5681L0.459523 6.44311C0.145767 6.07557 0.18937 5.52327 0.556912 5.20951C0.924454 4.89575 1.47676 4.93936 1.79051 5.3069L5.52658 9.68343L14.233 0.280522C14.5613 -0.0740672 15.1149 -0.0953599 15.4695 0.232963Z" fill="#10b981"/>
              </svg>
            </div>

            <h2 className="text-3xl font-bold text-white">All Payments Complete!</h2>
            
            <p className="text-slate-300 text-lg">
              Thank you, {data.customer.name}
              {data.customer.title && `, ${data.customer.title}`}
              {data.customer.business && ` of ${data.customer.business}`}!
            </p>

            <p className="text-slate-400">
              You've completed payment for <span className="text-slate-300 font-medium">{data.product.name}</span>
              {data.product.service_usd && (
                <span className="block mt-1">
                  Total: <span className="text-slate-200 font-semibold">{formatCurrency(data.product.service_usd)}</span>
                </span>
              )}
            </p>

            {/* Download all documents */}
            <div className="mt-8 space-y-4">
              <h3 className="text-xl font-semibold text-slate-200">Don't forget to grab copies now if you didn't already</h3>
              <div className="flex flex-col gap-3 items-center">
                <a
                  href={data.docs.contract.url}
                  download
                  className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors inline-flex items-center gap-2"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8 11L3 6h3V1h4v5h3l-5 5zM2 13h12v2H2v-2z" fill="currentColor"/>
                  </svg>
                  Download Contract PDF
                </a>
                <a
                  href={data.docs.invoice.url}
                  download
                  className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors inline-flex items-center gap-2"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8 11L3 6h3V1h4v5h3l-5 5zM2 13h12v2H2v-2z" fill="currentColor"/>
                  </svg>
                  Download Invoice PDF
                </a>
                <a
                  href={data.docs.balance.url}
                  download
                  className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors inline-flex items-center gap-2"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8 11L3 6h3V1h4v5h3l-5 5zM2 13h12v2H2v-2z" fill="currentColor"/>
                  </svg>
                  Download Balance PDF
                </a>
              </div>
            </div>

            {/* Contact information */}
            <div className="mt-8 pt-6 border-t border-slate-700">
              <p className="text-slate-400 text-sm">
                Have questions about your service?{' '}
                <a href="mailto:sean@august.style" className="text-emerald-400 hover:text-emerald-300">
                  Email sean@august.style
                </a>
              </p>
              <p className="text-slate-400 text-sm mt-2">
                Want to submit a review?{' '}
                <a href="mailto:review@august.style" className="text-emerald-400 hover:text-emerald-300">
                  Email review@august.style
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }
};
