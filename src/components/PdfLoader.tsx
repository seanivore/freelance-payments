import React, { useEffect, useState } from 'react';
import { PdfViewer } from './PdfViewer';

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
  onConfirm?: () => void;
  onDownload?: () => void;
};

export const PdfLoader: React.FC<PdfLoaderProps> = ({
  initialPdfUrl,
  initialSection,
  emitEvent,
  isPaymentSection,
  onConfirm,
  onDownload
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
    return (
      <div className="min-h-screen flex items-center justify-center bg-portfolio-bg-primary p-4">
        <div className="text-center max-w-md p-6 bg-portfolio-bg-dark rounded-xl border border-red-500/30">
          <p className="text-red-400">Failed to load document. Please refresh and try again.</p>
        </div>
      </div>
    );
  }
  
  if (!pdfBytes) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-portfolio-bg-primary">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-portfolio-accent-mauve border-t-transparent rounded-full animate-spin" />
          <p className="text-portfolio-text-secondary text-sm">Loading document...</p>
        </div>
      </div>
    );
  }

  return (
    <PdfViewer 
      initialPdfBytes={pdfBytes}
      pdfUrl={initialPdfUrl}
      initialSection={initialSection}
      emitEvent={emitEvent}
      onConfirm={onConfirm}
      onDownload={onDownload}
    />
  );
};
