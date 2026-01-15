import { useEffect, useState, useRef, useCallback } from 'react';
import { fetchJobData, JobData } from '@/lib/data';
import { Loader2 } from 'lucide-react';
import { Complete } from '@/components/Complete';
import { ContractView } from '@/components/ContractView';
import { InvoiceView } from '@/components/InvoiceView';
import { BalanceView } from '@/components/BalanceView';
import { PaymentView } from '@/components/PaymentView';
import { CompletionView } from '@/components/CompletionView';
import { apiUrl } from '@/lib/api';

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
    fetch(apiUrl('/api/track-event'), {
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
            fetch(apiUrl('/api/track-event'), {
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
          fetch(apiUrl(`/api/session-status?session_id=${sessionId}`))
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
      // Note: Checkout session creation is now handled directly in InvoiceView
      // No need to navigate to payment1 section - we show checkout directly
    }
    
    if (name === 'balance_acknowledged') {
      setData(prev => {
        if (!prev) return null;
        return {
          ...prev,
          state: {
            ...prev.state,
            client_status: {
              ...prev.state.client_status,
              balance: new Date().toISOString()
            }
          }
        };
      });
      // Note: Checkout session creation is now handled directly in BalanceView
      // No need to navigate to payment2 section - we show checkout directly
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

  if (client_status.contract_signed) {
    initialSection = 'invoice';
  }
  if (client_status.invoice) {
    initialSection = 'payment1';
  }
  if (client_status.payment_1) {
    initialSection = 'balance';
  }
  if (client_status.balance) {
    initialSection = 'payment2';
  }
  if (client_status.payment_2) {
    initialSection = 'completion2';
  }

  // Re-calculate derived section after potential optimistic update
  if (data.state.client_status.payment_1 && !data.state.client_status.balance) {
       // After payment_1, show completion1 until balance is available
       initialSection = 'completion1';
  }
  if (data.state.client_status.payment_1 && data.state.client_status.balance) {
      initialSection = 'balance';
  }
  if (data.state.client_status.payment_2) {
      initialSection = 'completion2';
  }

  // Check if we're on the complete/return page
  const urlParams = new URLSearchParams(window.location.search);
  const sessionId = urlParams.get('session_id');
  const showCompletePage = !!sessionId;

  // Function to create checkout session
  const createCheckoutSession = async (paymentNumber: 1 | 2) => {
    setIsCreatingSession(true);
    try {
      const jobId = window.location.pathname.substring(1);
      const response = await fetch(apiUrl('/api/create-checkout-session'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_id: jobId,
          price_id: paymentNumber === 1 ? data!.price1.id : data!.price2.id,
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
          <Complete />
        ) : initialSection === 'contract' ? (
          <ContractView 
            data={data}
            emitEvent={emitEvent}
          />
        ) : initialSection === 'invoice' ? (
          clientSecret ? (
            // Show Stripe checkout if session already created
            <PaymentView
              data={data}
              paymentNumber={1}
              onCreateSession={() => createCheckoutSession(1)}
              isCreatingSession={isCreatingSession}
              clientSecret={clientSecret}
            />
          ) : (
            <InvoiceView
              data={data}
              emitEvent={emitEvent}
              onCreateCheckoutSession={() => createCheckoutSession(1)}
              isCreatingSession={isCreatingSession}
            />
          )
        ) : initialSection === 'balance' ? (
          clientSecret ? (
            // Show Stripe checkout if session already created
            <PaymentView
              data={data}
              paymentNumber={2}
              onCreateSession={() => createCheckoutSession(2)}
              isCreatingSession={isCreatingSession}
              clientSecret={clientSecret}
            />
          ) : (
            <BalanceView
              data={data}
              emitEvent={emitEvent}
              onCreateCheckoutSession={() => createCheckoutSession(2)}
              isCreatingSession={isCreatingSession}
            />
          )
        ) : initialSection === 'payment1' || initialSection === 'payment2' ? (
          <PaymentView
            data={data}
            paymentNumber={initialSection === 'payment1' ? 1 : 2}
            onCreateSession={() => createCheckoutSession(initialSection === 'payment1' ? 1 : 2)}
            isCreatingSession={isCreatingSession}
            clientSecret={clientSecret}
          />
        ) : initialSection === 'completion1' || initialSection === 'completion2' ? (
          <CompletionView
            data={data}
            completionType={initialSection === 'completion1' ? 'completion1' : 'completion2'}
          />
        ) : null}
      </main>
    </div>
  );
}
