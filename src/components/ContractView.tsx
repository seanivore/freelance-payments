import React from 'react';
import { JobData } from '@/lib/data';
import { PdfLoader } from './PdfLoader';

type ContractViewProps = {
  data: JobData;
  emitEvent: (name: string, payload?: unknown) => void;
};

export const ContractView: React.FC<ContractViewProps> = ({
  data,
  emitEvent
}) => {
  return (
    <PdfLoader
      initialPdfUrl={data.docs.contract.url}
      initialSection="contract"
      emitEvent={emitEvent}
      isPaymentSection={false}
      customerName={data.customer.name}
    />
  );
};
