import React, { useEffect, useRef, useState } from 'react';
import configJson from '../config/pdfViewer.config.json';
import { dataURLToUint8Array } from '../lib/pdf-utils';
import { GateBar } from './GateBar';
import { format } from 'date-fns';

// PDF.js (ESM, Vite-friendly)
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import 'pdfjs-dist/build/pdf.worker.mjs';

// pdf-lib (ESM)
import { PDFDocument } from 'pdf-lib';

type Section =
  | 'contract'
  | 'invoice'
  | 'payment1'
  | 'completion1'
  | 'balance'
  | 'payment2'
  | 'completion2';

type PdfViewerProps = {
  initialPdfBytes?: ArrayBuffer | null;
  emitEvent?: (name: string, payload?: unknown) => void;
  initialSection?: Section; // Start where returning users land based on state
};

export const PdfViewer: React.FC<PdfViewerProps> = ({
  initialPdfBytes = null,
  emitEvent,
  initialSection = 'contract'
}) => {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const pdfCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [pdfData, setPdfData] = useState<ArrayBuffer | null>(initialPdfBytes);
  const [pdfDoc, setPdfDoc] = useState<any | null>(null);
  const [scale] = useState<number>(configJson.viewer.initialScale);
  const [section, setSection] = useState<Section>(initialSection);
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  useEffect(() => {
    // Set PDF.js worker path (use CDN in production, local in dev)
    GlobalWorkerOptions.workerSrc = 
      import.meta.env.PROD 
        ? 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.mjs'
        : '/node_modules/pdfjs-dist/build/pdf.worker.mjs';
  }, []);

  // Load PDF when initialPdfBytes is provided
  useEffect(() => {
    if (initialPdfBytes) {
      setPdfData(initialPdfBytes);
      openPdfFromBytes(initialPdfBytes).catch((err) => {
        console.error('Failed to load PDF:', err);
        setPdfError('Failed to load PDF document');
      });
    }
  }, [initialPdfBytes]);

  async function renderPage(pageNum: number) {
    if (!pdfDoc) return;
    const page = await pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale });

    const canvas = pdfCanvasRef.current!;
    const pdfCtx = canvas.getContext('2d', { alpha: false })!;

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({ canvasContext: pdfCtx, viewport }).promise;
  }

  async function openPdfFromBytes(bytes: ArrayBuffer) {
    const docTask = getDocument({ data: bytes });
    const doc = await docTask.promise;
    setPdfDoc(doc);
    await renderPage(1);
    emitEvent?.('contract_loaded', { page: 1, totalPages: doc.numPages });
  }

  // Stamp signature at bottom of last page
  async function embedSignature(signatureDataUrl: string) {
    if (!pdfData) return;

    try {
        const loaded = await PDFDocument.load(pdfData as any);
        const pngBytes = dataURLToUint8Array(signatureDataUrl);
        const img = await loaded.embedPng(pngBytes);
        
        // Add to last page
        const pages = loaded.getPages();
        const lastPage = pages[pages.length - 1];
        const { width } = lastPage.getSize();
        
        // Place at bottom right
        const sigWidth = 200;
        const sigHeight = 100;
        
        lastPage.drawImage(img, {
            x: width - sigWidth - 50,
            y: 50,
            width: sigWidth,
            height: sigHeight
        });

        // Add Date
        lastPage.drawText(`Signed: ${format(new Date(), 'yyyy-MM-dd')}`, {
             x: 50,
             y: 70,
             size: 12
        });

        const bytes = await loaded.save();
        
        // Update view with signed PDF
        await openPdfFromBytes(bytes.buffer as any);
        
        // Emit success
        emitEvent?.('contract_signed', { date: format(new Date(), 'yyyy-MM-dd') });
        // NOTE: App.tsx will handle the navigation via optimistic update.
        setSection('invoice');
        
    } catch (e) {
        console.error("Signing failed", e);
        alert("Failed to sign document.");
    }
  }

  // Gate handlers
  // Gate handlers
  function handleSignContract() {
    setIsSignModalOpen(true);
  }

  function handleInvoiceDocs(choice: 'yes' | 'no') {
    emitEvent?.('invoice_docs', { choice });
  }

  function handleBalanceDocs(choice: 'yes' | 'no') {
    emitEvent?.('balance_docs', { choice });
  }

  function continueFromInvoice() {
    emitEvent?.('invoice_acknowledged');
    setSection('payment1'); // moves to payment_1
  }

  function continueFromBalance() {
    emitEvent?.('balance_acknowledged');
    setSection('payment2'); // moves to payment_2
  }

  function pay1() {
    emitEvent?.('payment_1_intent');
    // Your controller should create checkout_session_1 and route to checkout.
  }

  function pay2() {
    emitEvent?.('payment_2_intent');
    // Your controller should create checkout_session_2 and route to checkout.
  }

  // Show error if PDF failed to load
  if (pdfError) {
    return (
      <div className="mx-auto max-w-[1100px] px-4 text-slate-100">
        <div className="mt-4 p-8 text-center text-red-400 bg-red-900/20 rounded-lg border border-red-900/50">
          {pdfError}
        </div>
      </div>
    );
  }

  // Show loading state if PDF not loaded yet
  if (!pdfDoc) {
    return (
      <div className="mx-auto max-w-[1100px] px-4 text-slate-100">
        <div className="mt-4 relative rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl overflow-hidden min-h-[600px]">
          <div className="relative flex items-center justify-center bg-slate-950 p-4 min-h-[600px]">
            <div className="text-slate-400">Loading PDF...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1100px] px-4 text-slate-100">
      <div className="mt-4 relative rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl overflow-hidden min-h-[600px]">
        <div className="relative flex items-center justify-center bg-slate-950 p-4 min-h-[600px]">
          <canvas 
            id="pdfCanvas" 
            ref={pdfCanvasRef} 
            className="shadow-lg max-w-full h-auto" 
            style={{ width: '100%', height: 'auto' }}
          />
        </div>
      </div>

      <div className="mt-6 flex justify-center">
        <GateBar
          section={section}
          onSign={handleSignContract}
          onDownloadDocs={section === 'invoice' ? handleInvoiceDocs : section === 'balance' ? handleBalanceDocs : undefined}
          onContinue={section === 'invoice' ? continueFromInvoice : section === 'balance' ? continueFromBalance : undefined}
          onPay={section === 'payment1' ? pay1 : section === 'payment2' ? pay2 : undefined}
        />
      </div>

      <SignatureModal 
        isOpen={isSignModalOpen} 
        onClose={() => setIsSignModalOpen(false)}
        onSign={(dataUrl) => {
            setIsSignModalOpen(false);
            embedSignature(dataUrl);
        }}
      />
    </div>
  );
};
import { SignatureModal } from './SignatureModal';
