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
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = data.docs.contract.url;
    link.download = data.docs.contract.url.split('/').pop() || 'contract.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <PdfLoader
      initialPdfUrl={data.docs.contract.url}
      initialSection="contract"
      emitEvent={emitEvent}
      isPaymentSection={false}
      onDownload={handleDownload}
    />
  );
};
