import React from 'react';
import { JobData } from '@/lib/data';
import { PdfLoader } from './PdfLoader';

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
  const handleConfirm = async () => {
    emitEvent('invoice_acknowledged');
    await onCreateCheckoutSession();
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

  // Calculate payment1_due = max(0, price1.unit_amount - coupon.amount_off)
  // This matches the {{payment1_due}} placeholder calculation in admin_push.py
  const payment1Due = Math.max(0, data.price1.unit_amount - (data.coupon?.amount_off || 0));

  return (
    <PdfLoader
      initialPdfUrl={data.docs.invoice.url}
      initialSection="invoice"
      emitEvent={emitEvent}
      isPaymentSection={false}
      onConfirm={handleConfirm}
      paymentAmount={payment1Due}
    />
  );
};
