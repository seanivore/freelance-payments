import React from 'react';
import { JobData } from '@/lib/data';
import { PdfLoader } from './PdfLoader';
import { GateBar } from './GateBar';

type BalanceViewProps = {
  data: JobData;
  emitEvent: (name: string, payload?: unknown) => void;
};

export const BalanceView: React.FC<BalanceViewProps> = ({
  data,
  emitEvent
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

  const handleContinue = () => {
    emitEvent('balance_acknowledged');
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
      </div>
    </>
  );
};
