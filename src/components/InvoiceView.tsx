import React from 'react';
import { JobData } from '@/lib/data';
import { PdfLoader } from './PdfLoader';
import { GateBar } from './GateBar';

type InvoiceViewProps = {
  data: JobData;
  emitEvent: (name: string, payload?: unknown) => void;
  onCreateCheckoutSession: () => Promise<void>;
  isCreatingSession: boolean;
};

export const InvoiceView: React.FC<InvoiceViewProps> = ({
  data,
  emitEvent,
  onCreateCheckoutSession,
  isCreatingSession
}) => {
  const handleDownloadDocs = (choice: 'yes' | 'no') => {
    emitEvent('invoice_docs', { choice });
    
    // If user wants to download, trigger download
    if (choice === 'yes') {
      const link = document.createElement('a');
      link.href = data.docs.invoice.url;
      link.download = data.docs.invoice.url.split('/').pop() || 'invoice.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleContinue = async () => {
    emitEvent('invoice_acknowledged');
    // Immediately create checkout session and show Stripe checkout
    await onCreateCheckoutSession();
  };

  // Show loading state while creating checkout session
  if (isCreatingSession) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="max-w-md w-full bg-slate-900 p-8 rounded-lg border border-slate-800 shadow-xl text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            <h2 className="text-xl font-semibold text-white">Preparing checkout...</h2>
            <p className="text-slate-400 text-sm">Please wait while we set up your payment</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <PdfLoader
        initialPdfUrl={data.docs.invoice.url}
        initialSection="invoice"
        emitEvent={emitEvent}
        isPaymentSection={false}
      />
      <div className="mt-6 flex justify-center">
        <GateBar
          section="invoice"
          onDownloadDocs={handleDownloadDocs}
          onContinue={handleContinue}
        />
      </div>
    </>
  );
};
