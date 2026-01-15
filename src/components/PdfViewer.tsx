import React, { useEffect, useRef, useState } from 'react';
import configJson from '../config/pdfViewer.config.json';
import { dataURLToUint8Array } from '../lib/pdf-utils';
import { GateBar } from './GateBar';

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
  pdfUrl?: string; // URL to fetch PDF fresh when needed (for signing)
  emitEvent?: (name: string, payload?: unknown) => void;
  initialSection?: Section; // Start where returning users land based on state
};

export const PdfViewer: React.FC<PdfViewerProps> = ({
  initialPdfBytes = null,
  pdfUrl,
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
  const renderedPagesRef = useRef<Set<number>>(new Set()); // Track which pages have actually been rendered
  // Store a cloned copy of the PDF bytes for signing (to avoid detached buffer issues)
  const pdfBytesForSigningRef = useRef<ArrayBuffer | null>(null);

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
      // Clone the buffer immediately to avoid detached buffer issues later
      const clonedBuffer = initialPdfBytes.slice(0);
      loadedBytesRef.current = initialPdfBytes;
      pdfBytesForSigningRef.current = clonedBuffer; // Store cloned copy for signing
      setPdfData(clonedBuffer);
      setIsLoading(true);
      setPdfError(null);
      hasEmittedLoadedRef.current = false; // Reset emit flag for new PDF
      renderedPagesRef.current.clear(); // Clear rendered pages when loading new PDF
      
      openPdfFromBytes(initialPdfBytes)
        .then(() => {
          setIsLoading(false);
        })
        .catch((err) => {
          console.error('Failed to load PDF:', err);
          setPdfError('Failed to load PDF document');
          setIsLoading(false);
          loadedBytesRef.current = null; // Allow retry
          pdfBytesForSigningRef.current = null;
          hasEmittedLoadedRef.current = false;
        });
    }
  }, [initialPdfBytes]); // Only depend on initialPdfBytes, not isLoading or pdfDoc

  async function renderPage(pageNum: number, canvas: HTMLCanvasElement) {
    if (!pdfDoc || !canvas) {
      console.warn('Cannot render: pdfDoc or canvas not ready', { pdfDoc: !!pdfDoc, canvas: !!canvas });
      return;
    }
    
    try {
      const page = await pdfDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale });
      
      console.log(`Page ${pageNum} viewport:`, { width: viewport.width, height: viewport.height, scale });

      const pdfCtx = canvas.getContext('2d', { alpha: false });
      if (!pdfCtx) {
        console.error('Failed to get 2d context from canvas');
        return;
      }

      // Support HiDPI screens for crisp rendering (prevents pixelation)
      const outputScale = window.devicePixelRatio || 1;
      
      // Set canvas internal size (actual pixels)
      const canvasWidth = Math.floor(viewport.width * outputScale);
      const canvasHeight = Math.floor(viewport.height * outputScale);
      
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      
      console.log(`Canvas ${pageNum} dimensions:`, { 
        internal: { width: canvasWidth, height: canvasHeight },
        display: { width: viewport.width, height: viewport.height },
        outputScale 
      });
      
      // Set canvas display size (CSS pixels)
      canvas.style.width = Math.floor(viewport.width) + 'px';
      canvas.style.height = Math.floor(viewport.height) + 'px';

      // Scale context for high-DPI displays
      const transform = outputScale !== 1
        ? [outputScale, 0, 0, outputScale, 0, 0]
        : null;

      const renderContext = {
        canvasContext: pdfCtx,
        viewport,
        ...(transform && { transform })
      };
      
      console.log(`Starting render for page ${pageNum}...`);
      const renderTask = page.render(renderContext);
      await renderTask.promise;
      console.log(`Page ${pageNum} render completed`);
    } catch (err) {
      console.error(`Error in renderPage for page ${pageNum}:`, err);
      throw err;
    }
  }

  // Render all pages when PDF doc is loaded
  async function renderAllPages() {
    if (!pdfDoc) {
      console.error('renderAllPages: pdfDoc is null');
      return;
    }
    
    const totalPages = pdfDoc.numPages;
    console.log(`renderAllPages: Starting render for ${totalPages} pages`);
    
    // Wait a bit to ensure all canvases are mounted
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Render pages sequentially to avoid overwhelming the browser
    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      const canvas = canvasRefs.current.get(pageNum);
      // Check if canvas exists and is in the DOM
      if (canvas && canvas.isConnected) {
        // Check if this page has actually been rendered (not just canvas exists)
        if (!renderedPagesRef.current.has(pageNum)) {
          try {
            console.log(`Rendering page ${pageNum}...`);
            await renderPage(pageNum, canvas);
            renderedPagesRef.current.add(pageNum); // Mark as rendered
            console.log(`Page ${pageNum} rendered successfully`);
          } catch (err) {
            console.error(`Error rendering page ${pageNum}:`, err);
            setPdfError(`Failed to render page ${pageNum}: ${err}`);
          }
        } else {
          console.log(`Page ${pageNum} already rendered (tracked in renderedPagesRef)`);
        }
      } else {
        console.warn(`Canvas for page ${pageNum} not ready yet`, { 
          exists: !!canvas, 
          connected: canvas?.isConnected 
        });
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
  async function embedSignature(
    signatureDataUrl: string,
    legalName: string,
    signedDate: string
  ) {
    try {
        // Fetch PDF fresh from URL to avoid detached buffer issues
        // This ensures we always have a valid, non-detached buffer
        let pdfBytesToUse: ArrayBuffer;
        
        if (pdfUrl) {
          // Fetch fresh from URL
          const response = await fetch(pdfUrl);
          pdfBytesToUse = await response.arrayBuffer();
        } else if (pdfBytesForSigningRef.current) {
          // Use stored cloned copy if available
          pdfBytesToUse = pdfBytesForSigningRef.current;
        } else if (pdfData) {
          // Fallback: try to clone pdfData (may fail if detached)
          try {
            pdfBytesToUse = pdfData.slice(0);
          } catch (e) {
            throw new Error('PDF buffer is detached. Please refresh the page and try again.');
          }
        } else {
          throw new Error('No PDF data available for signing');
        }
        
        const loaded = await PDFDocument.load(pdfBytesToUse);
        const pngBytes = dataURLToUint8Array(signatureDataUrl);
        const img = await loaded.embedPng(pngBytes);
        
        // Add to last page
        const pages = loaded.getPages();
        const lastPage = pages[pages.length - 1];
        const { width } = lastPage.getSize();
        
        // Place signature at bottom right
        const sigWidth = 200;
        const sigHeight = 100;
        
        lastPage.drawImage(img, {
            x: width - sigWidth - 50,
            y: 50,
            width: sigWidth,
            height: sigHeight
        });

        // Add legal name below signature
        lastPage.drawText(`Signed by: ${legalName}`, {
            x: width - sigWidth - 50,
            y: 30,
            size: 12
        });

        // Add Date
        lastPage.drawText(`Signed: ${signedDate}`, {
             x: 50,
             y: 70,
             size: 12
        });

        const bytes = await loaded.save();
        
        // Update view with signed PDF
        // bytes is a Uint8Array, convert to ArrayBuffer
        // Create a new ArrayBuffer from the Uint8Array to avoid detached buffer issues
        const signedBuffer = bytes.buffer instanceof ArrayBuffer 
          ? bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)
          : new Uint8Array(bytes).buffer;
        
        // Clone the signed buffer and store it for future signing operations
        const clonedSignedBuffer = signedBuffer.slice(0);
        pdfBytesForSigningRef.current = clonedSignedBuffer;
        setPdfData(clonedSignedBuffer);
        
        await openPdfFromBytes(signedBuffer);
        
        // Emit success with name and date
        emitEvent?.('contract_signed', { 
          date: signedDate,
          legalName: legalName
        });
        // NOTE: App.tsx will handle the navigation via optimistic update.
        setSection('invoice');
        
    } catch (e) {
        console.error("Signing failed", e);
        alert("Failed to sign document.");
    }
  }

  // Gate handler for contract section only
  function handleSignContract() {
    setIsSignModalOpen(true);
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

      {/* Only render GateBar for contract section - invoice/balance gates handle their own GateBar */}
      {section === 'contract' && (
        <div className="mt-6 flex justify-center">
          <GateBar
            section={section}
            onSign={handleSignContract}
          />
        </div>
      )}

      <SignatureModal 
        isOpen={isSignModalOpen} 
        onClose={() => setIsSignModalOpen(false)}
        onSign={(dataUrl, legalName, signedDate) => {
            setIsSignModalOpen(false);
            embedSignature(dataUrl, legalName, signedDate);
        }}
      />
    </div>
  );
};
import { SignatureModal } from './SignatureModal';
