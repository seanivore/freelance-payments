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
        {isCreatingSession && (
          <div className="ml-4 text-slate-400 text-sm flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
            Starting checkout...
          </div>
        )}
      </div>
    </>
  );
};
