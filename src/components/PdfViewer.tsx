// filename: src/components/PdfViewer.tsx
import React, { useEffect, useRef, useState } from 'react';
import configJson from '../config/pdfViewer.config.json';
import { clamp, dataURLToUint8Array, Stroke, renderStrokes } from '../lib/pdf-utils';
import { PenCanvas } from './PenCanvas';
import { Toolbar } from './Toolbar';
import { GateBar } from './GateBar';
import { DatePicker } from './DatePicker';
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
  const pdfCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [pdfData, setPdfData] = useState<ArrayBuffer | null>(initialPdfBytes);
  const [pdfDoc, setPdfDoc] = useState<any | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [scale, setScale] = useState<number>(configJson.viewer.initialScale);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [flattenedPdfBytes, setFlattenedPdfBytes] = useState<Uint8Array | null>(null);
  const [statusText, setStatusText] = useState<string>('Load a PDF to begin.');
  const [penActive, setPenActive] = useState<boolean>(configJson.pen.enabledByDefault);
  const [penColor, setPenColor] = useState<string>(configJson.pen.defaultColor);
  const [penWidth, setPenWidth] = useState<number>(configJson.pen.defaultWidth);
  const [date, setDate] = useState<Date | null>(null);
  const [section, setSection] = useState<Section>(initialSection);

  useEffect(() => {
    GlobalWorkerOptions.workerSrc = '/node_modules/pdfjs-dist/build/pdf.worker.mjs';
  }, []);

  async function renderPage(pageNum: number) {
    if (!pdfDoc) return;
    const page = await pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale });

    const canvas = pdfCanvasRef.current!;
    const pdfCtx = canvas.getContext('2d', { alpha: false })!;

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({ canvasContext: pdfCtx, viewport }).promise;
    setStatusText('PDF loaded. Use the pen to draw, then Flatten to embed.');
  }

  async function openPdfFromBytes(bytes: ArrayBuffer) {
    const docTask = getDocument({ data: bytes });
    const doc = await docTask.promise;
    setPdfDoc(doc);
    setTotalPages(doc.numPages);
    setCurrentPage(1);
    await renderPage(1);
    emitEvent?.('contract_loaded', { page: 1, totalPages: doc.numPages });
  }

  function onFilePick(file: File | null) {
    if (!file) return;
    setStatusText('Loading PDF…');
    file.arrayBuffer().then(async (bytes) => {
      setPdfData(bytes);
      await openPdfFromBytes(bytes);
    });
  }

  async function gotoPrev() {
    if (!pdfDoc) return;
    const next = clamp(currentPage - 1, 1, totalPages);
    setCurrentPage(next);
    await renderPage(next);
    emitEvent?.('page_changed', { page: next });
  }

  async function gotoNext() {
    if (!pdfDoc) return;
    const next = clamp(currentPage + 1, 1, totalPages);
    setCurrentPage(next);
    await renderPage(next);
    emitEvent?.('page_changed', { page: next });
  }

  function clearPageStrokes() {
    setStrokes((prev) => prev.filter((s) => s.page !== currentPage));
    renderPage(currentPage);
    setStatusText('Cleared strokes for this page.');
    emitEvent?.('strokes_cleared', { page: currentPage });
  }

  async function flattenToPdf() {
    if (!pdfData) return setStatusText('Please load a PDF first.');
    setStatusText('Flattening strokes into PDF…');

    const loaded = await PDFDocument.load(pdfData);

    const byPage = new Map<number, Stroke[]>();
    for (const s of strokes) {
      const arr = byPage.get(s.page) || [];
      arr.push(s);
      byPage.set(s.page, arr);
    }

    for (const [pageNum, strokesForPage] of byPage.entries()) {
      const page = loaded.getPage(pageNum - 1);
      const { width, height } = page.getSize();

      const off = document.createElement('canvas');
      const canvas = pdfCanvasRef.current!;
      off.width = canvas.width;
      off.height = canvas.height;
      const offCtx = off.getContext('2d')!;
      offCtx.clearRect(0, 0, off.width, off.height);

      renderStrokes(offCtx, strokesForPage, 1);

      const dataUrl = off.toDataURL('image/png');
      const pngBytes = dataURLToUint8Array(dataUrl);
      const img = await loaded.embedPng(pngBytes);
      page.drawImage(img, { x: 0, y: 0, width, height });
    }

    const bytes = await loaded.save();
    setFlattenedPdfBytes(bytes);
    setStatusText('Flattened. Click Download to save the new PDF.');
    emitEvent?.('document_flattened');
  }

  function downloadPdf() {
    const bytes = flattenedPdfBytes || pdfData;
    if (!bytes) return setStatusText('No PDF to download. Load a file first.');
    const blob = new Blob([bytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = configJson.ui.defaultDownloadName;
    a.click();
    URL.revokeObjectURL(url);
    emitEvent?.('document_downloaded');
  }

  // Zoom (Cmd/Ctrl + wheel)
  useEffect(() => {
    function onWheel(e: WheelEvent) {
      if (!pdfDoc) return;
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      const next = clamp(scale + delta, configJson.viewer.minScale, configJson.viewer.maxScale);
      setScale(next);
      renderPage(currentPage);
      setStatusText(`Scale: ${next.toFixed(2)}`);
      emitEvent?.('scale_changed', { scale: next });
    }
    window.addEventListener('wheel', onWheel, { passive: false });
    return () => window.removeEventListener('wheel', onWheel);
  }, [pdfDoc, scale, currentPage]);

  // Canvas size proxy for pen overlay
  const canvasSize = {
    width: pdfCanvasRef.current?.width || 0,
    height: pdfCanvasRef.current?.height || 0
  };

  const pageInfo = `Page ${currentPage} / ${totalPages}`;

  // Gate handlers following your overview
  function handleSignContract() {
    emitEvent?.('contract_signed', { date: date ? format(date, 'yyyy-MM-dd') : null });
    setSection('invoice');
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

  return (
    <div className="mx-auto max-w-[1100px] px-4 text-slate-100">
      <Toolbar
        pageInfo={pageInfo}
        statusText={statusText}
        onFilePick={onFilePick}
        onPrev={gotoPrev}
        onNext={gotoNext}
        penActive={penActive}
        setPenActive={setPenActive}
        penColor={penColor}
        setPenColor={setPenColor}
        penWidth={penWidth}
        setPenWidth={setPenWidth}
        onClearPageStrokes={clearPageStrokes}
        onFlatten={flattenToPdf}
        onDownload={downloadPdf}
        openSettings={() => emitEvent?.('settings_open')}
        branding={configJson.ui.brandingBadge}
        rightSlot={
          <div className="flex items-center gap-2">
            <DatePicker date={date} onChange={(d) => { setDate(d); emitEvent?.('sign_date_set', { date: d ? format(d, 'yyyy-MM-dd') : null }); }} />
          </div>
        }
      />

      <div className="mt-4 relative rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl">
        <div className="relative flex items-center justify-center bg-[radial-gradient(600px_200px_at_20%_-50px,rgba(110,231,183,.08),transparent_60%),radial-gradient(600px_200px_at_80%_-50px,rgba(147,197,253,.08),transparent_60%),#0c0f16]">
          <canvas id="pdfCanvas" ref={pdfCanvasRef} />
          <PenCanvas
            active={penActive}
            color={penColor}
            width={penWidth}
            scale={scale}
            page={currentPage}
            strokes={strokes}
            setStrokes={setStrokes}
            canvasSize={canvasSize}
          />
        </div>
      </div>

      <div className="mt-3">
        <GateBar
          section={section}
          onSign={handleSignContract}
          onDownloadDocs={section === 'invoice' ? handleInvoiceDocs : section === 'balance' ? handleBalanceDocs : undefined}
          onContinue={section === 'invoice' ? continueFromInvoice : section === 'balance' ? continueFromBalance : undefined}
          onPay={section === 'payment1' ? pay1 : section === 'payment2' ? pay2 : undefined}
        />
      </div>
    </div>
  );
};
