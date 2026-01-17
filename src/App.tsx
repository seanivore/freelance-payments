import { useEffect, useState, useRef, useCallback } from 'react';
import { fetchJobData, JobData } from '@/lib/data';
import { Loader2 } from 'lucide-react';
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
  // Use ref only (not state) to avoid re-renders
  const eventBufferRef = useRef<Array<{type: string; timestamp: string; data: any}>>([]);
  const INACTIVITY_LIMIT = 10 * 60 * 1000; // 10 minutes
  const timerRef = useRef<NodeJS.Timeout | null>(null);

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

  // --- Event Buffering Logic ---
  // Flush events as single batch - memoized to prevent dependency issues
  // Use ref to track if flush is in progress to prevent multiple simultaneous flushes
  const isFlushingRef = useRef(false);
  
  const flushEvents = useCallback(async () => {
    // Prevent multiple simultaneous flushes
    if (isFlushingRef.current) {
      console.log('Flush already in progress, skipping...');
      return;
    }
    
    const buffer = eventBufferRef.current;
    if (buffer.length === 0) return;
    
    const jobId = window.location.pathname.substring(1);
    if (!jobId || jobId === '/') return;

    // Mark as flushing and create a copy of the buffer
    isFlushingRef.current = true;
    const eventsToSend = [...buffer]; // Copy buffer before clearing
    eventBufferRef.current = []; // Clear buffer immediately to prevent duplicate sends

    // Send ALL events as single batch
    try {
      const response = await fetch(apiUrl('/api/track-event'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_id: jobId,
          event_type: 'batch',
          event_data: eventsToSend // Use copied array
        })
      });

      if (!response.ok) {
        if (response.status === 405 || response.status === 404) {
          console.warn("Event tracking skipped: Backend API not available on static host.");
        } else {
          console.error("Event tracking failed:", response.statusText);
        }
      } else {
        console.log(`✅ Flushed ${eventsToSend.length} event(s) to API`);
      }
    } catch (error) {
      console.error("Event tracking error:", error);
    } finally {
      isFlushingRef.current = false; // Reset flushing flag
    }
  }, []); // No dependencies - uses refs which are stable

  // Reset inactivity timer - memoized to prevent dependency issues
  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      flushEvents();
    }, INACTIVITY_LIMIT);
  }, [flushEvents]); // Depends on flushEvents which is memoized

  // Track event (adds to buffer, resets timer)
  const trackEvent = useCallback((type: string, data: any = {}) => {
    eventBufferRef.current.push({
      type,
      timestamp: new Date().toISOString(),
      data
    });
    resetTimer(); // Reset 10min inactivity timer
  }, [resetTimer]); // Depends on resetTimer which is memoized

  // Immediate flush on payment completion
  const flushOnPayment = useCallback(() => {
    flushEvents();
  }, [flushEvents]); // Depends on flushEvents which is memoized

  // Activity Listeners & Unload Handler
  useEffect(() => {
    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    const handleActivity = () => resetTimer();
    
    activityEvents.forEach(e => window.addEventListener(e, handleActivity));
    
    // Flush events on page unload/beforeunload
    // Use a flag to prevent multiple unload handlers from firing
    let unloadHandled = false;
    const handleUnload = () => {
      if (unloadHandled) return; // Prevent multiple calls
      if (eventBufferRef.current.length === 0) return;
      
      unloadHandled = true;
      const jobId = window.location.pathname.substring(1);
      if (jobId && jobId !== '/') {
        const eventsToSend = [...eventBufferRef.current]; // Copy buffer
        // Use fetch with keepalive for reliable unload sending
        fetch(apiUrl('/api/track-event'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            job_id: jobId,
            event_type: 'batch',
            event_data: eventsToSend
          }),
          keepalive: true
        }).catch(() => {
          // Ignore unload errors - events will be lost but that's acceptable
        });
      }
    };
    
    // Flush on visibility change (tab switch, minimize) - only once
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && !unloadHandled) {
        handleUnload();
      }
    };
    
    window.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Flush on page hide (navigation, close)
    window.addEventListener('pagehide', handleUnload);
    
    // Flush on beforeunload (browser close) - note: beforeunload fires before pagehide
    window.addEventListener('beforeunload', handleUnload);

    // Start timer initially
    resetTimer();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      activityEvents.forEach(e => window.removeEventListener(e, handleActivity));
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handleUnload);
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, [resetTimer]); // Add resetTimer to dependencies since it's now memoized

  // --- Handle Stripe Return (Check for session_id query param) ---
  // MUST be before early returns to avoid React hook order error
  // Check for session_id BEFORE determining gate - update state optimistically
  const [sessionId, setSessionId] = useState<string | null>(null);
  
  // Effect 1: Detect session_id on mount (runs once, before data loads)
  useEffect(() => {
    // Check for session_id in URL (from Stripe return redirect)
    // Read from URL before any navigation/clearing happens
    // Also check sessionStorage as backup (set by 404.html)
    const urlParams = new URLSearchParams(window.location.search);
    let sid = urlParams.get('session_id');
    
    // Fallback to sessionStorage if not in URL (backup from 404.html)
    if (!sid) {
      sid = sessionStorage.getItem('stripe_session_id');
      if (sid) {
        sessionStorage.removeItem('stripe_session_id'); // Clean up after reading
      }
    }
    
    if (sid) {
      console.log('Detected session_id:', sid, urlParams.get('session_id') ? '(from URL)' : '(from sessionStorage)');
      setSessionId(sid);
      
      // Clear query param from URL bar to prevent reload loops, but keep it in state
      // Use replaceState to avoid adding to history
      window.history.replaceState(null, '', window.location.pathname);
    } else {
      console.log('No session_id found in URL or sessionStorage');
    }
  }, []); // Run once on mount
  
  // Effect 2: Process session_id when data becomes available
  // CRITICAL FIX for BUG_01_012: Include payment event in frontend batch instead of webhook triggering separate workflow
  useEffect(() => {
    if (!sessionId || !data) return; // Wait for both session_id and data
    
    // Fetch session status and update state if payment completed
    fetch(apiUrl(`/api/session-status?session_id=${sessionId}`))
      .then(res => res.json())
      .then(sessionData => {
        if (sessionData.status === 'complete') {
          const s = data.state.client_status;
          let paymentType: 'payment_1' | 'payment_2' | null = null;
          let updates: Partial<typeof s> = {};
          
          // Determine which payment based on current state
          if (s.invoice && !s.payment_1) {
            paymentType = 'payment_1';
            const timestamp = new Date().toISOString();
            updates = { payment_1: timestamp };
            console.log('✅ Payment 1 completed - adding to event batch');
          } else if (s.balance && !s.payment_2) {
            paymentType = 'payment_2';
            const timestamp = new Date().toISOString();
            updates = { payment_2: timestamp };
            console.log('✅ Payment 2 completed - adding to event batch');
          }
          
          if (paymentType && Object.keys(updates).length > 0) {
            // CRITICAL: Add payment event to buffer BEFORE flushing
            // This ensures payment event is included in the same batch as other events
            trackEvent(paymentType, {
              payment_number: paymentType === 'payment_1' ? 1 : 2,
              session_id: sessionId
            });
            
            // Update local state optimistically
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
            
            // Flush ALL events (including payment) as single batch
            // This ensures all events from the session are processed together
            console.log('📤 Flushing all events including payment event...');
            flushOnPayment();
          } else {
            console.log('⚠️ Session complete but no updates needed (payment already recorded?)');
          }
        } else {
          console.log('⚠️ Session status not complete:', sessionData.status);
        }
      })
      .catch(err => {
        console.error('Error fetching session status:', err);
      });
  }, [sessionId, data, flushOnPayment, trackEvent]); // Added trackEvent dependency

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
    
    // Map event names to correct types
    let eventType = name;
    if (name === 'sign') {
      eventType = 'contract_signed';
    } else if (name === 'invoice_acknowledged') {
      eventType = 'invoice';
    } else if (name === 'balance_acknowledged') {
      eventType = 'balance';
    }
    
    trackEvent(eventType, payload);
    
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

  // CRITICAL FIX for BUG_01_011: Ensure client_status exists and has expected structure
  if (!data.state.client_status) {
    console.error('❌ Missing client_status in state:', data.state);
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950 text-slate-100">
        <div className="text-center p-8 bg-slate-900 rounded-lg border border-red-900/50">
          <h1 className="text-xl font-bold text-red-500 mb-2">Invalid Job State</h1>
          <p className="text-slate-400 text-sm">The job state structure is missing client_status.</p>
        </div>
      </div>
    );
  }

  const { client_status } = data.state;
  
  // CRITICAL FIX for BUG_01_011: Comprehensive logging to debug state routing
  console.log('🔍 State Management Debug:', {
    sessionId: sessionId || 'none',
    client_status: {
      logged_in: client_status.logged_in || null,
      contract_signed: client_status.contract_signed || null,
      invoice: client_status.invoice || null,
      payment_1: client_status.payment_1 || null,
      balance: client_status.balance || null,
      payment_2: client_status.payment_2 || null
    }
  });
  
  let initialSection: 'contract' | 'invoice' | 'payment1' | 'completion1' | 'balance' | 'payment2' | 'completion2' = 'contract';

  // CRITICAL FIX for BUG_01_009: If we have a sessionId, we're returning from Stripe
  // Check if we're in a state where payment just completed but isn't recorded yet
  // This handles the race condition where workflow hasn't run yet
  if (sessionId) {
    // If invoice was viewed but payment_1 not recorded, assume payment_1 just completed
    if (client_status.invoice && !client_status.payment_1) {
      initialSection = 'completion1';
      console.log('📍 Routing: sessionId detected + invoice viewed → completion1 (payment_1 pending workflow)');
    }
    // If balance was viewed but payment_2 not recorded, assume payment_2 just completed
    else if (client_status.balance && !client_status.payment_2) {
      initialSection = 'completion2';
      console.log('📍 Routing: sessionId detected + balance viewed → completion2 (payment_2 pending workflow)');
    }
  }

  // CRITICAL FIX for BUG_01_011: State-based routing with proper precedence
  // Check conditions in order of progression through the flow
  // Each condition should only apply if we haven't progressed further
  
  // 1. Contract signed → show invoice
  if (client_status.contract_signed && !client_status.invoice) {
    initialSection = 'invoice';
    console.log('📍 Routing: contract_signed → invoice');
  }
  // 2. Invoice viewed → show payment1 (unless returning from payment)
  else if (client_status.invoice && !client_status.payment_1 && !sessionId) {
    initialSection = 'payment1';
    console.log('📍 Routing: invoice viewed → payment1');
  }
  // 3. Payment 1 completed → show completion1 or balance
  else if (client_status.payment_1) {
    if (!client_status.balance) {
      initialSection = 'completion1';
      console.log('📍 Routing: payment_1 completed → completion1 (balance not available)');
    } else {
      initialSection = 'balance';
      console.log('📍 Routing: payment_1 completed + balance available → balance');
    }
  }
  // 4. Balance viewed → show payment2
  else if (client_status.balance && !client_status.payment_2) {
    initialSection = 'payment2';
    console.log('📍 Routing: balance viewed → payment2');
  }
  // 5. Payment 2 completed → show completion2
  else if (client_status.payment_2) {
    initialSection = 'completion2';
    console.log('📍 Routing: payment_2 completed → completion2');
  }
  // 6. Default: contract (only if no progress made)
  else {
    console.log('📍 Routing: no progress detected → contract (default)');
  }
  
  console.log(`✅ Final routing decision: ${initialSection}`);

  // Function to create checkout session
  const createCheckoutSession = async (paymentNumber: 1 | 2) => {
    setIsCreatingSession(true);
    try {
      const jobId = window.location.pathname.substring(1);
      // Explicit return URL with session_id template variable
      const returnUrl = `${window.location.origin}/${jobId}?session_id={CHECKOUT_SESSION_ID}`;
      
      const response = await fetch(apiUrl('/api/create-checkout-session'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_id: jobId,
          price_id: paymentNumber === 1 ? data!.price1.id : data!.price2.id,
          coupon_id: paymentNumber === 1 ? data!.state.objects?.coupon : undefined,
          customer_id: data!.customer.id,
          payment_number: paymentNumber,
          return_url: returnUrl
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
        {initialSection === 'contract' ? (
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
