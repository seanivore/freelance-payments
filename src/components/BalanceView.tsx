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
