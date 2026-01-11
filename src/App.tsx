import { useEffect, useState, useRef } from 'react';
import { fetchJobData, JobData } from '@/lib/data';
import { PdfViewer } from '@/components/PdfViewer';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [data, setData] = useState<JobData | null>(null);
  const [loading, setLoading] = useState(true);
  
  // --- Event Tracking State ---
  const [eventBuffer, setEventBuffer] = useState<any[]>([]);
  const INACTIVITY_LIMIT = 10 * 60 * 1000; // 10 minutes
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  // Refs for closure access
  const eventBufferRef = useRef<any[]>([]);
  
  // Sync ref
  useEffect(() => {
    eventBufferRef.current = eventBuffer;
  }, [eventBuffer]);

  // Initial Data Fetch
  useEffect(() => {
    fetchJobData().then((job) => {
      setData(job);
      setLoading(false);
      // Track initial login
      if (job && !job.state.client_status.logged_in) {
          trackEvent('logged_in'); 
      }
    });
  }, []);

  // --- Inactivity Logic ---
  const flushEvents = () => {
    const currentBuffer = eventBufferRef.current;
    if (currentBuffer.length === 0) return;
    
    const jobId = window.location.pathname.substring(1); // Robustness needed?
    if (!jobId || jobId === '/') return;

    // Send batch to API
    fetch('/api/track-event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        job_id: jobId,
        event_type: 'batch',
        event_data: currentBuffer
      })
    })
    .then(response => {
        if (!response.ok) {
            // If 405 or 404, we are likely on a static host without API support.
            if (response.status === 405 || response.status === 404) {
                console.warn("Event tracking skipped: Backend API not available on static host.");
            } else {
                console.error("Event tracking failed:", response.statusText);
            }
        }
    })
    .catch(console.error);

    setEventBuffer([]); // clear state
    eventBufferRef.current = []; // clear ref immediate
  };

  const trackEvent = (type: string, payload: any = {}) => {
    const timestamp = new Date().toISOString();
    const newEvent = { type, timestamp, data: payload };
    
    setEventBuffer(prev => [...prev, newEvent]);
    resetTimer();
  };

  const resetTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      flushEvents();
    }, INACTIVITY_LIMIT);
  };

  // Activity Listeners
  useEffect(() => {
    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    const handleActivity = () => resetTimer();
    
    activityEvents.forEach(e => window.addEventListener(e, handleActivity));
    
    // Visibility/Unload
    const handleUnload = () => {
         if (eventBufferRef.current.length > 0) {
             const jobId = window.location.pathname.substring(1);
             const payload = JSON.stringify({
                 job_id: jobId,
                 event_type: 'batch',
                 event_data: eventBufferRef.current
             });
             // Use fetch with keepalive as beacon fallback or primary
             fetch('/api/track-event', {
                 method: 'POST',
                 headers: { 'Content-Type': 'application/json' },
                 body: payload,
                 keepalive: true
             }).catch(() => {
                 // Ignore unload errors
             });
         }
    };
    
    // Combine unload and visibilitychange
    window.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') handleUnload();
    });
    // For page close
    window.addEventListener('pagehide', handleUnload);

    // Start timer initially
    resetTimer();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      activityEvents.forEach(e => window.removeEventListener(e, handleActivity));
      window.removeEventListener('pagehide', handleUnload);
    };
  }, []);

  // --- Display Logic ---
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950 text-slate-100">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950 text-slate-100">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Job Not Found</h1>
          <p className="text-slate-400">Please check the link and try again.</p>
        </div>
      </div>
    );
  }

  // Safety check for schema
  if (!data.docs || !data.state) {
      return (
          <div className="flex items-center justify-center min-h-screen bg-slate-950 text-slate-100">
             <div className="text-center p-8 bg-slate-900 rounded-lg border border-red-900/50">
                <h1 className="text-xl font-bold text-red-500 mb-2">Invalid Job Data</h1>
                <p className="text-slate-400 text-sm">The job data appears to be corrupted or incomplete.</p>
                <div className="mt-4 text-xs font-mono text-slate-500 text-left bg-black/50 p-2 rounded">
                    Missing: {!data.docs ? 'docs ' : ''} {!data.state ? 'state' : ''}
                </div>
             </div>
          </div>
      );
  }

  const { client_status } = data.state;
  let initialSection: 'contract' | 'invoice' | 'payment1' | 'completion1' | 'balance' | 'payment2' | 'completion2' = 'contract';
  let initialPdfUrl = data.docs.contract.url;

  if (client_status.contract_signed) {
    initialSection = 'invoice';
    initialPdfUrl = data.docs.invoice.url;
  }
  if (client_status.invoice) {
    initialSection = 'payment1';
  }
  if (client_status.payment_1) {
    initialSection = 'balance';
    initialPdfUrl = data.docs.balance.url;
  }
  if (client_status.balance) {
    initialSection = 'payment2';
    initialPdfUrl = data.docs.balance.url;
  }
  if (client_status.payment_2) {
    initialSection = 'completion2';
    initialPdfUrl = data.docs.balance.url;
  }

  // --- Handle Stripe Return (Optimistic) ---
  useEffect(() => {
      if (window.location.hash === '#completion') {
          // Determine which payment was made based on current loaded state
          // If we have invoice but no payment_1 -> Payment 1 completed
          // If we have balance but no payment_2 -> Payment 2 completed
          // We update local state to show the success message immediately.

          setData(prev => {
             if (!prev) return null;
             const s = prev.state.client_status;
             let updates = {};
             
             if (s.invoice && !s.payment_1) {
                 updates = { payment_1: new Date().toISOString() };
                 // Move to balance
                 initialSection = 'balance'; // This local var won't trigger re-render of this component's logic flow directly unless we force it, 
                 // but changing 'data' triggers re-render.
             } else if (s.balance && !s.payment_2) {
                 updates = { payment_2: new Date().toISOString() };
             }
             
             if (Object.keys(updates).length > 0) {
                 return {
                     ...prev,
                     state: {
                         ...prev.state,
                         client_status: {
                             ...prev.state.client_status,
                             ...updates
                         }
                     }
                 };
             }
             return prev;
          });
          
          // Clear hash to prevent reloading loop issues? 
          // Actually keeping it is fine, or replaceState.
          window.history.replaceState(null, '', window.location.pathname);
          alert("Payment successfully processed! Updating view...");
      }
  }, [data?.state.client_status]); // Depend on loaded data to know where we are

  // Re-calculate derived section after potential optimistic update
  if (data?.state.client_status.payment_1 && !data.state.client_status.balance) {
       // Logic hole: If payment 1 is done, we usually wait for admin to send Balance? 
       // Or does system auto-generate?
       // user-exit-events says "batch processing".
       // If we just mock Payment 1, do we show "Balance" section or "Completion1"?
       // GateBar says: if section === 'completion1'
       initialSection = 'completion1';
       // We don't have balance doc yet if it's manual.
       initialPdfUrl = data.docs.invoice.url; // Fallback
  }
  if (data?.state.client_status.payment_1 && data.state.client_status.balance) {
      initialSection = 'balance';
      initialPdfUrl = data.docs.balance.url;
  }
  if (data?.state.client_status.payment_2) {
      initialSection = 'completion2';
      initialPdfUrl = data.docs.balance.url;
  }

  const isPaymentSection = initialSection === 'payment1' || initialSection === 'payment2';
  
  // PDF Loading
  const PdfLoader = () => {
      const [pdfBytes, setPdfBytes] = useState<ArrayBuffer | null>(null);
      const [pdfError, setPdfError] = useState(false);

      useEffect(() => {
        if (!initialPdfUrl || isPaymentSection) return; // Don't load PDF for payment section if unrelated? 
        // Actually user wants to see Invoice during Payment 1 probably. 
        // But for "Payment 1", the UI should prompt to pay.
        // Let's stick to the "Viewer handles it" unless it's pure checkout.
        
        fetch(initialPdfUrl)
          .then(res => res.arrayBuffer())
          .then(bytes => setPdfBytes(bytes))
          .catch(() => setPdfError(true));
      }, [initialPdfUrl]);

      if (pdfError) return <div className="p-8 text-center text-red-400">Failed to load PDF document.</div>;
      if (!pdfBytes) return <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>;

      return (
        <PdfViewer 
            initialPdfBytes={pdfBytes}
            initialSection={initialSection}
            emitEvent={(name, payload) => {
                console.log('Event:', name, payload);
                trackEvent(name === 'sign' ? 'contract_signed' : name, payload);
                
                if (name === 'contract_signed') {
                     // Optimistic Update: Unlock next stage locally
                     setData(prev => {
                         if (!prev) return null;
                         return {
                             ...prev,
                             state: {
                                 ...prev.state,
                                 client_status: {
                                     ...prev.state.client_status,
                                     contract_signed: new Date().toISOString()
                                 }
                             }
                         };
                     });
                     // Force re-render will pick up new initialSection and fetch new PDF
                }
                
                if (name === 'invoice_acknowledged') {
                     setData(prev => {
                         if (!prev) return null;
                         return {
                             ...prev,
                             state: {
                                 ...prev.state,
                                 client_status: {
                                     ...prev.state.client_status,
                                     invoice: new Date().toISOString()
                                 }
                             }
                         };
                     });
                }
            }}
        />
      );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500/30">
      <header className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50 backdrop-blur-sm fixed top-0 w-full z-10">
        <div className="font-bold text-lg tracking-tight text-white">{data.customer.name}</div>
        <div className="text-sm text-slate-400">{data.project}</div>
      </header>
      
      <main className="pt-20 pb-10">
        { !isPaymentSection ? (
            <PdfLoader />
        ) : (
            <div className="flex flex-col items-center justify-center p-10 mt-10">
                <div className="max-w-md w-full bg-slate-900 p-8 rounded-lg border border-slate-800 shadow-xl">
                    <h2 className="text-2xl font-bold mb-6 text-center text-white">
                        {initialSection === 'payment1' ? 'First Payment' : 'Final Balance'}
                    </h2>
                    
                    <div className="mb-8 space-y-4">
                        <div className="flex justify-between border-b border-slate-700 pb-2">
                            <span className="text-slate-400">Invoice</span>
                            <span className="font-mono">{initialSection === 'payment1' ? data.docs.invoice.url.split('/').pop() : data.docs.balance.url.split('/').pop()}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-slate-400">Amount Due</span>
                            <span className="text-3xl font-bold text-emerald-400">
                                ${(initialSection === 'payment1' ? data.product.price1.amount : data.product.price2.amount) / 100}
                            </span>
                        </div>
                    </div>

                    <button 
                        className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold py-4 rounded-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-emerald-500/20 flex items-center justify-center gap-2"
                        onClick={() => {
                            const link = initialSection === 'payment1' ? data.links?.payment_1 : data.links?.payment_2;
                            if (link) {
                                window.location.href = link;
                            } else {
                                alert("Payment link not ready. Please contact support.");
                            }
                        }}
                    >
                        Process Secure Payment
                    </button>
                    
                    <p className="mt-4 text-xs text-center text-slate-500">
                        Payments processed securely by Stripe. No card data is stored on this server.
                    </p>
                </div>
            </div>
        )}
      </main>
    </div>
  );
}
