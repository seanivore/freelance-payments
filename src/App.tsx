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
  const processedSessionRef = useRef<string | null>(null); // Track processed sessions to prevent infinite loops

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
  const [sessionStatus, setSessionStatus] = useState<'complete' | 'open' | null>(null);
  const [sessionPaymentNumber, setSessionPaymentNumber] = useState<1 | 2 | null>(null);
  const [forcedSection, setForcedSection] = useState<'balance' | null>(null); // Force navigation to balance from completion1
  
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
  // CRITICAL FIX: Check session status immediately (Stripe best practice)
  // Handle both 'complete' (success) and 'open' (failed/canceled) statuses
  useEffect(() => {
    if (!sessionId || !data) return; // Wait for both session_id and data
    
    // CRITICAL FIX: Prevent infinite loop - only process each session once
    if (processedSessionRef.current === sessionId) {
      console.log('⏭️  Session already processed, skipping...');
      return;
    }
    
    // Mark this session as being processed
    processedSessionRef.current = sessionId;
    
    // Fetch session status immediately (Stripe best practice)
    fetch(apiUrl(`/api/session-status?session_id=${sessionId}`))
      .then(res => res.json())
      .then(sessionData => {
        console.log('📋 Session status:', sessionData.status, sessionData);
        
        // Set session status for routing logic
        setSessionStatus(sessionData.status as 'complete' | 'open');
        
        // Extract payment_number from metadata
        const paymentNumber = sessionData.metadata?.payment_number 
          ? parseInt(sessionData.metadata.payment_number, 10) as 1 | 2
          : null;
        setSessionPaymentNumber(paymentNumber);
        
        if (sessionData.status === 'complete') {
          const s = data.state.client_status;
          
          // CRITICAL FIX: Check if payment already recorded before processing
          const payment1AlreadyRecorded = !!s.payment_1;
          const payment2AlreadyRecorded = !!s.payment_2;
          
          let paymentType: 'payment_1' | 'payment_2' | null = null;
          let updates: Partial<typeof s> = {};
          
          // Determine which payment from metadata (preferred) or fallback to state
          // Only process if not already recorded
          if (paymentNumber === 1 && !payment1AlreadyRecorded) {
            paymentType = 'payment_1';
            const timestamp = new Date().toISOString();
            updates = { payment_1: timestamp };
            console.log('✅ Payment 1 completed - adding to event buffer');
          } else if (paymentNumber === 2 && !payment2AlreadyRecorded) {
            paymentType = 'payment_2';
            const timestamp = new Date().toISOString();
            updates = { payment_2: timestamp };
            console.log('✅ Payment 2 completed - adding to event buffer');
          } else if (!paymentNumber) {
            // Fallback: determine from state if metadata missing
            if (s.invoice && !payment1AlreadyRecorded) {
              paymentType = 'payment_1';
              const timestamp = new Date().toISOString();
              updates = { payment_1: timestamp };
              console.log('✅ Payment 1 completed (fallback) - adding to event buffer');
            } else if (s.balance && !payment2AlreadyRecorded) {
              paymentType = 'payment_2';
              const timestamp = new Date().toISOString();
              updates = { payment_2: timestamp };
              console.log('✅ Payment 2 completed (fallback) - adding to event buffer');
            }
          }
          
          if (paymentType && Object.keys(updates).length > 0) {
            // CRITICAL: Add payment event to buffer (this is a new page load, so buffer is empty)
            // Then flush immediately to ensure it's sent
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
            
            // Flush payment event immediately (it's the only event in buffer on new page load)
            console.log('📤 Flushing payment event immediately...');
            flushOnPayment();
          } else {
            console.log('⚠️ Session complete but no updates needed (payment already recorded or cannot determine payment number)');
          }
        } else if (sessionData.status === 'open') {
          console.log('⚠️ Session status is "open" - payment failed or was canceled. Will remount checkout.');
        }
      })
      .catch(err => {
        console.error('Error fetching session status:', err);
        // Reset processed flag on error so we can retry
        processedSessionRef.current = null;
      });
  }, [sessionId, data?.state?.client_status?.payment_1, data?.state?.client_status?.payment_2, flushOnPayment, trackEvent]);

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

  // CRITICAL FIX: Check for forced section first (e.g., button click from completion1)
  if (forcedSection) {
    initialSection = forcedSection;
    console.log(`📍 Routing: Forced section → ${forcedSection}`);
  }
  // CRITICAL FIX: Check session status first (Stripe best practice)
  // Handle both 'complete' (success) and 'open' (failed/canceled) statuses
  else if (sessionId && sessionStatus) {
    if (sessionStatus === 'complete') {
      // Payment succeeded - route to completion view based on payment_number
      if (sessionPaymentNumber === 1) {
        initialSection = 'completion1';
        console.log('📍 Routing: Session complete, payment_1 → completion1');
      } else if (sessionPaymentNumber === 2) {
        initialSection = 'completion2';
        console.log('📍 Routing: Session complete, payment_2 → completion2');
      } else {
        // Fallback: determine from state if metadata missing
        if (client_status.invoice && !client_status.payment_1) {
          initialSection = 'completion1';
          console.log('📍 Routing: Session complete, fallback to payment_1 → completion1');
        } else if (client_status.balance && !client_status.payment_2) {
          initialSection = 'completion2';
          console.log('📍 Routing: Session complete, fallback to payment_2 → completion2');
        }
      }
    } else if (sessionStatus === 'open') {
      // Payment failed or canceled - remount checkout (show payment form again)
      if (sessionPaymentNumber === 1 || (client_status.invoice && !client_status.payment_1)) {
        initialSection = 'payment1';
        console.log('📍 Routing: Session open (failed/canceled), payment_1 → remount checkout');
      } else if (sessionPaymentNumber === 2 || (client_status.balance && !client_status.payment_2)) {
        initialSection = 'payment2';
        console.log('📍 Routing: Session open (failed/canceled), payment_2 → remount checkout');
      }
    }
  }

  // State-based routing (only if no session status to handle)
  // Check conditions in order of progression through the flow
  // Each condition should only apply if we haven't already determined section from session status
  if (initialSection === 'contract') {
    // 1. Contract signed → show invoice
    if (client_status.contract_signed && !client_status.invoice) {
      initialSection = 'invoice';
      console.log('📍 Routing: contract_signed → invoice');
    }
    // 2. Invoice viewed → show payment1
    else if (client_status.invoice && !client_status.payment_1) {
      initialSection = 'payment1';
      console.log('📍 Routing: invoice viewed → payment1');
    }
    // 3. Payment 1 completed → show balance (completion1 only shows once after payment via sessionId)
    // CRITICAL FIX: completion1 should only show ONCE right after payment_1 completes (when sessionId exists)
    // Returning users with payment_1 done should go straight to balance
    else if (client_status.payment_1) {
      // Check if balance is available (price2 exists)
      const balanceAvailable = !!(data.price2?.id);
      
      if (balanceAvailable) {
        // Balance is available - route to balance
        initialSection = 'balance';
        console.log('📍 Routing: payment_1 completed + balance available → balance');
      } else {
        // No balance (single payment) - show completion1 only if JUST completed (has sessionId)
        // Otherwise, if returning user, show completion2 (all done)
        if (sessionId && sessionStatus === 'complete' && sessionPaymentNumber === 1) {
          initialSection = 'completion1';
          console.log('📍 Routing: payment_1 JUST completed (sessionId present) → completion1');
        } else {
          // Returning user, no balance - all payments done
          initialSection = 'completion2';
          console.log('📍 Routing: payment_1 completed, no balance, returning user → completion2');
        }
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
  }
  
  console.log(`✅ Final routing decision: ${initialSection}`);

  // Function to create checkout session
  const createCheckoutSession = async (paymentNumber: 1 | 2) => {
    setIsCreatingSession(true);
    try {
      const jobId = window.location.pathname.substring(1);
      
      // CRITICAL FIX for BUG_01_015: Add explicit payment completion parameter to return URL
      // This allows routing to completion page even when JSON state is null (workflow hasn't run yet)
      // Format: ?session_id={CHECKOUT_SESSION_ID} (payment_number determined from session metadata)
      const returnUrl = `${window.location.origin}/${jobId}?session_id={CHECKOUT_SESSION_ID}`;
      
      // CRITICAL FIX for BUG_01_016: Track payment event BEFORE redirect happens
      // Add payment event to buffer now so it's included in the batch when events flush
      trackEvent(`payment_${paymentNumber}` as 'payment_1' | 'payment_2', {
        payment_number: paymentNumber,
        session_id: 'pending' // Will be updated when session is created
      });
      console.log(`📝 Payment ${paymentNumber} event added to buffer before checkout session creation`);
      
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
        // CRITICAL FIX for BUG_01_016: Update payment event in buffer with actual session_id
        // Find the payment event we just added and update it with real session_id
        const paymentEventIndex = eventBufferRef.current.findIndex(
          e => e.type === `payment_${paymentNumber}` && e.data.session_id === 'pending'
        );
        if (paymentEventIndex !== -1) {
          eventBufferRef.current[paymentEventIndex].data.session_id = session.session_id;
          console.log(`✅ Updated payment event in buffer with session_id: ${session.session_id}`);
        } else {
          // If event wasn't found (shouldn't happen), add it now
          console.warn('⚠️ Payment event not found in buffer, adding now');
          trackEvent(`payment_${paymentNumber}` as 'payment_1' | 'payment_2', {
            payment_number: paymentNumber,
            session_id: session.session_id
          });
        }
        
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
            onNavigateToBalance={() => {
              // Force navigation to balance section
              setForcedSection('balance');
              // Clear forced section after a moment to allow normal routing
              setTimeout(() => setForcedSection(null), 100);
            }}
          />
        ) : null}
      </main>
    </div>
  );
}
