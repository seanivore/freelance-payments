import React from 'react';
import { JobData } from '@/lib/data';
import { PdfLoader } from './PdfLoader';
import { GateBar } from './GateBar';

type BalanceViewProps = {
  data: JobData;
  emitEvent: (name: string, payload?: unknown) => void;
  onCreateCheckoutSession: () => Promise<void>;
  isCreatingSession: boolean;
};

export const BalanceView: React.FC<BalanceViewProps> = ({
  data,
  emitEvent,
  onCreateCheckoutSession,
  isCreatingSession
}) => {
  const handleDownloadDocs = (choice: 'yes' | 'no') => {
    emitEvent('balance_docs', { choice });
    
    // If user wants to download, trigger download
    if (choice === 'yes') {
      const link = document.createElement('a');
      link.href = data.docs.balance.url;
      link.download = data.docs.balance.url.split('/').pop() || 'balance.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleContinue = async () => {
    emitEvent('balance_acknowledged');
    // Immediately create checkout session and show Stripe checkout
    await onCreateCheckoutSession();
  };

  return (
    <>
      <PdfLoader
        initialPdfUrl={data.docs.balance.url}
        initialSection="balance"
        emitEvent={emitEvent}
        isPaymentSection={false}
      />
      <div className="mt-6 flex justify-center">
        <GateBar
          section="balance"
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
