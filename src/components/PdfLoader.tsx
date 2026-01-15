import React, { useEffect, useState } from 'react';
import { PdfViewer } from './PdfViewer';
import { Loader2 } from 'lucide-react';

type Section =
  | 'contract'
  | 'invoice'
  | 'payment1'
  | 'completion1'
  | 'balance'
  | 'payment2'
  | 'completion2';

type PdfLoaderProps = {
  initialPdfUrl: string;
  initialSection: Section;
  emitEvent: (name: string, payload?: unknown) => void;
  isPaymentSection: boolean;
};

export const PdfLoader: React.FC<PdfLoaderProps> = ({
  initialPdfUrl,
  initialSection,
  emitEvent,
  isPaymentSection
}) => {
  const [pdfBytes, setPdfBytes] = useState<ArrayBuffer | null>(null);
  const [pdfError, setPdfError] = useState(false);

  useEffect(() => {
    if (!initialPdfUrl || isPaymentSection) return;
    
    fetch(initialPdfUrl)
      .then(res => res.arrayBuffer())
      .then(bytes => setPdfBytes(bytes))
      .catch(() => setPdfError(true));
  }, [initialPdfUrl, isPaymentSection]);

  if (pdfError) {
    return <div className="p-8 text-center text-red-400">Failed to load PDF document.</div>;
  }
  
  if (!pdfBytes) {
    return (
      <div className="flex justify-center p-10">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  return (
    <PdfViewer 
      initialPdfBytes={pdfBytes}
      initialSection={initialSection}
      emitEvent={emitEvent}
    />
  );
};
