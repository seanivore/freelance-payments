import React, { useEffect, useRef, useState } from 'react';
import configJson from '../config/pdfViewer.config.json';
import { GateBar } from './GateBar';
import { SignatureModal } from './SignatureModal';

// PDF.js (ESM, Vite-friendly)
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';

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
  pdfUrl?: string;
  emitEvent?: (name: string, payload?: unknown) => void;
  initialSection?: Section;
  onConfirm?: () => void;
  onDownload?: () => void;
};

export const PdfViewer: React.FC<PdfViewerProps> = ({
  initialPdfBytes = null,
  pdfUrl,
  emitEvent,
  initialSection = 'contract',
  onConfirm,
  onDownload: onDownloadProp
}) => {
  /* eslint-disable @typescript-eslint/no-explicit-any */

  const [, setPdfData] = useState<ArrayBuffer | null>(initialPdfBytes);
  const [pdfDoc, setPdfDoc] = useState<any | null>(null);
  const [scale] = useState<number>(configJson.viewer.initialScale);
  const [section, setSection] = useState<Section>(initialSection);
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const loadedBytesRef = useRef<ArrayBuffer | null>(null);
  const hasEmittedLoadedRef = useRef(false);
  const canvasRefs = useRef<Map<number, HTMLCanvasElement>>(new Map());
  const renderedPagesRef = useRef<Set<number>>(new Set());
  const pdfBytesForSigningRef = useRef<ArrayBuffer | null>(null);

  useEffect(() => {
    if (!GlobalWorkerOptions.workerSrc) {
      GlobalWorkerOptions.workerSrc = 
        import.meta.env.PROD 
          ? 'https://unpkg.com/pdfjs-dist@5.4.530/build/pdf.worker.min.mjs'
          : '/node_modules/pdfjs-dist/build/pdf.worker.mjs';
    }
  }, []);

  useEffect(() => {
    if (initialPdfBytes && initialPdfBytes !== loadedBytesRef.current && !isLoading && !pdfDoc) {
      const clonedBuffer = initialPdfBytes.slice(0);
      loadedBytesRef.current = initialPdfBytes;
      pdfBytesForSigningRef.current = clonedBuffer;
      setPdfData(clonedBuffer);
      setIsLoading(true);
      setPdfError(null);
      hasEmittedLoadedRef.current = false;
      renderedPagesRef.current.clear();
      
      openPdfFromBytes(initialPdfBytes)
        .then(() => {
          setIsLoading(false);
        })
        .catch((err) => {
          console.error('Failed to load PDF:', err);
          setPdfError('Failed to load PDF document');
          setIsLoading(false);
          loadedBytesRef.current = null;
          pdfBytesForSigningRef.current = null;
          hasEmittedLoadedRef.current = false;
        });
    }
  }, [initialPdfBytes]);

  async function renderPage(pageNum: number, canvas: HTMLCanvasElement) {
    if (!pdfDoc || !canvas) {
      console.warn('Cannot render: pdfDoc or canvas not ready', { pdfDoc: !!pdfDoc, canvas: !!canvas });
      return;
    }
    
    try {
      const page = await pdfDoc.getPage(pageNum);
      
      // Calculate responsive scale based on viewport width
      // Get the container width (account for padding)
      const containerWidth = Math.min(window.innerWidth - 16, 896); // max-w-4xl = 896px, 16px for padding
      const originalViewport = page.getViewport({ scale: 1 });
      
      // Calculate scale to fit width, but don't exceed the configured scale
      const fitWidthScale = containerWidth / originalViewport.width;
      const responsiveScale = Math.min(scale, fitWidthScale);
      
      const viewport = page.getViewport({ scale: responsiveScale });

      const pdfCtx = canvas.getContext('2d', { alpha: false });
      if (!pdfCtx) {
        console.error('Failed to get 2d context from canvas');
        return;
      }

      const outputScale = window.devicePixelRatio || 1;
      const canvasWidth = Math.floor(viewport.width * outputScale);
      const canvasHeight = Math.floor(viewport.height * outputScale);
      
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      canvas.style.width = Math.floor(viewport.width) + 'px';
      canvas.style.height = Math.floor(viewport.height) + 'px';

      const transform = outputScale !== 1
        ? [outputScale, 0, 0, outputScale, 0, 0]
        : null;

      const renderContext = {
        canvasContext: pdfCtx,
        viewport,
        ...(transform && { transform })
      };
      
      const renderTask = page.render(renderContext);
      await renderTask.promise;
    } catch (err) {
      console.error(`Error in renderPage for page ${pageNum}:`, err);
      throw err;
    }
  }

  async function renderAllPages() {
    if (!pdfDoc) {
      console.error('renderAllPages: pdfDoc is null');
      return;
    }
    
    const totalPages = pdfDoc.numPages;
    await new Promise(resolve => setTimeout(resolve, 50));
    
    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      const canvas = canvasRefs.current.get(pageNum);
      if (canvas && canvas.isConnected) {
        if (!renderedPagesRef.current.has(pageNum)) {
          try {
            await renderPage(pageNum, canvas);
            renderedPagesRef.current.add(pageNum);
          } catch (err) {
            console.error(`Error rendering page ${pageNum}:`, err);
            setPdfError(`Failed to render page ${pageNum}: ${err}`);
          }
        }
      }
    }
  }

  async function openPdfFromBytes(bytes: ArrayBuffer) {
    try {
      const docTask = getDocument({ data: bytes });
      const doc = await docTask.promise;
      setPdfDoc(doc);
      if (!hasEmittedLoadedRef.current) {
        hasEmittedLoadedRef.current = true;
        emitEvent?.('contract_loaded', { page: 1, totalPages: doc.numPages });
      }
    } catch (err) {
      console.error('Error loading PDF:', err);
      throw err;
    }
  }

  useEffect(() => {
    if (pdfDoc && !isLoading) {
      let frameId: number;
      let retryCount = 0;
      const maxRetries = 20;
      
      const checkAndRender = () => {
        const totalPages = pdfDoc.numPages;
        const readyCanvases = Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter(pageNum => {
            const canvas = canvasRefs.current.get(pageNum);
            return canvas && canvas.isConnected && canvas.parentElement !== null;
          });
        
        if (readyCanvases.length === totalPages) {
          renderAllPages().catch((err) => {
            console.error('Error rendering PDF pages:', err);
            setPdfError('Failed to render PDF pages');
          });
        } else if (retryCount < maxRetries) {
          retryCount++;
          frameId = requestAnimationFrame(() => {
            setTimeout(checkAndRender, 50);
          });
        } else {
          renderAllPages().catch((err) => {
            console.error('Error rendering PDF pages:', err);
            setPdfError('Failed to render PDF pages');
          });
        }
      };
      
      frameId = requestAnimationFrame(() => {
        setTimeout(checkAndRender, 100);
      });
      
      return () => {
        if (frameId) cancelAnimationFrame(frameId);
      };
    }
  }, [pdfDoc, isLoading, scale]);

  // Handle contract signing (name + date only, no pen canvas)
  function handleSignContract(legalName: string, signedDate: string) {
    // Emit the contract_signed event with legal name and date
    emitEvent?.('contract_signed', { 
      signed_date: signedDate,
      legal_name: legalName
    });
    // Close modal and transition to next section
    setIsSignModalOpen(false);
    setSection('invoice');
  }

  function handleOpenSignModal() {
    setIsSignModalOpen(true);
  }

  // Handle PDF download
  function handleDownload() {
    if (onDownloadProp) {
      onDownloadProp();
    } else if (pdfUrl) {
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = pdfUrl.split('/').pop() || 'document.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  // Show error if PDF failed to load
  if (pdfError) {
    return (
      <div className="relative min-h-[80vh] flex items-center justify-center">
        <div className="p-8 text-center text-red-400 bg-red-900/20 rounded-lg border border-red-900/50 max-w-md">
          <p className="font-medium mb-2">Unable to load document</p>
          <p className="text-sm text-red-400/80">{pdfError}</p>
        </div>
      </div>
    );
  }

  // Show loading state
  if (!pdfDoc || isLoading) {
    return (
      <div className="relative min-h-[80vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-portfolio-accent-mauve border-t-transparent rounded-full animate-spin" />
          <p className="text-portfolio-text-secondary text-sm">Loading document...</p>
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
        <div key={pageNum} className="flex justify-center overflow-hidden">
          <canvas
            ref={(el) => {
              if (el) {
                canvasRefs.current.set(pageNum, el);
              } else {
                canvasRefs.current.delete(pageNum);
              }
            }}
            className="shadow-paper max-w-full h-auto"
            style={{
              backgroundColor: '#faf9f6',
            }}
          />
        </div>
      );
    }
    
    return canvases;
  };

  return (
    <div className="relative min-h-screen">
      {/* Background Art Layer */}
      <div className="fixed inset-0 -z-20">
        <img
          src="/assets/media/pdf-viewer-bg-art-2.webp"
          alt=""
          aria-hidden="true"
          className="w-full h-full object-cover"
        />
        {/* Base overlay */}
        <div 
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to bottom, rgba(15, 15, 15, 0.5) 0%, rgba(15, 15, 15, 0.3) 50%, rgba(15, 15, 15, 0.5) 100%)',
          }}
        />
      </div>

      {/* Left margin vignette */}
      <div
        className="fixed inset-y-0 left-0 w-24 md:w-32 lg:w-48 pointer-events-none -z-10"
        style={{
          background: 'linear-gradient(to right, rgba(15, 15, 15, 0.9) 0%, rgba(15, 15, 15, 0.7) 40%, transparent 100%)',
        }}
      />

      {/* Right margin vignette */}
      <div
        className="fixed inset-y-0 right-0 w-24 md:w-32 lg:w-48 pointer-events-none -z-10"
        style={{
          background: 'linear-gradient(to left, rgba(15, 15, 15, 0.9) 0%, rgba(15, 15, 15, 0.7) 40%, transparent 100%)',
        }}
      />

      {/* GateBar at top */}
      <div className="sticky top-0 z-20">
        <GateBar
          section={section}
          onSign={handleOpenSignModal}
          onConfirm={onConfirm}
          onDownload={handleDownload}
        />
      </div>

      {/* PDF Content Area */}
      <div className="relative z-0 py-6 px-2 sm:px-4">
        <div className="max-w-4xl mx-auto w-full overflow-hidden">
          <div className="flex flex-col gap-4">
            {renderCanvasElements()}
          </div>
        </div>
      </div>

      {/* Signature Modal */}
      <SignatureModal 
        isOpen={isSignModalOpen} 
        onClose={() => setIsSignModalOpen(false)}
        onSign={handleSignContract}
      />
    </div>
  );
};
