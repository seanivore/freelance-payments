import { useEffect, useState, useRef, useCallback } from 'react';
import { fetchJobData, JobData } from '@/lib/data';
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
  // Note: We NO LONGER persist to sessionStorage during render.
  // The sessionStorage persistence was causing performance issues.
  // Back-button navigation will lose buffered events, but this is acceptable
  // since events are flushed on page exit anyway.
  
  const eventBufferRef = useRef<Array<{type: string; timestamp: string; data: any}>>([]);
  const INACTIVITY_LIMIT = 10 * 60 * 1000; // 10 minutes
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const processedSessionRef = useRef<string | null>(null);
  const loggedInQueuedRef = useRef(false);
  // Track client_status for deduplication (updated when data changes)
  const clientStatusRef = useRef<JobData['state']['client_status'] | null>(null);
  // Track events that have been queued/sent in this session to prevent duplicates
  const sentEventsRef = useRef<Set<string>>(new Set());

  // Keep clientStatusRef in sync with data for event deduplication
  useEffect(() => {
    if (data?.state?.client_status) {
      clientStatusRef.current = data.state.client_status;
    }
  }, [data?.state?.client_status]);

  // Initial Data Fetch
  useEffect(() => {
    fetchJobData().then((job) => {
      setData(job);
      setLoading(false);
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
  const isFlushingRef = useRef(false);
  
  const hashPayload = (payload: string) => {
    let hash = 0;
    for (let i = 0; i < payload.length; i += 1) {
      hash = ((hash << 5) - hash) + payload.charCodeAt(i);
      hash |= 0;
    }
    return `${hash}`;
  };

  const shouldSkipFlush = (events: Array<{type: string; timestamp: string; data: any}>) => {
    try {
      const payload = JSON.stringify(events);
      const hash = hashPayload(payload);
      const now = Date.now();
      const last = sessionStorage.getItem('event_flush_last');
      if (last) {
        const parsed = JSON.parse(last);
        if (parsed.hash === hash && now - parsed.at < 30000) {
          return true;
        }
      }
      sessionStorage.setItem('event_flush_last', JSON.stringify({ hash, at: now }));
      return false;
    } catch {
      return false;
    }
  };

  const sendEvents = useCallback(async (events: Array<{type: string; timestamp: string; data: any}>, useBeacon = false) => {
    if (events.length === 0) return;
    if (shouldSkipFlush(events)) return;

    const jobId = window.location.pathname.substring(1);
    if (!jobId || jobId === '/') return;

    const payload = JSON.stringify({
      job_id: jobId,
      event_type: 'batch',
      event_data: events
    });

    // Use sendBeacon for unload scenarios - it's more reliable than fetch with keepalive
    // because it survives page unload. We use text/plain to avoid CORS preflight.
    if (useBeacon && navigator.sendBeacon) {
      // Use text/plain to avoid CORS preflight - server parses JSON from body
      const blob = new Blob([payload], { type: 'text/plain' });
      const sent = navigator.sendBeacon(apiUrl('/api/track-event'), blob);
      if (!sent) {
        console.warn('sendBeacon failed, falling back to fetch');
        // Fall through to fetch
      } else {
        return; // Successfully queued via beacon
      }
    }

    // Regular fetch for non-unload scenarios or beacon fallback
    const response = await fetch(apiUrl('/api/track-event'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      keepalive: useBeacon // Use keepalive as fallback for beacon
    });

    if (!response.ok) {
      if (response.status === 405 || response.status === 404) {
        console.warn("Event tracking skipped: Backend API not available on static host.");
      } else {
        console.error("Event tracking failed:", response.statusText);
      }
    }
  }, []);

  const flushEvents = useCallback(async () => {
    if (isFlushingRef.current) return;
    
    const buffer = eventBufferRef.current;
    if (buffer.length === 0) return;

    isFlushingRef.current = true;
    const eventsToSend = [...buffer];
    eventBufferRef.current = [];

    try {
      await sendEvents(eventsToSend);
    } catch (error) {
      console.error("Event tracking error:", error);
    } finally {
      isFlushingRef.current = false;
    }
  }, [sendEvents]);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      flushEvents();
    }, INACTIVITY_LIMIT);
  }, [flushEvents]);

  const trackEvent = useCallback((type: string, eventData: any = {}) => {
    // Check if event was already queued/sent in this session
    if (sentEventsRef.current.has(type)) {
      return;
    }
    
    // Check if event is already recorded in client_status (skip if already processed)
    const status = clientStatusRef.current;
    if (status) {
      // Map event types to client_status keys
      const statusKeyMap: Record<string, keyof typeof status> = {
        'logged_in': 'logged_in',
        'contract_signed': 'contract_signed',
        'invoice': 'invoice',
        'payment_1': 'payment_1',
        'balance': 'balance',
        'payment_2': 'payment_2'
      };
      const statusKey = statusKeyMap[type];
      if (statusKey && status[statusKey]) {
        // Already recorded in JSON, skip
        return;
      }
    }
    
    // Additional guard for logged_in (session-level dedup)
    if (type === 'logged_in') {
      if (loggedInQueuedRef.current) return;
      loggedInQueuedRef.current = true;
    }
    
    // Mark this event as sent for this session
    sentEventsRef.current.add(type);
    
    eventBufferRef.current.push({
      type,
      timestamp: new Date().toISOString(),
      data: eventData
    });
    resetTimer();
  }, [resetTimer]);

  // Single-batch policy: only flush on inactivity/unload to avoid split sessions.

  // Activity Listeners & Unload Handler
  useEffect(() => {
    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    const handleActivity = () => resetTimer();
    
    activityEvents.forEach(e => window.addEventListener(e, handleActivity));
    
    // BUG_06_00_002 FIX: Use flush cooldown instead of boolean flag
    // On iOS Safari, opening a PDF in a new tab fires pagehide on the original page.
    // Using a timestamp-based cooldown prevents rapid consecutive flushes when
    // tab-switching for PDF viewing, while still allowing eventual flushing.
    // Events aren't lost - they stay in buffer until next flush opportunity.
    let lastFlushTimestamp = 0;
    const FLUSH_COOLDOWN_MS = 3000; // 3 second cooldown between flushes

    const handleUnload = () => {
      // Skip if we just flushed recently (prevents rapid tab-switch flushes)
      if (Date.now() - lastFlushTimestamp < FLUSH_COOLDOWN_MS) return;
      if (eventBufferRef.current.length === 0) return;

      lastFlushTimestamp = Date.now();
      const jobId = window.location.pathname.substring(1);
      if (jobId && jobId !== '/') {
        const eventsToSend = [...eventBufferRef.current];
        // Clear buffer immediately to prevent double-sends
        eventBufferRef.current = [];
        sendEvents(eventsToSend, true).catch(() => {});
      }
    };

    // NOTE: We intentionally do NOT flush on visibilitychange anymore.
    // visibilitychange fires too aggressively (slow page loads, tab switches, etc.)
    // and was causing events to flush individually instead of batched.
    // We rely on pagehide/beforeunload for actual page exits.

    // Handle back button / popstate - flush events so they're not lost
    const handlePopState = () => {
      if (eventBufferRef.current.length === 0) return;
      const eventsToSend = [...eventBufferRef.current];
      eventBufferRef.current = [];
      // Use sendBeacon for reliability during navigation
      sendEvents(eventsToSend, true).catch(() => {});
    };

    // Only listen for actual page unload events, not visibility changes
    window.addEventListener('pagehide', handleUnload);
    window.addEventListener('beforeunload', handleUnload);
    window.addEventListener('popstate', handlePopState);

    resetTimer();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      activityEvents.forEach(e => window.removeEventListener(e, handleActivity));
      window.removeEventListener('pagehide', handleUnload);
      window.removeEventListener('beforeunload', handleUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [resetTimer, sendEvents]);

  // --- Handle Stripe Return ---
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionStatus, setSessionStatus] = useState<'complete' | 'open' | null>(null);
  const [sessionPaymentNumber, setSessionPaymentNumber] = useState<1 | 2 | null>(null);
  
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    let sid = urlParams.get('session_id');
    
    if (!sid) {
      sid = sessionStorage.getItem('stripe_session_id');
      if (sid) {
        sessionStorage.removeItem('stripe_session_id');
      }
    }
    
    if (sid) {
      setSessionId(sid);
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);
  
  useEffect(() => {
    if (!sessionId || !data) return;
    
    if (processedSessionRef.current === sessionId) {
      return;
    }
    
    processedSessionRef.current = sessionId;
    
    fetch(apiUrl(`/api/session-status?session_id=${sessionId}`))
      .then(res => res.json())
      .then(sessionData => {
        console.log('📊 Session status response:', sessionData);

        // BUG_06_00_003 FIX: CRITICAL - Validate session belongs to THIS job
        // A stale session_id from a different job could cause incorrect payment recording
        const currentJobId = window.location.pathname.substring(1);
        const sessionJobId = sessionData.metadata?.job_id;

        if (sessionJobId && sessionJobId !== currentJobId) {
          console.warn('⚠️ Session job_id mismatch! Session is for', sessionJobId, 'but current job is', currentJobId);
          console.warn('⚠️ Ignoring stale session to prevent incorrect payment recording');
          // Clear the session state to prevent routing issues
          setSessionId(null);
          setSessionStatus(null);
          setSessionPaymentNumber(null);
          return;
        }

        setSessionStatus(sessionData.status as 'complete' | 'open');

        const paymentNumber = sessionData.metadata?.payment_number
          ? parseInt(sessionData.metadata.payment_number, 10) as 1 | 2
          : null;
        console.log('📊 Parsed paymentNumber:', paymentNumber);
        setSessionPaymentNumber(paymentNumber);
        
        if (sessionData.status === 'complete') {
          const s = data.state.client_status;
          console.log('📊 client_status:', s);
          
          const payment1AlreadyRecorded = !!s.payment_1;
          const payment2AlreadyRecorded = !!s.payment_2;
          console.log('📊 payment1AlreadyRecorded:', payment1AlreadyRecorded, 'payment2AlreadyRecorded:', payment2AlreadyRecorded);
          
          let paymentType: 'payment_1' | 'payment_2' | null = null;
          let updates: Partial<typeof s> = {};
          
          if (paymentNumber === 1 && !payment1AlreadyRecorded) {
            paymentType = 'payment_1';
            const timestamp = new Date().toISOString();
            updates = { payment_1: timestamp };
          } else if (paymentNumber === 2 && !payment2AlreadyRecorded) {
            paymentType = 'payment_2';
            const timestamp = new Date().toISOString();
            updates = { payment_2: timestamp };
          } else if (!paymentNumber) {
            console.log('📊 paymentNumber is null, checking fallback conditions');
            if (s.invoice && !payment1AlreadyRecorded) {
              paymentType = 'payment_1';
              const timestamp = new Date().toISOString();
              updates = { payment_1: timestamp };
            } else if (s.balance && !payment2AlreadyRecorded) {
              paymentType = 'payment_2';
              const timestamp = new Date().toISOString();
              updates = { payment_2: timestamp };
            }
          }
          
          console.log('📊 paymentType:', paymentType, 'updates:', updates);
          
          if (paymentType && Object.keys(updates).length > 0) {
            console.log('📊 Payment complete! Flushing ALL events immediately');
            
            // IMPORTANT: On payment completion, we send EVERYTHING immediately:
            // 1. All buffered events (logged_in, contract_signed, invoice OR balance)
            // 2. The payment event itself
            // This ensures all events are recorded before user can navigate away.
            
            // Mark payment as sent to prevent duplicates
            sentEventsRef.current.add(paymentType);
            
            // Create the payment event
            const paymentEvent = {
              type: paymentType,
              timestamp: new Date().toISOString(),
              data: {
                payment_number: paymentType === 'payment_1' ? 1 : 2,
                session_id: sessionId
              }
            };
            
            // Combine buffered events + payment event into one batch
            const bufferedEvents = [...eventBufferRef.current];
            eventBufferRef.current = []; // Clear buffer
            const allEvents = [...bufferedEvents, paymentEvent];
            
            console.log('📊 Sending all events in one batch:', allEvents.map(e => e.type));
            
            // Send all events together - one API call, one workflow
            sendEvents(allEvents, false).catch(err => {
              console.error('Failed to send events:', err);
            });
            
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
            
          } else {
            console.log('📊 NOT calling trackEvent - paymentType:', paymentType, 'updates empty:', Object.keys(updates).length === 0);
          }
        }
      })
      .catch(err => {
        console.error('Error fetching session status:', err);
        processedSessionRef.current = null;
      });
  }, [sessionId, data?.state?.client_status?.payment_1, data?.state?.client_status?.payment_2, sendEvents]);

  // Memoized emitEvent callback
  const emitEvent = useCallback((name: string, payload?: unknown) => {
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
    }
  }, [trackEvent]);

  // --- Display Logic ---
  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-portfolio-bg-primary">
        <div className="flex flex-col items-center gap-4 animate-fade-in-up">
          <div className="w-12 h-12 border-4 border-portfolio-accent-mauve border-t-transparent rounded-full animate-spin" />
          <p className="text-portfolio-text-secondary text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  // Not found state
  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-portfolio-bg-primary p-4">
        <div className="text-center max-w-md animate-fade-in-up">
          <h1 className="font-agency text-3xl text-portfolio-text-primary mb-3 tracking-wide">Job Not Found</h1>
          <p className="text-portfolio-text-secondary">
            The requested job could not be found. Please check the link and try again.
          </p>
        </div>
      </div>
    );
  }

  // Schema validation
  if (!data.docs || !data.state) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-portfolio-bg-primary p-4">
        <div className="text-center max-w-md p-6 bg-portfolio-bg-dark rounded-xl border border-red-500/30 animate-fade-in-up">
          <h1 className="font-agency text-xl text-red-400 mb-2 tracking-wide">Invalid Job Data</h1>
          <p className="text-portfolio-text-secondary text-sm">
            The job data appears to be incomplete. Please contact support.
          </p>
        </div>
      </div>
    );
  }

  if (!data.state.client_status) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-portfolio-bg-primary p-4">
        <div className="text-center max-w-md p-6 bg-portfolio-bg-dark rounded-xl border border-red-500/30 animate-fade-in-up">
          <h1 className="font-agency text-xl text-red-400 mb-2 tracking-wide">Invalid Job State</h1>
          <p className="text-portfolio-text-secondary text-sm">
            The job state is missing required data. Please contact support.
          </p>
        </div>
      </div>
    );
  }

  const { client_status } = data.state;
  
  let initialSection: 'contract' | 'invoice' | 'payment1' | 'completion1' | 'balance' | 'payment2' | 'completion2' = 'contract';

  // Check session status first
  if (sessionId && sessionStatus) {
    if (sessionStatus === 'complete') {
      if (sessionPaymentNumber === 1) {
        initialSection = 'completion1';
      } else if (sessionPaymentNumber === 2) {
        initialSection = 'completion2';
      } else {
        if (client_status.invoice && !client_status.payment_1) {
          initialSection = 'completion1';
        } else if (client_status.balance && !client_status.payment_2) {
          initialSection = 'completion2';
        }
      }
    } else if (sessionStatus === 'open') {
      if (sessionPaymentNumber === 1 || (client_status.invoice && !client_status.payment_1)) {
        initialSection = 'payment1';
      } else if (sessionPaymentNumber === 2 || (client_status.balance && !client_status.payment_2)) {
        initialSection = 'payment2';
      }
    }
  }

  // State-based routing
  if (initialSection === 'contract') {
    if (client_status.contract_signed && !client_status.invoice) {
      initialSection = 'invoice';
    }
    else if (client_status.invoice && !client_status.payment_1) {
      initialSection = 'payment1';
    }
    else if (client_status.payment_1 && !client_status.balance) {
      // Payment 1 done, but balance not yet acknowledged
      const balanceAvailable = !!(data.price2?.id);
      
      if (balanceAvailable) {
        initialSection = 'balance';
      } else {
        // No second payment needed - go to completion
        if (sessionId && sessionStatus === 'complete' && sessionPaymentNumber === 1) {
          initialSection = 'completion1';
        } else {
          initialSection = 'completion2';
        }
      }
    }
    else if (client_status.balance && !client_status.payment_2) {
      // Balance acknowledged, but payment 2 not yet made
      initialSection = 'payment2';
    }
    else if (client_status.payment_2) {
      initialSection = 'completion2';
    }
  }

  // Function to create checkout session
  // NOTE: We do NOT track payment events here - only on successful return from Stripe
  // This prevents false positives if user abandons checkout or payment fails
  const createCheckoutSession = async (paymentNumber: 1 | 2) => {
    setIsCreatingSession(true);
    try {
      const jobId = window.location.pathname.substring(1);
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
    <div className="min-h-screen text-portfolio-text-primary font-sans" style={{ backgroundColor: 'rgb(31 31 31 / 0.2)' }}>
      {/* Main Content - No header, views handle their own backgrounds */}
      <main>
        {initialSection === 'contract' ? (
          <ContractView 
            data={data}
            emitEvent={emitEvent}
          />
        ) : initialSection === 'invoice' ? (
          clientSecret ? (
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
