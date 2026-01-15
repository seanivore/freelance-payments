import React from 'react';
import { JobData } from '@/lib/data';
import { PdfLoader } from './PdfLoader';
import { GateBar } from './GateBar';

type InvoiceViewProps = {
  data: JobData;
  emitEvent: (name: string, payload?: unknown) => void;
};

export const InvoiceView: React.FC<InvoiceViewProps> = ({
  data,
  emitEvent
}) => {
  const handleDownloadDocs = (choice: 'yes' | 'no') => {
    emitEvent('invoice_docs', { choice });
  };

  const handleContinue = () => {
    emitEvent('invoice_acknowledged');
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
      </div>
    </>
  );
};
