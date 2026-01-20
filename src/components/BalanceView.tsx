import React from 'react';
import { JobData } from '@/lib/data';
import { PdfLoader } from './PdfLoader';

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
  const handleConfirm = async () => {
    emitEvent('balance_acknowledged');
    await onCreateCheckoutSession();
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = data.docs.balance.url;
    link.download = data.docs.balance.url.split('/').pop() || 'balance.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Show loading state while creating checkout session
  if (isCreatingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-portfolio-bg-primary">
        <div className="flex flex-col items-center gap-4 animate-fade-in-up">
          <div className="w-12 h-12 border-4 border-portfolio-accent-mauve border-t-transparent rounded-full animate-spin" />
          <p className="text-portfolio-text-secondary text-sm">Preparing checkout...</p>
        </div>
      </div>
    );
  }

  return (
    <PdfLoader
      initialPdfUrl={data.docs.balance.url}
      initialSection="balance"
      emitEvent={emitEvent}
      isPaymentSection={false}
      onConfirm={handleConfirm}
      onDownload={handleDownload}
    />
  );
};
