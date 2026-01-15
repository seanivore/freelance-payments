import React, { useEffect, useRef, useState } from 'react';
import configJson from '../config/pdfViewer.config.json';
import { dataURLToUint8Array } from '../lib/pdf-utils';
import { GateBar } from './GateBar';
import { format } from 'date-fns';

// PDF.js (ESM, Vite-friendly)
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';

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

  const [pdfData, setPdfData] = useState<ArrayBuffer | null>(initialPdfBytes);
  const [pdfDoc, setPdfDoc] = useState<any | null>(null);
  const [scale] = useState<number>(configJson.viewer.initialScale);
  const [section, setSection] = useState<Section>(initialSection);
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const loadedBytesRef = useRef<ArrayBuffer | null>(null);
  const hasEmittedLoadedRef = useRef(false);
  const canvasRefs = useRef<Map<number, HTMLCanvasElement>>(new Map()); // Store refs for all page canvases

  useEffect(() => {
    // Set PDF.js worker path (use unpkg CDN in production, local in dev)
    // Must be set before any getDocument calls
    // Using unpkg which reliably hosts .mjs files for pdfjs-dist
    if (!GlobalWorkerOptions.workerSrc) {
      GlobalWorkerOptions.workerSrc = 
        import.meta.env.PROD 
          ? 'https://unpkg.com/pdfjs-dist@5.4.530/build/pdf.worker.min.mjs'
          : '/node_modules/pdfjs-dist/build/pdf.worker.mjs';
    }
  }, []);

  // Load PDF when initialPdfBytes is provided (only once per unique bytes)
  useEffect(() => {
    // Prevent infinite loop: only load if bytes changed and not already loaded/loading
    if (initialPdfBytes && initialPdfBytes !== loadedBytesRef.current && !isLoading && !pdfDoc) {
      loadedBytesRef.current = initialPdfBytes;
      setPdfData(initialPdfBytes);
      setIsLoading(true);
      setPdfError(null);
      hasEmittedLoadedRef.current = false; // Reset emit flag for new PDF
      
      openPdfFromBytes(initialPdfBytes)
        .then(() => {
          setIsLoading(false);
        })
        .catch((err) => {
          console.error('Failed to load PDF:', err);
          setPdfError('Failed to load PDF document');
          setIsLoading(false);
          loadedBytesRef.current = null; // Allow retry
          hasEmittedLoadedRef.current = false;
        });
    }
  }, [initialPdfBytes]); // Only depend on initialPdfBytes, not isLoading or pdfDoc

  async function renderPage(pageNum: number, canvas: HTMLCanvasElement) {
    if (!pdfDoc || !canvas) {
      console.warn('Cannot render: pdfDoc or canvas not ready', { pdfDoc: !!pdfDoc, canvas: !!canvas });
      return;
    }
    
    const page = await pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale });

    const pdfCtx = canvas.getContext('2d', { alpha: false });
    if (!pdfCtx) {
      console.error('Failed to get 2d context from canvas');
      return;
    }

    // Support HiDPI screens for crisp rendering (prevents pixelation)
    const outputScale = window.devicePixelRatio || 1;
    
    // Set canvas internal size (actual pixels)
    canvas.width = Math.floor(viewport.width * outputScale);
    canvas.height = Math.floor(viewport.height * outputScale);
    
    // Set canvas display size (CSS pixels)
    canvas.style.width = Math.floor(viewport.width) + 'px';
    canvas.style.height = Math.floor(viewport.height) + 'px';

    // Scale context for high-DPI displays
    const transform = outputScale !== 1
      ? [outputScale, 0, 0, outputScale, 0, 0]
      : null;

    await page.render({ 
      canvasContext: pdfCtx, 
      viewport,
      transform 
    }).promise;
  }

  // Render all pages when PDF doc is loaded
  async function renderAllPages() {
    if (!pdfDoc) return;
    
    const totalPages = pdfDoc.numPages;
    
    // Wait a bit to ensure all canvases are mounted
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Render pages sequentially to avoid overwhelming the browser
    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      const canvas = canvasRefs.current.get(pageNum);
      // Check if canvas exists and is in the DOM
      if (canvas && canvas.isConnected) {
        // Check if canvas hasn't been rendered yet (width === 0 or very small means not rendered)
        if (canvas.width === 0 || canvas.width < 100) {
          try {
            await renderPage(pageNum, canvas);
          } catch (err) {
            console.error(`Error rendering page ${pageNum}:`, err);
          }
        }
      } else {
        console.warn(`Canvas for page ${pageNum} not ready yet`);
      }
    }
  }

  async function openPdfFromBytes(bytes: ArrayBuffer) {
    try {
      const docTask = getDocument({ data: bytes });
      const doc = await docTask.promise;
      setPdfDoc(doc);
      // Don't render here - let useEffect handle rendering when canvas is ready
      // Only emit event once when PDF is first loaded (prevent infinite loop)
      if (!hasEmittedLoadedRef.current) {
        hasEmittedLoadedRef.current = true;
        emitEvent?.('contract_loaded', { page: 1, totalPages: doc.numPages });
      }
    } catch (err) {
      console.error('Error loading PDF:', err);
      throw err;
    }
  }

  // Render all pages when PDF doc is loaded and canvases are ready
  useEffect(() => {
    if (pdfDoc && !isLoading) {
      // Wait for canvases to be mounted - use requestAnimationFrame for better timing
      let frameId: number;
      let retryCount = 0;
      const maxRetries = 20; // Max 2 seconds of retries
      
      const checkAndRender = () => {
        const totalPages = pdfDoc.numPages;
        const readyCanvases = Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter(pageNum => {
            const canvas = canvasRefs.current.get(pageNum);
            return canvas && canvas.isConnected && canvas.parentElement !== null;
          });
        
        // If all canvases are ready, render
        if (readyCanvases.length === totalPages) {
          console.log(`All ${totalPages} canvases ready, starting render...`);
          renderAllPages().catch((err) => {
            console.error('Error rendering PDF pages:', err);
            setPdfError('Failed to render PDF pages');
          });
        } else if (retryCount < maxRetries) {
          // Retry after a short delay
          retryCount++;
          frameId = requestAnimationFrame(() => {
            setTimeout(checkAndRender, 50);
          });
        } else {
          console.warn(`Only ${readyCanvases.length} of ${totalPages} canvases ready after ${maxRetries} retries`);
          // Try rendering anyway with what we have
          renderAllPages().catch((err) => {
            console.error('Error rendering PDF pages:', err);
            setPdfError('Failed to render PDF pages');
          });
        }
      };
      
      // Start checking after a short initial delay
      frameId = requestAnimationFrame(() => {
        setTimeout(checkAndRender, 100);
      });
      
      return () => {
        if (frameId) cancelAnimationFrame(frameId);
      };
    }
  }, [pdfDoc, isLoading, scale]); // Re-render when PDF doc changes, loading completes, or scale changes

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
  if (!pdfDoc || isLoading) {
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

  // Create canvas elements for all pages
  const renderCanvasElements = () => {
    if (!pdfDoc) return null;
    
    const totalPages = pdfDoc.numPages;
    const canvases = [];
    
    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      canvases.push(
        <div key={pageNum} className="flex justify-center mb-4">
          <canvas
            ref={(el) => {
              if (el) {
                canvasRefs.current.set(pageNum, el);
              } else {
                canvasRefs.current.delete(pageNum);
              }
            }}
            className="shadow-lg"
          />
        </div>
      );
    }
    
    return canvases;
  };

  return (
    <div className="mx-auto max-w-[1100px] px-4 text-slate-100">
      <div className="mt-4 relative rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl overflow-auto min-h-[600px] max-h-[90vh]">
        <div className="relative flex flex-col items-center bg-slate-950 p-4">
          {renderCanvasElements()}
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
