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
    }).catch(console.error);

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
             if (navigator.sendBeacon) {
                 navigator.sendBeacon('/api/track-event', payload);
             } else {
                 fetch('/api/track-event', {
                     method: 'POST',
                     headers: { 'Content-Type': 'application/json' },
                     body: payload,
                     keepalive: true
                 }).catch(console.error);
             }
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
  let initialSection: 'contract' | 'invoice' | 'payment1' | 'balance' | 'payment2' | 'completion2' = 'contract';
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
                
                // UX: If signed, ideally we reload or update state to show Invoice.
                // Since this is a static site + JSON DB, the DB update is async (Github Action).
                // We MUST rely on local optimistic UI updates if we want instant feedback.
                // But for now, user might have to refresh after a while.
                // OR we accept that the "Next Step" is unlocked locally in memory?
                if (name === 'sign') {
                     alert("Contract Signed! Please wait a moment for the system to process or refresh the page.");
                     window.location.reload(); 
                     // Reloading will re-fetch JSON. If Github Action hasn't run, it will still show Contract.
                     // This is the downside of the architecture.
                     // FluxGate *requires* the JSON to change.
                     // We can mock the change locally in 'data'.
                }
            }}
        />
      );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500/30">
      <header className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50 backdrop-blur-sm fixed top-0 w-full z-10">
        <div className="font-bold text-lg tracking-tight">Freepay <span className="text-emerald-400">Secure</span></div>
        <div className="text-sm text-slate-400">{data.client.name} • {data.project.name}</div>
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
                            // Create session
                            const btn = document.activeElement as HTMLButtonElement;
                            if(btn) btn.disabled = true;
                            
                            fetch('/api/create-checkout-session', {
                                method: 'POST',
                                headers: {'Content-Type': 'application/json'},
                                body: JSON.stringify({
                                    job_id: window.location.pathname.substring(1),
                                    price_id: initialSection === 'payment1' ? data.product.price1.id : data.product.price2.id,
                                    payment_number: initialSection === 'payment1' ? 1 : 2
                                })
                            })
                            .then(r => r.json())
                            .then(session => {
                                if(session.url) window.location.href = session.url;
                                else {
                                    alert("Error creating payment session");
                                    if(btn) btn.disabled = false;
                                }
                            })
                            .catch(e => {
                                console.error(e);
                                alert("Connection error");
                                if(btn) btn.disabled = false;
                            });
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
