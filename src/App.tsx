import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { fetchJobData, JobData } from '@/lib/data';
import { PdfLoader } from '@/components/PdfLoader';
import { Loader2 } from 'lucide-react';
import { CheckoutProvider } from '@stripe/react-stripe-js/checkout';
import { stripePromise } from '@/lib/stripe';
import { CheckoutForm } from '@/components/CheckoutForm';
import { Complete } from '@/components/Complete';

export default function App() {
  const [data, setData] = useState<JobData | null>(null);
  const [loading, setLoading] = useState(true);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  
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
      // Track initial login (only if job found and not already logged in)
      if (job && !job.state.client_status.logged_in) {
          trackEvent('logged_in'); 
      }
    }).catch((err) => {
      console.error('Failed to fetch job data:', err);
      setLoading(false);
      setData(null);
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

  const trackEvent = useCallback((type: string, payload: any = {}) => {
    const timestamp = new Date().toISOString();
    const newEvent = { type, timestamp, data: payload };
    
    setEventBuffer(prev => [...prev, newEvent]);
    resetTimer();
  }, []); // Empty deps: uses state setters and refs which are stable

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

  // --- Handle Stripe Return (Check for session_id query param) ---
  // MUST be before early returns to avoid React hook order error
  useEffect(() => {
      if (!data) return; // Early return inside hook is fine
      
      // Check for session_id in URL (from Stripe return redirect)
      const urlParams = new URLSearchParams(window.location.search);
      const sessionId = urlParams.get('session_id');
      
      if (sessionId) {
          // Fetch session status to verify payment completion
          fetch(`/api/session-status?session_id=${sessionId}`)
              .then(res => res.json())
              .then(sessionData => {
                  if (sessionData.status === 'complete') {
                      const s = data.state.client_status;
                      let updates: Partial<typeof s> = {};
                      
                      // Determine which payment based on current state
                      if (s.invoice && !s.payment_1) {
                          updates = { payment_1: new Date().toISOString() };
                          trackEvent('payment_1');
                      } else if (s.balance && !s.payment_2) {
                          updates = { payment_2: new Date().toISOString() };
                          trackEvent('payment_2');
                      }
                      
                      if (Object.keys(updates).length > 0) {
                          setData(prev => {
                             if (!prev) return null;
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
                          });
                      }
                      
                      // Clear query param to prevent reload loops
                      window.history.replaceState(null, '', window.location.pathname);
                  }
              })
              .catch(err => {
                  console.error('Error fetching session status:', err);
              });
      }
  }, [data?.state.client_status, trackEvent]); // Depend on loaded data and trackEvent

  // Memoized emitEvent callback to prevent PdfViewer re-renders
  // MUST be before early returns to avoid React hook order error
  const emitEvent = useCallback((name: string, payload?: unknown) => {
    // Only log contract_loaded, don't trigger state updates (prevents infinite loop)
    if (name === 'contract_loaded') {
      console.log('Event:', name, payload);
      trackEvent('contract_loaded', payload);
      return; // Don't update state for load events
    }
    
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
  }, [trackEvent]); // trackEvent is memoized, setData is stable

  // --- Display Logic ---
  // All hooks must be called before any early returns
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

  // Re-calculate derived section after potential optimistic update
  if (data.state.client_status.payment_1 && !data.state.client_status.balance) {
       // After payment_1, show completion1 until balance is available
       initialSection = 'completion1';
       initialPdfUrl = data.docs.invoice.url; // Fallback
  }
  if (data.state.client_status.payment_1 && data.state.client_status.balance) {
      initialSection = 'balance';
      initialPdfUrl = data.docs.balance.url;
  }
  if (data.state.client_status.payment_2) {
      initialSection = 'completion2';
      initialPdfUrl = data.docs.balance.url;
  }

  const isPaymentSection = initialSection === 'payment1' || initialSection === 'payment2';
  
  // Check if we're on the complete/return page
  const urlParams = new URLSearchParams(window.location.search);
  const sessionId = urlParams.get('session_id');
  const showCompletePage = !!sessionId;

  // Create checkout session promise for CheckoutProvider
  const checkoutSessionPromise = useMemo(() => {
    if (!clientSecret) return null;
    return Promise.resolve(clientSecret);
  }, [clientSecret]);

  // Function to create checkout session
  const createCheckoutSession = async (paymentNumber: 1 | 2) => {
    setIsCreatingSession(true);
    try {
      const jobId = window.location.pathname.substring(1);
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_id: jobId,
          price_id: paymentNumber === 1 ? data!.product.price1.id : data!.product.price2.id,
          coupon_id: paymentNumber === 1 ? data!.state.objects?.coupon : undefined,
          customer_id: data!.customer.id,
          payment_number: paymentNumber
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const session = await response.json();
      if (session.client_secret) {
        setClientSecret(session.client_secret);
      } else {
        throw new Error('No client_secret in response');
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      alert('Failed to start checkout. Please try again.');
    } finally {
      setIsCreatingSession(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500/30">
      <header className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50 backdrop-blur-sm fixed top-0 w-full z-10">
        <div className="font-bold text-lg tracking-tight text-white">{data.customer.name}</div>
        <div className="text-sm text-slate-400">{data.project}</div>
      </header>
      
      <main className="pt-20 pb-10">
        {showCompletePage ? (
          // Show Complete component when session_id is in URL
          <Complete />
        ) : !isPaymentSection ? (
          // Show PDF viewer for non-payment sections
          <PdfLoader 
            initialPdfUrl={initialPdfUrl}
            initialSection={initialSection}
            emitEvent={emitEvent}
            isPaymentSection={isPaymentSection}
          />
        ) : clientSecret ? (
          // Show CheckoutForm when clientSecret is available
          <CheckoutProvider
            stripe={stripePromise}
            options={{
              clientSecret: checkoutSessionPromise!,
              elementsOptions: {
                appearance: {
                  theme: 'stripe'
                }
              }
            }}
          >
            <CheckoutForm />
          </CheckoutProvider>
        ) : (
          // Show payment initiation UI
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
                    ${(initialSection === 'payment1' ? data.product.price1.unit_amount : data.product.price2.unit_amount) / 100}
                  </span>
                </div>
              </div>

              <button 
                className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-600 disabled:cursor-not-allowed text-slate-900 font-bold py-4 rounded-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-emerald-500/20 flex items-center justify-center gap-2"
                onClick={() => createCheckoutSession(initialSection === 'payment1' ? 1 : 2)}
                disabled={isCreatingSession}
              >
                {isCreatingSession ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Starting checkout...
                  </>
                ) : (
                  'Continue to Checkout'
                )}
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
